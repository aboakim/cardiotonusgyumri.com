const passwordInput = document.querySelector("#password");
const togglePassword = document.querySelector("#toggle-password");
togglePassword.addEventListener("click", () => {
  const visible = passwordInput.type === "password";
  passwordInput.type = visible ? "text" : "password";
  togglePassword.setAttribute("aria-pressed", visible ? "true" : "false");
  togglePassword.setAttribute("aria-label", I18N.t(visible ? "hidePassword" : "showPassword"));
  togglePassword.querySelector(".eye-open").hidden = visible;
  togglePassword.querySelector(".eye-shut").hidden = !visible;
  passwordInput.focus();
});

const loginCard = document.querySelector("#login-card");
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const dashboard = document.querySelector("#dashboard");
const title = document.querySelector("#dash-title");
const count = document.querySelector("#dash-count");
const dayLabel = document.querySelector("#day-label");
const searchInput = document.querySelector("#admin-search");
const schedule = document.querySelector("#schedule-wrap");
const empty = document.querySelector("#empty-state");
const adminError = document.querySelector("#admin-error");
const staffForm = document.querySelector("#staff-form");
const staffTime = document.querySelector("#staff-time");
const staffNote = document.querySelector("#staff-note");
const staffError = document.querySelector("#staff-error");

let currentFilter = "";
let currentData = null;
let freshIds = new Set();
let refreshBusy = false;

function showError(node, message) {
  node.hidden = !message;
  node.textContent = message || "";
}

function matchesSearch(item) {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return true;
  if (!item) return false;
  return `${item.firstName} ${item.lastName} ${item.phone}`.toLowerCase().includes(query);
}

function phoneLink(phone) {
  const link = document.createElement("a");
  link.href = `tel:${phone.replace(/\s/g, "")}`;
  link.textContent = phone;
  return link;
}

function cancelButton(item) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "linkish";
  button.textContent = I18N.t("cancel");
  button.addEventListener("click", () => cancelAppointment(item));
  return button;
}

function listStamp(data) {
  if (!data) return "";
  return data.appointments
    .map((item) => [item.id, item.date, item.time, item.firstName, item.lastName, item.phone].join("|"))
    .join("\n");
}

function renderSchedule() {
  const keptTime = staffTime.value;
  schedule.replaceChildren();
  if (!currentData) return;
  const query = searchInput.value.trim();
  const booked = currentData.appointments.filter(matchesSearch);
  const free = currentData.selectedDate === "all"
    ? 0
    : currentData.slots.filter((slot) => !slot.appointment).length;
  count.textContent = currentData.selectedDate === "all"
    ? I18N.t("countAll", { count: booked.length })
    : I18N.t("countDay", { booked: currentData.appointments.length, free });

  if (currentData.selectedDate === "all") {
    staffForm.hidden = true;
    empty.hidden = booked.length > 0;
    empty.textContent = query ? I18N.t("emptySearch") : I18N.t("emptyAll");
    if (booked.length) appendPeopleList(booked, true);
    return;
  }

  const canAdd = currentData.workingDay && currentData.selectedDate >= todayIso();
  staffForm.hidden = !canAdd;
  staffNote.textContent = canAdd ? I18N.t("staffOpen") : I18N.t("staffClosed");
  staffTime.replaceChildren();
  currentData.slots.filter((slot) => !slot.appointment).forEach((slot) => {
    const option = document.createElement("option");
    option.value = slot.time;
    option.textContent = slot.time;
    staffTime.appendChild(option);
  });
  staffForm.querySelector("button").disabled = staffTime.options.length === 0;
  if (keptTime && [...staffTime.options].some((option) => option.value === keptTime)) {
    staffTime.value = keptTime;
  }

  empty.hidden = booked.length > 0;
  empty.textContent = query ? I18N.t("emptySearch") : I18N.t("emptyDay");
  if (booked.length) appendPeopleList(booked, false);
  const freeTimes = currentData.slots.filter((slot) => !slot.appointment).map((slot) => slot.time);
  if (!query && freeTimes.length) {
    const note = document.createElement("p");
    note.className = "empty";
    note.textContent = I18N.t("freeTimes", { times: freeTimes.join(", ") });
    schedule.appendChild(note);
  }
}

function shortDate(iso) {
  const normal = normalizeIso(iso);
  if (!normal) return iso || "";
  const [year, month, day] = normal.split("-");
  return `${day}.${month}.${year}`;
}

function appendPeopleList(items, includeDate) {
  const list = document.createElement("div");
  list.className = "visit-list";
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "visit-card";
    if (freshIds.has(item.id)) card.classList.add("row-fresh");
    const main = document.createElement("div");
    main.className = "visit-main";
    const time = document.createElement("strong");
    time.className = "visit-time";
    time.textContent = includeDate ? `${shortDate(item.date)} ${item.time}` : item.time;
    const who = document.createElement("div");
    who.className = "visit-who";
    const name = document.createElement("p");
    name.className = "visit-name";
    name.textContent = `${item.firstName} ${item.lastName}`;
    const phone = phoneLink(item.phone);
    phone.className = "visit-phone";
    who.append(name, phone);
    main.append(time, who);
    card.append(main, cancelButton(item));
    list.appendChild(card);
  });
  schedule.appendChild(list);
  const freshRow = list.querySelector(".row-fresh");
  const typing = staffForm.contains(document.activeElement) || document.activeElement === searchInput;
  if (freshRow && !typing) freshRow.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function todayIso() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Yerevan",
    calendar: "gregory",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const read = (type) => parts.find((part) => part.type === type).value;
  let year = Number(read("year"));
  if (year >= 2400) year -= 543;
  return `${year}-${read("month").padStart(2, "0")}-${read("day").padStart(2, "0")}`;
}

function normalizeIso(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  let year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year >= 2400) year -= 543;
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return "";
  return check.toISOString().slice(0, 10);
}

function shiftIso(iso, days) {
  const normal = normalizeIso(iso) || todayIso();
  const [year, month, day] = normal.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function showDayLabel(selected) {
  const iso = selected === "all" ? "all" : normalizeIso(selected);
  if (!iso || iso === "all") {
    dayLabel.textContent = I18N.t("allDays");
    title.textContent = I18N.t("allDays");
    return;
  }
  const pretty = I18N.formatDate(iso);
  dayLabel.textContent = pretty;
  title.textContent = iso === todayIso() ? I18N.t("todayBookings") : pretty;
}

async function loadAppointments(date, options = {}) {
  const quiet = Boolean(options.quiet);
  currentFilter = date || "";
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const response = await fetch(`/api/admin/appointments${query}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (response.status === 401) {
    dashboard.hidden = true;
    loginCard.hidden = false;
    currentData = null;
    freshIds = new Set();
    return;
  }
  const data = await response.json();
  if (!response.ok) {
    if (!quiet) showError(adminError, data.error || I18N.t("listFail"));
    return;
  }
  const nextStamp = listStamp(data);
  if (quiet && currentData && nextStamp === listStamp(currentData) && data.selectedDate === currentData.selectedDate) {
    return;
  }
  const previousIds = quiet && currentData
    ? new Set(currentData.appointments.map((item) => item.id))
    : null;
  freshIds = previousIds
    ? new Set(data.appointments.filter((item) => !previousIds.has(item.id)).map((item) => item.id))
    : new Set();
  loginCard.hidden = true;
  dashboard.hidden = false;
  currentData = data;
  showDayLabel(data.selectedDate);
  renderSchedule();
}

async function refreshQuiet() {
  if (dashboard.hidden || document.hidden || refreshBusy) return;
  refreshBusy = true;
  try {
    await loadAppointments(currentFilter || todayIso(), { quiet: true });
  } catch {
  } finally {
    refreshBusy = false;
  }
}

async function cancelAppointment(item) {
  const confirmed = window.confirm(I18N.t("cancelVisit", {
    time: item.time,
    name: `${item.firstName} ${item.lastName}`,
  }));
  if (!confirmed) return;
  const response = await fetch(`/api/admin/appointments/${item.id}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    showError(adminError, data.error || I18N.t("cancelFail"));
    return;
  }
  showError(adminError, "");
  await loadAppointments(currentFilter || todayIso());
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(loginError, "");
  const response = await fetch("/api/admin/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: loginForm.password.value }),
  });
  const data = await response.json();
  if (!response.ok) {
    showError(loginError, data.error || I18N.t("loginFail"));
    return;
  }
  loginForm.reset();
  await loadAppointments(todayIso());
});

staffForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(staffError, "");
  const response = await fetch("/api/admin/appointments", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: currentData && currentData.selectedDate !== "all" ? currentData.selectedDate : todayIso(),
      time: staffTime.value,
      firstName: staffForm.firstName.value,
      lastName: staffForm.lastName.value,
      phone: staffForm.phone.value,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    showError(staffError, data.error || I18N.t("bookFail"));
    return;
  }
  staffForm.reset();
  showError(staffError, "");
  await loadAppointments(currentData && currentData.selectedDate !== "all" ? currentData.selectedDate : todayIso());
});

document.querySelector("#day-prev").addEventListener("click", () => {
  const base = currentData && currentData.selectedDate !== "all" ? currentData.selectedDate : todayIso();
  loadAppointments(shiftIso(base, -1));
});
document.querySelector("#day-next").addEventListener("click", () => {
  const base = currentData && currentData.selectedDate !== "all" ? currentData.selectedDate : todayIso();
  loadAppointments(shiftIso(base, 1));
});
document.querySelector("#day-today").addEventListener("click", () => loadAppointments(todayIso()));
searchInput.addEventListener("input", renderSchedule);
document.querySelector("#show-all").addEventListener("click", () => loadAppointments("all"));
document.querySelector("#logout").addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
  dashboard.hidden = true;
  loginCard.hidden = false;
  currentData = null;
});

loadAppointments(todayIso()).catch(() => {
  showError(loginError, I18N.t("network"));
});

window.setInterval(refreshQuiet, 3000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshQuiet();
});

window.addEventListener("cardiotonus-lang", () => {
  const visible = passwordInput.type === "text";
  togglePassword.setAttribute("aria-label", I18N.t(visible ? "hidePassword" : "showPassword"));
  if (!currentData) return;
  showDayLabel(currentData.selectedDate);
  renderSchedule();
  loadAppointments(currentFilter || todayIso());
});
