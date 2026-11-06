(() => {
  const $ = (id) => document.getElementById(id);
  const state = { config: null, session: null, pendingEmail: "" };
  const SESSION_KEY = "orbitpilot-account-session";

  function showStatus(message, tone = "info") {
    const element = $("accountSessionStatus");
    element.textContent = message;
    element.dataset.tone = tone;
  }

  function setConfigStatus(message, tone = "info") {
    const element = $("accountConfigStatus");
    element.textContent = message;
    element.dataset.tone = tone;
  }

  async function localApi(path, options = {}) {
    const response = await fetch(path, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail || `Local service request failed (${response.status}).`);
    return body;
  }

  function clearSession() {
    state.session = null;
    sessionStorage.removeItem(SESSION_KEY);
    renderSession();
  }

  function saveSession(session) {
    session.expires_at = Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600);
    state.session = session;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    renderSession();
  }

  async function supabaseRequest(path, options = {}) {
    if (!state.config?.configured) throw new Error("Configure the Supabase project in Settings before signing in.");
    const response = await fetch(`${state.config.project_url}${path}`, {
      ...options,
      headers: {
        apikey: state.config.publishable_key,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.msg || body.message || body.error_description || body.error || `Supabase request failed (${response.status}).`);
    }
    return body;
  }

  async function ensureFreshSession() {
    if (!state.session) throw new Error("Sign in to manage email preferences.");
    if (Number(state.session.expires_at || 0) > Math.floor(Date.now() / 1000) + 60) return;
    if (!state.session.refresh_token) {
      clearSession();
      throw new Error("Your session expired. Request a new email code to sign in again.");
    }
    const refreshed = await supabaseRequest("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: state.session.refresh_token }),
    });
    saveSession(refreshed);
  }

  async function loadConfig() {
    try {
      state.config = await localApi("/api/account/config");
      $("accountConfigBadge").textContent = state.config.configured ? "CONNECTED" : "NOT CONFIGURED";
      $("accountConfigBadge").dataset.state = state.config.configured ? "ready" : "setup";
      const environmentManaged = state.config.source === "environment";
      $("accountProjectUrl").disabled = environmentManaged;
      $("accountPublishableKey").disabled = environmentManaged;
      $("saveAccountConfig").disabled = environmentManaged;
      if (environmentManaged) $("accountPublishableKey").placeholder = "Configured by Windows environment";
      if (state.config.configured) {
        if (!$("accountProjectUrl").value) $("accountProjectUrl").value = state.config.project_url;
        setConfigStatus(environmentManaged
          ? "Supabase settings are managed by Windows environment variables."
          : "Supabase is configured. Email delivery and OTP templates must be enabled in the project.");
        showStatus("Supabase is ready. Enter your email to receive a one-time sign-in code.");
      } else {
        setConfigStatus("Enter the project URL and public anon/publishable key. Local astronomy tools work without an account.");
        showStatus("Account sign-in needs a Supabase project. Configure it in Settings or continue in local mode.");
      }
    } catch (error) {
      state.config = { configured: false };
      $("accountConfigBadge").textContent = "UNAVAILABLE";
      setConfigStatus(`Could not load account configuration: ${error.message}`, "error");
      showStatus("The local account service is unavailable. You can continue in local mode.", "error");
    }
  }

  function renderSession() {
    const signedIn = !!state.session?.user?.email;
    $("accountSignedOut").hidden = signedIn;
    $("accountSignedIn").hidden = !signedIn;
    if (!signedIn) {
      $("profileButton").querySelector(".profile-copy b").textContent = "Local user";
      $("profileButton").querySelector(".profile-copy small").textContent = "Sign in to your account";
      $("topProfileButton").textContent = "OP";
      $("accountSetupLink").hidden = !!state.config?.configured;
      return;
    }
    const email = state.session.user.email;
    const initials = email.slice(0, 2).toUpperCase();
    $("accountUserEmail").textContent = email;
    $("accountAvatar").textContent = initials;
    $("profileButton").querySelector(".profile-copy b").textContent = email;
    $("profileButton").querySelector(".profile-copy small").textContent = "OrbitPilotAI account";
    $("profileButton").querySelector(".profile-avatar").textContent = initials;
    $("topProfileButton").textContent = initials;
    $("accountSetupLink").hidden = true;
    showStatus(`Signed in as ${email}.`);
  }

  function openAccount() {
    $("accountBackdrop").hidden = false;
    document.body.classList.add("account-open");
    if (state.session) refreshMarketingPreference();
    (state.session ? $("saveMarketingPreference") : $("accountEmail")).focus();
  }

  function closeAccount() {
    $("accountBackdrop").hidden = true;
    document.body.classList.remove("account-open");
  }

  async function requestCode() {
    const email = $("accountEmail").value.trim();
    if (!email || !$("accountEmail").checkValidity()) {
      showStatus("Enter a valid email address first.", "error");
      $("accountEmail").focus();
      return;
    }
    if (!state.config?.configured) {
      showStatus("Configure Supabase in Settings before requesting a sign-in code.", "error");
      return;
    }
    const button = $("requestAccountCode");
    button.disabled = true;
    button.textContent = "Sending code…";
    try {
      await supabaseRequest("/auth/v1/otp", {
        method: "POST",
        body: JSON.stringify({ email, create_user: true }),
      });
      state.pendingEmail = email;
      $("accountCodeField").hidden = false;
      $("verifyAccountCode").hidden = false;
      $("accountCode").focus();
      showStatus(`A verification code was requested for ${email}. Check your inbox and spam folder.`);
    } catch (error) {
      showStatus(`Could not send the verification code: ${error.message}`, "error");
    } finally {
      button.disabled = false;
      button.textContent = "Email me a verification code";
    }
  }

  async function verifyCode() {
    const email = state.pendingEmail || $("accountEmail").value.trim();
    const token = $("accountCode").value.trim();
    if (!email || !token) {
      showStatus("Enter the email address and the code from your inbox.", "error");
      return;
    }
    const button = $("verifyAccountCode");
    button.disabled = true;
    button.textContent = "Verifying…";
    try {
      const session = await supabaseRequest("/auth/v1/verify", {
        method: "POST",
        body: JSON.stringify({ email, token, type: "email" }),
      });
      if (!session.access_token || !session.user?.email) throw new Error("Supabase did not return a verified account session.");
      saveSession(session);
      showStatus(`Signed in as ${session.user.email}.`, "success");
      if ($("marketingConsent").checked) {
        try {
          await setMarketingSubscription(true);
          $("accountManageMarketing").checked = true;
          showStatus("Email verified. You are signed in and subscribed to product updates.", "success");
        } catch (error) {
          showStatus(`Signed in, but the marketing preference could not be saved: ${error.message}`, "error");
        }
      } else {
        await refreshMarketingPreference();
      }
    } catch (error) {
      showStatus(`Could not verify the code: ${error.message}`, "error");
    } finally {
      button.disabled = false;
      button.textContent = "Verify code and sign in";
    }
  }

  async function refreshMarketingPreference() {
    if (!state.session || !state.config?.configured) return;
    try {
      await ensureFreshSession();
      const userId = encodeURIComponent(state.session.user.id);
      const rows = await supabaseRequest(`/rest/v1/marketing_subscriptions?select=subscribed&user_id=eq.${userId}`, {
        headers: { Authorization: `Bearer ${state.session.access_token}` },
      });
      $("accountManageMarketing").checked = Array.isArray(rows) && rows[0]?.subscribed === true;
    } catch (error) {
      showStatus(`Could not load your email preference: ${error.message}`, "error");
    }
  }

  async function setMarketingSubscription(subscribed) {
    await ensureFreshSession();
    const user = state.session.user;
    const authorization = { Authorization: `Bearer ${state.session.access_token}` };
    const userId = encodeURIComponent(user.id);
    if (subscribed) {
      await supabaseRequest("/rest/v1/marketing_subscriptions?on_conflict=user_id", {
        method: "POST",
        headers: { ...authorization, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: user.id, email: user.email, subscribed: true }),
      });
    } else {
      await supabaseRequest(`/rest/v1/marketing_subscriptions?user_id=eq.${userId}`, {
        method: "PATCH",
        headers: { ...authorization, Prefer: "return=minimal" },
        body: JSON.stringify({ subscribed: false }),
      });
    }
  }

  async function saveMarketingPreference() {
    try {
      await setMarketingSubscription($("accountManageMarketing").checked);
      showStatus($("accountManageMarketing").checked ? "Your product-update subscription is saved." : "You are unsubscribed from product updates.", "success");
    } catch (error) {
      showStatus(`Could not save your email preference: ${error.message}`, "error");
    }
  }

  async function signOut() {
    const session = state.session;
    try {
      if (session?.access_token) {
        await supabaseRequest("/auth/v1/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
      clearSession();
      showStatus("You are signed out.", "success");
    } catch (error) {
      clearSession();
      showStatus(`Signed out on this device. Supabase could not revoke the remote session: ${error.message}`, "error");
    }
  }

  async function saveConfig() {
    const projectUrl = $("accountProjectUrl").value.trim();
    const publishableKey = $("accountPublishableKey").value.trim();
    if (!publishableKey) {
      setConfigStatus("Enter the project's public publishable/anon key. Secret and service-role keys are rejected.", "error");
      return;
    }
    const button = $("saveAccountConfig");
    button.disabled = true;
    try {
      state.config = await localApi("/api/account/config", {
        method: "POST",
        body: JSON.stringify({ project_url: projectUrl, publishable_key: publishableKey }),
      });
      state.config.source = "saved";
      $("accountPublishableKey").value = "";
      $("accountConfigBadge").textContent = "CONNECTED";
      $("accountConfigBadge").dataset.state = "ready";
      $("accountSetupLink").hidden = true;
      setConfigStatus("Supabase configuration saved in this Windows user's OrbitPilotAI application data.");
      showStatus("Supabase is ready. Enter your email to receive a one-time sign-in code.");
      renderSession();
    } catch (error) {
      setConfigStatus(`Could not save account configuration: ${error.message}`, "error");
    } finally {
      button.disabled = false;
    }
  }

  async function restoreSession() {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (!saved) return;
      state.session = JSON.parse(saved);
      if (Number(state.session.expires_at || 0) <= Math.floor(Date.now() / 1000) + 60) {
        await ensureFreshSession();
      } else {
        renderSession();
      }
    } catch {
      clearSession();
    }
  }

  $("profileButton").onclick = $("topProfileButton").onclick = openAccount;
  $("accountClose").addEventListener("click", closeAccount);
  $("accountBackdrop").addEventListener("click", (event) => {
    if (event.target === $("accountBackdrop")) closeAccount();
  });
  $("requestAccountCode").addEventListener("click", requestCode);
  $("verifyAccountCode").addEventListener("click", verifyCode);
  $("saveMarketingPreference").addEventListener("click", saveMarketingPreference);
  $("signOutAccount").addEventListener("click", signOut);
  $("saveAccountConfig").addEventListener("click", saveConfig);
  $("openAccountLogin").addEventListener("click", openAccount);
  $("accountSetupLink").addEventListener("click", () => {
    closeAccount();
    window.setPage("settings");
  });
  $("continueAsGuest").addEventListener("click", closeAccount);
  $("accountEmail").addEventListener("keydown", (event) => {
    if (event.key === "Enter") requestCode();
  });
  $("accountCode").addEventListener("keydown", (event) => {
    if (event.key === "Enter") verifyCode();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("accountBackdrop").hidden) closeAccount();
  });

  loadConfig().then(restoreSession);
})();
