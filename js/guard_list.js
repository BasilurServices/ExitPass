const session = Auth.requireAuth(["guard", "admin"]);
if (session) {
    UI.renderTopbarUser(session);
    UI.bindLogout();
}

// Modal State
let activePassId = null;
let proposedStatus = null;
let currentPassReturnRequired = "No";

// ── Real-time Clock ───────────────────────────────────────────
function startClock() {
    const timeEl = document.getElementById("clock-time");
    const dateEl = document.getElementById("clock-date");
    
    function update() {
        const now = new Date();
        if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
        if (dateEl) dateEl.textContent = now.toLocaleDateString('en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric' 
        });
    }
    update();
    setInterval(update, 1000);
}
startClock();

// ── Load All Passes ───────────────────────────────────────────
async function loadAllPasses() {
    const loading = document.getElementById("loading-state");
    const empty = document.getElementById("empty-state");
    const list = document.getElementById("passes-list");

    try {
        UI.show(loading);
        UI.hide(empty);
        UI.hide(list);

        // Fetch data simultaneously
        const [appRes, expRes, logRes] = await Promise.all([
            API.getApprovedPasses(),
            API.getExpectedReturns(),
            API.getGuardLog(30)
        ]);

        let upcoming = appRes.passes || [];
        let expected = expRes.passes || [];
        let history = logRes.entries || [];

        // Filter: Keep only today's relevant data (Today's calendar date)
        upcoming = upcoming.filter(p => UI.isToday(p.exit_from));
        expected = expected.filter(p => UI.isToday(p.exit_time));
        history = history.filter(e =>
            (e.exit_time && UI.isToday(e.exit_time)) ||
            (e.return_time && UI.isToday(e.return_time))
        );

        // De-duplicate history (since 'expected' or 'upcoming' ones might also appear in 'history' if we aren't strict)
        // Usually, getApprovedPasses and getExpectedReturns are disjoint. 
        // Log might contain RETURNED ones and EXITED ones. We only want history items that are NOT in upcoming or expected.
        const activeIds = new Set([...upcoming.map(p => p.pass_id), ...expected.map(p => p.pass_id)]);
        history = history.filter(h => !activeIds.has(h.pass_id));

        // Combine
        const allPasses = [
            ...upcoming.map(p => ({ ...p, _type: 'upcoming' })),
            ...expected.map(p => ({ ...p, _type: 'expected' })),
            ...history.map(p => ({ ...p, _type: 'history' }))
        ];

        if (allPasses.length === 0) {
            UI.show(empty);
            return;
        }

        // Sort: We want Active (Upcoming/Expected) on top, then History sorted by latest action
        allPasses.sort((a, b) => {
            const typeScore = { "upcoming": 0, "expected": 1, "history": 2 };
            if (typeScore[a._type] !== typeScore[b._type]) {
                return typeScore[a._type] - typeScore[b._type];
            }
            // Within same type, sort primarily by requested exit time or actual exit time
            const tA = new Date(a.exit_time || a.return_time || a.exit_from).getTime();
            const tB = new Date(b.exit_time || b.return_time || b.exit_from).getTime();
            return tB - tA;
        });

        renderList(allPasses);

    } catch (err) {
        console.error("loadAllPasses error:", err);
        UI.toast("Failed to load passes.", "error");
        UI.show(empty);
    } finally {
        UI.hide(loading);
    }
}

function renderList(passes) {
    const list = document.getElementById("passes-list");

    list.innerHTML = passes.map(p => {

        let typeClass = "log-entry--completed";
        let actionHTML = "";
        let metaText = "";

        // Determine presentation based on type
        if (p._type === 'upcoming') {
            typeClass = "log-entry--upcoming";
            metaText = `Requested Exit: ${UI.formatDateTime(p.exit_from)}`;
            actionHTML = `
            <div class="btn-action-wrapper" onclick="event.stopPropagation()">
              <button class="btn btn--primary btn--sm" onclick="markMovement('${p.pass_id}', 'EXITED', this)">
                [→] Exit
              </button>
            </div>`;
        }
        else if (p._type === 'expected') {
            typeClass = "log-entry--expected";
            
            // Duration calculation
            const exitTime = new Date(p.exit_time);
            const now = new Date();
            const diffMs = now - exitTime;
            const diffMins = Math.floor(diffMs / 60000);
            
            const isLate = diffMins > 90;
            typeClass = isLate ? "log-entry--late" : "log-entry--on-time";
            
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

            metaText = `Exited: ${UI.formatDateTime(p.exit_time)} · Duration: <strong>${durationText}</strong>`;
            actionHTML = `
            <div class="btn-action-wrapper" onclick="event.stopPropagation()">
              <button class="btn ${isLate ? 'btn--danger' : 'btn--success'} btn--sm" onclick="markMovement('${p.pass_id}', 'RETURNED', this)">
                [←] Return
              </button>
            </div>`;
        }
        else {
            // History (Completed)
            typeClass = "log-entry--completed";
            if (p.return_time) {
                metaText = `Returned: ${UI.formatDateTime(p.return_time)}`;
            } else {
                metaText = `Exited: ${UI.formatDateTime(p.exit_time)} (No Return Req.)`;
            }
        }

        // HTML builder
        // We pass the raw pass object as JSON to the click handler so we have current info
        const passDataObj = encodeURIComponent(JSON.stringify(p));

        return `
          <div class="log-entry ${typeClass}" 
               onmousedown="startPress(event, '${passDataObj}')" 
               onmouseup="endPress()" 
               onmouseleave="endPress()"
               ontouchstart="startPress(event, '${passDataObj}')" 
               ontouchend="endPress()" 
               ontouchcancel="endPress()">
            <div class="log-entry__content">
              <div class="log-entry__id">
                ${p.pass_id}
                <span class="log-entry__status-badge badge badge--${p.movement_status?.toLowerCase()}">${p.movement_status}</span>
              </div>
              <div class="log-entry__name">${p.employee_name || '—'}</div>
              <div class="log-entry__meta">${metaText}</div>
            </div>
            ${actionHTML ? `<div class="log-entry__action">${actionHTML}</div>` : ''}
          </div>
        `;
    }).join("");

    UI.show(list);
}

// ── Primary Actions ───────────────────────────────────────────
async function markMovement(passId, movement, btn) {
    if (!session) return;
    const guardName = session.name || "Guard";
    const actionLabel = movement === "EXITED" ? "Verify Exit" : "Verify Return";

    UI.setButtonLoading(btn, true, "Wait...");

    try {
        const res = await API.updateMovementStatus({
            pass_id: passId,
            movement: movement,
            guard_name: guardName
        });

        if (res.success) {
            UI.toast(`Pass ${passId} marked as ${movement}.`, "success");
            loadAllPasses(); // refresh list
        } else {
            UI.toast(res.error || "Failed to update status.", "error");
        }
    } catch (err) {
        console.error("markMovement error:", err);
        UI.toast("An error occurred.", "error");
    } finally {
        UI.setButtonLoading(btn, false, actionLabel);
    }
}

// ── Long Press Logic ──────────────────────────────────────────
let pressTimer;
let isPressing = false;
const PRESS_DURATION = 800; // milliseconds

function startPress(e, encodedPass) {
    // Don't trigger if clicked on a button or its container
    if (e.target.closest('.btn-action-wrapper')) return;

    isPressing = true;
    pressTimer = window.setTimeout(() => {
        if (isPressing) {
            openModal(encodedPass);
            // Optional: trigger haptic feedback if supported by device
            if (navigator.vibrate) navigator.vibrate(50);
        }
        isPressing = false;
    }, PRESS_DURATION);
}

function endPress() {
    isPressing = false;
    if (pressTimer) {
        window.clearTimeout(pressTimer);
    }
}

// ── Modal Actions (Status Override) ───────────────────────────
function openModal(encodedPass) {
    const p = JSON.parse(decodeURIComponent(encodedPass));
    activePassId = p.pass_id;
    currentPassReturnRequired = p.return_required || "No";
    proposedStatus = p.movement_status; // default to current

    document.getElementById("modal-pass-id").textContent = `Overriding ${p.pass_id} (${p.employee_name})`;

    // Toggle Return option visibility based on if return is required
    const optReturned = document.getElementById("opt-returned");
    if (currentPassReturnRequired === "Yes") {
        optReturned.style.display = "flex";
    } else {
        optReturned.style.display = "none";
    }

    selectStatus(proposedStatus); // highlight current visually

    document.getElementById("status-modal").classList.add("active");
}

function closeModal(e) {
    // If event passed (clicking overlay background), only close if clicked exactly on overlay
    if (e && e.target.id !== "status-modal") return;
    document.getElementById("status-modal").classList.remove("active");
}

function selectStatus(status) {
    proposedStatus = status;
    // Update UI visual selection
    document.querySelectorAll(".status-btn").forEach(btn => {
        if (btn.dataset.value === status) {
            btn.classList.add("selected");
        } else {
            btn.classList.remove("selected");
        }
    });
}

async function saveStatusOverride() {
    if (!session || !activePassId || !proposedStatus) return;

    const btn = document.getElementById("btn-save-status");
    const guardName = session.name || "Guard";

    UI.setButtonLoading(btn, true, "Saving...");

    try {
        const res = await API.revertMovementStatus({
            pass_id: activePassId,
            new_status: proposedStatus,
            guard_name: guardName
        });

        if (res.success) {
            UI.toast(`Status for ${activePassId} forcefully updated to ${proposedStatus}.`, "success");
            closeModal();
            loadAllPasses();
        } else {
            UI.toast(res.error || "Failed to override.", "error");
        }
    } catch (err) {
        console.error("saveStatusOverride error:", err);
        UI.toast("Network error.", "error");
    } finally {
        UI.setButtonLoading(btn, false, "Save Status");
    }
}

// ── Init ──────────────────────────────────────────────────────
if (session) {
    loadAllPasses();

    // Auto-refresh every 5 minutes (5 * 60 * 1000 ms)
    setInterval(() => {
        const modal = document.getElementById("status-modal");
        const isModalActive = modal && modal.classList.contains("active");

        if (!isModalActive) {
            console.log("Auto-refreshing guard list...");
            loadAllPasses();
        }
    }, 5 * 60 * 1000);
}
