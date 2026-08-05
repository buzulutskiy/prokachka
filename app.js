"use strict";

/* Главный экран — обложка, прогресс и одна кнопка;
   детали разнесены по вкладкам «Прогресс», «Награды» и «Обзор». */

/* Профили: у каждого своё хранилище и свой гист.
   Первый профиль живёт на старых ключах — иначе прежние данные потерялись бы. */
const PROFILES = [
  { id: "anton", name: "Антон", hint: "пианино, книги, пастель" },
  { id: "diana", name: "Диана", hint: "свои материалы" }
];
const LS_PROFILE = "keiko-profile";
let profileId = null;

const profile = () => PROFILES.find(p => p.id === profileId) || PROFILES[0];
const suffix = () => (profileId && profileId !== "anton") ? "-" + profileId : "";

const LS = {
  get data() { return "prokachka-data-v6" + suffix(); },
  get cfg() { return "prokachka-cfg-v1"; },        // токен и гист общие для всех профилей
  get older() {
    return suffix() ? [] : ["prokachka-data-v5", "prokachka-data-v4", "prokachka-data-v3", "prokachka-data-v2", "prokachka-data-v1"];
  }
};
const GIST_FILE = "prokachka.json";
const APP_VERSION = "2026.08.05 · 82";

const DEFAULT_PIECES = [
  { id: "bwv853", author: "И. С. Бах", name: "Прелюдия es-moll, BWV 853", bars: 40, art: "keys", tone: "violet",
    cover: "covers/bwv853.jpg", ratio: "509 / 720" },
  { id: "more", author: "Микаэл Таривердиев", name: "Мальчики и море", bars: 37, art: "wave", tone: "sea",
    cover: "covers/more.jpg", ratio: "508 / 720" }
];
// Курс пастели — данные из pastel-course-viewer
const DEFAULT_COURSE = {
  id: "test-drive",
  name: "Пастель · тест-драйв",
  author: "Первый курс",
  lessons: [
    { title: "О материалах: что нужно начинающему", dur: 205 },
    { title: "Пастель: Тест-драйв", dur: 81 },
    { title: "Тест-драйв, часть 1", dur: 600 },
    { title: "Тест-драйв, часть 2", dur: 581 },
    { title: "Тест-драйв, часть 3", dur: 628 },
    { title: "Тест-драйв, часть 4", dur: 743 }
  ]
};

const DEFAULT_BOOKS = [
  {
    id: "snow-1",
    title: "Снег на траве",
    author: "Юрий Норштейн",
    volume: "том 1",
    pages: 361,
    startPage: 183,
    art: "snow", tone: "snow",
    cover: "covers/snow.jpg", ratio: "514 / 720",
    chapters: [
      { name: "Феномен изображения", from: 6 },
      { name: "Цапля и журавль", from: 125 },
      { name: "Ёжик в тумане", from: 157 },
      { name: "Сказка сказок", from: 240 },
      { name: "Последняя страница", from: 361 }
    ]
  },
  {
    id: "odyssey",
    title: "Одиссея",
    author: "Гомер · перевод Григория Стариковского",
    volume: "Носорог · Jaromir Hladik press",
    pages: 464,
    startPage: 0,
    art: "wave", tone: "wine",
    cover: "covers/odyssey.jpg", ratio: "510 / 720",
    // страницы — по оглавлению издания «Носорога»
    chapters: [
      { name: "Песнь I. Совет богов. Афина у Телемаха", from: 7 },
      { name: "Песнь II. Собрание на Итаке", from: 19 },
      { name: "Песнь III. Пилос. Старик Нестор", from: 31 },
      { name: "Песнь IV. Спарта. Менелай и Елена", from: 44 },
      { name: "Песнь V. Плот. Прощание с Калипсо", from: 66 },
      { name: "Песнь VI. Навсикая", from: 79 },
      { name: "Песнь VII. Дворец Алкиноя", from: 88 },
      { name: "Песнь VIII. Песни Демодока", from: 98 },
      { name: "Песнь IX. Киклоп", from: 114 },
      { name: "Песнь X. Эол, лестригоны, Кирка", from: 129 },
      { name: "Песнь XI. Царство мёртвых", from: 144 },
      { name: "Песнь XII. Сирены, Скилла, быки Гелиоса", from: 161 },
      { name: "Песнь XIII. Высадка на Итаке", from: 173 },
      { name: "Песнь XIV. Хижина свинопаса", from: 185 },
      { name: "Песнь XV. Возвращение Телемаха", from: 199 },
      { name: "Песнь XVI. Отец и сын", from: 214 },
      { name: "Песнь XVII. Нищий во дворце. Пёс Аргос", from: 227 },
      { name: "Песнь XVIII. Драка с Иром", from: 243 },
      { name: "Песнь XIX. Шрам. Няня Евриклея", from: 255 },
      { name: "Песнь XX. Ночь перед развязкой", from: 271 },
      { name: "Песнь XXI. Лук", from: 282 },
      { name: "Песнь XXII. Расправа с женихами", from: 294 },
      { name: "Песнь XXIII. Ложе из оливы", from: 308 },
      { name: "Песнь XXIV. Мир на Итаке", from: 318 },
      { name: "Николай Гринцер. Конец «героического века»", from: 333 },
      { name: "Послесловие переводчика", from: 348 },
      { name: "Комментарии", from: 358 },
      { name: "Литература", from: 457 }
    ]
  },
  {
    id: "tesson",
    title: "В лесах Сибири",
    author: "Сильвен Тессон · перевод Оксаны Гилюк",
    volume: "февраль — июль 2010",
    pages: 240,
    startPage: 0,
    art: "pine", tone: "forest",
    cover: "covers/tesson.jpg", ratio: "470 / 720",
    // страницы месяцев — расчётные: дневник идёт почти равномерно
    chapters: [
      { name: "Шаг в сторону", from: 1 },
      { name: "Февраль. Лес", from: 9 },
      { name: "Март. Время", from: 45 },
      { name: "Апрель. Озеро", from: 81 },
      { name: "Май. Звери", from: 117 },
      { name: "Июнь. Слёзы", from: 153 },
      { name: "Июль. Умиротворение", from: 189 },
      { name: "Послесловие переводчицы", from: 225 }
    ]
  }
];

// материалы профиля Дианы
const DIANA_BOOKS = [
  {
    id: "screwtape",
    title: "Письма Баламута",
    author: "Клайв Стейплз Льюис",
    volume: "и «Баламут предлагает тост»",
    pages: 224,
    startPage: 94,       // прочитаны четырнадцать писем
    art: "quill", tone: "wine",
    cover: "covers/screwtape.jpg", ratio: "465 / 720",
    // страницы по оглавлению издания АСТ, «Эксклюзивная классика», 2023
    chapters: [
      { name: "Предисловие", from: 7 },
      { name: "Вступление", from: 19 },
      { name: "Письмо первое", from: 21 },
      { name: "Письмо второе", from: 26 },
      { name: "Письмо третье", from: 31 },
      { name: "Письмо четвёртое", from: 36 },
      { name: "Письмо пятое", from: 41 },
      { name: "Письмо шестое", from: 46 },
      { name: "Письмо седьмое", from: 51 },
      { name: "Письмо восьмое", from: 56 },
      { name: "Письмо девятое", from: 61 },
      { name: "Письмо десятое", from: 67 },
      { name: "Письмо одиннадцатое", from: 72 },
      { name: "Письмо двенадцатое", from: 77 },
      { name: "Письмо тринадцатое", from: 83 },
      { name: "Письмо четырнадцатое", from: 89 },
      { name: "Письмо пятнадцатое", from: 94 },
      { name: "Письмо шестнадцатое", from: 99 },
      { name: "Письмо семнадцатое", from: 104 },
      { name: "Письмо восемнадцатое", from: 110 },
      { name: "Письмо девятнадцатое", from: 115 },
      { name: "Письмо двадцатое", from: 120 },
      { name: "Письмо двадцать первое", from: 126 },
      { name: "Письмо двадцать второе", from: 132 },
      { name: "Письмо двадцать третье", from: 137 },
      { name: "Письмо двадцать четвёртое", from: 143 },
      { name: "Письмо двадцать пятое", from: 149 },
      { name: "Письмо двадцать шестое", from: 155 },
      { name: "Письмо двадцать седьмое", from: 161 },
      { name: "Письмо двадцать восьмое", from: 167 },
      { name: "Письмо двадцать девятое", from: 173 },
      { name: "Письмо тридцатое", from: 179 },
      { name: "Письмо тридцать первое", from: 185 },
      { name: "Баламут предлагает тост", from: 191 },
      { name: "Примечания", from: 213 }
    ]
  },
  {
    id: "unizhennye",
    title: "Униженные и оскорблённые",
    author: "Фёдор Достоевский",
    volume: "МИФ · «Вечные истории», 2026",
    pages: 384,
    startPage: 0,
    art: "lamp", tone: "night",
    cover: "covers/unizhennye.jpg", ratio: "426 / 720",
    chapters: [
      { name: "Часть первая", from: 5 },
      { name: "Часть вторая", from: 96 },
      { name: "Часть третья", from: 186 },
      { name: "Часть четвёртая", from: 281 },
      { name: "Эпилог", from: 355 }
    ]
  }
];

const FIRM_AT = 3;
const DONE_TITLES = ["Молодец!", "Красавчик!", "Есть!", "Сделано!"];
const DOW = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

/* ── Состояние ── */
let data = null;
let cfg = { token: "", gistId: "", lastSync: 0, tab: "home", period: "week", achView: null, shake: false, shakeAsked: false };
let period = "week";   // week | month — что показываем на «Прогрессе»
let achView = null;    // {track, pieceId} — открытый материал на вкладке наград
let online = navigator.onLine !== false;   // офлайн — не ошибка, а режим работы
let editingThought = null; // мысль, которую сейчас правим
let settingsOpen = false, settingsView = null;   // настройки — отдельный экран
let notesFocus = false;    // ставить ли курсор в поле мысли при следующем рендере
let notesFilter = "all";   // all | liked — что показываем в ленте мыслей
let shuffleThought = null; // id мысли, вытянутой наугад: лента сворачивается до неё одной
let achTop = "mats";        // верхний уровень «Достижений»: материалы или полка
let achTab = "ach";          // вкладка внутри материала: достижения / знания
let tab = "home";                 // home | progress | ach | overview
let calYear, calMonth;
let selectedDate = todayStr();
let pickHand = "right", pickFrom = 1, pickTo = 1, pending = [];
let pickPage = 0;
let pickLessons = [];             // выбранные уроки курса
let sheetMode = null;             // log | settings
let pushTimer = null, syncing = false;
let syncError = "";               // текст последней ошибки синхронизации
let newVersion = "";              // версия на сервере, если она свежее установленной

// без подключённого гиста данные жили бы только на телефоне — ввод запрещаем
const gistReady = () => !!(cfg.token && cfg.gistId);

const $ = (s) => document.querySelector(s);

/* ── Утилиты ── */
const uid = () => crypto.randomUUID();
const now = () => Date.now();
function todayStr() { return dateStr(new Date()); }
function dateStr(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function fromStr(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function daysBetween(a, b) { return Math.round((fromStr(b) - fromStr(a)) / 864e5); }

function fmtDay(s) {
  if (s === todayStr()) return "сегодня";
  if (s === dateStr(new Date(Date.now() - 864e5))) return "вчера";
  return new Intl.DateTimeFormat("ru", { day: "numeric", month: "long" }).format(fromStr(s));
}
function esc(v) {
  return String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function plural(n, one, few, many) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}
const takty = n => `${n} ${plural(n, "такт", "такта", "тактов")}`;
const stranic = n => `${n} ${plural(n, "страница", "страницы", "страниц")}`;
const handIcon = h => h === "left" ? "𝄢" : "𝄞";
const spanText = s => `${handIcon(s.hand)} ${s.from === s.to ? s.from + "-й" : s.from + "–" + s.to}`;
const rnd = l => l[Math.floor(Math.random() * l.length)];

function toast(text) {
  const el = $("#toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove("show"), 2300);
}

/* ── Хранилище ── */
function emptyData() {
  // у каждого профиля свой набор зашитых материалов
  const own = profileId === "anton" || !profileId;
  if (!own) return {
    active: "book",
    piano: { pieces: [], activePiece: "", entries: [] },
    book: { books: DIANA_BOOKS.map(b => ({ ...b, updatedAt: 0 })), activeBook: DIANA_BOOKS[0].id, entries: [] },
    pastel: { course: null, entries: [] },
    shop: { theme: "rose", purchases: [] },
    thoughts: [], weekGoal: 4, freezes: [], archive: []
  };
  return {
    active: "piano",
    piano: { pieces: DEFAULT_PIECES.map(p => ({ ...p, updatedAt: 0 })), activePiece: DEFAULT_PIECES[0].id, entries: [] },
    book: { books: DEFAULT_BOOKS.map(b => ({ ...b, updatedAt: 0 })), activeBook: DEFAULT_BOOKS[0].id, entries: [] },
    pastel: { course: { ...DEFAULT_COURSE, updatedAt: 0 }, entries: [] },
    shop: { theme: "dusk", purchases: [] },   // купленные темы и мелочи
    thoughts: [],  // мысли по ходу материала — отдельно от отметок занятий
    weekGoal: 4,   // общая цель: сколько дней в неделю заниматься чем угодно
    freezes: [],   // периоды паузы: отпуск, болезнь — серия их не замечает
    archive: []    // пройденные материалы
  };
}

function migrate(obj) {
  const base = emptyData();
  if (!obj || typeof obj !== "object") return base;

  // схемы старого приложения: {piece, entries:[{spans|right/left}]} и {hobbies, sessions}
  if (!obj.piano && !obj.book && (obj.entries || obj.sessions)) {
    const old = obj.entries || obj.sessions || [];
    obj = { piano: { piece: obj.piece, entries: old.map(e => ({
      id: e.id, date: e.date, note: e.note || "",
      createdAt: e.createdAt || 0, updatedAt: e.updatedAt || 0, deleted: e.deleted,
      spans: Array.isArray(e.spans) ? e.spans : [
        ...(e.right ? [{ hand: "right", from: 1, to: e.right }] : []),
        ...(e.left ? [{ hand: "left", from: 1, to: e.left }] : [])
      ]
    })) } };
  }

  const own = profileId === "anton" || !profileId;

  if (obj.piano && !own) {
    base.piano.pieces = Array.isArray(obj.piano.pieces) ? obj.piano.pieces : [];
    base.piano.entries = obj.piano.entries || [];
    if (obj.piano.activePiece) base.piano.activePiece = obj.piano.activePiece;
  } else if (obj.piano) {
    // старая схема: одна композиция в piano.piece
    if (obj.piano.piece && !obj.piano.pieces) {
      // из старой схемы берём только число тактов — название и автор у нас свои
      const bars = Number(obj.piano.piece.bars);
      base.piano.pieces[0] = Object.assign({}, DEFAULT_PIECES[0],
        bars > 0 && bars <= 2000 ? { bars } : {}, { id: "bwv853" });
      base.piano.entries = (obj.piano.entries || []).map(e => ({ ...e, pieceId: e.pieceId || "bwv853" }));
    } else {
      if (Array.isArray(obj.piano.pieces) && obj.piano.pieces.length) {
        // сохраняем пользовательские правки, но гарантируем наличие зашитых пьес
        base.piano.pieces = DEFAULT_PIECES.map(def => {
          const saved = obj.piano.pieces.find(p => p.id === def.id);
          // оформление обложки всегда наше, из сохранённого берём правки пользователя
          return saved
            ? Object.assign({}, def, saved, { art: def.art, tone: def.tone })
            : { ...def, updatedAt: 0 };
        });
        for (const extra of obj.piano.pieces) {
          if (!base.piano.pieces.some(p => p.id === extra.id)) base.piano.pieces.push(extra);
        }
      }
      base.piano.entries = (obj.piano.entries || []).map(e => ({ ...e, pieceId: e.pieceId || "bwv853" }));
    }
    if (obj.piano.activePiece && base.piano.pieces.some(p => p.id === obj.piano.activePiece)) {
      base.piano.activePiece = obj.piano.activePiece;
    }
  }

  if (obj.book && !own) {
    const saved = Array.isArray(obj.book.books) ? obj.book.books : [];
    base.book.books = DIANA_BOOKS.map(def => {
      const was = saved.find(b => b.id === def.id);
      return was ? Object.assign({}, def, was, { art: def.art, tone: def.tone, chapters: def.chapters, startPage: def.startPage }) : { ...def, updatedAt: 0 };
    });
    for (const extra of saved) if (!base.book.books.some(b => b.id === extra.id)) base.book.books.push(extra);
    base.book.entries = obj.book.entries || [];
    if (obj.book.activeBook && base.book.books.some(b => b.id === obj.book.activeBook)) base.book.activeBook = obj.book.activeBook;
  } else if (obj.book) {
    base.book.entries = obj.book.entries || [];
    // старая схема: одна книга в book.book; новая — список books
    const saved = Array.isArray(obj.book.books) ? obj.book.books
      : obj.book.book ? [Object.assign({}, obj.book.book, { id: obj.book.book.id || "snow-1" })] : [];
    base.book.books = DEFAULT_BOOKS.map(def => {
      const был = saved.find(b => b.id === def.id);
      // оформление обложки и оглавление всегда наши, из сохранённого берём правки пользователя
      return был ? Object.assign({}, def, был, { art: def.art, tone: def.tone, chapters: def.chapters, startPage: def.startPage }) : { ...def, updatedAt: 0 };
    });
    for (const extra of saved) if (!base.book.books.some(b => b.id === extra.id)) base.book.books.push(extra);
    if (obj.book.activeBook && base.book.books.some(b => b.id === obj.book.activeBook)) base.book.activeBook = obj.book.activeBook;
  }
  if (obj.pastel && !own) {
    base.pastel.entries = obj.pastel.entries || [];
    if (obj.pastel.course) base.pastel.course = obj.pastel.course;
  } else if (obj.pastel) {
    base.pastel.entries = obj.pastel.entries || [];
    if (obj.pastel.course) base.pastel.course = Object.assign({}, DEFAULT_COURSE, obj.pastel.course, { lessons: DEFAULT_COURSE.lessons });
  }
  if (obj.shop) {
    if (Array.isArray(obj.shop.purchases)) base.shop.purchases = obj.shop.purchases;
    if (typeof obj.shop.theme === "string") base.shop.theme = obj.shop.theme;
  }
  if (Number(obj.weekGoal) > 0) base.weekGoal = Math.min(7, Math.round(obj.weekGoal));
  if (Array.isArray(obj.thoughts)) base.thoughts = obj.thoughts;
  if (Array.isArray(obj.freezes)) base.freezes = obj.freezes;
  if (Array.isArray(obj.archive)) base.archive = obj.archive;

  // записи книги и курса привязываем к конкретному материалу
  const fallbackBook = own ? "snow-1" : (base.book.books[0] ? base.book.books[0].id : "");
  base.book.entries = base.book.entries.map(e => ({ ...e, bookId: e.bookId || fallbackBook }));
  const courseId = (base.pastel.course && base.pastel.course.id) || "test-drive";
  base.pastel.entries = base.pastel.entries.map(e => ({ ...e, courseId: e.courseId || courseId }));

  if (["book", "piano", "pastel"].includes(obj.active)) base.active = obj.active;
  return base;
}

function load() {
  let raw = null;
  for (const key of [LS.data, ...LS.older]) {
    try {
      const val = JSON.parse(localStorage.getItem(key) || "null");
      if (val) { raw = val; break; }
    } catch {}
  }
  data = migrate(raw);
  try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem(LS.cfg)) || {}); } catch {}
}
const saveData = () => localStorage.setItem(LS.data, JSON.stringify(data));
const saveCfg = () => localStorage.setItem(LS.cfg, JSON.stringify(cfg));

/* ── Выборки ── */
const isBook = () => data.active === "book";
const isPastel = () => data.active === "pastel";
const isPiano = () => data.active === "piano";
const trackOf = () => data[data.active];
const piece = () => data.piano.pieces.find(p => p.id === data.piano.activePiece) || data.piano.pieces[0];
const course = () => data.pastel.course || { id: "", name: "", author: "", lessons: [] };
const book = () => data.book.books.find(b => b.id === data.book.activeBook) || data.book.books[0];
const bookEntriesOf = (id) => data.book.entries.filter(e => !e.deleted && (e.bookId || "snow-1") === id);

// сколько страниц прочитано за период — считаем прирост отдельно по каждой книге
function pagesRead(from, to) {
  let sum = 0;
  for (const b of data.book.books) {
    const list = bookEntriesOf(b.id);
    let before = b.startPage || 0, after = 0;
    for (const e of list) {
      if (e.date < from) before = Math.max(before, e.page || 0);
      else if (e.date <= to) after = Math.max(after, e.page || 0);
    }
    if (after) sum += Math.max(0, after - before);
  }
  return sum;
}
// записи текущего трека, а для пианино — ещё и текущей композиции
const entries = () => isPiano()
  ? data.piano.entries.filter(e => !e.deleted && (e.pieceId || "bwv853") === piece().id)
  : isBook()
    ? bookEntriesOf(book().id)
    : data.pastel.entries.filter(e => !e.deleted && (e.courseId || course().id) === course().id);
const entryFor = d => entries().find(e => e.date === d);

// день попадает в паузу (отпуск) — такие дни серию не рвут
function isFrozen(ds) {
  return (data.freezes || []).some(f => !f.deleted && ds >= f.from && ds <= f.to);
}

function activeFreeze() {
  const t = todayStr();
  return (data.freezes || []).find(f => !f.deleted && t >= f.from && t <= f.to) || null;
}

// дни, когда было занятие любым материалом — серия общая для всех хобби
function activeDays() {
  const out = new Set();
  for (const e of [...data.piano.entries, ...data.book.entries, ...data.pastel.entries])
    if (!e.deleted) out.add(e.date);
  return out;
}

// серия по конкретному материалу: занимался именно им день за днём
function streak() {
  const days = new Set(entries().map(e => e.date));
  return streakFrom(days);
}

// общая серия: важно заниматься каждый день, а чем — не важно
function streakAll() {
  return streakFrom(activeDays());
}

function streakFrom(days) {
  let n = 0, skipped = 0, steps = 0;
  const d = new Date();
  if (!days.has(dateStr(d)) && !isFrozen(dateStr(d))) d.setDate(d.getDate() - 1);
  while (steps++ < 4000) {
    const ds = dateStr(d);
    if (days.has(ds)) n++;
    else if (isFrozen(ds)) skipped++;      // пауза: пропускаем день молча
    else break;
    if (n + skipped > 3650) break;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
function mondayOf(d) { const r = new Date(d); r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); return r; }

function passes() {
  const bars = piece().bars;
  const right = new Array(bars + 1).fill(0), left = new Array(bars + 1).fill(0);
  for (const e of entries())
    for (const s of e.spans || []) {
      const arr = s.hand === "left" ? left : right;
      for (let b = Math.max(1, s.from); b <= Math.min(bars, s.to); b++) arr[b]++;
    }
  return { right, left };
}

function pianoStats() {
  const bars = piece().bars;
  const p = passes();
  const list = entries().slice().sort((a, b) => a.date < b.date ? -1 : 1);
  const cnt = (arr, min) => arr.slice(1).filter(v => v >= min).length;
  const touchedR = cnt(p.right, 1), touchedL = cnt(p.left, 1);
  const firmR = cnt(p.right, FIRM_AT), firmL = cnt(p.left, FIRM_AT);
  const maxPass = Math.max(0, ...p.right.slice(1), ...p.left.slice(1));

  let bothInOne = false, maxRun = 0, weekend = false, comeback = false, prev = null;
  for (const e of list) {
    if (new Set((e.spans || []).map(s => s.hand)).size >= 2) bothInOne = true;
    for (const s of e.spans || []) maxRun = Math.max(maxRun, s.to - s.from + 1);
    const dw = fromStr(e.date).getDay();
    if (dw === 0 || dw === 6) weekend = true;
    if (prev && daysBetween(prev, e.date) >= 7) comeback = true;
    prev = e.date;
  }
  return {
    bars, passes: p, days: list.length, streak: streak(), streakAll: streakAll(),
    touchedR, touchedL, firmR, firmL, maxPass,
    pctR: bars ? touchedR / bars * 100 : 0,
    pctL: bars ? touchedL / bars * 100 : 0,
    pct: bars ? (touchedR + touchedL) / (bars * 2) * 100 : 0,
    pctFirm: bars ? (firmR + firmL) / (bars * 2) * 100 : 0,
    bothInOne, maxRun, weekend, comeback
  };
}

function bookProgress() {
  const b = book();
  let page = b.startPage || 0;
  for (const e of bookEntriesOf(b.id)) page = Math.max(page, e.page || 0);
  return Math.min(page, b.pages);
}
function chapterAt(page) {
  const list = book().chapters;
  let cur = list[0];
  for (const c of list) if (page >= c.from) cur = c;
  return cur;
}
function bookStats() {
  const b = book();
  const list = bookEntriesOf(b.id).slice().sort((a, x) => a.date < x.date ? -1 : 1);
  const page = bookProgress();
  let maxJump = 0, weekend = false, comeback = false, notes = 0, reread = false;
  let running = b.startPage || 0, prev = null;
  for (const e of list) {
    const jump = (e.page || 0) - running;
    if (jump > maxJump) maxJump = jump;
    if ((e.page || 0) < running) reread = true;
    running = Math.max(running, e.page || 0);
    if (e.note) notes++;
    const dw = fromStr(e.date).getDay();
    if (dw === 0 || dw === 6) weekend = true;
    if (prev && daysBetween(prev, e.date) >= 7) comeback = true;
    prev = e.date;
  }
  return {
    pages: b.pages, page, pct: b.pages ? page / b.pages * 100 : 0,
    days: list.length, streak: streak(), streakAll: streakAll(),
    maxJump, weekend, comeback, notes, reread, chapter: chapterAt(page)
  };
}

/* ── Пастель ── */
function doneLessons() {
  const set = new Set();
  for (const e of data.pastel.entries.filter(e => !e.deleted))
    for (const i of e.lessons || []) set.add(i);
  return set;
}

function pastelStats() {
  const c = course();
  const done = doneLessons();
  const list = data.pastel.entries.filter(e => !e.deleted).slice().sort((a, b) => a.date < b.date ? -1 : 1);
  const totalSec = c.lessons.reduce((a, l) => a + l.dur, 0);
  const doneSec = c.lessons.reduce((a, l, i) => a + (done.has(i) ? l.dur : 0), 0);

  let weekend = false, comeback = false, notes = 0, maxAtOnce = 0, prev = null;
  for (const e of list) {
    maxAtOnce = Math.max(maxAtOnce, (e.lessons || []).length);
    if (e.note) notes++;
    const dw = fromStr(e.date).getDay();
    if (dw === 0 || dw === 6) weekend = true;
    if (prev && daysBetween(prev, e.date) >= 7) comeback = true;
    prev = e.date;
  }

  const next = c.lessons.findIndex((_, i) => !done.has(i));
  return {
    lessons: c.lessons.length, done: done.size, doneSet: done,
    pct: c.lessons.length ? done.size / c.lessons.length * 100 : 0,
    totalSec, doneSec, minutes: Math.round(doneSec / 60),
    days: list.length, streak: streak(), streakAll: streakAll(),
    weekend, comeback, notes, maxAtOnce,
    nextLesson: next < 0 ? null : next
  };
}

const curStats = () => isBook() ? bookStats() : isPastel() ? pastelStats() : pianoStats();

/* ── Достижения ── */
const ACH_PIANO = [
  { id: "first",    icon: "🌱", name: "Первое касание",      hint: "Отметить первое занятие",               test: s => s.days >= 1 },
  { id: "bar1",     icon: "🎯", name: "Первый такт",         hint: "Разобрать хотя бы один такт",           test: s => s.touchedR + s.touchedL >= 1 },
  { id: "r10",      icon: "𝄞", name: "Правая проснулась",   hint: "10% правой руки",                       test: s => s.pctR >= 10 },
  { id: "l10",      icon: "𝄢", name: "Левая подтянулась",   hint: "10% левой руки",                        test: s => s.pctL >= 10 },
  { id: "both",     icon: "🤲", name: "В четыре руки",       hint: "Обе руки за одно занятие",              test: s => s.bothInOne },
  { id: "again",    icon: "🔁", name: "А ну-ка ещё разок",   hint: "Пройти один такт трижды",               test: s => s.maxPass >= 3 },
  { id: "streak3",  icon: "🔥", name: "Три дня подряд",      hint: "Серия из 3 дней",                       test: s => s.streak >= 3 },
  { id: "q1",       icon: "🧗", name: "Четверть пути",       hint: "25% композиции",                        test: s => s.pct >= 25 },
  { id: "run8",     icon: "🏃", name: "Длинный забег",       hint: "8 тактов подряд за раз",                test: s => s.maxRun >= 8 },
  { id: "weekend",  icon: "🎩", name: "Выходной у рояля",    hint: "Позаниматься в выходной",               test: s => s.weekend, secret: true },
  { id: "streak7",  icon: "🗓️", name: "Неделя без пропусков", hint: "Серия из 7 дней",                      test: s => s.streak >= 7 },
  { id: "stubborn", icon: "🪨", name: "Упрямец",             hint: "Один такт — семь раз",                  test: s => s.maxPass >= 7, secret: true },
  { id: "r50",      icon: "🌗", name: "Половина правой",     hint: "50% правой руки",                       test: s => s.pctR >= 50 },
  { id: "l50",      icon: "🌗", name: "Половина левой",      hint: "50% левой руки",                        test: s => s.pctL >= 50 },
  { id: "half",     icon: "⛰️", name: "Половина пути",       hint: "50% композиции",                        test: s => s.pct >= 50 },
  { id: "firm10",   icon: "🧱", name: "Крепкий фундамент",   hint: `10 тактов по ${FIRM_AT} прохода`,       test: s => s.firmR + s.firmL >= 10 },
  { id: "days20",   icon: "📚", name: "Двадцать вечеров",    hint: "20 занятий всего",                      test: s => s.days >= 20 },
  { id: "comeback", icon: "🌙", name: "Возвращение",         hint: "Вернуться после перерыва",              test: s => s.comeback, secret: true },
  { id: "streak14", icon: "💎", name: "Две недели подряд",   hint: "Серия из 14 дней",                      test: s => s.streak >= 14 },
  { id: "q3",       icon: "🧠", name: "Три четверти",        hint: "75% композиции",                        test: s => s.pct >= 75 },
  { id: "streak30", icon: "👑", name: "Месяц дисциплины",    hint: "Серия из 30 дней",                      test: s => s.streak >= 30 },
  { id: "r100",     icon: "🏅", name: "Правая готова",       hint: "100% правой руки",                      test: s => s.pctR >= 100 },
  { id: "l100",     icon: "🏅", name: "Левая готова",        hint: "100% левой руки",                       test: s => s.pctL >= 100 },
  { id: "all100",   icon: "🎼", name: "Вся вещь пройдена",   hint: "100% композиции",                       test: s => s.pct >= 100 },
  { id: "polished", icon: "💍", name: "Отшлифовано",         hint: `Каждый такт по ${FIRM_AT} прохода`,     test: s => s.pctFirm >= 100 },
  { id: "bach",     icon: "🏆", name: "Бах доволен",         hint: "Пройти и отшлифовать целиком",          test: s => s.pct >= 100 && s.pctFirm >= 100 && s.days >= 30, secret: true }
];

const ACH_BOOK = [
  { id: "open",     icon: "🔖", name: "Закладка легла",        hint: "Отметить первое чтение",           test: s => s.days >= 1 },
  { id: "image",    icon: "🎞️", name: "Феномен изображения",   hint: "Дочитать первую главу",            test: s => s.page >= 124 },
  { id: "heron",    icon: "🕊️", name: "Вечная погоня",         hint: "Дочитать «Цаплю и журавля»",       test: s => s.page >= 156 },
  { id: "fog",      icon: "🌫️", name: "Вошёл в туман",         hint: "25% книги",                        test: s => s.pct >= 25 },
  { id: "p20",      icon: "📗", name: "Хороший вечер",         hint: "20 страниц за раз",                test: s => s.maxJump >= 20 },
  { id: "p200",     icon: "🚩", name: "Двухсотая",             hint: "Дочитать до 200-й страницы",       test: s => s.page >= 200 },
  { id: "half",     icon: "🌗", name: "Экватор",               hint: "50% книги",                        test: s => s.pct >= 50 },
  { id: "streak3",  icon: "🔥", name: "Три вечера подряд",     hint: "Серия из 3 дней",                  test: s => s.streak >= 3 },
  { id: "note",     icon: "✍️", name: "На полях",              hint: "Оставить заметку",                 test: s => s.notes >= 1, secret: true },
  { id: "horse",    icon: "🐴", name: "А лошадка-то в тумане", hint: "Вернуться назад по страницам",     test: s => s.reread, secret: true },
  { id: "hedgehog", icon: "🦔", name: "Ёжик вышел из тумана",  hint: "Дочитать «Ёжика в тумане»",        test: s => s.page >= 239 },
  { id: "owl",      icon: "🦉", name: "Филин следит",          hint: "Почитать в выходной",              test: s => s.weekend, secret: true },
  { id: "samovar",  icon: "🫖", name: "Медвежонок с самоваром", hint: "10 вечеров с книгой",             test: s => s.days >= 10 },
  { id: "p50",      icon: "🚀", name: "Проглотил залпом",      hint: "50 страниц за раз",                test: s => s.maxJump >= 50 },
  { id: "streak7",  icon: "🗓️", name: "Неделя с книгой",       hint: "Серия из 7 дней",                  test: s => s.streak >= 7 },
  { id: "apple",    icon: "🍎", name: "Вечное яблоко",         hint: "75% книги",                        test: s => s.pct >= 75 },
  { id: "coat",     icon: "🧣", name: "Как «Шинель»",          hint: "Вернуться после перерыва",         test: s => s.comeback, secret: true },
  { id: "streak14", icon: "💎", name: "Две недели подряд",     hint: "Серия из 14 дней",                 test: s => s.streak >= 14 },
  { id: "tale",     icon: "🌌", name: "Сказка сказок",         hint: "Дочитать «Сказку сказок»",         test: s => s.page >= 360 },
  { id: "stars",    icon: "🌟", name: "Звёзды над колодцем",   hint: "90% книги",                        test: s => s.pct >= 90 },
  { id: "days20",   icon: "📚", name: "Двадцать вечеров",      hint: "20 вечеров с книгой",              test: s => s.days >= 20 },
  { id: "streak30", icon: "👑", name: "Месяц с книгой",        hint: "Серия из 30 дней",                 test: s => s.streak >= 30 },
  { id: "wolf",     icon: "🐺", name: "Волчок унёс книжку",    hint: "Дочитать книгу до конца",          test: s => s.pct >= 100 },
  { id: "snow",     icon: "🏆", name: "Снег на траве",         hint: "Прочитать том за 20+ вечеров",     test: s => s.pct >= 100 && s.days >= 20, secret: true }
];

const WORDS_PIANO = {
  first: "Начало положено. Дальше — только интереснее",
  bar1: "Первый такт — уже не ноль. Отсюда растёт вся прелюдия",
  r10: "Правая рука вошла во вкус",
  l10: "Левая догоняет — бас держит всё здание",
  both: "Обе руки за один вечер. Так рождается ансамбль",
  again: "Повтор — не топтание на месте, а то, как учат по-настоящему",
  q1: "Четверть прелюдии в руках. Разгон закончен, поехали",
  run8: "Восемь тактов за раз — уверенный, широкий заход",
  stubborn: "Этот такт не сдавался семь раз. Ты оказался упрямее",
  r50: "Половина правой руки. Мелодия уже узнаётся",
  l50: "Половина левой. Гармония встала на место",
  half: "Половина пути пройдена. Вторая всегда идёт быстрее",
  firm10: "Десять тактов не просто пройдены — они закреплены",
  r100: "Правая рука знает прелюдию от первой до последней ноты",
  l100: "Левая рука прошла всю вещь. Фундамент готов",
  all100: "Вся прелюдия пройдена обеими руками. Огромная работа!",
  polished: "Каждый такт отшлифован. Теперь это твоя музыка",
  bach: "Ты прошёл вещь целиком, закрепил и не бросил. Автор бы пожал руку",
  streak3: "Три дня подряд. Это уже не случайность, это привычка",
  streak7: "Целая неделя без пропусков. Дисциплина уровня «профи»",
  streak14: "Две недели подряд. Мало кто доходит до этой отметки",
  streak30: "Месяц без единого пропуска. Это уровень характера",
  days20: "Двадцать вечеров с инструментом. Это уже история",
  weekend: "Выходной — а ты за инструментом. Уважение",
  comeback: "Вернулся после перерыва — самое сложное и самое ценное",
  q3: "Три четверти! Финиш уже виден"
};

const WORDS_BOOK = {
  open: "Закладка легла между страниц. Дальше — туман, цапля и вся мультипликация",
  image: "Самая плотная глава позади. Теперь ты знаешь, почему изображение — это не картинка",
  heron: "Цапля к журавлю, журавль к цапле — и так вечно. А ты главу дочитал",
  fog: "Туман сгущается, за спиной — четверть книги",
  p20: "Двадцать страниц за вечер. Медвежонок бы уже заждался с самоваром",
  p200: "Двухсотая взята. Дальше по тексту — только глубже в лес",
  half: "Экватор! Ровно половина. Отсюда книга читается сама",
  note: "Мысль на полях дороже десяти прочитанных страниц",
  horse: "Лошадка то появляется, то исчезает — и ты вернулся на страницы назад. Правильно, там было важное",
  hedgehog: "«Медвежоно-о-ок!» — Ёжик выбрался из тумана, и глава закрыта",
  owl: "Филин ходит за тобой по выходным и подглядывает, как ты читаешь",
  samovar: "Десять вечеров с книгой. Самовар остыл, можжевеловые веточки кончились, а ты всё читаешь",
  p50: "Пятьдесят страниц за присест — проглотил, как Волчок",
  streak3: "Три вечера подряд. Это уже ритуал",
  streak7: "Неделя без пропусков. Книга стала частью вечера",
  apple: "Три четверти. То самое вечное яблоко в росе — почти дотянулся",
  coat: "Норштейн делает «Шинель» десятилетиями и не бросает. Ты вернулся после перерыва — из той же породы",
  streak14: "Две недели подряд. Такое упорство встречается реже, чем законченная «Шинель»",
  tale: "«Сказка сказок» прочитана — самое личное, что он снял",
  stars: "Девяносто процентов. Звёзды над колодцем уже видно",
  days20: "Двадцать вечеров с этим томом. Уже не чтение, а отношения",
  streak30: "Месяц с книгой без единого пропуска",
  wolf: "Волчок пришёл и унёс книжку — потому что ты дочитал её до конца!",
  snow: "«Снег на траве» — от корки до корки, вечер за вечером"
};

const ACH_PASTEL = [
  { id: "kit",      icon: "🧰", name: "Собрал набор",       hint: "Пройти урок о материалах",          test: s => s.doneSet.has(0) },
  { id: "first",    icon: "🎨", name: "Первый мазок",       hint: "Пройти первый урок",                test: s => s.done >= 1 },
  { id: "part1",    icon: "🖐️", name: "Руки в пастели",     hint: "Дойти до первой большой части",     test: s => s.doneSet.has(2) },
  { id: "streak3",  icon: "🔥", name: "Три дня подряд",     hint: "Серия из 3 дней",                   test: s => s.streak >= 3 },
  { id: "half",     icon: "🌗", name: "Половина курса",     hint: "50% уроков",                        test: s => s.pct >= 50 },
  { id: "hour",     icon: "⏱️", name: "Час у мольберта",    hint: "Пройти 60 минут курса",             test: s => s.minutes >= 60 },
  { id: "note",     icon: "✍️", name: "Заметка к уроку",    hint: "Оставить заметку",                  test: s => s.notes >= 1, secret: true },
  { id: "double",   icon: "⚡", name: "Два за раз",         hint: "Пройти два урока за день",          test: s => s.maxAtOnce >= 2 },
  { id: "weekend",  icon: "🎩", name: "Воскресный этюд",    hint: "Позаниматься в выходной",           test: s => s.weekend, secret: true },
  { id: "streak7",  icon: "🗓️", name: "Неделя с пастелью",  hint: "Серия из 7 дней",                   test: s => s.streak >= 7 },
  { id: "comeback", icon: "🌙", name: "Пыль с пастели",     hint: "Вернуться после перерыва",          test: s => s.comeback, secret: true },
  { id: "q3",       icon: "🧠", name: "Три четверти",       hint: "75% курса",                         test: s => s.pct >= 75 },
  { id: "days10",   icon: "📚", name: "Десять подходов",    hint: "10 занятий всего",                  test: s => s.days >= 10 },
  { id: "full",     icon: "🖼️", name: "Тест-драйв пройден", hint: "Пройти курс целиком",               test: s => s.pct >= 100 },
  { id: "master",   icon: "🏆", name: "Пастелист",          hint: "Пройти курс и не бросить",          test: s => s.pct >= 100 && s.days >= 6, secret: true }
];

const WORDS_PASTEL = {
  kit: "Бумага, мелки, фиксатив — теперь понятно, что покупать и зачем",
  first: "Первый урок позади. Руки ещё чистые, но это ненадолго",
  part1: "Пошла настоящая работа — большие части тест-драйва",
  streak3: "Три дня подряд с пастелью. Пальцы уже в пигменте",
  half: "Половина курса пройдена. Дальше — интереснее",
  hour: "Целый час занятий по курсу. Это уже не проба, а практика",
  note: "Записал мысль по уроку — так знания и остаются",
  double: "Два урока за один заход — залпом!",
  weekend: "Выходной, а ты у мольберта. Настоящий художник",
  streak7: "Неделя без пропусков. Пастель стала привычкой",
  comeback: "Стряхнул пыль с пастели и вернулся. Это дорогого стоит",
  q3: "Три четверти курса. Финал близко",
  days10: "Десять подходов к курсу. Основательно",
  full: "Тест-драйв пройден полностью — от материалов до четвёртой части!",
  master: "Курс пройден, и ты не бросил на середине. Теперь ты пастелист"
};

/* Контекстные названия и тексты для конкретных пьес:
   у Баха — барочные, у «Мальчиков и море» — морские. */
const PIECE_FLAVOR = {
  bwv853: {
    first:    ["Первое касание", "Начало положено. Дальше — только интереснее"],
    bar1:     ["Первый такт прелюдии", "Первый такт — уже не ноль. Отсюда растёт вся прелюдия"],
    r10:      ["Правая проснулась", "Верхний голос повёл мелодию"],
    l10:      ["Бас вступил", "Левая держит фундамент — как и положено у Баха"],
    both:     ["В четыре руки", "Обе руки за один вечер. Так рождается полифония"],
    again:    ["А ну-ка ещё разок", "Повтор — не топтание на месте, а то, как учат по-настоящему"],
    run8:     ["Длинная фраза", "Восемь тактов за раз — широкий, уверенный заход"],
    q1:       ["Четверть пути", "Четверть прелюдии в руках. Разгон закончен"],
    half:     ["Половина прелюдии", "Половина пути пройдена. Вторая всегда идёт быстрее"],
    q3:       ["Три четверти", "Три четверти! Финал уже слышен"],
    stubborn: ["Упрямец", "Этот такт не сдавался семь раз. Ты оказался упрямее"],
    firm10:   ["Крепкий фундамент", "Десять тактов не просто пройдены — они закреплены"],
    all100:   ["Вся прелюдия пройдена", "Прелюдия сыграна обеими руками от начала до конца!"],
    polished: ["Отшлифовано", "Каждый такт отшлифован. Теперь это твоя музыка"],
    weekend:  ["Выходной у рояля", "Выходной — а ты за инструментом. Уважение"]
  },
  more: {
    first:    ["Вышел к морю", "Первый подход к «Мальчикам». Впереди целое море"],
    bar1:     ["Первая волна", "Один такт есть. Волна пошла"],
    r10:      ["Мелодия зашумела", "Правая ведёт тему — ту самую, из «До свидания, мальчики!»"],
    l10:      ["Прибой в басу", "Левая качает волну под мелодией"],
    both:     ["Море и берег", "Обе руки вместе — вот теперь звучит"],
    again:    ["Волна за волной", "Повторил тот же такт — как прибой, снова и снова"],
    run8:     ["Длинная волна", "Восемь тактов на одном дыхании"],
    q1:       ["Отплыл от берега", "Четверть пьесы позади, берег уже далеко"],
    half:     ["До горизонта", "Половина «Мальчиков» в руках"],
    q3:       ["Виден берег", "Три четверти. Финал близко"],
    stubborn: ["Упрямый прибой", "Семь раз об один такт — и он сдался"],
    firm10:   ["Крепкий берег", "Десять тактов держатся намертво"],
    all100:   ["Море целиком", "Вся пьеса пройдена обеими руками!"],
    polished: ["Отшлифовано прибоем", "Каждый такт выглажен, как галька"],
    weekend:  ["Выходной у моря", "Выходной — а ты за инструментом. Уважение"]
  }
};

const ACH_ODYSSEY = [
  { id: "sail",     icon: "⛵", name: "Отплытие",              hint: "Отметить первое чтение",              test: s => s.days >= 1 },
  { id: "muse",     icon: "🪕", name: "Муза, поведай",          hint: "Дочитать первую песнь",               test: s => s.page >= 19 },
  { id: "telem",    icon: "🧭", name: "Телемахия",              hint: "Пройти четыре песни о сыне",          test: s => s.page >= 66 },
  { id: "raft",     icon: "🪵", name: "Плот из двадцати брёвен", hint: "Дочитать до песни VI",               test: s => s.page >= 79 },
  { id: "nausicaa", icon: "🧺", name: "Мяч у реки",             hint: "Встретить Навсикаю (песнь VI)",       test: s => s.page >= 88 },
  { id: "bard",     icon: "🎻", name: "Слепой певец",           hint: "Дослушать песни Демодока",            test: s => s.page >= 114 },
  { id: "nobody",   icon: "👁️", name: "Меня зовут Никто",       hint: "Пережить киклопа (песнь IX)",         test: s => s.page >= 129 },
  { id: "circe",    icon: "🐖", name: "Год у Кирки",            hint: "Дочитать песнь X",                    test: s => s.page >= 144 },
  { id: "nekyia",   icon: "🕯️", name: "Разговор с тенями",      hint: "Спуститься в Аид (песнь XI)",         test: s => s.page >= 161 },
  { id: "sirens",   icon: "🎶", name: "Привязан к мачте",       hint: "Пройти сирен и Скиллу",               test: s => s.page >= 173 },
  { id: "home",     icon: "🏝️", name: "Спящим сошёл на берег",  hint: "Вернуться на Итаку (песнь XIII)",     test: s => s.page >= 185 },
  { id: "eumaios",  icon: "🐷", name: "Гость свинопаса",        hint: "Дочитать песнь XIV",                  test: s => s.page >= 199 },
  { id: "reunion",  icon: "🫂", name: "Отец и сын",             hint: "Дочитать песнь XVI",                  test: s => s.page >= 227 },
  { id: "argos",    icon: "🐕", name: "Аргос узнал",            hint: "Дойти до пса Аргоса (песнь XVII)",    test: s => s.page >= 243 },
  { id: "scar",     icon: "🦵", name: "Шрам над коленом",       hint: "Дочитать песнь XIX",                  test: s => s.page >= 271 },
  { id: "bow",      icon: "🏹", name: "Лук натянут",            hint: "Дожить до состязания (песнь XXI)",    test: s => s.page >= 294 },
  { id: "hall",     icon: "🩸", name: "Пир окончен",            hint: "Пройти песнь XXII",                   test: s => s.page >= 308 },
  { id: "bed",      icon: "🫒", name: "Ложе из оливы",          hint: "Узнавание Пенелопы (песнь XXIII)",    test: s => s.page >= 318 },
  { id: "peace",    icon: "🕊️", name: "Мир на Итаке",           hint: "Дочитать все двадцать четыре песни",  test: s => s.page >= 333 },
  { id: "grintser", icon: "📜", name: "Конец героического века", hint: "Прочитать статью Гринцера",          test: s => s.page >= 348 },
  { id: "afterword",icon: "🖋️", name: "В сторону Одиссея",      hint: "Прочитать послесловие переводчика",   test: s => s.page >= 358 },
  { id: "comm",     icon: "🔍", name: "До комментариев дошёл",  hint: "Добраться до комментариев",           test: s => s.pct >= 100, secret: true },
  { id: "p20",      icon: "📗", name: "Хороший вечер",          hint: "20 страниц за раз",                   test: s => s.maxJump >= 20 },
  { id: "p50",      icon: "🌊", name: "Попутный ветер",         hint: "50 страниц за раз",                   test: s => s.maxJump >= 50 },
  { id: "streak3",  icon: "🔥", name: "Три вечера подряд",      hint: "Серия из 3 дней",                     test: s => s.streak >= 3 },
  { id: "streak7",  icon: "🗓️", name: "Неделя в пути",          hint: "Серия из 7 дней",                     test: s => s.streak >= 7 },
  { id: "streak14", icon: "💎", name: "Две недели подряд",      hint: "Серия из 14 дней",                    test: s => s.streak >= 14 },
  { id: "days20",   icon: "📚", name: "Двадцать вечеров",       hint: "20 вечеров с книгой",                 test: s => s.days >= 20 },
  { id: "penelope", icon: "🕸️", name: "Ткань Пенелопы",         hint: "Вернуться назад по страницам",        test: s => s.reread, secret: true },
  { id: "note",     icon: "✍️", name: "На полях",               hint: "Оставить заметку",                    test: s => s.notes >= 1, secret: true },
  { id: "calypso",  icon: "🌙", name: "Семь лет у Калипсо",     hint: "Вернуться после долгого перерыва",    test: s => s.comeback, secret: true },
  { id: "dawn",     icon: "🌅", name: "Розовоперстая заря",     hint: "Почитать в выходной",                 test: s => s.weekend, secret: true }
];

const WORDS_ODYSSEY = {
  sail: "Паруса подняты. Впереди двадцать четыре песни и десять лет чужих скитаний",
  muse: "«Муза, поведай мне о хитроумном» — первая песнь позади, эпос запущен",
  telem: "Четыре песни без главного героя: сначала мы смотрим на мир глазами сына, который отца не помнит",
  raft: "Одиссей сам строит плот — единственный герой эпоса, который работает руками",
  nausicaa: "Девушка играет в мяч на берегу, и от этого мяча зависит возвращение царя. Так эпос и устроен",
  bard: "Одиссей плачет, слушая песню о самом себе. Первый в литературе человек, встретивший собственный миф",
  nobody: "«Никто» — самая знаменитая хитрость в европейской литературе. И самая дорогая: она стоила ему десяти лет",
  circe: "Год у Кирки — эпос не торопится. Возвращение измеряется не милями, а тем, что успеваешь потерять",
  nekyia: "Он говорит с матерью, с Ахиллом, с Агамемноном. Ахилл скажет: лучше батраком у живых, чем царём у мёртвых",
  sirens: "Сирены поют не о будущем, а о знании. Он единственный, кто захотел услышать и остаться живым",
  home: "Он возвращается спящим и не узнаёт родной берег. Дом — это то, что надо узнать заново",
  eumaios: "Царь ночует у свинопаса и ест его хлеб. Половина поэмы — про гостеприимство, а не про подвиги",
  reunion: "Двадцать лет — и сын узнаёт отца по одному слову. Эта сцена держит всю вторую половину",
  argos: "Пёс, ждавший двадцать лет, узнал хозяина и умер. Три строки, которых хватило на три тысячи лет",
  scar: "Няня узнаёт его по шраму, а Гомер прямо посреди сцены уходит в историю этого шрама. Так работает эпическая память",
  bow: "Лук, который никто не может натянуть, — не сила, а право. Дом узнаёт хозяина по рукам",
  hall: "Расправа в зале — самая жестокая сцена поэмы. Стариковский не смягчает её, в отличие от Жуковского",
  bed: "Ложе, вырубленное из живой оливы, нельзя сдвинуть. Тайна одной вещи оказывается доказательством любви",
  peace: "Афина останавливает войну на Итаке — и поэма заканчивается не победой, а миром. Ты прошёл её целиком",
  grintser: "Статья Гринцера объясняет, почему «Одиссея» — это конец героического века и начало чего-то другого",
  afterword: "Послесловие переводчика — редкая возможность услышать, как человек объясняет свои решения",
  comm: "Дошёл до комментариев. Значит, книга не отпустила",
  p20: "Двадцать страниц за вечер — ровный ход, попутный ветер",
  p50: "Пятьдесят страниц за присест. Так проходят по морю за день",
  streak3: "Три вечера подряд. Плавание стало режимом",
  streak7: "Неделя в пути без пропусков",
  streak14: "Две недели подряд. Одиссей за такое время едва добрался от Калипсо до феаков",
  days20: "Двадцать вечеров с книгой. Уже не чтение, а путешествие",
  penelope: "Пенелопа ткала днём и распускала ночью. Ты вернулся на страницы назад — тот же приём, только с пользой",
  note: "Мысль на полях дороже десяти прочитанных страниц",
  calypso: "Семь лет у Калипсо — и всё равно домой. Перерыв не отменяет пути",
  dawn: "«Встала из мрака младая с перстами пурпурными Эос» — и ты читаешь в выходной"
};

const ACH_TESSON = [
  { id: "keys",     icon: "🔑", name: "Ключи от избы",          hint: "Отметить первое чтение",              test: s => s.days >= 1 },
  { id: "books",    icon: "📚", name: "Ящик книг",              hint: "Прочитать «Шаг в сторону»",           test: s => s.page >= 9 },
  { id: "frost",    icon: "❄️", name: "Февраль. Лес",            hint: "Пережить первый месяц",               test: s => s.page >= 45 },
  { id: "skates",   icon: "⏳", name: "Март. Время",             hint: "Дочитать второй месяц",               test: s => s.page >= 81 },
  { id: "lake",     icon: "🧊", name: "Апрель. Озеро",          hint: "Дочитать третий месяц",               test: s => s.page >= 117 },
  { id: "beasts",   icon: "🐻", name: "Май. Звери",             hint: "Дочитать четвёртый месяц",            test: s => s.page >= 153 },
  { id: "tears",    icon: "💧", name: "Июнь. Слёзы",            hint: "Дочитать пятый месяц",                test: s => s.page >= 189 },
  { id: "peace",    icon: "🕊️", name: "Июль. Умиротворение",    hint: "Дожить дневник до последнего месяца", test: s => s.page >= 225 },
  { id: "leave",    icon: "🚤", name: "Пора уезжать",           hint: "Дочитать книгу до конца",             test: s => s.pct >= 100 },
  { id: "q1",       icon: "🌲", name: "Кедры приняли",          hint: "25% книги",                           test: s => s.pct >= 25 },
  { id: "half",     icon: "🏔️", name: "Полгода пополам",        hint: "50% книги",                           test: s => s.pct >= 50 },
  { id: "q3",       icon: "🌤️", name: "Весна взяла своё",       hint: "75% книги",                           test: s => s.pct >= 75 },
  { id: "p20",      icon: "🔥", name: "Печь протоплена",        hint: "20 страниц за раз",                   test: s => s.maxJump >= 20 },
  { id: "p50",      icon: "🛷", name: "Дальний переход",        hint: "50 страниц за раз",                   test: s => s.maxJump >= 50 },
  { id: "streak3",  icon: "🪵", name: "Три вечера у печи",      hint: "Серия из 3 дней",                     test: s => s.streak >= 3 },
  { id: "streak7",  icon: "🗓️", name: "Неделя в тайге",         hint: "Серия из 7 дней",                     test: s => s.streak >= 7 },
  { id: "streak14", icon: "💎", name: "Две недели подряд",      hint: "Серия из 14 дней",                    test: s => s.streak >= 14 },
  { id: "days20",   icon: "📖", name: "Двадцать вечеров",       hint: "20 вечеров с книгой",                 test: s => s.days >= 20 },
  { id: "note",     icon: "✍️", name: "Свой дневник",           hint: "Оставить заметку",                    test: s => s.notes >= 1, secret: true },
  { id: "back",     icon: "🔁", name: "Перечитать абзац",       hint: "Вернуться назад по страницам",        test: s => s.reread, secret: true },
  { id: "bear",     icon: "🐻", name: "Медведь у окна",         hint: "Вернуться после долгого перерыва",    test: s => s.comeback, secret: true },
  { id: "vodka",    icon: "🥃", name: "Гости с инспекции",      hint: "Почитать в выходной",                 test: s => s.weekend, secret: true },
  { id: "hermit",   icon: "🧘", name: "Отшельник со стажем",    hint: "Дочитать книгу за 20+ вечеров",       test: s => s.pct >= 100 && s.days >= 20, secret: true }
];

const WORDS_TESSON = {
  keys: "Дверь избы открыта. Впереди полгода тишины — правда, чужой",
  books: "«Шаг в сторону» — так называется вступление. Всё начинается с решения выйти из общей колеи",
  frost: "Февраль называется «Лес» — месяц обживания: дрова, печь, кедры и минус тридцать",
  skates: "Март называется «Время» — когда быт налажен, остаётся главный собеседник: пустой день",
  lake: "Апрель называется «Озеро» — лёд ещё держит, но Байкал уже начинает шевелиться",
  beasts: "Май называется «Звери» — приходят медведи, появляются собаки, одиночество перестаёт быть чистым",
  tears: "Июнь называется «Слёзы» — самый личный месяц дневника, и повод там не сибирский",
  peace: "Июль называется «Умиротворение» — к финалу человек и место наконец совпали",
  leave: "Шесть месяцев прожиты — и уезжать оказывается труднее, чем приезжать",
  q1: "Четверть дневника. Кедры уже привыкли, что ты рядом",
  half: "Половина. Ровно середина его полугода — и твоего чтения",
  q3: "Три четверти. Байкал оттаял, скоро придёт лето и комары",
  p20: "Двадцать страниц за вечер — как хорошо протопленная печь",
  p50: "Пятьдесят страниц за присест — дальний переход по льду",
  streak3: "Три вечера подряд. Ритуал сложился",
  streak7: "Неделя без пропусков. Тессон бы одобрил дисциплину",
  streak14: "Две недели подряд. У него на такой срок уходило пол-ящика сигар",
  days20: "Двадцать вечеров с книгой. Это уже отношения, а не чтение",
  note: "Он вёл дневник каждый день — и ты записал свою мысль. Правильно",
  back: "Вернулся на страницу назад: у Тессона половина книги — афоризмы, их и надо перечитывать",
  bear: "Медведи приходят к избе, когда их не ждут. Ты вернулся после перерыва — тоже событие",
  vodka: "К нему приезжали инспекторы заповедника и рыбаки — и всё кончалось водкой. У тебя выходной прошёл культурнее",
  hermit: "Полгода отшельничества прочитаны вечер за вечером. Терпение того же сорта"
};

const ACH_SCREWTAPE = [
  { id: "open",     icon: "✉️", name: "Конверт вскрыт",        hint: "Отметить первое чтение",              test: s => s.days >= 1 },
  { id: "pre",      icon: "🖋️", name: "Слово от автора",        hint: "Прочитать предисловие",               test: s => s.page >= 21 },
  { id: "first",    icon: "👔", name: "Здравствуй, дядюшка",    hint: "Дочитать первое письмо",              test: s => s.page >= 26 },
  { id: "five",     icon: "🗂️", name: "Пять писем",             hint: "Дойти до шестого письма",             test: s => s.page >= 46 },
  { id: "ten",      icon: "📚", name: "Десять писем",           hint: "Дойти до одиннадцатого",              test: s => s.page >= 72 },
  { id: "q1",       icon: "🌗", name: "Четверть переписки",     hint: "25% книги",                           test: s => s.pct >= 25 },
  { id: "half",     icon: "⚖️", name: "Ровно половина",         hint: "50% книги",                           test: s => s.pct >= 50 },
  { id: "twenty",   icon: "🗃️", name: "Двадцать писем",         hint: "Дойти до двадцать первого",           test: s => s.page >= 126 },
  { id: "q3",       icon: "🌒", name: "Три четверти",           hint: "75% книги",                           test: s => s.pct >= 75 },
  { id: "last",     icon: "📮", name: "Последнее письмо",       hint: "Дочитать тридцать первое",            test: s => s.page >= 191 },
  { id: "toast",    icon: "🥂", name: "Тост произнесён",        hint: "Прочитать «Баламут предлагает тост»", test: s => s.page >= 213 },
  { id: "notes",    icon: "🔎", name: "Даже примечания",        hint: "Добраться до примечаний",             test: s => s.page >= 213 },
  { id: "done",     icon: "🕊️", name: "Книга закрыта",          hint: "Дочитать до конца",                   test: s => s.pct >= 100 },
  { id: "p20",      icon: "☕", name: "Целый вечер",            hint: "20 страниц за раз",                   test: s => s.maxJump >= 20 },
  { id: "p40",      icon: "🔥", name: "Не оторваться",          hint: "40 страниц за раз",                   test: s => s.maxJump >= 40 },
  { id: "letter1",  icon: "📩", name: "Письмо за вечер",        hint: "Прочитать хотя бы 5 страниц за раз",  test: s => s.maxJump >= 5 },
  { id: "streak3",  icon: "🕯️", name: "Три вечера подряд",      hint: "Серия из 3 дней",                     test: s => s.streak >= 3 },
  { id: "streak7",  icon: "🗓️", name: "Неделя с книгой",        hint: "Серия из 7 дней",                     test: s => s.streak >= 7 },
  { id: "streak14", icon: "💎", name: "Две недели подряд",      hint: "Серия из 14 дней",                    test: s => s.streak >= 14 },
  { id: "days20",   icon: "🌘", name: "Двадцать вечеров",       hint: "20 вечеров с книгой",                 test: s => s.days >= 20 },
  { id: "note",     icon: "✍️", name: "На полях",               hint: "Оставить заметку",                    test: s => s.notes >= 1, secret: true },
  { id: "reread",   icon: "🔁", name: "Перечитать письмо",      hint: "Вернуться назад по страницам",        test: s => s.reread, secret: true },
  { id: "night",    icon: "🌙", name: "Поздний читатель",       hint: "Почитать в выходной",                 test: s => s.weekend, secret: true },
  { id: "return",   icon: "🚪", name: "Вернулась к переписке",  hint: "Вернуться после перерыва",            test: s => s.comeback, secret: true },
  { id: "slow",     icon: "🐌", name: "Не спеша",               hint: "Дочитать книгу за 20+ вечеров",       test: s => s.pct >= 100 && s.days >= 20, secret: true }
];


const WORDS_SCREWTAPE = {
  open: "Первое письмо распечатано. Дальше — тридцать одно, и все от лица того, кому верить нельзя",
  pre: "Предисловие прочитано: Льюис заранее объясняет, как читать книгу, где рассказчик врёт",
  first: "Знакомство состоялось. Дядя даёт племяннику первый совет — и уже здесь видно, как устроена вся книга",
  five: "Пять писем позади. Переписка набрала ход",
  ten: "Десять писем. Уже слышно интонацию: вкрадчивую, деловую и совершенно бесстыдную",
  q1: "Четверть книги. Оптика перевёрнута, глаз привык",
  half: "Ровно половина переписки. Отсюда читается быстрее",
  twenty: "Двадцать писем. Немногие доходят до этой отметки за две недели",
  q3: "Три четверти. Финал уже виден",
  last: "Тридцать первое письмо прочитано — переписка окончена",
  toast: "Тост произнесён. Это уже другой жанр: не письма, а речь на выпускном банкете",
  notes: "Дошла до примечаний — там объясняются намёки, которые легко пропустить",
  done: "Книга закрыта. От корки до корки, вместе с тостом и примечаниями",
  p20: "Двадцать страниц за вечер — примерно четыре письма",
  p40: "Сорок страниц за присест. Похоже, было не оторваться",
  letter1: "Письмо за вечер — идеальный темп для этой книги",
  streak3: "Три вечера подряд. Уже ритуал",
  streak7: "Неделя без пропусков",
  streak14: "Две недели подряд — редкое упорство",
  days20: "Двадцать вечеров с книгой",
  note: "Мысль на полях дороже десяти прочитанных страниц",
  reread: "Вернулась на страницу назад — с этой книгой так и надо, половина смысла во второй читке",
  night: "Выходной, а книга открыта",
  return: "Вернулась после перерыва — переписка терпеливо ждала",
  slow: "Двадцать вечеров и вся книга. Медленное чтение ей идёт"
};


const ACH_UNIZH = [
  { id: "open",     icon: "🕯️", name: "Первый вечер",           hint: "Отметить первое чтение",              test: s => s.days >= 1 },
  { id: "part1",    icon: "🏚️", name: "Часть первая позади",    hint: "Дочитать первую часть",               test: s => s.page >= 96 },
  { id: "part2",    icon: "🌧️", name: "Часть вторая позади",    hint: "Дочитать вторую часть",               test: s => s.page >= 186 },
  { id: "part3",    icon: "🕰️", name: "Часть третья позади",    hint: "Дочитать третью часть",               test: s => s.page >= 281 },
  { id: "part4",    icon: "🔔", name: "Часть четвёртая позади", hint: "Дочитать четвёртую часть",            test: s => s.page >= 355 },
  { id: "epilog",   icon: "📖", name: "Эпилог открыт",          hint: "Дойти до эпилога",                    test: s => s.page >= 355 },
  { id: "done",     icon: "🤍", name: "Роман дочитан",          hint: "Дочитать до конца",                   test: s => s.pct >= 100 },
  { id: "q1",       icon: "🌗", name: "Четверть пути",          hint: "25% книги",                           test: s => s.pct >= 25 },
  { id: "half",     icon: "⚖️", name: "Половина",               hint: "50% книги",                           test: s => s.pct >= 50 },
  { id: "q3",       icon: "🌒", name: "Три четверти",           hint: "75% книги",                           test: s => s.pct >= 75 },
  { id: "p20",      icon: "☕", name: "Целый вечер",            hint: "20 страниц за раз",                   test: s => s.maxJump >= 20 },
  { id: "p50",      icon: "🌙", name: "Засиделась за полночь",  hint: "50 страниц за раз",                   test: s => s.maxJump >= 50 },
  { id: "p90",      icon: "🔥", name: "Целая часть за присест", hint: "90 страниц за раз",                   test: s => s.maxJump >= 90 },
  { id: "streak3",  icon: "🪟", name: "Три вечера подряд",      hint: "Серия из 3 дней",                     test: s => s.streak >= 3 },
  { id: "streak7",  icon: "🗓️", name: "Неделя с романом",       hint: "Серия из 7 дней",                     test: s => s.streak >= 7 },
  { id: "streak14", icon: "💎", name: "Две недели подряд",      hint: "Серия из 14 дней",                    test: s => s.streak >= 14 },
  { id: "days20",   icon: "🌘", name: "Двадцать вечеров",       hint: "20 вечеров с книгой",                 test: s => s.days >= 20 },
  { id: "note",     icon: "✍️", name: "На полях",               hint: "Оставить заметку",                    test: s => s.notes >= 1, secret: true },
  { id: "reread",   icon: "🔁", name: "Вернуться к странице",   hint: "Вернуться назад по страницам",        test: s => s.reread, secret: true },
  { id: "weekend",  icon: "🫖", name: "Воскресное чтение",      hint: "Почитать в выходной",                 test: s => s.weekend, secret: true },
  { id: "back",     icon: "🚪", name: "Вернулась к роману",     hint: "Вернуться после перерыва",            test: s => s.comeback, secret: true },
  { id: "slow",     icon: "🐌", name: "Медленное чтение",       hint: "Дочитать роман за 20+ вечеров",       test: s => s.pct >= 100 && s.days >= 20, secret: true },
  { id: "peter",    icon: "🌫️", name: "Петербургская сырость",  hint: "Прочитать сто страниц всего",         test: s => s.page >= 105 },
  { id: "third",    icon: "🕮", name: "Дальше середины",        hint: "Перевалить за двухсотую страницу",    test: s => s.page >= 200 },
  { id: "night",    icon: "🌃", name: "Белые ночи позади",      hint: "Перевалить за трёхсотую страницу",    test: s => s.page >= 300 }
];

const WORDS_UNIZH = {
  open: "Первый вечер с романом. Достоевский писал его в спешке, к сроку каждого журнального номера — читать можно спокойнее, чем он писал",
  part1: "Первая часть позади. Она задаёт всё: голос рассказчика, Петербург и людей, которых потом не забудешь",
  part2: "Вторая часть прочитана — здесь роман уже набрал ход",
  part3: "Третья часть позади. Достоевский до конца не знал, чем кончит, — номера выходили быстрее, чем он писал",
  part4: "Четвёртая часть прочитана. Осталось самое короткое и самое тихое",
  epilog: "Эпилог открыт — у Достоевского это всегда отдельный разговор с читателем",
  done: "Роман дочитан. Первая большая книга, которую он написал после каторги",
  q1: "Четверть пути. Петербург уже стал отдельным героем",
  half: "Ровно половина романа",
  q3: "Три четверти. Дальше — быстрее",
  p20: "Двадцать страниц за вечер — ровный ход",
  p50: "Пятьдесят страниц за присест. Похоже, было не оторваться",
  p90: "Почти целая часть за один заход",
  streak3: "Три вечера подряд — уже привычка",
  streak7: "Неделя без пропусков",
  streak14: "Две недели подряд с толстым романом — уважение",
  days20: "Двадцать вечеров с книгой",
  note: "Мысль на полях дороже десяти прочитанных страниц",
  reread: "Вернулась на страницу назад — у Достоевского это нормально, у него важное часто сказано вскользь",
  weekend: "Выходной, чай и роман — та самая обстановка, для которой он писался",
  back: "Вернулась после перерыва. Роман терпеливо ждал",
  slow: "Двадцать вечеров и весь роман. Так его и надо читать",
  peter: "Сто страниц. Петербургская сырость уже проникла в текст",
  third: "За двухсотой страницей роман идёт сам",
  night: "Триста страниц позади"
};

const BOOK_ACH = { "snow-1": ACH_BOOK, odyssey: ACH_ODYSSEY, tesson: ACH_TESSON, screwtape: ACH_SCREWTAPE, unizhennye: ACH_UNIZH };
const BOOK_WORDS = { "snow-1": WORDS_BOOK, odyssey: WORDS_ODYSSEY, tesson: WORDS_TESSON, screwtape: WORDS_SCREWTAPE, unizhennye: WORDS_UNIZH };
const achList = () => isBook() ? (BOOK_ACH[book().id] || ACH_BOOK) : isPastel() ? ACH_PASTEL : ACH_PIANO;
const achWords = () => isBook() ? (BOOK_WORDS[book().id] || WORDS_BOOK) : isPastel() ? WORDS_PASTEL : WORDS_PIANO;
const flavor = () => (!isBook() && !isPastel() && PIECE_FLAVOR[piece().id]) || {};
const lastName = (author) => String(author || "").trim().split(/\s+/).pop();

function achState() {
  if (!hasMaterials()) return [];
  const s = curStats();
  const fl = flavor();
  return achList().map(a => {
    const item = { ...a, done: !!a.test(s) };
    if (fl[a.id]) { item.name = fl[a.id][0]; item.word = fl[a.id][1]; }
    // финальная награда носит имя автора текущей композиции
    if (isPiano() && a.id === "bach") item.name = `${lastName(piece().author)} доволен`;
    return item;
  });
}

// текст награды с учётом контекста материала
const wordOf = (a) => a.word || achWords()[a.id] || a.hint;

/* ── Действия ── */
function normSpan(hand, from, to) {
  const bars = piece().bars;
  let f = Math.max(1, Math.min(bars, from)), t = Math.max(1, Math.min(bars, to));
  if (t < f) [f, t] = [t, f];
  return { hand, from: f, to: t };
}
function currentSpans() {
  if (pending.length) return pending.slice();
  return pickHand === "both"
    ? [normSpan("right", pickFrom, pickTo), normSpan("left", pickFrom, pickTo)]
    : [normSpan(pickHand, pickFrom, pickTo)];
}

/* ══════════ Карточки знаний ══════════
   Смысловые заметки о материале. Открываются по мере занятий:
   на 1, 3, 6, 10 и 15-й день с этой пьесой, книгой или курсом. */

const FACTS = {
  bwv853: [
    { t: "Это песня плача, а не упражнение",
      x: "Правая рука ведёт долгую мелодию, левая ровно шагает под ней аккордами — так в те времена писали арии, то есть вокальные номера. Получается, что инструмент здесь поёт: слушатели XVIII века узнавали в этом плач по умершему. Когда играешь, полезно представлять не пальцы, а голос, которому не хватает дыхания.",
      more: ["Послушай запись Святослава Рихтера и Гленна Гульда подряд — у одного это молитва, у другого разговор",
             "Сравни с арией «Erbarme dich» из «Страстей по Матфею» — та же интонация мольбы"] },
    { t: "Тональность выбрана не случайно",
      x: "Во времена Баха у каждой тональности была репутация, как у цвета: одни считались светлыми и праздничными, другие — скорбными. Эта — из самых мрачных, её брали, когда речь шла о смерти и утешении. Бах служил в церкви и писал на этом языке всерьёз, а не для красоты.",
      more: ["Погугли «барочная теория аффектов» — там про то, как музыка кодировала эмоции",
             "У Баха в «Страстях» те же приёмы: услышишь знакомые повороты"] },
    { t: "Жанр называется «надгробие»",
      x: "Французские клавесинисты писали пьесы-tombeau — «надгробия» в память об умерших учителях и друзьях. Исследователи прямо говорят, что эта прелюдия похожа на такой траурный марш: медленная поступь, тяжёлые созвучия, ощущение процессии. То есть у твоей пьесы есть адресат, даже если имя его не названо.",
      more: ["Послушай «Tombeau de M. de Blancrocher» Луи Куперена — тот же жанр за полвека до Баха",
             "Сравни с траурным маршем из Второй сонаты Шопена — исследователи ставят их рядом"] },
    { t: "Сорок тактов на три доли",
      x: "Прелюдия занимает ровно сорок тактов и написана на три доли — размер медленного танца-шествия. Три доли в барочной музыке почти всегда означают не бег, а поступь: сарабанду, шествие, обряд. Поэтому она не разваливается, даже если играть очень медленно.",
      more: ["Поищи, что такое сарабанда — торжественный испанский танец, ставший в барокко символом скорби",
             "Попробуй продирижировать себе рукой на «раз» — темп сам найдётся"] },
    { t: "Между речитативом и ноктюрном",
      x: "Музыковеды описывают эту прелюдию как нечто среднее между речитативом-ариозо и ноктюрном. Речитатив — это пение, приближенное к речи: не мелодия, а произнесённая фраза. Отсюда её странная свобода: она то поёт, то будто говорит, и играть её ровным метрономом — значит убить главное.",
      more: ["Послушай любой речитатив из «Страстей по Иоанну» — интонация узнаётся мгновенно",
             "Ноктюрны Джона Филда и Шопена появятся через сто лет — а ощущение то же"] },
    { t: "Зачем после плача идёт фуга",
      x: "Каждая прелюдия в сборнике идёт в паре с фугой — пьесой, где одна короткая мелодия по очереди вступает в нескольких голосах и они сплетаются. Если прелюдия — это личное горе, то фуга рядом с ней — строгий порядок, в который это горе укладывается. Пара читается как путь: от «мне больно» к «мир всё равно устроен разумно».",
      more: ["Послушай фугу этой же пары сразу после прелюдии — эффект контраста слышен мгновенно",
             "Про такие пары хорошо рассказывает Андраш Шифф в своих лекциях о ХТК"] },
    { t: "Фуга записана в другой тональности",
      x: "Прелюдия записана бемолями, а фуга к ней — диезами, хотя на клавишах это одни и те же ноты. Считается, что Бах взял готовую фугу и просто дописал в неё знаки, чтобы она подошла к паре. Хороший пример того, что даже у гения многое собрано из уже сделанного.",
      more: ["Поищи слово «энгармонизм» — про то, как одна и та же нота называется по-разному",
             "В современных изданиях фугу часто переписывают бемолями, чтобы не пугать пианистов"] },
    { t: "Тема фуги — это церковный распев",
      x: "Мелодия фуги строится как старинный псалмовый напев и перекликается с хоралом «Из глубины взываю к Тебе» — то есть с покаянным псалмом. Бах не иллюстрирует текст, он берёт саму интонацию мольбы. Поэтому пара воспринимается как обращение к небу, а не как пьеса про грусть.",
      more: ["Найди хорал «Aus tiefer Not schrei ich zu dir» — Лютер сам сделал его переложение псалма 130",
             "Сравни первые ноты фуги и напева — сходство слышно без нот"] },
    { t: "Самое сложное место — такт 77",
      x: "В фуге есть точка, где Бах складывает всё сразу: тема идёт в басу, одновременно в среднем голосе она же звучит вдвое медленнее, а сверху бежит своя линия. Такие места — не хвастовство техникой, а способ показать, что одна мысль может существовать в нескольких скоростях сразу.",
      more: ["Поищи слово «аугментация» — увеличение темы вдвое, любимый приём Баха",
             "Тот же приём — в «Искусстве фуги», последнем незаконченном сборнике"] },
    { t: "Ранняя версия жила в тетради сына",
      x: "Первый вариант этой прелюдии Бах записал в нотную тетрадь для своего старшего сына Вильгельма Фридемана — домашний сборник для занятий. Позже он вернулся к ней и переписал. Вещь, которую ты разбираешь, росла годами, а не появилась готовой.",
      more: ["Найди «Klavierbüchlein für W. F. Bach» — там ранние версии одиннадцати прелюдий из ХТК",
             "Сравни ранний и поздний варианты: слышно, что именно Бах дописал"] },
    { t: "Сборник задумывался как учебник",
      x: "На титульном листе Бах написал, что это «для пользы и употребления жаждущей учиться музыкальной молодёжи» и для развлечения тех, кто уже умеет. То есть перед тобой не памятник, а учебное пособие, которое разрешено разбирать медленно и по кускам.",
      more: ["Титульный лист 1722 года легко найти в сети — почерк Баха хорошо читается",
             "Второй том он собрал только через двадцать лет, в 1742-м"] },
    { t: "Двадцать четыре двери",
      x: "До Баха инструменты настраивали так, что часть тональностей звучала откровенно фальшиво, и композиторы их обходили. Появился новый способ настройки — и Бах написал 24 пары пьес, по одной на каждую возможную тональность, просто чтобы доказать: теперь играть можно везде. Твоя прелюдия — восьмая дверь из этих двадцати четырёх.",
      more: ["Послушай пары №1 до мажор и №8 подряд — разница характера слышна даже без теории",
             "Поищи ролики про «равномерную темперацию» — там на пальцах объясняют, почему раньше было нельзя"] },
    { t: "«Хорошо темперированный» — не значит «ровный»",
      x: "Темперация — это компромисс при настройке: чистых интервалов на всех тональностях одновременно не бывает, приходится чем-то жертвовать. Многие исследователи считают, что Бах имел в виду не абсолютно ровный строй, а такой, где каждая тональность сохраняет свой характер. Тогда мрачность твоей пьесы — не метафора, а физика настройки.",
      more: ["Поищи «неравномерная темперация Кирнбергера» — один из вариантов строя времён Баха",
             "Есть записи ХТК на исторической настройке: тональности звучат заметно по-разному"] },
    { t: "Написано в свободные годы",
      x: "Сборник собран в Кётене, где Бах служил придворным капельмейстером у князя. Церковных обязанностей там почти не было, и он много писал для инструментов — сюиты, концерты, клавирные тетради. Так что ХТК появился в редкий спокойный период его жизни.",
      more: ["На те же годы приходятся Бранденбургские концерты и сюиты для виолончели",
             "Через год после ХТК Бах уедет в Лейпциг и начнёт писать кантату почти каждую неделю"] },
    { t: "Напечатали через полвека после смерти",
      x: "При жизни Баха сборник не издавали: его переписывали от руки ученики и коллеги, и так он расходился по Европе. Первое печатное издание вышло только в 1801 году. Копирование нот от руки было тогда главным способом учиться — медленно, зато навсегда.",
      more: ["Сохранились копии, сделанные учениками Баха, — по ним восстанавливают текст",
             "Попробуй сам переписать пару тактов от руки: запоминаются иначе"] },
    { t: "Клавир — это не рояль",
      x: "Слово «клавир» означало любой клавишный инструмент: клавесин, клавикорд, орган. Ни на одном из них звук не тянется так, как на рояле, — поэтому длинные ноты приходилось «дорисовывать» слухом. На современном инструменте всё наоборот: важно не залить педалью то, что должно оставаться прозрачным.",
      more: ["Послушай эту прелюдию на клавикорде — инструмент тихий, почти интимный",
             "Гульд специально играл Баха без педали, чтобы вернуть барочную сухость"] },
    { t: "Её растаскивали на другие инструменты",
      x: "Эту пару перекладывали для оркестра (Стоковский), для виолончелей (Кодай, Вилла-Лобос) и для многого другого. Музыка держится не на тембре, а на устройстве — поэтому её можно пересадить куда угодно и она не рассыплется. Хороший критерий: если пьеса выживает в чужом костюме, значит, в ней есть скелет.",
      more: ["Послушай оркестровки Стоковского — Бах в них звучит почти как киномузыка",
             "Сравни с версией для виолончелей: та же прелюдия, другой воздух"] },
    { t: "Двух одинаковых трактовок не бывает",
      x: "Рихтер играет её отрешённо и медленно, Гульд — сухо и аналитично, кто-то — почти романтически. Барочные ноты не содержат указаний темпа и громкости: их дописывает исполнитель. Так что твоя версия — тоже трактовка, а не приближение к единственно верной.",
      more: ["Составь плейлист из трёх записей одной прелюдии и послушай подряд",
             "Лекции Андраша Шиффа о ХТК — он объясняет, почему выбирает тот или иной темп"] },
    { t: "Учились именно так — по кускам",
      x: "В XVIII веке музыке учили через копирование и разбор фрагментов: сначала переписать, потом разобрать по фразам, потом соединить. Первый биограф Баха рассказывал, что тот в юности ночами переписывал чужие ноты при лунном свете. Метод «по нескольку тактов за раз» — не твоя слабость, а старая школа.",
      more: ["Биография Форкеля 1802 года — оттуда пошли многие истории о Бахе",
             "Попробуй выучить одну фразу наизусть и сыграть её без нот — так работали тогда"] },
    { t: "Порядок как способ утешения",
      x: "Пара «прелюдия — фуга» устроена так: сначала свободное высказывание, потом строгая конструкция. Музыковеды пишут, что в этой паре трагедия переходит в катарсис — то есть не исчезает, а становится выносимой через форму. Это, пожалуй, главный ответ на вопрос, зачем вообще повторять чужую музыку.",
      more: ["Поищи «катарсис» у Аристотеля — понятие пришло из античной трагедии",
             "Та же логика в «Гольдберг-вариациях»: тема возвращается изменившимся человеком"] }
  ],
  more: [
    { t: "Музыка знает финал, а герои нет",
      x: "Фильм «До свидания, мальчики!» — про последнее мирное лето трёх выпускников у моря, 1936 год. Они дурачатся и строят планы, а зритель знает, что через несколько лет будет война и вернутся не все. Эта пьеса звучит как воспоминание: светлая мелодия, спетая тем, кто уже знает, чем всё кончилось.",
      more: ["Посмотри сам фильм Михаила Калика 1964 года — он короткий и очень тихий",
             "Повесть Бориса Балтера, по которой снят фильм, называется так же"] },
    { t: "Музыка говорит за героев",
      x: "Таривердиев не любил, когда музыка повторяет то, что и так видно на экране. Его принцип: она должна произносить то, о чём персонажи молчат. Поэтому в кадре просто идут по берегу, а в музыке — нежность и предчувствие потери, которых никто вслух не скажет.",
      more: ["Послушай его музыку к «Иронии судьбы» и «Семнадцати мгновениям» — тот же приём в других обстоятельствах",
             "Книга Таривердиева «Я просто живу» — он там сам объясняет, как работал с режиссёрами"] },
    { t: "Море — это обещание",
      x: "Море в фильме не пейзаж, а образ юности: горизонт, свобода, всё впереди. Название пьесы соединяет мальчиков и море — и в этом вся мысль: бесконечность, обещанная в семнадцать лет, и очень короткая жизнь, которая за ней последовала.",
      more: ["Посмотри финал фильма — там закадровый текст о судьбах героев",
             "Рядом стоит «Человек идёт за солнцем» того же режиссёра с музыкой Таривердиева"] },
    { t: "Пустоты больше, чем нот",
      x: "В пьесе намеренно мало звуков: между фразами воздух, ничего лишнего. Таривердиев считал, что недосказанность действует сильнее наполненности — слушатель сам дописывает то, что не сыграно. Поэтому играть её нужно не быстрее, чем дышится.",
      more: ["Послушай, как её играет Алексей Гориболь — он держит паузы дольше, чем кажется возможным",
             "Сравни с ноктюрнами Шопена: там тоже смысл живёт в остановках"] },
    { t: "Она пережила свой фильм",
      x: "Музыка из кино обычно живёт, пока идёт картина. Эта пьеса ушла в концертный репертуар и играется отдельно — значит, смысл в ней держится без кадра: не нужно знать сюжет, чтобы услышать прощание.",
      more: ["Альбом «До свидания, мальчики! Тихая музыка» — его киномузыка без фильмов",
             "Поищи концерты Гориболя с программами из Таривердиева"] },
    { t: "Фильм запретили на двадцать лет",
      x: "Картину сначала жёстко критиковали, а после того как в 1971 году режиссёр Михаил Калик уехал в Израиль, показ вовсе запретили: авторскую копию изъяли при обыске, и в полном виде фильм дошёл до зрителей только в конце 1980-х. Музыка при этом продолжала звучать сама по себе — её играли и переиздавали. Иногда мелодия оказывается живучее, чем то, для чего она написана.",
      more: ["Калик частично восстановил фильм в 1990 году — авторскую копию так и не нашли",
             "Почитай про «полочное кино» — фильмы, которые годами лежали без проката"] },
    { t: "Ученик Хачатуряна",
      x: "Таривердиев учился композиции у Арама Хачатуряна в Гнесинском институте в середине 1950-х. От учителя, писавшего громко и мощно, он ушёл ровно в противоположную сторону — к тихой, почти шёпотной музыке. Иногда школа нужна затем, чтобы понять, чего ты делать не будешь.",
      more: ["Послушай «Танец с саблями» Хачатуряна сразу после этой пьесы — контраст поразительный",
             "Хачатурян, по воспоминаниям, поддерживал студентов, которые шли своей дорогой"] },
    { t: "Он придумал себе «третье направление»",
      x: "В 1960-е Таривердиев объявил, что работает в «третьем направлении» — не академическая музыка и не эстрада, а что-то между. Ему было тесно и в консерваторском мире, и в песенном. Отсюда его манера: серьёзная музыка, которую можно слушать без подготовки.",
      more: ["Поищи его вокальные циклы на стихи Цветаевой и Ахмадулиной — там это направление слышно",
             "Когда идею подхватили другие, он ушёл к барочным формам и органу"] },
    { t: "Сто тридцать два фильма",
      x: "Он написал музыку к 132 фильмам — это была основная профессия, а не подработка. При таком объёме легко скатиться в самоповтор, но у него почти каждая картина звучит иначе. Ремесло и повторение не мешают узнаваемому голосу, а как раз его вырабатывают.",
      more: ["Составь плейлист из пяти его фильмов подряд — интересно ловить общие приёмы",
             "«Мой младший брат» (1962) — одна из ранних работ, ещё до «Мальчиков»"] },
    { t: "Простая гармония — это выбор",
      x: "В пьесе почти нет сложных аккордов: бас идёт ровно, мелодия строится из коротких фраз. Такое устройство называют остинато — повторяющаяся фигура, на которую нанизывается всё остальное. Простота тут не бедность, а рамка, внутри которой слышна каждая мелочь.",
      more: ["Поищи слово «остинато» — приём известен со Средневековья",
             "Тот же принцип в «Болеро» Равеля, только у Равеля он разрастается"] },
    { t: "Он вернулся к барокко",
      x: "Поздний Таривердиев писал концерты для органа и вещи в барочных формах. Отсюда прозрачность его фактуры: голоса не сливаются в кашу, каждый слышен отдельно. Когда играешь его пьесы, полезно вести руки как два разных человека, а не как один аккорд.",
      more: ["Послушай его органную музыку — совсем другой Таривердиев, чем в кино",
             "Сравни с органными хоралами Баха: родство приёмов заметно"] },
    { t: "Звук как контрапункт изображению",
      x: "Контрапункт — это когда два голоса идут одновременно и не повторяют друг друга. Таривердиев переносил этот принцип в кино: на экране одно, в музыке другое, а смысл рождается между ними. Поэтому в его фильмах весёлая сцена может звучать печально — и это не ошибка.",
      more: ["Пересмотри сцену на пляже с выключенным звуком, потом со звуком — разница мысли очевидна",
             "О том же писал Эйзенштейн в статьях о звуковом кино"] },
    { t: "Он писал как поэт",
      x: "Больше сотни его вокальных циклов и романсов написаны на стихи — Цветаева, Ахмадулина, Вознесенский. Работа со словом приучила его строить мелодию как фразу: с дыханием, ударением, точкой. Поэтому его инструментальные пьесы тоже произносятся, а не просто играются.",
      more: ["Послушай цикл на стихи Цветаевой — слышно, как музыка следует за интонацией строки",
             "Попробуй проговорить мелодию словами: где вдох, там и цезура"] },
    { t: "Тихая музыка — это позиция",
      x: "Целый его альбом называется «Тихая музыка», и это не про громкость записи. В эпоху, когда советская эстрада звала маршировать и радоваться, он предлагал сесть и помолчать. Играть его громко и напористо — значит спорить с самим замыслом.",
      more: ["Найди пластинку «До свидания, мальчики! Тихая музыка. Ретро»",
             "Попробуй сыграть пьесу вдвое тише обычного — она не разваливается, а становится ближе"] },
    { t: "1936 год выбран не случайно",
      x: "Действие повести и фильма — лето 1936-го, за пять лет до войны и в разгар большого террора. Герои не знают ни о том, ни о другом. Музыка звучит в этом зазоре: она не предупреждает, а прощается заранее.",
      more: ["Повесть Балтера во многом автобиографична — он сам из этого поколения",
             "Посмотри, как в фильме показан город: Евпатория играет саму себя"] },
    { t: "Мелодия как чужая память",
      x: "Пьеса устроена так, будто её вспоминают, а не исполняют: тема возвращается почти без изменений, с той же интонацией. Память вообще работает повторами — мы прокручиваем одно и то же место. Отсюда ощущение, что музыка звучит откуда-то издалека.",
      more: ["Обрати внимание, как мало в пьесе развития — почти нет драматургии",
             "У Пярта в «Für Alina» похожая логика памяти"] },
    { t: "Он не любил слово «саундтрек»",
      x: "Таривердиев настаивал, что пишет не фон, а полноценную партию фильма — наравне с актёрами и оператором. Поэтому его музыку так легко слушать отдельно: она изначально сделана как самостоятельное высказывание. Хороший тест: если убрать картинку и ничего не рушится — это музыка, а не подложка.",
      more: ["Книга «Я просто живу» — там много о конфликтах с режиссёрами",
             "Послушай его музыку к «Ольге Сергеевне» — почти концертный цикл"] },
    { t: "Почему её так удобно учить",
      x: "Фактура прозрачна: правая почти всегда одна линия, левая — опора. Такое устройство прощает медленный темп и позволяет разбирать руками по отдельности без потери смысла. Пьесы, где всё держится на скорости, так учить нельзя — а эту можно.",
      more: ["Попробуй сыграть только левую руку целиком — она сама по себе осмысленна",
             "Потом сыграй только мелодию и напой её: она поётся"] },
    { t: "Её играют в память о людях",
      x: "Эта музыка часто звучит на вечерах памяти и в фильмах о войне — не потому, что она грустная, а потому что в ней есть светлая интонация прощания без надрыва. Такое сочетание редко: обычно скорбь либо давит, либо превращается в сентиментальность.",
      more: ["Послушай, как она звучит в концертных программах о поколении 1941 года",
             "Сравни с «Сентиментальным вальсом» Чайковского: другой век, похожая тонкость"] },
    { t: "Зачем играть чужое прощание",
      x: "Таривердиев говорил, что музыка нужна, чтобы человек почувствовал то, чего в его собственной жизни ещё не было. Разбирая эту пьесу, ты примеряешь чужую память — и она становится частью твоего опыта. В этом смысл повторения чужого: оно расширяет, а не копирует.",
      more: ["Прочитай главу «Я просто живу» о работе над фильмами Калика",
             "Попробуй после разбора послушать фильм целиком — пьеса зазвучит иначе"] }
  ],
  "snow-1": [
    { t: "Почему книга так называется", page: 12,
      x: "Снег, выпавший на ещё зелёную траву, живёт считанные часы — и в этом соединении несоединимого весь Норштейн. Он всю книгу говорит об одном: искусство начинается там, где поймано мгновение, которое вот-вот исчезнет.",
      more: ["Обрати внимание, как он разбирает японские хайку — там та же мысль про мгновение",
             "Посмотри «Сказку сказок» после книги — увидишь её в кадрах"] },
    { t: "Это книга про то, как смотреть", page: 22,
      x: "Она учит не рисованию, а взгляду: как смотреть на дерево, лицо, свет, чтобы действительно увидеть. Норштейн уверен, что без насмотренности в живописи и поэзии мультипликатор остаётся ремесленником — и это касается любого дела.",
      more: ["Он часто ссылается на Рембрандта и Ван Гога — открой их альбомы параллельно",
             "Лекции Норштейна есть на видео, интонация там та же, что в книге"] },
    { t: "Книга выросла из живых занятий", page: 34,
      x: "В основе — лекции, прочитанные студентам в Токио осенью 1994 года и на Высших курсах сценаристов и режиссёров ещё в конце 1980-х; частями они печатались в журнале «Искусство кино». Отсюда её разговорная интонация: это записанная речь, а не трактат. Читать её лучше кусками, как слушают лекцию.",
      more: ["Номера «Искусства кино» с этими главами есть в открытом архиве журнала",
             "Поищи видеозаписи его мастер-классов — там те же истории"] },
    { t: "Кадр строится, как картина", page: 46,
      x: "Он разбирает композицию кадра теми же понятиями, что искусствовед — картину: свет, пятно, диагональ, пустота. Для него мультипликация не серия рисунков, а последовательность живописных решений. Отсюда совет: смотреть в музее не сюжет, а устройство.",
      more: ["Открой альбом Рембрандта и найди, куда падает свет на лицах",
             "У него много о Ван Гоге — смотри параллельно с чтением"] },
    { t: "Пауза важнее движения", page: 58,
      x: "Норштейн постоянно возвращается к ритму: пустой кадр и остановка значат столько же, сколько действие. Как в музыке — смысл возникает в тишине между фразами, а не в непрерывном шевелении. Это, пожалуй, главный совет книги для любого занятия.",
      more: ["Посмотри «Цаплю и журавля» — фильм во многом построен на паузах",
             "У Тарковского в «Запечатлённом времени» та же мысль про ритм"] },
    { t: "Техника называется перекладка", page: 70,
      x: "Его персонажи — не рисунки на плёнке и не куклы, а плоские фигурки с подвижными частями, которые двигают под камерой по кадру. Отсюда особая пластика: движение чуть неровное, живое, с сопротивлением материала. Ограничение техники становится характером фильма.",
      more: ["Поищи «перекладка» (cut-out animation) — приём старше рисованной анимации",
             "Опыты Лотты Райнигер с силуэтами — предок этой техники"] },
    { t: "Он говорит о литературе не меньше, чем о рисунке", page: 82,
      x: "В книге постоянно возникают Гоголь, Пушкин, японские поэты, Библия. Норштейн не отделяет ремесло от чтения: чтобы придумать кадр, нужно знать, как устроена строка. Поэтому книга полезна и тем, кто не собирается рисовать вовсе.",
      more: ["Выпиши имена, которые он упоминает, — получится хороший список для чтения",
             "Басё в переводах Веры Марковой — с этого удобно начать"] },
    { t: "Свет ставят лампами, а не рисуют", page: 94,
      x: "В перекладке свет нельзя дорисовать — его ставят физически и пропускают через несколько ярусов стекла, на которых лежат слои изображения. Отсюда тёплое свечение, которое не повторить фильтром. Ограничение снова оказывается автором стиля.",
      more: ["Присмотрись к свету в сценах с туманом — он объёмный, а не наложенный",
             "Про световые решения он подробно говорит в главах о съёмке"] },
    { t: "Медленно — это метод, а не беда", page: 106,
      x: "Его фильмы делались годами: десять минут экранного времени могли занять несколько лет. Норштейн отказывается ускоряться, потому что считает, что образ должен вызреть. В книге он объясняет это спокойно, без позы мученика — просто такова цена точности.",
      more: ["Сравни: «Ёжик» — 10 минут, «Сказка сказок» — около 29",
             "Посчитай, сколько кадров в минуте перекладки — цифра отрезвляет"] },
    { t: "Он не считает свои фильмы детскими", page: 118,
      x: "«Ёжик» и «Сказка сказок» выходили как мультипликация, но говорят о страхе, памяти и смерти. Норштейн настаивает, что деление на взрослое и детское искусственно: ребёнок понимает больше, чем принято думать. Отсюда его тон — без сюсюканья и объяснений.",
      more: ["Покажи «Ёжика» ребёнку и послушай, что он скажет про туман",
             "У Козлова в сказках та же интонация разговора на равных"] },

    { t: "«Цапля и журавль»: сказка из словаря Даля", page: 130,
      x: "Фильм 1974 года снят по русской сказке в пересказе Владимира Даля — того самого, что составил словарь. Сценарий Норштейн писал вместе с Романом Качановым, режиссёром «Чебурашки». Из школьной побасенки получилась история о том, как гордость мешает двум одиноким существам сойтись.",
      more: ["Прочитай сказку у Даля — она занимает полстраницы",
             "Сравни, что Норштейн добавил: там нет ни парка, ни дождя, ни музыки"] },
    { t: "Голос Смоктуновского", page: 138,
      x: "Текст в фильме читает Иннокентий Смоктуновский — и это выбор не «звезды», а интонации: усталой, ироничной, сочувствующей. Норштейн вообще считает голос частью изображения, а не пояснением к нему. Попробуй представить тот же фильм с бодрым дикторским голосом — рассыплется всё.",
      more: ["Пересмотри фильм и обрати внимание, где он делает паузы",
             "Музыку написал Михаил Меерович — постоянный композитор Норштейна"] },
    { t: "Фильм держится на невозможности сойтись", page: 146,
      x: "Цапля идёт к журавлю, журавль отказывает; журавль идёт к цапле — отказывает она. И так по кругу, без конца. Норштейн снял не басню про упрямых птиц, а точную модель человеческих отношений, где гордость всегда приходит на секунду раньше нежности.",
      more: ["Посчитай, сколько раз повторяется проход по дорожке — повтор здесь и есть смысл",
             "Похожая механика у Беккета в «В ожидании Годо»"] },
    { t: "Разрушенный парк как декорация", page: 153,
      x: "Действие идёт в заброшенной усадьбе с облетевшими статуями и лужами — среде, которой в сказке не было. Пространство здесь работает как время: всё уже прошло, а герои всё ещё ходят друг к другу. Хороший пример того, как фон в кадре несёт смысл наравне с персонажем.",
      more: ["Обрати внимание на дождь: он идёт почти весь фильм",
             "Ярбусова делала эти фоны фактурными, почти живописными"] },

    { t: "Туман — это состояние, а не погода", page: 164,
      x: "«Ёжик в тумане» вовсе не про ёжика. Это про то, как страшно и притягательно идти туда, где привычные ориентиры исчезли: туман стирает знакомый мир, и герой видит его заново. Поэтому фильм оказался понятнее взрослым, чем детям.",
      more: ["Пересмотри мультфильм после этой главы — многое читается иначе",
             "Сказки Сергея Козлова, по которым он снят, стоит прочитать целиком"] },
    { t: "Туман сделан из пыли и стекла", page: 176,
      x: "Норштейн с оператором Александром Жуковским собрали свой съёмочный станок с несколькими ярусами стекла: персонажа снимали через слои, которые то приближали, то отдаляли от камеры. Туман получался из пыли на прозрачной плёнке — приём, восходящий к старому восточному театру теней. Волшебство здесь — точный технический расчёт.",
      more: ["Поищи фотографии станка Норштейна — конструкция похожа на самодельную машину",
             "Про многослойную съёмку хорошо рассказывают документальные фильмы о студии"] },
    { t: "Ёжика рисовала Франческа Ярбусова", page: 188,
      x: "Художник-постановщик всех его фильмов — Франческа Ярбусова, жена Норштейна. Прежде чем нашёлся тот самый ёжик, она нарисовала десятки вариантов, и Норштейн отвергал их один за другим. Долгий перебор — часть метода, а не признак неумения.",
      more: ["Найди эскизы Ярбусовой к «Ёжику» — видно, каким он мог быть",
             "Её работы к «Шинели» — отдельное сильное впечатление"] },
    { t: "Белая лошадь в тумане", page: 200,
      x: "Лошадь появляется и исчезает, ничего не делая, — и остаётся главным образом фильма. Норштейн объясняет, что она нужна как чистое присутствие: то, что нельзя объяснить и нельзя присвоить. Именно из-за неё «Ёжик» перестаёт быть детской историей про поход в гости.",
      more: ["Заметь, что ёжик пытается понять, дышит ли лошадь в тумане",
             "Сравни с тем, как появляются животные у Тарковского"] },
    { t: "Государственная премия — на троих", page: 212,
      x: "В 1979 году Норштейн, оператор Жуковский и художница Ярбусова получили Государственную премию СССР. Важная деталь: премию дали втроём — фильм такого типа не бывает делом одного человека. Даже самая авторская вещь стоит на чужих руках.",
      more: ["Посмотри титры его фильмов — состав группы почти не менялся годами",
             "О работе с Жуковским он много рассказывает в книге"] },
    { t: "Лучший мультфильм всех времён", page: 224,
      x: "В 2003 году на фестивале «Лапута» в Токио 140 критиков и аниматоров из разных стран назвали «Ёжика в тумане» лучшим мультфильмом всех времён. За двадцать лет до этого такое же место в международном опросе занимала «Сказка сказок». Два фильма одного человека — и оба про то, как трудно удержать ускользающее.",
      more: ["Список «Лапута-2003» легко найти — интересно посмотреть, кто рядом",
             "Опрос 1984 года проводили в Лос-Анджелесе Академия и ASIFA-Hollywood"] },
    { t: "Сказки Козлова написаны для взрослых", page: 236,
      x: "Сергей Козлов писал коротко и тихо: ёжик и медвежонок у него говорят о смерти, одиночестве и том, как хорошо, что кто-то есть рядом. Норштейн ничего не «утяжелял» — он просто не стал упрощать. Стоит прочитать сборник целиком, чтобы увидеть, откуда взялась интонация фильма.",
      more: ["Начни с рассказа «Ёжик в тумане» — он совсем короткий",
             "У Козлова есть и «Как Ёжик с Медвежонком протирали звёзды»"] },

    { t: "Название пришло от Хикмета", page: 248,
      x: "Петрушевская, писавшая сценарий вместе с Норштейном, хотела назвать фильм «Придёт серенький волчок» — но худсовет расслышал в строчке колыбельной зловещее предсказание. Тогда Норштейн взял название из стихотворения турецкого поэта Назыма Хикмета — «Сказка сказок». История про то, как цензура иногда случайно улучшает вещь.",
      more: ["Найди стихотворение Хикмета — оно про воду, кота и солнце",
             "Колыбельную про серенького волчка тоже перечитай целиком, она страшная"] },
    { t: "Волчок и вечное яблоко", page: 262,
      x: "Волчок здесь не страшилка, а душа, которая подглядывает за чужим счастьем и уносит то единственное, что нельзя удержать. Яблоко в росе, костёр, стол под деревом — образы, которые повторяются и не объясняются. Норштейн вообще считает, что объяснённый образ перестаёт работать.",
      more: ["Посмотри фильм и запиши три кадра, которые остались с тобой",
             "Сравни с тем, как повторяются образы в стихах — механика та же"] },
    { t: "Память как материал", page: 276,
      x: "Главный источник его образов — собственное детство: коммунальный двор, послевоенная Москва, соседи, ушедшие на фронт. Он превращает частное воспоминание в общее, ничего не поясняя. Поэтому зритель, не живший в том дворе, всё равно узнаёт своё.",
      more: ["Он рассказывает об этом дворе и в книге, и в интервью",
             "Обрати внимание, как в фильме сделан переход от довоенного к военному"] },
    { t: "Танго, Бах и Моцарт в одном фильме", page: 290,
      x: "В «Сказке сказок» звучит довоенное танго «Утомлённое солнце», а рядом — Бах и Моцарт. Музыка здесь не иллюстрирует, а работает памятью: одна мелодия мгновенно возвращает эпоху. Норштейн подбирал её так же долго, как изображение.",
      more: ["Послушай «Утомлённое солнце» отдельно — это польское танго 1935 года",
             "Постоянный композитор его фильмов — Михаил Меерович"] },
    { t: "Опрос 1984 года", page: 304,
      x: "В Лос-Анджелесе Академия киноискусства вместе с ASIFA-Hollywood провела международный опрос, и «Сказка сказок» была названа лучшим анимационным фильмом всех времён. Фильм, сделанный почти вручную и без внятного сюжета, обошёл всю мировую индустрию. Это хороший аргумент в пользу медленной работы.",
      more: ["Поищи полный список того опроса — там вся история анимации",
             "В 2003-м первое место занял уже «Ёжик»"] },
    { t: "Как писался сценарий", page: 318,
      x: "Норштейн приносил Петрушевской томики Лорки, Неруды, Хикмета и альбомы с графикой Пикассо — не для цитат, а для настройки. Сценарий, по их словам, «произрастал из них самих», а не строился по схеме. Отсюда его свободная композиция, где эпизоды связаны не сюжетом, а рифмами.",
      more: ["Петрушевская описывала эту работу в своих воспоминаниях",
             "Попробуй посмотреть фильм как стихотворение, а не как историю"] },
    { t: "Он до сих пор не закончил «Шинель»", page: 332,
      x: "Фильм по Гоголю Норштейн начал в 1981 году и снимает до сих пор; сценарий писал вместе с Петрушевской. У незавершённой работы уже есть награды — по показанным фрагментам. Это крайняя форма его же принципа: важнее сделать точно, чем закончить в срок.",
      more: ["Фрагменты «Шинели» иногда показывают на его вечерах",
             "Повесть Гоголя перед этим стоит перечитать"] },
    { t: "Зачем он всё это объясняет", page: 346,
      x: "Норштейн говорит, что ремесло передаётся только из рук в руки, а книга — попытка растянуть этот разговор во времени. Он не даёт рецептов, он показывает ход мысли. Чтение такой книги ближе к ученичеству, чем к получению информации.",
      more: ["Читай по главе за раз и записывай, с чем не согласен — так она работает лучше",
             "Его мастер-классы построены ровно так же, как книга"] },
    { t: "Последняя страница тома", page: 358,
      x: "Том заканчивается не выводом, а обрывом разговора — как и положено записи лекций. Норштейн вообще не верит в итог: он считает, что вещь живёт, пока её продолжают делать. Хороший повод не закрывать книгу совсем, а вернуться к отмеченным местам.",
      more: ["Пролистай назад свои закладки — на второй раз читается иначе",
             "Второй том во многом посвящён «Шинели»"] }
  ],
  odyssey: [
    { t: "Почему этот перевод звучит иначе", page: 19,
      x: "Двести лет «Одиссею» переводили гекзаметром — длинной шестидольной строкой, которая по-русски звучит торжественно и тяжело. Стариковский отказался от него и взял тактовик: строку с пятью ударениями и свободным расстоянием между ними. Получается покачивание, как палуба под ногами, — и Гомер перестаёт быть памятником.",
      more: ["Открой первые строки у Жуковского и здесь — разница слышна вслух с первой фразы",
             "Поищи, что такое тактовик: тонический стих, где считают ударения, а не слоги"] },
    { t: "Мир вещей вместо мира богов", page: 31,
      x: "Издательская аннотация обещает «предельную, почти кинематографическую очевидность мироздания» — и это точно про перевод. Там, где Жуковский писал «среброкованный», здесь появляются серебряные гвозди; вместо общего «меха» — козий мех. «Илиада» смотрит на богов, «Одиссея» — на предметы, и переводчик держится этой оптики.",
      more: ["Рецензия «Горького» так и называется — «Среброгвоздная вещь в себе»",
             "Отмечай по ходу чтения предметы: их в поэме больше, чем чудес"] },
    { t: "Первые четыре песни — без главного героя", page: 44,
      x: "Поэма начинается не с Одиссея, а с его сына: Телемах ищет отца, которого не помнит. Эти песни называют Телемахией. Гомер сначала показывает мир без героя — разорённый дом, наглых женихов, растерянного юношу, — чтобы возвращение читалось как восстановление порядка.",
      more: ["Обрати внимание, что Одиссей впервые появляется только в песни V",
             "Поищи слово «Телемахия» — им обозначают этот блок с XIX века"] },
    { t: "Совет богов вместо завязки", page: 44,
      x: "Поэма открывается сценой на Олимпе, где Зевс рассуждает: люди винят богов, а беды навлекают на себя сами. Это не украшение, а заявленная тема — ответственность. Всё, что случится дальше, будет проверкой этой мысли на конкретных судьбах.",
      more: ["Сравни с началом «Илиады»: там ссора людей, здесь разговор богов",
             "Гринцер в статье в конце книги объясняет, почему это важно"] },
    { t: "Собрание, которое ничего не решает", page: 66,
      x: "Телемах впервые созывает народное собрание — впервые за двадцать лет. И оно расходится ни с чем: женихи сильнее, закон не работает. Гомер показывает, что общество без хозяина не самоуправляется, а разваливается — отсюда весь сюжет о возвращении.",
      more: ["Обрати внимание на знамение с орлами — толкование выберут удобное",
             "Поищи, что известно о реальных народных собраниях гомеровской эпохи"] },
    { t: "Старик, который помнит всех", page: 66,
      x: "У Нестора в Пилосе Телемах слышит не сводку новостей, а длинный рассказ о том, кто как возвращался с войны. Эпос так и работает: знание передаётся памятью стариков, а не документами. Заодно это рамка для главного сюжета — вариантов возвращения много, и почти все кончаются плохо.",
      more: ["Считай по ходу: сколько героев вернулись домой благополучно",
             "История Агамемнона всплывёт ещё не раз — это зеркало для Одиссея"] },
    { t: "Елена подмешивает лекарство", page: 79,
      x: "В Спарте, вспоминая войну, все плачут — и Елена подсыпает в вино снадобье, от которого горе перестаёт чувствоваться. Деталь странная и очень честная: эпос знает, что память бывает невыносимой. Здесь же впервые звучит, что Одиссей жив и томится на острове.",
      more: ["Поищи слово «непент» — так называется это снадобье",
             "Четвёртая песнь — самая длинная в поэме"] },
    { t: "Герой, который сам строит плот", page: 88,
      x: "Одиссей появляется в поэме на седьмой год плена — сидящим на берегу и плачущим. Дальше идёт подробнейшее описание того, как он рубит деревья и вяжет плот: единственный античный герой, показанный за ручной работой. Возвращение начинается не с подвига, а с плотницкого труда.",
      more: ["Сравни это описание с изготовлением щита Ахилла в «Илиаде»",
             "Калипсо предлагала бессмертие — он выбрал смертную жену и остров"] },
    { t: "Мяч, от которого зависит всё", page: 98,
      x: "Царевна Навсикая с подругами стирает бельё и играет в мяч; мяч улетает, девушки вскрикивают — и голый, просоленный Одиссей просыпается. Величайшее возвращение в литературе начинается со случайности и с бытовой сцены. Гомер вообще любит поворачивать судьбу через мелочи.",
      more: ["Обрати внимание, как Одиссей говорит с Навсикаей — это образец вежливости",
             "Сцена стирки — одно из самых подробных бытовых описаний в эпосе"] },
    { t: "Гостю не задают вопросов", page: 114,
      x: "У феаков чужака сначала кормят, моют и укладывают спать — и только потом спрашивают имя. Это не любезность, а закон: гостеприимство под защитой Зевса. Половина поэмы устроена как проверка, кто этот закон соблюдает, а кто нет — киклоп, женихи, свинопас.",
      more: ["Поищи слово «ксения» — греческое понятие гостевого союза",
             "Сравни приём у феаков и приём у киклопа: разница смертельная"] },
    { t: "Он плачет, слушая песню о себе", page: 114,
      x: "На пиру слепой певец Демодок поёт про троянскую войну, и Одиссей закрывает лицо плащом. Это первый в европейской литературе человек, встретивший собственный миф со стороны. Гомер заодно показывает, как работает его собственное ремесло: песня сильнее того, о ком она.",
      more: ["Демодока часто считают автопортретом самого Гомера",
             "Обрати внимание: имя героя мы узнаём только в конце восьмой песни"] },
    { t: "«Меня зовут Никто»", page: 129,
      x: "Самая известная хитрость поэмы: ослепив киклопа, Одиссей называется Никем, и соседи не приходят на помощь. Но затем он не выдерживает и кричит своё настоящее имя — и получает проклятие Посейдона на десять лет. Вся поэма дальше — цена за одну секунду тщеславия.",
      more: ["По-гречески игра слов ещё богаче: «Утис» — никто, и рядом «метис» — хитрость",
             "Полифем — сын Посейдона, отсюда и месть"] },
    { t: "Год у Кирки и мешок с ветрами", page: 144,
      x: "В десятой песни всё рушится из-за людей: спутники развязывают мешок с ветрами у самой Итаки, а потом превращаются в свиней у волшебницы Кирки. Одиссей теряет не корабли, а время — год здесь, семь лет там. Возвращение измеряется не милями, а тем, что успеваешь потерять.",
      more: ["Заметь, что от свиней спутников спасает трава моли — подарок Гермеса",
             "Отрывок про Кирку Стариковский публиковал отдельно в журнале «Этажи»"] },
    { t: "Разговор с мёртвыми", page: 161,
      x: "В одиннадцатой песни он спускается к границе царства мёртвых и говорит с матерью, с товарищами, с Ахиллом. Тот произносит страшное: лучше быть батраком у живого, чем царём над мёртвыми, — то есть отменяет весь героический идеал «Илиады». Отсюда и название статьи в конце книги: конец героического века.",
      more: ["Поищи слово «Некия» — так называют эту песнь",
             "Мать умерла от тоски по нему — деталь, ради которой стоит перечитать сцену"] },
    { t: "Сирены поют не о будущем", page: 173,
      x: "Сирены обещают не наслаждение, а знание: они поют о том, что было под Троей и что творится на земле. Одиссей велит привязать себя к мачте и залепить уши гребцам — то есть единственный хочет услышать и остаться живым. Это про любопытство, за которое приходится платить неподвижностью.",
      more: ["Сравни с Кафкой: у него сирены молчат, и это страшнее",
             "Скилла и Харибда рядом — выбор из двух зол, ставший поговоркой"] },
    { t: "Он возвращается спящим", page: 185,
      x: "Феаки привозят Одиссея домой спящим и оставляют на берегу вместе с дарами. Проснувшись, он не узнаёт Итаку — двадцать лет отсутствия сделали дом чужим. Возвращение оказывается не финалом, а началом второй, гораздо более трудной половины поэмы.",
      more: ["Обрати внимание: вторая половина почти без чудес — сплошной быт и люди",
             "Феаков за помощь Посейдон накажет — доброе дело не остаётся безнаказанным"] },
    { t: "Царь ночует у свинопаса", page: 199,
      x: "Целые песни отданы Евмею — рабу, который кормит нищего странника и делится последним. Гомер тратит на него столько же внимания, сколько на богов. Именно здесь становится ясно, что поэма не про подвиги, а про то, кто как обходится с чужим человеком.",
      more: ["Евмей — один из немногих, к кому Гомер обращается на «ты»",
             "Сравни его гостеприимство с поведением женихов в доме"] },
    { t: "Сын возвращается вовремя", page: 214,
      x: "Пока отец сидит у свинопаса, Телемах уходит от засады женихов и приплывает домой. Две линии, разведённые с первой песни, сходятся — и это композиционный узел всей поэмы. Гомер выстраивает встречу так, чтобы она случилась в хижине, а не во дворце.",
      more: ["Поищи, что такое кольцевая композиция — здесь она видна невооружённым глазом",
             "Обрати внимание, как Афина всё время подстраивает случайности"] },
    { t: "Узнавание по одному слову", page: 227,
      x: "Одиссей открывается сыну — и тот сначала не верит, принимая его за бога. Двадцать лет разлуки, и никаких доказательств, кроме слов. Дальше вся поэма будет строиться на сценах узнавания: сына, няни, пса, жены, отца — каждый узнаёт по-своему.",
      more: ["Выпиши все сцены узнавания по ходу — их шесть, и все разные",
             "Аристотель разбирал такие сцены в «Поэтике» под словом «анагноризис»"] },
    { t: "Пёс, который ждал двадцать лет", page: 243,
      x: "У ворот на куче навоза лежит старый пёс Аргос, которого Одиссей вырастил щенком. Он узнаёт хозяина, шевелит хвостом — и умирает. Три строки, которых хватило на три тысячи лет: узнавание, которое нельзя подделать, потому что собака не рассуждает.",
      more: ["Заметь: Одиссей отворачивается и вытирает слезу — он не может себя выдать",
             "Эту сцену считают одной из первых в литературе, где животное — полноценный герой"] },
    { t: "Драка нищих для развлечения", page: 255,
      x: "Женихи стравливают Одиссея с местным попрошайкой Иром и делают ставки. Царь в своём доме дерётся за кусок — унижение, которое он выбирает сам. Терпение здесь показано не как слабость, а как самая трудная форма силы.",
      more: ["Ир — прозвище, настоящее имя Арней: Гомер даёт даже нищему биографию",
             "Обрати внимание, как Одиссей рассчитывает силу удара, чтобы не убить"] },
    { t: "Шрам, который помнит всё", page: 271,
      x: "Старая няня моет ноги страннику и узнаёт шрам от кабаньего клыка — и тут Гомер прямо посреди сцены уходит на несколько десятков строк в историю этого шрама. Приём кажется нелепым, но именно так работает эпическая память: вещь тянет за собой всё прошлое. Эрих Ауэрбах начал с этого места свою знаменитую книгу о литературе.",
      more: ["Найди первую главу «Мимесиса» Ауэрбаха — она называется «Рубец Одиссея»",
             "Пенелопа в этой же песни рассказывает сон про орла и гусей"] },
    { t: "Ночь, когда никто не спит", page: 282,
      x: "Двадцатая песнь — почти целиком бессонница: Одиссей ворочается, Пенелопа плачет, служанки шепчутся. Гомер тормозит действие ровно перед развязкой. Это древнейший приём саспенса: чем ближе развязка, тем медленнее время.",
      more: ["Обрати внимание на зловещий смех женихов — знак близкой гибели",
             "Сравни с тем, как замедляют время в современных триллерах"] },
    { t: "Лук — это право, а не сила", page: 294,
      x: "Женихи один за другим не могут даже натянуть тетиву, а нищий странник делает это спокойно, «как певец натягивает струну на кифаре». Сравнение выбрано неслучайно: власть возвращается к тому, кто умеет, а не к тому, кто сильнее. Дом узнаёт хозяина по рукам.",
      more: ["Заметь сравнение с музыкантом — оно стоит прямо перед бойней",
             "Стрела проходит сквозь двенадцать топоров: как именно — спорят до сих пор"] },
    { t: "Расправа без смягчений", page: 308,
      x: "Двадцать вторая песнь — самая жестокая: женихи гибнут в пиршественном зале, неверных служанок вешают, предателю отрубают уши и нос. Жуковский эти места сглаживал, Стариковский возвращает их как есть. Эпос не был добрым — он был точным.",
      more: ["Сравни это место с переводом Жуковского — разница показательна",
             "Рецензенты отмечают возвращённую жестокость как достоинство перевода"] },
    { t: "Тайна одной кровати", page: 318,
      x: "Пенелопа не верит мужу и приказывает вынести из спальни кровать — а её нельзя вынести: Одиссей сам вырубил ложе из растущей оливы и построил вокруг дом. Только они двое знают это. Доказательством любви оказывается общая тайна о вещи, а не подвиг.",
      more: ["Обрати внимание: Пенелопа хитрее мужа — она проверяет его его же методом",
             "Олива — дерево Афины, покровительницы Одиссея"] },
    { t: "Поэма кончается не победой, а миром", page: 333,
      x: "В последней песни родня убитых женихов идёт мстить, и начинается новая война — но Афина её останавливает. Финал не про триумф героя, а про то, что кровь нужно остановить. Многие исследователи считают эту песнь поздней вставкой — спор идёт до сих пор.",
      more: ["Прочитай про «финальную проблему Одиссеи» — вопрос об окончании поэмы",
             "Александрийские филологи считали, что поэма кончалась на узнавании супругов"] },
    { t: "Конец героического века", page: 348,
      x: "Статья Николая Гринцера в конце книги объясняет, чем «Одиссея» отличается от «Илиады»: там герой выбирает славу и раннюю смерть, здесь — возвращение и обычную жизнь. Эпос впервые говорит, что дом важнее подвига. Отсюда и вся европейская литература про возвращение.",
      more: ["Гринцер — один из ведущих российских антиковедов, стоит поискать его лекции",
             "Сравни ответ Ахилла в Аиде и выбор Одиссея у Калипсо — это один спор"] },
    { t: "Переводчик объясняет свои решения", page: 358,
      x: "В послесловии «В сторону Одиссея» Стариковский рассказывает, почему отказался от гекзаметра и как искал русский эквивалент формульного языка. Читать его стоит после текста, а не до: тогда видно, какие места дались тяжело. Перевод — всегда цепочка компромиссов, и честный переводчик их называет.",
      more: ["Стариковский — филолог, живёт в Нью-Джерси, преподаёт латынь",
             "У перевода есть и жёсткие критики: в «Годе литературы» вышел спор о тактовике"] },
    { t: "Гомера, возможно, не было", page: 464,
      x: "Поэмы складывались устно и веками пелись певцами-аэдами; в XX веке Милмэн Пэрри доказал это, изучая живых сказителей на Балканах. Отсюда постоянные формулы — «розовоперстая заря», «многоумный Одиссей»: они помогали импровизировать. То, что кажется поэтическим украшением, было технологией памяти.",
      more: ["Поищи «гомеровский вопрос» — спор длиной в двести лет",
             "Пэрри записывал боснийских певцов в 1930-х — сравнение оказалось решающим"] }
  ],
  tesson: [
    { t: "Он поставил себе условие: шесть месяцев", page: 20,
      x: "Тессон уехал в избу на берегу Байкала не «отдохнуть», а прожить там полгода — с февраля по июль 2010-го, без дорог, соседей и связи. Срок был выбран заранее и не подлежал пересмотру: эксперимент только тогда эксперимент, когда из него нельзя выйти в любой момент. Это, пожалуй, главное, что можно взять из книги в обычную жизнь.",
      more: ["Позже он назвал эти месяцы одними из самых счастливых в жизни",
             "Сравни с «Уолденом» Торо: тот прожил в лесу два года и тоже заранее назначил срок"] },
    { t: "Список книг важнее списка еды", page: 30,
      x: "Дневник начинается с перечня того, что он взял с собой, и книги там занимают больше места, чем провизия. Отшельничество без чтения быстро превращается в тупое выживание — читателя спасает не тишина, а разговор с теми, кого нет рядом. Список стоит выписать: это готовая программа на год.",
      more: ["Отметь, кого он берёт: там и Юнгер, и Ницше, и русская классика",
             "Попробуй составить свой список «на полгода в избе» — упражнение отрезвляющее"] },
    { t: "Свобода как количество времени", page: 45,
      x: "Одна из главных мыслей книги: свобода измеряется не возможностями, а тем, сколько времени принадлежит тебе. В городе выбор огромен, а времени нет; в избе выбора нет вовсе, зато день бесконечен. Тессон формулирует это парадоксами — за них книгу и любят.",
      more: ["Выписывай афоризмы отдельно: половина книги состоит из них",
             "Похожая мысль у Сенеки в «О скоротечности жизни»"] },
    { t: "Февраль: минус тридцать и метровый лёд", page: 45,
      x: "Байкал зимой промерзает так, что по нему ездят машины, а трещины идут с пушечным грохотом. Быт занимает почти весь день: дрова, вода из проруби, печь. Для дневника это оказалось спасением — физический труд не даёт мысли скиснуть.",
      more: ["Поищи видео байкальского льда: он прозрачный, видно на несколько метров вниз",
             "Толщина льда к концу зимы доходит до метра и больше"] },
    { t: "Изба стоит в заповеднике", page: 60,
      x: "Хижина находится на западном берегу Байкала, на территории Байкало-Ленского заповедника — то есть в месте, где людей нет по закону, а не по случайности. Ближайшие соседи — инспекторы за десятки километров. Одиночество здесь не поза, а география.",
      more: ["Посмотри на карте западный берег Байкала — дорог там действительно нет",
             "Заповедник основан в 1986 году, площадь около 660 тысяч гектаров"] },
    { t: "Он приехал не спасаться, а проверить", page: 70,
      x: "Тессон не бежал от катастрофы: у него была вполне благополучная жизнь и известность путешественника. Он поехал проверить старую мечту — «жить в тишине, среди кедров, книг и собственных мыслей». Разница между бегством и экспериментом определяет тон всей книги: в ней нет жалоб.",
      more: ["До Байкала он объехал мир на велосипеде и прошёл 6000 км по маршруту побега из ГУЛАГа",
             "Родился в 1972 году в Париже, учился на географа"] },
    { t: "Март: коньки по замёрзшему озеру", page: 81,
      x: "Один из самых красивых кусков книги — как он катается на коньках по льду Байкала, под которым видно дно. Тессон не описывает пейзаж «для красоты»: он всё время ищет точную формулу ощущения. Отсюда его короткие, отрывистые фразы — дневник, а не роман.",
      more: ["Поищи снимки «прозрачного льда» Байкала — это то, о чём он пишет",
             "Фильм 2016 года снимали в тех же местах"] },
    { t: "Две собаки испортили чистоту опыта", page: 95,
      x: "В какой-то момент у него появляются два щенка, и одиночество перестаёт быть абсолютным. Он честно фиксирует: с собаками стало легче, а значит эксперимент уже не тот. Эта честность — лучшее, что есть в дневнике: он не подгоняет жизнь под замысел.",
      more: ["Обрати внимание, как меняется интонация записей после их появления",
             "У Тессона вообще много про животных — позже он напишет «Снежную пантеру»"] },
    { t: "Гости приезжают с водкой", page: 117,
      x: "Полного затвора не вышло: к нему заглядывают инспекторы заповедника, рыбаки, случайные путники — и почти каждый визит кончается застольем. Тессон описывает это без снисходительности: он искренне восхищается людьми, которые живут здесь всегда. Книга во многом об этом столкновении — турист-отшельник и те, для кого это просто дом.",
      more: ["В интервью он говорил, что любит «парадоксальных русских»",
             "Сравни его записи о гостях с тем, как он пишет о самом себе"] },
    { t: "Дневник — это форма, а не жанр", page: 130,
      x: "Он пишет каждый день, и это дисциплина, а не вдохновение: в тайге не бывает «нет настроения». Именно поэтому книга состоит из коротких записей — не из глав. Регулярность даёт то, чего не даёт талант: непрерывность.",
      more: ["Попробуй неделю вести такой же дневник по три строки в день",
             "Он писал от руки — и это видно по ритму фраз"] },
    { t: "Май: ледоход как событие года", page: 153,
      x: "Когда Байкал вскрывается, лёд идёт с грохотом, а озеро за считанные дни меняет цвет и запах. Для человека, прожившего зиму в избе, это не погода, а смена эпохи. Дневник в этом месте резко ускоряется: природа задаёт темп тексту.",
      more: ["Поищи, когда именно вскрывается Байкал — обычно в мае, север позже юга",
             "Сравни майские записи с февральскими: другой человек пишет"] },
    { t: "Комары как расплата за лето", page: 170,
      x: "Июнь и июль в тайге — это не идиллия, а гнус, жара и полное отсутствие тишины. Тессон честно пишет, что зимой ему было лучше: холод дисциплинирует, лето расслабляет. Хорошее напоминание, что «жизнь на природе» состоит не только из закатов.",
      more: ["Обрати внимание, как меняется его распорядок дня летом",
             "Белые ночи на Байкале — светло почти круглые сутки"] },
    { t: "Одиночество не лечит характер", page: 189,
      x: "К концу дневника выясняется, что в избе человек остаётся ровно тем же, кем был в городе, только без свидетелей. Тессон не приходит к просветлению и не притворяется, что пришёл. Это делает книгу редкой: обычно такие тексты заканчиваются духовным преображением.",
      more: ["Сравни финал с началом: он сам отмечает, что изменилось мало",
             "Тот же вывод у многих полярников в мемуарах"] },
    { t: "Премия Медичи и споры вокруг неё", page: 205,
      x: "Книга получила французскую премию Медичи в области эссеистики в 2011 году и сделала Тессона по-настоящему известным. Часть критиков считала её позой городского француза, часть — лучшим текстом об одиночестве за десятилетия. Обе позиции легко проверить прямо по тексту.",
      more: ["Премия Медичи вручается с 1958 года, у неё отдельная номинация для эссе",
             "По книге в 2016-м сняли фильм — сравнить впечатления интересно"] },
    { t: "Он потом упал с крыши", page: 215,
      x: "В 2014 году Тессон сорвался с крыши, получил тяжёлые травмы головы и частичный паралич лица. После восстановления он пошёл пешком через всю Францию просёлочными тропами — и написал об этом ещё одну книгу. Его метод один и тот же: превращать испытание в маршрут.",
      more: ["Эта история легла в основу книги «Чёрными тропами»",
             "В 2023 году по ней тоже вышел фильм"] },
    { t: "Русская традиция ухода в лес", page: 225,
      x: "Тессон приехал в места, где отшельничество не литературный жест, а бытовая практика: староверы, промысловики, лесники живут так поколениями. Его книга интересна как взгляд снаружи на то, что здесь считается нормой. Полезно читать её рядом с «Таёжным тупиком» Пескова о семье Лыковых.",
      more: ["«Таёжный тупик» Василия Пескова — про Агафью Лыкову и её семью",
             "Сравни мотивацию: у него эксперимент, у них — жизнь"] },
    { t: "Байкал — это отдельная планета", page: 25,
      x: "В озере около пятой части всей незамёрзшей пресной воды планеты, глубина превышает километр, а живут в нём виды, которых больше нигде нет — нерпа, голомянка. Тессон живёт не «у воды», а рядом с чем-то геологически огромным, и это чувствуется в тоне записей. Масштаб места объясняет, почему книга не превращается в жалобы на быт.",
      more: ["Поищи про голомянку — прозрачную рыбу, которая живёт на глубине",
             "Байкалу около 25 миллионов лет: это древнейшее озеро Земли"] },
    { t: "Он всё время спорит с городом", page: 90,
      x: "Половина афоризмов книги построена на противопоставлении: там суета — здесь время, там связь — здесь тишина. Тессон сам понимает, что это поза городского человека, и иногда над собой смеётся. Читать интереснее, если держать в голове, что перед тобой не мудрец, а любопытный экспериментатор.",
      more: ["Отмечай места, где он себе противоречит, — их немало, и это плюс",
             "Сравни с «Уолденом»: Торо тоже жил в двух шагах от города"] },
    { t: "Дрова, вода, печь — это и есть сюжет", page: 140,
      x: "События дневника — растопить, наловить, дойти, вернуться. Сюжета в привычном смысле нет, и книга держится на ритме повторяющихся действий. Это и делает её похожей на практику: смысл возникает не из событий, а из регулярности.",
      more: ["Посчитай, сколько записей начинается с погоды — почти все",
             "Тот же приём в дневниках полярников и в японских поэтических дневниках"] },
    { t: "Сигары, водка и честность", page: 165,
      x: "Тессон не строит из себя аскета: в списке припасов сигары и алкоголь, и он пишет о них так же спокойно, как о кедрах. Отшельничество у него не про святость, а про перемену масштаба. Без этой честности книга давно бы устарела.",
      more: ["Обрати внимание, как он описывает утренний распорядок",
             "В интервью он говорил, что не считает себя философом"] },
    { t: "Тишина оказалась громкой", page: 200,
      x: "Одно из открытий дневника: в лесу нет тишины — есть лёд, ветер, птицы, треск деревьев на морозе. Отсутствие человеческого шума не пустота, а другой звуковой мир, который сначала надо научиться слышать. Через месяц он различает больше, чем в первый день.",
      more: ["Попробуй десять минут просто слушать за окном и записать, что услышал",
             "У Байкала есть свой звук ломающегося льда — его стоит найти в записях"] },
    { t: "Зачем читать чужой дневник", page: 235,
      x: "Дневник не учит и не выстраивает сюжет — он просто показывает, как человек проживает время. Чтение таких книг работает как настройка оптики: начинаешь замечать собственные дни. Тессон сам говорит, что записывал не события, а состояния — событий там почти нет.",
      more: ["Попробуй после книги неделю фиксировать не дела, а состояния",
             "Из той же породы — дневники Пришвина, только длиной в жизнь"] }
  ],
  screwtape: [
    { t: "Идея пришла в церкви", page: 21,
      x: "Летом 1940 года Льюис сидел на службе и, по собственному признанию, подумал: а что если написать письма беса-наставника молодому бесу? Замысел появился не как богословская задача, а как литературный трюк. Дальше книга писалась быстро — но, как он потом говорил, без всякого удовольствия.",
      more: ["Об этом он писал брату Уоррену в письме 20 июля 1940 года",
             "У Льюиса вообще многое начиналось с картинки в голове: «Нарния» — с образа фавна с зонтиком"] },
    { t: "Всё вывернуто наизнанку", page: 26,
      x: "Главный приём книги: советы даёт тот, кому нельзя верить, а «Враг» в его словах — это Бог. Значит, читать нужно с постоянной поправкой: чем горячее бес что-то советует, тем хуже это для человека. Льюис предупреждает об этом в предисловии — и это не формальность, а инструкция по чтению.",
      more: ["Приём называется «ненадёжный рассказчик» — стоит поискать это понятие",
             "У Свифта в «Скромном предложении» та же логика сарказма, только в один приём"] },
    { t: "Письмо 1-е · Обычная жизнь вместо доводов", page: 26,
      x: "Первый совет старшего беса — не спорить с человеком, а держать его в гуще привычных дел: «настоящая жизнь» звучит убедительнее любых рассуждений. Льюис начинает книгу с мысли, что вера чаще теряется не в спорах, а в суете.",
      more: ["Обрати внимание: с логикой бесы бороться не собираются — им хватает занятости", "Тот же мотив у Паскаля в рассуждении о «развлечении»"] },
    { t: "Сначала это была газетная колонка", page: 31,
      x: "Письма печатались по одному с мая по ноябрь 1941 года в еженедельной церковной газете The Guardian — не в той, которую знают сегодня, а в англиканской, закрывшейся в 1951-м. Читатели получали по письму в неделю, как сериал. Книга вышла отдельным изданием в 1942 году.",
      more: ["Льюису платили по два фунта за письмо — он просил перечислять гонорар вдовам и сиротам",
             "Несколько подписчиков возмутились и отменили подписку — приняли беса всерьёз"] },
    { t: "Письмо 2-е · Разочарование в прихожанах", page: 31,
      x: "Второе письмо — о том, как легко вера спотыкается о людей рядом: скрипучий сосед по скамье, фальшивое пение, неудачная проповедь. Приём вечный: нас чаще отталкивает не идея, а её носители.",
      more: ["Заметь, что бес радуется не спорам о догматах, а мелкому раздражению", "Похожая мысль у Честертона: церковь — не музей святых, а лечебница"] },
    { t: "Посвящено Толкину", page: 36,
      x: "На посвящении стоит имя Дж. Р. Р. Толкина — они были близкими друзьями и оба состояли в оксфордском кружке «Инклингов», где читали друг другу вслух черновики. Толкин, однако, книгу оценил сдержанно: ему не нравилось, что Льюис так вольно берётся за богословские темы. Дружба от этого не рассыпалась, но трещинка осталась.",
      more: ["Про «Инклингов» и их встречи в пабе «Орёл и дитя» есть отдельные книги",
             "Толкин говорил, что Льюис слишком спешит объяснять то, что лучше показывать"] },
    { t: "Письмо 3-е · Домашние мелочи", page: 36,
      x: "Здесь речь о раздражении, которое копится в быту рядом с самым близким человеком — у героя это мать. Льюис показывает, как молитва «за» человека уживается с глухотой к нему настоящему.",
      more: ["Про то, как мы молимся об образе человека, а не о нём самом, стоит перечитать дважды", "Тема родителей и взрослых детей у Льюиса вообще редкая для его времени"] },
    { t: "Писать это было мучительно", page: 41,
      x: "Льюис признавался, что ничего не писал так легко и с таким малым удовольствием. Чтобы говорить голосом беса, приходилось надолго вставать на его точку зрения — и это вызывало, по его словам, «духовную судорогу»: мир вокруг рассказчика состоит из пыли, песка, жажды и зуда, красоту оттуда надо было вычищать. Продолжения он избегал почти двадцать лет.",
      more: ["Эти слова он написал в предисловии к переизданию 1961 года",
             "После войны он часто отказывался от предложений «написать ещё писем»"] },
    { t: "Письмо 4-е · Как испортить молитву", page: 41,
      x: "Письмо о молитве: её можно сделать слишком возвышенной, слишком телесной или слишком зависимой от настроения — и в каждом случае она перестанет быть разговором. Совет беса читается как перевёрнутая инструкция.",
      more: ["Льюис вернётся к теме молитвы в «Письмах к Малкольму» — там уже без иронии", "Обрати внимание на слова про «ощущения» — они бьют и по светской медитации"] },
    { t: "Что значат имена", page: 46,
      x: "В оригинале дядю зовут Screwtape, а племянника — Wormwood: второе имя буквально значит «полынь» и отсылает к звезде Полынь из Откровения. Русские переводчики решили не калькировать, а придумать говорящие имена — так появились Баламут и Гнусик. Это редкий случай, когда перевод создаёт имена заново и попадает в интонацию.",
      more: ["Сравни с английским текстом — интонация оригинала суше и чиновничьей",
             "Полынь как символ горечи встречается и в других местах Библии"] },
    { t: "Письмо 5-е · Война не так уж выгодна", page: 46,
      x: "Неожиданный поворот: старший бес охлаждает пыл племянника, объясняя, почему большая беда сама по себе не приносит им победы. Письмо писалось в 1941 году, когда бомбили Лондон, — и звучит трезво, а не утешительно.",
      more: ["Здесь видно, зачем книге вообще нужен голос беса: так можно сказать резкое без пафоса", "Про Англию 1941-го стоит почитать отдельно — это фон всей книги"] },
    { t: "Наталья Трауберг", page: 51,
      x: "Русским Льюисом мы во многом обязаны Наталье Трауберг — переводчице, которая в советские годы переводила его и Честертона «в стол» и распространяла в самиздате. Её переводы намеренно живые, разговорные: она считала, что важнее передать интонацию, чем букву. Часть этой книги в русском издании — её работа.",
      more: ["Её книга «Сама жизнь» — сборник эссе о переводе и вере, читается легко",
             "Она же перевела «Хроники Нарнии» и почти всего Честертона"] },
    { t: "Письмо 6-е · Тревога о будущем", page: 51,
      x: "О страхе перед неизвестным: бесам важно, чтобы человек боялся вообще, а не решал конкретную задачу перед собой. Отсюда совет удерживать внимание на воображаемом, а не на действительном.",
      more: ["Мысль «делай, что можешь, здесь и сейчас» — сквозная для всей книги", "Сравни с современными текстами о тревожности: язык другой, механика та же"] },
    { t: "Два перевода под одной обложкой", page: 56,
      x: "В этом издании «Письма Баламута» даны в переводе Татьяны Шапошниковой, а «Баламут предлагает тост» — в переводе Натальи Трауберг. Разные руки слышны: у одной больше строгости, у другой — свободы и разговорности. Полезно замечать этот стык, когда дойдёшь до тоста.",
      more: ["Существуют и другие русские версии — интересно сравнить первые абзацы",
             "Классический вопрос перевода: точность или интонация — здесь виден оба ответа"] },
    { t: "Письмо 7-е · Партия важнее веры", page: 56,
      x: "Письмо о том, как убеждения превращаются в лагерь: сначала человек за правое дело, потом дело становится важнее всего остального. Льюис называет это «христианство и …» — вера с довеском, который постепенно вытесняет главное.",
      more: ["Формула «Christianity And» — одна из самых цитируемых в книге", "Написано в 1941-м, а читается как про сегодняшние споры"] },
    { t: "Книга войны", page: 61,
      x: "Письма писались в 1941 году, когда Англию бомбили, а Льюис по вечерам выступал на Би-би-си с беседами о вере — их слушали миллионы. Война в книге присутствует не как сюжет, а как воздух: страх, слухи, неопределённость. Отсюда её спокойная практичность — она писалась для людей, которым было тревожно.",
      more: ["Из тех радиобесед позже выросла книга «Просто христианство»",
             "Льюис вёл занятия у курсантов ВВС — ездил по базам почти каждую неделю"] },
    { t: "Письмо 8-е · Приливы и отливы", page: 61,
      x: "Одно из самых полезных писем: человек живёт волнами — подъёмы сменяются спадами, и это устройство, а не поломка. Бесу выгодно, чтобы спад воспринимали как конец, а не как отлив.",
      more: ["Отсюда популярная у читателей мысль: «не принимай решений в отлив»", "Сравни с описанием «духовной сухости» у мистиков — Льюис читал их внимательно"] },
    { t: "Оксфордский профессор", page: 67,
      x: "Льюис преподавал средневековую и ренессансную литературу — сначала в Оксфорде, потом в Кембридже. Его академические работы («Аллегория любви», «Отброшенный образ») до сих пор читают филологи. Понимание старой литературы и объясняет лёгкость, с которой он играет чужими голосами и жанрами.",
      more: ["«Отброшенный образ» — про картину мира средневекового человека, очень ясная книга",
             "Он читал лекции без бумажки и собирал полные аудитории"] },
    { t: "Письмо 9-е · Что делать со спадом", page: 67,
      x: "Продолжение предыдущего: в период усталости человека проще всего склонить к тому, что раньше ему было неинтересно. Здесь же — знаменитое наблюдение о том, что все удовольствия придуманы не бесами, они умеют лишь искажать чужое.",
      more: ["Мысль «они не создали ни одного удовольствия» — ключ ко всей книге", "Заметь, как логично из этого следует отношение Льюиса к радости"] },
    { t: "Обложка Time", page: 72,
      x: "К 1947 году Льюис стал так известен, что попал на обложку журнала Time — с подписью о том, что его «ересь» и есть христианство. Для университетского филолога это было почти скандально: коллеги считали популярные книги несерьёзным занятием. Академическую карьеру в Оксфорде это ему, вероятно, и подпортило.",
      more: ["Профессуру он получил только в 1954 году — и не в Оксфорде, а в Кембридже",
             "Тот номер Time легко найти в архиве журнала"] },
    { t: "Письмо 10-е · Компания, под которую подстраиваешься", page: 72,
      x: "О новых знакомых, рядом с которыми человек незаметно становится другим — не по убеждению, а чтобы не выпадать. Бесу нравится не сам круг, а раздвоение: одна речь дома, другая в гостях.",
      more: ["Про «две интонации одного человека» полезно перечитать после недели в офисе", "У Льюиса есть отдельная лекция «Внутренний круг» ровно об этом"] },
    { t: "Гонорары уходили другим", page: 77,
      x: "Успех книги принёс деньги, и Льюис завёл фонд, куда переводил большую часть литературных доходов, помогая вдовам, студентам и незнакомым просителям. Он считал неправильным зарабатывать на книгах о вере. Позже это обернулось проблемами с налоговой — раздавать деньги оказалось юридически сложнее, чем получать.",
      more: ["Фонд он называл Agape Fund — по греческому слову «любовь»",
             "Историю с налогами описывают его биографы, начиная с Уолтера Хупера"] },
    { t: "Письмо 11-е · Пять видов смеха", page: 77,
      x: "Письмо разбирает смех: радость, шутку, юмор и злую насмешку — и объясняет, какой из них бесам нужен. Разбор точный настолько, что его цитируют в книгах о комическом.",
      more: ["Сравни свои любимые шутки с этой классификацией — отрезвляет", "У Льюиса вообще много о смехе: он считал его признаком здоровья"] },
    { t: "Сатира с длинной родословной", page: 83,
      x: "Приём «дать слово злу и позволить ему проговориться» старше Льюиса: так работают Свифт, Мандевиль, отчасти Достоевский в «Легенде о Великом инквизиторе». Льюис добавил к этому канцелярский тон — его бесы говорят как менеджеры среднего звена. Именно эта смесь и делает книгу смешной.",
      more: ["«Скромное предложение» Свифта короткое, стоит прочесть после этой книги",
             "Обрати внимание на слова вроде «отдел», «руководство», «отчёт» — это не случайность"] },
    { t: "Письмо 12-е · Пологая дорога", page: 83,
      x: "Отсюда взята самая известная фраза книги: вниз ведёт дорога пологая, мягкая под ногами, без поворотов и указателей. Письмо о постепенности — как отдаление происходит без единого заметного шага.",
      more: ["Фразу про «безопаснейшую дорогу в ад» цитируют даже те, кто книгу не читал", "Обрати внимание, что резких падений бесы как раз опасаются"] },
    { t: "Почему её до сих пор читают", page: 89,
      x: "Книга держится не на богословии, а на точных наблюдениях о том, как человек себя обманывает: откладывает, обижается, подменяет дело разговором о деле. Эти механизмы не устарели, поэтому её читают и те, кому религиозная часть не близка. Она про внимание к себе — без морализаторства.",
      more: ["Попробуй читать по письму в день — так она работает лучше всего",
             "Многие ведут при чтении список замеченного за собой"] },
    { t: "Письмо 13-е · Настоящее удовольствие", page: 89,
      x: "О вкусе к подлинному: книге, которая правда нравится, прогулке, которая правда радует. Всё настоящее возвращает человека себе — и потому мешает искушению.",
      more: ["Отличный повод составить список своих «настоящих» удовольствий", "Та же мысль развёрнута в эссе «Вес славы»"] },
    { t: "Джон Клиз и голос дядюшки", page: 94,
      x: "Аудиоверсию «Писем» на английском записал Джон Клиз из «Монти Пайтона» — и его чтение считают образцовым: вежливый, деловитый тон делает текст ещё смешнее. Есть и радиопостановки Би-би-си, и театральные версии, которые идут до сих пор. Книга оказалась идеальной для голоса.",
      more: ["Фрагменты записи Клиза легко найти — интонация подсказывает, как читать глазами",
             "Бродвейская постановка шла с одним актёром и минимумом декораций"] },
    { t: "Письмо 14-е · Гордость своим смирением", page: 94,
      x: "Самая ловкая подмена в книге: как только человек замечает, что стал скромнее, он начинает этим гордиться. Льюис показывает выход — думать не о себе смиренном, а просто о деле.",
      more: ["Это письмо часто называют лучшим в книге", "Про гордость у Льюиса есть отдельная глава в «Просто христианстве»"] },
    { t: "Слово стало нарицательным", page: 99,
      x: "По-английски screwtapian сегодня говорят о вкрадчивом, псевдоразумном совете, который ведёт человека не туда. Немногие книги дарят языку прилагательное. Это хороший признак того, что автор описал не выдуманное, а узнаваемое.",
      more: ["Похожая судьба у «оруэлловского» и «кафкианского»",
             "Поищи, как термин используют в статьях о рекламе и политике"] },
    { t: "Письмо 15-е · Настоящее и будущее", page: 99,
      x: "О времени: бесам выгодно, чтобы человек жил в воображаемом завтра — в тревоге или в мечтах, но не здесь. Настоящее названо точкой, где время касается вечности.",
      more: ["Формула «настоящее — единственное время, похожее на вечность» стоит выписки", "Сравни с современными книгами о внимании и осознанности"] },
    { t: "Двадцать лет спустя — тост", page: 104,
      x: "Продолжение Льюис написал только в конце 1950-х: короткое эссе «Баламут предлагает тост», где тот же персонаж выступает на выпускном банкете. Жанр другой — не письма, а речь, и тон заметно резче: это уже социальная сатира, местами о школе и равенстве. В этом издании оно идёт сразу за письмами.",
      more: ["Впервые эссе напечатали в американском журнале The Saturday Evening Post",
             "Многие считают его самостоятельным памфлетом, а не продолжением"] },
    { t: "Письмо 16-е · Церковный туризм", page: 104,
      x: "О поиске «правильного» прихода: человек ходит по храмам как критик, сравнивая проповеди и хоры. Бесу нравится сама позиция ценителя — она избавляет от необходимости просто быть своим.",
      more: ["Приём легко переносится на любую среду: от спортзалов до онлайн-курсов", "Льюис сам был прихожанином неприметной деревенской церкви"] },
    { t: "Он и сам был неверующим", page: 110,
      x: "До тридцати с лишним лет Льюис был убеждённым атеистом и называл себя «самым унылым новообращённым Англии». Именно поэтому он так хорошо описывает сомнения: он их помнил изнутри, а не представлял. Обращение произошло в разговорах с друзьями — и Толкин сыграл там не последнюю роль.",
      more: ["Автобиография «Настигнут радостью» — про этот путь, без пафоса",
             "Ночной разговор с Толкином и Дайсоном 1931 года описан во всех биографиях"] },
    { t: "Письмо 17-е · Чревоугодие изысканности", page: 110,
      x: "Неожиданный разворот: обжорство бывает не только в количестве, но и в придирчивости — когда человеку вечно всё не так приготовлено. Требовательность выдают за тонкий вкус.",
      more: ["Портрет дамы с «чашечкой чая» — один из самых смешных в книге", "Полезно вспомнить это письмо в ресторане"] },
    { t: "Как читать письма", page: 115,
      x: "Письма короткие — по четыре-шесть страниц, и каждое посвящено одному приёму. Их специально не стоит глотать подряд: смысл проступает, когда между ними есть пауза и день обычной жизни. Отсюда и естественный ритм: одно письмо за вечер.",
      more: ["Отмечай, какие письма отозвались, — к ним потом захочется вернуться",
             "Многие перечитывают книгу раз в несколько лет и находят другие места"] },
    { t: "Письмо 18-е · Любовь и брак", page: 115,
      x: "Письмо о том, как подменяются понятия там, где речь о близости: чувство объявляется единственным основанием, а обещание — формальностью. Льюис спорит с этим спокойно, без морализаторства.",
      more: ["Тему он подробно разбирает в книге «Любовь» — четыре разных слова для любви", "Здесь же начинается линия, которая свяжет несколько следующих писем"] },
    { t: "Нарния будет позже", page: 120,
      x: "«Хроники Нарнии» Льюис начал писать только в конце 1940-х, через несколько лет после «Писем». Сначала был вот такой взрослый, ироничный тон — и лишь потом сказка. Если знать «Нарнию», в этих письмах слышны те же темы, сказанные без метафор.",
      more: ["«Лев, колдунья и платяной шкаф» вышел в 1950 году",
             "Про связь его книг между собой хорошо пишет Алистер Макграт в биографии"] },
    { t: "Письмо 19-е · Что такое любовь", page: 120,
      x: "Бес честно признаётся, что не понимает, о чём говорит противник, когда говорит о любви. Письмо построено на этом непонимании — оно и есть главный аргумент.",
      more: ["Обрати внимание: там, где бес растерян, у Льюиса самое важное", "Мысль о том, что любовь нельзя объяснить выгодой, вернётся в конце"] },
    { t: "Письмо 20-е · Мода на вкусы", page: 126,
      x: "О навязанных образах желаемого: человеку показывают, каким должно быть влечение, и он перестаёт слышать себя. Письмо о рекламе задолго до эпохи рекламы.",
      more: ["Написано в 1941-м — а читается как разбор соцсетей", "Сравни с эссе Льюиса о вкусе и подражании"] },
    { t: "Письмо 21-е · Моё время, моя жизнь", page: 132,
      x: "О чувстве собственности: раздражение возникает там, где человек считает время «своим» и всякую помеху — воровством. Разбор построен на слове «мой», которое бесы очень любят.",
      more: ["Хороший тест: посчитай, сколько раз за день ты подумал «моё время»", "Тема собственности вернётся и в разговоре о людях"] },
    { t: "Письмо 22-е · Чужая радость", page: 137,
      x: "Здесь бес срывается: он описывает музыку, тишину и радость как совершенно невыносимые для себя вещи. Одно из немногих мест, где отрицательный рассказчик выдаёт себя целиком.",
      more: ["Это письмо стоит перечитать вслух — оно почти поэтическое", "Про «шум как оружие» цитируют в книгах о тишине и внимании"] },
    { t: "Письмо 23-е · Исторический Иисус", page: 143,
      x: "О вере, превращённой в идею: когда главное — концепция, а не человек, и всякое поколение выдумывает своего героя под свои задачи. Письмо задевает и религию, и политику.",
      more: ["Льюис здесь спорит с популярным в его время жанром «жизнь Иисуса»", "Полезно рядом почитать его эссе о чтении старых книг"] },
    { t: "Письмо 24-е · Чувство избранности", page: 149,
      x: "О духовном снобизме: приятно ощущать себя среди понимающих, а всех прочих — снаружи. Бес объясняет, как из этого чувства вырастает высокомерие, незаметное для самого человека.",
      more: ["Тот же механизм Льюис разбирает в лекции «Внутренний круг»", "Проверь на любой профессиональной среде — работает"] },
    { t: "Письмо 25-е · Мода на новизну", page: 155,
      x: "О тяге к усложнённым версиям простого: каждое новое течение обещает, что вот теперь-то всё понято правильно. Бесу выгодна не ошибка, а бесконечное «наконец-то по-новому».",
      more: ["Отсюда любимая цитата Льюиса про «хронологический снобизм»", "Заметь: он не против нового, он против новизны как ценности"] },
    { t: "Письмо 26-е · Уступчивость как оружие", page: 161,
      x: "Письмо о мнимой деликатности: все уступают друг другу, никто не говорит прямо, а обида копится под слоем вежливости. Разбор ссоры, которая начинается с фразы «мне всё равно, как хочешь».",
      more: ["Сцена с бесконечными уступками — самая узнаваемая в книге", "Хороший повод в следующий раз сказать, чего хочешь"] },
    { t: "Письмо 27-е · Молитва и учёные доводы", page: 167,
      x: "Как сбить человека доводами: если молитва не сработала, значит бессмысленна; если сработала — совпадение. Здесь же — рассуждение о времени и о том, почему из вечности всё выглядит иначе.",
      more: ["Рассуждение о времени и свободе — самое философское место книги", "Льюис вернётся к нему в «Просто христианстве», в главе о времени"] },
    { t: "Письмо 28-е · Долгая безопасная жизнь", page: 173,
      x: "Разворот, которого не ждёшь: бесам выгоднее не катастрофа, а долгая спокойная жизнь, в которой человек постепенно устраивается и перестаёт спрашивать себя о главном. Опасность здесь — не беда, а уют.",
      more: ["Мысль про «годы благополучия» — самая отрезвляющая в книге", "Сравни с письмом пятым: у беды и покоя разные риски"] },
    { t: "Письмо 29-е · Мужество и трусость", page: 179,
      x: "О страхе: бесу нужна не сама опасность, а согласие человека на трусость. Здесь сказано, что мужество — не отдельная добродетель, а форма всех остальных в момент испытания.",
      more: ["Фразу о мужестве как «испытательной точке» цитируют чаще всего", "Написано человеком, прошедшим окопы Первой мировой"] },
    { t: "Письмо 30-е · Усталость", page: 185,
      x: "Об измотанности, которая делает податливым: усталый человек соглашается на то, от чего отказался бы выспавшимся. Письмо не осуждает — оно про физиологию, которую надо знать.",
      more: ["Практический вывод простой: важные решения не принимаются ночью", "Льюис писал это во время войны, когда не высыпался никто"] },
    { t: "Не только письма", page: 191,
      x: "У Льюиса есть ещё «Расторжение брака» — короткая повесть о поездке из ада в рай, и «Боль» — трезвая книга о страдании. Обе примерно о том же, что и здесь, но другими средствами. Если эта книга зайдёт, продолжение искать несложно.",
      more: ["«Расторжение брака» читается за вечер и очень наглядно",
             "«Исследуя скорбь» — дневник, написанный после смерти жены, совсем иной по тону"] },
    { t: "Письмо 31-е · Последнее письмо", page: 191,
      x: "Переписка заканчивается — и заканчивается совсем не так, как рассчитывал её автор. Больше здесь сказать нельзя, не испортив впечатления; отметим только, что тон меняется полностью.",
      more: ["После финала стоит перечитать первое письмо — оно читается иначе", "Дальше в книге идёт «Баламут предлагает тост», написанный много позже"] },
    { t: "Зачем нужны примечания", page: 213,
      x: "В конце издания есть примечания: они объясняют исторические намёки, цитаты и шутки, которые для англичанина 1941 года были очевидны, а сегодня проходят мимо. Пролистать их стоит даже после чтения — часть фраз откроется заново. Это самая недооценённая часть любой такой книги.",
      more: ["Проверь по примечаниям пару мест, которые показались странными",
             "У Льюиса много скрытых цитат из Библии и английской поэзии"] }
  ],
  unizhennye: [
    { t: "Первая большая книга после каторги", page: 20,
      x: "Достоевский вернулся из сибирской ссылки в 1859 году, и это первый крупный роман, написанный после десяти лет молчания. За плечами — четыре года каторги и служба солдатом, впереди — всё, за что его знают сегодня. Роман стоит ровно на этом сломе: старый автор «Бедных людей» уже говорит новым голосом.",
      more: ["Замысел появился ещё в 1857-м, всерьёз он взялся за него в 1860-м в Петербурге",
             "«Записки из Мёртвого дома» о каторге он писал почти одновременно с этим романом"] },
    { t: "Роман выходил по кускам целый год", page: 40,
      x: "Текст печатался в журнале «Время» весь 1861 год — от январского номера до декабрьского. Значительную часть автор дописывал прямо к сроку очередного выпуска, не зная толком, чем закончит. Отсюда и стремительность повествования, и то, что современники называли неровностью.",
      more: ["Тот же способ работы был у Диккенса — и он тоже писал к номеру",
             "Отдельной книгой роман вышел в том же 1861 году"] },
    { t: "Откуда взялся «маленький человек»", page: 50,
      x: "Русская проза XIX века придумала особый тип героя — незаметного человека без положения, чью жизнь литература до того считала недостойной внимания. Линия идёт от «Станционного смотрителя» Пушкина через «Шинель» Гоголя прямо к Достоевскому. Он же первым дал такому герою собственный голос вместо сочувственного описания со стороны.",
      more: ["«Шинель» Гоголя короткая — стоит перечитать параллельно",
             "Фразу «все мы вышли из гоголевской „Шинели“» приписывают Достоевскому, хотя источник спорный"] },
    { t: "Журнал издавали два брата", page: 60,
      x: "«Время» основали Фёдор и Михаил Достоевские, но официальным редактором значился Михаил: бывшему каторжнику не позволили бы. Журнал стал их общим делом и площадкой для собственных вещей. Этот роман был для «Времени» и художественным номером, и способом удержать подписчика.",
      more: ["Журнал закрыли в 1863 году по цензурным причинам — история отдельная и драматичная",
             "После смерти Михаила в 1864-м долги журнала легли на Фёдора"] },
    { t: "Рассказчик — молодой писатель", page: 80,
      x: "Повествование ведёт начинающий литератор Иван Петрович, и его первая книга описана так, что современники сразу узнали в ней «Бедных людей». Достоевский вставил в роман собственный дебют и собственную славу пятнадцатилетней давности. Это не автобиография, но зеркало поставлено намеренно.",
      more: ["«Бедные люди» вышли в 1846-м и сделали его знаменитым за одну ночь",
             "Историю того успеха стоит прочитать отдельно — там участвуют Некрасов и Белинский"] },
    { t: "Петербург как участник событий", page: 105,
      x: "Город здесь не фон: сырость, жёлтые фонари, лестницы, углы, где снимают комнаты. Эта традиция называется «петербургским текстом» — от Пушкина и Гоголя через Достоевского к Белому и Мандельштаму. Читая, полезно замечать, как погода в романе всегда совпадает с состоянием людей.",
      more: ["Понятие «петербургский текст» ввёл филолог Владимир Топоров",
             "Сравни описания города здесь и в «Преступлении и наказании» — узнаваемо"] },
    { t: "Почему герои так много говорят", page: 120,
      x: "У Достоевского действие часто происходит в разговоре: люди объясняются, спорят, перебивают, признаются. Литературовед Михаил Бахтин назвал это полифонией — когда у каждого героя своя правда, и автор не выносит приговор сверху. Читать такие сцены лучше медленно, слушая интонацию, а не выискивая события.",
      more: ["Книга Бахтина «Проблемы поэтики Достоевского» — классика, читается тяжеловато, но объясняет многое",
             "Попробуй прочитать один диалог вслух — сразу слышно, что это почти пьеса"] },
    { t: "Натуральная школа", page: 130,
      x: "Роман наследует «натуральной школе» 1840-х: внимание к городской бедноте, к съёмным углам, к людям без положения. Достоевский начинал именно в этой традиции, и здесь он к ней возвращается, но уже с другой оптикой — его интересуют не условия, а то, что люди делают со своим унижением.",
      more: ["Термин «натуральная школа» пустил в ход Белинский",
             "Физиологические очерки того времени читаются как репортажи"] },
    { t: "Мелодрама — это не ругательство", page: 145,
      x: "Роману часто пеняли на мелодраматичность: тайны, совпадения, сильные чувства. Но Достоевский брал эти приёмы сознательно — они держали читателя журнала от номера к номеру, а внутри такой формы можно было говорить о вещах, которые иначе никто бы не дочитал. Приём как упаковка для мысли.",
      more: ["Тот же ход у Диккенса и Гюго — их тоже упрекали в чрезмерности",
             "Поищи, что такое «роман-фельетон» — жанр объясняет половину сюжетных решений"] },
    { t: "Диккенс и французский роман", page: 160,
      x: "Исследователи прямо указывают на влияние Диккенса и Эжена Сю: тайны прошлого, документы, узнавания, сюжет, который держит читателя от номера к номеру. Достоевский любил Диккенса и читал его ещё на каторге. Из этого сплава и вырос жанр, который потом станет его собственным.",
      more: ["Про то, какие книги были доступны на каторге, он писал брату в письмах",
             "«Лавка древностей» Диккенса — хорошая параллель к этому роману"] },
    { t: "Деньги считают все", page: 175,
      x: "В его романах постоянно считают рубли: сколько стоит комната, обед, лекарство, извозчик. Это не бытовая мелочь, а способ показать несвободу — человек упирается в сумму, которой у него нет. Достоевский знал это на себе: он писал в счёт авансов почти всю жизнь.",
      more: ["Средний чиновник тогда получал около 400 рублей в год — полезно держать в уме",
             "Про его отношения с издателями хорошо написано в биографии Людмилы Сараскиной"] },
    { t: "Название стало формулой", page: 190,
      x: "«Униженные и оскорблённые» — из тех заглавий, что ушли в язык: так теперь говорят и без всякой связи с книгой. У Достоевского это не жалость сверху вниз, а взгляд изнутри: он сам прошёл через положение человека без прав и имени.",
      more: ["По-английски роман известен как Humiliated and Insulted",
             "Заголовки такого рода есть и у Гюго — «Отверженные» вышли годом позже"] },
    { t: "Что изменила каторга", page: 205,
      x: "Четыре года в Омском остроге среди убийц и воров перевернули его взгляд на людей: он увидел, что доброта и жестокость живут в одном человеке одновременно. До каторги он писал о жертвах общества, после — о людях, отвечающих за себя. Этот роман написан сразу после возвращения, и надлом виден.",
      more: ["«Записки из Мёртвого дома» — прямой рассказ о тех годах, без вымысла",
             "Смертный приговор ему заменили каторгой прямо на плацу, за минуты до расстрела"] },
    { t: "Критика приняла сдержанно", page: 215,
      x: "Отзывы были осторожными: одни ругали за мелодраму и сюжетные швы, другие защищали. Добролюбов написал о романе большую статью, где спорил с автором, но признавал силу его сочувствия к «забитым людям». Самому Достоевскому упрёки были известны, и он не спорил: писал спешно, к сроку.",
      more: ["Статья Добролюбова называется «Забитые люди» — её легко найти",
             "Аполлон Григорьев, друг и критик, оценивал роман заметно теплее"] },
    { t: "Достоевский-издатель", page: 230,
      x: "Кроме романов он вёл журналы — «Время», потом «Эпоху», писал редакционные статьи и спорил с «Современником». Его кружок называли почвенниками: они искали середину между западниками и славянофилами. Романы этих лет неотделимы от журнальной полемики, которой они окружены.",
      more: ["Про спор западников и славянофилов стоит прочитать хотя бы коротко",
             "Журнал «Эпоха» просуществовал недолго и оставил после себя долги"] },
    { t: "Он и сам знал слабые места", page: 240,
      x: "Достоевский позже говорил, что в романе много сделано наспех, но защищал в нём главное — интонацию и людей. Полезная мысль для читателя: даже у великих книга редко бывает ровной, и ценность её не в отсутствии швов. Он переиздавал роман дважды при жизни, почти ничего не переделывая.",
      more: ["Переиздания вышли в 1865 и 1879 годах",
             "О своей работе он много писал в письмах — там нет ни следа позы"] },
    { t: "Он писал ночами", page: 250,
      x: "Работал он по ночам, при свечах и с крепким чаем, вставал к полудню. Диктовал стенографистке, правил, дописывал прямо в типографские сроки. Романтический образ вдохновения к нему не подходит — это была изматывающая ремесленная работа с дедлайнами.",
      more: ["Анна Григорьевна оставила подробные воспоминания об этом распорядке",
             "Её дневник — один из лучших источников о его быте"] },
    { t: "Долги и сроки", page: 265,
      x: "Достоевский почти всю жизнь писал в долг: авансы, кредиторы, обязательства перед журналами. Позже он в такой же спешке продиктует «Игрока» за двадцать шесть дней. Скорость — не случайность его биографии, а её постоянное условие.",
      more: ["Историю с «Игроком» и стенографисткой Анной Сниткиной стоит узнать целиком",
             "Она стала его женой и потом вела все его издательские дела"] },
    { t: "Что было дальше", page: 290,
      x: "Через три года после этого романа выйдут «Записки из подполья», ещё через два — «Преступление и наказание». Всё, что здесь пока проговорено прямо, там будет сказано жёстче и глубже. Этот роман — вход в позднего Достоевского, самый мягкий из возможных.",
      more: ["Хронология: 1861 — этот роман, 1864 — «Записки из подполья», 1866 — «Преступление и наказание»",
             "Если после захочется продолжения, логичный следующий шаг — «Белые ночи» или «Идиот»"] },
    { t: "Роман легко ставить на сцене", page: 300,
      x: "В тексте мало описаний и много прямой речи — поэтому его охотно инсценируют. Первая экранизация вышла ещё в 1915 году, потом были и советские, и постсоветские версии. Сравнивать книгу с постановкой полезно: сразу видно, что режиссёры вырезают и что считают главным.",
      more: ["Фильм Андрея Эшпая 1991 года — самая известная поздняя версия",
             "Театральные афиши стоит поискать: роман ставят до сих пор"] },
    { t: "Как его читают за границей", page: 330,
      x: "По-английски роман известен как Humiliated and Insulted или The Insulted and the Injured, и переводов несколько — они заметно отличаются по интонации. Английские читатели знакомятся с Достоевским чаще через «Преступление и наказание», а этот роман считают ранним и недооценённым. Иногда полезно посмотреть, как переводчик выкручивается с русскими обращениями.",
      more: ["Классические английские переводы делали Констанс Гарнетт и позже Игнат Авсей",
             "Гарнетт перевела почти всего Достоевского — её версии критикуют, но именно они создали его славу на Западе"] },
    { t: "Эпилог у Достоевского", page: 355,
      x: "Эпилог для него — не формальность, а отдельный жанр: место, где меняется темп и автор договаривает то, чего не мог сказать по ходу событий. Тот же приём он использует в «Преступлении и наказании». Читать эпилог лучше не сразу, а на следующий день — он рассчитан на паузу.",
      more: ["Сравни с эпилогом «Преступления и наказания» — родство очевидно",
             "У русского романа XIX века эпилог вообще был обязательной частью формы"] },
    { t: "Что читать после", page: 370,
      x: "Если этот роман зайдёт, дальше логично идут «Записки из подполья» (1864) — короткие и злые, а потом «Преступление и наказание». Если хочется чего-то светлее, есть ранние «Белые ночи» — повесть на один вечер. Порядок чтения Достоевского обычно не хронологический, а по настроению.",
      more: ["«Белые ночи» читаются за пару часов и очень нежные",
             "«Идиот» — про попытку хорошего человека жить среди людей, самая печальная его книга"] },
    { t: "Роман много раз ставили и снимали", page: 384,
      x: "Экранизации начались ещё в 1915 году, а среди поздних — фильм Андрея Эшпая 1991 года с Настасьей Кински. Роман хорошо ложится на сцену: в нём мало описаний и много разговоров. После книги любопытно посмотреть — и заметить, что режиссёры почти всегда меняют финальные акценты.",
      more: ["Театральные версии идут и сегодня — обычно в камерном формате",
             "Сравнение экранизации с текстом — хороший способ понять, что в романе главное"] }
  ],
  pastel: [
    { t: "Почему Левитан взялся за пастель",
      x: "Пастельные мелки появились у Левитана рано — ещё в портретах 1880 года, но настоящий расцвет пришёлся на 1890-е, после поездок по Европе. Его пастели конца десятилетия называют эпохальными для русской пленэрной живописи: именно там его чувство цвета и состояния раскрылось особенно тонко.",
      more: ["Пастели Левитана есть в Третьяковке — репродукции их убивают, стоит смотреть вживую",
             "«Разлив» (1895) и «У ручья» (около 1899) — хорошие примеры в собрании ГТГ"] },
    { t: "Русский пейзаж пишет состояние, а не вид",
      x: "Левитан и его круг рисовали не «красивое место», а тишину, сырость, ожидание, грусть — это направление так и называют пейзажем настроения. Пастель для этого идеальна: она не даёт резких границ, цвет ложится дымкой, и сумерки, туман, тающий снег получаются сами собой.",
      more: ["Посмотри «Над вечным покоем» и «Владимирку» — там настроение важнее сюжета",
             "Бенуа писал, что у Левитана не виды местностей, а сама русская природа"] },
    { t: "Скорость решает",
      x: "Пастелью работают быстро: не нужно ждать, пока высохнет слой. Увидел свет — записал. Для пейзажиста это способ поймать те десять минут заката, которые маслом не успеть, отсюда ощущение живого воздуха в таких работах.",
      more: ["Попробуй сделать один и тот же вид утром и вечером — разница в цвете удивляет",
             "Посмотри пастельные этюды Дега: он довёл быструю работу до уровня живописи"] },
    { t: "Иногда материал выбирают обстоятельства",
      x: "У Серова пастель была исключением: свою «Бабу с лошадью» он сделал ей просто потому, что на морозе масляные краски застывали. Хорошее напоминание, что выбор материала часто диктует не идея, а погода, время и то, что под рукой.",
      more: ["Посмотри «Бабу с лошадью» — по ней видно, как быстро работал Серов",
             "Сравни его пастель с портретами маслом: другая рука, другой темп"] },
    { t: "Хрупкость как часть смысла",
      x: "Пастель держится на трении: почти чистый пигмент лежит на поверхности и осыпается от касания. Работу нельзя тронуть пальцем, её возят под стеклом, а в музеях показывают редко — свет и вибрация её разрушают. Материал сам напоминает о том, о чём писал русский пейзаж: красота недолговечна.",
      more: ["Почитай, как музеи хранят пастели: их почти не отправляют на выставки",
             "Выставки «хрупкой графики» проходят раз в несколько лет — стоит ловить"] },
    { t: "Первой была женщина",
      x: "Первым мастером, работавшим почти исключительно пастелью, стала венецианка Розальба Каррьера (1675–1758). Её портреты сделали технику модной по всей Европе — во многом благодаря её же умению себя подать. История пастели начинается не с эксперимента художника-мужчины, а с чужого успеха, которому все начали подражать.",
      more: ["Посмотри её портреты — кожа и ткани написаны почти без штриха",
             "Поищи, как она работала с заказчиками в Париже 1720-х: это отдельный сюжет"] },
    { t: "Это почти чистый пигмент",
      x: "Пастельный мелок — это красящий порошок с минимумом связующего, спрессованный в палочку. Поэтому цвет такой звонкий: между глазом и пигментом нет слоя масла или лака, который бы его приглушал. Всё, что ты кладёшь на бумагу, — это и есть краска в чистом виде.",
      more: ["Сравни один и тот же цвет в пастели и в масле — разница в глубине очевидна",
             "Поищи, чем отличаются мягкая, твёрдая и масляная пастель"] },
    { t: "Она не желтеет со временем",
      x: "Масляная живопись со временем темнеет и желтеет из-за самого масла. В пастели связующего почти нет — поэтому цвет столетней работы остаётся таким, каким его положили. Парадокс: самый хрупкий материал оказывается самым честным по цвету.",
      more: ["Посмотри пастели XVIII века в музее — краски будто вчерашние",
             "Про пожелтение масла хорошо объясняют реставраторы в лекциях"] },
    { t: "Ничего не сохнет — значит, не ждёшь",
      x: "В масле и акварели ритм работы задаёт высыхание слоя: положил — жди. В пастели этой паузы нет вообще, можно идти без остановки, пока не кончится замысел. Для занятий по вечерам это редкая роскошь: сессия заканчивается тогда, когда решил ты, а не материал.",
      more: ["Попробуй уложиться в один сеанс от начала до конца — это меняет мышление",
             "У акварелистов есть обратный приём — «по-сырому», когда ждать нельзя"] },
    { t: "Дега размягчал пастель паром",
      x: "Дега обрабатывал слой паром, чтобы пигмент становился податливым, и растушёвывал его пальцами, добиваясь плотности живописи. Он же слоил пастель поверх монотипии и не боялся смешивать техники. Правило «пастель — это лёгкие наброски» он опроверг лично.",
      more: ["Посмотри его балетные пастели вблизи — там десятки слоёв",
             "Поищи, что такое монотипия — отпечаток с гладкой доски"] },
    { t: "Растушёвывать нужно не всё",
      x: "Каррьера и Шарден растирали пастель, но специально оставляли нерастёртые участки — там, где нужен акцент. Контраст мягкого и резкого делает работу живой: сплошная растушёвка превращает её в вату. Полезное правило: растушёвка — это тень, штрих — это форма.",
      more: ["Найди пастели Шардена — видно, где он остановил палец",
             "Попробуй в одной работе оставить четверть площади нетронутой"] },
    { t: "Тон бумаги — это уже цвет",
      x: "Пастель почти никогда не кладут на белое: берут серую, охристую, синюю бумагу, и её тон становится средним тоном работы. Левитан работал на бумаге, на сером картоне и даже на холсте. Выбор основы решает половину колорита ещё до первого штриха.",
      more: ["Сделай два одинаковых этюда на серой и на охристой бумаге — сравни",
             "Поищи, что такое «имприматура» — тонированный грунт в живописи"] },
    { t: "Фиксатив всегда меняет цвет",
      x: "Закрепитель склеивает пигмент, но при этом приглушает и слегка темнит цвет, поэтому многие мастера не фиксировали работы вовсе, а закрывали их стеклом. Лак для волос, который советуют в интернете, со временем желтит бумагу. Если фиксируешь — делай это слоями и заранее проверь на обрезке.",
      more: ["Поищи сравнения «до и после фиксации» — разница видна на глаз",
             "У музейщиков правило: лучше стекло и паспарту, чем лишний слой лака"] },
    { t: "Пастель придумали для путешествий",
      x: "Мелки не проливаются, не сохнут и не требуют растворителей — с ними можно работать где угодно, что и сделало пастель материалом пленэра. Именно поэтому импрессионисты и русские пейзажисты уносили её из мастерской на воздух. Материал определил, где вообще стало возможно рисовать.",
      more: ["Собери минимальный набор из десяти мелков и выйди с ним на улицу",
             "Поищи фотографии походных этюдников XIX века"] },
    { t: "Мало цветов — сильнее работа",
      x: "В пастели цвета почти не смешиваются на палитре: нужный оттенок либо есть в наборе, либо набирается наложением штрихов. Художники специально ограничивают набор, чтобы работа держалась на отношениях, а не на разнообразии. Ограничение — самый быстрый способ научиться видеть цвет.",
      more: ["Сделай этюд пятью мелками — результат обычно неожиданно цельный",
             "Поищи «оптическое смешение» — как глаз сам смешивает соседние штрихи"] },
    { t: "Штрих виден — и это хорошо",
      x: "В пастели невозможно спрятать движение руки: каждый штрих остаётся на поверхности. Именно поэтому по пастели видно темперамент художника лучше, чем по маслу. Не пытайся сделать «гладко» — гладкость съедает то, ради чего этот материал существует.",
      more: ["Посмотри вблизи любую пастель Дега — штрихи разнонаправленные и грубые",
             "Попробуй один этюд сделать только боковой стороной мелка"] },
    { t: "Русский пейзаж вырос из школы Саврасова",
      x: "Левитан учился у Алексея Саврасова, автора «Грачей», который первым стал писать неяркую, обыденную природу как самостоятельный сюжет. От него пошла идея, что предмет искусства — не вид, а переживание места. Всё, что делает пастель хорошо, эта школа как раз и искала.",
      more: ["Посмотри «Грачи прилетели» и подумай, почему картина казалась революционной",
             "Поищи термин «пейзаж настроения» — его связывают именно с этой линией"] },
    { t: "Сумерки — лучшее время для пастели",
      x: "На закате контрасты падают, цвет становится сложным, границы предметов размываются — то есть наступают условия, в которых пастель сильнее масла. Левитан ловил именно эти состояния: разлив, туман, последний свет. Если не знаешь, что рисовать, дождись сумерек.",
      more: ["Сделай три быстрых этюда с интервалом в двадцать минут на закате",
             "Посмотри «Осенний пейзаж с церковью» — работа как раз про уходящий свет"] },
    { t: "Учиться — значит копировать",
      x: "Пастельные этюды старых мастеров веками копировали в академиях, потому что рука быстрее понимает материал, чем голова. Копия не делает тебя вторичным: она отдаёт тебе чужие решения, которые потом всплывут в своей работе. Это ровно тот же принцип, по которому музыканты разбирают чужие пьесы.",
      more: ["Возьми одну пастель Левитана и повтори её в маленьком формате",
             "Сравни свою копию с оригиналом через неделю — увидишь, что упустил"] },
    { t: "Курс — это не про технику",
      x: "Любой короткий курс даёт не мастерство, а язык: названия приёмов, порядок действий, набор ошибок, которых можно не повторять. Дальше работает только регулярность — час за часом, этюд за этюдом. Поэтому уроки полезно проходить не залпом, а с промежутками, в которых ты успеваешь что-то попробовать сам.",
      more: ["После каждого урока делай один свой этюд на ту же тему",
             "Через месяц разложи работы по порядку — прогресс виден только в ряду"] }
  ]
};

// карточки текущего материала: сколько открыто по числу дней занятий
/* Карточка открывается за занятие: одно занятие — одна карточка.
   У курса занятий мало (уроки), поэтому там за раз открывается несколько.
   Когда материал пройден до конца — открывается всё, что осталось. */
function factsState() {
  const key = isBook() ? book().id : isPastel() ? "pastel" : piece().id;
  const list = FACTS[key] || [];
  if (!list.length) return [];
  // у курса шагом служат пройденные уроки: их мало, поэтому за раз открывается несколько карточек
  const step = isPastel() ? doneLessons().size : new Set(entries().map(e => e.date)).size;
  const span = isPastel() ? Math.max(1, course().lessons.length) : list.length;
  const finished = curStats().pct >= 100;
  const page = isBook() ? bookProgress() : 0;

  const out = list.map((f, i) => {
    // карточка с привязкой к странице открывается, когда до неё дочитал
    if (f.page) return { ...f, id: key + ":" + i, need: f.page, unit: "page", open: page >= f.page };
    const need = Math.max(1, Math.ceil((i + 1) * span / list.length));
    return { ...f, id: key + ":" + i, need, unit: isPastel() ? "lesson" : "day", open: finished || step >= need };
  });

  return out;
}

function fmtRange(from, to) {
  const f = new Intl.DateTimeFormat("ru", { day: "numeric", month: "short" });
  return from === to ? f.format(fromStr(from)) : `${f.format(fromStr(from))} — ${f.format(fromStr(to))}`;
}

function goalProgress() {
  const from = dateStr(mondayOf(new Date()));
  const days = new Set(
    [...data.piano.entries, ...data.book.entries, ...data.pastel.entries]
      .filter(e => !e.deleted && e.date >= from).map(e => e.date)
  ).size;
  const goal = data.weekGoal || 4;
  return { days, goal, left: Math.max(0, goal - days), done: days >= goal, pct: Math.min(100, days / goal * 100) };
}

function weeklyHistory(weeks = 12) {
  const days = new Set(entries().map(e => e.date));
  const out = [];
  const monday = mondayOf(new Date());
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(monday); start.setDate(start.getDate() - i * 7);
    let n = 0;
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start); cur.setDate(cur.getDate() + d);
      if (cur > new Date()) break;
      if (days.has(dateStr(cur))) n++;
    }
    out.push({ start: dateStr(start), days: n });
  }
  return out;
}

function weekSummary(offset = 0) {
  const monday = mondayOf(new Date());
  monday.setDate(monday.getDate() - offset * 7);
  const from = dateStr(monday);
  const end = new Date(monday); end.setDate(end.getDate() + 6);
  const to = dateStr(end);
  const inWeek = (e) => !e.deleted && e.date >= from && e.date <= to;

  const pianoEntries = data.piano.entries.filter(inWeek);
  let bars = 0;
  for (const e of pianoEntries) for (const sp of e.spans || []) bars += sp.to - sp.from + 1;

  const bookEntries = data.book.entries.filter(inWeek);
  const pages = pagesRead(from, to);

  const pastelEntries = data.pastel.entries.filter(inWeek);
  let lessons = 0;
  for (const e of pastelEntries) lessons += (e.lessons || []).length;

  const allDays = new Set([...pianoEntries, ...bookEntries, ...pastelEntries].map(e => e.date));
  return { from, to, days: allDays.size, bars, pages, lessons };
}

function currentMaterial() {
  if (!hasMaterials()) return { icon: "◌", title: "нет материалов", sub: "", pct: 0 };
  if (isBook()) {
    const b = book(), s = bookStats();
    return { icon: "📖", title: b.title, sub: `${s.page} из ${s.pages} стр.`, pct: s.pct };
  }
  if (isPastel()) {
    const c = course(), s = pastelStats();
    return { icon: "🎨", title: c.name, sub: `${s.done} из ${s.lessons} уроков`, pct: s.pct };
  }
  const p = piece(), s = pianoStats();
  return { icon: "🎹", title: p.name, sub: `${s.touchedR + s.touchedL} из ${s.bars * 2} тактов-рук`, pct: s.pct };
}

function archiveCurrent() {
  const m = currentMaterial();
  const days = new Set(entries().map(e => e.date)).size;

  if (!confirm(`Отправить «${m.title}» в архив?\n\nПройдено: ${Math.round(m.pct)}%, ${days} ${plural(days, "день", "дня", "дней")} занятий.\nЗаписи и вклад в баланс останутся.`)) return;

  const dates = entries().map(e => e.date).sort();
  const look = isBook() ? book() : isPastel() ? { art: "smears", tone: "pastel" } : piece();
  const rec = {
    id: uid(), track: data.active, icon: m.icon, title: m.title,
    sub: m.sub, pct: Math.round(m.pct), days,
    art: look.art || "", tone: look.tone || "",
    startedAt: dates[0] || todayStr(), finishedAt: todayStr(),
    rating: 0, review: "",
    createdAt: now(), updatedAt: now()
  };
  data.archive.push(rec);

  if (isBook()) {
    const cur = book();
    cur.archived = true; cur.updatedAt = now();
    const next = data.book.books.find(b => !b.archived);
    if (next) { data.book.activeBook = next.id; saveData(); schedulePush(); render(); openShelfSheet(rec.id); return; }

    const title = prompt("Какую книгу читаешь теперь?", "");
    if (title === null || !title.trim()) { data.archive.pop(); cur.archived = false; return; }
    const pagesStr = prompt("Сколько в ней страниц?", "300");
    const pages = Math.round(Number((pagesStr || "").replace(",", ".")));
    if (!pages || pages < 1) { data.archive.pop(); cur.archived = false; toast("Не понял число страниц"); return; }
    const fresh = {
      id: uid(), title: title.trim(), author: "", volume: "",
      pages, startPage: 0, art: "snow", tone: "sea",
      chapters: [{ name: "Начало", from: 1 }], updatedAt: now()
    };
    data.book.books.push(fresh);
    data.book.activeBook = fresh.id;
  } else if (isPastel()) {
    const name = prompt("Какой курс проходишь теперь?", "");
    if (name === null || !name.trim()) { data.archive.pop(); return; }
    const cnt = Math.round(Number((prompt("Сколько в нём уроков?", "10") || "").replace(",", ".")));
    if (!cnt || cnt < 1) { data.archive.pop(); toast("Не понял число уроков"); return; }
    data.pastel.course = {
      id: uid(), name: name.trim(), author: "",
      lessons: Array.from({ length: cnt }, (_, i) => ({ title: `Урок ${i + 1}`, dur: 600 })),
      updatedAt: now()
    };
  } else {
    const p = piece();
    p.archived = true; p.updatedAt = now();
    const rest = data.piano.pieces.filter(x => !x.archived);
    if (!rest.length) {
      const name = prompt("Какую вещь разбираешь теперь?", "");
      if (name === null || !name.trim()) { p.archived = false; data.archive.pop(); return; }
      const bars = Math.round(Number((prompt("Сколько в ней тактов?", "40") || "").replace(",", ".")));
      if (!bars || bars < 1) { p.archived = false; data.archive.pop(); toast("Не понял число тактов"); return; }
      const np = { id: uid(), author: "", name: name.trim(), bars, art: "keys", tone: "violet", updatedAt: now() };
      data.piano.pieces.push(np);
      data.piano.activePiece = np.id;
    } else {
      data.piano.activePiece = rest[0].id;
    }
  }

  saveData(); schedulePush(); syncPickers(); render();
  openShelfSheet(rec.id);      // сразу предлагаем поставить оценку и написать отзыв
}

function freezeUI() {
  const list = (data.freezes || []).filter(f => !f.deleted)
    .sort((a, b) => a.from < b.from ? 1 : -1);
  const today = todayStr();

  return `
    <div class="freeze">
      <div class="fz-head">🌴 <b>Пауза</b> — дни отпуска или болезни, которые не рвут серию</div>
      <div class="fz-form">
        <input class="note-input" id="fzFrom" type="date" value="${today}" max="2100-01-01">
        <input class="note-input" id="fzTo" type="date" value="${today}" max="2100-01-01">
        <button class="btn" id="fzAdd" type="button">Добавить</button>
      </div>
      ${list.length ? `<div class="fz-list">${list.map(f => `
        <div class="fz-item ${today >= f.from && today <= f.to ? "now" : ""}">
          <span>${fmtRange(f.from, f.to)}${today >= f.from && today <= f.to ? " · идёт сейчас" : ""}</span>
          <button data-fz="${f.id}" type="button">✕</button>
        </div>`).join("")}</div>` : `<div class="fz-empty">Пока пауз нет</div>`}
    </div>`;
}

function bindFreezeUI() {
  const add = $("#fzAdd");
  if (!add) return;
  add.addEventListener("click", () => {
    const from = $("#fzFrom").value, to = $("#fzTo").value;
    if (!from || !to) { toast("Укажи даты"); return; }
    const a = from <= to ? from : to, b = from <= to ? to : from;
    data.freezes.push({ id: uid(), from: a, to: b, createdAt: now(), updatedAt: now() });
    saveData(); schedulePush();
    toast("Пауза добавлена — серия не прервётся");
    openSettingsSheet();
    render();
  });

  document.querySelectorAll("[data-fz]").forEach(b =>
    b.addEventListener("click", () => {
      const f = data.freezes.find(x => x.id === b.dataset.fz);
      if (!f) return;
      if (!confirm("Убрать эту паузу?\n\nДни снова начнут рвать серию.")) return;
      f.deleted = true; f.updatedAt = now();
      saveData(); schedulePush();
      openSettingsSheet();
      render();
    }));
}

function shakeUI() {
  const supported = typeof window.DeviceMotionEvent === "function";
  return `
    <div class="freeze">
      <div class="fz-head">🎲 <b>Встряхивание</b> — потряси телефон, и лента сама выберет занятие</div>
      ${!supported
        ? `<div class="fz-empty">Это устройство не сообщает о движении</div>`
        : shakeReady
          ? `<div class="fz-empty">Включено — можно трясти</div>`
          : `<button class="btn" id="shakeAsk" type="button">Разрешить доступ к движению</button>`}
    </div>`;
}

function bindShakeUI() {
  const b = $("#shakeAsk");
  if (!b) return;
  b.addEventListener("click", async () => {
    const ok = await enableShake(true);
    toast(ok ? "Готово — потряси телефон" : "Доступ к движению не разрешён");
    openSettingsSheet();
  });
}

function goalUI() {
  const g = goalProgress();
  return `
    <div class="freeze">
      <div class="fz-head">🎯 <b>Цель на неделю</b> — сколько дней заниматься чем угодно из трёх</div>
      <div class="goal-pick">
        ${[2, 3, 4, 5, 6, 7].map(n =>
          `<button class="gbtn ${g.goal === n ? "on" : ""}" data-goal="${n}" type="button">${n}</button>`).join("")}
      </div>
      <div class="fz-empty">Сейчас: <b>${g.days} из ${g.goal}</b> на этой неделе</div>
    </div>`;
}

function bindGoalUI() {
  document.querySelectorAll("[data-goal]").forEach(b =>
    b.addEventListener("click", () => {
      data.weekGoal = Number(b.dataset.goal);
      saveData(); schedulePush();
      openSettingsSheet();
      render();
      toast(`Цель: ${data.weekGoal} ${plural(data.weekGoal, "день", "дня", "дней")} в неделю`);
    }));
}

function archiveUI() {
  if (!hasMaterials()) return "";
  const cur = currentMaterial();
  const list = (data.archive || []).filter(a => !a.deleted)
    .sort((a, b) => a.finishedAt < b.finishedAt ? 1 : -1);
  const fmt = new Intl.DateTimeFormat("ru", { day: "numeric", month: "short", year: "numeric" });

  return `
    <div class="freeze">
      <div class="fz-head">📦 <b>Материалы</b> — пройденное уходит в архив, дни занятий остаются</div>
      <div class="fz-empty">Сейчас: <b>${esc(cur.title)}</b> · ${Math.round(cur.pct)}%</div>
      <button class="btn" id="archBtn" type="button">Отправить в архив и начать новое</button>
      ${list.length ? `<div class="fz-list">${list.map(a => `
        <div class="fz-item">
          <span>${a.icon} ${esc(a.title)} · ${a.pct}% · ${fmt.format(fromStr(a.finishedAt)).replace(" г.", "")}</span>
        </div>`).join("")}</div>` : ""}
    </div>`;
}

function bindArchiveUI() {
  const b = $("#archBtn");
  if (b) b.addEventListener("click", () => { closeSheet(); archiveCurrent(); });
}

function diagLine() {
  const bar = document.querySelector(".tabbar");
  const r = bar ? bar.getBoundingClientRect() : null;
  const safe = getComputedStyle(document.documentElement).getPropertyValue("--safe-b").trim() || "0px";
  const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone ? "standalone" : "браузер";
  return `${standalone} · окно ${Math.round(innerWidth)}×${Math.round(innerHeight)} · экран ${screen.width}×${screen.height}` +
    `<br>таббар ${r ? Math.round(r.height) : "?"}px, снизу ${r ? Math.round(innerHeight - r.bottom) : "?"}px · safe-area ${safe}`;
}

function saveEntry() {
  if (!gistReady()) { closeSheet(); openSettingsSheet(); return; }
  const existing = entryFor(selectedDate);
  const beforeDone = new Set(achState().filter(a => a.done).map(a => a.id));
  const beforeFacts = new Set(factsState().filter(f => f.open).map(f => f.id));
  const before = curStats();
  const note = ($("#noteInput") && $("#noteInput").value.trim()) || "";

  if (existing) {
    if (isBook()) existing.page = Math.max(existing.page || 0, pickPage);
    else if (isPastel()) existing.lessons = [...new Set([...(existing.lessons || []), ...pickLessons])];
    else existing.spans = (existing.spans || []).concat(currentSpans());
    if (note) existing.note = existing.note ? existing.note + "; " + note : note;
    existing.updatedAt = now();
  } else {
    trackOf().entries.push(Object.assign(
      { id: uid(), date: selectedDate, note, createdAt: now(), updatedAt: now() },
      isBook() ? { page: pickPage } : isPastel() ? { lessons: pickLessons.slice() } : { pieceId: piece().id, spans: currentSpans() }
    ));
  }

  pending = [];
  pickLessons = [];
  saveData();
  schedulePush();
  closeSheet();

  const after = curStats();
  const fresh = achState().filter(a => a.done && !beforeDone.has(a.id));
  const freshFacts = factsState().filter(f => f.open && !beforeFacts.has(f.id));
  render();

  overlayQueue = [];
  if (fresh.length) overlayQueue.push({ type: "ach", a: fresh[fresh.length - 1], count: fresh.length });
  if (freshFacts.length) overlayQueue.push({ type: "facts", list: freshFacts });

  if (overlayQueue.length) { showNextOverlay(); return; }
  showDone(before, after, !!existing);
}

let overlayQueue = [];

function showNextOverlay() {
  const item = overlayQueue.shift();
  if (!item) return;
  if (item.type === "ach") showCheer(item.a, item.count);
  else showFacts(item.list);
}

// все новые карточки знаний — одним экраном, листаются прокруткой
function showFacts(list) {
  $("#cheerIc").textContent = "💡";
  $("#cheerTitle").textContent = list.length > 1
    ? `${list.length} ${plural(list.length, "новая карточка", "новые карточки", "новых карточек")}`
    : list[0].t;
  $("#cheerText").innerHTML = list.length > 1
    ? `<span class="cheer-list">${list.map(f => `
        <span class="cheer-item">
          <b>${esc(f.t)}</b>
          <i>${esc(f.x)}</i>
          ${(f.more || []).length ? `<em>→ ${esc(f.more[0])}</em>` : ""}
        </span>`).join("")}</span>`
    : esc(list[0].x) + ((list[0].more || []).length ? `<span class="cheer-dig">Копнуть глубже: ${esc(list[0].more[0])}</span>` : "");
  $("#cheerOk").textContent = overlayQueue.length ? "Дальше" : "Интересно!";
  $("#cheer").classList.add("show", "fact");
}

function showCheer(a, count) {
  $("#cheerIc").textContent = a.icon;
  $("#cheerTitle").textContent = a.name;
  $("#cheerText").textContent = wordOf(a) +
    (count > 1 ? ` · и ещё ${count - 1} ${plural(count - 1, "достижение", "достижения", "достижений")} открыто!` : "");
  $("#cheerOk").textContent = overlayQueue.length ? "Дальше" : "Красота!";
  $("#cheer").classList.remove("fact");
  $("#cheer").classList.add("show");
}

function showDone(before, after, wasExisting) {
  if (selectedDate !== todayStr()) { toast(fmtDay(selectedDate) + " отмечено"); return; }
  if (wasExisting) { toast("Запись дополнена"); return; }

  $("#cheerIc").textContent = after.streakAll >= 2 ? "🔥" : "🎉";
  $("#cheerTitle").textContent = rnd(DONE_TITLES);
  let text;
  if (isBook()) {
    const g = after.page - before.page;
    text = g > 0 ? `Дочитал до ${after.page}-й страницы (+${stranic(g)}), это ${Math.round(after.pct)}% книги. ` : "Перечитывал уже пройденное — тоже дело. ";
  } else if (isPastel()) {
    const g = after.done - before.done;
    text = g > 0
      ? `+${g} ${plural(g, "урок", "урока", "уроков")}, пройдено ${after.done} из ${after.lessons}. `
      : "Возвращался к пройденному — тоже дело. ";
  } else {
    const g = (after.touchedR + after.touchedL) - (before.touchedR + before.touchedL);
    text = g > 0 ? `+${takty(g)} к разбору, всего ${Math.round(after.pct)}%. ` : "Повторение — эти такты стали крепче. ";
  }
  text += after.streakAll >= 2
    ? `Серия — ${after.streakAll} ${plural(after.streakAll, "день", "дня", "дней")} подряд. Возвращайся завтра, будет ${after.streakAll + 1} 🔥`
    : "Возвращайся завтра — начнём серию!";
  $("#cheerText").textContent = text;
  $("#cheer").classList.add("show");
}

function deleteEntry(id) {
  const e = trackOf().entries.find(x => x.id === id);
  if (!e) return;
  if (!confirm(`Удалить запись за ${fmtDay(e.date)}?\n\nПрогресс по этому дню пропадёт.`)) return;
  e.deleted = true; e.updatedAt = now();
  saveData(); schedulePush(); syncPickers(); render();
  toast("Запись удалена");
}

function goToDate(ds) {
  if (ds > todayStr()) { toast("Это ещё в будущем 🙂"); return; }
  selectedDate = ds; pending = []; pickLessons = [];
  const d = fromStr(ds);
  calYear = d.getFullYear(); calMonth = d.getMonth();
  render();
}
function shiftDay(delta) {
  const d = fromStr(selectedDate); d.setDate(d.getDate() + delta);
  goToDate(dateStr(d));
}

function switchTrack(which) {
  if (data.active === which) return;
  data.active = which;
  pending = []; pickLessons = []; selectedDate = todayStr();
  const t = new Date(); calYear = t.getFullYear(); calMonth = t.getMonth();
  syncPickers(); saveData(); schedulePush(); render();
}

function syncPickers() {
  if (!hasMaterials()) return;
  if (isBook()) pickPage = bookProgress();
  else if (isPiano() && piece()) {
    const bars = piece().bars;
    pickFrom = Math.min(pickFrom, bars); pickTo = Math.min(pickTo, bars);
  }
}

/* ══════════ Рендер ══════════ */

function renderBanner() {
  const box = $("#banner");
  if (!box) return;

  if (!online && gistReady()) {
    box.innerHTML = `
      <div class="warn off">
        <span>📴 <b>Нет сети.</b> Записи сохраняются на устройстве и уйдут в гист, как только связь появится.</span>
      </div>`;
    return;
  }

  if (newVersion) {
    box.innerHTML = `
      <div class="warn upd">
        <span>⬆️ <b>Есть новая версия</b> ${esc(newVersion)} — сейчас установлена ${esc(APP_VERSION)}</span>
        <button id="bnUpdate" type="button">Обновить</button>
      </div>`;
    $("#bnUpdate").addEventListener("click", forceUpdate);
    return;
  }

  if (!gistReady()) {
    box.innerHTML = `
      <div class="warn">
        <span>🔒 <b>Синхронизация не подключена.</b> Записи отключены, чтобы прогресс не остался только на этом устройстве.</span>
        <button id="bnConnect" type="button">Подключить</button>
      </div>`;
    $("#bnConnect").addEventListener("click", openSettingsSheet);
    return;
  }

  if (syncError) {
    box.innerHTML = `
      <div class="warn err">
        <span>⚠️ <b>Данные сохранены локально</b>, но не ушли в гист: ${esc(syncError)}</span>
        <button id="bnRetry" type="button">Повторить</button>
      </div>`;
    $("#bnRetry").addEventListener("click", () => syncNow(true));
    return;
  }

  box.innerHTML = "";
}

// если что-то упало — показываем понятный экран вместо пустоты
function crashScreen(e) {
  const box = $("#view");
  if (!box) return;

  // первая попытка — молча снять service worker и перезагрузиться: чаще всего виноват он
  let tried = "1";
  try { tried = sessionStorage.getItem("keiko-selfheal") || ""; } catch {}
  if (tried !== "1") {
    try { sessionStorage.setItem("keiko-selfheal", "1"); } catch {}
    (async () => {
      try {
        if (navigator.serviceWorker) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
        }
        if (window.caches) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
      } catch {}
      location.replace(location.origin + location.pathname + "?v=" + Date.now());
    })();
    box.innerHTML = `<div class="empty-state"><div class="es-mark">稽古</div><h2>Восстанавливаю…</h2></div>`;
    return;
  }

  box.innerHTML = `
    <div class="empty-state">
      <div class="es-mark">稽古</div>
      <h2>Что-то пошло не так</h2>
      <p>Данные целы — сбой в самом приложении. Кнопка ниже переустановит его начисто.</p>
      <button class="btn gold" id="crashUpd" type="button" style="max-width:280px">Переустановить</button>
      <p class="crash-why">${esc(String((e && e.message) || e || ""))}</p>
    </div>`;
  const b = $("#crashUpd");
  if (b) b.addEventListener("click", () => {
    location.replace(location.origin + location.pathname + "?reset=1");
  });
}

// снимок данных: если синхронизация ничего не изменила, перерисовывать нечего
const dataStamp = () => [
  data.piano.entries, data.book.entries, data.pastel.entries,
  data.thoughts || [], data.archive || [], data.freezes || []
].map(list => list.length + ":" + list.reduce((m, e) => Math.max(m, e.updatedAt || 0), 0)).join("|")
  + "|" + (data.shop.theme || "");
// выбранный материал в снимок не входит: он меняется от свайпа и уже показан на экране —
// перерисовывать из-за него главную значит сбивать листание

let quietRender = false;   // перерисовка без анимаций — например, после фоновой синхронизации

/* Пока человек листает ленту обложек, главную не трогаем: перерисовка пересобирает
   ленту и возвращает её к активной обложке — со стороны это «свайп не сработал». */
let railBusy = false;
let railBusyTimer = null;
let pendingRender = null;

function markRailBusy() {
  railBusy = true;
  clearTimeout(railBusyTimer);
  railBusyTimer = setTimeout(releaseRail, 1400);   // страховка, если события кончились молча
}

function releaseRail() {
  clearTimeout(railBusyTimer);
  if (!railBusy) return;
  railBusy = false;
  if (pendingRender) { const q = pendingRender === "quiet"; pendingRender = null; render(q); }
}

function render(quiet) {
  if (railBusy && tab === "home" && !settingsOpen) {
    if (pendingRender !== "loud") pendingRender = quiet ? "quiet" : "loud";
    return;
  }
  quietRender = !!quiet;
  try { renderInner(); } catch (e) { console.error(e); crashScreen(e); }
  quietRender = false;
}

function renderInner() {
  const box = $("#view");
  const keepScroll = box ? box.scrollTop : 0;
  clearTimeout(railBusyTimer); railBusy = false; pendingRender = null;   // лента пересобирается заново

  renderSeg();
  renderBanner();
  renderTabbar();
  // главная всегда влезает в экран, остальные вкладки скроллятся внутри себя
  $("#view").className = (tab === "home" && !settingsOpen ? "fixed" : "scrolls") + (quietRender ? " quiet" : "");
  if (settingsOpen) renderSettings();
  else if (tab === "home") renderHome();
  else if (tab === "progress") renderProgress();
  else if (tab === "notes") renderNotes();
  else renderAch();
  syncNotesFabs();

  if (quietRender && box && keepScroll) box.scrollTop = keepScroll;   // не сбрасываем место, где человек читал
}

function renderSeg() {
  const box = $("#seg");
  if (box) { box.style.display = "none"; box.innerHTML = ""; }
}

// высота закреплённого таббара — чтобы контент не заезжал под него
function syncTabHeight() {
  const bar = document.querySelector(".tabbar");
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  if (h) document.documentElement.style.setProperty("--tab-h", h + "px");
}

function renderTabbar() {
  const openCount = achMaterials().reduce((n, m) => n + m.open, 0);
  $("#tabbar").innerHTML = [
    [ "home", ICON("home", "◉"), T("tabHome")],
    ["progress", ICON("progress", "▤"), T("tabProgress")],
    ["notes", ICON("notes", "✎"), T("tabNotes")],
    ["ach", ICON("ach", "✦"), `${T("tabAch")} ${openCount}`]
  ].map(([id, ic, nm]) =>
    `<button data-tab="${id}" class="${tab === id ? "on" : ""}" type="button"><i>${ic}</i>${nm}</button>`).join("");
  syncTabHeight();
  requestAnimationFrame(syncTabHeight);
  document.querySelectorAll("#tabbar button").forEach(b =>
    b.addEventListener("click", () => {
      tab = b.dataset.tab;
      settingsOpen = false; settingsView = null;
      if (tab === "notes") { notesFocus = true; shuffleThought = null; notesFilter = "all"; }
      cfg.tab = tab; saveCfg();
      render();
      $("#view").scrollTop = 0;
    }));
}

const KEYS_ART = `
  <div class="keys">
    <span class="w"></span><span class="w"></span><span class="w"></span><span class="w"></span>
    <span class="w"></span><span class="w"></span><span class="w"></span>
    <span class="b" style="left:10.2%"></span><span class="b" style="left:24.5%"></span>
    <span class="b" style="left:53%"></span><span class="b" style="left:67.3%"></span><span class="b" style="left:81.6%"></span>
  </div>`;

const WAVE_ART = `
  <svg class="wave" viewBox="0 0 120 56" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <circle cx="92" cy="15" r="8" fill="rgba(255,201,77,.85)"/>
    <path d="M2 36 Q 17 24 32 36 T 62 36 T 92 36 T 118 36" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M2 45 Q 17 33 32 45 T 62 45 T 92 45 T 118 45" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`;

const SEA_ART = `
  <svg class="wave sea" viewBox="0 0 120 64" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <circle cx="98" cy="14" r="7" fill="rgba(255,201,77,.85)"/>
    <path d="M52 10 L52 40" stroke="rgba(255,255,255,.78)" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M54 13 L74 28 L54 34 Z" fill="rgba(255,255,255,.7)"/>
    <path d="M34 40 L78 40 L70 49 L42 49 Z" fill="rgba(255,255,255,.55)"/>
    <path d="M4 54 Q 19 46 34 54 T 64 54 T 94 54 T 116 54" fill="none" stroke="rgba(255,255,255,.48)" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M4 61 Q 19 53 34 61 T 64 61 T 94 61 T 116 61" fill="none" stroke="rgba(255,255,255,.24)" stroke-width="2" stroke-linecap="round"/>
  </svg>`;

const PINE_ART = `
  <svg class="wave pine" viewBox="0 0 120 64" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <circle cx="102" cy="13" r="7" fill="rgba(255,201,77,.8)"/>
    <path d="M60 8 L69 28 L64 28 L74 48 L46 48 L56 28 L51 28 Z" fill="rgba(255,255,255,.62)"/>
    <path d="M30 20 L37 35 L33 35 L41 49 L19 49 L27 35 L23 35 Z" fill="rgba(255,255,255,.34)"/>
    <path d="M90 22 L97 36 L93 36 L100 49 L80 49 L87 36 L83 36 Z" fill="rgba(255,255,255,.3)"/>
    <path d="M8 54 L112 54" stroke="rgba(255,255,255,.3)" stroke-width="2" stroke-linecap="round"/>
  </svg>`;

const QUILL_ART = `
  <svg class="wave quill" viewBox="0 0 120 64" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <path d="M84 10 C 66 16, 52 30, 44 48 C 58 44, 72 34, 80 22 C 78 32, 70 42, 58 50 L 84 10 Z" fill="rgba(255,255,255,.66)"/>
    <path d="M44 48 L 30 56" stroke="rgba(255,255,255,.6)" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M12 58 L 96 58" stroke="rgba(255,255,255,.26)" stroke-width="2" stroke-linecap="round"/>
    <circle cx="100" cy="16" r="6" fill="rgba(255,201,77,.8)"/>
  </svg>`;

const LAMP_ART = `
  <svg class="wave lamp" viewBox="0 0 120 64" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <path d="M60 6 L60 14" stroke="rgba(255,255,255,.5)" stroke-width="2" stroke-linecap="round"/>
    <path d="M40 34 L60 14 L80 34 Z" fill="rgba(255,255,255,.62)"/>
    <circle cx="60" cy="40" r="5" fill="rgba(255,201,77,.9)"/>
    <path d="M46 56 L74 56" stroke="rgba(255,255,255,.3)" stroke-width="2" stroke-linecap="round"/>
    <path d="M28 60 Q 60 46 92 60" fill="none" stroke="rgba(255,201,77,.28)" stroke-width="2"/>
  </svg>`;

// одна обложка (книга, композиция или курс)
// все материалы одной лентой: пьесы, книга, курс
function railItems() {
  const out = data.piano.pieces.filter(p => !p.archived)
    .map(p => ({ track: "piano", pieceId: p.id, piece: p }));
  for (const b of data.book.books.filter(b => !b.archived)) out.push({ track: "book", bookId: b.id, book: b });
  if (course().lessons.length) out.push({ track: "pastel" });
  return out;
}
const hasMaterials = () => railItems().length > 0;

// активным может остаться трек, материалов которого у профиля нет — переставляем на первый доступный
function normalizeActive() {
  const items = railItems();
  if (!items.length) return;
  const ok = items.some(i => i.track === data.active
    && (i.track !== "piano" || i.pieceId === data.piano.activePiece)
    && (i.track !== "book" || i.bookId === data.book.activeBook));
  if (ok) return;
  const first = items[0];
  data.active = first.track;
  if (first.pieceId) data.piano.activePiece = first.pieceId;
  if (first.bookId) data.book.activeBook = first.bookId;
}

function activeRailIndex(items) {
  const i = items.findIndex(it => it.track === data.active &&
    (it.track !== "piano" || it.pieceId === data.piano.activePiece) &&
    (it.track !== "book" || it.bookId === data.book.activeBook));
  return Math.max(0, i);
}

// обложка любого материала — не зависит от активного трека
function coverOf(item) {
  if (item.track === "book") {
    const b = item.book || book();
    if (b.cover) return `
      <div class="cover photo" style="aspect-ratio:${esc(b.ratio || "3 / 4.4")}">
        <img src="${esc(b.cover)}" alt="${esc(b.title)}" width="465" height="720" decoding="async" fetchpriority="high">
      </div>`;
    return `
      <div class="cover book ${esc(b.tone || "sea")}">
        <div><div class="cv-author">${esc(b.author || "")}</div></div>
        ${b.art === "wave" ? SEA_ART : b.art === "pine" ? PINE_ART : b.art === "quill" ? QUILL_ART : b.art === "lamp" ? LAMP_ART : `<div class="cv-mark">🦔</div>`}
        <div>
          <div class="cv-title">${esc(b.title)}</div>
          <div class="cv-sub">${esc(b.volume || "")}</div>
        </div>
      </div>`;
  }
  if (item.track === "pastel") {
    const c = data.pastel.course;
    return `
      <div class="cover pastel">
        <div><div class="cv-author">${esc(c.author || "")}</div></div>
        <div class="smears"><i></i><i></i><i></i><i></i></div>
        <div>
          <div class="cv-title">${esc(c.name)}</div>
          <div class="cv-sub">${c.lessons.length} уроков</div>
        </div>
      </div>`;
  }
  const p = item.piece;
  if (p.cover) return `
    <div class="cover photo" style="aspect-ratio:${esc(p.ratio || "3 / 4.4")}">
      <img src="${esc(p.cover)}" alt="${esc(p.name)}" width="509" height="720" decoding="async" fetchpriority="high">
    </div>`;
  return `
    <div class="cover piano ${esc(p.tone || "violet")}">
      <div><div class="cv-author">${esc(p.author || "")}</div></div>
      ${p.art === "wave" ? WAVE_ART : KEYS_ART}
      <div>
        <div class="cv-title">${esc(p.name)}</div>
        <div class="cv-sub">${p.bars} тактов</div>
      </div>
    </div>`;
}

/* ── Подложка под цвет обложки ── */
// два пятна света на каждый тон: то же семейство цветов, что и у обложек
const TONES = {
  violet: ["139, 124, 246", "255, 157, 63"],
  sea:    ["86, 160, 214", "120, 214, 196"],
  snow:   ["132, 156, 204", "170, 190, 224"],
  night:  ["108, 132, 186", "196, 168, 120"],
  wine:   ["214, 96, 116", "255, 170, 90"],
  forest: ["86, 190, 140", "72, 150, 186"],
  pastel: ["230, 140, 180", "255, 201, 77"]
};

function toneOf(item) {
  if (!item) return "violet";
  if (item.track === "pastel") return "pastel";
  if (item.track === "book") return (item.book || book()).tone || "sea";
  return (item.piece || piece()).tone || "violet";
}

let bgLayer = 0;
/* Цвет подложки берём из самой обложки: раскладываем картинку на 24×24,
   считаем корзины по цвету и выбираем самую заметную — частую и живую. */
const coverTones = new Map();

// подчищаем тона, посчитанные прошлой версией алгоритма
try { Object.keys(localStorage).forEach(k => { if (k.startsWith("keiko-tone-")) localStorage.removeItem(k); }); } catch {}

function readCoverTones(url) {
  if (coverTones.has(url)) return coverTones.get(url);
  coverTones.set(url, null);                       // чтобы не считать дважды

  try { const saved = JSON.parse(localStorage.getItem("keiko-tone2-" + url) || "null");
    if (saved) { coverTones.set(url, saved); return saved; } } catch {}

  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    try {
      const N = 24;
      const cv = document.createElement("canvas");
      cv.width = cv.height = N;
      const ctx = cv.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, N, N);
      const d = ctx.getImageData(0, 0, N, N).data;

      const box = new Map();
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
        const cur = box.get(key) || { n: 0, r: 0, g: 0, b: 0 };
        cur.n++; cur.r += r; cur.g += g; cur.b += b;
        box.set(key, cur);
      }

      // оцениваем каждую корзину: частота, насыщенность и «не слишком тёмная»
      const score = (c) => {
        const r = c.r / c.n, g = c.g / c.n, b = c.b / c.n;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        const sat = mx ? (mx - mn) / mx : 0;
        const lum = (mx + mn) / 510;
        const fit = lum > 0.12 && lum < 0.92 ? 1 : 0.25;
        return { s: c.n * (0.25 + sat * 1.6) * fit, r, g, b, sat, lum };
      };
      const ranked = [...box.values()].map(score).sort((a, b) => b.s - a.s);
      if (!ranked.length) return;

      // от обложки берём оттенок, а яркость и живость задаём сами:
      // тёмно-фиолетовый корешок сам по себе на тёмном фоне не виден
      const toHsl = (r, g, b) => {
        r /= 255; g /= 255; b /= 255;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
        let h = 0;
        if (d) h = 60 * (mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4);
        const l = (mx + mn) / 2;
        return { h, s: d ? d / (1 - Math.abs(2 * l - 1)) : 0, l };
      };
      const toRgb = (h, s, l) => {
        const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
        const v = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
                : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
        return v.map(n => Math.round((n + m) * 255)).join(", ");
      };
      const glow = (c, l) => {
        const t = toHsl(c.r, c.g, c.b);
        const s = t.s < 0.07 ? 0.06 : Math.min(0.72, Math.max(0.4, t.s));
        return toRgb(t.h, s, l);
      };

      const main = ranked[0];
      const hue = (c) => toHsl(c.r, c.g, c.b).h;
      const dh = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
      // второй цвет — заметно другого оттенка, иначе просто светлее первого
      const other = ranked.find(c => c.s > main.s * 0.12 && dh(hue(c), hue(main)) > 35);
      const pair = [glow(main, 0.58), other ? glow(other, 0.62) : glow(main, 0.72)];

      coverTones.set(url, pair);
      try { localStorage.setItem("keiko-tone2-" + url, JSON.stringify(pair)); } catch {}
      paintBackdrop(lastPainted);                  // перекрашиваем, когда цвет посчитан
    } catch {}
  };
  img.src = url;
  return null;
}

let lastPainted = null;

function paintBackdrop(item) {
  const layers = document.querySelectorAll(".bgfx i");
  if (layers.length < 2 || !item) return;
  lastPainted = item;

  const src = item.track === "book" ? (item.book || book()) : item.track === "piano" ? (item.piece || piece()) : null;
  const fromCover = src && src.cover ? readCoverTones(src.cover) : null;
  const [c1, c2] = fromCover || TONES[toneOf(item)] || TONES.violet;
  const css =
    `radial-gradient(980px 560px at 78% -12%, rgba(${c1}, 0.32), transparent 62%),` +
    `radial-gradient(760px 460px at -6% 4%, rgba(${c2}, 0.18), transparent 58%),` +
    `radial-gradient(760px 420px at 52% 110%, rgba(${c1}, 0.16), transparent 60%)`;

  if (layers[bgLayer].style.backgroundImage === css) return;   // тот же тон — не трогаем
  const next = layers[bgLayer ^ 1];
  next.style.backgroundImage = css;
  next.classList.add("on");
  layers[bgLayer].classList.remove("on");
  bgLayer ^= 1;
}

const RAIL_COPIES = 5;   // копии ленты для бесшовного цикла
const RAIL_MID = 2;      // рабочая копия — центральная

// лента бесконечная: рендерим несколько копий и незаметно возвращаемся в середину
function coverRailHTML() {
  const items = railItems();
  const n = items.length;
  const idx = activeRailIndex(items);
  let html = "";
  for (let copy = 0; copy < RAIL_COPIES; copy++) {
    items.forEach((it, i) => {
      const on = copy === RAIL_MID && i === idx;
      html += `<div class="slot ${on ? "on" : ""}" data-i="${i}" data-pos="${copy * n + i}">${coverOf(it)}</div>`;
    });
  }
  return `<div class="rail" id="rail">${html}</div>`;
}

function ringHTML(pct) {
  const r = 52, c = 2 * Math.PI * r;
  const on = c * Math.min(1, pct / 100);
  return `
    <div class="ring-wrap">
      <svg class="ring" width="128" height="128" viewBox="0 0 128 128">
        <circle class="bg" cx="64" cy="64" r="${r}"></circle>
        ${pct > 0 ? `<circle class="fg" cx="64" cy="64" r="${r}" stroke-dasharray="${on.toFixed(1)} ${c.toFixed(1)}"></circle>` : ""}
      </svg>
      <div class="ring-txt"><b>${Math.round(pct)}%</b></div>
    </div>`;
}

/* Подпись под названием ломается по разделителю «·», а не посреди фразы:
   «осталось 464 страницы» уходит на новую строку целиком */
const subLine = (...parts) => parts.filter(Boolean)
  .map((p, i, a) => `<span class="sub-part">${p}${i < a.length - 1 ? " ·" : ""}</span>`)
  .join(" ");

function heroSub(s) {
  if (isBook()) return subLine(esc(s.chapter.name), `осталось ${stranic(s.pages - s.page)}`);
  if (isPastel()) return subLine(`${s.done} из ${s.lessons} уроков`, `${s.minutes} мин пройдено`);
  return subLine(`𝄞 ${Math.round(s.pctR)}%`, `𝄢 ${Math.round(s.pctL)}%`);
}

function renderHome() {
  if (!hasMaterials()) { renderEmpty("Здесь появятся материалы", "Пока не добавлено ни одного: ни пьесы, ни книги, ни курса."); return; }
  const s = curStats();
  const g = goalProgress();
  const st = s.streakAll;
  const doneToday = !!entryFor(todayStr());
  const ach = achState();
  const open = ach.filter(a => a.done).length;

  const sub = heroSub(s);

  const freeze = activeFreeze();
  const nudge = freeze
    ? `🌴 Пауза до <b>${fmtRange(freeze.to, freeze.to)}</b> — серия сохранится`
    : "";

  $("#view").innerHTML = `
    <div class="hero">
      ${coverRailHTML()}
      ${ringHTML(s.pct)}
      <div class="hero-title">
        <h2>${isBook() ? esc(book().title) : isPastel() ? esc(course().name) : esc(piece().name)}</h2>
        <p>${sub}</p>
        ${paceHTML()}
      </div>
      <button class="cta ${!gistReady() ? "locked" : doneToday ? "done" : ""}" id="ctaBtn" type="button">
        ${!gistReady()
          ? "🔒 Подключить синхронизацию"
          : doneToday
            ? `<span class="cta-ok">${T("ctaDone")}</span><span class="cta-add">${T("ctaAdd")}</span>`
            : (isBook() ? T("ctaBook") : isPastel() ? T("ctaPastel") : T("ctaPiano"))}
      </button>
      <div class="nudge">${nudge}</div>
      <div class="shake-hint" id="shakeHint"></div>
    </div>`;

  $("#ctaBtn").addEventListener("click", () => {
    if (!gistReady()) { openSettingsSheet(); return; }
    selectedDate = todayStr();
    openLogSheet();
  });

  paintBackdrop(railItems()[activeRailIndex(railItems())]);
  setupRail();
  renderShakeHint();
}

/* Карусель: центрируем активную обложку и слушаем свайп */
let railApi = null;   // доступ к прокрутке ленты извне (сегмент, кубик)

function setupRail() {
  const rail = $("#rail");
  if (!rail) return;
  const slots = [...rail.querySelectorAll(".slot")];
  if (!slots.length) return;

  const items = railItems();
  const n = items.length;

  const pad = Math.max(0, (rail.clientWidth - slots[0].offsetWidth) / 2);
  rail.style.paddingLeft = pad + "px";
  rail.style.paddingRight = pad + "px";

  const centerOfSlot = (el) => {
    const r = el.getBoundingClientRect(), rr = rail.getBoundingClientRect();
    return r.left - rr.left + rail.scrollLeft + r.width / 2;
  };
  const targetFor = (pos) => centerOfSlot(slots[pos]) - rail.clientWidth / 2;

  const nearestPos = () => {
    const mid = rail.scrollLeft + rail.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    slots.forEach((el, i) => {
      const d = Math.abs(centerOfSlot(el) - mid);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  };

  // переносимся в среднюю копию, только когда подошли к краю ленты:
  // каждый лишний перенос сдвигает scrollLeft и сбивает доводку свайпа
  const normalize = (pos) => {
    if (pos >= n && pos < slots.length - n) return pos;
    const target = RAIL_MID * n + ((pos % n) + n) % n;
    if (target !== pos) {
      const delta = targetFor(target) - targetFor(pos);
      const snap = rail.style.scrollSnapType;
      rail.style.scrollSnapType = "none";
      rail.scrollLeft += delta;
      rail.style.scrollSnapType = snap;
    }
    return target;
  };

  let spinning = false;
  let touching = false;   // палец на ленте — доводку не начинаем

  const settle = () => {
    if (spinning || touching) return;
    const pos = normalize(nearestPos());
    slots.forEach((el, i) => el.classList.toggle("on", i === pos));
    paintBackdrop(items[pos % n]);
    setActiveMaterial(items[pos % n]);
    releaseRail();
  };

  // ждём настоящей остановки: пока позиция меняется, ничего не трогаем
  let idleTimer = null;
  const settleWhenIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (spinning) return;
      const before = rail.scrollLeft;
      setTimeout(() => {
        if (spinning) return;
        if (touching || Math.abs(rail.scrollLeft - before) > 0.5) { settleWhenIdle(); return; }
        settle();
      }, 90);
    }, 110);
  };

  // программная центровка сразу применяет материал — не ждём событий скролла
  const centerOn = (pos, smooth) => {
    if (!slots[pos]) return;
    clearTimeout(idleTimer);
    rail.scrollTo({ left: targetFor(pos), behavior: smooth ? "smooth" : "auto" });
    slots.forEach((el, i) => el.classList.toggle("on", i === pos));
    paintBackdrop(items[pos % n]);
    setActiveMaterial(items[pos % n]);
  };

  // кубик: лента разгоняется, прокручивает несколько обложек и плавно тормозит
  const spinTo = (baseIdx, done) => {
    if (spinning) return;
    const cur = nearestPos();
    // цель — на пару оборотов вперёд, чтобы обложки успели промелькнуть
    let pos = baseIdx;
    while (pos < cur + n * 2) pos += n;
    while (pos >= slots.length) pos -= n;
    if (pos <= cur) pos += n;

    const from = rail.scrollLeft;
    const to = targetFor(pos);
    if (Math.abs(to - from) < 2) { settle(); done && done(); return; }

    spinning = true;
    clearTimeout(idleTimer);
    rail.style.scrollSnapType = "none";
    rail.style.scrollBehavior = "auto";

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(guard);
      rail.scrollLeft = to;                    // точная доводка без рывка
      rail.style.scrollSnapType = "x mandatory";
      rail.style.scrollBehavior = "";
      spinning = false;
      const fixed = normalize(pos);
      slots.forEach((el, i) => el.classList.toggle("on", i === fixed));
      setActiveMaterial(items[fixed % n]);
      releaseRail();
      done && done();
    };

    // страховка: если кадры не идут (вкладка в фоне), доводим результат сами
    const guard = setTimeout(finish, 3600);

    const t0 = performance.now(), dur = 2600;
    const ease = k => 1 - Math.pow(1 - k, 5);   // долгий разгон и мягкое торможение
    const step = (now) => {
      if (finished) return;
      const k = Math.min(1, (now - t0) / dur);
      rail.scrollLeft = from + (to - from) * ease(k);
      if (k < 1) requestAnimationFrame(step); else finish();
    };
    requestAnimationFrame(step);
  };

  railApi = {
    centerOn: (baseIdx, smooth) => centerOn(baseIdx + RAIL_MID * n, smooth),
    spinTo,
    indexOfTrack: (track) => items.findIndex(it => it.track === track),
    indexOf: (track, pieceId) => items.findIndex(it => it.track === track && (!pieceId || it.pieceId === pieceId))
  };

  centerOn(activeRailIndex(items) + RAIL_MID * n, false);
  if (n < 2) return;

  // фон догоняет обложку прямо в движении, но не чаще кадра и только при смене обложки —
  // иначе кроссфейд перезапускается десятки раз за свайп и экран мерцает
  let bgIdx = -1, bgTick = false, bgFallback = null;
  const followBackdrop = () => {
    if (bgTick) return;
    bgTick = true;
    const run = () => {
      if (!bgTick) return;
      bgTick = false;
      clearTimeout(bgFallback);
      const i = nearestPos() % n;
      if (i === bgIdx) return;
      bgIdx = i;
      paintBackdrop(items[i]);
    };
    requestAnimationFrame(run);
    bgFallback = setTimeout(run, 140);   // если кадры не идут (вкладка в фоне) — не залипаем
  };

  rail.addEventListener("touchstart", () => { touching = true; markRailBusy(); }, { passive: true });
  ["touchend", "touchcancel"].forEach(ev =>
    rail.addEventListener(ev, () => { touching = false; settleWhenIdle(); }, { passive: true }));

  rail.addEventListener("scroll", () => {
    if (!spinning) markRailBusy();
    followBackdrop();
    settleWhenIdle();
  }, { passive: true });
  if ("onscrollend" in rail) rail.addEventListener("scrollend", () => { if (!spinning) settle(); });

  slots.forEach((el, i) => el.addEventListener("click", () => {
    if (!el.classList.contains("on")) centerOn(i, true);
  }));
}

// смена материала без перерисовки ленты
function setActiveMaterial(item) {
  if (!item) return;
  const same = data.active === item.track &&
    (item.track !== "piano" || data.piano.activePiece === item.pieceId) &&
    (item.track !== "book" || data.book.activeBook === item.bookId);
  if (same) return;

  data.active = item.track;
  if (item.pieceId) data.piano.activePiece = item.pieceId;
  if (item.bookId) data.book.activeBook = item.bookId;
  paintBackdrop(item);
  pending = []; pickLessons = [];
  selectedDate = todayStr();
  syncPickers();
  saveData();
  schedulePush();
  updateHeroInfo();
  updateAchBadge();   // таббар целиком не перерисовываем: он бы мигал на каждом свайпе
}

// счётчик открытых наград в таббаре — меняем только цифру
function updateAchBadge() {
  const b = document.querySelector('#tabbar button[data-tab="ach"]');
  if (!b) return;
  const open = achMaterials().reduce((n, m) => n + m.open, 0);
  const txt = [...b.childNodes].find(x => x.nodeType === 3);
  if (txt) txt.nodeValue = `${T("tabAch")} ${open}`;
}

function updateHeroInfo() {
  const s = curStats();
  const doneToday = !!entryFor(todayStr());

  // содержимое кольца меняем внутри элемента: пересоздание запускало анимацию появления заново
  const ring = $(".ring-wrap");
  if (ring) {
    const tmp = document.createElement("div");
    tmp.innerHTML = ringHTML(s.pct);
    ring.innerHTML = tmp.firstElementChild.innerHTML;
  }

  const title = $(".hero-title");
  if (title) title.innerHTML = `
    <h2>${isBook() ? esc(book().title) : isPastel() ? esc(course().name) : esc(piece().name)}</h2>
    <p>${heroSub(s)}</p>
    ${paceHTML()}`;

  const cta = $("#ctaBtn");
  if (cta) {
    cta.classList.toggle("locked", !gistReady());
    cta.classList.toggle("done", gistReady() && doneToday);
    cta.innerHTML = !gistReady()
      ? "🔒 Подключить синхронизацию"
      : doneToday
        ? `<span class="cta-ok">${T("ctaDone")}</span><span class="cta-add">${T("ctaAdd")}</span>`
        : (isBook() ? T("ctaBook") : isPastel() ? T("ctaPastel") : T("ctaPiano"));
  }

  const nudge = $(".nudge");
  if (nudge) {
    const freeze = activeFreeze();
    nudge.innerHTML = freeze
      ? `🌴 Пауза до <b>${fmtRange(freeze.to, freeze.to)}</b> — серия сохранится`
      : "";
  }
}
function barMap(arr, cls) {
  const bars = piece().bars;
  let cells = "";
  for (let b = 1; b <= bars; b++) {
    const n = arr[b] || 0;
    const lvl = n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : 3;
    cells += `<i class="bar l${lvl} ${cls}${b % 10 === 0 && b !== bars ? " tick" : ""}" title="Такт ${b}: ${n} ${plural(n, "проход", "прохода", "проходов")}"></i>`;
  }
  return `<div class="bar-strip" style="--n:${bars}">${cells}</div>`;
}

// активность по дням недели: сколько занятий в каждый день (все хобби)
function weekDots() {
  const monday = mondayOf(new Date());
  const all = [...data.piano.entries, ...data.book.entries, ...data.pastel.entries].filter(e => !e.deleted);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(d.getDate() + i);
    const ds = dateStr(d);
    const cnt = new Set(all.filter(e => e.date === ds).map(e => e.date + (e.pieceId || e.bookId || e.courseId || ""))).size;
    out.push({ ds, dow: DOW[i], count: cnt, future: ds > todayStr(), today: ds === todayStr(), frozen: isFrozen(ds) });
  }
  return out;
}

// всё сделанное за отрезок дат: дни, такты, страницы, уроки
function rangeStats(from, to) {
  const inRange = e => !e.deleted && e.date >= from && e.date <= to;

  const piano = data.piano.entries.filter(inRange);
  let bars = 0;
  for (const e of piano) for (const sp of e.spans || []) bars += sp.to - sp.from + 1;

  const bookList = data.book.entries.filter(inRange);
  const pages = pagesRead(from, to);

  const pastel = data.pastel.entries.filter(inRange);
  let lessons = 0;
  for (const e of pastel) lessons += (e.lessons || []).length;

  const days = new Set([...piano, ...bookList, ...pastel].map(e => e.date)).size;
  const tracks = new Set([
    ...(piano.length ? ["piano"] : []),
    ...(bookList.length ? ["book"] : []),
    ...(pastel.length ? ["pastel"] : [])
  ]);
  return { days, bars, pages, lessons, tracks, entries: piano.length + bookList.length + pastel.length };
}

/* ── Сколько ещё занятий до конца материала ──
   Считаем по последним сессиям: сколько единиц (тактов, страниц, уроков)
   прибавлялось за раз, и делим на остаток. */
function paceForecast() {
  const list = entries().slice().sort((a, b) => a.date < b.date ? -1 : 1);
  if (!list.length) return null;

  // прогресс в единицах на конец каждой сессии
  let marks = [], unit = "", total = 0;

  if (isBook()) {
    const b = book();
    total = b.pages;
    unit = "page";
    let page = b.startPage || 0;
    for (const e of list) { page = Math.max(page, e.page || 0); marks.push(page); }
    marks.unshift(b.startPage || 0);
  } else if (isPastel()) {
    total = course().lessons.length;
    unit = "lesson";
    const seen = new Set();
    marks.push(0);
    for (const e of list) { for (const i of e.lessons || []) seen.add(i); marks.push(seen.size); }
  } else {
    const bars = piece().bars;
    total = bars * 2;                       // каждая рука отдельно
    unit = "bar";
    const r = new Set(), l = new Set();
    marks.push(0);
    for (const e of list) {
      for (const sp of e.spans || []) {
        const set = sp.hand === "left" ? l : r;
        for (let i = Math.max(1, sp.from); i <= Math.min(bars, sp.to); i++) set.add(i);
      }
      marks.push(r.size + l.size);
    }
  }

  const done = marks[marks.length - 1];
  const left = Math.max(0, total - done);
  if (!left) return { left: 0, sessions: 0, pace: 0, unit, done: true };

  // средний прирост за последние сессии (берём до пяти, нули не считаем)
  const gains = [];
  for (let i = marks.length - 1; i > 0 && gains.length < 8; i--) {
    const g = marks[i] - marks[i - 1];
    if (g > 0) gains.push(g);
  }
  if (!gains.length) return null;

  // медиана устойчивее среднего: один марафон на полкниги не должен задирать прогноз
  const sorted = gains.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const pace = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { left, pace, sessions: Math.max(1, Math.ceil(left / pace)), unit, done: false };
}

/* Чем дальше срок, тем грубее формулировка: точная дата через два месяца —
   ложная точность, погрешность там всё равно в неделях. */
const MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"];

function humanWhen(d, days) {
  const gen = MONTHS_GEN[d.getMonth()];
  const year = d.getFullYear() !== new Date().getFullYear() ? " " + d.getFullYear() : "";

  if (days <= 7) return "закончишь на этой неделе";
  if (days <= 24) return `примерно к ${d.getDate()} ${gen}`;
  const part = d.getDate() <= 10 ? "началу" : d.getDate() <= 20 ? "середине" : "концу";
  return `примерно к ${part} ${gen}${year}`;
}

// короткая строка прогноза: «≈ 12 занятий · примерно до 5 октября»
function paceHTML() {
  const f = paceForecast();
  if (!f) return "";
  if (f.done) return `<span class="pace">Материал пройден 🎉</span>`;

  // прикидка от спокойного ритма: занимаешься через день — вот и срок.
  // Пропустил — назавтра дата сдвинется, и это нормально
  const days = f.sessions * 2;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `<span class="pace">${subLine(
    `≈ ${f.sessions} ${plural(f.sessions, "занятие", "занятия", "занятий")}`,
    `в таком темпе ${humanWhen(d, days)}`
  )}</span>`;
}

// границы текущего периода — вся неделя или весь месяц
function periodRange() {
  const d = new Date();
  if (period === "month") {
    return {
      from: dateStr(new Date(d.getFullYear(), d.getMonth(), 1)),
      to: dateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0))
    };
  }
  const monday = mondayOf(d);
  const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
  return { from: dateStr(monday), to: dateStr(sunday) };
}

// точки графика: вся текущая неделя или весь месяц, включая дни впереди
function periodSeries() {
  const out = [];
  const today = todayStr();

  if (period === "month") {
    const d = new Date();
    const total = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= total; i++) {
      const ds = dateStr(new Date(d.getFullYear(), d.getMonth(), i));
      out.push({ ds, label: (i === 1 || i % 5 === 0) ? String(i) : "", value: rangeStats(ds, ds).entries,
        today: ds === today, frozen: isFrozen(ds), future: ds > today });
    }
    return out;
  }

  const monday = mondayOf(new Date());
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(d.getDate() + i);
    const ds = dateStr(d);
    out.push({ ds, label: DOW[i], value: rangeStats(ds, ds).entries,
      today: ds === today, frozen: isFrozen(ds), future: ds > today });
  }
  return out;
}

// плавная линия активности за выбранный период
function lineChartHTML(points) {
  const W = 320, H = 118, padX = 14, top = 16, bottom = 84;
  const max = Math.max(1, ...points.map(p => p.value));
  const n = points.length;
  const pts = points.map((p, i) => ({
    x: padX + (n > 1 ? i * (W - padX * 2) / (n - 1) : (W - padX * 2) / 2),
    y: bottom - (p.value / max) * (bottom - top),
    ...p
  }));

  let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i], p1 = pts[i + 1];
    const cx = (p0.x + p1.x) / 2;
    path += ` C ${cx.toFixed(1)} ${p0.y.toFixed(1)}, ${cx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  const area = `${path} L ${pts[pts.length - 1].x.toFixed(1)} ${bottom + 2} L ${pts[0].x.toFixed(1)} ${bottom + 2} Z`;
  const dotEvery = n > 14 ? Math.ceil(n / 14) : 1;

  return `
    <div class="wline">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--gold)" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="var(--gold)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <line x1="${padX}" y1="${bottom + 2}" x2="${W - padX}" y2="${bottom + 2}" stroke="rgba(255,255,255,0.08)"/>
        <path d="${area}" fill="url(#lineFill)"/>
        <path d="${path}" fill="none" stroke="var(--gold)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${pts.map((p, i) => (i % dotEvery === 0 || p.today) ? `
          <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.today ? 5 : 3.5}"
            fill="${p.value ? "var(--gold)" : "var(--bg)"}" stroke="${p.today ? "var(--ink)" : "var(--gold)"}" stroke-width="${p.today ? 2 : 1.4}"
            opacity="${p.future ? 0.35 : 1}"/>` : "").join("")}
      </svg>
      <div class="wl-days" style="grid-template-columns: repeat(${n}, 1fr)">
        ${pts.map(p => `<span class="${p.today ? "now" : ""} ${p.frozen ? "frz" : ""}">${esc(p.label || "")}</span>`).join("")}
      </div>
    </div>`;
}

// шапка «Прогресс»: неделя или месяц целиком
function summaryHTML() {
  const r = periodRange();
  const st = rangeStats(r.from, r.to);
  const g = goalProgress();
  const now = new Date();

  let ringVal, ringMax, cap, sub, hint;
  if (period === "month") {
    const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const left = total - now.getDate();
    const weeks = Math.round(total / 7);           // недель в месяце
    const monthGoal = (data.weekGoal || 4) * weeks; // цель месяца = недельная × недели
    ringVal = st.days; ringMax = monthGoal;
    cap = new Intl.DateTimeFormat("ru", { month: "long" }).format(now);
    sub = `из ${monthGoal} ${plural(monthGoal, "дня", "дней", "дней")} цели`;
    hint = ringVal >= monthGoal
      ? `Цель месяца взята! ${data.weekGoal} в неделю × ${weeks} ${plural(weeks, "неделя", "недели", "недель")}`
      : `Цель месяца: ${data.weekGoal} в неделю × ${weeks} ${plural(weeks, "неделя", "недели", "недель")} · впереди ${left} ${plural(left, "день", "дня", "дней")}`;
  } else {
    ringVal = g.days; ringMax = g.goal;
    cap = "Эта неделя";
    sub = `из ${g.goal} ${plural(g.goal, "дня", "дней", "дней")} цели`;
    hint = g.done
      ? "Цель недели закрыта — всё сверху в удовольствие"
      : `До цели ещё ${g.left} ${plural(g.left, "день", "дня", "дней")}`;
  }

  const R = 78, C = 2 * Math.PI * R;
  const on = C * Math.min(1, ringMax ? ringVal / ringMax : 0);
  const best = bestStreakAll();

  return `
    <div class="periods">
      ${[["week", "Неделя"], ["month", "Месяц"]].map(([k, t]) =>
        `<button class="pbtn ${period === k ? "on" : ""}" data-p="${k}" type="button">${t}</button>`).join("")}
    </div>

    <div class="summary">
      <div class="sum-ring">
        <svg viewBox="0 0 190 190">
          <circle class="bg" cx="95" cy="95" r="${R}"></circle>
          ${ringVal ? `<circle class="fg" cx="95" cy="95" r="${R}" stroke-dasharray="${on.toFixed(1)} ${C.toFixed(1)}"></circle>` : ""}
        </svg>
        <div class="sum-txt">
          <span class="sum-cap">${esc(cap)}</span>
          <b>${ringVal}</b>
          <span class="sum-sub">${esc(sub)}</span>
        </div>
      </div>

      <div class="sum-chips">
        <div class="sc ${best ? "hot" : ""}"><b>🔥 ${best}</b><span>${T("streak")}</span></div>
        <div class="sc"><b>${st.days}</b><span>${plural(st.days, "день", "дня", "дней")}</span></div>
        <div class="sc"><b>${st.bars}</b><span>${plural(st.bars, "такт", "такта", "тактов")}</span></div>
        <div class="sc"><b>${st.pages}</b><span>страниц</span></div>
        <div class="sc"><b>${st.lessons}</b><span>${plural(st.lessons, "урок", "урока", "уроков")}</span></div>
      </div>

      ${lineChartHTML(periodSeries())}
      <div class="period-hint">${esc(hint)}</div>
    </div>`;
}

// серия одна на всё приложение: важно заниматься каждый день, а чем — не важно
const bestStreakAll = () => streakAll();

function renderEmpty(title, text) {
  $("#view").innerHTML = `
    <div class="empty-state">
      <div class="es-mark">稽古</div>
      <h2>${esc(title)}</h2>
      <p>${esc(text)}</p>
    </div>`;
}

function renderProgress() {
  if (!hasMaterials()) { renderEmpty("Пока нечего показывать", "Как появятся материалы, здесь будет прогресс по неделям и месяцам."); return; }
  $("#view").innerHTML = `
    <div class="panel sum-panel">
      ${summaryHTML()}
    </div>

    <div class="panel">
      <div class="cal-head">
        <div class="cal-title" id="calTitle"></div>
        <div class="cal-nav">
          <button id="calPrev" type="button">‹</button>
          <button id="calNext" type="button">›</button>
        </div>
      </div>
      <div class="cal-grid" id="calGrid"></div>
      <div class="cal-legend">
        <span><i class="dot p"></i> пианино</span>
        <span><i class="dot b"></i> чтение</span>
        <span><i class="dot c"></i> пастель</span>
        <span><i class="dot f"></i> пауза</span>
      </div>
    </div>

    <div class="panel">
      <div class="cal-head">
        <h3 style="margin:0">День</h3>
        <div class="day-nav">
          <button id="dayPrev" type="button">‹</button>
          <button class="cur" id="dayCur" type="button"></button>
          <button id="dayNext" type="button">›</button>
        </div>
      </div>
      <div id="dayBox"></div>
    </div>`;

  renderCalendar();
  renderDayBox();

  document.querySelectorAll(".pbtn").forEach(b =>
    b.addEventListener("click", () => {
      period = b.dataset.p;
      cfg.period = period; saveCfg();
      renderProgress();
    }));

  $("#calPrev").addEventListener("click", () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); });
  $("#calNext").addEventListener("click", () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); });
  $("#dayPrev").addEventListener("click", () => shiftDay(-1));
  $("#dayNext").addEventListener("click", () => shiftDay(1));
  $("#dayCur").addEventListener("click", () => goToDate(todayStr()));
}

// все записи всех хобби за дату — календарь и день теперь общие
function allEntriesOn(ds) {
  const out = [];
  for (const e of data.piano.entries.filter(e => !e.deleted && e.date === ds)) {
    const p = data.piano.pieces.find(x => x.id === (e.pieceId || "bwv853"));
    out.push({ track: "piano", icon: "🎹", title: p ? p.name : "Пианино", entry: e,
      what: (e.spans || []).length ? e.spans.map(spanText).join(" · ") : "занимался" });
  }
  for (const e of data.book.entries.filter(e => !e.deleted && e.date === ds)) {
    out.push({ track: "book", icon: "📖", title: book().title, entry: e,
      what: e.page ? `до ${e.page}-й стр.` : "читал" });
  }
  for (const e of data.pastel.entries.filter(e => !e.deleted && e.date === ds)) {
    out.push({ track: "pastel", icon: "🎨", title: course().name, entry: e,
      what: (e.lessons || []).length ? `урок${e.lessons.length > 1 ? "и" : ""} ${e.lessons.map(i => i + 1).join(", ")}` : "занимался" });
  }
  return out;
}

function historyHTML() {
  const hist = weeklyHistory(12);
  const max = Math.max(1, ...hist.map(h => h.days));
  const fmt = new Intl.DateTimeFormat("ru", { day: "numeric", month: "short" });
  const total = hist.reduce((a, h) => a + h.days, 0);

  return `
    <div class="hist">
      ${hist.map((h, i) => `
        <div class="hb" title="${fmt.format(fromStr(h.start))}: ${h.days} ${plural(h.days, "день", "дня", "дней")}">
          <i style="height:${Math.round(h.days / max * 100)}%"></i>
          <span>${i % 3 === 0 ? fmt.format(fromStr(h.start)).replace(/\s.*/, "") : ""}</span>
        </div>`).join("")}
    </div>
    <div class="hist-note">За 12 недель — <b>${total}</b> ${plural(total, "занятие", "занятия", "занятий")} по этому материалу</div>`;
}

function renderCalendar() {
  const first = new Date(calYear, calMonth, 1);
  const total = new Date(calYear, calMonth + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const today = todayStr();

  $("#calTitle").textContent = new Intl.DateTimeFormat("ru", { month: "long", year: "numeric" })
    .format(first).replace(" г.", "");

  let html = DOW.map(d => `<div class="dow">${d}</div>`).join("");
  for (let i = 0; i < lead; i++) html += `<div class="day blank"></div>`;

  for (let d = 1; d <= total; d++) {
    const ds = dateStr(new Date(calYear, calMonth, d));
    const on = allEntriesOn(ds);
    const tracks = new Set(on.map(x => x.track));
    let cls = "day";
    if (on.length) cls += " has";
    if (isFrozen(ds)) cls += " frozen";
    if (ds === today) cls += " today";
    if (ds === selectedDate) cls += " sel";
    if (ds > today) cls += " future";
    const dots = [...tracks].map(t => `<i class="dot ${t === "piano" ? "p" : t === "book" ? "b" : "c"}"></i>`).join("");
    html += `<div class="${cls}" data-date="${ds}"><b>${d}</b><span class="dots-row">${dots}</span></div>`;
  }
  $("#calGrid").innerHTML = html;

  document.querySelectorAll(".day[data-date]").forEach(el =>
    el.addEventListener("click", () => goToDate(el.dataset.date)));
}

function renderDayBox() {
  $("#dayCur").textContent = fmtDay(selectedDate);
  $("#dayNext").disabled = selectedDate >= todayStr();

  const list = allEntriesOn(selectedDate);
  const frozen = isFrozen(selectedDate);

  $("#dayBox").innerHTML = `
    ${frozen ? `<div class="day-freeze">🌴 Этот день в паузе — серию не рвёт</div>` : ""}
    ${list.length
      ? `<div class="day-list">${list.map(x => `
          <div class="rec">
            <span class="what">${x.icon} ${x.what}</span>
            <span class="note">${x.entry.note ? esc(x.entry.note) : esc(x.title)}</span>
            <button class="del" data-del="${x.entry.id}" data-track="${x.track}" type="button">✕</button>
          </div>`).join("")}</div>`
      : `<div class="empty">В этот день ничего не отмечено</div>`}
`;

  document.querySelectorAll("[data-del]").forEach(b =>
    b.addEventListener("click", () => {
      const track = b.dataset.track;
      const e = data[track].entries.find(x => x.id === b.dataset.del);
      if (!e) return;
      if (!confirm(`Удалить запись за ${fmtDay(e.date)}?\n\nПрогресс по этому дню пропадёт.`)) return;
      e.deleted = true; e.updatedAt = now();
      saveData(); schedulePush(); render();
      toast("Запись удалена");
    }));

}

// все материалы с их наградами — для входного списка
function achMaterials() {
  if (!hasMaterials()) return [];
  const save = data.active, savePiece = data.piano.activePiece, saveBook = data.book.activeBook;
  const out = [];

  for (const p of data.piano.pieces.filter(x => !x.archived)) {
    data.active = "piano"; data.piano.activePiece = p.id;
    const list = achState(); let f = factsState();
    out.push({ track: "piano", pieceId: p.id, icon: "🎹", title: p.name, sub: p.author,
      cover: p.cover || "", ratio: p.ratio || "",
      open: list.filter(a => a.done).length, total: list.length,
      fOpen: f.filter(x => x.open).length, fTotal: f.length });
  }
  data.active = "book";
  for (const b of data.book.books.filter(x => !x.archived)) {
    data.book.activeBook = b.id;
    const l = achState(), fx = factsState();
    out.push({ track: "book", bookId: b.id, icon: "📖", title: b.title, sub: b.author,
      cover: b.cover || "", ratio: b.ratio || "",
      open: l.filter(a => a.done).length, total: l.length,
      fOpen: fx.filter(x => x.open).length, fTotal: fx.length });
  }

  data.active = "pastel";
  let list = course().lessons.length ? achState() : []; let f = course().lessons.length ? factsState() : [];
  if (course().lessons.length)
    out.push({ track: "pastel", icon: "🎨", title: course().name, sub: course().author,
      cover: course().cover || "", ratio: course().ratio || "",
      open: list.filter(a => a.done).length, total: list.length,
      fOpen: f.filter(x => x.open).length, fTotal: f.length });

  data.active = save; data.piano.activePiece = savePiece; data.book.activeBook = saveBook;
  return out;
}

// выполняет функцию в контексте выбранного материала
function withMaterial(view, fn) {
  const save = data.active, savePiece = data.piano.activePiece, saveBook = data.book.activeBook;
  data.active = view.track;
  if (view.track === "piano" && view.pieceId) data.piano.activePiece = view.pieceId;
  if (view.track === "book" && view.bookId) data.book.activeBook = view.bookId;
  const res = fn();
  data.active = save; data.piano.activePiece = savePiece; data.book.activeBook = saveBook;
  return res;
}

function renderAch() {
  if (!achView) { renderAchList(); return; }
  if (achTab !== "facts") achTab = "ach";
  renderAchMaterial(achView);
}

// входной экран: материалы и сколько наград по каждому
function renderAchList() {
  if (achTop === "shelf") { renderShelfInto(); return; }
  if (!hasMaterials()) { renderEmpty("Достижений пока нет", "Они появятся вместе с первым материалом."); return; }
  const mats = achMaterials();

  $("#view").innerHTML = `
    ${achTopHTML()}
    <div class="mat-list">
      ${mats.map(m => `
        <button class="mat-card" data-track="${m.track}" data-piece="${m.pieceId || ""}" data-book="${m.bookId || ""}" type="button">
          <span class="mc-tile t-${m.track}"><i>${m.icon}</i></span>
          <span class="mc-body">
            <span class="mc-title">${esc(m.title)}</span>
            ${m.sub ? `<span class="mc-sub">${esc(m.sub)}</span>` : ""}
            <span class="mc-bar"><i style="width:${m.total ? m.open / m.total * 100 : 0}%"></i></span>
            <span class="mc-tags"><em>✦ ${m.open}/${m.total}</em><em>💡 ${m.fOpen}/${m.fTotal}</em></span>
          </span>
          <span class="mc-go">›</span>
        </button>`).join("")}
    </div>`;

  bindAchTop();
  document.querySelectorAll(".mat-card").forEach(b =>
    b.addEventListener("click", () => {
      achView = { track: b.dataset.track, pieceId: b.dataset.piece || null, bookId: b.dataset.book || null };
      cfg.achView = achView; saveCfg();
      renderAch();
      $("#view").scrollTop = 0;
    }));
}

// карточки знаний по материалу
function factsBlockHTML(view) {
  const list = withMaterial(view, () => factsState());
  if (!list.length) return `<div class="empty-note">Для этого материала карточек пока нет</div>`;

  const lessons = view.track === "pastel";
  const opened = list.filter(f => f.open).reverse();      // сверху — та, что открылась последней
  const locked = list.filter(f => !f.open);
  const next = locked[0];
  const label = (f) => f.unit === "page"
    ? `со страницы ${f.need}`
    : `после ${f.need} ${lessons ? plural(f.need, "урока", "уроков", "уроков") : plural(f.need, "занятия", "занятий", "занятий")}`;

  return `
    <div class="feed-head">${locked.length
      ? `Впереди ещё ${locked.length} ${plural(locked.length, "карточка", "карточки", "карточек")}${next ? ` · ближайшая ${label(next)}` : ""}`
      : "Все карточки открыты 🎉"}</div>

    ${opened.length ? `<div class="feed">
      ${opened.map(f => `
        <article class="post">
          <div class="post-top"><span class="fi">💡</span><h4>${esc(f.t)}</h4></div>
          <p class="post-text">${esc(f.x)}</p>
          ${(f.more || []).length ? `<div class="post-dig">
            ${f.more.map(m => `<div class="dig-item">${esc(m)}</div>`).join("")}
          </div>` : ""}
        </article>`).join("")}
    </div>` : ""}`;
}

// награды конкретного материала
function renderAchMaterial(view) {
  const ach = withMaterial(view, () => achState());
  const words = withMaterial(view, () => achWords());
  const title = withMaterial(view, () => isBook() ? book().title : isPastel() ? course().name : piece().name);
  const icon = view.track === "book" ? "📖" : view.track === "pastel" ? "🎨" : "🎹";
  const open = ach.filter(a => a.done).length;
  const facts = withMaterial(view, () => factsState());
  let teased = 0;

  $("#view").innerHTML = `
    <button class="back" id="achBack" type="button">‹ Все материалы</button>

    <div class="ach-top">
      <div class="ach-hero">
        <span class="mc-tile big t-${view.track}"><i>${icon}</i></span>
        <span class="ach-hero-txt">
          <b>${esc(title)}</b>
          <em>${achTab === "facts" ? `${facts.filter(f => f.open).length} из ${facts.length} карточек знаний` : `${open} из ${ach.length} достижений открыто`}</em>
        </span>
      </div>
      <div class="ach-progress"><i style="width:${achTab === "facts"
        ? (facts.length ? facts.filter(f => f.open).length / facts.length * 100 : 0)
        : open / ach.length * 100}%"></i></div>
    </div>

    <div class="seg" id="achTabs">
      <button data-at="ach" class="${achTab === "ach" ? "on" : ""}" type="button">${T("segAch")}</button>
      <button data-at="facts" class="${achTab === "facts" ? "on" : ""}" type="button">${T("segFacts")}</button>
    </div>

    ${achTab === "facts" ? factsBlockHTML(view) : `
    <div class="ach-grid">
      ${ach.map(a => {
        if (a.done) return `
          <button class="ach open" data-id="${a.id}" type="button">
            <span class="ic">${a.icon}</span><span class="nm">${esc(a.name)}</span>
          </button>`;
        const tease = !a.secret && teased < 2;
        if (tease) teased++;
        return `
          <button class="ach locked ${tease ? "next" : ""}" data-id="${a.id}" type="button">
            <span class="ic">${tease ? a.icon : "🔒"}</span>
            <span class="nm">${tease ? esc(a.name) : "???"}</span>
          </button>`;
      }).join("")}
    </div>`}`;

  document.querySelectorAll("#achTabs button").forEach(b =>
    b.addEventListener("click", () => {
      achTab = b.dataset.at; cfg.achTab = achTab; saveCfg();
      renderAch();
      $("#view").scrollTop = 0;
    }));

  $("#achBack").addEventListener("click", () => {
    achView = null; cfg.achView = null; saveCfg();
    renderAch();
    $("#view").scrollTop = 0;
  });

  document.querySelectorAll(".ach").forEach(b =>
    b.addEventListener("click", () => {
      const a = ach.find(x => x.id === b.dataset.id);
      openAchSheet(a, b.classList.contains("next"), words);
    }));

  document.querySelectorAll("[data-fact]").forEach(b =>
    b.addEventListener("click", () => {
      const f = facts.find(x => x.id === b.dataset.fact);
      if (f) openFactSheet(f);
    }));
}

// Шторка с карточкой знания
function openFactSheet(f) {
  sheetMode = "fact";
  openSheet(`
    <div class="ach-sheet">
      <div class="big open">💡</div>
      <h3>${esc(f.t)}</h3>
      <p style="max-width:340px">${esc(f.x)}</p>
      ${(f.more || []).length ? `
        <div class="dig">
          <div class="dig-head">Копнуть глубже</div>
          ${f.more.map(m => `<div class="dig-item">${esc(m)}</div>`).join("")}
        </div>` : ""}
    </div>
    <div class="sheet-actions">
      <button class="btn" id="factClose" type="button">Закрыть</button>
    </div>`);
  $("#factClose").addEventListener("click", closeSheet);
}

// Шторка с деталями награды
function openAchSheet(a, teased, words) {
  sheetMode = "ach";
  const known = a.done || teased;      // секретные закрытые не раскрываем
  const s = achView ? withMaterial(achView, () => curStats()) : curStats();
  const wordOfLocal = (x) => x.word || (words || achWords())[x.id] || x.hint;

  // подсказка «сколько осталось» для понятных числовых условий
  let progressLine = "";
  if (!a.done) {
    const m = { streak3: [s.streak, 3, "дн. с этим материалом"], streak7: [s.streak, 7, "дн. с этим материалом"],
                streak14: [s.streak, 14, "дн. с этим материалом"], streak30: [s.streak, 30, "дн. с этим материалом"], days10: [s.days, 10, "занятий"], days20: [s.days, 20, "занятий"],
                samovar: [s.days, 10, "вечеров"] }[a.id];
    if (m) progressLine = `Сейчас: <b>${m[0]}</b> из ${m[1]} ${m[2]}`;
    else if (isBook())
      progressLine = `Сейчас прочитано: <b>${s.page}</b> ${plural(s.page, "страница", "страницы", "страниц")} из ${s.pages} · ${Math.round(s.pct)}%`;
    else if (!isBook() && ["q1", "half", "q3", "all100"].includes(a.id))
      progressLine = `Сейчас разобрано: <b>${Math.round(s.pct)}%</b>`;
  }

  openSheet(`
    <div class="ach-sheet">
      <div class="big ${a.done ? "open" : known ? "" : "hidden"}">${known ? a.icon : "🔒"}</div>
      <h3>${known ? esc(a.name) : "Секретная награда"}</h3>
      <span class="status ${a.done ? "open" : "wait"}">${a.done ? "Открыто" : "Ещё не открыто"}</span>
      <p>${known ? esc(a.done ? wordOfLocal(a) : a.hint) : "Откроется сама, когда сделаешь что-то особенное. Подсказки не будет 🙂"}</p>
      ${progressLine ? `<div class="cond">${progressLine}</div>` : ""}
    </div>
    <div class="sheet-actions">
      <button class="btn" id="achClose" type="button">Закрыть</button>
    </div>`);

  $("#achClose").addEventListener("click", closeSheet);
}

/* ══════════ Профили ══════════ */

// первый запуск: кто занимается
function renderProfilePick() {
  document.body.classList.add("picking");
  $("#view").innerHTML = `
    <div class="pick-wrap">
      <div class="pick-head">
        <div class="logo big"><em>Кэйко</em><i>稽古</i></div>
        <p>У каждого свой прогресс и свои материалы. Гист при этом общий — один на двоих.</p>
      </div>
      <div class="pick-list">
        ${PROFILES.map(p => `
          <button class="pick-card" data-profile="${p.id}" type="button">
            <span class="pc-name">${esc(p.name)}</span>
            <span class="pc-hint">${esc(p.hint)}</span>
          </button>`).join("")}
      </div>
      <div class="pick-note">Профиль можно сменить в настройках — данные останутся у каждого свои.</div>
    </div>`;

  document.querySelectorAll("[data-profile]").forEach(b =>
    b.addEventListener("click", () => {
      localStorage.setItem(LS_PROFILE, b.dataset.profile);
      location.replace(location.origin + location.pathname + "?v=" + encodeURIComponent(APP_VERSION));
    }));
}

function switchProfile() {
  const other = PROFILES.find(p => p.id !== profileId);
  if (!other) return;
  if (!confirm(`Переключиться на профиль «${other.name}»?\n\nЗаписи ${profile().name} останутся на месте.`)) return;
  localStorage.setItem(LS_PROFILE, other.id);
  location.replace(location.origin + location.pathname + "?v=" + encodeURIComponent(APP_VERSION));
}

/* ══════════ Мысли ══════════
   Свой раздел: мысль не отмечает занятие и не влияет на серию —
   это читательский дневник, привязанный к месту в материале. */

const thoughts = () => (data.thoughts || []).filter(t => !t.deleted);
const thoughtsOf = (key) => thoughts().filter(t => t.key === key)
  .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

// ключ материала — тот же, по которому лежат карточки знаний
function keyOf(m) {
  if (m.track === "book") return m.bookId || "";
  if (m.track === "pastel") return "pastel";
  return m.pieceId || "";
}
const currentKey = () => isBook() ? book().id : isPastel() ? "pastel" : (piece() ? piece().id : "");

/* Строка над лентой появляется, только когда лента чем-то сужена:
   фильтром любимых или случайной мыслью — и даёт путь обратно ко всей ленте. */
function thoughtHintHTML() {
  if (shuffleThought)
    return `<span>🎲 Одна наугад</span><button class="th-link" id="thAll" type="button">вся лента</button>`;
  if (notesFilter === "liked")
    return `<span>♥ Только любимые</span><button class="th-link" id="thAll" type="button">вся лента</button>`;
  return "";
}

// вытянуть случайную мысль: ту же дважды подряд не показываем
function shuffleRandomThought() {
  const pool = thoughts()
    .filter(t => notesFilter !== "liked" || t.liked)
    .filter(t => t.id !== shuffleThought);
  if (!pool.length) { toast("Мыслей пока мало"); return false; }
  shuffleThought = pool[Math.floor(Math.random() * pool.length)].id;
  editingThought = null;
  renderNotes();
  $("#view").scrollTop = 0;
  return true;
}

function renderNotes() {
  if (!hasMaterials()) { renderEmpty("Мыслей пока нет", "Они появятся вместе с первым материалом."); return; }

  const mats = achMaterials();
  const key = (cfg.thoughtKey && mats.some(m => keyOf(m) === cfg.thoughtKey)) ? cfg.thoughtKey : currentKey();
  const cur = mats.find(m => keyOf(m) === key) || mats[0];

  const all = thoughts().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const liked = all.filter(t => t.liked);
  if (notesFilter === "liked" && !liked.length) notesFilter = "all";
  let list = notesFilter === "liked" ? liked : all;
  // «наугад» сворачивает ленту до одной записи — можно тянуть ещё и ещё
  if (shuffleThought) {
    const one = list.find(t => t.id === shuffleThought);
    if (one) list = [one]; else shuffleThought = null;
  }

  const fmt = new Intl.DateTimeFormat("ru", { day: "numeric", month: "long" });
  const clock = new Intl.DateTimeFormat("ru", { hour: "2-digit", minute: "2-digit" });
  const nowYear = new Date().getFullYear();
  const when = (t) => {
    const d = fromStr(t.date);
    const year = d.getFullYear() !== nowYear ? " " + d.getFullYear() : "";
    return fmt.format(d) + year + (t.createdAt ? ", " + clock.format(new Date(t.createdAt)) : "");
  };
  const arch = (data.archive || []).filter(a => !a.deleted);
  // у мысли своя обложка — по ней видно, откуда она, ещё до чтения текста
  const sourceOf = (t) => {
    const m = mats.find(x => keyOf(x) === t.key);
    if (m) return { icon: m.icon, title: m.title, cover: m.cover, ratio: m.ratio };
    const a = arch.find(x => x.id === t.key);
    return a
      ? { icon: a.icon || "📖", title: a.title, cover: a.cover || "", ratio: a.ratio || "" }
      : { icon: "📎", title: "Архив", cover: "", ratio: "" };
  };
  const sourceHTML = (t) => {
    const s = sourceOf(t);
    return `
      <span class="th-cover">
        ${s.cover
          ? `<img src="${esc(s.cover)}" alt="" loading="lazy" decoding="async">`
          : `<i>${s.icon}</i>`}
      </span>
      <span class="th-name">${esc(s.title)}</span>`;
  };

  $("#view").innerHTML = `
    <div class="panel th-panel">
      <textarea class="note-input th-text" id="thText" rows="3" placeholder="Что подумалось?"></textarea>
      <div class="th-row">
        <span class="th-select">
          <span class="ts-label">${cur.icon} ${esc(cur.title)}</span>
          <span class="ts-arrow">▾</span>
          <select id="thMat" aria-label="Материал">
            ${mats.map(m => `<option value="${esc(keyOf(m))}" ${keyOf(m) === key ? "selected" : ""}>${m.icon} ${esc(m.title)}</option>`).join("")}
          </select>
        </span>
        <button class="btn gold th-send" id="thSave" type="button">Записать</button>
      </div>
    </div>

    ${thoughtHintHTML() ? `<div class="th-hint">${thoughtHintHTML()}</div>` : ""}

    ${list.length ? `<div class="feed notes-feed">
      ${list.map(t => t.id === editingThought ? `
        <article class="post thought editing">
          <div class="th-head">${sourceHTML(t)}<span class="th-when">${esc(when(t))}</span></div>
          <textarea class="note-input th-text" id="thEdit" rows="4">${esc(t.text)}</textarea>
          <div class="th-edit-row">
            <button class="btn gold" data-save="${t.id}" type="button">Сохранить</button>
            <button class="btn" data-cancel="1" type="button">Отмена</button>
          </div>
        </article>` : `
        <article class="post thought">
          <div class="th-head">
            ${sourceHTML(t)}
            <span class="th-when">${esc(when(t))}${t.editedAt ? " · изменено" : ""}</span>
            <span class="th-acts">
              <button class="th-act like ${t.liked ? "on" : ""}" data-like="${t.id}" type="button"
                aria-label="${t.liked ? "Убрать из любимых" : "В любимые"}">${t.liked ? "♥" : "♡"}</button>
              <button class="th-act" data-edit="${t.id}" type="button" aria-label="Изменить">✎</button>
              <button class="th-act" data-th="${t.id}" type="button" aria-label="Удалить">✕</button>
            </span>
          </div>
          <p class="post-text">${esc(t.text)}</p>
        </article>`).join("")}
    </div>` : `<div class="empty-note">Здесь будут мысли, которые приходят по ходу.<br>Первую можно записать прямо сейчас.</div>`}`;

  const area = $("#thText");
  if (editingThought) {
    const ed = $("#thEdit");
    if (ed) setTimeout(() => { ed.focus(); ed.setSelectionRange(ed.value.length, ed.value.length); }, 60);
    notesFocus = false;
  } else if (notesFocus) {
    notesFocus = false;
    setTimeout(() => area.focus(), 60);
  }

  $("#thMat").addEventListener("change", (e) => {
    cfg.thoughtKey = e.target.value; saveCfg();
    const text = area.value;
    notesFocus = true;
    renderNotes();
    $("#thText").value = text;                  // не теряем начатую мысль при смене материала
  });

  $("#thSave").addEventListener("click", () => {
    const text = ($("#thText").value || "").trim();
    if (!text) { toast("Напиши пару слов"); return; }
    data.thoughts.push({
      id: uid(), key, track: cur.track,
      text: text.slice(0, 2000), date: todayStr(),
      createdAt: now(), updatedAt: now()
    });
    cfg.thoughtKey = key; saveCfg();
    saveData(); schedulePush();
    shuffleThought = null;              // новая мысль — возвращаемся к ленте
    renderNotes();
    toast("Записано");
  });

  const showAll = $("#thAll");
  if (showAll) showAll.addEventListener("click", () => {
    shuffleThought = null; notesFilter = "all";
    renderNotes();
  });

  document.querySelectorAll("[data-like]").forEach(b =>
    b.addEventListener("click", () => {
      const t = (data.thoughts || []).find(x => x.id === b.dataset.like);
      if (!t) return;
      t.liked = !t.liked;
      t.updatedAt = now();
      saveData(); schedulePush();
      // в общей ленте меняем только сердечко — иначе лента дёрнется и уедет к началу
      if (notesFilter === "liked") { renderNotes(); return; }
      b.classList.toggle("on", !!t.liked);
      b.textContent = t.liked ? "♥" : "♡";
      syncNotesFabs();
    }));

  document.querySelectorAll("[data-edit]").forEach(b =>
    b.addEventListener("click", () => { editingThought = b.dataset.edit; renderNotes(); }));

  document.querySelectorAll("[data-cancel]").forEach(b =>
    b.addEventListener("click", () => { editingThought = null; renderNotes(); }));

  document.querySelectorAll("[data-save]").forEach(b =>
    b.addEventListener("click", () => {
      const t = (data.thoughts || []).find(x => x.id === b.dataset.save);
      const text = ($("#thEdit").value || "").trim();
      if (!t) return;
      if (!text) { toast("Мысль не может быть пустой"); return; }
      t.text = text.slice(0, 2000);
      t.updatedAt = now(); t.editedAt = now();
      editingThought = null;
      saveData(); schedulePush(); renderNotes();
      toast("Изменено");
    }));

  document.querySelectorAll("[data-th]").forEach(b =>
    b.addEventListener("click", () => {
      if (!confirm("Удалить эту мысль?")) return;
      const t = (data.thoughts || []).find(x => x.id === b.dataset.th);
      if (!t) return;
      t.deleted = true; t.updatedAt = now();
      saveData(); schedulePush(); renderNotes();
    }));

  syncNotesFabs();
}

// кнопки в углу ленты мыслей: счётчик любимых и кубик со случайной записью
function syncNotesFabs() {
  const like = $("#likeFab"), dice = $("#diceFab");
  if (!like || !dice) return;
  const here = tab === "notes" && !settingsOpen && data && data.thoughts;
  const total = here ? thoughts().length : 0;
  const n = here ? thoughts().filter(t => t.liked).length : 0;
  like.classList.toggle("show", n > 0);
  like.classList.toggle("on", notesFilter === "liked");
  like.innerHTML = `<i>${notesFilter === "liked" ? "♥" : "♡"}</i><b>${n}</b>`;
  dice.classList.toggle("show", total > 1);
}

// материал в том виде, в каком его понимает withMaterial
const viewOf = (m) => ({ track: m.track, pieceId: m.pieceId || null, bookId: m.bookId || null });

/* ══════════ Монеты и магазин ══════════
   Баланс считается из данных: заработано минус потрачено.
   Ничего не хранится отдельно — значит, ничто не разъедется при синхронизации. */
const THEMES = [
{ id: "dusk", name: "Сумерки", sub: "как было", cost: 0, kind: "color", dots: ["#8b7cf6", "#ffc94d", "#0d0b14"], vars: {} },
  { id: "rose", name: "Розовый рассвет", sub: "тёплая розовая", cost: 0, kind: "color",
    dots: ["#ff8fb8", "#ffb37a", "#170d14"],
    vars: { "--bg": "#160c13", "--ink": "#fdeef4", "--muted": "#c095a8", "--dim": "#8a6577",
            "--gold": "#ff8fb8", "--gold-2": "#ffb37a", "--violet": "#d98fe0",
            "--glass": "rgba(255, 143, 184, 0.07)", "--glass-2": "rgba(255, 143, 184, 0.13)",
            "--glass-line": "rgba(255, 143, 184, 0.2)", "--glass-hi": "rgba(255, 255, 255, 0.08)",
            "--track": "rgba(255, 255, 255, 0.1)",
            "--panel": "rgba(48, 24, 38, 0.55)", "--bar": "rgba(30, 15, 24, 0.74)",
            "--sheet": "rgba(40, 20, 32, 0.85)", "--sheet-solid": "rgba(40, 20, 32, 0.95)" } },
  { id: "ink", name: "Тушь и рис", sub: "монохром", cost: 150, kind: "color",
    dots: ["#e8e3d8", "#a8a29a", "#101012"],
    vars: { "--bg": "#0e0e10", "--ink": "#f0ede6", "--muted": "#9a958c", "--dim": "#66625c",
            "--gold": "#e8e3d8", "--gold-2": "#b9b3a8", "--violet": "#9a958c" } },
  { id: "baikal", name: "Байкальский лёд", sub: "холодная синева", cost: 150, kind: "color",
    dots: ["#7fd7e8", "#3f9fc4", "#07131c"],
    vars: { "--bg": "#07131b", "--ink": "#eaf6fb", "--muted": "#84a2b3", "--dim": "#546f7e",
            "--gold": "#8fdcee", "--gold-2": "#41a6c9", "--violet": "#6fb6d8",
            "--panel": "rgba(18, 38, 50, 0.55)", "--bar": "rgba(10, 26, 36, 0.72)",
            "--sheet": "rgba(14, 32, 44, 0.82)", "--sheet-solid": "rgba(14, 32, 44, 0.94)" } },
  { id: "amber", name: "Тёплый вечер", sub: "лампа и чай", cost: 150, kind: "color",
    dots: ["#ffb168", "#ff7a45", "#150f0b"],
    vars: { "--bg": "#150f0b", "--ink": "#faeee2", "--muted": "#b39a86", "--dim": "#7d6a5a",
            "--gold": "#ffb168", "--gold-2": "#ff7a45", "--violet": "#e08a5c",
            "--panel": "rgba(46, 32, 24, 0.55)", "--bar": "rgba(30, 21, 15, 0.72)",
            "--sheet": "rgba(38, 26, 19, 0.82)", "--sheet-solid": "rgba(38, 26, 19, 0.94)" } },
  { id: "moss", name: "Мох", sub: "хвоя и тишина", cost: 150, kind: "color",
    dots: ["#9ad9a2", "#4fae7a", "#0b130e"],
    vars: { "--bg": "#0a130d", "--ink": "#eaf6ec", "--muted": "#8aa892", "--dim": "#5a7263",
            "--gold": "#9ad9a2", "--gold-2": "#4fae7a", "--violet": "#78c2a4",
            "--panel": "rgba(20, 42, 30, 0.55)", "--bar": "rgba(12, 28, 19, 0.72)",
            "--sheet": "rgba(16, 34, 24, 0.82)", "--sheet-solid": "rgba(16, 34, 24, 0.94)" } },
  { id: "paper", name: "Бумага", sub: "светлая", cost: 200, kind: "color", light: true,
    dots: ["#c8862a", "#8a8478", "#f4f1ea"],
    vars: { "--bg": "#f2efe7", "--ink": "#221f1a", "--muted": "#6b6559", "--dim": "#9a9384",
            "--line": "rgba(0, 0, 0, 0.1)", "--track": "rgba(0, 0, 0, 0.14)",
            "--gold": "#c07d22", "--gold-2": "#e0a13d", "--violet": "#7a6bd0",
            "--glass": "rgba(255, 255, 255, 0.55)", "--glass-2": "rgba(255, 255, 255, 0.8)",
            "--glass-line": "rgba(0, 0, 0, 0.09)", "--glass-hi": "rgba(255, 255, 255, 0.9)",
            "--panel": "rgba(255, 255, 255, 0.62)", "--bar": "rgba(248, 245, 238, 0.78)",
            "--sheet": "rgba(250, 247, 240, 0.9)", "--sheet-solid": "rgba(250, 247, 240, 0.96)",
            "--shadow": "rgba(90, 78, 58, 0.16)" } },
{
    id: "orbit", name: "Орбита", sub: "бортовой интерфейс, 1968", cost: 700, kind: "world",
    dots: ["#ff7a2f", "#ffc04a", "#05060a"],
    vars: { "--bg": "#05070c", "--ink": "#f2f4f8", "--muted": "#8b93a4", "--dim": "#5a6273",
            "--gold": "#ff8a3d", "--gold-2": "#ffc04a", "--violet": "#5fa8ff",
            "--glass": "rgba(255, 255, 255, 0.045)", "--glass-2": "rgba(255, 255, 255, 0.08)",
            "--glass-line": "rgba(255, 138, 61, 0.22)", "--glass-hi": "rgba(255, 255, 255, 0.05)",
            "--panel": "rgba(10, 14, 22, 0.62)", "--bar": "rgba(6, 9, 15, 0.78)",
            "--sheet": "rgba(8, 12, 19, 0.88)", "--sheet-solid": "rgba(8, 12, 19, 0.96)" },
    icons: { home: "◎", progress: "≣", ach: "◆", shop: "◍" },
    words: { tabHome: "Пост", tabProgress: "Телеметрия", tabAch: "Допуски", tabShop: "Снабжение",
             ctaPiano: "Зафиксировать сеанс", ctaBook: "Зафиксировать чтение", ctaPastel: "Зафиксировать урок",
             ctaDone: "Сеанс записан", ctaAdd: "дополнить", coins: "кредитов", coin: "◍", streak: "цикл",
             segAch: "◆ Допуски", segFacts: "◇ Данные", shopThemes: "Режимы отображения",
             shopNote: "Кредиты начисляются автоматически: за каждый зафиксированный сеанс, за непрерывность цикла, за допуски и записи данных." },
    css: `
      body, button, input { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
      .logo em { letter-spacing: 0.18em; text-transform: uppercase; font-size: 0.9em; }
      .panel, .theme, .mat-card, .fcard, .ach, .sc, .stat { border-radius: 6px; }
      .cover { border-radius: 10px; }
      .btn, .cta, .th-btn, .gbtn, .qbtn { border-radius: 999px; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.82rem; }
      .seg { border-radius: 999px; }
      .seg button { border-radius: 999px; text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.74rem; }
      .tabbar button { text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.6rem; }
      .hero-title h2, .shop-head, .ach-hero-txt b { text-transform: uppercase; letter-spacing: 0.09em; }
      .ring .fg, .sum-ring .fg { filter: drop-shadow(0 0 8px rgba(255, 138, 61, 0.6)); }
      .panel::before {
        content: ""; position: absolute; left: 14px; right: 14px; top: 0; height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,138,61,.5), transparent);
      }
      .panel { position: relative; }
    `
  },
{
    id: "terminal", name: "Терминал", sub: "зелёный фосфор, ЭЛТ", cost: 750, kind: "world",
    dots: ["#3dff88", "#12b45a", "#011106"],
    vars: { "--bg": "#010c05", "--ink": "#c9ffdc", "--muted": "#5fbf87", "--dim": "#38805a",
            "--gold": "#3dff88", "--gold-2": "#12b45a", "--violet": "#43e0a0",
            "--glass": "rgba(61, 255, 136, 0.05)", "--glass-2": "rgba(61, 255, 136, 0.1)",
            "--glass-line": "rgba(61, 255, 136, 0.28)", "--glass-hi": "rgba(61, 255, 136, 0.12)",
            "--panel": "rgba(2, 20, 10, 0.68)", "--bar": "rgba(1, 14, 7, 0.82)",
            "--sheet": "rgba(2, 18, 9, 0.9)", "--sheet-solid": "rgba(2, 18, 9, 0.97)" },
    icons: { home: "▮", progress: "▤", ach: "✚", shop: "◈" },
    words: { tabHome: "Пульт", tabProgress: "Статус", tabAch: "Метки", tabShop: "Обмен",
             ctaPiano: "> записать сеанс", ctaBook: "> записать чтение", ctaPastel: "> записать урок",
             ctaDone: "> запись принята", ctaAdd: "дополнить", coins: "жетонов", coin: "◈", streak: "цепочка",
             segAch: "[ метки ]", segFacts: "[ архив ]", shopThemes: "Оболочки",
             shopNote: "Жетоны начисляются за каждую запись в журнале, за непрерывную цепочку дней, за метки и записи архива." },
    css: `
      body, button, input { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
      .logo em { letter-spacing: 0.16em; }
      .panel, .theme, .mat-card, .fcard, .ach, .sc, .stat, .btn, .cta, .th-btn, .seg, .seg button { border-radius: 3px; }
      .cover { border-radius: 6px; }
      .btn, .cta, .th-btn { text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.8rem; }
      .tabbar button { text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.6rem; }
      .hero-title h2, .shop-head { text-transform: uppercase; letter-spacing: 0.1em; }
      .ring .fg, .sum-ring .fg { filter: drop-shadow(0 0 7px rgba(61, 255, 136, 0.75)); }
      body::after {
        content: ""; position: fixed; inset: 0; z-index: 3; pointer-events: none;
        background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.22) 0 1px, transparent 1px 3px);
      }
    `
  }
];

/* Словарь интерфейса: тема-мир может переписать формулировки под себя */
const WORDS_BASE = {
  tabHome: "Главная", tabProgress: "Прогресс", tabAch: "Достижения", tabNotes: "Мысли", tabShop: "Магазин",
  ctaPiano: "🎹 Отметить занятие", ctaBook: "📖 Отметить чтение", ctaPastel: "🎨 Отметить урок",
  ctaDone: "✅ Сегодня отмечено", ctaAdd: "дополнить",
  coins: "монет", coin: "🪙", streak: "серия",
  segAch: "✦ Достижения", segFacts: "💡 Знания",
  shopThemes: "Темы оформления", shopNote: "Монеты капают сами: за каждое отмеченное занятие, за непрерывность, за открытые награды и карточки знаний. Тратить их не обязательно — но приятно."
};
const ICON = (k, def) => {
  const t = themeById(data.shop ? data.shop.theme : "dusk");
  return (t.icons && t.icons[k]) || def;
};
const T = (k) => {
  const t = themeById(data.shop ? data.shop.theme : "dusk");
  return (t.words && t.words[k]) || WORDS_BASE[k];
};


const themeById = (id) => THEMES.find(t => t.id === id) || THEMES[0];

function applyTheme(id) {
  const t = themeById(id);
  const root = document.documentElement;
  root.removeAttribute("style");
  for (const [k, v] of Object.entries(t.vars || {})) root.style.setProperty(k, v);
  root.style.colorScheme = t.light ? "light" : "dark";

  // тема-мир может менять шрифты, форму элементов и добавлять свои эффекты
  let sheet = document.getElementById("themeCss");
  if (!sheet) {
    sheet = document.createElement("style");
    sheet.id = "themeCss";
    document.head.appendChild(sheet);
  }
  sheet.textContent = t.css || "";

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", (t.vars && t.vars["--bg"]) || "#0d0b14");
  syncTabHeight();
  requestAnimationFrame(syncTabHeight);
}



// переключатель верхнего уровня «Достижений»: текущие материалы или полка
function achTopHTML() {
  return `
    <div class="seg" id="achTop">
      <button data-top="mats" class="${achTop === "mats" ? "on" : ""}" type="button">В работе</button>
      <button data-top="shelf" class="${achTop === "shelf" ? "on" : ""}" type="button">📚 Полка ${shelfItems().length || ""}</button>
    </div>`;
}
function bindAchTop() {
  document.querySelectorAll("#achTop button").forEach(b =>
    b.addEventListener("click", () => {
      achTop = b.dataset.top; cfg.achTop = achTop; saveCfg();
      renderAchList();
      $("#view").scrollTop = 0;
    }));
}
function renderShelfInto() {
  renderShelf();
  $("#view").insertAdjacentHTML("afterbegin", achTopHTML());
  bindAchTop();
  document.querySelectorAll("[data-shelf]").forEach(b =>
    b.addEventListener("click", () => openShelfSheet(b.dataset.shelf)));
}

/* ── Полка: всё, что доведено до конца ── */
const shelfItems = () => (data.archive || []).filter(a => !a.deleted)
  .sort((a, b) => a.finishedAt < b.finishedAt ? 1 : -1);

function shelfCoverHTML(a) {
  const own = [...data.book.books, ...(data.piano.pieces || [])].find(x => "bk_" + x.id === a.id || x.id === a.id);
  if (own && own.cover) return `
    <div class="cover photo shelf-cover" style="aspect-ratio:${esc(own.ratio || "3 / 4.4")}">
      <img src="${esc(own.cover)}" alt="${esc(a.title)}" loading="lazy" decoding="async">
    </div>`;
  const cls = a.track === "book" ? `book ${a.tone || "sea"}`
    : a.track === "pastel" ? "pastel"
    : `piano ${a.tone || "violet"}`;
  const art = a.track === "pastel" ? `<div class="smears"><i></i><i></i><i></i><i></i></div>`
    : a.art === "wave" ? SEA_ART
    : a.art === "pine" ? PINE_ART
    : a.track === "piano" ? KEYS_ART
    : `<div class="cv-mark">${a.icon}</div>`;
  return `
    <div class="cover shelf-cover ${cls}">
      <div><div class="cv-author">${esc(a.sub || "")}</div></div>
      ${art}
      <div><div class="cv-title">${esc(a.title)}</div></div>
    </div>`;
}

const stars = (n, cls) => [1, 2, 3, 4, 5].map(i =>
  `<span class="${cls || ""} ${i <= n ? "on" : ""}" ${cls ? `data-star="${i}"` : ""}>★</span>`).join("");

function renderShelf() {
  const list = shelfItems();
  const fmt = new Intl.DateTimeFormat("ru", { day: "numeric", month: "short", year: "numeric" });
  const when = (ds) => fmt.format(fromStr(ds)).replace(" г.", "");

  $("#view").innerHTML = `
    <button class="btn add-book" id="shelfAdd" type="button">＋ Добавить прочитанную книгу</button>
    ` + (list.length ? `
    <div class="shelf">
      ${list.map(a => `
        <button class="leaf" data-shelf="${a.id}" type="button">
          ${shelfCoverHTML(a)}
          <span class="lf-body">
            <span class="lf-title">${esc(a.title)}</span>
            ${a.sub ? `<span class="lf-sub">${esc(a.sub)}</span>` : ""}
            <span class="lf-when">${a.startedAt ? when(a.startedAt) + " — " : ""}${when(a.finishedAt)}</span>
            <span class="lf-meta">${a.pct}%${a.days ? ` · ${a.days} ${plural(a.days, "день", "дня", "дней")}` : ""}</span>
            <span class="lf-stars">${stars(a.rating || 0)}</span>
            ${a.review ? `<span class="lf-review">${esc(a.review)}</span>` : `<span class="lf-empty">нажми, чтобы оценить</span>`}
          </span>
        </button>`).join("")}
    </div>` : `
    <div class="empty-note">Полка пока пуста.<br>Сюда попадает всё, что доведено до конца, — с оценкой и отзывом.</div>`);

  $("#shelfAdd").addEventListener("click", openAddBookSheet);
  document.querySelectorAll("[data-shelf]").forEach(b =>
    b.addEventListener("click", () => openShelfSheet(b.dataset.shelf)));
}

// книга, прочитанная когда-то давно: всё кроме названия можно не заполнять
function openAddBookSheet() {
  sheetMode = "addbook";
  openSheet(`
    <h3>Книга на полку</h3>
    <p class="sub">Обязательно только название — остальное как вспомнится</p>
    <div class="add-form">
      <input class="note-input" id="abTitle" placeholder="Название" maxlength="120">
      <input class="note-input" id="abAuthor" placeholder="Автор" maxlength="120">
      <input class="note-input" id="abPages" type="number" inputmode="numeric" min="1" max="9999" placeholder="Сколько страниц">
      <label class="ab-lab">Начал(а) — если помнишь
        <input class="note-input" id="abFrom" type="date" max="2100-01-01"></label>
      <label class="ab-lab">Закончил(а)
        <input class="note-input" id="abTo" type="date" max="2100-01-01" value="${todayStr()}"></label>
    </div>
    <div class="sheet-actions">
      <button class="btn gold" id="abSave" type="button">На полку</button>
      <button class="btn" id="abClose" type="button">Отмена</button>
    </div>`);

  $("#abClose").addEventListener("click", closeSheet);
  $("#abSave").addEventListener("click", () => {
    const title = ($("#abTitle").value || "").trim();
    if (!title) { toast("Как называется?"); return; }

    const from = $("#abFrom").value || "";
    const to = $("#abTo").value || todayStr();
    const pages = Math.round(Number($("#abPages").value) || 0);
    let days = 0;
    if (from && from <= to) days = daysBetween(from, to) + 1;

    const rec = {
      id: uid(), track: "book", icon: "📖",
      title, sub: ($("#abAuthor").value || "").trim(),
      pct: 100, days,
      pages: pages || 0,
      art: "", tone: "snow",
      startedAt: from || to, finishedAt: to,
      rating: 0, review: "",
      createdAt: now(), updatedAt: now()
    };
    data.archive.push(rec);
    saveData(); schedulePush();
    closeSheet();
    render();
    openShelfSheet(rec.id);        // сразу предлагаем оценить и записать пару строк
  });
}

// шторка: звёзды и отзыв
function openShelfSheet(id) {
  const a = shelfItems().find(x => x.id === id) || (data.archive || []).find(x => x.id === id);
  if (!a) return;
  sheetMode = "shelf";
  let rating = a.rating || 0;

  openSheet(`
    <div class="shelf-sheet">
      ${shelfCoverHTML(a)}
      <h3>${esc(a.title)}</h3>
      <p class="shelf-meta">${a.pct}%${a.days ? ` · ${a.days} ${plural(a.days, "день", "дня", "дней")}` : ""}</p>
      <div class="star-pick" id="starPick">${stars(rating, "st")}</div>
      <textarea class="note-input shelf-review" id="shelfReview" rows="4"
        placeholder="Что осталось после этой вещи? Пара строк для себя">${esc(a.review || "")}</textarea>
    </div>
    <div class="sheet-actions">
      <button class="btn gold" id="shelfSave" type="button">Сохранить</button>
      <button class="btn" id="shelfClose" type="button">Закрыть</button>
      <button class="btn danger" id="shelfDel" type="button">Убрать с полки</button>
    </div>`);

  const paint = () => { $("#starPick").innerHTML = stars(rating, "st"); bindStars(); };
  const bindStars = () => document.querySelectorAll("#starPick .st").forEach(el =>
    el.addEventListener("click", () => { rating = +el.dataset.star; paint(); }));
  bindStars();

  const del = $("#shelfDel");
  if (del) del.addEventListener("click", () => {
    if (!confirm(`Убрать «${a.title}» с полки?\n\nОценка и отзыв пропадут.`)) return;
    a.deleted = true; a.updatedAt = now();
    saveData(); schedulePush();
    closeSheet(); render();
    toast("Убрано с полки");
  });

  $("#shelfSave").addEventListener("click", () => {
    a.rating = rating;
    a.review = ($("#shelfReview").value || "").trim().slice(0, 600);
    a.updatedAt = now();
    saveData(); schedulePush();
    closeSheet();
    if (tab === "ach") render();
    toast("Записано на полку");
  });
  $("#shelfClose").addEventListener("click", closeSheet);
}

/* ══════════ Шторка ══════════ */

function openSheet(html) {
  const sheet = $("#sheet");
  sheet.innerHTML = `<div class="grab-zone"><div class="grabber"></div></div>` +
    `<div class="sheet-body">${html}</div>`;
  sheet.classList.add("show");
  $("#sheetBg").classList.add("show");
  const body0 = sheet.querySelector('.sheet-body');
  if (body0) body0.scrollTop = 0;
  setupSheetDrag(sheet);
}

// шторку можно утянуть вниз: за полоску — всегда, за содержимое — когда оно уже прокручено наверх
function setupSheetDrag(sheet) {
  let startY = 0, dy = 0, dragging = false, fromGrab = false;

  const onDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    fromGrab = !!e.target.closest(".grab-zone");
    const body = sheet.querySelector('.sheet-body');
    if (!fromGrab && body && body.scrollTop > 0) return;   // внутри прокрутки — не мешаем
    dragging = true; startY = e.clientY; dy = 0;
    sheet.style.transition = "none";
  };

  const onMove = (e) => {
    if (!dragging) return;
    dy = e.clientY - startY;
    if (dy < 0) {                                    // тянут вверх — отдаём прокрутке
      if (!fromGrab) { reset(); return; }
      dy = 0;
    }
    if (dy > 0) {
      e.preventDefault();
      sheet.style.transform = `translateX(-50%) translateY(${dy}px)`;
      $("#sheetBg").style.opacity = String(Math.max(0, 1 - dy / 420));
    }
  };

  const reset = () => {
    dragging = false;
    sheet.style.transition = "";
    sheet.style.transform = "";
    $("#sheetBg").style.opacity = "";
  };

  const onUp = () => {
    if (!dragging) return;
    const far = dy > 110;
    reset();
    if (far) closeSheet();
  };

  sheet.addEventListener("pointerdown", onDown);
  sheet.addEventListener("pointermove", onMove, { passive: false });
  sheet.addEventListener("pointerup", onUp);
  sheet.addEventListener("pointercancel", onUp);
  sheet.addEventListener("pointerleave", onUp);
}
function closeSheet() {
  const sheet = $("#sheet");
  sheet.style.transition = "";
  sheet.style.transform = "";
  $("#sheetBg").style.opacity = "";
  sheet.classList.remove("show");
  $("#sheetBg").classList.remove("show");
  sheetMode = null;
}

function openLogSheet() {
  if (!gistReady()) {
    toast("Сначала подключи синхронизацию — иначе записи могут потеряться");
    openSettingsSheet();
    return;
  }
  sheetMode = "log";
  syncPickers();
  const existing = entryFor(selectedDate);
  const title = existing ? "Дополнить запись" : (isBook() ? "Что прочитал?" : isPastel() ? "Какие уроки прошёл?" : "Что разбирал?");
  const sub = fmtDay(selectedDate) + (existing ? " · запись уже есть" : "");

  openSheet(`
    <h3>${title}</h3>
    <p class="sub">${sub}</p>
    <div id="sheetBody"></div>
    <input class="note-input" id="noteInput" type="text" maxlength="80" placeholder="Заметка (необязательно)" autocomplete="off">
    <div class="sheet-actions">
      <button class="btn gold" id="sheetSave" type="button">Подтвердить</button>
      <button class="btn" id="sheetCancel" type="button">Отмена</button>
    </div>`);

  renderSheetBody();
  $("#sheetSave").addEventListener("click", saveEntry);
  $("#sheetCancel").addEventListener("click", closeSheet);
}

function renderSheetBody() {
  $("#sheetBody").innerHTML = isBook() ? bookSheetUI() : isPastel() ? pastelSheetUI() : pianoSheetUI();
  if (isBook()) bindBookSheet(); else if (isPastel()) bindPastelSheet(); else bindPianoSheet();
}

function fmtDur(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + ":" + String(s).padStart(2, "0");
}

function pastelSheetUI() {
  const done = doneLessons();
  return `
    <div class="lessons">
      ${course().lessons.map((l, i) => {
        const already = done.has(i);
        const picked = pickLessons.includes(i);
        return `
          <button class="lesson ${already ? "was" : picked ? "pick" : ""}" data-i="${i}" type="button" ${already ? "disabled" : ""}>
            <span class="ln">${i + 1}</span>
            <span class="lt">${esc(l.title)}<i>${fmtDur(l.dur)}</i></span>
            <span class="lc">${already ? "✓" : picked ? "●" : "○"}</span>
          </button>`;
      }).join("")}
    </div>
    <div class="lesson-hint">${pickLessons.length
      ? `Выбрано: ${pickLessons.length} ${plural(pickLessons.length, "урок", "урока", "уроков")}`
      : "Отметь уроки, которые прошёл"}</div>`;
}

function bindPastelSheet() {
  document.querySelectorAll(".lesson:not([disabled])").forEach(b =>
    b.addEventListener("click", () => {
      const i = Number(b.dataset.i);
      const at = pickLessons.indexOf(i);
      if (at >= 0) pickLessons.splice(at, 1); else pickLessons.push(i);
      renderSheetBody();
    }));
}

function bookSheetUI() {
  const cur = bookProgress();
  const delta = pickPage - cur;
  return `
    <div class="page-pick">
      <span class="pp-label">Дочитал<br><i>до страницы${delta > 0 ? ` · <b style="color:var(--green)">+${delta}</b>` : ""}</i></span>
      <div class="stepper">
        <button class="st-btn" data-d="-1" type="button">−</button>
        <button class="st-val" id="pageVal" type="button">${pickPage}</button>
        <button class="st-btn" data-d="1" type="button">＋</button>
      </div>
    </div>
    <div class="quick">${[5, 10, 20, 50].map(n => `<button class="qbtn" data-add="${n}" type="button">+${n}</button>`).join("")}</div>
    <div style="margin-top:12px;font-size:0.85rem;color:var(--muted)">Это глава: <b style="color:var(--ink)">${esc(chapterAt(pickPage).name)}</b></div>`;
}

function bindBookSheet() {
  const pages = book().pages;
  document.querySelectorAll(".st-btn").forEach(b =>
    b.addEventListener("click", () => { pickPage = Math.min(pages, Math.max(0, pickPage + Number(b.dataset.d))); renderSheetBody(); }));
  document.querySelectorAll(".qbtn").forEach(b =>
    b.addEventListener("click", () => { pickPage = Math.min(pages, pickPage + Number(b.dataset.add)); renderSheetBody(); }));
  $("#pageVal").addEventListener("click", () => {
    const v = prompt("До какой страницы дочитал?", String(pickPage));
    if (v === null) return;
    const n = Math.round(Number(v.replace(",", ".")));
    if (isNaN(n) || n < 0 || n > pages) { toast(`Страница от 0 до ${pages}`); return; }
    pickPage = n; renderSheetBody();
  });
}

function pianoSheetUI() {
  return `
    <div class="hand-pick">
      ${[["right", "𝄞 Правая"], ["left", "𝄢 Левая"], ["both", "🤲 Обе"]].map(([h, l]) =>
        `<button class="hp ${pickHand === h ? "on" : ""}" data-hand="${h}" type="button">${l}</button>`).join("")}
    </div>
    <div class="range">
      <div class="range-part">
        <span class="rp-label">с такта</span>
        <div class="stepper">
          <button class="st-btn" data-edge="from" data-d="-1" type="button">−</button>
          <button class="st-val" data-edge="from" type="button">${pickFrom}</button>
          <button class="st-btn" data-edge="from" data-d="1" type="button">＋</button>
        </div>
      </div>
      <div class="range-part">
        <span class="rp-label">по такт</span>
        <div class="stepper">
          <button class="st-btn" data-edge="to" data-d="-1" type="button">−</button>
          <button class="st-val" data-edge="to" type="button">${pickTo}</button>
          <button class="st-btn" data-edge="to" data-d="1" type="button">＋</button>
        </div>
      </div>
    </div>
    ${pending.length ? `<div class="pending">${pending.map((s, i) => `<button class="pchip" data-i="${i}" type="button">${spanText(s)} ✕</button>`).join("")}</div>` : ""}
    <button class="link-btn" id="addSpan" type="button">＋ Добавить ещё фрагмент</button>`;
}

function bindPianoSheet() {
  const bars = piece().bars;
  document.querySelectorAll(".hp").forEach(b =>
    b.addEventListener("click", () => { pickHand = b.dataset.hand; renderSheetBody(); }));
  document.querySelectorAll(".st-btn").forEach(b =>
    b.addEventListener("click", () => {
      const d = Number(b.dataset.d);
      if (b.dataset.edge === "from") { pickFrom = Math.min(bars, Math.max(1, pickFrom + d)); if (pickTo < pickFrom) pickTo = pickFrom; }
      else { pickTo = Math.min(bars, Math.max(1, pickTo + d)); if (pickFrom > pickTo) pickFrom = pickTo; }
      renderSheetBody();
    }));
  document.querySelectorAll(".st-val").forEach(b =>
    b.addEventListener("click", () => {
      const v = prompt(b.dataset.edge === "from" ? "С какого такта?" : "По какой такт?", b.textContent);
      if (v === null) return;
      const n = Math.round(Number(v.replace(",", ".")));
      if (isNaN(n) || n < 1 || n > bars) { toast(`Такт от 1 до ${bars}`); return; }
      if (b.dataset.edge === "from") { pickFrom = n; if (pickTo < n) pickTo = n; }
      else { pickTo = n; if (pickFrom > n) pickFrom = n; }
      renderSheetBody();
    }));
  document.querySelectorAll(".pchip").forEach(b =>
    b.addEventListener("click", () => { pending.splice(Number(b.dataset.i), 1); renderSheetBody(); }));
  $("#addSpan").addEventListener("click", () => {
    pending.push(...(pickHand === "both"
      ? [normSpan("right", pickFrom, pickTo), normSpan("left", pickFrom, pickTo)]
      : [normSpan(pickHand, pickFrom, pickTo)]));
    renderSheetBody();
  });
}

/* ══════════ Кубик: чем заняться сегодня ══════════ */

// все материалы одним списком, с текущим состоянием
function candidates() {
  const save = data.active, savePiece = data.piano.activePiece;
  const list = [];

  for (const p of data.piano.pieces.filter(x => !x.archived)) {
    data.active = "piano"; data.piano.activePiece = p.id;
    const s = pianoStats();
    list.push({ track: "piano", pieceId: p.id, icon: "🎹", name: p.name,
      pct: s.pct, streak: s.streakAll, doneToday: !!entryFor(todayStr()) });
  }
  data.active = "book";
  const b = bookStats();
  list.push({ track: "book", icon: "📖", name: book().title,
    pct: b.pct, streak: b.streak, doneToday: !!entryFor(todayStr()) });

  data.active = "pastel";
  const c = pastelStats();
  list.push({ track: "pastel", icon: "🎨", name: course().name,
    pct: c.pct, streak: c.streak, doneToday: !!entryFor(todayStr()) });

  data.active = save; data.piano.activePiece = savePiece;
  return list;
}

// взвешенный бросок: чаще выпадает то, что проседает и не тронуто сегодня
function rollCandidate(exceptName) {
  const all = candidates();
  let pool = all.filter(c => !c.doneToday);
  if (!pool.length) pool = all;
  if (pool.length > 1 && exceptName) {
    const other = pool.filter(c => c.name !== exceptName);
    if (other.length) pool = other;
  }
  const weights = pool.map(c => 1 + (100 - Math.min(100, c.pct)) / 40 + (c.streak > 0 ? 0.6 : 0));
  const total = weights.reduce((a, w) => a + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return { pick: pool[i], all };
  }
  return { pick: pool[pool.length - 1], all };
}

/* ── Встряхивание телефона = бросок кубика ── */

let shakeReady = false;
let lastShake = 0;

const shakeNeedsAsk = () =>
  typeof window.DeviceMotionEvent === "function" &&
  typeof window.DeviceMotionEvent.requestPermission === "function";

function handleShake(e) {
  const a = e.accelerationIncludingGravity;
  if (!a) return;
  const power = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
  const now = Date.now();
  if (power > 32 && now - lastShake > 2500) {
    lastShake = now;
    if ($("#sheet")?.classList.contains("show")) return;
    if ($("#cheer")?.classList.contains("show")) return;
    if (navigator.vibrate) navigator.vibrate(25);
    rollDice();
  }
}

// подписка на движение; ask=true — можно показать системный запрос (только из обработчика тапа)
async function enableShake(ask) {
  if (shakeReady) return true;
  if (typeof window.DeviceMotionEvent !== "function") return false;
  try {
    if (shakeNeedsAsk()) {
      if (!ask) return false;
      const res = await window.DeviceMotionEvent.requestPermission();
      if (res !== "granted") { cfg.shake = false; saveCfg(); return false; }
    }
    window.addEventListener("devicemotion", handleShake);
    shakeReady = true;
    cfg.shake = true; saveCfg();
    renderShakeHint();
    return true;
  } catch { return false; }
}

// тихая строчка под кнопкой: включить встряхивание (пока не разрешено)
function renderShakeHint() {
  const box = $("#shakeHint");
  if (!box) return;
  if (shakeReady || typeof window.DeviceMotionEvent !== "function") { box.innerHTML = ""; return; }
  box.innerHTML = `<button id="shakeOn" type="button">🎲 Включить выбор встряхиванием</button>`;
  $("#shakeOn").addEventListener("click", async () => {
    const ok = await enableShake(true);
    toast(ok ? "Готово — потряси телефон" : "Доступ к движению не разрешён");
    renderShakeHint();
  });
}

// кубик: просто прокручивает ленту и останавливается на выбранном материале
function rollDice() {
  const { pick } = rollCandidate();
  if (!pick) return;

  if (tab !== "home") { tab = "home"; cfg.tab = tab; saveCfg(); render(); }
  if (!railApi) return;

  const i = railApi.indexOf(pick.track, pick.pieceId || null);
  if (i < 0) return;
  railApi.spinTo(i, () => toast(`Сегодня — ${pick.name}`));
}

// сверяем свою версию с той, что лежит на сервере — мимо всех кэшей
async function checkForUpdate() {
  if (!navigator.onLine) return;
  try {
    const r = await withTimeout(fetch("version.json?ts=" + Date.now(), { cache: "no-store" }), 5000);
    if (!r.ok) return;
    const j = await r.json();
    if (j.version && j.version !== APP_VERSION) {
      newVersion = j.version;
      renderBanner();
      maybeAutoUpdate();
    }
  } catch {}
}

// полная переустановка: снимаем service worker, чистим кэши, грузим заново
async function forceUpdate() {
  const btn = $("#sUpdate");
  if (btn) { btn.textContent = "Обновляю…"; btn.disabled = true; }
  toast("Обновляю приложение…");

  const cleanup = (async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      // главное для iOS: заставить браузер перекачать сами файлы, а не отдать их из своего кэша
      await Promise.all(["index.html", "app.js", "sw.js", "manifest.webmanifest"].map(
        f => fetch(f, { cache: "reload" }).catch(() => {})
      ));
    } catch {}
  })();

  // если что-то из этого зависнет — на iOS такое бывает, — всё равно перезагружаемся
  await Promise.race([cleanup, new Promise(r => setTimeout(r, 2500))]);

  // метка версии уходит и в адрес страницы, и в адрес скрипта — тогда старый app.js подхватить неоткуда
  const url = location.origin + location.pathname + "?v=" + encodeURIComponent(newVersion || Date.now());
  location.replace(url);
  // страховка: если standalone проигнорировал replace, пробуем обычным переходом
  setTimeout(() => { location.href = url; }, 1200);
}

// новая версия при запуске ставится сама: одна попытка за сессию, дальше остаётся баннер
function maybeAutoUpdate() {
  if (!newVersion || sheetMode) return;
  try {
    if (sessionStorage.getItem("keiko-autoupd") === newVersion) return;
    sessionStorage.setItem("keiko-autoupd", newVersion);
  } catch { return; }
  forceUpdate();
}

function openAboutSheet() {
  sheetMode = "about";
  openSheet(`
    <div class="ach-sheet">
      <div class="big open" style="font-size:2rem">稽古</div>
      <h3>Кэйко</h3>
      <p style="max-width:340px">
        В Японии так называют регулярную практику в традиционных искусствах — музыке, каллиграфии,
        чайной церемонии, боевых искусствах. Иероглифы 稽古 буквально значат «размышлять о старом»:
        учиться, вглядываясь в то, что сделали до тебя.
      </p>

      <div class="dig">
        <div class="dig-head">Зачем повторять чужое</div>
        <div class="dig-item">Разбирая Баха, ты не переписываешь его — ты влезаешь в его способ думать. Своё появляется потом, из накопленного чужого: язык сначала перенимают, а уже затем говорят на нём своё</div>
        <div class="dig-item">В японской традиции это описано как сюхари: сначала точно следуй форме, потом отклоняйся от неё, и лишь затем отпускай — но пропустить первую ступень нельзя</div>
        <div class="dig-item">Мастера говорят: не ты осваиваешь форму, а форма меняет тебя. Руки, слух, внимание перестраиваются незаметно, пока ты просто повторяешь</div>
      </div>

      <div class="dig">
        <div class="dig-head">Что это даёт человеку</div>
        <div class="dig-item">Занятие без цели «стать лучше всех» снимает тревогу: сегодня достаточно трёх тактов, и этого уже хватает</div>
        <div class="dig-item">Повторение с полным вниманием работает как медитация в действии — мозг отдыхает от многозадачности, а тело успокаивается</div>
        <div class="dig-item">Медленный видимый прогресс — редкое в современной жизни ощущение, что время потрачено не впустую</div>
        <div class="dig-item">Практика даёт устойчивость: у тебя есть дело, которое никуда не денется в плохой день и не зависит от чужой оценки</div>
      </div>

      <p style="max-width:340px;color:var(--dim);font-size:0.86rem">
        Поэтому здесь нет соревнования и рейтингов: только ты, материал и отметка о том,
        что сегодня ты к нему возвращался.
      </p>
    </div>
    <div class="sheet-actions">
      <button class="btn" id="aboutClose" type="button">Закрыть</button>
    </div>`);
  $("#aboutClose").addEventListener("click", closeSheet);
}

// оформление живёт в настройках: цвета и «миры», меняющие интерфейс целиком
function themeUI() {
  const cur = data.shop.theme || "dusk";
  const row = (t) => `
    <button class="pick ${cur === t.id ? "on" : ""}" data-theme="${t.id}" type="button">
      <span class="pk-dots">${t.dots.map(c => `<i style="background:${c}"></i>`).join("")}</span>
      <span class="pk-name">${esc(t.name)}</span>
    </button>`;

  return `
    <div class="freeze">
      <div class="fz-head">🎨 <b>Оформление</b> — цвета и целые миры со своим шрифтом и словами</div>
      <div class="pick-row">${THEMES.filter(t => t.kind !== "world").map(row).join("")}</div>
      <div class="fz-head" style="margin-top:2px">Миры</div>
      <div class="pick-row">${THEMES.filter(t => t.kind === "world").map(row).join("")}</div>
    </div>`;
}

function bindThemeUI() {
  document.querySelectorAll("[data-theme]").forEach(b =>
    b.addEventListener("click", () => {
      data.shop.theme = b.dataset.theme;
      saveData(); schedulePush();
      applyTheme(data.shop.theme);
      closeSheet();
      render();
      toast(`Тема «${themeById(data.shop.theme).name}»`);
    }));
}

function backupBlob() {
  const pack = {
    app: "keiko", v: 1, savedAt: now(),
    version: APP_VERSION, profile: profileId,
    data: exportData()
  };
  return new Blob([JSON.stringify(pack, null, 1)], { type: "application/json" });
}

async function exportBackup() {
  const name = `keiko-${profileId}-${todayStr()}.json`;
  const blob = backupBlob();
  try {
    const file = new File([blob], name, { type: "application/json" });
    // на телефоне удобнее системное «Поделиться»: можно сохранить в Файлы или отправить себе
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Кэйко — копия данных" });
      return;
    }
  } catch { return; }        // пользователь закрыл окно — это не ошибка

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast("Копия сохранена");
}

// восстановление сливает копию с тем, что есть: ничего не затирается
function restoreBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let pack;
    try { pack = JSON.parse(reader.result); } catch { toast("Файл не читается"); return; }
    const d = pack && (pack.data || pack);
    if (!d || !d.piano) { toast("Это не копия Кэйко"); return; }

    if (pack.profile && pack.profile !== profileId &&
        !confirm(`Копия сделана в профиле «${pack.profile}», а сейчас открыт «${profileId}».\n\nВсё равно восстановить сюда?`)) return;

    const before = dataStamp();
    data.piano.entries = mergeLists(data.piano.entries, d.piano.entries || []);
    data.book.entries = mergeLists(data.book.entries, (d.book && d.book.entries) || []);
    data.pastel.entries = mergeLists(data.pastel.entries, (d.pastel && d.pastel.entries) || []);
    data.thoughts = mergeLists(data.thoughts || [], d.thoughts || []);
    data.archive = mergeLists(data.archive || [], d.archive || []);
    data.freezes = mergeLists(data.freezes || [], d.freezes || []);

    // материалы, которых у нас нет, тоже возвращаем
    for (const p of (d.piano.pieces || [])) if (!data.piano.pieces.some(x => x.id === p.id)) data.piano.pieces.push(p);
    for (const b of ((d.book && d.book.books) || [])) if (!data.book.books.some(x => x.id === b.id)) data.book.books.push(b);

    normalizeActive();
    saveData(); schedulePush();
    closeSheet(); render();
    toast(before === dataStamp() ? "Всё это уже было" : "Данные восстановлены");
  };
  reader.readAsText(file);
}

function backupUI() {
  const counts = [
    [data.piano.entries.length + data.book.entries.length + data.pastel.entries.length, "занятие", "занятия", "занятий"],
    [(data.thoughts || []).filter(t => !t.deleted).length, "мысль", "мысли", "мыслей"],
    [(data.archive || []).filter(a => !a.deleted).length, "книга на полке", "книги на полке", "книг на полке"]
  ].map(([n, a, b, c]) => `${n} ${plural(n, a, b, c)}`).join(" · ");

  return `
    <div class="freeze">
      <div class="fz-head">💾 <b>Копия данных</b> — файл со всем, что накопилось: ${counts}</div>
      <div class="fz-form2">
        <button class="btn" id="bkSave" type="button">Сохранить копию</button>
        <button class="btn" id="bkLoad" type="button">Восстановить из копии</button>
      </div>
      <input type="file" id="bkFile" accept="application/json,.json" style="display:none">
      <div class="fz-empty">Восстановление ничего не затирает: записи сливаются по времени изменения.</div>
    </div>`;
}

function bindBackupUI() {
  const save = $("#bkSave"), load = $("#bkLoad"), file = $("#bkFile");
  if (save) save.addEventListener("click", exportBackup);
  if (load && file) {
    load.addEventListener("click", () => file.click());
    file.addEventListener("change", () => { if (file.files[0]) restoreBackup(file.files[0]); });
  }
}

// разовый перенос из читалки: кладём записи в данные — дальше они уезжают в гист сами
async function importPack(url) {
  toast("Загружаю…");
  try {
    const r = await withTimeout(fetch(url + "?ts=" + Date.now(), { cache: "no-store" }), 15000);
    if (!r.ok) throw new Error("файл не найден");
    const pack = await r.json();

    let addedShelf = 0, addedNotes = 0;
    const haveArch = new Set((data.archive || []).map(a => a.id));
    for (const a of pack.archive || []) {
      if (haveArch.has(a.id)) continue;
      data.archive.push(a); addedShelf++;
    }
    const haveTh = new Set((data.thoughts || []).map(t => t.id));
    for (const t of pack.thoughts || []) {
      if (haveTh.has(t.id)) continue;
      data.thoughts.push(t); addedNotes++;
    }

    saveData();
    if (gistReady()) await syncNow(true); else schedulePush();
    closeSheet(); render();
    toast(addedShelf || addedNotes
      ? `Перенесено: ${addedShelf} на полку, ${addedNotes} в мысли`
      : "Всё уже перенесено");
  } catch (e) {
    toast("Не вышло: " + (e.message || "ошибка"));
  }
}

function importUI() {
  if (profileId !== "diana") return "";
  return `
    <div class="freeze">
      <div class="fz-head">📥 <b>Перенос из читалки</b> — прочитанные книги на полку, выписки в мысли</div>
      <div class="fz-empty">Сейчас на полке: <b>${(data.archive || []).filter(a => !a.deleted).length}</b>,
        мыслей: <b>${(data.thoughts || []).filter(t => !t.deleted).length}</b></div>
      <button class="btn" id="impBtn" type="button">Перенести</button>
    </div>`;
}

function bindImportUI() {
  const b = $("#impBtn");
  if (b) b.addEventListener("click", () => importPack("import/diana.json"));
}

/* ══════════ Настройки: отдельный экран с разделами ══════════ */

const SETTINGS_SECTIONS = [
  { id: "profile",   icon: "👤", name: "Профиль",       hint: () => profile().name },
  { id: "sync",      icon: "🔄", name: "Синхронизация", hint: () => (cfg.token && cfg.gistId) ? "подключена" : "не подключена" },
  { id: "goal",      icon: "🎯", name: "Цель на неделю", hint: () => `${data.weekGoal} ${plural(data.weekGoal, "день", "дня", "дней")}` },
  { id: "look",      icon: "🎨", name: "Оформление",    hint: () => themeById(data.shop.theme).name },
  { id: "materials", icon: "📦", name: "Материалы",     hint: () => hasMaterials() ? currentMaterial().title : "пусто" },
  { id: "pause",     icon: "🌴", name: "Пауза",         hint: () => {
      const n = (data.freezes || []).filter(f => !f.deleted).length;
      return n ? `${n} ${plural(n, "период", "периода", "периодов")}` : "нет"; } },
  { id: "data",      icon: "💾", name: "Данные",        hint: () => "копия и перенос" },
  { id: "about",     icon: "稽", name: "О приложении",  hint: () => APP_VERSION }
];

function openSettingsSheet() {   // старое имя оставлено: на него завязаны баннеры и пустые состояния
  settingsOpen = true; settingsView = null;
  closeSheet();
  render();
}

function renderSettings() {
  if (settingsView) { renderSettingsSection(settingsView); return; }

  $("#view").innerHTML = `
    <h2 class="set-title">Настройки</h2>
    <div class="set-list">
      ${SETTINGS_SECTIONS.map(sec => `
        <button class="set-row" data-sec="${sec.id}" type="button">
          <span class="set-ic">${sec.icon}</span>
          <span class="set-txt"><b>${sec.name}</b><em>${esc(String(sec.hint()))}</em></span>
          <span class="mc-go">›</span>
        </button>`).join("")}
    </div>
    <button class="btn set-back" id="setDone" type="button">Готово</button>`;

  document.querySelectorAll("[data-sec]").forEach(b =>
    b.addEventListener("click", () => {
      settingsView = b.dataset.sec;
      render();
      $("#view").scrollTop = 0;
    }));
  $("#setDone").addEventListener("click", () => { settingsOpen = false; settingsView = null; render(); });
}

function renderSettingsSection(id) {
  const sec = SETTINGS_SECTIONS.find(x => x.id === id) || SETTINGS_SECTIONS[0];
  const connected = cfg.token && cfg.gistId;
  let body = "";

  if (id === "profile") {
    body = `
      <div class="info-note prof-note">
        Сейчас: <b>${esc(profile().name)}</b>. У каждого профиля свои материалы и прогресс, гист общий.
        <button class="btn" id="sProfile" type="button">Сменить профиль</button>
      </div>`;
  } else if (id === "sync") {
    body = connected ? `
      <div class="info-note">Гист <b>${esc(cfg.gistId)}</b>${cfg.lastSync ? ` · последняя сверка ${fmtDay(dateStr(new Date(cfg.lastSync)))}` : ""}</div>
      <div class="sheet-actions">
        <button class="btn gold" id="sSync" type="button">Синхронизировать сейчас</button>
        <button class="btn danger" id="sOff" type="button">Отключить</button>
      </div>
      <div class="diag">${diagLine()}</div>` : `
      <div class="info-note">
        Подключи <b>GitHub Gist</b>, чтобы прогресс жил на всех устройствах.<br>
        Токен: <a href="https://github.com/settings/tokens/new?description=%D0%9A%D1%8D%D0%B9%D0%BA%D0%BE&scopes=gist" target="_blank" rel="noopener">classic со scope gist</a>
      </div>
      <input class="note-input" id="sToken" type="password" placeholder="ghp_…" autocomplete="off">
      <div class="sheet-actions"><button class="btn gold" id="sConnect" type="button">Подключить</button></div>`;
  } else if (id === "goal") {
    body = goalUI();
  } else if (id === "look") {
    body = themeUI();
  } else if (id === "materials") {
    body = archiveUI() || `<div class="empty-note">Материалов пока нет</div>`;
  } else if (id === "pause") {
    body = freezeUI();
  } else if (id === "data") {
    body = backupUI() + importUI();
  } else {
    body = `
      <div class="info-note">Кэйко · версия ${APP_VERSION}</div>
      <div class="sheet-actions">
        <button class="btn" id="sAbout" type="button">Что такое кэйко</button>
        <button class="btn" id="sUpdate" type="button">Обновить приложение</button>
      </div>
      ${shakeUI()}
      <div class="diag">${diagLine()}</div>`;
  }

  $("#view").innerHTML = `
    <button class="back" id="setBack" type="button">‹ Настройки</button>
    <h2 class="set-title">${sec.icon} ${sec.name}</h2>
    ${body}`;

  $("#setBack").addEventListener("click", () => { settingsView = null; render(); $("#view").scrollTop = 0; });

  const pr = $("#sProfile");
  if (pr) pr.addEventListener("click", switchProfile);
  const up = $("#sUpdate");
  if (up) up.addEventListener("click", forceUpdate);
  const ab = $("#sAbout");
  if (ab) ab.addEventListener("click", openAboutSheet);
  const sy = $("#sSync");
  if (sy) sy.addEventListener("click", () => syncNow(true));
  const off = $("#sOff");
  if (off) off.addEventListener("click", () => {
    if (!confirm("Отключить синхронизацию?\n\nЗаписи останутся на устройстве, но перестанут уходить в гист — и записывать новые будет нельзя, пока не подключишь снова.")) return;
    cfg.token = ""; cfg.gistId = ""; saveCfg(); setSyncDot(""); render(); toast("Отключено");
  });
  const conn = $("#sConnect");
  if (conn) conn.addEventListener("click", () => connectGitHub($("#sToken").value.trim()));

  bindFreezeUI();
  bindGoalUI();
  bindThemeUI();
  bindBackupUI();
  bindImportUI();
  bindShakeUI();
  bindArchiveUI();
}

/* ══════════ Gist ══════════ */

function setSyncDot(state) { $("#syncDot").className = "sync-dot" + (state ? " " + state : ""); }

function gh(path, opts = {}) {
  return withTimeout(fetch("https://api.github.com" + path, Object.assign({
    headers: { "Authorization": "Bearer " + cfg.token, "Accept": "application/vnd.github+json" }
  }, opts)), 12000);
}

// без потолка по времени запрос в самолёте висит до системного таймаута — и всё приложение ждёт
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error("нет связи")), ms))
  ]);
}

async function connectGitHub(token) {
  if (!token) { toast("Вставь токен"); return; }
  cfg.token = token; saveCfg();
  setSyncDot("busy");
  try {
    const r = await gh("/gists?per_page=100");
    if (r.status === 401) throw new Error("Токен не подошёл");
    if (!r.ok) throw new Error("GitHub ответил " + r.status);
    const found = (await r.json()).find(g => g.files && g.files[GIST_FILE]);
    if (found) { cfg.gistId = found.id; saveCfg(); await syncNow(false); toast("Подключено"); }
    else {
      const cr = await gh("/gists", {
        method: "POST",
        body: JSON.stringify({ description: "Кэйко — данные профилей", public: false,
          files: { [GIST_FILE]: { content: JSON.stringify({ v: 8, savedAt: now(), profiles: { [profileId]: exportData() } }) } } })
      });
      if (!cr.ok) throw new Error("Не создался гист");
      cfg.gistId = (await cr.json()).id; cfg.lastSync = now(); saveCfg();
      setSyncDot("ok"); toast("Гист создан");
    }
    closeSheet();
    syncError = "";
    render();
  } catch (e) {
    cfg.token = ""; saveCfg(); setSyncDot("err");
    render();
    toast(e.message || "Не получилось");
  }
}

const exportData = () => ({ v: 7, savedAt: now(), active: data.active, weekGoal: data.weekGoal, shop: data.shop, thoughts: data.thoughts, piano: data.piano, book: data.book, pastel: data.pastel, freezes: data.freezes, archive: data.archive });

function mergeLists(local, remote) {
  const map = new Map();
  for (const i of remote || []) map.set(i.id, i);
  for (const i of local || []) {
    const o = map.get(i.id);
    if (!o || (i.updatedAt || 0) >= (o.updatedAt || 0)) map.set(i.id, i);
  }
  return [...map.values()];
}

async function syncNow(manual) {
  if (!cfg.token || !cfg.gistId || syncing) { if (manual && !cfg.token) openSettingsSheet(); return; }
  if (!navigator.onLine) { online = false; setSyncDot("off"); renderBanner(); return; }
  syncing = true; setSyncDot("busy");
  const stampBefore = dataStamp();
  try {
    const r = await gh("/gists/" + cfg.gistId);
    if (!r.ok) throw new Error("Ошибка сети (" + r.status + ")");
    const g = await r.json();
    const f = g.files && g.files[GIST_FILE];
    let box = {};                       // содержимое файла целиком: { profiles: {...} }
    let remote = emptyData();
    if (f) {
      let txt = f.content;
      if (f.truncated && f.raw_url) txt = await (await fetch(f.raw_url)).text();
      try {
        const parsed = JSON.parse(txt);
        // старый файл был плоским — считаем его данными первого профиля
        box = parsed && parsed.profiles ? parsed : { profiles: { anton: parsed } };
        remote = migrate(box.profiles[profileId] || null);
      } catch {}
    }
    if (!box.profiles) box = { profiles: {} };
    data.piano.entries = mergeLists(data.piano.entries, remote.piano.entries);
    data.book.entries = mergeLists(data.book.entries, remote.book.entries);
    data.pastel.entries = mergeLists(data.pastel.entries, remote.pastel.entries);
    if (remote.weekGoal && (remote.savedAt || 0) > (cfg.lastSync || 0)) data.weekGoal = remote.weekGoal;
    data.freezes = mergeLists(data.freezes, remote.freezes);
    data.thoughts = mergeLists(data.thoughts, remote.thoughts || []);
    if (remote.shop) {
      data.shop.purchases = mergeLists(data.shop.purchases, remote.shop.purchases || []);
      if ((remote.savedAt || 0) > (cfg.lastSync || 0)) {
        if (remote.shop.theme) data.shop.theme = remote.shop.theme;
      }
    }
    data.archive = mergeLists(data.archive, remote.archive);
    normalizeActive();
    saveData();
    const changed = JSON.stringify([data.piano, data.book, data.pastel])
      !== JSON.stringify([remote.piano, remote.book, remote.pastel]);
    if (changed) {
      box.profiles[profileId] = exportData();     // чужой профиль в файле остаётся нетронутым
      box.v = 8; box.savedAt = now();
      const pr = await gh("/gists/" + cfg.gistId, {
        method: "PATCH",
        body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(box) } } })
      });
      if (!pr.ok) throw new Error("Не сохранилось");
    }
    cfg.lastSync = now(); saveCfg(); setSyncDot("ok");
    syncError = "";
    syncPickers();
    if (stampBefore !== dataStamp()) render(true);   // тихо и только если данные правда изменились
    else renderBanner();
    if (manual) toast("Синхронизировано");
  } catch (e) {
    if (!navigator.onLine) { online = false; setSyncDot("off"); renderBanner(); return; }
    setSyncDot("err");
    syncError = e.message || "нет связи с GitHub";
    renderBanner();
    if (manual) toast(syncError);
  } finally { syncing = false; }
}

function schedulePush() {
  if (!cfg.token || !cfg.gistId) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => syncNow(false), 1500);
}

/* ══════════ Запуск ══════════ */

function init() {
  try {
    boot();
    try { sessionStorage.removeItem("keiko-selfheal"); } catch {}
  } catch (e) { console.error(e); crashScreen(e); }
}

function boot() {
  profileId = localStorage.getItem(LS_PROFILE);
  if (!profileId) { renderProfilePick(); return; }   // первый запуск: кто занимается

  load();
  normalizeActive();
  saveData();   // закрепляем данные в актуальной схеме сразу после миграции
  if (["home", "progress", "ach", "notes"].includes(cfg.tab)) tab = cfg.tab;
  applyTheme(data.shop.theme);
  if (["week", "month"].includes(cfg.period)) period = cfg.period;
  if (cfg.achView && cfg.achView.track) achView = cfg.achView;
  if (cfg.achTab === "facts") achTab = "facts";
  if (cfg.achTop === "shelf") achTop = "shelf";
  const t = new Date();
  calYear = t.getFullYear(); calMonth = t.getMonth();
  syncPickers();

  // без него приложение не открывается офлайн: sw.js кэширует оболочку.
  // Ставим с задержкой и только если запуск прошёл без сбоев
  if ("serviceWorker" in navigator) {
    setTimeout(() => {
      let broken = "";
      try { broken = sessionStorage.getItem("keiko-selfheal") || ""; } catch {}
      if (broken === "1") return;
      navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(() => {});
    }, 2500);
  }

  // длинные ленты: кнопка возврата к началу
  const view = $("#view"), top = $("#toTop");
  if (view && top) {
    view.addEventListener("scroll", () => {
      top.classList.toggle("show", view.scrollTop > 420);
    }, { passive: true });
    top.addEventListener("click", () => {
      view.scrollTo({ top: 0, behavior: "smooth" });
      // если плавная прокрутка не поддержана — доводим сами
      setTimeout(() => { if (view.scrollTop > 0) view.scrollTop = 0; }, 600);
    });
  }

  const fab = $("#likeFab");
  if (fab) fab.addEventListener("click", () => {
    notesFilter = notesFilter === "liked" ? "all" : "liked";
    shuffleThought = null;
    renderNotes();
    if (view) view.scrollTop = 0;
  });

  const diceFab = $("#diceFab");
  if (diceFab) diceFab.addEventListener("click", () => {
    if (navigator.vibrate) navigator.vibrate(15);
    shuffleRandomThought();
  });

  window.addEventListener("online", () => {
    online = true; setSyncDot(""); renderBanner();
    if (gistReady()) syncNow(false);        // догоняем всё, что накопилось офлайн
  });
  window.addEventListener("offline", () => { online = false; setSyncDot("off"); renderBanner(); });
  if (!online) setSyncDot("off");

  $("#gearBtn").addEventListener("click", openSettingsSheet);
  document.querySelector(".logo").addEventListener("click", openAboutSheet);
  // если доступ к движению уже разрешён — просто подписываемся
  if (cfg.shake || !shakeNeedsAsk()) enableShake(false);

  $("#sheetBg").addEventListener("click", closeSheet);
  $("#cheerOk").addEventListener("click", () => {
    $("#cheer").classList.remove("show");
    if (overlayQueue.length) setTimeout(showNextOverlay, 220);
  });
  $("#cheer").addEventListener("click", e => { if (e.target === e.currentTarget) $("#cheer").classList.remove("show"); });

  window.addEventListener("resize", syncTabHeight);
  window.addEventListener("orientationchange", () => setTimeout(syncTabHeight, 200));

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      checkForUpdate(); if (selectedDate > todayStr()) selectedDate = todayStr(); syncNow(false); render(); }
  });

  render();
  checkForUpdate();
  if (cfg.token && cfg.gistId && navigator.onLine) { setSyncDot("ok"); syncNow(false); }


}

init();
