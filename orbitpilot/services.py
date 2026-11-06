from __future__ import annotations

import asyncio
import importlib
import ipaddress
import json
import logging
import os
import platform
import socket
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import httpx


class ApiKeyStore:
    SERVICE = "OrbitPilotAI"
    USERNAME = "groq_api_key"

    @classmethod
    def get(cls) -> str | None:
        # Store the key in the current Windows user's Credential Manager.
        try:
            import keyring
            value = keyring.get_password(cls.SERVICE, cls.USERNAME)
            if value:
                return value.strip()
        except Exception:
            pass
        value = os.getenv("GROQ_API_KEY", "").strip()
        return value or None

    @classmethod
    def save(cls, key: str) -> None:
        import keyring
        keyring.set_password(cls.SERVICE, cls.USERNAME, key)
        check = keyring.get_password(cls.SERVICE, cls.USERNAME)
        if check != key:
            raise RuntimeError("Windows Credential Manager could not verify the saved key.")

    @classmethod
    def configured(cls) -> bool:
        return bool(cls.get())


class OrbitAI:
    def __init__(self) -> None:
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    async def validate_key(self, api_key: str) -> None:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                "https://api.groq.com/openai/v1/models",
                headers={"Authorization": f"Bearer {api_key}"},
            )
        if response.status_code == 401:
            raise ValueError("Groq rejected that API key. Check it and try again.")
        if response.status_code >= 400:
            raise ValueError(f"Groq could not verify the key (HTTP {response.status_code}).")

    async def ask(self, message: str, history: list[dict[str, str]] | None = None) -> str:
        api_key = ApiKeyStore.get()
        if not api_key:
            raise RuntimeError("Groq API key not configured. Enter it in the OrbitPilot AI connection window.")

        instructions = (
            "You are Orbit AI, the astronomy assistant inside OrbitPilot AI. "
            "The user's equipment is an iOptron SmartEQ Pro+ (Product 3200, Go2Nova 8408) "
            "and a monochrome ZWO ASI120MM Mini. The mount can be computer-controlled "
            "using the official iOptron ASCOM/Commander driver and can be autoguided via "
            "its ST-4-compatible guide port. The ASI120MM Mini has an ST4 guide output. "
            "PHD2 should handle ST-4 guiding; the camera must be attached to a guide scope "
            "or off-axis guider, and the ST4 cable must connect the camera to the mount. "
            "The user has a manual focus knob. NEVER suggest or expose autofocus or motorised "
            "focuser features. Give clear choices and practical options, normally 3-5 when "
            "the user asks what to observe. Distinguish known catalogue facts from current "
            "visibility, which requires date, time, location and ephemeris/weather data. "
            "Do not invent live sky conditions, camera connections, mount state, or successful "
            "hardware operations. You are advisory only: NEVER claim to have moved the telescope, "
            "started guiding, or controlled hardware unless confirmed by the real ASCOM or PHD2 service. "
            "Every physical slew requires explicit user confirmation in the app. Polar alignment requires "
            "manual adjustment of the mount's physical altitude and azimuth bolts; OrbitPilot can guide but "
            "cannot turn them. The app controls a real telescope only after a real ASCOM connection is confirmed. "
            "Be beginner-friendly and explain technical terms briefly."
        )
        messages: list[dict[str, str]] = [{"role": "system", "content": instructions}]
        for item in (history or [])[-8:]:
            role, content = item.get("role"), item.get("content")
            if role in ("user", "assistant") and isinstance(content, str):
                messages.append({"role": role, "content": content[:3000]})
        messages.append({"role": "user", "content": message[:5000]})

        payload = {"model": self.model, "messages": messages, "max_tokens": 800, "temperature": 0.6}
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            )
        if response.status_code >= 400:
            try:
                detail = response.json().get("error", {}).get("message", response.text)
            except Exception:
                detail = response.text
            raise RuntimeError(f"Groq API returned {response.status_code}: {detail[:500]}")
        data = response.json()
        choices = data.get("choices", [])
        if choices and isinstance(choices[0].get("message", {}).get("content"), str):
            return choices[0]["message"]["content"].strip()
        return "I couldn't produce a response. Please try asking in a different way."

    async def choose_target(self, request: str, candidates: list[dict[str, Any]]) -> dict[str, Any]:
        api_key = ApiKeyStore.get()
        if not api_key:
            raise RuntimeError("Groq API key not configured. Enter it in OrbitPilot AI settings.")
        prompt = (
            "Choose exactly one appropriate object from the supplied visible-candidate list for the user's observing request. "
            "Candidates are computed for the user's local time and horizon. Never invent or alter coordinates. "
            "Return JSON with keys candidate_code and reason. candidate_code must exactly match a candidate code. "
            "If none is appropriate, return {\"candidate_code\": null, \"reason\": \"...\"}.\n\n"
            f"User request: {request}\nVisible candidates: {json.dumps(candidates, ensure_ascii=True)}"
        )
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": "Select an observing target only. Never send telescope movement commands."},
                        {"role": "user", "content": prompt},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2,
                    "max_tokens": 250,
                },
            )
        if response.status_code >= 400:
            raise RuntimeError(f"Groq API returned HTTP {response.status_code}.")
        try:
            selection = json.loads(response.json()["choices"][0]["message"]["content"])
        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as error:
            raise RuntimeError("Groq returned an invalid target selection.") from error
        code = selection.get("candidate_code")
        chosen = next((candidate for candidate in candidates if candidate["code"] == code), None)
        if chosen is None:
            if code is None:
                return {"candidate": None, "reason": str(selection.get("reason", "No suitable target was found."))}
            raise RuntimeError("Groq selected a target that is not in the visible candidate list.")
        return {"candidate": chosen, "reason": str(selection.get("reason", "Selected from visible targets."))}


class _AlpacaAxisRates(list):
    @property
    def Count(self) -> int:
        return len(self)

    def Item(self, index: int) -> Any:
        return self[index - 1]


class _AlpacaTelescope:
    def __init__(self, client: httpx.Client, device_number: int, info: dict[str, Any]) -> None:
        self.client = client
        self.device_number = device_number
        self.info = info
        self.transaction_id = 1
        self.base_path = f"/api/v1/telescope/{device_number}"

    def _request(self, method: str, action: str, **params: Any) -> Any:
        transaction_id = self.transaction_id
        self.transaction_id += 1
        common = {"ClientID": 1, "ClientTransactionID": transaction_id}
        response = (
            self.client.get(f"{self.base_path}/{action}", params={**common, **params})
            if method == "GET"
            else self.client.put(f"{self.base_path}/{action}", data={**common, **params})
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("ErrorNumber"):
            message = payload.get("ErrorMessage") or f"Alpaca error {payload['ErrorNumber']}."
            raise RuntimeError(message)
        if method == "GET" and "Value" not in payload:
            raise RuntimeError(f"The Alpaca telescope returned no value for {action}.")
        return payload.get("Value")

    def _get(self, action: str, **params: Any) -> Any:
        return self._request("GET", action, **params)

    def _put(self, action: str, **params: Any) -> Any:
        return self._request("PUT", action, **params)

    @property
    def Connected(self) -> bool:
        return bool(self._get("connected"))

    @Connected.setter
    def Connected(self, value: bool) -> None:
        self._put("connected", Connected=str(bool(value)).lower())

    @property
    def Description(self) -> str:
        return str(self.info.get("DeviceName") or "Alpaca telescope")

    @property
    def RightAscension(self) -> float:
        return float(self._get("rightascension"))

    @property
    def Declination(self) -> float:
        return float(self._get("declination"))

    @property
    def Altitude(self) -> float:
        return float(self._get("altitude"))

    @property
    def Azimuth(self) -> float:
        return float(self._get("azimuth"))

    @property
    def Tracking(self) -> bool:
        return bool(self._get("tracking"))

    @Tracking.setter
    def Tracking(self, value: bool) -> None:
        self._put("tracking", Tracking=str(bool(value)).lower())

    @property
    def Slewing(self) -> bool:
        return bool(self._get("slewing"))

    @property
    def CanFindHome(self) -> bool:
        return bool(self._get("canfindhome"))

    @property
    def CanSlew(self) -> bool:
        return bool(self._get("canslew"))

    @property
    def CanSlewAsync(self) -> bool:
        return bool(self._get("canslewasync"))

    def CanMoveAxis(self, axis: int) -> bool:
        return bool(self._get("canmoveaxis", Axis=axis))

    def AxisRates(self, axis: int) -> list[Any]:
        ranges = self._get("axisrates", Axis=axis)
        if not isinstance(ranges, list):
            raise RuntimeError(f"The Alpaca telescope returned invalid axis rates for axis {axis}.")
        return _AlpacaAxisRates(
            SimpleNamespace(
                Minimum=float(rate.get("Minimum", rate.get("minimum", 0))),
                Maximum=float(rate.get("Maximum", rate.get("maximum", 0))),
            )
            for rate in ranges
        )

    def MoveAxis(self, axis: int, rate: float) -> None:
        self._put("moveaxis", Axis=axis, Rate=rate)

    def AbortSlew(self) -> None:
        self._put("abortslew")

    def SlewToCoordinatesAsync(self, ra: float, dec: float) -> None:
        self._put("slewtocoordinatesasync", RightAscension=ra, Declination=dec)

    def SlewToCoordinates(self, ra: float, dec: float) -> None:
        self._put("slewtocoordinates", RightAscension=ra, Declination=dec)

    def FindHome(self) -> None:
        self._put("findhome")


class MountService:
    """ASCOM COM access is kept on one dedicated Windows STA thread."""

    def __init__(self) -> None:
        self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="OrbitPilot-ASCOM")
        self._scope: Any = None
        self._mode = "ascom"
        self._motion_lock = threading.Lock()
        self._motion_timers: dict[int, threading.Timer] = {}
        self._com_thread_state = threading.local()
        self._active_axes: set[int] = set()
        self._alpaca_client: httpx.Client | None = None
        self._alpaca_device_info: dict[str, Any] | None = None
        self._visual_state: dict[str, Any] | None = None
        self._visual_lock = threading.Lock()

    def _com_call(self, fn):
        def wrapped():
            import pythoncom  # type: ignore
            if not getattr(self._com_thread_state, "initialized", False):
                pythoncom.CoInitialize()
                self._com_thread_state.initialized = True
            return fn()
        return self._executor.submit(wrapped)

    @staticmethod
    def _set_system_awake(required: bool) -> None:
        if os.name != "nt":
            return
        import ctypes

        flags = 0x80000000 | (0x00000001 if required else 0)
        set_execution_state = ctypes.windll.kernel32.SetThreadExecutionState
        set_execution_state.argtypes = [ctypes.c_uint]
        set_execution_state.restype = ctypes.c_uint
        if not set_execution_state(flags):
            raise ctypes.WinError(ctypes.get_last_error())

    async def connect(
        self,
        mode: str,
        host: str = "127.0.0.1",
        port: int = 11111,
        device_number: int = 0,
    ) -> dict[str, Any]:
        if self.status().get("connected"):
            raise RuntimeError("Disconnect the current telescope before selecting another driver.")
        if mode == "visual":
            with self._visual_lock:
                self._scope = None
                if self._alpaca_client:
                    self._alpaca_client.close()
                    self._alpaca_client = None
                    self._alpaca_device_info = None
                self._mode = "visual"
                self._visual_state = {
                    "rightAscension": 2.0,
                    "declination": 25.0,
                    "altitude": 25.0,
                    "azimuth": 30.0,
                    "tracking": False,
                    "slewing": False,
                    "axisRates": {0: 0.0, 1: 0.0},
                    "lastUpdated": time.monotonic(),
                    "slew": None,
                }
            return {
                "connected": True,
                "mode": "visual",
                "driver": "OrbitPilot built-in visual simulator",
                "message": "Built-in software-only simulator connected. No hardware commands are sent.",
            }
        if mode == "alpaca":
            return await self._connect_alpaca(host, port, device_number)
        if mode != "ascom":
            raise ValueError("Choose an ASCOM telescope, local Alpaca simulator, or built-in visual simulator.")
        if platform.system() != "Windows":
            raise RuntimeError("ASCOM COM telescope control is available only on Windows.")

        def do_connect():
            import win32com.client  # type: ignore
            chooser = win32com.client.Dispatch("ASCOM.Utilities.Chooser")
            chooser.DeviceType = "Telescope"
            driver_id = chooser.Choose("")
            if not driver_id:
                raise RuntimeError("ASCOM driver selection was cancelled.")
            scope = win32com.client.Dispatch(driver_id)
            scope.Connected = True
            if not bool(scope.Connected):
                raise RuntimeError("The ASCOM driver did not confirm a connection.")
            self._scope = scope
            self._mode = "ascom"
            return str(driver_id)

        driver_id = await asyncio.wrap_future(self._com_call(do_connect))
        return {"connected": True, "mode": "ascom", "driver": driver_id, "message": "ASCOM driver reports connected."}

    async def _connect_alpaca(self, host: str, port: int, device_number: int) -> dict[str, Any]:
        try:
            address = ipaddress.ip_address(socket.gethostbyname(host))
        except (OSError, ValueError) as exc:
            raise ValueError("Enter a valid local Alpaca simulator address.") from exc
        if not address.is_loopback:
            raise ValueError("The Alpaca simulator connection is restricted to this PC (localhost).")
        base_url = f"http://{address.compressed}:{port}"

        def do_connect():
            client = httpx.Client(base_url=base_url, timeout=3.0)
            try:
                response = client.get(
                    f"/api/v1/telescope/{device_number}/description",
                    params={"ClientID": 1, "ClientTransactionID": 1},
                )
                response.raise_for_status()
                payload = response.json()
                if payload.get("ErrorNumber"):
                    raise RuntimeError(payload.get("ErrorMessage") or "Alpaca telescope check failed.")
                if "Value" not in payload:
                    raise RuntimeError("The Alpaca server returned an invalid telescope description.")
                device_info = {"DeviceName": payload["Value"]}
                scope = _AlpacaTelescope(client, device_number, device_info)
                scope.Connected = True
                if not scope.Connected:
                    raise RuntimeError("The Alpaca telescope did not confirm a connection.")
                previous_client = self._alpaca_client
                self._alpaca_client = client
                self._alpaca_device_info = device_info
                self._scope = scope
                self._mode = "alpaca"
                if previous_client:
                    previous_client.close()
                return str(device_info.get("DeviceName") or "Alpaca telescope")
            except Exception:
                client.close()
                raise

        driver = await asyncio.wrap_future(self._com_call(do_connect))
        return {
            "connected": True,
            "mode": "alpaca",
            "driver": driver,
            "message": "Connected to the localhost Alpaca telescope simulator. Motion is software-only.",
        }

    def _read_real_status(self) -> dict[str, Any]:
        if self._scope is None:
            return {"connected": False, "mode": self._mode, "driver": None, "canSlew": False, "axes": {}}
        scope = self._scope
        try:
            connected = bool(scope.Connected)
            if not connected:
                return {"connected": False, "mode": self._mode, "driver": "Telescope driver"}
            def safe(name):
                try:
                    return getattr(scope, name)
                except Exception:
                    return None
            axes = {}
            for axis in (0, 1):
                try:
                    can_move = bool(scope.CanMoveAxis(axis))
                except Exception:
                    can_move = False
                ranges = []
                if can_move:
                    try:
                        supported_rates = scope.AxisRates(axis)
                        for index in range(1, int(supported_rates.Count) + 1):
                            rate_range = supported_rates.Item(index)
                            ranges.append({"minimum": float(rate_range.Minimum), "maximum": float(rate_range.Maximum)})
                    except Exception:
                        can_move = False
                        ranges = []
                axes[str(axis)] = {"canMove": can_move, "rates": ranges}
            return {
                "connected": True,
                "mode": self._mode,
                "driver": safe("Description") or "ASCOM telescope driver",
                "rightAscension": safe("RightAscension"),
                "declination": safe("Declination"),
                "altitude": safe("Altitude"),
                "azimuth": safe("Azimuth"),
                "tracking": safe("Tracking"),
                "slewing": safe("Slewing"),
                "canFindHome": safe("CanFindHome"),
                "canSlew": safe("CanSlew"),
                "axes": axes,
            }
        except Exception as exc:
            return {"connected": False, "mode": self._mode, "error": str(exc)}

    def _tick_visual_locked(self) -> dict[str, Any]:
        state = self._visual_state
        if state is None:
            raise RuntimeError("The built-in visual simulator is not connected.")
        now = time.monotonic()
        elapsed = min(max(now - state["lastUpdated"], 0.0), 2.0)
        state["lastUpdated"] = now

        slew = state["slew"]
        if slew:
            progress = min((now - slew["started"]) / slew["duration"], 1.0)
            state["rightAscension"] = slew["startRA"] + (slew["targetRA"] - slew["startRA"]) * progress
            state["declination"] = slew["startDEC"] + (slew["targetDEC"] - slew["startDEC"]) * progress
            state["altitude"] = slew["startAltitude"] + (slew["targetAltitude"] - slew["startAltitude"]) * progress
            state["azimuth"] = (
                slew["startAzimuth"] + slew["azimuthDelta"] * progress
            ) % 360
            state["slewing"] = progress < 1.0
            if progress >= 1.0:
                state["slew"] = None
        else:
            state["azimuth"] = (state["azimuth"] + state["axisRates"][0] * elapsed) % 360
            state["altitude"] = max(-90.0, min(90.0, state["altitude"] + state["axisRates"][1] * elapsed))
            state["rightAscension"] = state["azimuth"] / 15
            state["declination"] = state["altitude"]

        return {
            "connected": True,
            "mode": "visual",
            "driver": "OrbitPilot built-in visual simulator",
            "rightAscension": state["rightAscension"],
            "declination": state["declination"],
            "altitude": state["altitude"],
            "azimuth": state["azimuth"],
            "tracking": state["tracking"],
            "slewing": state["slewing"],
            "canFindHome": True,
            "canSlew": True,
            "axes": {
                str(axis): {
                    "canMove": True,
                    "rates": [{"minimum": 0.05, "maximum": 0.5}],
                }
                for axis in (0, 1)
            },
            "simulator": True,
            "visualTestReady": True,
        }

    def _start_visual_slew_locked(self, ra: float, dec: float) -> None:
        state = self._visual_state
        if state is None:
            raise RuntimeError("The built-in visual simulator is not connected.")
        current_azimuth = state["azimuth"]
        target_azimuth = (ra * 15) % 360
        azimuth_delta = (target_azimuth - current_azimuth + 180) % 360 - 180
        state["slew"] = {
            "started": time.monotonic(),
            "duration": 3.5,
            "startRA": state["rightAscension"],
            "startDEC": state["declination"],
            "targetRA": ra,
            "targetDEC": dec,
            "startAltitude": state["altitude"],
            "targetAltitude": dec,
            "startAzimuth": current_azimuth,
            "azimuthDelta": azimuth_delta,
        }
        state["slewing"] = True
        state["axisRates"] = {0: 0.0, 1: 0.0}
        self._active_axes.clear()

    def status(self) -> dict[str, Any]:
        if self._mode == "visual":
            with self._visual_lock:
                if self._visual_state is None:
                    return {"connected": False, "mode": "visual", "driver": "OrbitPilot built-in visual simulator", "canSlew": True, "axes": {}}
                return self._tick_visual_locked()
        future = self._com_call(self._read_real_status)
        try:
            return future.result(timeout=5)
        except Exception as exc:
            return {"connected": False, "mode": self._mode, "error": str(exc)}

    async def disconnect(self) -> dict[str, Any]:
        self._cancel_motion_timers()
        def do_disconnect():
            if self._mode == "visual":
                with self._visual_lock:
                    self._visual_state = None
                self._active_axes.clear()
                return {"connected": False, "mode": "visual"}
            if self._scope is not None:
                try:
                    for axis in (0, 1):
                        try:
                            if bool(self._scope.CanMoveAxis(axis)):
                                self._scope.MoveAxis(axis, 0.0)
                        except Exception:
                            pass
                    self._scope.Connected = False
                finally:
                    self._scope = None
            self._active_axes.clear()
            self._set_system_awake(False)
            if self._alpaca_client:
                self._alpaca_client.close()
                self._alpaca_client = None
                self._alpaca_device_info = None
            return {"connected": False, "mode": self._mode}
        result = await asyncio.wrap_future(self._com_call(do_disconnect))
        return result

    async def stop(self) -> dict[str, Any]:
        self._cancel_motion_timers()
        if self._mode == "visual":
            with self._visual_lock:
                state = self._visual_state
                if state is None:
                    raise RuntimeError("The visual simulator is not connected.")
                self._tick_visual_locked()
                state["slew"] = None
                state["slewing"] = False
                state["axisRates"] = {0: 0.0, 1: 0.0}
                return {"ok": True, "mode": "visual", "message": "Visual test movement stopped."}
        def do_stop():
            if self._scope is None or not bool(self._scope.Connected):
                raise RuntimeError("Telescope is not connected.")
            self._scope.AbortSlew()
            stopped_axes = []
            for axis in (0, 1):
                if bool(self._scope.CanMoveAxis(axis)):
                    self._scope.MoveAxis(axis, 0.0)
                    stopped_axes.append(axis)
            self._active_axes.clear()
            self._set_system_awake(False)
            return {"ok": True, "message": f"AbortSlew sent; manual motion stopped on axes {stopped_axes}."}
        return await asyncio.wrap_future(self._com_call(do_stop))

    async def tracking(self, enabled: bool) -> dict[str, Any]:
        if self._mode == "visual":
            with self._visual_lock:
                if self._visual_state is None:
                    raise RuntimeError("The visual simulator is not connected.")
                self._visual_state["tracking"] = bool(enabled)
                return {"ok": True, "tracking": bool(enabled), "mode": "visual"}
        def do_tracking():
            if self._scope is None or not bool(self._scope.Connected):
                raise RuntimeError("Telescope is not connected.")
            self._scope.Tracking = bool(enabled)
            actual = bool(self._scope.Tracking)
            return {"ok": True, "tracking": actual, "mode": self._mode}
        return await asyncio.wrap_future(self._com_call(do_tracking))

    async def slew(self, ra: float, dec: float) -> dict[str, Any]:
        if not (0 <= ra < 24 and -90 <= dec <= 90):
            raise ValueError("RA must be 0–24 hours and declination must be −90° to +90°.")
        if self._mode == "visual":
            with self._visual_lock:
                self._start_visual_slew_locked(float(ra), float(dec))
            return {"ok": True, "mode": "visual", "message": "Software-only visual slew started; no hardware is connected."}
        def do_slew():
            scope = self._scope
            if scope is None or not bool(scope.Connected):
                raise RuntimeError("Telescope is not connected.")
            if not bool(scope.CanSlew):
                raise RuntimeError("The connected driver reports that slewing is unavailable.")
            try:
                if bool(scope.CanSlewAsync):
                    scope.SlewToCoordinatesAsync(float(ra), float(dec))
                else:
                    scope.SlewToCoordinates(float(ra), float(dec))
            except Exception as exc:
                raise RuntimeError(f"ASCOM slew failed: {exc}") from exc
            return {"ok": True, "mode": self._mode, "message": f"Slew command accepted by {self._mode.upper()} driver. Check the telescope status before assuming it has arrived."}
        return await asyncio.wrap_future(self._com_call(do_slew))

    async def zero(self) -> dict[str, Any]:
        if self._mode == "visual":
            with self._visual_lock:
                self._start_visual_slew_locked(0.0, 0.0)
            return {"ok": True, "mode": "visual", "message": "Software-only return-to-zero animation started."}
        def do_zero():
            scope = self._scope
            if scope is None or not bool(scope.Connected):
                raise RuntimeError("Telescope is not connected.")
            try:
                can_find_home = bool(scope.CanFindHome)
            except Exception:
                can_find_home = False
            if not can_find_home:
                raise RuntimeError(f"This {self._mode.upper()} driver does not advertise FindHome. Use the mount's documented Zero Position procedure.")
            scope.FindHome()
            return {"ok": True, "mode": self._mode, "message": "FindHome command accepted. Verify the telescope has completed its documented Zero Position movement."}
        return await asyncio.wrap_future(self._com_call(do_zero))

    def _cancel_motion_timers(self) -> None:
        with self._motion_lock:
            timers = list(self._motion_timers.values())
            self._motion_timers.clear()
        for timer in timers:
            timer.cancel()

    def _arm_motion_watchdog(self, axis: int) -> None:
        with self._motion_lock:
            previous = self._motion_timers.pop(axis, None)
            if previous:
                previous.cancel()
            timer = threading.Timer(1.5, self._stop_axis_after_timeout, args=(axis,))
            timer.daemon = True
            self._motion_timers[axis] = timer
            timer.start()

    def _stop_axis_after_timeout(self, axis: int) -> None:
        with self._motion_lock:
            if self._motion_timers.get(axis) is not threading.current_thread():
                return
            self._motion_timers.pop(axis, None)
        try:
            if self._mode == "visual":
                with self._visual_lock:
                    if self._visual_state is not None:
                        self._visual_state["axisRates"][axis] = 0.0
                self._active_axes.discard(axis)
                return
            def do_stop():
                if self._scope is not None and bool(self._scope.Connected) and bool(self._scope.CanMoveAxis(axis)):
                    self._scope.MoveAxis(axis, 0.0)
                self._active_axes.discard(axis)
                if not self._active_axes:
                    self._set_system_awake(False)
            self._com_call(do_stop).result(timeout=5)
        except Exception:
            logging.getLogger("orbitpilot").exception("Watchdog could not stop ASCOM axis %s", axis)
            return

    async def move_axis(self, axis: int, rate: float) -> dict[str, Any]:
        if axis not in (0, 1):
            raise ValueError("Only ASCOM primary (0) and secondary (1) axes are supported.")
        if not -0.5 <= rate <= 0.5:
            raise ValueError("Manual axis rate must be between -0.5 and +0.5 degrees per second.")

        if self._mode == "visual":
            with self._visual_lock:
                if self._visual_state is None:
                    raise RuntimeError("The visual simulator is not connected.")
                if rate and not 0.05 <= abs(rate) <= 0.5:
                    raise RuntimeError("The visual simulator supports movement rates from 0.05 to 0.5 degrees/second.")
                self._tick_visual_locked()
                self._visual_state["axisRates"][axis] = rate
                if rate:
                    self._active_axes.add(axis)
                else:
                    self._active_axes.discard(axis)
                result = {"ok": True, "mode": "visual", "axis": axis, "rate": rate, "moving": rate != 0}
            if rate:
                self._arm_motion_watchdog(axis)
            else:
                with self._motion_lock:
                    timer = self._motion_timers.pop(axis, None)
                if timer:
                    timer.cancel()
            return result

        def do_move():
            scope = self._scope
            if scope is None or not bool(scope.Connected):
                raise RuntimeError("Connect the telescope through its ASCOM driver before moving.")
            if not bool(scope.CanMoveAxis(axis)):
                raise RuntimeError(f"The connected driver does not support movement on axis {axis}.")
            if rate:
                rates = scope.AxisRates(axis)
                supported = any(
                    float(rates.Item(index).Minimum) <= abs(rate) <= float(rates.Item(index).Maximum)
                    for index in range(1, int(rates.Count) + 1)
                )
                if not supported:
                    raise RuntimeError(f"The driver does not advertise {abs(rate):g} degrees/second for axis {axis}.")
            if rate and not self._active_axes:
                self._set_system_awake(True)
            try:
                scope.MoveAxis(axis, rate)
            except Exception:
                if rate and not self._active_axes:
                    self._set_system_awake(False)
                raise
            if rate:
                self._active_axes.add(axis)
            else:
                self._active_axes.discard(axis)
                if not self._active_axes:
                    self._set_system_awake(False)
            return {"ok": True, "mode": self._mode, "axis": axis, "rate": rate, "moving": rate != 0}

        result = await asyncio.wrap_future(self._com_call(do_move))
        if rate:
            self._arm_motion_watchdog(axis)
        else:
            with self._motion_lock:
                timer = self._motion_timers.pop(axis, None)
            if timer:
                timer.cancel()
        return result

    async def run_visual_test(self) -> dict[str, Any]:
        current = self.status()
        if current.get("connected") and current.get("mode") != "visual":
            raise RuntimeError("Disconnect the physical mount or external Alpaca simulator before running the built-in visual test.")
        if not current.get("connected"):
            await self.connect("visual")
        self._cancel_motion_timers()
        result = await self.slew(6.5, 48.0)
        return {
            "ok": True,
            "mode": "visual",
            "message": "Visual test started: the software-only telescope is slewing to its demo position.",
            "slew": result,
        }


class Phd2Client:
    def __init__(self, host: str = "127.0.0.1", port: int = 4400) -> None:
        self.host = host
        self.port = port
        self._next_id = 1

    async def call(self, method: str, params: list[Any] | None = None, timeout: float = 8) -> Any:
        request_id = self._next_id
        self._next_id += 1
        payload = {"jsonrpc": "2.0", "method": method, "params": params or [], "id": request_id}
        try:
            reader, writer = await asyncio.wait_for(asyncio.open_connection(self.host, self.port), timeout=timeout)
            writer.write((json.dumps(payload) + "\r\n").encode("utf-8"))
            await writer.drain()
            line = await asyncio.wait_for(reader.readline(), timeout=timeout)
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass
            if not line:
                raise RuntimeError("PHD2 closed the connection without replying.")
            response = json.loads(line.decode("utf-8", errors="replace"))
            if response.get("error"):
                raise RuntimeError(response["error"].get("message", "PHD2 returned an error."))
            return response.get("result")
        except (OSError, asyncio.TimeoutError) as exc:
            raise RuntimeError("Cannot reach PHD2 at 127.0.0.1:4400. Open PHD2 and enable Tools → Enable Server.") from exc

    async def status(self) -> dict[str, Any]:
        try:
            state = await self.call("get_app_state")
            connected = await self.call("get_connected")
            equipment = await self.call("get_current_equipment")
            return {"available": True, "state": state, "equipmentConnected": connected, "equipment": equipment}
        except Exception as exc:
            return {"available": False, "state": "Not connected", "error": str(exc)}

    async def start_guiding(self) -> dict[str, Any]:
        connected = await self.call("get_connected")
        if not connected:
            raise RuntimeError("PHD2 reports that its equipment is not connected. Connect the ASI120MM Mini and select the On-camera mount for ST-4 guiding in PHD2 first.")
        # PHD2's guide method performs the required select/calibrate/settle sequence.
        result = await self.call("guide", [{"pixels": 1.5, "time": 10, "timeout": 60}, False], timeout=10)
        return {"ok": True, "result": result, "message": "Guide request sent to PHD2. Watch its state; calibration and settling may take time."}

    async def stop_guiding(self) -> dict[str, Any]:
        result = await self.call("stop_capture")
        return {"ok": True, "result": result, "message": "Stop request sent to PHD2."}


class CameraService:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._sdk: Any = None
        self._camera: Any = None
        self._camera_name = ""
        self._exposure_ms = 100.0
        self._gain = 0
        self._capture_dir = Path.home() / "Pictures" / "OrbitPilotAI" / "Captures"

    def _load_sdk(self) -> Any:
        if self._sdk is None:
            try:
                self._sdk = importlib.import_module("pyzwoasi")
            except Exception as exc:
                raise RuntimeError(
                    "The ZWO camera SDK is unavailable. Install the OrbitPilotAI camera dependencies "
                    "and the official ZWO Windows camera driver."
                ) from exc
        return self._sdk

    @staticmethod
    def _control_limits(camera: Any, name: str) -> tuple[int, int]:
        try:
            return int(camera._dictControlMin[name]), int(camera._dictControlMax[name])
        except KeyError as exc:
            raise RuntimeError(f"This camera does not provide a writable {name} control.") from exc

    def _open_camera(self) -> Any:
        if self._camera is not None:
            return self._camera
        sdk = self._load_sdk()
        count = int(sdk.getNumOfConnectedCameras())
        if count < 1:
            raise RuntimeError(
                "No ZWO ASI camera was detected. Connect the camera and install the official ZWO USB driver. "
                "Close PHD2 before connecting here if it already owns the camera."
            )
        camera = None
        try:
            camera = sdk.ZWOCamera(0)
            supported_types = {int(value) for value in camera._supportedVideoFormat}
            image_types = sdk.pyzwoasi.ASIImageType
            if int(image_types.ASI_IMG_RAW16) in supported_types:
                camera.imageType = image_types.ASI_IMG_RAW16
            elif int(image_types.ASI_IMG_Y8) in supported_types:
                camera.imageType = image_types.ASI_IMG_Y8
            elif int(image_types.ASI_IMG_RAW8) in supported_types:
                camera.imageType = image_types.ASI_IMG_RAW8

            exposure_min, exposure_max = self._control_limits(camera, "Exposure")
            gain_min, _ = self._control_limits(camera, "Gain")
            exposure_ms = min(max(self._exposure_ms * 1000, exposure_min), exposure_max) / 1000
            camera.exposure = int(exposure_ms * 1000)
            camera.gain = gain_min
        except Exception as exc:
            if camera is not None:
                try:
                    camera.close()
                except Exception:
                    logging.getLogger("orbitpilot").exception("Could not close ZWO camera after initialization failure")
            raise RuntimeError(
                f"Could not open the ZWO camera. Check its USB connection and driver, and close other camera apps: {exc}"
            ) from exc

        self._camera = camera
        self._camera_name = camera._name
        self._exposure_ms = exposure_ms
        self._gain = gain_min
        return camera

    def _status_locked(self) -> dict[str, Any]:
        sdk = self._load_sdk()
        count = int(sdk.getNumOfConnectedCameras())
        camera = self._camera
        return {
            "sdk": "pyzwoasi",
            "sdkLoaded": True,
            "connected": count > 0,
            "cameraCount": count,
            "captureConnected": camera is not None,
            "cameraName": self._camera_name or None,
            "expectedCamera": "ZWO ASI120MM Mini",
            "controls": self._controls_locked() if camera is not None else None,
            "capability": (
                "Live preview and FITS capture are ready."
                if camera is not None
                else "Connect the camera in Camera Studio to start live preview and FITS capture."
                if count > 0
                else "Install the official ZWO Windows camera driver and connect an ASI camera."
            ),
        }

    def _controls_locked(self) -> dict[str, Any]:
        camera = self._camera
        if camera is None:
            return {}
        exposure_min, exposure_max = self._control_limits(camera, "Exposure")
        gain_min, gain_max = self._control_limits(camera, "Gain")
        return {
            "exposureMs": self._exposure_ms,
            "exposureMinMs": exposure_min / 1000,
            "exposureMaxMs": exposure_max / 1000,
            "gain": self._gain,
            "gainMin": gain_min,
            "gainMax": gain_max,
            "width": int(camera.size[0]),
            "height": int(camera.size[1]),
            "bitDepth": 16 if int(camera.imageType) == 2 else 8,
        }

    def status(self) -> dict[str, Any]:
        with self._lock:
            try:
                return self._status_locked()
            except Exception as exc:
                return {
                    "sdk": "pyzwoasi",
                    "sdkLoaded": False,
                    "connected": False,
                    "cameraCount": 0,
                    "captureConnected": False,
                    "expectedCamera": "ZWO ASI120MM Mini",
                    "error": str(exc),
                    "capability": "Install the official ZWO Windows camera driver and camera SDK.",
                }

    def connect(self) -> dict[str, Any]:
        with self._lock:
            self._open_camera()
            return self._status_locked()

    def disconnect(self) -> dict[str, Any]:
        with self._lock:
            if self._camera is not None:
                try:
                    self._camera.close()
                finally:
                    self._camera = None
                    self._camera_name = ""
            return {"ok": True, "captureConnected": False, "message": "Camera released."}

    def set_controls(self, exposure_ms: float, gain: int) -> dict[str, Any]:
        with self._lock:
            camera = self._open_camera()
            exposure_min, exposure_max = self._control_limits(camera, "Exposure")
            gain_min, gain_max = self._control_limits(camera, "Gain")
            exposure_us = round(exposure_ms * 1000)
            if not exposure_min <= exposure_us <= exposure_max:
                raise ValueError(f"Exposure must be between {exposure_min / 1000:g} and {exposure_max / 1000:g} ms.")
            if not gain_min <= gain <= gain_max:
                raise ValueError(f"Gain must be between {gain_min} and {gain_max}.")
            camera.exposure = exposure_us
            camera.gain = gain
            self._exposure_ms = exposure_us / 1000
            self._gain = gain
            return self._controls_locked()

    def _capture_frame_locked(self) -> Any:
        import numpy as np

        camera = self._open_camera()
        sdk = self._sdk.pyzwoasi
        status = sdk.ASIExposureStatus
        camera_id = camera._cameraIndex
        started = False
        try:
            sdk.startExposure(camera_id, False)
            started = True
            deadline = time.monotonic() + self._exposure_ms / 1000 + 15
            while True:
                exposure_status = sdk.getExpStatus(camera_id)
                if exposure_status == status.ASI_EXP_SUCCESS:
                    break
                if exposure_status == status.ASI_EXP_FAILED:
                    raise RuntimeError("The ZWO camera reported a failed exposure.")
                if exposure_status != status.ASI_EXP_WORKING:
                    raise RuntimeError(f"The ZWO camera returned unexpected exposure status {exposure_status}.")
                if time.monotonic() >= deadline:
                    raise TimeoutError("The ZWO camera exposure timed out.")
                time.sleep(0.01)
            sdk.stopExposure(camera_id)
            started = False
            image_data = sdk.getDataAfterExp(camera_id, camera.bufferSize)
        finally:
            if started:
                try:
                    sdk.stopExposure(camera_id)
                except Exception:
                    logging.getLogger("orbitpilot").exception("Could not stop failed ZWO exposure")

        width, height = (int(value) for value in camera.size)
        image_type = int(camera.imageType)
        if image_type == 2:
            return np.frombuffer(image_data, dtype=np.uint16).reshape(height, width).copy()
        if image_type in (0, 3):
            return np.frombuffer(image_data, dtype=np.uint8).reshape(height, width).copy()
        if image_type == 1:
            return np.frombuffer(image_data, dtype=np.uint8).reshape(height, width, 3).copy()
        raise RuntimeError(f"Unsupported ZWO image format {image_type}.")

    def preview_jpeg(self) -> bytes:
        import cv2
        import numpy as np

        with self._lock:
            frame = self._capture_frame_locked()
            low, high = (float(value) for value in np.percentile(frame, (1, 99.8)))
            if high <= low:
                high = low + 1
            preview = np.clip((frame.astype(np.float32) - low) * (255 / (high - low)), 0, 255).astype(np.uint8)
            if preview.ndim == 2:
                preview = cv2.cvtColor(preview, cv2.COLOR_GRAY2BGR)
            else:
                preview = cv2.cvtColor(preview, cv2.COLOR_RGB2BGR)
            encoded, data = cv2.imencode(".jpg", preview, [cv2.IMWRITE_JPEG_QUALITY, 88])
            if not encoded:
                raise RuntimeError("Could not encode the camera preview image.")
            return data.tobytes()

    def capture_fits(self) -> dict[str, Any]:
        from astropy.io import fits

        with self._lock:
            frame = self._capture_frame_locked()
            camera = self._camera
            self._capture_dir.mkdir(parents=True, exist_ok=True)
            captured = datetime.now(timezone.utc)
            filename = f"OrbitPilotAI_{captured.strftime('%Y%m%d_%H%M%S_%f')}.fits"
            path = self._capture_dir / filename
            header = fits.Header()
            header["DATE-OBS"] = captured.isoformat()
            header["EXPTIME"] = self._exposure_ms / 1000
            header["GAIN"] = self._gain
            header["INSTRUME"] = self._camera_name
            fits.PrimaryHDU(frame, header=header).writeto(path, overwrite=False)
            return {
                "ok": True,
                "filename": filename,
                "path": str(path),
                "width": int(camera.size[0]),
                "height": int(camera.size[1]),
                "exposureSeconds": self._exposure_ms / 1000,
                "gain": self._gain,
            }
