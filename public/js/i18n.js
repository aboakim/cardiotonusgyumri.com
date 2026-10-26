const STRINGS = {
  hy: {
    language: "Լեզու",
    pageTitle: "Գրանցում · Cardiotonus",
    pageDescription: "Գրանցվեք Cardiotonus բժշկական կենտրոնի վաղվա այցելությանը։",
    pageTitleAdmin: "Ադմին վահանակ · Cardiotonus",
    showBook: "Գրանցում",
    showMine: "Իմ գրանցումը",
    adminNav: "Ադմին",
    nextVisit: "Հաջորդ օրվա այց",
    bookHeading: "Գրանցվել ընդունելության",
    bookLead: "Ժամը 19:00-ից գրանցումը միայն հաջորդ օրվա համար է։ Նախորդ օրը չամրագրված ժամերը նույն օրը՝ մինչև 19:00-ն, կարելի է գրանցել, եթե դեռ ազատ են։ Ընդունելությունը երկուշաբթիից ուրբաթ է։ Մեկ հեռախոսահամարով օրվա ընթացքում կարելի է ունենալ միայն մեկ գրանցում։",
    todayVisit: "Այսօրվա այց",
    sameDayFree: "Այսօր ազատ է {count} տեղ",
    sameDayFull: "Այսօրվա մնացած ժամերը զբաղված են",
    dateWord: "Ամսաթիվ",
    loading: "Բեռնվում է…",
    free: "Ազատ",
    busy: "Զբաղված",
    picked: "Ընտրված",
    slotsAria: "Ազատ ժամեր",
    yourDetails: "Ձեր տվյալները",
    firstName: "Անուն",
    lastName: "Ազգանուն",
    phone: "Հեռախոսահամար",
    phoneShort: "Հեռախոս",
    chosenEmpty: "Ժամը դեռ ընտրված չէ",
    submit: "Գրանցվել",
    codeTitle: "Հաստատման կոդ",
    codeLead: "Հեռախոսին ուղարկված քառանիշ թիվը գրեք այստեղ։ Գրանցումը կհաստատվի միայն դրանից հետո։",
    code: "Կոդ",
    confirmBooking: "Հաստատել գրանցումը",
    resendCode: "Նոր կոդ ուղարկել",
    confirmed: "Հաստատված է",
    visitSaved: "Այցը գրանցված է",
    newBooking: "Նոր գրանցում",
    findBooking: "Գտնել ամրագրումը",
    mineLead: "Գրեք այն հեռախոսահամարը, որով գրանցվել եք։ Եթե գրանցում կա, կարող եք չեղարկել կամ ընտրել այլ ազատ ժամ։",
    check: "Ստուգել",
    mineEmpty: "Այս հեռախոսահամարով գրանցում չկա։",
    mineFound: "Գրանցումը գտնվել է",
    cancelBooking: "Չեղարկել գրանցումը",
    otherTime: "Այլ ազատ ժամ",
    address: "Գյումրի, Գարեգին Նժդեհ 5/8",
    openMap: "Բացել հասցեն քարտեզում",
    callClinic: "Զանգել",
    footerNote: "Չեղարկելու կամ ժամը փոխելու համար բացեք «Իմ գրանցումը»։",
    demo: "Դեմո։ վաղը՝ {tomorrow}, գրանցել հնարավոր չէ։ Ներքևում {sample} օրվա օրինակն է. զբաղված ժամերը փակ են։",
    opensAt: "Կբացվի ժամը {time}-ին",
    noReception: "Ընդունելություն չկա",
    exampleFree: "Օրինակ՝ ազատ է {count} տեղ 15-ից",
    freeCount: "Ազատ է {count} տեղ 15-ից",
    allFull: "Բոլոր 15 տեղերը զբաղված են",
    minutes: "30 րոպե",
    chosenTime: "Ընտրված ժամը՝ {time}",
    noSlotsLeft: "Վաղվա համար ազատ տեղ չի մնացել։",
    previewOnly: "Սա միայն օրինակ է։ Գրանցումը կբացվի աշխատանքային օրվանից առաջ։",
    pickTime: "Ընտրեք ազատ ժամը։",
    bookFail: "Գրանցումը չհաջողվեց։",
    network: "Կապը չհաջողվեց։ Կրկին փորձեք։",
    confirmFail: "Հաստատումը չհաջողվեց։",
    successCopy: "{name}, {date}, ժամը {time}։ Խնդրում ենք ներկայանալ Cardiotonus կլինիկա՝ Գարեգին Նժդեհ 5/8։",
    loadFail: "Չհաջողվեց բեռնել։",
    checkFail: "Չհաջողվեց ստուգել։",
    mineWhen: "{date}, ժամը {time}",
    yourTime: "Ձեր ժամը",
    choose: "Ընտրել",
    cancelAsk: "Չեղարկե՞լ այս գրանցումը։",
    cancelFail: "Չեղարկումը չհաջողվեց։",
    cancelled: "Գրանցումը չեղարկված է։ Այս համարով կարող եք կատարել նոր ամրագրում։",
    moveFail: "Ժամը չփոխվեց։",
    dateLoadFail: "Չհաջողվեց բեռնել",
    slotsLoadFail: "Ժամերը չբեռնվեցին։ Թարմացրեք էջը։",
    previewMark: "{date} · օրինակ",
    staff: "Անձնակազմ",
    adminHeading: "Ադմին վահանակ",
    adminLead: "Այստեղից կարելի է տեսնել օրվա գրանցումները, ավելացնել տեղ և չեղարկել։ Ամեն գրանցում պահվում է 1 ամիս, հետո ինքնըստինքյան վերանում է։",
    password: "Գաղտնաբառ",
    showPassword: "Ցույց տալ գաղտնաբառը",
    hidePassword: "Թաքցնել գաղտնաբառը",
    login: "Մուտք",
    registered: "Գրանցվածներ",
    visits: "Այցելություններ",
    day: "Օր",
    search: "Փնտրել",
    searchPlaceholder: "Անուն կամ ազգանուն",
    all: "Բոլորը",
    logout: "Ելք",
    emptyDay: "Այս օրվա համար գրանցում չկա։",
    addBooking: "Ավելացնել գրանցում",
    staffNote: "Ընտրեք ազատ ժամը և լրացրեք տվյալները։",
    staffOpen: "Ազատ ժամը կրկին բացվում է, երբ գրանցումը չեղարկում եք։",
    staffClosed: "Այս օրը աշխատանքային չէ կամ արդեն անցել է։",
    time: "Ժամ",
    bookVerb: "Գրանցել",
    countAll: "{count} գրանցում",
    countDay: "{booked} գրանցված · {free} ազատ",
    emptySearch: "Այդպիսի գրանցում չկա։",
    emptyAll: "Գրանցումներ դեռ չկան։",
    freeTimes: "Ազատ ժամեր՝ {times}",
    cancel: "Չեղարկել",
    cancelVisit: "Չեղարկե՞լ {time} այցը՝ {name}։",
    listFail: "Ցանկը չբեռնվեց։",
    loginFail: "Մուտքը չհաջողվեց։",
    allDays: "Բոլոր օրերը",
  },
  ru: {
    language: "Язык",
    pageTitle: "Запись · Cardiotonus",
    pageDescription: "Запишитесь на завтрашний приём в медицинский центр Cardiotonus.",
    pageTitleAdmin: "Панель администратора · Cardiotonus",
    showBook: "Запись",
    showMine: "Моя запись",
    adminNav: "Админ",
    nextVisit: "Визит на завтра",
    bookHeading: "Запись на приём",
    bookLead: "С 19:00 запись открыта только на следующий день. Время, которое не заняли накануне, можно записать в тот же день до 19:00, если оно ещё свободно. Приём с понедельника по пятницу. С одного номера телефона в течение дня можно сделать только одну запись.",
    todayVisit: "Визит на сегодня",
    sameDayFree: "Сегодня свободно {count} мест",
    sameDayFull: "Оставшиеся места на сегодня заняты",
    dateWord: "Дата",
    loading: "Загрузка…",
    free: "Свободно",
    busy: "Занято",
    picked: "Выбрано",
    slotsAria: "Свободное время",
    yourDetails: "Ваши данные",
    firstName: "Имя",
    lastName: "Фамилия",
    phone: "Телефон",
    phoneShort: "Телефон",
    chosenEmpty: "Время ещё не выбрано",
    submit: "Записаться",
    codeTitle: "Код подтверждения",
    codeLead: "Введите четырёхзначный код, отправленный на телефон. Запись подтвердится только после этого.",
    code: "Код",
    confirmBooking: "Подтвердить запись",
    resendCode: "Отправить новый код",
    confirmed: "Подтверждено",
    visitSaved: "Визит записан",
    newBooking: "Новая запись",
    findBooking: "Найти запись",
    mineLead: "Введите номер телефона, с которым вы записывались. Если запись есть, её можно отменить или перенести на другое свободное время.",
    check: "Проверить",
    mineEmpty: "Записи с этим номером нет.",
    mineFound: "Запись найдена",
    cancelBooking: "Отменить запись",
    otherTime: "Другое свободное время",
    address: "Гюмри, Гарегин Нжде 5/8",
    openMap: "Открыть адрес на карте",
    callClinic: "Позвонить",
    footerNote: "Чтобы отменить или перенести визит, откройте «Моя запись».",
    demo: "Демо: завтра, {tomorrow}, записаться нельзя. Ниже пример дня {sample}: занятые часы закрыты.",
    opensAt: "Откроется в {time}",
    noReception: "Приёма нет",
    exampleFree: "Пример: свободно {count} из 15",
    freeCount: "Свободно {count} из 15",
    allFull: "Все 15 мест заняты",
    minutes: "30 минут",
    chosenTime: "Выбрано время: {time}",
    noSlotsLeft: "На завтра свободных мест не осталось.",
    previewOnly: "Это только пример. Запись откроется накануне рабочего дня.",
    pickTime: "Выберите свободное время.",
    bookFail: "Не удалось записать.",
    network: "Нет связи. Попробуйте ещё раз.",
    confirmFail: "Не удалось подтвердить.",
    successCopy: "{name}, {date}, {time}. Приходите в клинику Cardiotonus: Гарегин Нжде 5/8.",
    loadFail: "Не удалось загрузить.",
    checkFail: "Не удалось проверить.",
    mineWhen: "{date}, {time}",
    yourTime: "Ваше время",
    choose: "Выбрать",
    cancelAsk: "Отменить эту запись?",
    cancelFail: "Не удалось отменить.",
    cancelled: "Запись отменена. С этим номером можно сделать новую запись.",
    moveFail: "Не удалось изменить время.",
    dateLoadFail: "Не удалось загрузить",
    slotsLoadFail: "Время не загрузилось. Обновите страницу.",
    previewMark: "{date} · пример",
    staff: "Персонал",
    adminHeading: "Панель администратора",
    adminLead: "Здесь видны записи дня, можно добавить место и отменить запись. Каждая запись хранится 1 месяц, затем исчезает сама.",
    password: "Пароль",
    showPassword: "Показать пароль",
    hidePassword: "Скрыть пароль",
    login: "Войти",
    registered: "Записанные",
    visits: "Визиты",
    day: "День",
    search: "Поиск",
    searchPlaceholder: "Имя или фамилия",
    all: "Все",
    logout: "Выход",
    emptyDay: "На этот день записей нет.",
    addBooking: "Добавить запись",
    staffNote: "Выберите свободное время и заполните данные.",
    staffOpen: "Время снова станет свободным, когда вы отмените запись.",
    staffClosed: "Этот день нерабочий или уже прошёл.",
    time: "Время",
    bookVerb: "Записать",
    countAll: "{count} записей",
    countDay: "{booked} записано · {free} свободно",
    emptySearch: "Такой записи нет.",
    emptyAll: "Записей пока нет.",
    freeTimes: "Свободное время: {times}",
    cancel: "Отменить",
    cancelVisit: "Отменить визит в {time} — {name}?",
    listFail: "Список не загрузился.",
    loginFail: "Не удалось войти.",
    allDays: "Все дни",
  },
};

const MONTHS = {
  hy: ["հունվարի", "փետրվարի", "մարտի", "ապրիլի", "մայիսի", "հունիսի", "հուլիսի", "օգոստոսի", "սեպտեմբերի", "հոկտեմբերի", "նոյեմբերի", "դեկտեմբերի"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
};
const WEEKDAYS = {
  hy: ["կիրակի", "երկուշաբթի", "երեքշաբթի", "չորեքշաբթի", "հինգշաբթի", "ուրբաթ", "շաբաթ"],
  ru: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
};

function currentLang() {
  return localStorage.getItem("cardiotonus-lang") === "ru" ? "ru" : "hy";
}

function fill(line, vars) {
  let value = line;
  if (!vars) return value;
  Object.entries(vars).forEach(([name, replacement]) => {
    value = value.split(`{${name}}`).join(String(replacement));
  });
  return value;
}

function t(key, vars) {
  const lang = currentLang();
  const line = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.hy[key] || key;
  return fill(line, vars);
}

function formatDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))) return iso || "";
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const lang = currentLang();
  const weekday = WEEKDAYS[lang][date.getUTCDay()];
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${day} ${MONTHS[lang][month - 1]} ${year}`;
}

function apply() {
  const lang = currentLang();
  document.documentElement.lang = lang;
  const titleKey = document.documentElement.dataset.titleKey;
  if (titleKey) document.title = t(titleKey);
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-content]").forEach((node) => {
    node.setAttribute("content", t(node.dataset.i18nContent));
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
  document.querySelectorAll("[data-set-lang]").forEach((button) => {
    const active = button.dataset.setLang === lang;
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function setLang(lang) {
  const next = lang === "ru" ? "ru" : "hy";
  localStorage.setItem("cardiotonus-lang", next);
  document.cookie = `lang=${next};path=/;max-age=31536000;SameSite=Lax`;
  apply();
  window.dispatchEvent(new CustomEvent("cardiotonus-lang", { detail: next }));
}

document.cookie = `lang=${currentLang()};path=/;max-age=31536000;SameSite=Lax`;
apply();
document.querySelectorAll("[data-set-lang]").forEach((button) => {
  button.addEventListener("click", () => setLang(button.dataset.setLang));
});

window.I18N = { t, formatDate, lang: currentLang, apply, setLang };
