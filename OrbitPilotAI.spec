# -*- mode: python ; coding: utf-8 -*-
from pathlib import Path

from PyInstaller.utils.hooks import collect_all, collect_submodules

ROOT = Path(SPECPATH).resolve()
ICON = ROOT / "assets" / "OrbitPilotAI.ico"
WEBVIEW2_INSTALLER = ROOT / "build-assets" / "MicrosoftEdgeWebView2Setup.exe"
if not ICON.is_file():
    raise FileNotFoundError(f"Application icon is missing: {ICON}")
if not WEBVIEW2_INSTALLER.is_file():
    raise FileNotFoundError(f"WebView2 bootstrapper is missing: {WEBVIEW2_INSTALLER}")

webview_datas, webview_binaries, webview_hiddenimports = collect_all("webview")
pythonnet_datas, pythonnet_binaries, pythonnet_hiddenimports = collect_all("pythonnet")
camera_datas, camera_binaries, camera_hiddenimports = collect_all("pyzwoasi")


def filter_camera_assets(assets):
    filtered = []
    for source, destination in assets:
        normalized = destination.replace("\\", "/")
        if normalized == "pyzwoasi/lib/Windows/x64" or (
            normalized.startswith("pyzwoasi-") and "/licenses/" in normalized
        ):
            filtered.append((source, destination))
    return filtered


camera_datas = filter_camera_assets(camera_datas)
camera_binaries = filter_camera_assets(camera_binaries)
datas = webview_datas + camera_datas + [
    (str(ROOT / "orbitpilot" / "static"), "orbitpilot/static"),
    (str(ROOT / "orbitpilot" / "static" / "sky.js"), "orbitpilot/static"),
    (str(WEBVIEW2_INSTALLER), "."),
    *pythonnet_datas,
]
binaries = webview_binaries + pythonnet_binaries + camera_binaries
hiddenimports = (
    collect_submodules("uvicorn")
    + collect_submodules("webview")
    + collect_submodules("keyring.backends")
    + webview_hiddenimports
    + pythonnet_hiddenimports
    + camera_hiddenimports
    + [
        "pyzwoasi",
        "pyzwoasi.pyzwoasi",
        "pyzwoasi.camera",
        "win32com",
        "win32com.client",
        "pythoncom",
        "pywintypes",
        "win32timezone",
    ]
)

a = Analysis(
    [str(ROOT / "desktop_launcher.py")],
    pathex=[str(ROOT)],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter.test"],
    noarchive=False,
)
pyz = PYZ(a.pure)
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="OrbitPilotAI",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=[str(ICON)],
)
