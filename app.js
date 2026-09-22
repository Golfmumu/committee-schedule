import { firebaseConfig } from "./firebase-config.js";
import { DATES, HOURS, SEATS_PER_SLOT, hourLabel, formatDutyDate } from "./duty-slots.js";

const headerRow = document.getElementById("header-row");
const boardBody = document.getElementById("board-body");
const filledCountEl = document.getElementById("filled-count");
const totalCountEl = document.getElementById("total-count");
const messageEl = document.getElementById("message");
const nameForm = document.getElementById("name-form");
const firstInput = document.getElementById("first");
const lastInput = document.getElementById("last");
const setupNotice = document.getElementById("setup-notice");

totalCountEl.textContent = String(DATES.length * HOURS.length * SEATS_PER_SLOT);

// { "<date>_<hour>_<seat>": { firstName, lastName } }
let seats = {};
let pending = false;

function setMessage(text, ok) {
  messageEl.textContent = text;
  messageEl.className = ok ? "ok" : "err";
}

function seatId(date, hour, seat) {
  return `${date}_${hour}_${seat}`;
}

function buildTable() {
  for (const h of HOURS) {
    const th = document.createElement("th");
    th.textContent = hourLabel(h);
    headerRow.appendChild(th);
  }

  for (const date of DATES) {
    const { label, weekday } = formatDutyDate(date);
    const tr = document.createElement("tr");

    const th = document.createElement("th");
    th.scope = "row";
    th.innerHTML = `${label}<span class="weekday">${weekday}</span>`;
    tr.appendChild(th);

    for (const h of HOURS) {
      const td = document.createElement("td");
      td.dataset.date = date;
      td.dataset.hour = String(h);
      for (let seat = 1; seat <= SEATS_PER_SLOT; seat++) {
        const cell = document.createElement("div");
        cell.className = "seat";
        cell.dataset.seatId = seatId(date, h, seat);
        td.appendChild(cell);
      }
      tr.appendChild(td);
    }
    boardBody.appendChild(tr);
  }
}

function renderSeats() {
  let filled = 0;
  for (const date of DATES) {
    for (const h of HOURS) {
      for (let seat = 1; seat <= SEATS_PER_SLOT; seat++) {
        const id = seatId(date, h, seat);
        const cell = boardBody.querySelector(`[data-seat-id="${id}"]`);
        if (!cell) continue;
        const entry = seats[id];
        cell.innerHTML = "";
        if (entry) {
          filled++;
          const name = `${entry.firstName} ${entry.lastName}`;
          const wrap = document.createElement("div");
          wrap.className = "taken";
          wrap.innerHTML = `
            <span class="name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
            <button type="button" aria-label="ยกเลิกการลงชื่อ ${escapeHtml(name)}">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                <path d="M3 3l8 8M11 3l-8 8" />
              </svg>
            </button>`;
          const btn = wrap.querySelector("button");
          btn.disabled = pending;
          btn.addEventListener("click", () => cancelSeat(id, name));
          cell.appendChild(wrap);
        } else {
          const { label } = formatDutyDate(date);
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "add-seat";
          btn.textContent = "+ ลงชื่อ";
          btn.disabled = pending;
          btn.setAttribute("aria-label", `ลงชื่อ ${label} เวลา ${hourLabel(h)}`);
          btn.addEventListener("click", () => signUp(date, h));
          cell.appendChild(btn);
        }
      }
    }
  }
  filledCountEl.textContent = String(filled);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function cleanName(v) {
  return v.replace(/\s+/g, " ").trim().slice(0, 60);
}

let db, doc, setDoc, deleteDoc, onSnapshot, collection, serverTimestamp;

async function signUp(date, hour) {
  const first = cleanName(firstInput.value);
  const last = cleanName(lastInput.value);
  if (!first || !last) {
    setMessage("กรุณากรอกทั้งชื่อและนามสกุลก่อนลงชื่อ", false);
    return;
  }
  const name = `${first} ${last}`;

  // Already signed up for this exact slot?
  for (let seat = 1; seat <= SEATS_PER_SLOT; seat++) {
    const existing = seats[seatId(date, hour, seat)];
    if (existing && existing.firstName === first && existing.lastName === last) {
      setMessage(`${name} ลงชื่อในช่วงเวลานี้แล้ว`, false);
      return;
    }
  }

  pending = true;
  renderSeats();
  try {
    let lastError = null;
    for (let seat = 1; seat <= SEATS_PER_SLOT; seat++) {
      const id = seatId(date, hour, seat);
      try {
        await setDoc(doc(collection(db, "duty_signups"), id), {
          date,
          hour,
          firstName: first,
          lastName: last,
          createdAt: serverTimestamp(),
        });
        setMessage(`ลงชื่อ ${name} เรียบร้อย`, true);
        return;
      } catch (err) {
        lastError = err;
        // permission-denied here means that seat id is already taken
        // (or, if both seats are taken, the slot is full) — try the
        // next seat before giving up.
      }
    }
    if (lastError && lastError.code === "permission-denied") {
      setMessage("ช่วงเวลานี้เต็มแล้ว", false);
    } else {
      setMessage("ลงชื่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", false);
    }
  } finally {
    pending = false;
    renderSeats();
  }
}

async function cancelSeat(id, name) {
  pending = true;
  renderSeats();
  try {
    await deleteDoc(doc(collection(db, "duty_signups"), id));
    setMessage(`ยกเลิกการลงชื่อ ${name} แล้ว`, true);
  } catch {
    setMessage("ยกเลิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", false);
  } finally {
    pending = false;
    renderSeats();
  }
}

nameForm.addEventListener("submit", (e) => e.preventDefault());

buildTable();
renderSeats();

if (String(firebaseConfig.apiKey || "").startsWith("PASTE_")) {
  setupNotice.hidden = false;
} else {
  init();
}

async function init() {
  try {
    const [{ initializeApp }, firestore] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js"),
    ]);
    ({ doc, setDoc, deleteDoc, onSnapshot, collection, serverTimestamp } = firestore);
    const app = initializeApp(firebaseConfig);
    db = firestore.getFirestore(app);

    onSnapshot(
      collection(db, "duty_signups"),
      (snap) => {
        const next = {};
        snap.forEach((d) => {
          const data = d.data();
          next[d.id] = { firstName: data.firstName, lastName: data.lastName };
        });
        seats = next;
        renderSeats();
      },
      () => setMessage("เชื่อมต่อฐานข้อมูลไม่สำเร็จ กรุณารีเฟรชหน้า", false),
    );
  } catch {
    setMessage("โหลด Firebase ไม่สำเร็จ ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต", false);
  }
}
