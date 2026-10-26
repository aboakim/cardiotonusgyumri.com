const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");

// Ադմինի գաղտնաբառը։ Կարող եք փոխել այս տողը կամ ADMIN_PASSWORD միջավայրը։
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "cardiotonus1";
const PORT = Number(process.env.PORT) || 3000;
const TZ = "Asia/Yerevan";
const DATA_PATH = path.join(__dirname, "data", "appointments.json");
const PUBLIC_PATH = path.join(__dirname, "public");

const MONTHS = {
  hy: ["հունվարի", "փետրվարի", "մարտի", "ապրիլի", "մայիսի", "հունիսի", "հուլիսի", "օգոստոսի", "սեպտեմբերի", "հոկտեմբերի", "նոյեմբերի", "դեկտեմբերի"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
};
const WEEKDAYS = {
  hy: ["կիրակի", "երկուշաբթի", "երեքշաբթի", "չորեքշաբթի", "հինգշաբթի", "ուրբաթ", "շաբաթ"],
  ru: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
};
const COPY = {
  hy: {
    needFirstName: "Գրեք անունը։",
    needLastName: "Գրեք ազգանունը։",
    needPhone: "Գրեք հայաստանյան բջջային համար։",
    badPhone: "Այս հեռախոսահամարով հնարավոր չէ գրանցվել։",
    opensLater: "Հաջորդ օրվա գրանցումը բացվում է ժամը {time}-ին։",
    slotPassed: "Այս ժամն արդեն անցել է։ Ընտրեք ավելի ուշ ժամ։",
    onlyTomorrow: "Գրանցումը բաց է միայն հաջորդ օրվա համար։ Թարմացրեք էջը։",
    tomorrowOff: "Վաղը աշխատանքային օր չէ։ Ընդունելությունը երկուշաբթիից ուրբաթ է։",
    pickListed: "Ընտրեք ցուցակի ժամերից մեկը։",
    alreadyToday: "Այս հեռախոսահամարով այսօր արդեն գրանցում կա։ Կեսգիշերից հետո կարող եք գրանցվել նորից։ Բացեք «Իմ գրանցումը»՝ չեղարկելու կամ ժամը փոխելու համար։",
    alreadyTodayShort: "Այս հեռախոսահամարով այսօր արդեն գրանցում կա։",
    alreadyOnDate: "Այս հեռախոսահամարով այս օրվա համար արդեն գրանցում կա։ Բացեք «Իմ գրանցումը»՝ չեղարկելու կամ ժամը փոխելու համար։",
    alreadyTodayStaff: "Այս հեռախոսահամարով այսօր արդեն գրանցում կա։ Կեսգիշերից հետո կարող եք գրանցվել նորից։",
    slotTaken: "Այս ժամն արդեն զբաղված է։ Ընտրեք այլ ժամ։",
    slotTakenShort: "Այս ժամն արդեն զբաղված է։",
    slotTakenMove: "Այդ ժամն արդեն զբաղված է։ Ընտրեք այլ ժամ։",
    needCode: "Սկզբում ստացեք հաստատման կոդը։",
    tooManyCodes: "Չափից շատ սխալ կոդ։ Ուղարկեք նորը։",
    badCode: "Կոդը սխալ է։",
    noBooking: "Այս համարով գրանցում չկա։",
    pickFree: "Ընտրեք ազատ ժամը։",
    weekdaysOnly: "Ընդունելությունը միայն երկուշաբթիից ուրբաթ է։",
    pastDate: "Անցած օրվա համար տեղ ավելացնել հնարավոր չէ։",
    adminRequired: "Մուտք գործեք ադմին վահանակ։",
    tooManyTries: "Չափից շատ փորձ եղավ։ Մի քանի րոպեից կրկին փորձեք։",
    closedToday: "Հաջորդ օրվա գրանցումը բացվում է այսօր ժամը {time}-ին։",
    closedWeekend: "Վաղը աշխատանքային օր չէ։ Ընդունելությունը երկուշաբթիից ուրբաթ է, իսկ գրանցումը բացվում է նախորդ օրը ժամը {time}-ին։",
    bookFail: "Գրանցումը չհաջողվեց։ Կրկին փորձեք։",
    confirmFail: "Հաստատումը չհաջողվեց։ Կրկին փորձեք։",
    cancelFail: "Չեղարկումը չհաջողվեց։",
    moveFail: "Ժամը չփոխվեց։ Կրկին փորձեք։",
    badPassword: "Գաղտնաբառը սխալ է։",
    allDays: "Բոլոր օրերը",
    notFound: "Գրանցումը չի գտնվել։",
  },
  ru: {
    needFirstName: "Введите имя.",
    needLastName: "Введите фамилию.",
    needPhone: "Введите армянский мобильный номер.",
    badPhone: "С таким номером телефона записаться нельзя.",
    opensLater: "Запись на следующий день открывается в {time}.",
    slotPassed: "Это время уже прошло. Выберите более позднее.",
    onlyTomorrow: "Запись открыта только на следующий день. Обновите страницу.",
    tomorrowOff: "Завтра нерабочий день. Приём с понедельника по пятницу.",
    pickListed: "Выберите время из списка.",
    alreadyToday: "С этим номером сегодня уже есть запись. После полуночи можно записаться снова. Откройте «Моя запись», чтобы отменить или перенести.",
    alreadyTodayShort: "С этим номером сегодня уже есть запись.",
    alreadyOnDate: "С этим номером на этот день уже есть запись. Откройте «Моя запись», чтобы отменить или перенести.",
    alreadyTodayStaff: "С этим номером сегодня уже есть запись. После полуночи можно записаться снова.",
    slotTaken: "Это время уже занято. Выберите другое.",
    slotTakenShort: "Это время уже занято.",
    slotTakenMove: "Это время уже занято. Выберите другое.",
    needCode: "Сначала получите код подтверждения.",
    tooManyCodes: "Слишком много неверных кодов. Отправьте новый.",
    badCode: "Код неверный.",
    noBooking: "Записи с этим номером нет.",
    pickFree: "Выберите свободное время.",
    weekdaysOnly: "Приём только с понедельника по пятницу.",
    pastDate: "Нельзя добавить запись на прошедший день.",
    adminRequired: "Войдите в панель администратора.",
    tooManyTries: "Слишком много попыток. Попробуйте через несколько минут.",
    closedToday: "Запись на следующий день открывается сегодня в {time}.",
    closedWeekend: "Завтра нерабочий день. Приём с понедельника по пятницу, а запись открывается накануне в {time}.",
    bookFail: "Не удалось записать. Попробуйте ещё раз.",
    confirmFail: "Не удалось подтвердить. Попробуйте ещё раз.",
    cancelFail: "Не удалось отменить.",
    moveFail: "Не удалось изменить время. Попробуйте ещё раз.",
    badPassword: "Неверный пароль.",
    allDays: "Все дни",
    notFound: "Запись не найдена.",
  },
};

function requestLang(value) {
  return value === "ru" ? "ru" : "hy";
}

function text(lang, key, vars) {
  const pack = COPY[requestLang(lang)] || COPY.hy;
  let line = pack[key] || COPY.hy[key] || key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      line = line.split(`{${name}}`).join(String(replacement));
    }
  }
  return line;
}

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
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    calendar: "gregory",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const read = (type) => Number(parts.find((part) => part.type === type).value);
  let year = read("year");
  if (year >= 2400) year -= 543;
  const utc = new Date(Date.UTC(year, read("month") - 1, read("day") + offset));
  return utc.toISOString().slice(0, 10);
}

function normalizeIsoDate(value) {
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

const BOOKING_OPEN_HOUR = 19;

function bookingOpenLabel() {
  return `${String(BOOKING_OPEN_HOUR).padStart(2, "0")}:00`;
}

function yerevanHour() {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  return Number(hour);
}

function bookingWindowOpen() {
  return yerevanHour() >= BOOKING_OPEN_HOUR;
}

function yerevanMinutes() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const read = (type) => parts.find((part) => part.type === type).value.padStart(2, "0");
  return `${read("hour")}:${read("minute")}`;
}

function isWorkingDay(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday >= 1 && weekday <= 5;
}

function formatDate(iso, lang) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const code = requestLang(lang);
  const weekday = WEEKDAYS[code][date.getUTCDay()];
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${day} ${MONTHS[code][month - 1]} ${year}`;
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

function addMonths(isoDate, months) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const result = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(day, lastDay)));
  return result.toISOString().slice(0, 10);
}

function recordStart(item) {
  if (item.createdAt) {
    const day = yerevanDay(item.createdAt);
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  }
  return item.date;
}

function expiredAppointment(item) {
  const start = recordStart(item);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return false;
  return calendarDate(0) >= addMonths(start, 1);
}

async function readData() {
  const data = await readStoredData();
  const kept = data.appointments.filter((item) => !expiredAppointment(item));
  if (kept.length === data.appointments.length) return data;
  data.appointments = kept;
  await writeData(data);
  return data;
}

async function readStoredData() {
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

function publicAppointment(item, lang) {
  return {
    id: item.id,
    date: item.date,
    dateLabel: formatDate(item.date, lang),
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

const MOBILE_PREFIXES = new Set(["33", "41", "43", "44", "55", "77", "91", "93", "94", "95", "96", "97", "98", "99"]);

function phoneKey(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("00374")) digits = digits.slice(5);
  if (digits.startsWith("374")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.length === 8 ? digits : null;
}

function allowedMobile(key) {
  return MOBILE_PREFIXES.has(String(key || "").slice(0, 2));
}

function personFields(body, lang) {
  const firstName = cleanName(body.firstName);
  const lastName = cleanName(body.lastName);
  const phone = cleanName(body.phone);
  const key = phoneKey(phone);
  if (!NAME_RE.test(firstName)) {
    return { error: { status: 400, body: { error: text(lang, "needFirstName"), field: "firstName" } } };
  }
  if (!NAME_RE.test(lastName)) {
    return { error: { status: 400, body: { error: text(lang, "needLastName"), field: "lastName" } } };
  }
  if (!key) {
    return { error: { status: 400, body: { error: text(lang, "needPhone"), field: "phone" } } };
  }
  if (!allowedMobile(key)) {
    return { error: { status: 400, body: { error: text(lang, "badPhone"), field: "phone" } } };
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

function publicMine(item, lang) {
  return {
    date: item.date,
    dateLabel: formatDate(item.date, lang),
    time: item.time,
    firstName: item.firstName,
    lastName: item.lastName,
  };
}

function dayChoices(data, date, ownTime) {
  const taken = new Set(
    data.appointments.filter((item) => item.date === date).map((item) => item.time)
  );
  const now = date === calendarDate(0) ? yerevanMinutes() : "";
  return SLOTS.map((time) => ({
    time,
    current: time === ownTime,
    taken: (taken.has(time) || (Boolean(now) && time <= now)) && time !== ownTime,
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

function bookingRules(body, lang) {
  const tomorrow = calendarDate(1);
  const today = calendarDate(0);
  const time = String(body.time || "");
  const date = String(body.date || "");
  if (!SLOTS.includes(time)) {
    return { error: { status: 400, body: { error: text(lang, "pickListed"), field: "time" } } };
  }
  const evening = bookingWindowOpen();
  if (evening) {
    if (!isWorkingDay(tomorrow)) {
      return { error: { status: 409, body: { error: text(lang, "tomorrowOff") } } };
    }
    if (date !== tomorrow) {
      return { error: { status: 409, body: { error: text(lang, "onlyTomorrow") } } };
    }
  } else if (date === today && isWorkingDay(today)) {
    if (time <= yerevanMinutes()) {
      return { error: { status: 409, body: { error: text(lang, "slotPassed"), field: "time" } } };
    }
  } else {
    return { error: { status: 409, body: { error: text(lang, "opensLater", { time: bookingOpenLabel() }) } } };
  }
  const person = personFields(body, lang);
  if (person.error) return { error: person.error };
  return { date: evening ? tomorrow : today, time, person };
}

async function startBooking(body, lang) {
  const checked = bookingRules(body, lang);
  if (checked.error) return checked.error;
  const { date, time, person } = checked;
  const data = await readData();
  if (bookedToday(data, person.phoneKey)) {
    return {
      status: 409,
      body: {
        error: text(lang, "alreadyToday"),
        field: "phone",
      },
    };
  }
  if (data.appointments.some((item) => phoneKey(item.phone) === person.phoneKey && item.date === date)) {
    return { status: 409, body: { error: text(lang, "alreadyOnDate"), field: "phone" } };
  }
  if (data.appointments.some((item) => item.date === date && item.time === time)) {
    return { status: 409, body: { error: text(lang, "slotTaken"), field: "time" } };
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
  return { status: 201, body: { ok: true, appointment: publicAppointment(appointment, lang) } };
}

async function confirmBooking(body, lang) {
  const checked = bookingRules(body, lang);
  if (checked.error) return checked.error;
  const { person, time } = checked;
  const code = String(body.code || "").replace(/\D/g, "");
  const data = await readData();
  purgePending(data);
  const hold = data.pending[person.phoneKey];
  if (!hold || hold.time !== time) {
    return { status: 400, body: { error: text(lang, "needCode"), field: "code" } };
  }
  hold.attempts += 1;
  if (hold.attempts > 5) {
    delete data.pending[person.phoneKey];
    await writeData(data);
    return { status: 429, body: { error: text(lang, "tooManyCodes"), field: "code" } };
  }
  if (!codesMatch(hold.code, code)) {
    await writeData(data);
    return { status: 400, body: { error: text(lang, "badCode"), field: "code" } };
  }
  if (bookedToday(data, person.phoneKey)) {
    delete data.pending[person.phoneKey];
    await writeData(data);
    return { status: 409, body: { error: text(lang, "alreadyTodayShort"), field: "phone" } };
  }
  if (data.appointments.some((item) => phoneKey(item.phone) === person.phoneKey && item.date === hold.date)) {
    delete data.pending[person.phoneKey];
    await writeData(data);
    return { status: 409, body: { error: text(lang, "alreadyOnDate"), field: "phone" } };
  }
  if (data.appointments.some((item) => item.date === hold.date && item.time === hold.time)) {
    delete data.pending[person.phoneKey];
    await writeData(data);
    return { status: 409, body: { error: text(lang, "slotTaken"), field: "time" } };
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
  return { status: 201, body: { ok: true, appointment: publicAppointment(appointment, lang) } };
}

function minePhone(body, lang) {
  const key = phoneKey(body.phone);
  if (!key) return { error: { status: 400, body: { error: text(lang, "needPhone"), field: "phone" } } };
  return { key };
}

async function findMine(body, lang) {
  const checked = minePhone(body, lang);
  if (checked.error) return checked.error;
  const data = await readData();
  const item = upcomingForPhone(data, checked.key);
  if (!item) return { status: 200, body: { found: false } };
  return {
    status: 200,
    body: { found: true, appointment: publicMine(item, lang), slots: dayChoices(data, item.date, item.time) },
  };
}

async function cancelMine(body, lang) {
  const checked = minePhone(body, lang);
  if (checked.error) return checked.error;
  const data = await readData();
  const item = upcomingForPhone(data, checked.key);
  if (!item) return { status: 404, body: { error: text(lang, "noBooking") } };
  data.appointments = data.appointments.filter((entry) => entry.id !== item.id);
  await writeData(data);
  return { status: 200, body: { ok: true } };
}

async function moveMine(body, lang) {
  const checked = minePhone(body, lang);
  if (checked.error) return checked.error;
  const time = String(body.time || "");
  if (!SLOTS.includes(time)) {
    return { status: 400, body: { error: text(lang, "pickFree"), field: "time" } };
  }
  const data = await readData();
  const item = upcomingForPhone(data, checked.key);
  if (!item) return { status: 404, body: { error: text(lang, "noBooking") } };
  const taken = data.appointments.some((entry) => entry !== item && entry.date === item.date && entry.time === time);
  if (taken) return { status: 409, body: { error: text(lang, "slotTakenMove") } };
  if (item.date === calendarDate(0) && time <= yerevanMinutes()) {
    return { status: 409, body: { error: text(lang, "slotPassed"), field: "time" } };
  }
  item.time = time;
  await writeData(data);
  return {
    status: 200,
    body: { ok: true, appointment: publicMine(item, lang), slots: dayChoices(data, item.date, item.time) },
  };
}

async function createStaffBooking(body, lang) {
  const date = normalizeIsoDate(body.date);
  const time = String(body.time || "");
  if (!date || !isWorkingDay(date)) {
    return { status: 400, body: { error: text(lang, "weekdaysOnly") } };
  }
  if (date < calendarDate(0)) {
    return { status: 400, body: { error: text(lang, "pastDate") } };
  }
  if (!SLOTS.includes(time)) {
    return { status: 400, body: { error: text(lang, "pickListed"), field: "time" } };
  }
  const person = personFields(body, lang);
  if (person.error) return person.error;
  const data = await readData();
  if (bookedToday(data, person.phoneKey)) {
    return {
      status: 409,
      body: { error: text(lang, "alreadyTodayStaff"), field: "phone" },
    };
  }
  const taken = data.appointments.some((item) => item.date === date && item.time === time);
  if (taken) {
    return { status: 409, body: { error: text(lang, "slotTakenShort"), field: "time" } };
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
  return { status: 201, body: { ok: true, appointment: publicAppointment(appointment, lang) } };
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
    return res.status(401).json({ error: text(req.lang, "adminRequired") });
  }
  next();
}

function limitBookings(req, res, next) {
  const now = Date.now();
  const key = req.ip || "local";
  const recent = (bookingHits.get(key) || []).filter((stamp) => now - stamp < 10 * 60 * 1000);
  if (recent.length >= 20) {
    return res.status(429).json({ error: text(req.lang, "tooManyTries") });
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
  req.lang = requestLang(req.cookies && req.cookies.lang);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});

app.get("/api/slots", async (req, res) => {
  const tomorrow = calendarDate(1);
  const today = calendarDate(0);
  const tomorrowWorking = isWorkingDay(tomorrow);
  const todayWorking = isWorkingDay(today);
  const evening = bookingWindowOpen();
  const data = await readData();
  const now = yerevanMinutes();
  if (!evening && todayWorking) {
    const taken = busyTimes(data, today);
    const slots = SLOTS.map((time) => ({ time, taken: taken.has(time) || time <= now }));
    return res.json({
      date: today,
      dateLabel: formatDate(today, req.lang),
      open: true,
      sameDay: true,
      opensAt: "",
      closedMessage: "",
      capacity: SLOTS.length,
      booked: slots.filter((slot) => slot.taken).length,
      slots,
      preview: null,
    });
  }
  const open = evening && tomorrowWorking;
  const taken = busyTimes(data, tomorrow);
  let preview = null;
  if (!tomorrowWorking) {
    const previewDate = nextWorkingDate(0);
    const previewTaken = busyTimes(data, previewDate);
    preview = {
      date: previewDate,
      dateLabel: formatDate(previewDate, req.lang),
      slots: SLOTS.map((time) => ({ time, taken: previewTaken.has(time) })),
    };
  }
  res.json({
    date: tomorrow,
    dateLabel: formatDate(tomorrow, req.lang),
    open,
    sameDay: false,
    opensAt: open || !tomorrowWorking ? "" : bookingOpenLabel(),
    closedMessage: open
      ? ""
      : tomorrowWorking
        ? text(req.lang, "closedToday", { time: bookingOpenLabel() })
        : text(req.lang, "closedWeekend", { time: bookingOpenLabel() }),
    capacity: SLOTS.length,
    booked: open ? taken.size : 0,
    slots: open ? SLOTS.map((time) => ({ time, taken: taken.has(time) })) : [],
    preview,
  });
});

app.post("/api/book", limitBookings, async (req, res) => {
  try {
    const result = await withLock(() => startBooking(req.body || {}, req.lang));
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: text(req.lang, "bookFail") });
  }
});

app.post("/api/book/confirm", limitBookings, async (req, res) => {
  try {
    const result = await withLock(() => confirmBooking(req.body || {}, req.lang));
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: text(req.lang, "confirmFail") });
  }
});

app.post("/api/mine", limitBookings, async (req, res) => {
  const result = await findMine(req.body || {}, req.lang);
  res.status(result.status).json(result.body);
});

app.post("/api/mine/cancel", limitBookings, async (req, res) => {
  try {
    const result = await withLock(() => cancelMine(req.body || {}, req.lang));
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: text(req.lang, "cancelFail") });
  }
});

app.post("/api/mine/move", limitBookings, async (req, res) => {
  try {
    const result = await withLock(() => moveMine(req.body || {}, req.lang));
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: text(req.lang, "moveFail") });
  }
});

app.post("/api/admin/login", (req, res) => {
  const password = String((req.body || {}).password || "");
  if (!password || !safeEqual(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: text(req.lang, "badPassword") });
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
  const requested = String(req.query.date || calendarDate(0));
  const data = (await readData()).appointments.slice().sort((a, b) => {
    return a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date);
  });
  const dates = [...new Set(data.map((item) => item.date))];
  const selected = requested === "all" ? "all" : normalizeIsoDate(requested) || calendarDate(0);
  const visible = selected === "all" ? data : data.filter((item) => item.date === selected);
  const byTime = new Map(visible.map((item) => [item.time, item]));
  res.setHeader("Cache-Control", "no-store");
  res.json({
    selectedDate: selected,
    dateLabel: selected === "all" ? text(req.lang, "allDays") : formatDate(selected, req.lang),
    workingDay: selected === "all" ? false : isWorkingDay(selected),
    dates,
    capacity: SLOTS.length,
    appointments: visible.map((item) => publicAppointment(item, req.lang)),
    slots: selected === "all" ? [] : SLOTS.map((time) => ({
      time,
      appointment: byTime.has(time) ? publicAppointment(byTime.get(time), req.lang) : null,
    })),
  });
});

app.post("/api/admin/appointments", requireAdmin, async (req, res) => {
  try {
    const result = await withLock(() => createStaffBooking(req.body || {}, req.lang));
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: text(req.lang, "bookFail") });
  }
});

app.delete("/api/admin/appointments/:id", requireAdmin, async (req, res) => {
  try {
    const result = await withLock(async () => {
      const data = await readData();
      const next = data.appointments.filter((item) => item.id !== req.params.id);
      if (next.length === data.appointments.length) {
        return { status: 404, body: { error: text(req.lang, "notFound") } };
      }
      data.appointments = next;
      await writeData(data);
      return { status: 200, body: { ok: true } };
    });
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: text(req.lang, "cancelFail") });
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
