// ─────────────────────────────────────────────────────────────────
// config.js — Exit Pass System Configuration
// ─────────────────────────────────────────────────────────────────
// ⚠️  IMPORTANT: Replace the values below with your actual values
//     before deploying to GitHub Pages.
// ─────────────────────────────────────────────────────────────────

const APP_CONFIG = {
  // Replace with your deployed Google Apps Script Web App URL
  API_URL: "https://script.google.com/macros/s/AKfycbwgleAC7rGtaYLZM0m7nzgOOhDmqJCu4nKojHUgFN35MvOsPOIpTY3vPqTFVddVz0E/exec",

  // Replace with your GitHub username
  GITHUB_USER: "basilurservices",

  // Repository name (keep as-is if you use the same repo name)
  REPO_NAME: "ExitPass",

  // App metadata
  APP_NAME: "ExitPass",
  APP_TAGLINE: "Secure Exit Management System",
  ORG_NAME: "Basilur",

  // Pass ID prefix (aesthetic choice)
  PASS_PREFIX: "EP",

  // Auto-logout after X minutes of inactivity (0 = disabled)
  SESSION_TIMEOUT_MINS: 60,
};

// Derived values (auto-computed — do not edit)
APP_CONFIG.BASE_URL = `https://${APP_CONFIG.GITHUB_USER}.github.io/${APP_CONFIG.REPO_NAME}`;
APP_CONFIG.VERIFY_URL = `${APP_CONFIG.BASE_URL}/verify.html`;

// Freeze to prevent accidental mutation
Object.freeze(APP_CONFIG);

// Make globally accessible
window.APP_CONFIG = APP_CONFIG;
