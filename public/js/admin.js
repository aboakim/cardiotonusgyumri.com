const loginCard = document.querySelector("#login-card");
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const dashboard = document.querySelector("#dashboard");
const title = document.querySelector("#dash-title");
const count = document.querySelector("#dash-count");
const dateInput = document.querySelector("#admin-date");
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
  button.textContent = "Չեղարկել";
  button.addEventListener("click", () => cancelAppointment(item));
  return button;
}

function renderSchedule() {
  schedule.replaceChildren();
  if (!currentData) return;
  const query = searchInput.value.trim();
  const booked = currentData.appointments.filter(matchesSearch);
  const free = currentData.selectedDate === "all"
    ? 0
    : currentData.slots.filter((slot) => !slot.appointment).length;
  count.textContent = currentData.selectedDate === "all"
    ? `${booked.length} գրանցում`
    : `${currentData.appointments.length} գրանցված · ${free} ազատ`;

  if (currentData.selectedDate === "all") {
    staffForm.hidden = true;
    empty.hidden = booked.length > 0;
    empty.textContent = query ? "Այդպիսի գրանցում չկա։" : "Գրանցումներ դեռ չկան։";
    if (booked.length) appendPeopleTable(booked, true);
    return;
  }

  const canAdd = currentData.workingDay && currentData.selectedDate >= todayIso();
  staffForm.hidden = !canAdd;
  staffNote.textContent = canAdd
    ? "Ազատ ժամը կրկին բացվում է, երբ գրանցումը չեղարկում եք։"
    : "Այս օրը աշխատանքային չէ կամ արդեն անցել է։";
  staffTime.replaceChildren();
  currentData.slots.filter((slot) => !slot.appointment).forEach((slot) => {
    const option = document.createElement("option");
    option.value = slot.time;
    option.textContent = slot.time;
    staffTime.appendChild(option);
  });
  staffForm.querySelector("button").disabled = staffTime.options.length === 0;

  empty.hidden = booked.length > 0;
  empty.textContent = query ? "Այդպիսի գրանցում չկա։" : "Այս օրվա համար գրանցում չկա։";
  if (booked.length) appendPeopleTable(booked, false);
  const freeTimes = currentData.slots.filter((slot) => !slot.appointment).map((slot) => slot.time);
  if (!query && freeTimes.length) {
    const note = document.createElement("p");
    note.className = "empty";
    note.textContent = `Ազատ ժամեր՝ ${freeTimes.join(", ")}`;
    schedule.appendChild(note);
  }
}

function appendPeopleTable(items, includeDate) {
  const table = document.createElement("table");
  const head = document.createElement("tr");
  ["Ժամ", "Անուն", "Ազգանուն", "Հեռախոս", ""].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    head.appendChild(th);
  });
  const thead = document.createElement("thead");
  thead.appendChild(head);
  const tbody = document.createElement("tbody");
  items.forEach((item) => {
    const row = document.createElement("tr");
    const time = document.createElement("td");
    time.textContent = includeDate ? `${item.date} ${item.time}` : item.time;
    const first = document.createElement("td");
    first.className = "name-cell";
    first.textContent = item.firstName;
    const last = document.createElement("td");
    last.className = "name-cell";
    last.textContent = item.lastName;
    const phone = document.createElement("td");
    phone.appendChild(phoneLink(item.phone));
    const action = document.createElement("td");
    action.appendChild(cancelButton(item));
    row.append(time, first, last, phone, action);
    tbody.appendChild(row);
  });
  table.append(thead, tbody);
  schedule.appendChild(table);
}

function todayIso() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Yerevan",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts;
}

async function loadAppointments(date) {
  currentFilter = date || "";
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const response = await fetch(`/api/admin/appointments${query}`, { credentials: "same-origin" });
  if (response.status === 401) {
    dashboard.hidden = true;
    loginCard.hidden = false;
    return;
  }
  const data = await response.json();
  if (!response.ok) {
    showError(adminError, data.error || "Ցանկը չբեռնվեց։");
    return;
  }
  loginCard.hidden = true;
  dashboard.hidden = false;
  currentData = data;
  title.textContent = data.dateLabel;
  if (data.selectedDate !== "all") dateInput.value = data.selectedDate;
  renderSchedule();
}

async function cancelAppointment(item) {
  const confirmed = window.confirm(`Չեղարկե՞լ ${item.time} այցը՝ ${item.firstName} ${item.lastName}։`);
  if (!confirmed) return;
  const response = await fetch(`/api/admin/appointments/${item.id}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    showError(adminError, data.error || "Չեղարկումը չհաջողվեց։");
    return;
  }
  showError(adminError, "");
  await loadAppointments(currentFilter || dateInput.value);
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
    showError(loginError, data.error || "Մուտքը չհաջողվեց։");
    return;
  }
  loginForm.reset();
  await loadAppointments();
});

staffForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(staffError, "");
  const response = await fetch("/api/admin/appointments", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: dateInput.value,
      time: staffTime.value,
      firstName: staffForm.firstName.value,
      lastName: staffForm.lastName.value,
      phone: staffForm.phone.value,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    showError(staffError, data.error || "Գրանցումը չհաջողվեց։");
    return;
  }
  staffForm.reset();
  showError(staffError, "");
  await loadAppointments(dateInput.value);
});

dateInput.addEventListener("change", () => {
  if (dateInput.value) loadAppointments(dateInput.value);
});
searchInput.addEventListener("input", renderSchedule);
document.querySelector("#show-all").addEventListener("click", () => loadAppointments("all"));
document.querySelector("#logout").addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
  dashboard.hidden = true;
  loginCard.hidden = false;
  currentData = null;
});

loadAppointments().catch(() => {
  showError(loginError, "Կապը չհաջողվեց։");
});
