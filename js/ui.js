// ─────────────────────────────────────────────────────────────────
// ui.js — Shared UI Utilities
// ─────────────────────────────────────────────────────────────────

const UI = (() => {

  // ── Toast Notifications ───────────────────────────────────────
  function toast(message, type = "info", duration = 3500) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }

    const icons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.innerHTML = `<span>${icons[type] || "ℹ"}</span><span>${message}</span>`;
    container.appendChild(el);

    setTimeout(() => {
      el.style.animation = "toast-in 0.3s ease reverse both";
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  // ── Button Loading State ───────────────────────────────────────
  function setButtonLoading(btn, loading, originalText) {
    if (loading) {
      btn.disabled = true;
      btn.dataset.originalText = btn.innerHTML;
      btn.innerHTML = `<span class="spinner"></span> Processing…`;
    } else {
      btn.disabled = false;
      btn.innerHTML = originalText || btn.dataset.originalText || "Submit";
    }
  }

  // ── Status Badge HTML ──────────────────────────────────────────
  function statusBadge(status) {
    const map = {
      PENDING: ["pending", "Pending"],
      APPROVED: ["approved", "Approved"],
      REJECTED: ["rejected", "Rejected"],
      EXPIRED: ["expired", "Expired"],
      EXITED: ["exited", "Exited"],
      RETURNED: ["returned", "Returned"],
      NOT_EXITED: ["not_exited", "Not Exited"],
      CANCELLED: ["expired", "Cancelled"],
    };
    const [cls, label] = map[status] || ["pending", status];
    return `<span class="badge badge--${cls}">${label}</span>`;
  }

  // ── Format datetime ────────────────────────────────────────────
  function formatDateTime(str) {
    if (!str) return "—";
    try {
      const d = new Date(str);
      return d.toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return str; }
  }

  function formatDate(str) {
    if (!str) return "—";
    try {
      return new Date(str).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      });
    } catch { return str; }
  }

  function isToday(dateString) {
    if (!dateString) return false;
    try {
      const d = new Date(dateString);
      const today = new Date();
      return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
    } catch { return false; }
  }

  // ── Show / Hide elements ────────────────────────────────────────
  function show(el) { if (el) el.classList.remove("hidden"); }
  function hide(el) { if (el) el.classList.add("hidden"); }

  // ── Render topbar user info ────────────────────────────────────
  function renderTopbarUser(session) {
    const nameEl = document.getElementById("user-name");
    const roleEl = document.getElementById("user-role");
    const deptEl = document.getElementById("user-dept");
    const topbarUserDiv = document.querySelector(".topbar__user");

    if (nameEl) nameEl.textContent = session.name || session.user_id;
    if (roleEl) {
      roleEl.textContent = session.role.toUpperCase();
      roleEl.className = `topbar__role-badge role--${session.role}`;
    }
    if (deptEl) deptEl.textContent = session.department || "";

    if (topbarUserDiv) {
      topbarUserDiv.title = "Click to edit profile";
      topbarUserDiv.onclick = () => showProfileModal(session.user_id);
    }
  }

  // ── Logout handler ─────────────────────────────────────────────
  function bindLogout() {
    const btn = document.getElementById("logout-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        Auth.clearSession();
        window.location.href = "index.html";
      });
    }
  }

  // ── Confirm modal ──────────────────────────────────────────────
  function confirm(title, message) {
    return new Promise((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      backdrop.style.zIndex = "10001";
      backdrop.innerHTML = `
        <div class="modal">
          <div class="modal__header">
            <h3 class="card__title">${title}</h3>
          </div>
          <div class="modal__body">
            <p style="color:var(--text-secondary);font-size:14px;">${message}</p>
          </div>
          <div class="modal__footer">
            <button class="btn btn--ghost" id="modal-cancel">Cancel</button>
            <button class="btn btn--primary" id="modal-confirm">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(backdrop);
      document.getElementById("modal-cancel").onclick = () => { backdrop.remove(); resolve(false); };
      document.getElementById("modal-confirm").onclick = () => { backdrop.remove(); resolve(true); };
      backdrop.addEventListener("click", (e) => { if (e.target === backdrop) { backdrop.remove(); resolve(false); } });
    });
  }

  // ── Generate QR Code (via QRCode.js) ──────────────────────────
  function generateQR(containerId, url) {
    const el = document.getElementById(containerId);
    if (!el || typeof QRCode === "undefined") return;
    el.innerHTML = "";
    new QRCode(el, {
      text: url,
      width: 200,
      height: 200,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  // ── Time remaining text ───────────────────────────────────────
  function timeRemaining(exitTo) {
    if (!exitTo) return { text: "No limit", expired: false };
    const now = new Date();
    const end = new Date(exitTo);
    if (isNaN(end.getTime())) return { text: "No limit", expired: false };

    const diff = end - now;
    if (diff <= 0) return { text: "Expired", expired: true };
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return { text: `${hours}h ${mins % 60}m remaining`, expired: false };
    return { text: `${mins}m remaining`, expired: false };
  }

  // ── Show Profile Modal ──────────────────────────────────────────
  async function showProfileModal(userId) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    // Inline styles to ensure it works even if style.css has issues
    Object.assign(backdrop.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: '10000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    });

    backdrop.innerHTML = `
      <div class="modal" style="max-width: 480px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; background: #121212; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); overflow: hidden; animation: modal-in 0.3s ease;">
        <div class="modal__header" style="padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
          <h3 class="card__title" style="margin:0; font-size: 1.1rem;">User Profile</h3>
          <button class="btn btn--ghost btn--sm btn--icon" id="profile-close" style="padding: 5px; min-width: 32px;">✕</button>
        </div>
        <div class="modal__body" id="profile-modal-content" style="padding: 24px; overflow-y: auto; flex: 1;">
          <div class="loading-overlay" style="display: flex; flex-direction: column; align-items: center; gap: 15px; padding: 40px 0;">
            <div class="spinner"></div>
            <span style="color: #888;">Fetching profile details...</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const close = () => {
      backdrop.style.opacity = '0';
      backdrop.style.transition = 'opacity 0.2s ease';
      setTimeout(() => backdrop.remove(), 200);
    };
    document.getElementById("profile-close").onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };

    try {
      const u = await API.getUserProfile(userId);
      const content = document.getElementById("profile-modal-content");
      
      if (!u.success) {
        content.innerHTML = `
          <div style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(239, 68, 68, 0.2);">
            Failed to load profile details. Please try again later.
          </div>
          <button class="btn btn--ghost btn--full" onclick="this.closest('.modal-backdrop').remove()">Close Window</button>
        `;
        return;
      }

      content.innerHTML = `
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="display:block; font-size: 0.7rem; color: #888; text-transform: uppercase; margin-bottom: 5px;">Employee Number (ReadOnly)</label>
          <input type="text" class="form-input" value="${u.user_id}" readonly style="width:100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); color: #666; cursor: not-allowed; padding: 10px; border-radius: 8px;">
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="display:block; font-size: 0.7rem; color: #888; text-transform: uppercase; margin-bottom: 5px;">Full Name (ReadOnly)</label>
          <input type="text" class="form-input" value="${u.name}" readonly style="width:100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); color: #666; cursor: not-allowed; padding: 10px; border-radius: 8px;">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div class="form-group">
            <label class="form-label" style="display:block; font-size: 0.7rem; color: #888; text-transform: uppercase; margin-bottom: 5px;">Department</label>
            <input type="text" class="form-input" value="${u.department || '—'}" readonly style="width:100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); color: #666; padding: 10px; border-radius: 8px;">
          </div>
          <div class="form-group">
            <label class="form-label" style="display:block; font-size: 0.7rem; color: #888; text-transform: uppercase; margin-bottom: 5px;">Role</label>
            <input type="text" class="form-input" value="${u.role?.toUpperCase() || '—'}" readonly style="width:100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); color: #666; padding: 10px; border-radius: 8px;">
          </div>
        </div>
        
        <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 24px 0;"></div>
        
        <form id="profile-form">
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label" for="p-email" style="display:block; font-size: 0.7rem; color: #bbb; text-transform: uppercase; margin-bottom: 5px;">Email Address</label>
            <input type="email" id="p-email" class="form-input" value="${u.email || ''}" placeholder="email@example.com" style="width:100%; background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 12px; border-radius: 8px;">
          </div>
          <div class="form-group" style="margin-bottom: 24px;">
            <label class="form-label" for="p-phone" style="display:block; font-size: 0.7rem; color: #bbb; text-transform: uppercase; margin-bottom: 5px;">Phone Number</label>
            <input type="tel" id="p-phone" class="form-input" value="${u.phone || ''}" placeholder="07XXXXXXXX" style="width:100%; background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 12px; border-radius: 8px;">
          </div>
          
          <div class="form-group" style="margin-bottom: 24px;">
            <label class="form-label" for="p-password" style="display:block; font-size: 0.7rem; color: #bbb; text-transform: uppercase; margin-bottom: 5px;">New Password (Leave blank to keep current)</label>
            <input type="password" id="p-password" class="form-input" placeholder="••••••••" style="width:100%; background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 12px; border-radius: 8px;">
          </div>
          
          <div style="display: flex; gap: 12px; position: sticky; bottom: 0; background: #121212; padding-top: 10px;">
            <button type="button" class="btn btn--ghost" id="profile-cancel" style="flex:1;">Cancel</button>
            <button type="submit" class="btn btn--primary" id="profile-save" style="flex:2;">Save Changes</button>
          </div>
        </form>
      `;

      document.getElementById("profile-cancel").onclick = close;

      document.getElementById("profile-form").onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById("p-email").value.trim();
        const phone = document.getElementById("p-phone").value.trim();
        const password = document.getElementById("p-password").value.trim();
        const saveBtn = document.getElementById("profile-save");

        setButtonLoading(saveBtn, true);
        const updateRes = await API.updateUserProfile({ user_id: userId, email, phone, password });
        setButtonLoading(saveBtn, false);

        if (updateRes.success) {
          toast("Profile updated successfully", "success");
          const session = Auth.getSession();
          if (session) {
            session.email = email;
            session.phone = phone;
            localStorage.setItem("ep_session", JSON.stringify(session));
          }
          close();
        } else {
          toast(updateRes.error || "Update failed", "error");
        }
      };
    } catch (err) {
      console.error("Profile modal error", err);
      toast("An unexpected error occurred", "error");
      close();
    }
  }

  return {
    toast,
    setButtonLoading,
    statusBadge,
    formatDateTime,
    formatDate,
    isToday,
    show,
    hide,
    renderTopbarUser,
    bindLogout,
    confirm,
    generateQR,
    timeRemaining,
    showProfileModal,
    downloadCSV,
  };
})();

function downloadCSV(filename, data) {
  if (!data || !data.length) return;
  const csvContent = data.map(row => 
    row.map(cell => {
      let s = String(cell === null || cell === undefined ? "" : cell).replace(/"/g, '""');
      if (s.search(/("|,|\n)/g) >= 0) s = `"${s}"`;
      return s;
    }).join(",")
  ).join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.UI = UI;
