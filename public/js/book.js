const dateNode = document.querySelector("#booking-date");
const countNode = document.querySelector("#booking-count");
const grid = document.querySelector("#slot-grid");
const slotsMessage = document.querySelector("#slots-message");
const form = document.querySelector("#booking-form");
const errorNode = document.querySelector("#form-error");
const chosen = document.querySelector("#chosen-time");
const submit = document.querySelector("#submit-booking");
const success = document.querySelector("#booking-success");
const successCopy = document.querySelector("#success-copy");
const bookingCard = document.querySelector("#booking-card");
const legend = document.querySelector(".legend");
const demoBanner = document.querySelector("#demo-banner");

const codeForm = document.querySelector("#code-form");
const codeError = document.querySelector("#code-error");
const bookingView = document.querySelector("#booking-view");
const mineView = document.querySelector("#mine-view");
const showMine = document.querySelector("#show-mine");
const showBook = document.querySelector("#show-book");
const minePhoneForm = document.querySelector("#mine-phone-form");
const mineResult = document.querySelector("#mine-result");
const mineEmpty = document.querySelector("#mine-empty");
const mineCard = document.querySelector("#mine-card");
const mineWho = document.querySelector("#mine-who");
const mineWhen = document.querySelector("#mine-when");
const mineSlots = document.querySelector("#mine-slots");
const mineActionError = document.querySelector("#mine-action-error");

let schedule = null;
let previewOnly = false;
let selectedTime = new URLSearchParams(location.search).get("time");
let draft = null;
let minePhone = "";
let otpRequest = null;

function listenForSmsCode() {
  if (!("OTPCredential" in window) || !navigator.credentials?.get) return;
  otpRequest?.abort();
  const controller = new AbortController();
  otpRequest = controller;
  navigator.credentials.get({
    otp: { transport: ["sms"] },
    signal: controller.signal,
  }).then((otp) => {
    if (!otp?.code || codeForm.hidden) return;
    codeForm.code.value = otp.code;
    codeForm.requestSubmit();
  }).catch(() => {});
}

if (window.matchMedia("(pointer: coarse)").matches) {
  document.querySelectorAll("input").forEach((field) => {
    field.addEventListener("focus", () => {
      window.setTimeout(() => {
        field.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 280);
    });
  });
}

function showError(node, message) {
  node.hidden = !message;
  node.textContent = message || "";
}

function activeSlots() {
  if (!schedule.open && schedule.preview) return schedule.preview.slots;
  return schedule.slots;
}

function renderSlots() {
  grid.replaceChildren();
  previewOnly = !schedule.open && Boolean(schedule.preview);
  const slots = activeSlots();
  dateNode.textContent = previewOnly ? `${schedule.preview.dateLabel} · օրինակ` : schedule.dateLabel;
  demoBanner.hidden = !previewOnly;
  if (previewOnly) {
    demoBanner.textContent = `Դեմո։ վաղը՝ ${schedule.dateLabel}, գրանցել հնարավոր չէ։ Ներքևում ${schedule.preview.dateLabel} օրվա օրինակն է. զբաղված ժամերը փակ են։`;
  }
  if (!schedule.open && !previewOnly) {
    countNode.textContent = schedule.opensAt ? `Կբացվի ժամը ${schedule.opensAt}-ին` : "Ընդունելություն չկա";
    legend.hidden = true;
    grid.hidden = true;
    bookingCard.hidden = true;
    showError(slotsMessage, schedule.closedMessage);
    return;
  }
  legend.hidden = false;
  grid.hidden = false;
  bookingCard.hidden = false;
  const freeCount = slots.filter((slot) => !slot.taken).length;
  countNode.textContent = previewOnly
    ? `Օրինակ՝ ազատ է ${freeCount} տեղ 15-ից`
    : freeCount
      ? `Ազատ է ${freeCount} տեղ 15-ից`
      : "Բոլոր 15 տեղերը զբաղված են";

  slots.forEach((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot";
    button.disabled = slot.taken;
    button.setAttribute("aria-pressed", !slot.taken && slot.time === selectedTime ? "true" : "false");
    const time = document.createElement("span");
    time.textContent = slot.time;
    const note = document.createElement("small");
    note.textContent = slot.taken ? "Զբաղված" : "30 րոպե";
    button.append(time, note);
    button.addEventListener("click", () => {
      selectedTime = slot.time;
      chosen.textContent = `Ընտրված ժամը՝ ${slot.time}`;
      submit.disabled = false;
      showError(errorNode, "");
      renderSlots();
      if (window.matchMedia("(max-width: 900px)").matches) {
        bookingCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    grid.appendChild(button);
  });

  if (!slots.some((slot) => slot.time === selectedTime && !slot.taken)) {
    selectedTime = null;
    chosen.textContent = "Ժամը դեռ ընտրված չէ";
    submit.disabled = true;
  } else {
    chosen.textContent = `Ընտրված ժամը՝ ${selectedTime}`;
    submit.disabled = false;
  }
  showError(slotsMessage, freeCount || previewOnly ? "" : "Վաղվա համար ազատ տեղ չի մնացել։");
}

async function loadSlots() {
  const response = await fetch("/api/slots");
  if (!response.ok) throw new Error("slots");
  schedule = await response.json();
  renderSlots();
}

function draftBody() {
  return {
    date: schedule.date,
    time: selectedTime,
    firstName: form.firstName.value,
    lastName: form.lastName.value,
    phone: form.phone.value,
  };
}

async function requestCode() {
  showError(errorNode, "");
  if (previewOnly) {
    showError(errorNode, "Սա միայն օրինակ է։ Գրանցումը կբացվի աշխատանքային օրվանից առաջ։");
    submit.disabled = false;
    return;
  }
  if (!selectedTime || !schedule) {
    showError(errorNode, "Ընտրեք ազատ ժամը։");
    return;
  }
  submit.disabled = true;
  draft = draftBody();
  try {
    const response = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await response.json();
    if (!response.ok) {
      showError(errorNode, data.error || "Գրանցումը չհաջողվեց։");
      if (data.field && form.elements[data.field]) form.elements[data.field].focus();
      if (response.status === 409) await loadSlots();
      else submit.disabled = false;
      return;
    }
    form.hidden = true;
    success.hidden = false;
    successCopy.textContent = `${data.appointment.firstName} ${data.appointment.lastName}, ${data.appointment.dateLabel}, ժամը ${data.appointment.time}։ Խնդրում ենք ներկայանալ Cardiotonus կլինիկա՝ Գարեգին Նժդեհ 5/8։`;
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch {
    showError(errorNode, "Կապը չհաջողվեց։ Կրկին փորձեք։");
    submit.disabled = false;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  requestCode();
});

document.querySelector("#resend-code").addEventListener("click", () => {
  form.hidden = false;
  codeForm.hidden = true;
  submit.disabled = false;
  requestCode();
});

codeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(codeError, "");
  const button = codeForm.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    const response = await fetch("/api/book/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, code: codeForm.code.value }),
    });
    const data = await response.json();
    if (!response.ok) {
      showError(codeError, data.error || "Հաստատումը չհաջողվեց։");
      button.disabled = false;
      return;
    }
    codeForm.hidden = true;
    success.hidden = false;
    successCopy.textContent = `${data.appointment.firstName} ${data.appointment.lastName}, ${data.appointment.dateLabel}, ժամը ${data.appointment.time}։ Խնդրում ենք ներկայանալ Cardiotonus կլինիկա՝ Գարեգին Նժդեհ 5/8։`;
  } catch {
    showError(codeError, "Կապը չհաջողվեց։ Կրկին փորձեք։");
    button.disabled = false;
  }
});

function showBooking() {
  bookingView.hidden = false;
  mineView.hidden = true;
  showMine.hidden = false;
  showBook.hidden = true;
}

function showMinePanel() {
  bookingView.hidden = true;
  mineView.hidden = false;
  showMine.hidden = true;
  showBook.hidden = false;
}

showMine.addEventListener("click", showMinePanel);
showBook.addEventListener("click", showBooking);

function renderMine(data) {
  mineResult.hidden = false;
  showError(mineActionError, "");
  if (!data.found) {
    mineEmpty.hidden = false;
    mineCard.hidden = true;
    return;
  }
  mineEmpty.hidden = true;
  mineCard.hidden = false;
  mineWho.textContent = `${data.appointment.firstName} ${data.appointment.lastName}`;
  mineWhen.textContent = `${data.appointment.dateLabel}, ժամը ${data.appointment.time}`;
  mineSlots.replaceChildren();
  data.slots.forEach((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot";
    button.disabled = slot.taken || slot.current;
    const time = document.createElement("span");
    time.textContent = slot.time;
    const note = document.createElement("small");
    note.textContent = slot.current ? "Ձեր ժամը" : slot.taken ? "Զբաղված" : "Ընտրել";
    button.append(time, note);
    if (!slot.taken && !slot.current) {
      button.addEventListener("click", () => moveMine(slot.time));
    }
    mineSlots.appendChild(button);
  });
}

async function loadMine() {
  const response = await fetch("/api/mine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: minePhone }),
  });
  const data = await response.json();
  if (!response.ok) {
    showError(mineActionError, data.error || "Չհաջողվեց բեռնել։");
    return;
  }
  renderMine(data);
}

minePhoneForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(document.querySelector("#mine-phone-error"), "");
  minePhone = minePhoneForm.phone.value;
  const response = await fetch("/api/mine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: minePhone }),
  });
  const data = await response.json();
  if (!response.ok) {
    showError(document.querySelector("#mine-phone-error"), data.error || "Չհաջողվեց ստուգել։");
    return;
  }
  renderMine(data);
});

document.querySelector("#mine-cancel").addEventListener("click", async () => {
  const confirmed = window.confirm("Չեղարկե՞լ այս գրանցումը։");
  if (!confirmed) return;
  const response = await fetch("/api/mine/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: minePhone }),
  });
  const data = await response.json();
  if (!response.ok) {
    showError(mineActionError, data.error || "Չեղարկումը չհաջողվեց։");
    return;
  }
  mineCard.hidden = true;
  mineEmpty.hidden = false;
  mineEmpty.textContent = "Գրանցումը չեղարկված է։ Այս համարով կարող եք կատարել նոր ամրագրում։";
});

async function moveMine(time) {
  showError(mineActionError, "");
  const response = await fetch("/api/mine/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: minePhone, time }),
  });
  const data = await response.json();
  if (!response.ok) {
    showError(mineActionError, data.error || "Ժամը չփոխվեց։");
    return;
  }
  renderMine({ found: true, ...data });
}

loadSlots().catch(() => {
  dateNode.textContent = "Չհաջողվեց բեռնել";
  showError(slotsMessage, "Ժամերը չբեռնվեցին։ Թարմացրեք էջը։");
});

setInterval(() => {
  if (schedule && schedule.opensAt) loadSlots().catch(() => {});
}, 30000);
