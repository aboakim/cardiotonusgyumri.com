const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");

// Ադմինի գաղտնաբառը։ Կարող եք փոխել այս տողը կամ ADMIN_PASSWORD միջավայրը։
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Cardiotonus@930";
const PORT = Number(process.env.PORT) || 3000;
const TZ = "Asia/Yerevan";
const DATA_PATH = path.join(__dirname, "data", "appointments.json");
const PUBLIC_PATH = path.join(__dirname, "public");

const MONTHS = [
  "հունվարի",
  "փետրվարի",
  "մարտի",
  "ապրիլի",
  "մայիսի",
  "հունիսի",
  "հուլիսի",
  "օգոստոսի",
  "սեպտեմբերի",
  "հոկտեմբերի",
  "նոյեմբերի",
  "դեկտեմբերի",
];
const WEEKDAYS = [
  "կիրակի",
  "երկուշաբթի",
  "երեքշաբթի",
  "չորեքշաբթի",
  "հինգշաբթի",
  "ուրբաթ",
  "շաբաթ",
];

const SLOTS = [
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

const NAME_RE = /^[\p{L}][\p{L}\s'’-]{1,39}$/u;
const bookingHits = new Map();
const CODE_TTL_MS = 10 * 60 * 1000;
const DATA_KEY = "cardiotonus:data";
let writeChain = Promise.resolve();

function calendarDate(offset = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const read = (type) => Number(parts.find((part) => part.type === type).value);
  const utc = new Date(Date.UTC(read("year"), read("month") - 1, read("day") + offset));
  return utc.toISOString().slice(0, 10);
}

function isWorkingDay(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday >= 1 && weekday <= 5;
}

function formatHy(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = WEEKDAYS[date.getUTCDay()];
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${day} ${MONTHS[month - 1]} ${year}`;
}

function formatStamp(iso) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

function blankData() {
  return { appointments: [], pending: {} };
}

function normalizeData(parsed) {
  if (!parsed || !Array.isArray(parsed.appointments)) return blankData();
  const pending = parsed.pending && typeof parsed.pending === "object" && !Array.isArray(parsed.pending)
    ? parsed.pending
    : {};
  return { appointments: parsed.appointments, pending };
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function redisCommand(args) {
  const redis = redisConfig();
  const response = await fetch(redis.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redis.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error(payload.error || "Տվյալների պահոցը չպատասխանեց։");
  return payload.result;
}

function readFileData() {
  try {
    return normalizeData(JSON.parse(fs.readFileSync(DATA_PATH, "utf8")));
  } catch (error) {
    if (error.code !== "ENOENT") console.error("Տվյալների ֆայլը չի կարդացվել", error);
    return blankData();
  }
}

async function readData() {
  if (!redisConfig()) return readFileData();
  const raw = await redisCommand(["GET", DATA_KEY]);
  if (!raw) return blankData();
  return normalizeData(JSON.parse(raw));
}

function sleepSync(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

function writeFileData(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  const payload = JSON.stringify(data, null, 2);
  let lastError;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      fs.writeFileSync(DATA_PATH, payload);
      return;
    } catch (error) {
      lastError = error;
      if (!["EPERM", "EACCES", "EBUSY"].includes(error.code)) throw error;
      sleepSync(40);
    }
  }
  throw lastError;
}

async function writeData(data) {
  if (!redisConfig()) {
    writeFileData(data);
    return;
  }
  await redisCommand(["SET", DATA_KEY, JSON.stringify(data)]);
}

function withLock(task) {
  const run = writeChain.then(task, task);
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function cleanName(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) {
    crypto.timingSafeEqual(a, a);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function publicAppointment(item) {
  return {
    id: item.id,
    date: item.date,
    dateLabel: formatHy(item.date),
    time: item.time,
    firstName: item.firstName,
    lastName: item.lastName,
    phone: item.phone,
    createdAt: item.createdAt,
    createdLabel: formatStamp(item.createdAt),
    demo: Boolean(item.demo),
  };
}

function nextWorkingDate(startOffset = 0) {
  for (let offset = startOffset; offset < startOffset + 14; offset += 1) {
    const date = calendarDate(offset);
    if (isWorkingDay(date)) return date;
  }
  return calendarDate(startOffset);
}

function phoneKey(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("00374")) digits = digits.slice(5);
  if (digits.startsWith("374")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.length === 8 ? digits : null;
}

function personFields(body) {
  const firstName = cleanName(body.firstName);
  const lastName = cleanName(body.lastName);
  const phone = cleanName(body.phone);
  const key = phoneKey(phone);
  if (!NAME_RE.test(firstName)) {
    return { error: { status: 400, body: { error: "Գրեք անունը։", field: "firstName" } } };
  }
  if (!NAME_RE.test(lastName)) {
    return { error: { status: 400, body: { error: "Գրեք ազգանունը։", field: "lastName" } } };
  }
  if (!key) {
    return { error: { status: 400, body: { error: "Գրեք հայաստանյան բջջային համար։", field: "phone" } } };
  }
  return { firstName, lastName, phone, phoneKey: key };
}

function purgePending(data) {
  const now = Date.now();
  for (const [key, hold] of Object.entries(data.pending)) {
    if (!hold || hold.expires < now) delete data.pending[key];
  }
}

function busyTimes(data, date) {
  purgePending(data);
  const times = new Set(
    data.appointments.filter((item) => item.date === date).map((item) => item.time)
  );
  for (const hold of Object.values(data.pending)) {
    if (hold.date === date) times.add(hold.time);
  }
  return times;
}

function yerevanDay(iso) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function bookedToday(data, key) {
  const today = calendarDate(0);
  return data.appointments.some((item) => phoneKey(item.phone) === key && item.createdAt && yerevanDay(item.createdAt) === today);
}

function upcomingForPhone(data, key) {
  const today = calendarDate(0);
  return data.appointments
    .filter((item) => phoneKey(item.phone) === key && item.date >= today)
    .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))[0] || null;
}

function publicMine(item) {
  return {
    date: item.date,
    dateLabel: formatHy(item.date),
    time: item.time,
    firstName: item.firstName,
    lastName: item.lastName,
  };
}

function dayChoices(data, date, ownTime) {
  const taken = new Set(
    data.appointments.filter((item) => item.date === date).map((item) => item.time)
  );
  return SLOTS.map((time) => ({
    time,
    current: time === ownTime,
    taken: taken.has(time) && time !== ownTime,
  }));
}

function fourDigitCode() {
  return String(crypto.randomInt(0, 10000)).padStart(4, "0");
}

function codesMatch(left, right) {
  const a = Buffer.from(String(left || "").replace(/\D/g, "").padStart(4, "0"));
  const b = Buffer.from(String(right || "").replace(/\D/g, "").padStart(4, "0"));
  if (a.length !== 4 || b.length !== 4) return false;
  return crypto.timingSafeEqual(a, b);
}

function readSmsConfig() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "sms.json"), "utf8"));
  } catch {
    return {};
  }
}

async function sendSms(phone, text) {
  const config = readSmsConfig();
  const login = process.env.SMS_LOGIN || config.login;
  const password = process.env.SMS_PASSWORD || config.password;
  if (!login || !password) {
    const error = new Error("SMS ծառայությունը միացված չէ։");
    error.code = "SMS_OFF";
    throw error;
  }
  const response = await fetch(process.env.SMS_URL || config.url || "https://sendsms.nikita.am/broker-api/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`,
    },
    body: JSON.stringify({
      messages: [
        {
          recipient: `374${phoneKey(phone)}`,
          priority: "2",
          sms: {
            originator: process.env.SMS_SENDER || config.sender || "Cardiotonus",
            content: { text },
          },
          "message-id": crypto.randomUUID(),
        },
      ],
    }),
  });
  if (!response.ok) {
    const error = new Error("SMS-ը չուղարկվեց։");
    error.code = "SMS_FAIL";
    throw error;
  }
}

function bookingRules(body) {
  const tomorrow = calendarDate(1);
  const time = String(body.time || "");
  const date = String(body.date || "");
  if (date !== tomorrow) {
    return { error: { status: 409, body: { error: "Գրանցումը բաց է միայն հաջորդ օրվա համար։ Թարմացրեք էջը։" } } };
  }
  if (!isWorkingDay(tomorrow)) {
    return { error: { status: 409, body: { error: "Վաղը աշխատանքային օր չէ։ Ընդունելությունը երկուշաբթիից ուրբաթ է։" } } };
  }
  if (!SLOTS.includes(time)) {
    return { error: { status: 400, body: { error: "Ընտրեք ցուցակի ժամերից մեկը։", field: "time" } } };
  }
  const person = personFields(body);
  if (person.error) return { error: person.error };
  return { tomorrow, time, person };
}

async function startBooking(body) {
  const checked = bookingRules(body);
  if (checked.error) return checked.error;
  const { tomorrow, time, person } = checked;
  const data = await readData();
  if (bookedToday(data, person.phoneKey)) {
    return {
      status: 409,
      body: {
        error: "Այս հեռախոսահամարով այսօր արդեն գրանցում կա։ Կեսգիշերից հետո կարող եք գրանցվել նորից։ Բացեք «Իմ գրանցումը»՝ չեղարկելու կամ ժամը փոխելու համար։",
        field: "phone",
      },
    };
  }
  if (data.appointments.some((item) => item.date === tomorrow && item.time === time)) {
    return { status: 409, body: { error: "Այս ժամն արդեն զբաղված է։ Ընտրեք այլ ժամ։", field: "time" } };
  }
  const appointment = {
    id: crypto.randomUUID(),
    date: tomorrow,
    time,
    firstName: person.firstName,
    lastName: person.lastName,
    phone: person.phone,
    createdAt: new Date().toISOString(),
  };
  data.appointments.push(appointment);
  await writeData(data);
  return { status: 201, body: { ok: true, appointment: publicAppointment(appointment) } };
}

async function confirmBooking(body) {
  const checked = bookingRules(body);
  if (checked.error) return checked.error;
  const { person, time } = checked;
  const code = String(body.code || "").replace(/\D/g, "");
  const data = await readData();
  purgePending(data);
  const hold = data.pending[person.phoneKey];
  if (!hold || hold.time !== time) {
    return { status: 400, body: { error: "Սկզբում ստացեք հաստատման կոդը։", field: "code" } };
  }
  hold.attempts += 1;
  if (hold.attempts > 5) {
    delete data.pending[person.phoneKey];
    await writeData(data);
    return { status: 429, body: { error: "Չափից շատ սխալ կոդ։ Ուղարկեք նորը։", field: "code" } };
  }
  if (!codesMatch(hold.code, code)) {
    await writeData(data);
    return { status: 400, body: { error: "Կոդը սխալ է։", field: "code" } };
  }
  if (bookedToday(data, person.phoneKey)) {
    delete data.pending[person.phoneKey];
    await writeData(data);
    return { status: 409, body: { error: "Այս հեռախոսահամարով այսօր արդեն գրանցում կա։", field: "phone" } };
  }
  if (data.appointments.some((item) => item.date === hold.date && item.time === hold.time)) {
    delete data.pending[person.phoneKey];
    await writeData(data);
    return { status: 409, body: { error: "Այս ժամն արդեն զբաղված է։ Ընտրեք այլ ժամ։", field: "time" } };
  }
  const appointment = {
    id: crypto.randomUUID(),
    date: hold.date,
    time: hold.time,
    firstName: hold.firstName,
    lastName: hold.lastName,
    phone: hold.phone,
    createdAt: new Date().toISOString(),
  };
  data.appointments.push(appointment);
  delete data.pending[person.phoneKey];
  await writeData(data);
  return { status: 201, body: { ok: true, appointment: publicAppointment(appointment) } };
}

function minePhone(body) {
  const key = phoneKey(body.phone);
  if (!key) return { error: { status: 400, body: { error: "Գրեք հայաստանյան բջջային համար։", field: "phone" } } };
  return { key };
}

async function findMine(body) {
  const checked = minePhone(body);
  if (checked.error) return checked.error;
  const data = await readData();
  const item = upcomingForPhone(data, checked.key);
  if (!item) return { status: 200, body: { found: false } };
  return {
    status: 200,
    body: { found: true, appointment: publicMine(item), slots: dayChoices(data, item.date, item.time) },
  };
}

async function cancelMine(body) {
  const checked = minePhone(body);
  if (checked.error) return checked.error;
  const data = await readData();
  const item = upcomingForPhone(data, checked.key);
  if (!item) return { status: 404, body: { error: "Այս համարով գրանցում չկա։" } };
  data.appointments = data.appointments.filter((entry) => entry.id !== item.id);
  await writeData(data);
  return { status: 200, body: { ok: true } };
}

async function moveMine(body) {
  const checked = minePhone(body);
  if (checked.error) return checked.error;
  const time = String(body.time || "");
  if (!SLOTS.includes(time)) {
    return { status: 400, body: { error: "Ընտրեք ազատ ժամը։", field: "time" } };
  }
  const data = await readData();
  const item = upcomingForPhone(data, checked.key);
  if (!item) return { status: 404, body: { error: "Այս համարով գրանցում չկա։" } };
  const taken = data.appointments.some((entry) => entry !== item && entry.date === item.date && entry.time === time);
  if (taken) return { status: 409, body: { error: "Այդ ժամն արդեն զբաղված է։ Ընտրեք այլ ժամ։" } };
  item.time = time;
  await writeData(data);
  return {
    status: 200,
    body: { ok: true, appointment: publicMine(item), slots: dayChoices(data, item.date, item.time) },
  };
}

async function createStaffBooking(body) {
  const date = String(body.date || "");
  const time = String(body.time || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isWorkingDay(date)) {
    return { status: 400, body: { error: "Ընդունելությունը միայն երկուշաբթիից ուրբաթ է։" } };
  }
  if (date < calendarDate(0)) {
    return { status: 400, body: { error: "Անցած օրվա համար տեղ ավելացնել հնարավոր չէ։" } };
  }
  if (!SLOTS.includes(time)) {
    return { status: 400, body: { error: "Ընտրեք ցուցակի ժամերից մեկը։", field: "time" } };
  }
  const person = personFields(body);
  if (person.error) return person.error;
  const data = await readData();
  if (bookedToday(data, person.phoneKey)) {
    return {
      status: 409,
      body: { error: "Այս հեռախոսահամարով այսօր արդեն գրանցում կա։ Կեսգիշերից հետո կարող եք գրանցվել նորից։", field: "phone" },
    };
  }
  const taken = data.appointments.some((item) => item.date === date && item.time === time);
  if (taken) {
    return { status: 409, body: { error: "Այս ժամն արդեն զբաղված է։", field: "time" } };
  }
  const appointment = {
    id: crypto.randomUUID(),
    date,
    time,
    firstName: person.firstName,
    lastName: person.lastName,
    phone: person.phone,
    createdAt: new Date().toISOString(),
  };
  data.appointments.push(appointment);
  await writeData(data);
  return { status: 201, body: { ok: true, appointment: publicAppointment(appointment) } };
}

function sessionToken() {
  const expires = Date.now() + 12 * 60 * 60 * 1000;
  const body = String(expires);
  const signature = crypto.createHmac("sha256", ADMIN_PASSWORD).update(body).digest("hex");
  return `${body}.${signature}`;
}

function sessionValid(token) {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) return false;
  const expected = crypto.createHmac("sha256", ADMIN_PASSWORD).update(body).digest("hex");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return false;
  return Number(body) > Date.now();
}

function requireAdmin(req, res, next) {
  if (!sessionValid(req.cookies.admin_session)) {
    return res.status(401).json({ error: "Մուտք գործեք ադմին վահանակ։" });
  }
  next();
}

function limitBookings(req, res, next) {
  const now = Date.now();
  const key = req.ip || "local";
  const recent = (bookingHits.get(key) || []).filter((stamp) => now - stamp < 10 * 60 * 1000);
  if (recent.length >= 20) {
    return res.status(429).json({ error: "Չափից շատ փորձ եղավ։ Մի քանի րոպեից կրկին փորձեք։" });
  }
  recent.push(now);
  bookingHits.set(key, recent);
  next();
}

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});

app.get("/api/slots", async (req, res) => {
  const date = calendarDate(1);
  const open = isWorkingDay(date);
  const data = await readData();
  const taken = busyTimes(data, date);
  let preview = null;
  if (!open) {
    const previewDate = nextWorkingDate(0);
    const previewTaken = busyTimes(data, previewDate);
    preview = {
      date: previewDate,
      dateLabel: formatHy(previewDate),
      slots: SLOTS.map((time) => ({ time, taken: previewTaken.has(time) })),
    };
  }
  res.json({
    date,
    dateLabel: formatHy(date),
    open,
    closedMessage: open
      ? ""
      : "Վաղը աշխատանքային օր չէ։ Ընդունելությունը երկուշաբթիից ուրբաթ է, իսկ գրանցումը բաց է միայն նախորդ օրը։",
    capacity: SLOTS.length,
    booked: open ? taken.size : 0,
    slots: open ? SLOTS.map((time) => ({ time, taken: taken.has(time) })) : [],
    preview,
  });
});

app.post("/api/book", limitBookings, async (req, res) => {
  try {
    const result = await withLock(() => startBooking(req.body || {}));
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Գրանցումը չհաջողվեց։ Կրկին փորձեք։" });
  }
});

app.post("/api/book/confirm", limitBookings, async (req, res) => {
  try {
    const result = await withLock(() => confirmBooking(req.body || {}));
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Հաստատումը չհաջողվեց։ Կրկին փորձեք։" });
  }
});

app.post("/api/mine", limitBookings, async (req, res) => {
  const result = await findMine(req.body || {});
  res.status(result.status).json(result.body);
});

app.post("/api/mine/cancel", limitBookings, async (req, res) => {
  try {
    const result = await withLock(() => cancelMine(req.body || {}));
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Չեղարկումը չհաջողվեց։" });
  }
});

app.post("/api/mine/move", limitBookings, async (req, res) => {
  try {
    const result = await withLock(() => moveMine(req.body || {}));
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ժամը չփոխվեց։ Կրկին փորձեք։" });
  }
});

app.post("/api/admin/login", (req, res) => {
  const password = String((req.body || {}).password || "");
  if (!password || !safeEqual(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "Գաղտնաբառը սխալ է։" });
  }
  res.cookie("admin_session", sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: Boolean(process.env.VERCEL),
    maxAge: 12 * 60 * 60 * 1000,
    path: "/",
  });
  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  res.clearCookie("admin_session", { path: "/" });
  res.json({ ok: true });
});

app.get("/api/admin/appointments", requireAdmin, async (req, res) => {
  const requested = String(req.query.date || nextWorkingDate(0));
  const data = (await readData()).appointments.slice().sort((a, b) => {
    return a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date);
  });
  const dates = [...new Set(data.map((item) => item.date))];
  const selected = requested === "all" ? "all" : /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : nextWorkingDate(0);
  const visible = selected === "all" ? data : data.filter((item) => item.date === selected);
  const byTime = new Map(visible.map((item) => [item.time, item]));
  res.json({
    selectedDate: selected,
    dateLabel: selected === "all" ? "Բոլոր օրերը" : formatHy(selected),
    workingDay: selected === "all" ? false : isWorkingDay(selected),
    dates,
    capacity: SLOTS.length,
    appointments: visible.map(publicAppointment),
    slots: selected === "all" ? [] : SLOTS.map((time) => ({
      time,
      appointment: byTime.has(time) ? publicAppointment(byTime.get(time)) : null,
    })),
  });
});

app.post("/api/admin/appointments", requireAdmin, async (req, res) => {
  try {
    const result = await withLock(() => createStaffBooking(req.body || {}));
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Գրանցումը չհաջողվեց։ Կրկին փորձեք։" });
  }
});

app.delete("/api/admin/appointments/:id", requireAdmin, async (req, res) => {
  try {
    const result = await withLock(async () => {
      const data = await readData();
      const next = data.appointments.filter((item) => item.id !== req.params.id);
      if (next.length === data.appointments.length) {
        return { status: 404, body: { error: "Գրանցումը չի գտնվել։" } };
      }
      data.appointments = next;
      await writeData(data);
      return { status: 200, body: { ok: true } };
    });
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Չեղարկումը չհաջողվեց։" });
  }
});

app.get(["/book", "/book.html"], (req, res) => res.redirect("/"));
app.use(express.static(PUBLIC_PATH, { extensions: ["html"] }));

function start(port) {
  const server = app.listen(port, () => {
    console.log(`Cardiotonus կայքը բաց է՝ http://localhost:${port}`);
  });
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && !process.env.PORT && port < PORT + 20) {
      start(port + 1);
      return;
    }
    console.error(error);
    process.exit(1);
  });
}

module.exports = app;

if (require.main === module) start(PORT);
