"""Package source, build configuration, and the tested Windows executable."""
from __future__ import annotations

import argparse
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
EXECUTABLE = DIST / "OrbitPilotAI.exe"
ARCHIVE = DIST / "OrbitPilotAI-Complete.zip"
ROOT_FILES = (
    ".gitignore",
    "BUILD-NOTES.txt",
    "BUILD-WINDOWS.bat",
    "GROQ_FIRST_LAUNCH.md",
    "INSTALL-WINDOWS.txt",
    "OrbitPilotAI.spec",
    "README.md",
    "SUPABASE-SETUP.md",
    "configure_ai_key.py",
    "desktop_launcher.py",
    "install-and-start.bat",
    "requirements-build.txt",
    "requirements.txt",
)
SOURCE_DIRS = (".github", "assets", "build-assets", "orbitpilot", "scripts", "supabase")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--executable", type=Path, default=EXECUTABLE, help="built application executable")
    parser.add_argument("--archive", type=Path, default=ARCHIVE, help="destination complete ZIP")
    args = parser.parse_args()
    executable = args.executable.resolve()
    archive_path = args.archive.resolve()
    if not executable.is_file():
        raise FileNotFoundError(f"Build the app before packaging it: {executable}")
    archive_path.parent.mkdir(parents=True, exist_ok=True)

    with ZipFile(archive_path, "w", compression=ZIP_DEFLATED, compresslevel=3) as archive:
        archive.write(executable, "OrbitPilotAI/OrbitPilotAI.exe")
        for relative in ROOT_FILES:
            path = ROOT / relative
            if path.is_file():
                archive.write(path, f"OrbitPilotAI/{relative}")
        for relative in SOURCE_DIRS:
            directory = ROOT / relative
            if not directory.is_dir():
                continue
            for path in sorted(directory.rglob("*")):
                if path.is_file() and "__pycache__" not in path.parts and path.suffix not in {".pyc", ".pyo"}:
                    archive.write(path, f"OrbitPilotAI/{path.relative_to(ROOT).as_posix()}")

    print(f"Created {archive_path} ({archive_path.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
