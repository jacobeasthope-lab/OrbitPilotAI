"""Desktop entry point: start the local server and show its UI in a native window."""
from __future__ import annotations

import ctypes
import json
import os
import socket
import subprocess
import sys
import threading
import time
import traceback
import urllib.request
from pathlib import Path

HOST = "127.0.0.1"


def ensure_webview2_runtime() -> None:
    runtime_roots = (
        Path(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")) / "Microsoft" / "EdgeWebView" / "Application",
        Path(os.environ.get("ProgramFiles", r"C:\Program Files")) / "Microsoft" / "EdgeWebView" / "Application",
        Path(os.environ.get("LOCALAPPDATA", Path.home())) / "Microsoft" / "EdgeWebView" / "Application",
    )
    if any(any(root.glob("*/msedgewebview2.exe")) for root in runtime_roots if root.is_dir()):
        return

    if not getattr(sys, "frozen", False):
        raise RuntimeError(
            "Microsoft Edge WebView2 Runtime is required to show the desktop window. "
            "Install the Evergreen Runtime or run the packaged application."
        )

    installer = Path(sys._MEIPASS) / "MicrosoftEdgeWebView2Setup.exe"
    if not installer.is_file():
        raise FileNotFoundError("The bundled WebView2 installer is missing from this application.")
    ctypes.windll.user32.MessageBoxW(
        None,
        "OrbitPilot AI is preparing its embedded browser for the first launch. "
        "This one-time setup requires an internet connection.",
        "OrbitPilot AI setup",
        0x40,
    )
    subprocess.run(
        [str(installer), "/silent", "/install"],
        check=True,
        timeout=240,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as listener:
        listener.bind((HOST, 0))
        return int(listener.getsockname()[1])


def show_error(error: Exception) -> None:
    details = f"{error}\n\n{traceback.format_exc()}"
    appdata = os.environ.get("LOCALAPPDATA") or os.environ.get("APPDATA")
    log_path = Path(appdata) / "OrbitPilotAI" / "logs" / "startup.log" if appdata else None
    if log_path:
        try:
            log_path.parent.mkdir(parents=True, exist_ok=True)
            log_path.write_text(details, encoding="utf-8")
        except OSError:
            log_path = None

    message = f"OrbitPilot AI could not start:\n\n{error}"
    if log_path:
        message += f"\n\nDetails were saved to:\n{log_path}"
    if os.name == "nt":
        ctypes.windll.user32.MessageBoxW(None, message, "OrbitPilot AI startup error", 0x10)
        return
    sys.stderr.write(details)


def main() -> int:
    server = None
    server_thread = None
    try:
        import uvicorn
        from orbitpilot.main import app

        port = free_port()
        url = f"http://{HOST}:{port}"
        server = uvicorn.Server(
            uvicorn.Config(
                app,
                host=HOST,
                port=port,
                log_level="warning",
                log_config=None,
                access_log=False,
                server_header=False,
            )
        )
        server_thread = threading.Thread(target=server.run, name="OrbitPilot-local-server", daemon=True)
        server_thread.start()

        deadline = time.monotonic() + 25
        while time.monotonic() < deadline:
            if server.started:
                break
            if not server_thread.is_alive():
                raise RuntimeError("The local OrbitPilot service stopped during startup.")
            time.sleep(0.2)
        if not server.started:
            raise TimeoutError("OrbitPilot timed out while starting its local service.")

        if "--smoke-test" in sys.argv[1:]:
            with urllib.request.urlopen(f"{url}/api/health", timeout=5) as response:
                if response.status != 200:
                    raise RuntimeError(f"Health check returned HTTP {response.status}.")
            verify_ai_key = "--verify-ai-key" in sys.argv[1:]
            with urllib.request.urlopen(f"{url}/api/system", timeout=10) as response:
                system = json.loads(response.read())
                if response.status != 200 or (verify_ai_key and system.get("aiConfigured") is not True):
                    raise RuntimeError("Orbit AI could not read the saved Windows Credential Manager key.")
            with urllib.request.urlopen(url, timeout=5) as response:
                dashboard = response.read()
                if response.status != 200 or b"OrbitPilot" not in dashboard:
                    raise RuntimeError("The dashboard did not return its expected page.")
                if b'<option value="ascom">' not in dashboard or b'<option value="alpaca">' not in dashboard:
                    raise RuntimeError("The dashboard must default to ASCOM while retaining the optional simulator.")
            for asset in ("app.js", "account.js", "sky.js", "premium.css", "orbit-art.svg", "dashboard-logo.png", "dashboard-hero.png", "dashboard-features.png", "star-catalog.json"):
                with urllib.request.urlopen(f"{url}/static/{asset}", timeout=5) as response:
                    if response.status != 200:
                        raise RuntimeError(f"The dashboard asset could not be loaded: {asset}")
                    contents = response.read()
                    if asset == "app.js":
                        required = (b"redesignDashboard", b"dashboardAttach", b"mount3dAzimuthAxis")
                        if any(marker not in contents for marker in required):
                            raise RuntimeError("The dashboard interactions or 3D telescope viewer are incomplete.")
                    if asset == "premium.css" and b"orbit-command-hero" not in contents:
                        raise RuntimeError("The redesigned responsive dashboard styles were not loaded.")
                    if asset == "account.js" and b"marketing_subscriptions" not in contents:
                        raise RuntimeError("The account sign-in and marketing preference client is incomplete.")
                    if asset == "star-catalog.json":
                        catalog = json.loads(contents)
                        if len(catalog.get("stars", [])) < 8000:
                            raise RuntimeError("The offline star catalog is incomplete.")
            with urllib.request.urlopen(f"{url}/api/camera/status", timeout=10) as response:
                camera = json.loads(response.read())
                if response.status != 200 or "captureConnected" not in camera:
                    raise RuntimeError("The camera status endpoint did not return its expected state.")
                if getattr(sys, "frozen", False) and camera.get("sdkLoaded") is not True:
                    raise RuntimeError("The packaged ZWO SDK wrapper or camera DLL could not be loaded.")

            request = urllib.request.Request(f"{url}/api/mount/visual-test", data=b"", method="POST")
            with urllib.request.urlopen(request, timeout=10) as response:
                visual_test = json.loads(response.read())
                if response.status != 200 or visual_test.get("mode") != "visual":
                    raise RuntimeError("The built-in telescope visual test did not start.")
            try:
                with urllib.request.urlopen(f"{url}/api/mount/status", timeout=5) as response:
                    first_status = json.loads(response.read())
                time.sleep(0.35)
                with urllib.request.urlopen(f"{url}/api/mount/status", timeout=5) as response:
                    second_status = json.loads(response.read())
                if not first_status.get("slewing") or not second_status.get("slewing"):
                    raise RuntimeError("The built-in visual telescope did not remain in its demo slew.")
                if (first_status.get("altitude"), first_status.get("azimuth")) == (
                    second_status.get("altitude"),
                    second_status.get("azimuth"),
                ):
                    raise RuntimeError("The built-in visual telescope telemetry did not change during its slew.")
            finally:
                for endpoint in ("stop", "disconnect"):
                    stop_request = urllib.request.Request(f"{url}/api/mount/{endpoint}", data=b"", method="POST")
                    with urllib.request.urlopen(stop_request, timeout=5):
                        pass
            return 0

        if os.name == "nt":
            ensure_webview2_runtime()
            import webview

            webview.create_window(
                "OrbitPilot AI",
                url,
                width=1440,
                height=940,
                min_size=(1024, 700),
                background_color="#07110f",
            )
            webview.start(debug=False)
        else:
            import webbrowser

            webbrowser.open(url)
            while server_thread.is_alive():
                time.sleep(0.5)
    except KeyboardInterrupt:
        return 0
    except Exception as error:
        if "--smoke-test" in sys.argv[1:]:
            return 1
        show_error(error)
        return 1
    finally:
        if server is not None:
            server.should_exit = True
        if server_thread is not None:
            server_thread.join(timeout=10)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
