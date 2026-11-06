# Supabase account setup

OrbitPilotAI uses Supabase Auth email one-time codes for optional passwordless sign-in. Accounts and marketing opt-ins are hosted in your Supabase project; telescope, sky-map, journal, and AI features remain usable in local mode without signing in.

## Configure the project

1. Create a Supabase project and open **Project Settings → API**.
2. In OrbitPilotAI, open **Settings → Cloud account**. Enter the project URL and the public **publishable key** (or legacy anon key), then save. Do not enter a `service_role` or secret key. The public key is stored in `%LOCALAPPDATA%\OrbitPilotAI\account-config.json`; the application rejects known secret/service-role keys.
3. In the Supabase SQL Editor, run `supabase/schema.sql`. It creates a marketing-preference table protected by row-level security so a signed-in user can read or change only their own record.
4. In **Authentication → Providers → Email**, enable email sign-in and confirm OTP sign-in is allowed. Set the email template to show the one-time token (`{{ .Token }}`) so users receive a code they can enter in OrbitPilotAI.
5. Configure a trusted SMTP provider in the project's **Authentication → SMTP Settings** for reliable delivery. Supabase's default email service is rate-limited and intended for testing.
6. In OrbitPilotAI, click the profile at the lower-left or upper-right, enter an email, request a code, and verify it. Marketing consent is optional and unchecked by default; users can change it later in the account dialog.

The marketing table stores verified, explicit opt-ins and unsubscribe state. It does not send advertising campaigns; connect/export the consented list to a separate email-marketing provider if you want to send campaigns, and follow applicable privacy and anti-spam requirements. Never expose a Supabase service-role key in the desktop app.
