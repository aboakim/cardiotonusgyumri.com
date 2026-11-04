const passwordInput = document.querySelector("#password");
const togglePassword = document.querySelector("#toggle-password");
if (passwordInput && togglePassword) {
  togglePassword.addEventListener("click", () => {
    const visible = passwordInput.type === "password";
    passwordInput.type = visible ? "text" : "password";
    togglePassword.setAttribute("aria-pressed", visible ? "true" : "false");
    togglePassword.setAttribute("aria-label", I18N.t(visible ? "hidePassword" : "showPassword"));
    togglePassword.querySelector(".eye-open").hidden = visible;
    togglePassword.querySelector(".eye-shut").hidden = !visible;
    passwordInput.focus();
  });
}

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
  const text = phone ? String(phone) : "";
  const link = document.createElement("a");
  link.href = "tel:" + text.replace(/\s/g, "");
  link.textContent = text;
  return link;
}

function clearNode(node) {
  if (!node) return;
  while (node.firstChild) node.removeChild(node.firstChild);
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
  clearNode(schedule);
  if (!currentData) return;
  const query = searchInput.value.trim();
  const appointments = currentData.appointments || [];
  const slots = currentData.slots || [];
  const booked = appointments.filter(matchesSearch);
  const free = currentData.selectedDate === "all"
    ? 0
    : slots.filter((slot) => !slot.appointment).length;
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

  const canAdd = currentData.workingDay && serverToday && currentData.selectedDate >= serverToday;
  staffForm.hidden = !canAdd;
  staffNote.textContent = canAdd ? I18N.t("staffOpen") : I18N.t("staffClosed");
  clearNode(staffTime);
  slots.filter((slot) => !slot.appointment).forEach((slot) => {
    const option = document.createElement("option");
    option.value = slot.time;
    option.textContent = slot.time;
    staffTime.appendChild(option);
  });
  staffForm.querySelector("button").disabled = staffTime.options.length === 0;
  if (keptTime) {
    for (let index = 0; index < staffTime.options.length; index += 1) {
      if (staffTime.options[index].value === keptTime) {
        staffTime.value = keptTime;
        break;
      }
    }
  }

  empty.hidden = booked.length > 0;
  empty.textContent = query ? I18N.t("emptySearch") : I18N.t("emptyDay");
  if (booked.length) appendPeopleList(booked, false);
  const freeTimes = slots.filter((slot) => !slot.appointment).map((slot) => slot.time);
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
    card.className = "booking-row";
    if (freshIds.has(item.id)) card.classList.add("row-fresh");
    const time = document.createElement("strong");
    time.className = "booking-time";
    time.textContent = includeDate ? `${shortDate(item.date)} ${item.time}` : item.time;
    const who = document.createElement("div");
    who.className = "booking-who";
    const name = document.createElement("p");
    name.className = "booking-name";
    name.textContent = `${item.firstName} ${item.lastName}`;
    const phone = phoneLink(item.phone);
    phone.className = "booking-phone";
    who.appendChild(name);
    who.appendChild(phone);
    card.appendChild(time);
    card.appendChild(who);
    card.appendChild(cancelButton(item));
    list.appendChild(card);
  });
  schedule.appendChild(list);
  const freshRow = list.querySelector(".row-fresh");
  const typing = staffForm.contains(document.activeElement) || document.activeElement === searchInput;
  if (freshRow && !typing) freshRow.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

let serverToday = "";

function pad2(value) {
  return value < 10 ? `0${value}` : String(value);
}

function daysInMonth(year, month) {
  const lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) return 29;
  return lengths[month - 1] || 0;
}

function todayIso() {
  return serverToday;
}

function normalizeIso(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  let year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year >= 2400) year -= 543;
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return "";
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function shiftIso(iso, days) {
  const normal = normalizeIso(iso) || serverToday;
  if (!normal) return "";
  const parts = normal.split("-");
  let year = Number(parts[0]);
  let month = Number(parts[1]);
  let day = Number(parts[2]) + days;
  while (day > daysInMonth(year, month)) {
    day -= daysInMonth(year, month);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  while (day < 1) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    day += daysInMonth(year, month);
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
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
    if (loginCard) loginCard.hidden = false;
    dashboard.hidden = true;
    currentData = null;
    freshIds = new Set();
    return;
  }
  const data = await response.json();
  if (!response.ok) {
    if (!quiet) showError(adminError, data.error || I18N.t("listFail"));
    return;
  }
  if (data.today) serverToday = data.today;
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
  if (loginCard) loginCard.hidden = true;
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
const logoutButton = document.querySelector("#logout");
if (logoutButton && loginCard) {
  logoutButton.addEventListener("click", async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    dashboard.hidden = true;
    loginCard.hidden = false;
    currentData = null;
  });
}

loadAppointments("").catch(() => {
  showError(loginError, I18N.t("network"));
});

window.setInterval(refreshQuiet, 3000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshQuiet();
});

window.addEventListener("cardiotonus-lang", () => {
  if (passwordInput && togglePassword) {
    const visible = passwordInput.type === "text";
    togglePassword.setAttribute("aria-label", I18N.t(visible ? "hidePassword" : "showPassword"));
  }
  if (!currentData) return;
  showDayLabel(currentData.selectedDate);
  renderSchedule();
  loadAppointments(currentFilter || todayIso());
});
