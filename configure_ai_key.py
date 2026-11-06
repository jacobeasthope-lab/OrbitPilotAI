from getpass import getpass
import asyncio
import keyring
import httpx

SERVICE = "OrbitPilotAI"
USERNAME = "groq_api_key"

async def main():
    print("OrbitPilot AI - Groq API key setup")
    print("Create a key at https://console.groq.com/keys. Input will be hidden.")
    key = getpass("Groq API key: ").strip()
    if not key.startswith("gsk_") or len(key) < 20:
        raise SystemExit("That does not look like a Groq API key. Nothing was saved.")
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {key}"})
    if response.status_code != 200:
        raise SystemExit(f"Groq rejected the key (HTTP {response.status_code}). Nothing was saved.")
    keyring.set_password(SERVICE, USERNAME, key)
    if keyring.get_password(SERVICE, USERNAME) != key:
        raise SystemExit("Windows Credential Manager did not confirm the saved key.")
    print("Groq API key verified and saved in Windows Credential Manager.")

asyncio.run(main())
