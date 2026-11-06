# Groq first-launch connection

The packaged OrbitPilotAI.exe asks for a Groq API key when the app is first opened and no key is configured. The app sends the key only to its local API endpoint; the local service verifies it against Groq and stores it with keyring in the current Windows user's Credential Manager. The key is not saved in HTML, JavaScript, or the executable.

1. Create a Groq key at https://console.groq.com/keys.
2. Start OrbitPilot AI.
3. Paste the key into the first-launch Connect to Groq window.
4. The app checks the key and saves it securely.
5. Later launches reuse the saved key.

Default model: `llama-3.3-70b-versatile`. Override with `GROQ_MODEL` if needed.

The source-development launcher still requires Python 3.11+. End users should run the packaged OrbitPilotAI.exe and do not need to install Python.
