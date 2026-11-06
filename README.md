# OrbitPilot AI — first Windows build

A local-first starter application for the user's iOptron SmartEQ Pro+, ZWO ASI120MM Mini and USB-to-serial connection. It includes a desktop dashboard in an embedded WebView2 window, an optional Groq-powered astronomy assistant, an ASCOM connection path, camera SDK detection, and a PHD2 JSON-RPC integration for ST-4 autoguiding.

## Important status

This is an early working foundation, not a finished observatory suite. The app starts disconnected; it never silently substitutes a simulator for a physical mount. The telescope panel offers a built-in visual simulator that animates a software-only demo slew and manual axis movement, plus an optional localhost Alpaca simulator. The **Run visual test** control refuses to run while an ASCOM mount or external Alpaca telescope is connected. Neither simulator moves physical hardware. Real mount control requires Windows, ASCOM Platform, iOptron Commander and the correct driver. ZWO support includes single-frame preview, exposure/gain controls and FITS capture, but not high-frame-rate SER/video, stacking or image enhancement. Guiding controls talk to PHD2; PHD2 must be configured with the ASI120MM Mini and its ST-4/on-camera mount connection.

There is deliberately **no autofocus feature** because the telescope has a manual focus knob.

## Run the packaged Windows app

Download the single `OrbitPilotAI.exe` artifact from a Windows build's GitHub Actions run and double-click it. The packaged app includes Python, application dependencies, UI assets, and the WebView2 setup bootstrapper; Python, PowerShell, CMD, a BAT launcher, installer, and companion ZIP are not part of the end-user download. If Microsoft's WebView2 Runtime is absent, the EXE performs its one-time runtime setup automatically (an internet connection is required for that setup). Startup errors are shown in a Windows dialog and logged under `%LOCALAPPDATA%\OrbitPilotAI\logs`.

The app starts in **ASCOM mode, disconnected**. No mount state or movement is simulated. Its local service binds only to `127.0.0.1`; it is not exposed to your network.

## Run from source or build

For development from the source ZIP, install Python 3.11 or newer, then double-click `install-and-start.bat` to run the browser-based development server. To create the Windows distribution, use `BUILD-WINDOWS.bat` on Windows or push to `main`/`master` (or manually dispatch **Build Windows desktop app** in GitHub Actions). The build produces `dist\OrbitPilotAI.exe` and `dist\OrbitPilotAI-Complete.zip`. The CI job smoke-tests the bundled API, dashboard assets, offline star catalog and packaged camera SDK wrapper. `OrbitPilotAI.spec` is the PyInstaller one-file, no-console recipe.

## Configure the Groq key safely

OrbitPilotAI reads the current Windows user's saved key from Credential Manager and leaves it there when the app closes or updates. If AI reports that the key is invalid, use **Settings → Connect or change API key** to validate and replace it; the key is never embedded in the EXE or written into project files. For source development, double-click `scripts\configure-ai-key.bat`. The app uses the Groq Chat Completions API with `llama-3.3-70b-versatile` by default; set `GROQ_MODEL` to another model ID in your Windows environment if desired.

API usage is billed separately from ChatGPT. Check your API billing and limits before use.

## Optional account sign-in and marketing preferences

The desktop app supports passwordless Supabase email-code sign-in. Account creation and email verification require a Supabase project with Auth email OTP and SMTP configured; setup is optional, and the local astronomy tools continue to work without signing in. The account dialog also lets a verified user explicitly opt in or out of product updates. See [SUPABASE-SETUP.md](SUPABASE-SETUP.md) and run `supabase/schema.sql` in the project's SQL Editor. The public Supabase key is stored under `%LOCALAPPDATA%\OrbitPilotAI`; never put a service-role key in the desktop app. The marketing table records consent but does not send campaign emails.

## Enable real SmartEQ Pro+ control

1. Install the ASCOM Platform for Windows.
2. Install the official iOptron Commander / ASCOM telescope driver for **SmartEQ Pro+ (Product 3200)**. Do not select a driver intended only for the original SmartEQ Pro.
3. Connect the USB-to-serial adapter to the 8408 hand controller's 4-pin RJ9 serial port using the proper RS232-RJ9 cable/adapter. Do not plug it into the 6-pin HBX port.
4. Start OrbitPilot AI and choose **Connect ASCOM**. The standard ASCOM chooser opens; select the iOptron SmartEQ Pro+ telescope driver.
5. Confirm the mount reports connected before attempting any movement.

Real mount movement is deliberately gated behind an additional confirmation dialog in the UI. Verify the mount is correctly balanced, aligned, powered and clear of obstructions before movement. Keep the hand controller available to stop movement.

During held manual-axis movement, the app asks Windows to remain awake and a server watchdog stops the axis if movement heartbeats stop. Do not force Windows to sleep or close the app while the mount is moving: sleep can suspend the app and watchdog, and a mount may continue a GoTo slew independently. Stop motion in OrbitPilot or with the hand controller first.

### Polar alignment guidance

The sky map calculates the mount polar-axis altitude as the absolute observer latitude and gives a true-north/true-south direction. In the Northern Hemisphere it also shows Polaris as a nearby reference star; Polaris is not the celestial pole, so use the reticle placement described by the mount's polar-scope instructions. The user must turn the mount's altitude and azimuth bolts. This build has no motorized adjusters, polar-alignment camera, plate solving, or measurement of residual alignment error; it cannot automatically polar-align or verify alignment. Orbit AI can explain the manual steps using the calculated location values.

The visible-target assistant offers Orbit AI only objects above the horizon in the locally calculated map, excludes the Sun, and never sends movement commands. A selected object must still be reviewed and separately confirmed before the app sends a real ASCOM slew.

### Return to Zero

OrbitPilot calls ASCOM `FindHome` only when the selected driver advertises `CanFindHome`. If it does not, the app refuses to guess. Use the SmartEQ Pro+ hand-controller documented Zero Position procedure. Zero Position is a mechanical home reference; it is not simply a GoTo to Polaris. The ASCOM `FindHome` capability may not be exposed by every driver/firmware combination.

## Configure ASI120MM Mini and ST-4 guiding

1. Install the official ZWO ASI camera driver and SDK. The desktop EXE bundles the Python wrapper and FITS dependencies; the official camera driver remains a separate hardware prerequisite.
2. Connect the ASI120MM Mini over USB. In Camera Studio, detect and connect the camera, set exposure and gain, and start the single-frame live preview or save a FITS exposure. FITS files are saved under `Pictures\OrbitPilotAI\Captures`.
3. Close PHD2 before connecting the camera in OrbitPilotAI if PHD2 currently owns it; a camera generally cannot be opened by both applications at once.
4. Install PHD2 from https://openphdguiding.org/.
5. Connect the camera to a guide scope or off-axis guider so it can see guide stars.
6. Connect the camera's ST-4 output to the SmartEQ Pro+'s ST-4-compatible autoguider port using a proper ST-4 cable.
7. In PHD2, select the ASI120MM Mini as the camera and **On-camera** as the mount/guide output. Complete PHD2's equipment setup and calibration.
8. In PHD2, enable `Tools -> Enable Server`. PHD2's JSON-RPC server uses localhost port 4400 by default.
9. Return to OrbitPilot AI, refresh Guiding status, and use Start/Stop Guiding. PHD2 performs the actual calibration and guide corrections; OrbitPilot sends commands and displays PHD2's status.

The sky map uses an offline 8,920-record subset of the Astronexus HYG Database v4.1 (stars through magnitude 6.5), with attribution and CC BY-SA 4.0 licensing shown in the map.

USB-to-serial telescope control and ST-4 guiding are separate connections. The camera's ST-4 socket needs a separate cable to the mount guide port. A guide camera also needs guide optics.

## Current build checklist

- [x] Dark astronomy dashboard and navigation
- [x] ASCOM-only mount connection, disconnected by default
- [x] Built-in software-only visual simulator and animated mount movement test
- [x] ASCOM chooser / COM telescope connection foundation
- [x] RA/DEC slew with explicit confirmation
- [x] Abort slew and tracking controls
- [x] FindHome only when driver capability is advertised
- [x] Secure Groq key lookup from Windows credential store
- [x] Groq Chat Completions API chat endpoint
- [x] PHD2 JSON-RPC status, start and stop guiding endpoints
- [x] ZWO ASI camera detection, single-frame preview, exposure/gain controls and FITS capture
- [x] Offline HYG star catalog to magnitude 6.5 with visible license attribution
- [x] Galaxy explorer starter catalogue and observation journal UI
- [x] Local horizon map and visible-object AI target selection
- [x] Location-based manual polar-alignment guidance
- [ ] High-frame-rate SER video capture
- [ ] Full live stacking and image processing
- [ ] Plate-solving and camera-based target centring
- [ ] Motorized polar alignment (requires compatible adjusters and camera feedback)
- [ ] Live ephemeris / weather / sky visibility service
- [ ] Installer packaging and hardware testing on the actual mount

## Troubleshooting

- If running from source and Python is not found, install Python 3.11+ and rerun `install-and-start.bat`.
- If packaged startup cannot install WebView2, connect to the internet and launch OrbitPilot AI again; diagnostics are saved in `%LOCALAPPDATA%\OrbitPilotAI\logs`.
- If ASCOM chooser does not open, confirm the ASCOM Platform and iOptron driver are installed, then run the app normally (not as Administrator unless your driver requires it).
- If the camera is not found, verify the ZWO Windows camera driver, USB cable, and ASI SDK wrapper.
- If PHD2 is unavailable, open PHD2, enable `Tools -> Enable Server`, and check that port 4400 is not blocked.
- If the AI endpoint reports no key configured, run `scripts\configure-ai-key.bat` using a newly created key, then restart the app.

## References

- iOptron SmartEQ Pro+ product support: https://www.ioptron.com/product-p/3200.htm
- SmartEQ Pro+ manual: https://www.ioptron.com/v/Manuals/3200_SmartEQProPlus_Manual.pdf
- ZWO developer SDK: https://www.zwoastro.com/software/product-sdk/
- PHD2: https://openphdguiding.org/
- Groq API key safety: https://developers.openai.com/api/docs/guides/api-keys


## Groq first-launch setup

On first launch, OrbitPilot AI displays a Groq API-key connection window. The key is validated against Groq and saved in the current Windows user Credential Manager using `keyring`. It is not embedded in the ZIP or application source. See `GROQ_FIRST_LAUNCH.md`.
