// ─────────────────────────────────────────────────────────────────
// auth.js — Authentication & Session Management
// ─────────────────────────────────────────────────────────────────

const Auth = (() => {
  const SESSION_KEY = "ep_session";

  /** Helper for setting cookies */
  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }

  /** Helper for getting cookies */
  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  /** Save session after login */
  function saveSession(data) {
    const session = {
      user_id: data.user_id,
      name: data.name,
      email: data.email,
      department: data.department,
      role: data.role,          // "employee" | "approver" | "guard" | "admin"
      phone: data.phone || "",
      loggedInAt: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // Save session to cookies for persistent "Remember Me" behavior (30 days)
    setCookie(SESSION_KEY, btoa(JSON.stringify(session)), 30);
    
    // Save user_id to cookies to prepopulate login later
    setCookie("ep_previous_login", data.user_id, 30);

    return session;
  }

  /** Get current session or null */
  function getSession() {
    try {
      let raw = localStorage.getItem(SESSION_KEY);
      
      // Fallback to cookie if localStorage is empty
      if (!raw) {
        const cookieData = getCookie(SESSION_KEY);
        if (cookieData) {
          raw = atob(cookieData);
          // Restore to localStorage
          localStorage.setItem(SESSION_KEY, raw);
        }
      }

      if (!raw) return null;
      const session = JSON.parse(raw);

      // Check timeout if configured
      const timeout = APP_CONFIG.SESSION_TIMEOUT_MINS;
      if (timeout > 0) {
        const elapsed = (Date.now() - session.loggedInAt) / 60000;
        if (elapsed > timeout) {
          clearSession();
          return null;
        }
      }
      return session;
    } catch {
      return null;
    }
  }

  /** Clear session (logout) */
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    setCookie(SESSION_KEY, "", -1); // Clear cookie
  }

  /** Require auth. If not authed, redirect to login. Returns session or redirects. */
  function requireAuth(allowedRoles = []) {
    const session = getSession();
    if (!session) {
      window.location.href = "index.html";
      return null;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      // Redirect to appropriate dashboard
      redirectByRole(session.role);
      return null;
    }
    return session;
  }

  /** Redirect user to correct page based on their role */
  function redirectByRole(role) {
    const routes = {
      employee: "request.html",
      approver: "approve.html",
      guard: "guard_list.html",
      admin: "approve.html",
      hr: "approve.html",
    };
    const target = routes[role];
    if (target && !window.location.href.includes(target)) {
      window.location.href = target;
    } else if (!target && !window.location.href.includes("index.html")) {
      window.location.href = "index.html";
    }
  }

  /** 
   * Normalizes User ID (Employee Number). 
   * Strips leading zeros if numeric, otherwise trims and uppercases.
   */
  function normalizeUserId(uid) {
    if (!uid) return "";
    let s = String(uid).trim();
    if (/^\d+$/.test(s)) {
      return parseInt(s, 10).toString();
    }
    return s.toUpperCase();
  }

  return { saveSession, getSession, clearSession, requireAuth, redirectByRole, getCookie, normalizeUserId };
})();

window.Auth = Auth;
