// ─────────────────────────────────────────────────────────────────
// api.js — Backend API Communication Layer
// All calls go through doPost() on Google Apps Script
// ─────────────────────────────────────────────────────────────────

const API = (() => {

  /** Core POST request to Google Apps Script */
  async function call(payload) {
    const url = APP_CONFIG.API_URL;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        // GAS requires text/plain for CORS; we JSON-stringify the body
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("API Error:", err);
      if (err.message.includes("Failed to fetch")) {
        return { success: false, error: "Failed to fetch: Check if Google Apps Script is deployed with 'Who has access: Anyone'." };
      }
      return { success: false, error: err.message };
    }
  }

  // ── 1. Login User ─────────────────────────────────────────────
  async function loginUser(userId, password) {
    return call({ action: "loginUser", user_id: userId, password });
  }

  // ── 1.1. Register User ────────────────────────────────────────
  async function registerUser(userId, userName) {
    return call({ action: "registerUser", user_id: userId, name: userName });
  }

  // ── 1.2 Get All Users ─────────────────────────────────────────
  async function getAllUsers() {
    return call({ action: "getAllUsers" });
  }

  // ── 1.3 Add User ──────────────────────────────────────────────
  async function addUser({ user_id, name, department, role, email, password }) {
    return call({ action: "addUser", user_id, name, department, role, email, password });
  }

  // ── 1.4 Edit User ─────────────────────────────────────────────
  async function editUser({ user_id, name, department, role, email, password }) {
    return call({ action: "editUser", user_id, name, department, role, email, password });
  }

  // ── 1.5 Delete User ───────────────────────────────────────────
  async function deleteUser(user_id) {
    return call({ action: "deleteUser", user_id });
  }

  // ── 2. Create Exit Pass ───────────────────────────────────────
  async function createExitPass({ user_id, reason, exit_from, exit_to, return_required, phone }) {
    return call({ action: "createExitPass", user_id, reason, exit_from, exit_to, return_required, phone });
  }

  async function cancelExitPass(pass_id, user_id) {
    return call({ action: "cancelExitPass", pass_id, user_id });
  }

  async function remindApprover(pass_id, user_id) {
    return call({ action: "remindApprover", pass_id, user_id });
  }

  // ── 3. Get My Passes (for employee) ───────────────────────────
  async function getMyPasses(user_id, limit = 5, offset = 0) {
    return call({ action: "getMyPasses", user_id, limit, offset });
  }

  // ── 4. Get Pending Passes (for approver) ──────────────────────
  async function getPendingPasses() {
    return call({ action: "getPendingPasses" });
  }

  // ── 5. Get All Passes (for approver history) ──────────────────
  async function getAllPasses(limit = 50, offset = 0) {
    return call({ action: "getAllPasses", limit, offset });
  }

  // ── 6. Approve or Reject Pass ─────────────────────────────────
  async function approvePass({ pass_id, status, approver_name, expected_duration }) {
    return call({ action: "approvePass", pass_id, status, approver_name, expected_duration });
  }

  // ── 7. Verify Pass (QR scan landing) ─────────────────────────
  async function verifyPass(pass_id) {
    return call({ action: "verifyPass", pass_id });
  }

  // ── 7.1 Get Approved Passes (upcoming exits) ──────────────────
  async function getApprovedPasses() {
    return call({ action: "getApprovedPasses" });
  }

  // ── 8. Update Movement Status (guard action) ──────────────────
  async function updateMovementStatus({ pass_id, movement, guard_name }) {
    return call({ action: "updateMovementStatus", pass_id, movement, guard_name });
  }

  // ── 9. Get Guard Log (recent movements) ───────────────────────
  async function getGuardLog(limit = 30) {
    return call({ action: "getGuardLog", limit });
  }

  // ── 9.1 Get Expected Returns ────────────────────────────────────
  async function getExpectedReturns() {
    return call({ action: "getExpectedReturns" });
  }

  // ── 9.2 Revert/Override Movement Status ─────────────────────────
  async function revertMovementStatus({ pass_id, new_status, guard_name }) {
    return call({ action: "revertMovementStatus", pass_id, new_status, guard_name });
  }

  // ── 10. Get Stats ─────────────────────────────────────────────
  async function getStats() {
    return call({ action: "getStats" });
  }

  // ── 10.1 Get Detailed Stats ────────────────────────────────────
  async function getDetailedStats(days = 30, department = "") {
    return call({ action: "getDetailedStats", days, department });
  }

  // ── 11. Get User Profile ────────────────────────────────────────
  async function getUserProfile(user_id) {
    return call({ action: "getUserProfile", user_id });
  }

  // ── 12. Update User Profile ──────────────────────────────────────
  async function updateUserProfile({ user_id, email, phone, password }) {
    return call({ action: "updateUserProfile", user_id, email, phone, password });
  }

  return {
    loginUser,
    registerUser,
    createExitPass,
    getMyPasses,
    getPendingPasses,
    getAllPasses,
    approvePass,
    verifyPass,
    cancelExitPass,
    remindApprover,
    getApprovedPasses,
    updateMovementStatus,
    revertMovementStatus,
    getGuardLog,
    getExpectedReturns,
    getStats,
    getDetailedStats,
    getAllUsers,
    editUser,
    deleteUser,
    getUserProfile,
    updateUserProfile,
  };
})();

window.API = API;
