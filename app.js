"use strict";

/* Главный экран — обложка, прогресс и одна кнопка;
   детали разнесены по вкладкам «Прогресс», «Награды» и «Обзор». */

const LS = {
  data: "prokachka-data-v6",
  cfg: "prokachka-cfg-v1",
  older: ["prokachka-data-v5", "prokachka-data-v4", "prokachka-data-v3", "prokachka-data-v2", "prokachka-data-v1"]
};
const GIST_FILE = "prokachka.json";
const APP_VERSION = "2026.08.03 · 19";

const DEFAULT_PIECES = [
  { id: "bwv853", author: "И. С. Бах", name: "Прелюдия es-moll, BWV 853", bars: 40, art: "keys", tone: "violet" },
  { id: "more", author: "Микаэл Таривердиев", name: "Мальчики и море", bars: 37, art: "wave", tone: "sea" }
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

const DEFAULT_BOOK = {
  title: "Снег на траве",
  author: "Юрий Норштейн",
  volume: "том 1",
  pages: 361,
  startPage: 183,
  chapters: [
    { name: "Феномен изображения", from: 6 },
    { name: "Цапля и журавль", from: 125 },
    { name: "Ёжик в тумане", from: 157 },
    { name: "Сказка сказок", from: 240 },
    { name: "Последняя страница", from: 361 }
  ]
};

const FIRM_AT = 3;
const DONE_TITLES = ["Молодец!", "Красавчик!", "Есть!", "Сделано!"];
const NUDGES_PIANO = ["Один подход сегодня — и ещё пара тактов твои", "15 минут за инструментом лучше, чем ноль", "Пианино скучает"];
const NUDGES_BOOK = ["Пара страниц сегодня — и книга ближе к финалу", "10 страниц перед сном — и день прожит не зря", "Книга ждёт на закладке"];
const NUDGES_PASTEL = ["Один урок сегодня — и руки в пастели", "Мелки скучают по бумаге", "Двадцать минут курса — уже движение"];
const DOW = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

/* ── Состояние ── */
let data = null;
let cfg = { token: "", gistId: "", lastSync: 0, tab: "home", period: "week", achView: null };
let period = "week";   // week | month — что показываем на «Прогрессе»
let achView = null;    // {track, pieceId} — открытый материал на вкладке наград
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
  return {
    active: "piano",
    piano: { pieces: DEFAULT_PIECES.map(p => ({ ...p, updatedAt: 0 })), activePiece: DEFAULT_PIECES[0].id, entries: [] },
    book: { book: { ...DEFAULT_BOOK, id: "snow-1", updatedAt: 0 }, entries: [] },
    pastel: { course: { ...DEFAULT_COURSE, updatedAt: 0 }, entries: [] },
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

  if (obj.piano) {
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

  if (obj.book) {
    base.book.entries = obj.book.entries || [];
    if (obj.book.book) base.book.book = Object.assign({}, DEFAULT_BOOK, obj.book.book);
  }
  if (obj.pastel) {
    base.pastel.entries = obj.pastel.entries || [];
    if (obj.pastel.course) base.pastel.course = Object.assign({}, DEFAULT_COURSE, obj.pastel.course, { lessons: DEFAULT_COURSE.lessons });
  }
  if (Number(obj.weekGoal) > 0) base.weekGoal = Math.min(7, Math.round(obj.weekGoal));
  if (Array.isArray(obj.freezes)) base.freezes = obj.freezes;
  if (Array.isArray(obj.archive)) base.archive = obj.archive;

  // записи книги и курса привязываем к конкретному материалу
  const bookId = base.book.book.id || "snow-1";
  base.book.book.id = bookId;
  base.book.entries = base.book.entries.map(e => ({ ...e, bookId: e.bookId || bookId }));
  const courseId = base.pastel.course.id || "test-drive";
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
const course = () => data.pastel.course;
// записи текущего трека, а для пианино — ещё и текущей композиции
const entries = () => isPiano()
  ? data.piano.entries.filter(e => !e.deleted && (e.pieceId || "bwv853") === piece().id)
  : isBook()
    ? data.book.entries.filter(e => !e.deleted && (e.bookId || data.book.book.id) === data.book.book.id)
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

function streak() {
  const days = new Set(entries().map(e => e.date));
  let n = 0, skipped = 0;
  const d = new Date();
  if (!days.has(dateStr(d)) && !isFrozen(dateStr(d))) d.setDate(d.getDate() - 1);
  while (true) {
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
    bars, passes: p, days: list.length, streak: streak(),
    touchedR, touchedL, firmR, firmL, maxPass,
    pctR: bars ? touchedR / bars * 100 : 0,
    pctL: bars ? touchedL / bars * 100 : 0,
    pct: bars ? (touchedR + touchedL) / (bars * 2) * 100 : 0,
    pctFirm: bars ? (firmR + firmL) / (bars * 2) * 100 : 0,
    bothInOne, maxRun, weekend, comeback
  };
}

function bookProgress() {
  const b = data.book.book;
  let page = b.startPage || 0;
  for (const e of data.book.entries.filter(e => !e.deleted)) page = Math.max(page, e.page || 0);
  return Math.min(page, b.pages);
}
function chapterAt(page) {
  let cur = data.book.book.chapters[0];
  for (const c of data.book.book.chapters) if (page >= c.from) cur = c;
  return cur;
}
function bookStats() {
  const b = data.book.book;
  const list = data.book.entries.filter(e => !e.deleted).slice().sort((a, x) => a.date < x.date ? -1 : 1);
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
    days: list.length, streak: streak(),
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
    days: list.length, streak: streak(),
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

const achList = () => isBook() ? ACH_BOOK : isPastel() ? ACH_PASTEL : ACH_PIANO;
const achWords = () => isBook() ? WORDS_BOOK : isPastel() ? WORDS_PASTEL : WORDS_PIANO;
const flavor = () => (!isBook() && !isPastel() && PIECE_FLAVOR[piece().id]) || {};
const lastName = (author) => String(author || "").trim().split(/\s+/).pop();

function achState() {
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

function saveEntry() {
  if (!gistReady()) { closeSheet(); openSettingsSheet(); return; }
  const existing = entryFor(selectedDate);
  const beforeDone = new Set(achState().filter(a => a.done).map(a => a.id));
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
  render();

  if (fresh.length) { showCheer(fresh[fresh.length - 1], fresh.length); return; }
  showDone(before, after, !!existing);
}

function showCheer(a, count) {
  $("#cheerIc").textContent = a.icon;
  $("#cheerTitle").textContent = a.name;
  $("#cheerText").textContent = wordOf(a) +
    (count > 1 ? ` · и ещё ${count - 1} ${plural(count - 1, "достижение", "достижения", "достижений")} открыто!` : "");
  $("#cheer").classList.add("show");
}

function showDone(before, after, wasExisting) {
  if (selectedDate !== todayStr()) { toast(fmtDay(selectedDate) + " отмечено"); return; }
  if (wasExisting) { toast("Запись дополнена"); return; }

  $("#cheerIc").textContent = after.streak >= 2 ? "🔥" : "🎉";
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
  text += after.streak >= 2
    ? `Серия — ${after.streak} ${plural(after.streak, "день", "дня", "дней")} подряд. Возвращайся завтра, будет ${after.streak + 1} 🔥`
    : "Возвращайся завтра — начнём серию!";
  $("#cheerText").textContent = text;
  $("#cheer").classList.add("show");
}

function deleteEntry(id) {
  const e = trackOf().entries.find(x => x.id === id);
  if (!e) return;
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
  if (isBook()) pickPage = bookProgress();
  else {
    const bars = piece().bars;
    pickFrom = Math.min(pickFrom, bars); pickTo = Math.min(pickTo, bars);
  }
}

/* ══════════ Рендер ══════════ */

function renderBanner() {
  const box = $("#banner");
  if (!box) return;

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

function render() {
  renderSeg();
  renderBanner();
  renderTabbar();
  // главная всегда влезает в экран, остальные вкладки скроллятся внутри себя
  $("#view").className = tab === "home" ? "fixed" : "scrolls";
  if (tab === "home") renderHome();
  else if (tab === "progress") renderProgress();
  else renderAch();
}

function renderSeg() {
  const box = $("#seg");
  if (tab === "progress" || tab === "ach") { box.style.display = "none"; box.innerHTML = ""; return; }
  box.style.display = "";

  $("#seg").innerHTML = [["piano", "🎹", "Пианино"], ["book", "📖", "Чтение"], ["pastel", "🎨", "Пастель"]]
    .map(([id, ic, nm]) => `<button data-t="${id}" class="${data.active === id ? "on" : ""}" type="button"><span>${ic}</span>${nm}</button>`).join("");
  document.querySelectorAll("#seg button").forEach(b =>
    b.addEventListener("click", () => switchTrack(b.dataset.t)));
}

/* ══════════ ОБЗОР: общий опыт по всем хобби ══════════ */

function overview() {
  const save = data.active, savePiece = data.piano.activePiece;

  // детализация по материалам (для списка направлений)
  const items = [];
  let pianoDone = 0, pianoTotal = 0;
  for (const p of data.piano.pieces.filter(x => !x.archived)) {
    data.active = "piano"; data.piano.activePiece = p.id;
    const s = pianoStats();
    pianoDone += s.touchedR + s.touchedL;
    pianoTotal += s.bars * 2;
    items.push({ track: "piano", icon: "🎹", full: p.name, pct: s.pct,
      note: `${s.touchedR + s.touchedL} из ${s.bars * 2} тактов-рук` });
  }

  data.active = "book";
  const b = bookStats();
  items.push({ track: "book", icon: "📖", full: data.book.book.title, pct: b.pct,
    note: `${b.page} из ${b.pages} страниц` });

  data.active = "pastel";
  const c = pastelStats();
  items.push({ track: "pastel", icon: "🎨", full: course().name, pct: c.pct,
    note: `${c.done} из ${c.lessons} уроков · ${c.minutes} мин` });

  data.active = save; data.piano.activePiece = savePiece;

  // накопление за всё время: сколько дней занимался каждым хобби
  const daysOf = (list, since) => new Set(
    list.filter(e => !e.deleted && (!since || e.date >= since)).map(e => e.date)
  ).size;
  const act = {
    piano: daysOf(data.piano.entries),
    book: daysOf(data.book.entries),
    pastel: daysOf(data.pastel.entries)
  };
  const monthAgo = dateStr(new Date(Date.now() - 29 * 864e5));
  const recent = {
    piano: daysOf(data.piano.entries, monthAgo),
    book: daysOf(data.book.entries, monthAgo),
    pastel: daysOf(data.pastel.entries, monthAgo)
  };
  const actMax = Math.max(act.piano, act.book, act.pastel);

  // прогресс по текущим материалам (пианино — среднее по всем пьесам)
  const prog = {
    piano: pianoTotal ? pianoDone / pianoTotal * 100 : 0,
    book: b.pct,
    pastel: c.pct
  };

  const meta = [
    { key: "piano",  label: "Пианино", icon: "🎹" },
    { key: "book",   label: "Чтение",  icon: "📖" },
    { key: "pastel", label: "Пастель", icon: "🎨" }
  ];

  // оси: в режиме активности лидер = 100%, остальные — доля от него
  const axes = meta.map(m => ({
    ...m,
    pct: actMax ? act[m.key] / actMax * 100 : 0,
    days: act[m.key],
    progress: prog[m.key],
    caption: act[m.key] + " " + plural(act[m.key], "день", "дня", "дней")
  }));

  const doneCount = items.filter(i => i.pct >= 100).length;
  const totalDays = daysOf([...data.piano.entries, ...data.book.entries, ...data.pastel.entries]);
  return { axes, items, act, recent, actMax, doneCount, totalDays };
}

// радар: многоугольник по осям хобби
function radarHTML(axes) {
  const W = 300, H = 250, cx = W / 2, cy = 112, R = 70;
  const n = axes.length;
  const pt = (i, r) => {
    const ang = -Math.PI / 2 + i * 2 * Math.PI / n;
    return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
  };
  const ring = (r) => axes.map((_, i) => pt(i, r).map(v => v.toFixed(1)).join(",")).join(" ");
  const shape = axes.map((a, i) => pt(i, Math.max(4, R * Math.min(1, a.pct / 100))).map(v => v.toFixed(1)).join(",")).join(" ");

  const grid = [0.25, 0.5, 0.75, 1].map(k =>
    `<polygon points="${ring(R * k)}" fill="none" stroke="rgba(255,255,255,${k === 1 ? 0.18 : 0.08})" stroke-width="1"/>`).join("");
  const spokes = axes.map((_, i) => {
    const [x, y] = pt(i, R);
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,0.08)"/>`;
  }).join("");
  const dots = axes.map((a, i) => {
    const [x, y] = pt(i, Math.max(4, R * Math.min(1, a.pct / 100)));
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#ffc94d"/>`;
  }).join("");
  const labels = axes.map((a, i) => {
    const [x, y] = pt(i, R + 24);
    const anchor = x < cx - 6 ? "end" : x > cx + 6 ? "start" : "middle";
    const dy = y < cy - 40 ? -6 : y > cy + 40 ? 8 : 0;  // верх/низ не наезжают на фигуру
    return `
      <text x="${x.toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}"
        fill="#8f89a3" font-size="11" font-weight="700">${esc(a.label)}</text>
      <text x="${x.toFixed(1)}" y="${(y + dy + 14).toFixed(1)}" text-anchor="${anchor}"
        fill="#f2eefb" font-size="11" font-weight="850">${esc(a.caption != null ? a.caption : Math.round(a.pct) + "%")}</text>`;
  }).join("");

  // высота подгоняется под реальные подписи, чтобы не было пустот
  const ys = axes.map((_, i) => pt(i, R + 24)[1]);
  const bottom = Math.max(...ys, cy + R) + 34;

  return `
    <svg class="radar" viewBox="0 0 ${W} ${Math.min(H, Math.ceil(bottom))}">
      ${grid}${spokes}
      <polygon points="${shape}" fill="rgba(255,201,77,0.22)" stroke="#ffc94d" stroke-width="2" stroke-linejoin="round"/>
      ${dots}${labels}
    </svg>`;
}

function archiveHTML() {
  const list = (data.archive || []).filter(a => !a.deleted)
    .sort((a, b) => a.finishedAt < b.finishedAt ? 1 : -1);
  if (!list.length) return "";
  const fmt = new Intl.DateTimeFormat("ru", { day: "numeric", month: "long", year: "numeric" });

  return `
    <div class="panel">
      <h3>Архив · пройдено ${list.length}</h3>
      <div class="dirs">
        ${list.map(a => `
          <div class="dir">
            <span class="di">${a.icon}</span>
            <span class="dn">${esc(a.title)}<i>${a.days} ${plural(a.days, "день", "дня", "дней")} · ${fmt.format(fromStr(a.finishedAt)).replace(" г.", "")}</i></span>
            <span class="dp done">${a.pct >= 100 ? "✓" : a.pct + "%"}</span>
          </div>`).join("")}
      </div>
    </div>`;
}

// баланс развития: три оси по накопленным дням занятий
function balanceHTML() {
  const o = overview();
  const sorted = o.axes.slice().sort((x, y) => y.pct - x.pct);
  const strong = sorted[0], weak = sorted[sorted.length - 1];
  const note = o.actMax
    ? `Больше всего занятий — ${strong.icon} <b>${esc(strong.label)}</b> (${strong.days} ${plural(strong.days, "день", "дня", "дней")}), меньше всего ${weak.icon} <b>${esc(weak.label)}</b> (${weak.days})`
    : "Отметь первое занятие — и график оживёт";

  return `
    <div class="panel">
      <h3>Баланс развития</h3>
      ${radarHTML(o.axes)}
      <div class="balance-note">${note}</div>
      <div class="recent">
        За последний месяц:
        ${o.axes.map(a => `<span>${a.icon} <b>${o.recent[a.key]}</b></span>`).join("")}
      </div>
      <div class="dirs" style="margin-top:14px">
        ${o.items.map(a => `
          <div class="dir">
            <span class="di">${a.icon}</span>
            <span class="dn">${esc(a.full)}<i>${esc(a.note)}</i></span>
            <span class="dp ${a.pct >= 100 ? "done" : ""}">${a.pct >= 100 ? "✓" : Math.round(a.pct) + "%"}</span>
          </div>`).join("")}
      </div>
    </div>`;
}

function renderOverview() {
  const o = overview();
  const sorted = o.axes.slice().sort((x, y) => y.pct - x.pct);
  const strong = sorted[0], weak = sorted[sorted.length - 1];

  const note = o.actMax
    ? `Больше всего занятий — ${strong.icon} <b>${esc(strong.label)}</b> (${strong.days} ${plural(strong.days, "день", "дня", "дней")}), меньше всего ${weak.icon} <b>${esc(weak.label)}</b> (${weak.days})`
    : "Отметь первое занятие — и график оживёт";

  const w = weekSummary(0), prev = weekSummary(1);
  const arrow = (a, b) => a > b ? `<i class="up">▲</i>` : a < b ? `<i class="down">▼</i>` : "";
  const fmtD = new Intl.DateTimeFormat("ru", { day: "numeric", month: "short" });

  $("#view").innerHTML = `
    <div class="panel">
      <h3>Итоги недели · ${fmtD.format(fromStr(w.from))} — ${fmtD.format(fromStr(w.to))}</h3>
      <div class="stats">
        <div class="stat"><b>${w.days}/${goalProgress().goal}</b><span>дней из цели</span></div>
        <div class="stat"><b>${w.bars} ${arrow(w.bars, prev.bars)}</b><span>${plural(w.bars, "такт", "такта", "тактов")}</span></div>
        <div class="stat"><b>${w.pages + w.lessons ? `${w.pages}/${w.lessons}` : "0/0"}</b><span>страниц / уроков</span></div>
      </div>
      <div class="week-cmp">На прошлой неделе: ${prev.days} ${plural(prev.days, "день", "дня", "дней")}, ${prev.bars} ${plural(prev.bars, "такт", "такта", "тактов")}, ${prev.pages} стр., ${prev.lessons} ${plural(prev.lessons, "урок", "урока", "уроков")}</div>
    </div>

    <div class="panel">
      <h3>Баланс развития</h3>
      ${radarHTML(o.axes)}
      <div class="balance-note">${note}</div>
      <div class="recent">
        За последний месяц:
        ${o.axes.map(a => `<span>${a.icon} <b>${o.recent[a.key]}</b></span>`).join("")}
      </div>
      <div class="balance-hint">
        График копит <b>дни занятий</b> за всё время и не обнуляется, когда дочитаешь книгу или разберёшь пьесу.
        Шкала относительная: у самого частого хобби — полная.
      </div>
    </div>

    ${archiveHTML()}

    <div class="panel">
      <h3>Что сейчас в работе${o.doneCount ? ` · пройдено ${o.doneCount}` : ""}</h3>
      <div class="dirs">
        ${o.items.map(a => `
          <div class="dir">
            <span class="di">${a.icon}</span>
            <span class="dn">${esc(a.full)}<i>${esc(a.note)}</i></span>
            <span class="dp ${a.pct >= 100 ? "done" : ""}">${a.pct >= 100 ? "✓" : Math.round(a.pct) + "%"}</span>
          </div>`).join("")}
      </div>
    </div>`;
}

// высота закреплённого таббара — чтобы контент точно не заезжал под него
function syncTabHeight() {
  const bar = document.querySelector(".tabbar");
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  if (h) document.documentElement.style.setProperty("--tab-h", h + "px");
}

function renderTabbar() {
  const ach = achState();
  const openCount = ach.filter(a => a.done).length;
  $("#tabbar").innerHTML = [
    ["home", "◉", "Главная"],
    ["progress", "▤", "Прогресс"],
    ["ach", "✦", `Награды ${openCount}`]
  ].map(([id, ic, nm]) =>
    `<button data-tab="${id}" class="${tab === id ? "on" : ""}" type="button"><i>${ic}</i>${nm}</button>`).join("");
  syncTabHeight();
  requestAnimationFrame(syncTabHeight);
  document.querySelectorAll("#tabbar button").forEach(b =>
    b.addEventListener("click", () => {
      tab = b.dataset.tab;
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
  <svg class="wave" viewBox="0 0 120 44" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 30 Q 15 16 30 30 T 60 30 T 90 30 T 120 30" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M0 38 Q 15 26 30 38 T 60 38 T 90 38 T 120 38" fill="none" stroke="rgba(255,255,255,.34)" stroke-width="2" stroke-linecap="round"/>
    <circle cx="93" cy="13" r="7" fill="rgba(255,201,77,.85)"/>
  </svg>`;

// одна обложка (книга, композиция или курс)
function coverHTML(p) {
  if (isPastel()) {
    const c = course();
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
  if (isBook()) {
    const b = data.book.book;
    return `
      <div class="cover book">
        <div><div class="cv-author">${esc(b.author)}</div></div>
        <div class="cv-mark">🦔</div>
        <div>
          <div class="cv-title">${esc(b.title)}</div>
          <div class="cv-sub">${esc(b.volume || "")}</div>
        </div>
      </div>`;
  }
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

// карусель обложек: свайп переключает композицию
function coverRailHTML() {
  const live = data.piano.pieces.filter(p => !p.archived);
  const list = isPiano() ? live : [null];
  const activeIdx = isPiano() ? Math.max(0, live.findIndex(p => p.id === data.piano.activePiece)) : 0;
  const slides = list.map((p, i) =>
    `<div class="slot ${i === activeIdx ? "on" : ""}" data-i="${i}">${coverHTML(p)}</div>`).join("");
  return `<div class="rail" id="rail">${slides}</div>`;
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

function renderHome() {
  const s = curStats();
  const g = goalProgress();
  const st = s.streak;
  const doneToday = !!entryFor(todayStr());
  const ach = achState();
  const open = ach.filter(a => a.done).length;

  const sub = isBook()
    ? `${esc(s.chapter.name)} · осталось ${stranic(s.pages - s.page)}`
    : isPastel()
      ? `${s.done} из ${s.lessons} уроков · ${s.minutes} мин пройдено`
      : `𝄞 ${Math.round(s.pctR)}% · 𝄢 ${Math.round(s.pctL)}%`;

  const freeze = activeFreeze();
  const nudge = freeze
    ? `🌴 Пауза до <b>${fmtRange(freeze.to, freeze.to)}</b> — серия сохранится`
    : "";

  $("#view").innerHTML = `
    <div class="hero">
      ${coverRailHTML()}
      ${ringHTML(s.pct)}
      <div class="hero-title">
        <h2>${isBook() ? esc(data.book.book.title) : isPastel() ? esc(course().name) : esc(piece().name)}</h2>
        <p>${sub}</p>
      </div>
      <button class="cta ${!gistReady() ? "locked" : doneToday ? "done" : ""}" id="ctaBtn" type="button">
        ${!gistReady()
          ? "🔒 Подключить синхронизацию"
          : doneToday
            ? '<span class="cta-ok">✅ Сегодня отмечено</span><span class="cta-add">дополнить</span>'
            : (isBook() ? "📖 Отметить чтение" : isPastel() ? "🎨 Отметить урок" : "🎹 Отметить занятие")}
      </button>
      <div class="nudge">${nudge}</div>
    </div>`;

  $("#ctaBtn").addEventListener("click", () => {
    if (!gistReady()) { openSettingsSheet(); return; }
    selectedDate = todayStr();
    openLogSheet();
  });

  setupRail();
}

/* Карусель: центрируем активную обложку и слушаем свайп */
function setupRail() {
  const rail = $("#rail");
  if (!rail) return;
  const slots = [...rail.querySelectorAll(".slot")];
  if (!slots.length) return;

  // боковые поля, чтобы крайние обложки могли встать ровно по центру
  const pad = Math.max(0, (rail.clientWidth - slots[0].offsetWidth) / 2);
  rail.style.paddingLeft = pad + "px";
  rail.style.paddingRight = pad + "px";

  // позиция центра слота внутри прокручиваемой ленты
  const centerOfSlot = (s) => {
    const r = s.getBoundingClientRect(), rr = rail.getBoundingClientRect();
    return r.left - rr.left + rail.scrollLeft + r.width / 2;
  };

  const centerOn = (i, smooth) => {
    const slot = slots[i];
    if (!slot) return;
    rail.scrollTo({ left: centerOfSlot(slot) - rail.clientWidth / 2, behavior: smooth ? "smooth" : "auto" });
  };

  const activeIdx = isBook() ? 0 : data.piano.pieces.filter(p => !p.archived).findIndex(p => p.id === data.piano.activePiece);
  centerOn(Math.max(0, activeIdx), false);

  if (isBook() || slots.length < 2) return;

  // после остановки скролла определяем, какая обложка в центре
  let t = null;
  rail.addEventListener("scroll", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const mid = rail.scrollLeft + rail.clientWidth / 2;
      let best = 0, bestDist = Infinity;
      slots.forEach((s, i) => {
        const d = Math.abs(centerOfSlot(s) - mid);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      slots.forEach((s, i) => s.classList.toggle("on", i === best));
      const target = data.piano.pieces.filter(p => !p.archived)[best];
      if (target && target.id !== data.piano.activePiece) switchPiece(target.id);
    }, 130);
  }, { passive: true });

  // тап по соседней обложке тоже переключает
  slots.forEach((s, i) => s.addEventListener("click", () => {
    if (!s.classList.contains("on")) centerOn(i, true);
  }));
}

// смена композиции без перерисовки карусели (чтобы не сбить свайп)
function switchPiece(id) {
  data.piano.activePiece = id;
  selectedDate = todayStr();
  pending = [];
  saveData();
  schedulePush();
  syncPickers();
  updateHeroInfo();
  renderTabbar();
}

function updateHeroInfo() {
  const s = curStats();
  const st = s.streak;
  const doneToday = !!entryFor(todayStr());
  const ach = achState();
  const open = ach.filter(a => a.done).length;

  const ring = $(".ring-wrap");
  if (ring) ring.outerHTML = ringHTML(s.pct);

  const title = $(".hero-title");
  if (title) title.innerHTML = `
    <h2>${esc(piece().name)}</h2>
    <p>𝄞 ${Math.round(s.pctR)}% · 𝄢 ${Math.round(s.pctL)}%</p>`;


  const cta = $("#ctaBtn");
  if (cta) {
    cta.classList.toggle("done", doneToday);
    cta.textContent = doneToday ? "✅ Сегодня отмечено · дополнить" : "🎹 Отметить занятие";
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

  const book = data.book.entries.filter(inRange);
  let pagesBefore = data.book.book.startPage || 0, pagesAfter = 0;
  for (const e of data.book.entries.filter(e => !e.deleted && e.date < from)) pagesBefore = Math.max(pagesBefore, e.page || 0);
  for (const e of book) pagesAfter = Math.max(pagesAfter, e.page || 0);
  const pages = pagesAfter ? Math.max(0, pagesAfter - pagesBefore) : 0;

  const pastel = data.pastel.entries.filter(inRange);
  let lessons = 0;
  for (const e of pastel) lessons += (e.lessons || []).length;

  const days = new Set([...piano, ...book, ...pastel].map(e => e.date)).size;
  const tracks = new Set([
    ...(piano.length ? ["piano"] : []),
    ...(book.length ? ["book"] : []),
    ...(pastel.length ? ["pastel"] : [])
  ]);
  return { days, bars, pages, lessons, tracks, entries: piano.length + book.length + pastel.length };
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
            <stop offset="0%" stop-color="rgba(255,201,77,0.35)"/>
            <stop offset="100%" stop-color="rgba(255,201,77,0)"/>
          </linearGradient>
        </defs>
        <line x1="${padX}" y1="${bottom + 2}" x2="${W - padX}" y2="${bottom + 2}" stroke="rgba(255,255,255,0.08)"/>
        <path d="${area}" fill="url(#lineFill)"/>
        <path d="${path}" fill="none" stroke="#ffc94d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${pts.map((p, i) => (i % dotEvery === 0 || p.today) ? `
          <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.today ? 5 : 3.5}"
            fill="${p.value ? "#ffc94d" : "#2a2438"}" stroke="${p.today ? "#fff" : "#ffc94d"}" stroke-width="${p.today ? 2 : 1.4}"
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
        <div class="sc ${best ? "hot" : ""}"><b>🔥 ${best}</b><span>серия</span></div>
        <div class="sc"><b>${st.days}</b><span>${plural(st.days, "день", "дня", "дней")}</span></div>
        <div class="sc"><b>${st.bars}</b><span>${plural(st.bars, "такт", "такта", "тактов")}</span></div>
        <div class="sc"><b>${st.pages}</b><span>страниц</span></div>
        <div class="sc"><b>${st.lessons}</b><span>${plural(st.lessons, "урок", "урока", "уроков")}</span></div>
      </div>

      ${lineChartHTML(periodSeries())}
      <div class="period-hint">${esc(hint)}</div>
    </div>`;
}

// лучшая серия среди всех хобби прямо сейчас
function bestStreakAll() {
  const save = data.active, savePiece = data.piano.activePiece;
  let best = 0;
  for (const p of data.piano.pieces.filter(x => !x.archived)) {
    data.active = "piano"; data.piano.activePiece = p.id;
    best = Math.max(best, streak());
  }
  data.active = "book"; best = Math.max(best, streak());
  data.active = "pastel"; best = Math.max(best, streak());
  data.active = save; data.piano.activePiece = savePiece;
  return best;
}

function renderProgress() {
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
    out.push({ track: "book", icon: "📖", title: data.book.book.title, entry: e,
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
    <div class="day-add">
      ${[["piano", "🎹"], ["book", "📖"], ["pastel", "🎨"]].map(([t, ic]) =>
        `<button class="da" data-add="${t}" type="button">${ic} отметить</button>`).join("")}
    </div>`;

  document.querySelectorAll("[data-del]").forEach(b =>
    b.addEventListener("click", () => {
      const track = b.dataset.track;
      const e = data[track].entries.find(x => x.id === b.dataset.del);
      if (!e) return;
      e.deleted = true; e.updatedAt = now();
      saveData(); schedulePush(); render();
      toast("Запись удалена");
    }));

  document.querySelectorAll("[data-add]").forEach(b =>
    b.addEventListener("click", () => {
      if (data.active !== b.dataset.add) {
        data.active = b.dataset.add;
        pending = []; pickLessons = [];
        saveData(); syncPickers();
      }
      openLogSheet();
    }));
}

// все материалы с их наградами — для входного списка
function achMaterials() {
  const save = data.active, savePiece = data.piano.activePiece;
  const out = [];

  for (const p of data.piano.pieces.filter(x => !x.archived)) {
    data.active = "piano"; data.piano.activePiece = p.id;
    const list = achState();
    out.push({ track: "piano", pieceId: p.id, icon: "🎹", title: p.name,
      open: list.filter(a => a.done).length, total: list.length });
  }
  data.active = "book";
  let list = achState();
  out.push({ track: "book", icon: "📖", title: data.book.book.title,
    open: list.filter(a => a.done).length, total: list.length });

  data.active = "pastel";
  list = achState();
  out.push({ track: "pastel", icon: "🎨", title: course().name,
    open: list.filter(a => a.done).length, total: list.length });

  data.active = save; data.piano.activePiece = savePiece;
  return out;
}

// выполняет функцию в контексте выбранного материала
function withMaterial(view, fn) {
  const save = data.active, savePiece = data.piano.activePiece;
  data.active = view.track;
  if (view.track === "piano" && view.pieceId) data.piano.activePiece = view.pieceId;
  const res = fn();
  data.active = save; data.piano.activePiece = savePiece;
  return res;
}

function renderAch() {
  if (!achView) { renderAchList(); return; }
  renderAchMaterial(achView);
}

// входной экран: материалы и сколько наград по каждому
function renderAchList() {
  const mats = achMaterials();
  const totalOpen = mats.reduce((a, m) => a + m.open, 0);
  const totalAll = mats.reduce((a, m) => a + m.total, 0);

  $("#view").innerHTML = `
    <div class="ach-top">
      <div class="ach-count"><b>${totalOpen}</b><span>из ${totalAll} наград открыто</span></div>
      <div class="ach-progress"><i style="width:${totalAll ? totalOpen / totalAll * 100 : 0}%"></i></div>
    </div>

    <div class="mat-list">
      ${mats.map(m => `
        <button class="mat-card" data-track="${m.track}" data-piece="${m.pieceId || ""}" type="button">
          <span class="mc-ic">${m.icon}</span>
          <span class="mc-body">
            <span class="mc-title">${esc(m.title)}</span>
            <span class="mc-bar"><i style="width:${m.total ? m.open / m.total * 100 : 0}%"></i></span>
          </span>
          <span class="mc-num">${m.open}<i>/${m.total}</i></span>
        </button>`).join("")}
    </div>`;

  document.querySelectorAll(".mat-card").forEach(b =>
    b.addEventListener("click", () => {
      achView = { track: b.dataset.track, pieceId: b.dataset.piece || null };
      cfg.achView = achView; saveCfg();
      renderAch();
      $("#view").scrollTop = 0;
    }));
}

// награды конкретного материала
function renderAchMaterial(view) {
  const ach = withMaterial(view, () => achState());
  const words = withMaterial(view, () => achWords());
  const title = withMaterial(view, () => isBook() ? data.book.book.title : isPastel() ? course().name : piece().name);
  const icon = view.track === "book" ? "📖" : view.track === "pastel" ? "🎨" : "🎹";
  const open = ach.filter(a => a.done).length;
  const next = ach.find(a => !a.done && !a.secret);
  let teased = 0;

  $("#view").innerHTML = `
    <button class="back" id="achBack" type="button">‹ Все материалы</button>

    <div class="ach-top">
      <div class="ach-title">${icon} ${esc(title)}</div>
      <div class="ach-count"><b>${open}</b><span>из ${ach.length} наград открыто</span></div>
      <div class="ach-progress"><i style="width:${open / ach.length * 100}%"></i></div>
      ${next ? `<div style="font-size:0.86rem;color:var(--muted)">Ближайшее: ${next.icon} <b style="color:var(--ink)">${esc(next.name)}</b> — ${esc(next.hint.toLowerCase())}</div>` : ""}
    </div>

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
    </div>`;

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
    const m = { streak3: [s.streak, 3, "дн."], streak7: [s.streak, 7, "дн."], streak14: [s.streak, 14, "дн."],
                streak30: [s.streak, 30, "дн."], days10: [s.days, 10, "занятий"], days20: [s.days, 20, "занятий"],
                samovar: [s.days, 10, "вечеров"] }[a.id];
    if (m) progressLine = `Сейчас: <b>${m[0]}</b> из ${m[1]} ${m[2]}`;
    else if (isBook() && ["fog", "half", "apple", "stars", "wolf"].includes(a.id))
      progressLine = `Сейчас прочитано: <b>${Math.round(s.pct)}%</b>`;
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

/* ══════════ Шторка ══════════ */

function openSheet(html) {
  $("#sheet").innerHTML = `<div class="grabber"></div>` + html;
  $("#sheet").classList.add("show");
  $("#sheetBg").classList.add("show");
}
function closeSheet() {
  $("#sheet").classList.remove("show");
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
  const pages = data.book.book.pages;
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
      pct: s.pct, streak: s.streak, doneToday: !!entryFor(todayStr()) });
  }
  data.active = "book";
  const b = bookStats();
  list.push({ track: "book", icon: "📖", name: data.book.book.title,
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

function diceReason(c) {
  if (c.doneToday) return "Сегодня уже отмечено, но никто не мешает повторить";
  if (c.streak >= 2) return `Серия <b>${c.streak} ${plural(c.streak, "день", "дня", "дней")}</b> — грех прерывать`;
  if (c.pct === 0) return "Ещё не начато — самое время открыть";
  if (c.pct < 25) return "Тут пока тонко — самое время подтянуть";
  if (c.pct >= 75) return "Финал близко — дожать?";
  return "Ровно то, что нужно сегодня";
}

function openDiceSheet() {
  sheetMode = "dice";
  openSheet(`
    <div class="dice-sheet">
      <div class="dice-face rolling" id="diceFace">🎲</div>
      <div class="dice-what" id="diceWhat">Бросаем…</div>
      <div class="dice-why" id="diceWhy">Кубик решает, чем заняться сегодня</div>
    </div>
    <div class="sheet-actions" id="diceActions"></div>`);
  rollDice();
}

function rollDice(except) {
  const { pick, all } = rollCandidate(except);
  const face = $("#diceFace"), what = $("#diceWhat"), why = $("#diceWhy");
  if (!face) return;

  face.className = "dice-face rolling";
  face.textContent = "🎲";
  what.textContent = "Бросаем…";
  why.textContent = "Кубик решает, чем заняться сегодня";
  $("#diceActions").innerHTML = "";

  // перебор вариантов, потом остановка
  let i = 0;
  const spin = setInterval(() => {
    const c = all[i++ % all.length];
    what.textContent = c.name;
    face.textContent = c.icon;
  }, 110);

  setTimeout(() => {
    clearInterval(spin);
    face.className = "dice-face landed";
    face.textContent = pick.icon;
    what.textContent = pick.name;
    why.innerHTML = diceReason(pick);
    $("#diceActions").innerHTML = `
      <button class="btn gold" id="diceGo" type="button">Погнали!</button>
      <button class="btn" id="diceAgain" type="button">Бросить ещё раз</button>`;

    $("#diceGo").addEventListener("click", () => {
      closeSheet();
      if (pick.track !== data.active) switchTrack(pick.track);
      if (pick.pieceId && pick.pieceId !== data.piano.activePiece) {
        data.piano.activePiece = pick.pieceId;
        saveData(); schedulePush(); syncPickers();
      }
      tab = "home"; cfg.tab = tab; saveCfg();
      render();
      toast(`Сегодня — ${pick.name}`);
    });
    $("#diceAgain").addEventListener("click", () => rollDice(pick.name));
  }, 1000);
}

// что реально видит браузер — помогает понять, откуда берётся отступ снизу
function diagLine() {
  const bar = document.querySelector(".tabbar");
  const r = bar ? bar.getBoundingClientRect() : null;
  const safe = getComputedStyle(document.documentElement).getPropertyValue("--safe-b").trim() || "0px";
  const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone ? "standalone" : "браузер";
  return `${standalone} · окно ${Math.round(innerWidth)}×${Math.round(innerHeight)} · экран ${screen.width}×${screen.height}` +
    `<br>таббар ${r ? Math.round(r.height) : "?"}px, снизу ${r ? Math.round(innerHeight - r.bottom) : "?"}px · safe-area ${safe}`;
}

/* ── История по неделям и итоги недели ── */

// последние N недель: сколько дней занимался активным материалом
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

// прогресс общей недельной цели: любой день с любым занятием
function goalProgress() {
  const from = dateStr(mondayOf(new Date()));
  const days = new Set(
    [...data.piano.entries, ...data.book.entries, ...data.pastel.entries]
      .filter(e => !e.deleted && e.date >= from).map(e => e.date)
  ).size;
  const goal = data.weekGoal || 4;
  return { days, goal, left: Math.max(0, goal - days), done: days >= goal, pct: Math.min(100, days / goal * 100) };
}

// что сделано за неделю по всем хобби (и как это по сравнению с прошлой)
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
  let pagesFrom = null, pagesTo = null;
  for (const e of data.book.entries.filter(e => !e.deleted && e.date < from)) pagesFrom = Math.max(pagesFrom || 0, e.page || 0);
  for (const e of bookEntries) pagesTo = Math.max(pagesTo || 0, e.page || 0);
  const base = Math.max(pagesFrom || 0, data.book.book.startPage || 0);
  const pages = pagesTo ? Math.max(0, pagesTo - base) : 0;

  const pastelEntries = data.pastel.entries.filter(inWeek);
  let lessons = 0;
  for (const e of pastelEntries) lessons += (e.lessons || []).length;

  const allDays = new Set([...pianoEntries, ...bookEntries, ...pastelEntries].map(e => e.date));
  return { from, to, days: allDays.size, bars, pages, lessons };
}

/* ── Архив: пройденный материал уходит в историю, дни занятий остаются ── */

function currentMaterial() {
  if (isBook()) {
    const b = data.book.book, s = bookStats();
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

  data.archive.push({
    id: uid(), track: data.active, icon: m.icon, title: m.title,
    sub: m.sub, pct: Math.round(m.pct), days,
    finishedAt: todayStr(), createdAt: now(), updatedAt: now()
  });

  if (isBook()) {
    const title = prompt("Какую книгу читаешь теперь?", "");
    if (title === null || !title.trim()) { data.archive.pop(); return; }
    const pagesStr = prompt("Сколько в ней страниц?", "300");
    const pages = Math.round(Number((pagesStr || "").replace(",", ".")));
    if (!pages || pages < 1) { data.archive.pop(); toast("Не понял число страниц"); return; }
    data.book.book = {
      id: uid(), title: title.trim(), author: "", volume: "",
      pages, startPage: 0, chapters: [{ name: "Начало", from: 1 }], updatedAt: now()
    };
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
  toast(`«${m.title}» в архиве`);
}

/* ── Пауза: отпуск и перерывы не рвут серию ── */

function archiveUI() {
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

function fmtRange(from, to) {
  const f = new Intl.DateTimeFormat("ru", { day: "numeric", month: "short" });
  return from === to ? f.format(fromStr(from)) : `${f.format(fromStr(from))} — ${f.format(fromStr(to))}`;
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
      f.deleted = true; f.updatedAt = now();
      saveData(); schedulePush();
      openSettingsSheet();
      render();
    }));
}

// сравниваем свою версию с той, что лежит на сервере
async function checkForUpdate() {
  try {
    const r = await fetch("version.json?ts=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return;
    const j = await r.json();
    if (j.version && j.version !== APP_VERSION) {
      newVersion = j.version;
      renderBanner();
    }
  } catch {}
}

async function forceUpdate() {
  toast("Обновляю…");
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch {}
  location.replace(location.pathname + "?v=" + Date.now());
}

function openSettingsSheet() {
  sheetMode = "settings";
  const connected = cfg.token && cfg.gistId;
  openSheet(`
    <h3>Настройки</h3>
    <p class="sub">Синхронизация и данные приложения</p>
    ${connected ? `
      <div class="info-note">Синхронизация через гист <b>${esc(cfg.gistId)}</b></div>
      <div class="sheet-actions">
        <button class="btn gold" id="sSync" type="button">Синхронизировать</button>
        <button class="btn danger" id="sOff" type="button">Отключить</button>
        <button class="btn" id="sUpdate" type="button">Обновить приложение</button>
        <button class="btn" id="sClose" type="button">Закрыть</button>
      </div>
      ${goalUI()}
      ${archiveUI()}
      ${freezeUI()}
      <div class="version">Версия ${APP_VERSION}</div>
      <div class="diag">${diagLine()}</div>` : `
      <div class="info-note">
        Подключи <b>GitHub Gist</b>, чтобы прогресс жил на всех устройствах.<br>
        Токен: <a href="https://github.com/settings/tokens/new?description=%D0%9F%D1%80%D0%BE%D0%BA%D0%B0%D1%87%D0%BA%D0%B0&scopes=gist" target="_blank" rel="noopener">classic со scope gist</a>
      </div>
      <input class="note-input" id="sToken" type="password" placeholder="ghp_…" autocomplete="off">
      <div class="sheet-actions">
        <button class="btn gold" id="sConnect" type="button">Подключить</button>
        <button class="btn" id="sUpdate" type="button">Обновить приложение</button>
        <button class="btn" id="sClose" type="button">Закрыть</button>
      </div>
      ${goalUI()}
      ${archiveUI()}
      ${freezeUI()}
      <div class="version">Версия ${APP_VERSION}</div>
      <div class="diag">${diagLine()}</div>`}`);

  $("#sClose").addEventListener("click", closeSheet);
  $("#sUpdate").addEventListener("click", forceUpdate);
  bindFreezeUI();
  bindGoalUI();
  bindArchiveUI();
  if (connected) {
    $("#sSync").addEventListener("click", () => { closeSheet(); syncNow(true); });
    $("#sOff").addEventListener("click", () => { cfg.token = ""; cfg.gistId = ""; saveCfg(); setSyncDot(""); closeSheet(); toast("Отключено"); });
  } else {
    $("#sConnect").addEventListener("click", () => connectGitHub($("#sToken").value.trim()));
  }
}

/* ══════════ Gist ══════════ */

function setSyncDot(state) { $("#syncDot").className = "sync-dot" + (state ? " " + state : ""); }

function gh(path, opts = {}) {
  return fetch("https://api.github.com" + path, Object.assign({
    headers: { "Authorization": "Bearer " + cfg.token, "Accept": "application/vnd.github+json" }
  }, opts));
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
        body: JSON.stringify({ description: "Прокачка — данные", public: false, files: { [GIST_FILE]: { content: JSON.stringify(exportData()) } } })
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

const exportData = () => ({ v: 6, savedAt: now(), active: data.active, weekGoal: data.weekGoal, piano: data.piano, book: data.book, pastel: data.pastel, freezes: data.freezes, archive: data.archive });

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
  syncing = true; setSyncDot("busy");
  try {
    const r = await gh("/gists/" + cfg.gistId);
    if (!r.ok) throw new Error("Ошибка сети (" + r.status + ")");
    const g = await r.json();
    const f = g.files && g.files[GIST_FILE];
    let remote = emptyData();
    if (f) {
      let txt = f.content;
      if (f.truncated && f.raw_url) txt = await (await fetch(f.raw_url)).text();
      try { remote = migrate(JSON.parse(txt)); } catch {}
    }
    data.piano.entries = mergeLists(data.piano.entries, remote.piano.entries);
    data.book.entries = mergeLists(data.book.entries, remote.book.entries);
    data.pastel.entries = mergeLists(data.pastel.entries, remote.pastel.entries);
    if (remote.weekGoal && (remote.savedAt || 0) > (cfg.lastSync || 0)) data.weekGoal = remote.weekGoal;
    data.freezes = mergeLists(data.freezes, remote.freezes);
    data.archive = mergeLists(data.archive, remote.archive);
    saveData();
    const changed = JSON.stringify([data.piano, data.book, data.pastel])
      !== JSON.stringify([remote.piano, remote.book, remote.pastel]);
    if (changed) {
      const pr = await gh("/gists/" + cfg.gistId, {
        method: "PATCH",
        body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(exportData()) } } })
      });
      if (!pr.ok) throw new Error("Не сохранилось");
    }
    cfg.lastSync = now(); saveCfg(); setSyncDot("ok");
    syncError = "";
    syncPickers(); render();
    if (manual) toast("Синхронизировано");
  } catch (e) {
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
  load();
  saveData();   // закрепляем данные в актуальной схеме сразу после миграции
  if (["home", "progress", "ach"].includes(cfg.tab)) tab = cfg.tab;
  if (["week", "month"].includes(cfg.period)) period = cfg.period;
  if (cfg.achView && cfg.achView.track) achView = cfg.achView;
  const t = new Date();
  calYear = t.getFullYear(); calMonth = t.getMonth();
  syncPickers();

  $("#gearBtn").addEventListener("click", openSettingsSheet);
  $("#diceBtn").addEventListener("click", openDiceSheet);
  $("#sheetBg").addEventListener("click", closeSheet);
  $("#cheerOk").addEventListener("click", () => $("#cheer").classList.remove("show"));
  $("#cheer").addEventListener("click", e => { if (e.target === e.currentTarget) $("#cheer").classList.remove("show"); });

  window.addEventListener("resize", syncTabHeight);
  window.addEventListener("orientationchange", () => setTimeout(syncTabHeight, 200));

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      checkForUpdate(); if (selectedDate > todayStr()) selectedDate = todayStr(); syncNow(false); render(); }
  });

  render();
  checkForUpdate();
  if (cfg.token && cfg.gistId) { setSyncDot("ok"); syncNow(false); }


}

init();
