from __future__ import annotations

import asyncio
import base64
import binascii
import json
import os
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .services import ApiKeyStore, CameraService, MountService, OrbitAI, Phd2Client

BASE = Path(__file__).resolve().parent
app = FastAPI(title="OrbitPilot AI", version="0.1.0", docs_url=None, redoc_url=None)
app.mount("/static", StaticFiles(directory=BASE / "static"), name="static")
mount = MountService()
ai = OrbitAI()
camera = CameraService()
phd2 = Phd2Client()
ACCOUNT_CONFIG_PATH = Path(
    os.environ.get("LOCALAPPDATA") or os.environ.get("APPDATA") or Path.home()
) / "OrbitPilotAI" / "account-config.json"


class ConnectRequest(BaseModel):
    mode: str = Field(pattern="^(ascom|alpaca|visual)$")
    host: str = Field(default="127.0.0.1", min_length=1, max_length=253)
    port: int = Field(default=11111, ge=1, le=65535)
    device_number: int = Field(default=0, ge=0, le=65535)


class SlewRequest(BaseModel):
    ra: float = Field(ge=0, lt=24)
    dec: float = Field(ge=-90, le=90)
    confirmed: bool = False


class TrackingRequest(BaseModel):
    enabled: bool


class MoveAxisRequest(BaseModel):
    axis: int = Field(ge=0, le=1)
    rate: float = Field(ge=-0.5, le=0.5)


class CameraControlsRequest(BaseModel):
    exposure_ms: float = Field(ge=0.001, le=300000)
    gain: int = Field(ge=0, le=600)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)
    history: list[dict[str, str]] = Field(default_factory=list)


class ApiKeyRequest(BaseModel):
    api_key: str = Field(min_length=20, max_length=300)


class AccountConfigRequest(BaseModel):
    project_url: str = Field(min_length=8, max_length=300)
    publishable_key: str = Field(min_length=20, max_length=600)


class TargetCandidate(BaseModel):
    code: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=160)
    type: str = Field(min_length=1, max_length=40)
    raH: float = Field(ge=0, lt=24)
    decD: float = Field(ge=-90, le=90)
    alt: float = Field(gt=0, le=90)
    az: float = Field(ge=0, lt=360)


class TargetPlanRequest(BaseModel):
    request: str = Field(min_length=3, max_length=600)
    candidates: list[TargetCandidate] = Field(min_length=1, max_length=100)


def account_config() -> dict[str, str]:
    project_url = os.environ.get("SUPABASE_URL", "").strip()
    publishable_key = os.environ.get("SUPABASE_ANON_KEY", "").strip()
    if bool(project_url) != bool(publishable_key):
        raise HTTPException(status_code=500, detail="Both Supabase account environment variables must be configured together.")
    if project_url and publishable_key:
        source = "environment"
    else:
        if not ACCOUNT_CONFIG_PATH.is_file():
            return {"project_url": "", "publishable_key": "", "source": "none"}
        try:
            config = json.loads(ACCOUNT_CONFIG_PATH.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise HTTPException(status_code=500, detail="Could not read the saved account configuration.") from exc
        if not isinstance(config, dict):
            raise HTTPException(status_code=500, detail="The saved account configuration has an invalid format.")
        project_url = str(config.get("project_url", "")).strip()
        publishable_key = str(config.get("publishable_key", "")).strip()
        if not project_url and not publishable_key:
            return {"project_url": "", "publishable_key": "", "source": "none"}
        if not project_url or not publishable_key:
            raise HTTPException(status_code=500, detail="The saved account configuration is incomplete.")
        source = "saved"

    try:
        project_url, publishable_key = validate_account_config(project_url, publishable_key)
    except HTTPException as exc:
        raise HTTPException(status_code=500, detail="The saved Supabase configuration is invalid. Review Settings.") from exc
    return {"project_url": project_url, "publishable_key": publishable_key, "source": source}


def validate_account_config(project_url: str, publishable_key: str) -> tuple[str, str]:
    project_url = project_url.strip().rstrip("/")
    publishable_key = publishable_key.strip()
    parsed_url = urlparse(project_url)
    if (
        parsed_url.scheme not in ("https", "http")
        or not parsed_url.hostname
        or parsed_url.username
        or parsed_url.password
        or parsed_url.query
        or parsed_url.fragment
        or (parsed_url.scheme == "http" and parsed_url.hostname not in ("localhost", "127.0.0.1"))
    ):
        raise HTTPException(
            status_code=400,
            detail="Use an HTTPS Supabase project URL (HTTP is allowed only for localhost development).",
        )
    if not publishable_key.startswith(("sb_publishable_", "eyJ")) or publishable_key.startswith("sb_secret_"):
        raise HTTPException(
            status_code=400,
            detail="Use the Supabase publishable/anon key, never a secret or service-role key.",
        )
    if publishable_key.startswith("eyJ"):
        try:
            payload = publishable_key.split(".")[1]
            payload += "=" * (-len(payload) % 4)
            claims = json.loads(base64.urlsafe_b64decode(payload))
        except (IndexError, ValueError, binascii.Error) as exc:
            raise HTTPException(status_code=400, detail="The Supabase anon key is not a valid JWT.") from exc
        if not isinstance(claims, dict) or claims.get("role") != "anon":
            raise HTTPException(
                status_code=400,
                detail="Only a Supabase anon/publishable key is accepted. Do not enter a service-role key.",
            )
    return project_url, publishable_key


@app.get("/api/account/config")
async def get_account_config():
    config = account_config()
    return {"configured": bool(config["project_url"] and config["publishable_key"]), **config}


@app.post("/api/account/config")
async def save_account_config(req: AccountConfigRequest):
    if os.environ.get("SUPABASE_URL") or os.environ.get("SUPABASE_ANON_KEY"):
        raise HTTPException(status_code=409, detail="Supabase is configured by Windows environment variables and cannot be changed in the app.")
    project_url, publishable_key = validate_account_config(req.project_url, req.publishable_key)
    config = {"project_url": project_url, "publishable_key": publishable_key}
    try:
        ACCOUNT_CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
        temporary_path = ACCOUNT_CONFIG_PATH.with_suffix(".tmp")
        temporary_path.write_text(json.dumps(config), encoding="utf-8")
        os.replace(temporary_path, ACCOUNT_CONFIG_PATH)
    except OSError as exc:
        raise HTTPException(status_code=500, detail="Could not save the account configuration.") from exc
    return {"configured": True, **config}


@app.get("/")
async def home():
    return FileResponse(BASE / "static" / "index.html")


@app.get("/api/health")
async def health():
    return {"ok": True, "app": "OrbitPilot AI", "version": "0.1.0"}


@app.get("/api/system")
async def system_status():
    mount_status = mount.status()
    return {
        "platform": os.name,
        "windows": os.name == "nt",
        "aiConfigured": ApiKeyStore.configured(),
        "aiModel": ai.model,
        "mountMode": mount_status["mode"],
        "mountConnected": mount_status["connected"],
        "camera": camera.status(),
        "hardwareNote": "ASCOM COM connects to the installed telescope driver. Alpaca mode is restricted to a localhost software simulator.",
    }


@app.post("/api/ai/key")
async def save_ai_key(req: ApiKeyRequest):
    key = req.api_key.strip()
    if not key.startswith("gsk_"):
        raise HTTPException(status_code=400, detail="That does not look like a Groq API key. Groq keys normally begin with gsk_.")
    try:
        await ai.validate_key(key)
        ApiKeyStore.save(key)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not save the key securely: {exc}") from exc
    return {"ok": True, "configured": True, "model": ai.model, "message": "Groq connected. Your key was saved in Windows Credential Manager."}


@app.post("/api/ai/chat")
async def chat(req: ChatRequest):
    try:
        answer = await ai.ask(req.message, req.history)
        return {"answer": answer, "model": ai.model, "source": "Groq API"}
    except Exception as exc:
        status = 503 if "not configured" in str(exc).lower() else 502
        raise HTTPException(status_code=status, detail=str(exc)) from exc


@app.post("/api/ai/choose-target")
async def choose_target(req: TargetPlanRequest):
    candidates = [candidate.model_dump() for candidate in req.candidates if candidate.type.casefold() != "sun"]
    if not candidates:
        raise HTTPException(status_code=400, detail="No safe targets are currently above the horizon.")
    try:
        return await ai.choose_target(req.request, candidates)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Orbit AI could not choose a target: {exc}") from exc


@app.get("/api/mount/status")
async def mount_status():
    return mount.status()


@app.post("/api/mount/connect")
async def mount_connect(req: ConnectRequest):
    try:
        if req.mode == "alpaca":
            return await mount.connect(req.mode, req.host, req.port, req.device_number)
        return await mount.connect(req.mode)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/mount/visual-test")
async def mount_visual_test():
    try:
        return await mount.run_visual_test()
    except Exception as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@app.post("/api/mount/disconnect")
async def mount_disconnect():
    try:
        return await mount.disconnect()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/mount/stop")
async def mount_stop():
    try:
        return await mount.stop()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/mount/tracking")
async def mount_tracking(req: TrackingRequest):
    try:
        return await mount.tracking(req.enabled)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/mount/slew")
async def mount_slew(req: SlewRequest):
    if not req.confirmed:
        raise HTTPException(status_code=400, detail="Explicit movement confirmation is required.")
    try:
        return await mount.slew(req.ra, req.dec)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/mount/move-axis")
async def mount_move_axis(req: MoveAxisRequest):
    try:
        return await mount.move_axis(req.axis, req.rate)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/mount/zero")
async def mount_zero():
    try:
        return await mount.zero()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/camera/status")
async def camera_status():
    return camera.status()


@app.post("/api/camera/connect")
async def camera_connect():
    try:
        return await asyncio.to_thread(camera.connect)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post("/api/camera/disconnect")
async def camera_disconnect():
    try:
        return await asyncio.to_thread(camera.disconnect)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not release the ZWO camera: {exc}") from exc


@app.put("/api/camera/controls")
async def camera_controls(req: CameraControlsRequest):
    try:
        return await asyncio.to_thread(camera.set_controls, req.exposure_ms, req.gain)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/api/camera/frame")
async def camera_frame():
    try:
        data = await asyncio.to_thread(camera.preview_jpeg)
        return Response(data, media_type="image/jpeg", headers={"Cache-Control": "no-store"})
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Camera preview failed: {exc}") from exc


@app.post("/api/camera/capture")
async def camera_capture():
    try:
        return await asyncio.to_thread(camera.capture_fits)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"FITS capture failed: {exc}") from exc


@app.on_event("shutdown")
async def close_camera_on_shutdown():
    await asyncio.to_thread(camera.disconnect)


@app.get("/api/guiding/status")
async def guiding_status():
    return await phd2.status()


@app.post("/api/guiding/start")
async def guiding_start():
    try:
        return await phd2.start_guiding()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/guiding/stop")
async def guiding_stop():
    try:
        return await phd2.stop_guiding()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
