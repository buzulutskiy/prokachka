"use strict";

/* ══════════════ Константы ══════════════ */

const LS = { data: "prokachka-data-v4", old3: "prokachka-data-v3", old2: "prokachka-data-v2", old1: "prokachka-data-v1", cfg: "prokachka-cfg-v1" };
const GIST_FILE = "prokachka.json";
const GIST_DESC = "Прокачка — трекер хобби (данные приложения)";

const DEFAULT_PIECE = { name: "Бах — Прелюдия es-moll, BWV 853", bars: 40 };

// Книга по умолчанию — Норштейн, «Снег на траве», том 1
const DEFAULT_BOOK = {
  title: "Норштейн — Снег на траве, том 1",
  pages: 361,
  startPage: 183, // прочитано до появления приложения
  chapters: [
    { name: "Феномен изображения", from: 6 },
    { name: "Цапля и журавль", from: 125 },
    { name: "Ёжик в тумане", from: 157 },
    { name: "Сказка сказок", from: 240 },
    { name: "Последняя страница", from: 361 }
  ]
};

const FIRM_AT = 3; // проходов по такту = «закреплено»

const CHEERS_PIANO = [
  "Отлично! Такты сами себя не разберут — а ты разобрал",
  "Есть! Ещё кусочек прелюдии твой",
  "Красавчик, Бах бы одобрил",
  "Сессия засчитана. Руки помнят!"
];
const CHEERS_BOOK = [
  "Отлично! Ещё несколько страниц позади",
  "Есть! Книга движется",
  "Хорошо идёт — Норштейн бы одобрил",
  "Прочитано и записано"
];

const DONE_TITLES = ["Молодец!", "Красавчик!", "Есть!", "Сделано!", "Вот это дисциплина!"];

const NUDGES_PIANO = [
  "Один подход сегодня — и ещё пара тактов твои",
  "15 минут за инструментом лучше, чем ноль",
  "Пианино скучает. Загляни к нему сегодня"
];
const NUDGES_BOOK = [
  "Пара страниц сегодня — и книга ближе к финалу",
  "10 страниц перед сном — и день прожит не зря",
  "Книга ждёт на закладке"
];

const DOW = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

/* ══════════════ Состояние ══════════════ */

let data = null;
let cfg = { token: "", gistId: "", lastSync: 0 };

let calYear, calMonth;
let selectedDate = todayStr();
let pickHand = "right", pickFrom = 1, pickTo = 1, pending = [];  // пианино
let pickPage = 0;                                                // книга
let addMode = false;
let pushTimer = null, syncing = false;

const $ = (s) => document.querySelector(s);

/* ══════════════ Утилиты ══════════════ */

function uid() { return crypto.randomUUID(); }
function now() { return Date.now(); }

function todayStr() { return dateStr(new Date()); }
function dateStr(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function fromStr(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function daysBetween(a, b) { return Math.round((fromStr(b) - fromStr(a)) / 864e5); }

function fmtDay(s) {
  const t = todayStr();
  if (s === t) return "сегодня";
  if (s === dateStr(new Date(Date.now() - 864e5))) return "вчера";
  return new Intl.DateTimeFormat("ru", { day: "numeric", month: "long" }).format(fromStr(s));
}

function esc(v) {
  return String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function toast(text) {
  const el = $("#toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove("show"), 2400);
}

function plural(n, one, few, many) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}

function takty(n) { return `${n} ${plural(n, "такт", "такта", "тактов")}`; }
function stranic(n) { return `${n} ${plural(n, "страница", "страницы", "страниц")}`; }
function handIcon(h) { return h === "left" ? "𝄢" : "𝄞"; }
function spanText(s) {
  return `${handIcon(s.hand)} ${s.from === s.to ? s.from + "-й такт" : s.from + "–" + s.to}`;
}

function rnd(list) { return list[Math.floor(Math.random() * list.length)]; }

/* ══════════════ Хранилище и миграция ══════════════ */

function emptyData() {
  return {
    active: "piano",
    piano: { piece: { ...DEFAULT_PIECE, updatedAt: 0 }, entries: [] },
    book: { book: { ...DEFAULT_BOOK, updatedAt: 0 }, entries: [] }
  };
}

// Любая прошлая схема → v4 {active, piano:{piece,entries}, book:{book,entries}}
function migrate(obj) {
  const base = emptyData();
  if (!obj || typeof obj !== "object") return base;

  // v4
  if (obj.piano || obj.book) {
    if (obj.piano) {
      base.piano.entries = obj.piano.entries || [];
      if (obj.piano.piece) base.piano.piece = obj.piano.piece;
    }
    if (obj.book) {
      base.book.entries = obj.book.entries || [];
      if (obj.book.book) base.book.book = Object.assign({}, DEFAULT_BOOK, obj.book.book);
    }
    if (obj.active === "book" || obj.active === "piano") base.active = obj.active;
    return base;
  }

  // v3: {piece, entries:[{spans}]}
  if (Array.isArray(obj.entries) && obj.entries.some(e => Array.isArray(e.spans))) {
    base.piano.piece = obj.piece || base.piano.piece;
    base.piano.entries = obj.entries;
    return base;
  }
  // v2: entries с right/left
  if (Array.isArray(obj.entries)) {
    base.piano.piece = obj.piece || base.piano.piece;
    base.piano.entries = obj.entries.map(e => {
      const spans = [];
      if (e.right) spans.push({ hand: "right", from: 1, to: e.right });
      if (e.left) spans.push({ hand: "left", from: 1, to: e.left });
      return { id: e.id, date: e.date, spans, note: e.note || "", createdAt: e.createdAt || 0, updatedAt: e.updatedAt || 0, deleted: e.deleted };
    });
    return base;
  }
  // v1: sessions
  if (Array.isArray(obj.sessions)) {
    base.piano.entries = obj.sessions.map(s => ({
      id: s.id, date: s.date, spans: [], note: s.note || "",
      createdAt: s.createdAt || 0, updatedAt: s.updatedAt || 0, deleted: s.deleted
    }));
  }
  return base;
}

function load() {
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(LS.data) || "null")
      || JSON.parse(localStorage.getItem(LS.old3) || "null")
      || JSON.parse(localStorage.getItem(LS.old2) || "null")
      || JSON.parse(localStorage.getItem(LS.old1) || "null");
  } catch {}
  data = migrate(raw);
  try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem(LS.cfg)) || {}); } catch {}
}

function saveData() { localStorage.setItem(LS.data, JSON.stringify(data)); }
function saveCfg() { localStorage.setItem(LS.cfg, JSON.stringify(cfg)); }

/* ══════════════ Общие выборки ══════════════ */

function isBook() { return data.active === "book"; }
function track() { return isBook() ? data.book : data.piano; }
function entries() { return track().entries.filter(e => !e.deleted); }
function entryFor(date) { return entries().find(e => e.date === date); }

function streak() {
  const days = new Set(entries().map(e => e.date));
  let n = 0;
  const d = new Date();
  if (!days.has(dateStr(d))) d.setDate(d.getDate() - 1);
  while (days.has(dateStr(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function mondayOf(d) {
  const r = new Date(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  return r;
}

/* ══════════════ Пианино: статистика ══════════════ */

function passes() {
  const bars = data.piano.piece.bars;
  const right = new Array(bars + 1).fill(0);
  const left = new Array(bars + 1).fill(0);
  for (const e of data.piano.entries.filter(e => !e.deleted)) {
    for (const s of e.spans || []) {
      const arr = s.hand === "left" ? left : right;
      for (let b = Math.max(1, s.from); b <= Math.min(bars, s.to); b++) arr[b]++;
    }
  }
  return { right, left };
}

function pianoStats() {
  const bars = data.piano.piece.bars;
  const p = passes();
  const list = data.piano.entries.filter(e => !e.deleted).slice().sort((a, b) => a.date < b.date ? -1 : 1);
  const count = (arr, min) => arr.slice(1).filter(v => v >= min).length;

  const touchedR = count(p.right, 1), touchedL = count(p.left, 1);
  const firmR = count(p.right, FIRM_AT), firmL = count(p.left, FIRM_AT);
  const maxPass = Math.max(0, ...p.right.slice(1), ...p.left.slice(1));

  let bothInOne = false, maxRun = 0, weekend = false, comeback = false, prev = null;
  for (const e of list) {
    if (new Set((e.spans || []).map(s => s.hand)).size >= 2) bothInOne = true;
    for (const s of e.spans || []) maxRun = Math.max(maxRun, s.to - s.from + 1);
    const dow = fromStr(e.date).getDay();
    if (dow === 0 || dow === 6) weekend = true;
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

/* ══════════════ Книга: статистика ══════════════ */

function bookProgress() {
  const b = data.book.book;
  let page = b.startPage || 0;
  for (const e of data.book.entries.filter(e => !e.deleted)) page = Math.max(page, e.page || 0);
  return Math.min(page, b.pages);
}

function chapterAt(page) {
  const ch = data.book.book.chapters;
  let cur = ch[0];
  for (const c of ch) if (page >= c.from) cur = c;
  return cur;
}

function chapterRanges() {
  const b = data.book.book;
  return b.chapters.map((c, i) => ({
    ...c,
    to: (b.chapters[i + 1] ? b.chapters[i + 1].from - 1 : b.pages)
  }));
}

function bookStats() {
  const b = data.book.book;
  const list = data.book.entries.filter(e => !e.deleted).slice().sort((a, b2) => a.date < b2.date ? -1 : 1);
  const page = bookProgress();

  let maxJump = 0, weekend = false, comeback = false, notes = 0, reread = false;
  let running = b.startPage || 0, prev = null;
  for (const e of list) {
    const jump = (e.page || 0) - running;
    if (jump > maxJump) maxJump = jump;
    if ((e.page || 0) < running) reread = true;
    running = Math.max(running, e.page || 0);
    if (e.note) notes++;
    const dow = fromStr(e.date).getDay();
    if (dow === 0 || dow === 6) weekend = true;
    if (prev && daysBetween(prev, e.date) >= 7) comeback = true;
    prev = e.date;
  }

  const ranges = chapterRanges();
  const chaptersDone = ranges.filter(c => page >= c.to).length;

  return {
    pages: b.pages, page, pct: b.pages ? page / b.pages * 100 : 0,
    days: list.length, streak: streak(),
    maxJump, weekend, comeback, notes, reread, chaptersDone,
    chapter: chapterAt(page), ranges
  };
}

/* ══════════════ Достижения ══════════════ */

const ACH_PIANO = [
  { id: "first",    icon: "🌱", name: "Первое касание",      hint: "Отметить первое занятие",               test: s => s.days >= 1 },
  { id: "bar1",     icon: "🎯", name: "Первый такт",         hint: "Разобрать хотя бы один такт",           test: s => s.touchedR + s.touchedL >= 1 },
  { id: "r10",      icon: "𝄞", name: "Правая проснулась",   hint: "10% правой руки",                       test: s => s.pctR >= 10 },
  { id: "l10",      icon: "𝄢", name: "Левая подтянулась",   hint: "10% левой руки",                        test: s => s.pctL >= 10 },
  { id: "both",     icon: "🤲", name: "В четыре руки",       hint: "Обе руки за одно занятие",              test: s => s.bothInOne },
  { id: "again",    icon: "🔁", name: "А ну-ка ещё разок",   hint: "Пройти один такт трижды",               test: s => s.maxPass >= 3 },
  { id: "streak3",  icon: "🔥", name: "Три дня подряд",      hint: "Серия из 3 дней",                       test: s => s.streak >= 3 },
  { id: "q1",       icon: "🧗", name: "Четверть пути",       hint: "25% композиции",                        test: s => s.pct >= 25 },
  { id: "run8",     icon: "🏃", name: "Длинный забег",       hint: "8 тактов подряд за одно занятие",       test: s => s.maxRun >= 8 },
  { id: "weekend",  icon: "🎩", name: "Выходной у рояля",    hint: "Позаниматься в субботу или воскресенье", test: s => s.weekend, secret: true },
  { id: "streak7",  icon: "🗓️", name: "Неделя без пропусков", hint: "Серия из 7 дней",                     test: s => s.streak >= 7 },
  { id: "stubborn", icon: "🪨", name: "Упрямец",             hint: "Один такт — семь раз",                  test: s => s.maxPass >= 7, secret: true },
  { id: "r50",      icon: "🌗", name: "Половина правой",     hint: "50% правой руки",                       test: s => s.pctR >= 50 },
  { id: "l50",      icon: "🌗", name: "Половина левой",      hint: "50% левой руки",                        test: s => s.pctL >= 50 },
  { id: "half",     icon: "⛰️", name: "Половина пути",       hint: "50% композиции",                        test: s => s.pct >= 50 },
  { id: "firm10",   icon: "🧱", name: "Крепкий фундамент",   hint: `10 тактов пройдены по ${FIRM_AT} раза`, test: s => s.firmR + s.firmL >= 10 },
  { id: "days20",   icon: "📚", name: "Двадцать вечеров",    hint: "20 занятий всего",                      test: s => s.days >= 20 },
  { id: "comeback", icon: "🌙", name: "Возвращение",         hint: "Вернуться после недельного перерыва",   test: s => s.comeback, secret: true },
  { id: "streak14", icon: "💎", name: "Две недели подряд",   hint: "Серия из 14 дней",                      test: s => s.streak >= 14 },
  { id: "q3",       icon: "🧠", name: "Три четверти",        hint: "75% композиции",                        test: s => s.pct >= 75 },
  { id: "streak30", icon: "👑", name: "Месяц дисциплины",    hint: "Серия из 30 дней",                      test: s => s.streak >= 30 },
  { id: "r100",     icon: "🏅", name: "Правая рука готова",  hint: "100% правой руки",                      test: s => s.pctR >= 100 },
  { id: "l100",     icon: "🏅", name: "Левая рука готова",   hint: "100% левой руки",                       test: s => s.pctL >= 100 },
  { id: "all100",   icon: "🎼", name: "Вся вещь пройдена",   hint: "100% композиции обеими руками",         test: s => s.pct >= 100 },
  { id: "polished", icon: "💍", name: "Отшлифовано",         hint: `Каждый такт пройден по ${FIRM_AT} раза`, test: s => s.pctFirm >= 100 },
  { id: "bach",     icon: "🏆", name: "Бах доволен",         hint: "Разобрать вещь целиком и отшлифовать",  test: s => s.pct >= 100 && s.pctFirm >= 100 && s.days >= 30, secret: true }
];

const ACH_BOOK = [
  { id: "open",     icon: "🔖", name: "Закладка легла",        hint: "Отметить первое чтение",                test: s => s.days >= 1 },
  { id: "image",    icon: "🎞️", name: "Феномен изображения",   hint: "Дочитать первую главу",                 test: s => s.page >= 124 },
  { id: "heron",    icon: "🕊️", name: "Вечная погоня",         hint: "Дочитать главу «Цапля и журавль»",      test: s => s.page >= 156 },
  { id: "fog",      icon: "🌫️", name: "Вошёл в туман",         hint: "25% книги",                             test: s => s.pct >= 25 },
  { id: "p20",      icon: "📗", name: "Хороший вечер",         hint: "20 страниц за один раз",                test: s => s.maxJump >= 20 },
  { id: "p200",     icon: "🚩", name: "Двухсотая",             hint: "Дочитать до 200-й страницы",            test: s => s.page >= 200 },
  { id: "half",     icon: "🌗", name: "Экватор",               hint: "50% книги",                             test: s => s.pct >= 50 },
  { id: "streak3",  icon: "🔥", name: "Три вечера подряд",     hint: "Серия из 3 дней",                       test: s => s.streak >= 3 },
  { id: "note",     icon: "✍️", name: "На полях",              hint: "Оставить заметку к записи",             test: s => s.notes >= 1, secret: true },
  { id: "horse",    icon: "🐴", name: "А лошадка-то в тумане", hint: "Вернуться назад по страницам",          test: s => s.reread, secret: true },
  { id: "hedgehog", icon: "🦔", name: "Ёжик вышел из тумана",  hint: "Дочитать главу «Ёжик в тумане»",        test: s => s.page >= 239 },
  { id: "owl",      icon: "🦉", name: "Филин следит",          hint: "Почитать в субботу или воскресенье",    test: s => s.weekend, secret: true },
  { id: "samovar",  icon: "🫖", name: "Медвежонок ждёт с самоваром", hint: "10 вечеров с книгой",             test: s => s.days >= 10 },
  { id: "p50",      icon: "🚀", name: "Проглотил залпом",      hint: "50 страниц за один раз",                test: s => s.maxJump >= 50 },
  { id: "streak7",  icon: "🗓️", name: "Неделя с книгой",       hint: "Серия из 7 дней",                       test: s => s.streak >= 7 },
  { id: "apple",    icon: "🍎", name: "Вечное яблоко",         hint: "75% книги",                             test: s => s.pct >= 75 },
  { id: "coat",     icon: "🧣", name: "Как «Шинель»",          hint: "Вернуться после долгого перерыва",      test: s => s.comeback, secret: true },
  { id: "streak14", icon: "💎", name: "Две недели подряд",     hint: "Серия из 14 дней",                      test: s => s.streak >= 14 },
  { id: "tale",     icon: "🌌", name: "Сказка сказок",         hint: "Дочитать главу «Сказка сказок»",        test: s => s.page >= 360 },
  { id: "stars",    icon: "🌟", name: "Звёзды над колодцем",   hint: "90% книги",                             test: s => s.pct >= 90 },
  { id: "days20",   icon: "📚", name: "Двадцать вечеров",      hint: "20 вечеров с книгой",                   test: s => s.days >= 20 },
  { id: "streak30", icon: "👑", name: "Месяц с книгой",        hint: "Серия из 30 дней",                      test: s => s.streak >= 30 },
  { id: "wolf",     icon: "🐺", name: "Волчок унёс книжку",    hint: "Дочитать книгу до конца",               test: s => s.pct >= 100 },
  { id: "snow",     icon: "🏆", name: "Снег на траве",         hint: "Прочитать том целиком за 20+ вечеров",  test: s => s.pct >= 100 && s.days >= 20, secret: true }
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
  firm10: "Десять тактов не просто пройдены — они закреплены",
  r100: "Правая рука знает прелюдию от первой до последней ноты",
  l100: "Левая рука прошла всю вещь. Фундамент готов",
  all100: "Вся прелюдия пройдена обеими руками. Огромная работа!",
  polished: "Каждый такт отшлифован. Теперь это твоя музыка",
  bach: "Ты прошёл её целиком, закрепил и не бросил. Бах бы пожал руку",
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
  fog: "Туман сгущается, за спиной — четверть книги. Ни шагу назад... хотя можно",
  p20: "Двадцать страниц за вечер. Медвежонок бы уже заждался с самоваром",
  p200: "Двухсотая взята. Дальше по тексту — только глубже в лес",
  half: "Экватор! Ровно половина. Отсюда книга читается сама",
  note: "Мысль на полях дороже десяти прочитанных страниц. Норштейн бы одобрил блокнот",
  horse: "Лошадка то появляется, то исчезает — и ты вернулся на страницы назад. Правильно, там было важное",
  hedgehog: "«Медвежоно-о-ок!» — Ёжик выбрался из тумана, и глава закрыта",
  owl: "Филин ходит за тобой по выходным и подглядывает, как ты читаешь. Пусть завидует",
  samovar: "Десять вечеров с книгой. Самовар остыл, можжевеловые веточки кончились, а ты всё читаешь",
  p50: "Пятьдесят страниц за один присест — проглотил, как Волчок",
  streak7: "Неделя без пропусков. Книга уже часть вечернего ритуала",
  apple: "Три четверти. То самое вечное яблоко в росе — почти дотянулся",
  coat: "Норштейн делает «Шинель» десятилетиями и не бросает. Ты вернулся после перерыва — из той же породы",
  streak14: "Две недели подряд. Такое упорство встречается реже, чем законченная «Шинель»",
  tale: "«Сказка сказок» прочитана — самое личное, что он снял. Волчок, война, танго и вечное яблоко",
  stars: "Девяносто процентов. Звёзды над колодцем уже видно — осталось совсем чуть-чуть",
  days20: "Двадцать вечеров с этим томом. Уже не чтение, а отношения",
  streak30: "Месяц с книгой без единого пропуска. Это уровень характера",
  wolf: "Волчок пришёл и унёс книжку — потому что ты дочитал её до последней страницы!",
  snow: "«Снег на траве» — от корки до корки, вечер за вечером. Настоящее чтение, без перемотки"
};

function achWords() { return isBook() ? WORDS_BOOK : WORDS_PIANO; }

function achList() { return isBook() ? ACH_BOOK : ACH_PIANO; }
function curStats() { return isBook() ? bookStats() : pianoStats(); }

function achState() {
  const s = curStats();
  return achList().map(a => ({ ...a, done: !!a.test(s) }));
}

/* ══════════════ Действия ══════════════ */

function normSpan(hand, from, to) {
  const bars = data.piano.piece.bars;
  let f = Math.max(1, Math.min(bars, from));
  let t = Math.max(1, Math.min(bars, to));
  if (t < f) [f, t] = [t, f];
  return { hand, from: f, to: t };
}

function currentSpans() {
  if (pending.length) return pending.slice();
  return pickHand === "both"
    ? [normSpan("right", pickFrom, pickTo), normSpan("left", pickFrom, pickTo)]
    : [normSpan(pickHand, pickFrom, pickTo)];
}

function addPending() {
  pending.push(...(pickHand === "both"
    ? [normSpan("right", pickFrom, pickTo), normSpan("left", pickFrom, pickTo)]
    : [normSpan(pickHand, pickFrom, pickTo)]));
  toast("Фрагмент добавлен — выбери следующий");
  renderLog();
}

function saveDay() {
  const existing = entryFor(selectedDate);
  if (existing && !addMode) {
    toast(selectedDate === todayStr() ? "Сегодня уже отмечено — возвращайся завтра!" : "Этот день уже отмечен");
    return;
  }

  const beforeDone = new Set(achState().filter(a => a.done).map(a => a.id));
  const before = curStats();
  const note = $("#noteInput").value.trim();
  let payload;

  if (isBook()) {
    payload = { page: pickPage };
  } else {
    payload = { spans: currentSpans() };
  }

  if (existing) {
    if (isBook()) existing.page = Math.max(existing.page || 0, pickPage);
    else existing.spans = (existing.spans || []).concat(payload.spans);
    if (note) existing.note = existing.note ? existing.note + "; " + note : note;
    existing.updatedAt = now();
  } else {
    track().entries.push(Object.assign({
      id: uid(), date: selectedDate, note, createdAt: now(), updatedAt: now()
    }, payload));
  }

  $("#noteInput").value = "";
  pending = [];
  addMode = false;
  saveData();
  schedulePush();

  const after = curStats();
  const pop = $("#xpPop");
  if (isBook()) {
    const gained = after.page - before.page;
    pop.textContent = gained > 0 ? "+" + stranic(gained) : "📖";
  } else {
    const dPct = after.pct - before.pct;
    pop.textContent = dPct >= 0.05 ? "+" + dPct.toFixed(1).replace(".", ",") + "%" : "🎹";
  }
  pop.classList.remove("go");
  void pop.offsetWidth;
  pop.classList.add("go");

  render();

  const fresh = achState().filter(a => a.done && !beforeDone.has(a.id));
  if (fresh.length) { showAchievement(fresh[fresh.length - 1], fresh.length); return; }

  if (selectedDate === todayStr() && !existing) showDone(before, after);
  else if (existing) toast("Запись дополнена");
  else toast(`${fmtDay(selectedDate)} отмечено · ` + rnd(isBook() ? CHEERS_BOOK : CHEERS_PIANO));
}

function showAchievement(a, count) {
  $("#lvlupNum").textContent = a.icon;
  $("#lvlupName").textContent = a.name;
  $("#lvlupDesc").textContent = (achWords()[a.id] || a.hint) + (count > 1 ? ` · и ещё ${count - 1} ${plural(count - 1, "достижение", "достижения", "достижений")} открыто!` : "");
  $("#lvlup").classList.add("show");
}

function showDone(before, after) {
  const st = after.streak;
  $("#doneEmoji").textContent = st >= 2 ? "🔥" : "🎉";
  $("#doneTitle").textContent = rnd(DONE_TITLES);

  let text;
  if (isBook()) {
    const gained = after.page - before.page;
    text = gained > 0
      ? `Дочитал до ${after.page}-й страницы (+${stranic(gained)}), это ${Math.round(after.pct)}% книги. `
      : "Перечитывал уже пройденное — тоже дело. ";
    text += `Сейчас: ${after.chapter.name}. `;
  } else {
    const gained = (after.touchedR + after.touchedL) - (before.touchedR + before.touchedL);
    text = gained > 0
      ? `+${takty(gained)} к разбору, всего ${Math.round(after.pct)}%. `
      : "Повторение — эти такты стали крепче. ";
  }
  if (st >= 2) text += `Серия — ${st} ${plural(st, "день", "дня", "дней")} подряд, возвращайся завтра, будет ${st + 1} 🔥`;
  else text += "Возвращайся завтра — начнём серию!";
  $("#doneText").textContent = text;

  $("#doneOv").classList.add("show");
}

function goToDate(ds) {
  if (ds > todayStr()) { toast("Это ещё в будущем 🙂"); return; }
  selectedDate = ds;
  pending = [];
  addMode = false;
  const d = fromStr(ds);
  calYear = d.getFullYear();
  calMonth = d.getMonth();
  render();
}

function shiftDay(delta) {
  const d = fromStr(selectedDate);
  d.setDate(d.getDate() + delta);
  goToDate(dateStr(d));
}

function switchTrack(which) {
  if (data.active === which) return;
  data.active = which;
  pending = [];
  addMode = false;
  selectedDate = todayStr();
  const t = new Date();
  calYear = t.getFullYear(); calMonth = t.getMonth();
  syncPickers();
  saveData();
  schedulePush();
  render();
}

function deleteEntry(id) {
  const e = track().entries.find(x => x.id === id);
  if (!e) return;
  e.deleted = true;
  e.updatedAt = now();
  saveData();
  schedulePush();
  syncPickers();
  render();
  toast("Запись удалена");
}

function editSubject() {
  if (isBook()) {
    const b = data.book.book;
    const title = prompt("Название книги:", b.title);
    if (title === null) return;
    const pagesStr = prompt("Сколько в ней страниц?", String(b.pages));
    if (pagesStr === null) return;
    const pages = Math.round(Number(pagesStr.replace(",", ".")));
    if (!pages || pages < 1 || pages > 20000) { toast("Не понял число страниц"); return; }
    b.title = title.trim() || b.title;
    b.pages = pages;
    b.updatedAt = now();
  } else {
    const p = data.piano.piece;
    const name = prompt("Название композиции:", p.name);
    if (name === null) return;
    const barsStr = prompt("Сколько в ней тактов?", String(p.bars));
    if (barsStr === null) return;
    const bars = Math.round(Number(barsStr.replace(",", ".")));
    if (!bars || bars < 1 || bars > 2000) { toast("Не понял число тактов"); return; }
    p.name = name.trim() || p.name;
    p.bars = bars;
    p.updatedAt = now();
  }
  syncPickers();
  saveData();
  schedulePush();
  render();
}

/* ══════════════ Рендер ══════════════ */

function syncPickers() {
  if (isBook()) {
    pickPage = bookProgress();
  } else {
    const bars = data.piano.piece.bars;
    pickFrom = Math.min(pickFrom, bars);
    pickTo = Math.min(pickTo, bars);
  }
}

function render() {
  renderTabs();
  renderSubject();
  renderToday();
  renderLog();
  renderWeek();
  renderCalendar();
  renderDay();
}

function renderTabs() {
  $("#hobbyTabs").innerHTML = [
    ["piano", "🎹", "Пианино"],
    ["book", "📖", "Чтение"]
  ].map(([id, ic, name]) =>
    `<button class="htab ${data.active === id ? "on" : ""}" data-t="${id}" type="button"><span>${ic}</span><span>${name}</span></button>`
  ).join("");

  document.querySelectorAll(".htab").forEach(b =>
    b.addEventListener("click", () => switchTrack(b.dataset.t)));
}

function barMap(arr, cls) {
  const bars = data.piano.piece.bars;
  let cells = "";
  for (let b = 1; b <= bars; b++) {
    const n = arr[b] || 0;
    const lvl = n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : 3;
    const tick = b % 10 === 0 && b !== bars ? " tick" : "";
    cells += `<i class="bar l${lvl} ${cls}${tick}" title="Такт ${b}: ${n ? n + " " + plural(n, "проход", "прохода", "проходов") : "не разобран"}"></i>`;
  }
  return `<div class="bar-strip" style="--n:${bars}">${cells}</div>`;
}

function renderSubject() {
  const ach = achState();
  const openCount = ach.filter(a => a.done).length;
  const next = ach.find(a => !a.done && !a.secret);
  const s = curStats();

  const head = isBook()
    ? `<div class="level-badge"><b>${Math.round(s.pct)}<i>%</i></b></div>
       <div class="level-title">
         <div class="lname">${esc(data.book.book.title)}</div>
         <div class="ldesc">прочитано ${s.page} из ${s.pages} стр. · <button class="piece-edit" id="subjEdit" type="button">изменить</button></div>
       </div>`
    : `<div class="level-badge"><b>${Math.round(s.pct)}<i>%</i></b></div>
       <div class="level-title">
         <div class="lname">${esc(data.piano.piece.name)}</div>
         <div class="ldesc">разобрано · ${s.bars} тактов · <button class="piece-edit" id="subjEdit" type="button">изменить</button></div>
       </div>`;

  const body = isBook() ? renderBookBody(s) : `
      <div class="hand">
        <div class="hand-head"><span>𝄞 Правая · скрипичный ключ</span><b>${Math.round(s.pctR)}%</b></div>
        ${barMap(s.passes.right, "r")}
      </div>
      <div class="hand">
        <div class="hand-head"><span>𝄢 Левая · басовый ключ</span><b>${Math.round(s.pctL)}%</b></div>
        ${barMap(s.passes.left, "l")}
      </div>
      <div class="legend">
        <span><i class="bar l0"></i> не трогал</span>
        <span><i class="bar l1 r"></i> разобрал</span>
        <span><i class="bar l3 r"></i> закрепил (${FIRM_AT}+)</span>
      </div>`;

  $("#levelBlock").innerHTML = `
    <div class="level-card">
      <div class="level-top">${head}</div>
      ${body}
      <div class="level-next">
        Открыто достижений: <b>${openCount} из ${ach.length}</b>${next ? ` · ближайшее: ${next.icon} <b>${esc(next.name)}</b> — ${esc(next.hint.toLowerCase())}` : " — все!"}
      </div>
      <button class="ladder-toggle" id="ladderBtn" type="button">Достижения ›</button>
      <div class="ladder" id="ladder">
        ${(() => {
          let teased = 0;
          return ach.map(a => {
            if (a.done) return `
              <div class="lrow done">
                <span class="ln">${a.icon}</span><span class="lt">${esc(a.name)}</span>
                <span class="lh">открыто</span><span class="ld">${esc(achWords()[a.id] || a.hint)}</span>
              </div>`;
            if (!a.secret && teased < 2) {
              teased++;
              return `
                <div class="lrow now">
                  <span class="ln">🔒</span><span class="lt">${esc(a.name)}</span>
                  <span class="lh"></span><span class="ld">${esc(a.hint)}</span>
                </div>`;
            }
            return `
              <div class="lrow locked">
                <span class="ln">🔒</span><span class="lt">???</span>
                <span class="lh"></span><span class="ld">Откроется по ходу</span>
              </div>`;
          }).join("");
        })()}
      </div>
    </div>`;

  $("#subjEdit").addEventListener("click", editSubject);
  $("#ladderBtn").addEventListener("click", () => {
    const open = $("#ladder").classList.toggle("open");
    $("#ladderBtn").textContent = open ? "Свернуть ‹" : "Достижения ›";
  });
}

function renderBookBody(s) {
  return `
    <div class="pages-bar">
      <div class="pages-fill" style="width:${s.pct.toFixed(1)}%"></div>
    </div>
    <div class="pages-under">
      <span>Сейчас: <b>${esc(s.chapter.name)}</b></span>
      <span>осталось ${stranic(Math.max(0, s.pages - s.page))}</span>
    </div>`;
}

function renderToday() {
  const doneToday = !!entryFor(todayStr());
  const st = streak();
  let cls, emoji, text;

  if (doneToday) {
    cls = "done";
    emoji = "✅";
    text = `На сегодня — всё, молодец! Возвращайся завтра — серия станет <b>${st + 1} ${plural(st + 1, "день", "дня", "дней")}</b>`;
  } else {
    cls = "call";
    const s = curStats();
    const next = achState().find(a => !a.done && !a.secret);

    if (st >= 2) {
      emoji = "🔥";
      text = `Серия — <b>${st} ${plural(st, "день", "дня", "дней")} подряд</b>! ${isBook() ? "Почитаешь" : "Сыграешь"} сегодня — будет ${st + 1}`;
    } else if (st === 1) {
      emoji = isBook() ? "📖" : "🎹";
      text = `Вчера занимался — ${isBook() ? "почитай" : "сыграй"} сегодня, и <b>начнётся серия</b>`;
    } else if (next && s.days > 0) {
      emoji = "⚡";
      text = `Следующее достижение: ${next.icon} <b>${esc(next.name)}</b> — ${esc(next.hint.toLowerCase())}`;
    } else {
      const seed = todayStr().split("-").reduce((a, x) => a + Number(x), 0);
      emoji = isBook() ? "📖" : "🎹";
      const list = isBook() ? NUDGES_BOOK : NUDGES_PIANO;
      text = list[seed % list.length];
    }
  }

  $("#todayBlock").innerHTML = `
    <div class="today-card ${cls}">
      <span class="today-emoji">${emoji}</span>
      <span class="today-text">${text}</span>
    </div>`;
}

function renderLog() {
  $("#logLabel").textContent = isBook() ? "Отметить чтение" : "Отметить занятие";
  $("#logDay").textContent = fmtDay(selectedDate);
  $("#dayNext").disabled = selectedDate >= todayStr();

  const entry = entryFor(selectedDate);
  const marked = !!entry;
  const box = $("#logBox");

  if (marked && !addMode) {
    const empty = isBook() ? !entry.page : !(entry.spans || []).length;
    box.innerHTML = empty
      ? `<div class="marked-note need">
           <span>📝 День отмечен, но ${isBook() ? "страница не указана" : "такты не указаны"}</span>
           <button id="addMore" type="button">＋ указать</button>
         </div>`
      : `<div class="marked-note">
           <span>✅ ${selectedDate === todayStr() ? "Сегодня уже отмечено" : "Этот день отмечен"}</span>
           <button id="addMore" type="button">＋ дополнить</button>
         </div>`;
    $("#noteRow").style.display = "none";
    $("#addMore").addEventListener("click", () => { addMode = true; renderLog(); });
  } else {
    $("#noteRow").style.display = "";
    box.innerHTML = isBook() ? bookLogUI() : pianoLogUI();
    isBook() ? bindBookLog() : bindPianoLog();
  }

  const btn = $("#logBtn");
  const locked = marked && !addMode;
  btn.style.display = locked ? "none" : "";
  btn.innerHTML = locked ? "" : addMode
    ? `<span class="log-emoji">＋</span><span>Добавить к записи</span>`
    : `<span class="log-emoji">${isBook() ? "📖" : "🎹"}</span><span>${
        selectedDate === todayStr() ? (isBook() ? "Почитал!" : "Позанимался!") : "Отметить этот день"}</span>`;
}

function bookLogUI() {
  const s = bookStats();
  const ch = chapterAt(pickPage);
  const delta = pickPage - s.page;
  return `
    <div class="page-pick">
      <span class="pp-label">Дочитал<br><i>до страницы</i></span>
      <div class="stepper">
        <button class="st-btn" data-d="-1" type="button">−</button>
        <button class="st-val" id="pageVal" type="button">${pickPage}</button>
        <button class="st-btn" data-d="1" type="button">＋</button>
      </div>
      <span class="st-delta">${delta > 0 ? "+" + delta : ""}</span>
    </div>
    <div class="quick">
      ${[5, 10, 20, 50].map(n => `<button class="qbtn" data-add="${n}" type="button">+${n}</button>`).join("")}
    </div>
    <div class="chap-now">Это глава: <b>${esc(ch.name)}</b></div>`;
}

function bindBookLog() {
  const pages = data.book.book.pages;
  document.querySelectorAll(".st-btn").forEach(b =>
    b.addEventListener("click", () => {
      pickPage = Math.min(pages, Math.max(0, pickPage + Number(b.dataset.d)));
      renderLog();
    }));
  document.querySelectorAll(".qbtn").forEach(b =>
    b.addEventListener("click", () => {
      pickPage = Math.min(pages, pickPage + Number(b.dataset.add));
      renderLog();
    }));
  $("#pageVal").addEventListener("click", () => {
    const v = prompt("До какой страницы дочитал?", String(pickPage));
    if (v === null) return;
    const n = Math.round(Number(v.replace(",", ".")));
    if (isNaN(n) || n < 0 || n > pages) { toast(`Страница от 0 до ${pages}`); return; }
    pickPage = n;
    renderLog();
  });
}

function pianoLogUI() {
  return `
    <div class="hand-pick">
      ${[["right", "𝄞 Правая"], ["left", "𝄢 Левая"], ["both", "🤲 Обе"]].map(([h, label]) =>
        `<button class="hp ${pickHand === h ? "on" : ""}" data-hand="${h}" type="button">${label}</button>`).join("")}
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
    ${pending.length ? `<div class="pending">${pending.map((s, i) =>
      `<button class="pchip" data-i="${i}" type="button">${spanText(s)} ✕</button>`).join("")}</div>` : ""}
    <button class="add-span" id="addSpan" type="button">＋ Добавить ещё фрагмент</button>`;
}

function bindPianoLog() {
  const bars = data.piano.piece.bars;
  document.querySelectorAll(".hp").forEach(b =>
    b.addEventListener("click", () => { pickHand = b.dataset.hand; renderLog(); }));

  document.querySelectorAll(".st-btn").forEach(b =>
    b.addEventListener("click", () => {
      const d = Number(b.dataset.d);
      if (b.dataset.edge === "from") {
        pickFrom = Math.min(bars, Math.max(1, pickFrom + d));
        if (pickTo < pickFrom) pickTo = pickFrom;
      } else {
        pickTo = Math.min(bars, Math.max(1, pickTo + d));
        if (pickFrom > pickTo) pickFrom = pickTo;
      }
      renderLog();
    }));

  document.querySelectorAll(".st-val").forEach(b =>
    b.addEventListener("click", () => {
      const v = prompt(b.dataset.edge === "from" ? "С какого такта?" : "По какой такт?", b.textContent);
      if (v === null) return;
      const n = Math.round(Number(v.replace(",", ".")));
      if (isNaN(n) || n < 1 || n > bars) { toast(`Такт от 1 до ${bars}`); return; }
      if (b.dataset.edge === "from") { pickFrom = n; if (pickTo < n) pickTo = n; }
      else { pickTo = n; if (pickFrom > n) pickFrom = n; }
      renderLog();
    }));

  document.querySelectorAll(".pchip").forEach(b =>
    b.addEventListener("click", () => { pending.splice(Number(b.dataset.i), 1); renderLog(); }));

  $("#addSpan").addEventListener("click", addPending);
}

function renderWeek() {
  const start = dateStr(mondayOf(new Date()));
  const list = entries().filter(e => e.date >= start);
  const st = streak();
  let middle;

  if (isBook()) {
    const b = data.book.book;
    let before = b.startPage || 0, after = before;
    for (const e of entries()) {
      if (e.date < start) before = Math.max(before, e.page || 0);
      after = Math.max(after, e.page || 0);
    }
    const read = Math.max(0, Math.min(after, b.pages) - Math.min(before, b.pages));
    middle = `<div class="stat"><b>${read}</b><span>${plural(read, "страница", "страницы", "страниц")} за неделю</span></div>`;
  } else {
    let worked = 0;
    for (const e of list) for (const s of e.spans || []) worked += s.to - s.from + 1;
    middle = `<div class="stat"><b>${worked}</b><span>${plural(worked, "такт пройден", "такта пройдено", "тактов пройдено")}</span></div>`;
  }

  $("#weekStats").innerHTML = `
    <div class="stat"><b>${list.length}</b><span>${plural(list.length, "день", "дня", "дней")} на этой неделе</span></div>
    ${middle}
    <div class="stat"><b>${st}</b><span>${plural(st, "день подряд", "дня подряд", "дней подряд")}</span></div>`;
}

function renderCalendar() {
  const all = entries();
  const marked = new Set(all.map(e => e.date));
  const noData = new Set(all.filter(e => isBook() ? !e.page : !(e.spans || []).length).map(e => e.date));
  const first = new Date(calYear, calMonth, 1);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const today = todayStr();

  $("#calTitle").textContent = new Intl.DateTimeFormat("ru", { month: "long", year: "numeric" })
    .format(first).replace(" г.", "");

  let html = DOW.map(d => `<div class="dow">${d}</div>`).join("");
  for (let i = 0; i < lead; i++) html += `<div class="day blank"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dateStr(new Date(calYear, calMonth, d));
    let cls = "day";
    if (marked.has(ds)) cls += noData.has(ds) ? " nobars" : " l3";
    if (ds === today) cls += " today";
    if (ds === selectedDate) cls += " sel";
    if (ds > today) cls += " future";
    html += `<div class="${cls}" data-date="${ds}">${d}</div>`;
  }
  $("#calGrid").innerHTML = html;

  document.querySelectorAll(".day[data-date]").forEach(el =>
    el.addEventListener("click", () => goToDate(el.dataset.date)));
}

function renderDay() {
  const e = entryFor(selectedDate);
  $("#dayTitle").textContent = "Запись · " + fmtDay(selectedDate);

  if (!e) {
    $("#dayList").innerHTML = `<div class="empty">Этот день не отмечен — ${isBook() ? "укажи страницу" : "выбери такты"} и жми кнопку</div>`;
    return;
  }

  const has = isBook() ? !!e.page : (e.spans || []).length > 0;
  const what = isBook()
    ? (e.page ? `📖 до ${e.page}-й стр.` : "читал")
    : ((e.spans || []).length ? e.spans.map(spanText).join(" · ") : "занимался");

  $("#dayList").innerHTML = `
    <div class="sess">
      <span class="smin">${what}</span>
      <span class="snote">${e.note ? esc(e.note) : ""}</span>
      <button class="sdel" data-id="${e.id}" type="button" aria-label="Удалить">✕</button>
    </div>
    ${has ? "" : `<button class="add-span" id="fillData" type="button">＋ Указать, ${isBook() ? "до какой страницы дочитал" : "какие такты разбирал"}</button>`}`;

  document.querySelectorAll(".sdel").forEach(b =>
    b.addEventListener("click", () => deleteEntry(b.dataset.id)));

  const fill = $("#fillData");
  if (fill) fill.addEventListener("click", () => {
    addMode = true;
    renderLog();
    $("#logBox").scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

/* ══════════════ Настройки ══════════════ */

function setSyncDot(state) {
  $("#syncDot").className = "sync-dot" + (state ? " " + state : "");
}

function openSettings() {
  const body = $("#setBody");
  const connected = cfg.token && cfg.gistId;

  body.innerHTML = connected ? `
    <div class="set-note">
      Данные синхронизируются через секретный GitHub Gist:<br><b>${esc(cfg.gistId)}</b><br><br>
      На другом устройстве вставь <b>тот же токен</b> — гист найдётся сам.
      ${cfg.lastSync ? "<br><br>Последняя синхронизация: " + new Intl.DateTimeFormat("ru", { dateStyle: "short", timeStyle: "short" }).format(cfg.lastSync) : ""}
    </div>
    <button class="btn gold" id="setSync" type="button">Синхронизировать сейчас</button>
    <button class="btn danger" id="setOff" type="button">Отключить синхронизацию</button>
  ` : `
    <div class="set-note">
      Чтобы прогресс не потерялся и был на всех устройствах — подключи <b>GitHub Gist</b>.<br><br>
      1. Открой <a href="https://github.com/settings/tokens/new?description=%D0%9F%D1%80%D0%BE%D0%BA%D0%B0%D1%87%D0%BA%D0%B0&scopes=gist" target="_blank" rel="noopener">github.com/settings/tokens/new</a><br>
      2. Тип — <b>classic</b>, галочка только <b>gist</b>, срок — No expiration<br>
      3. Generate token → скопируй <b>ghp_…</b> и вставь сюда:
    </div>
    <input class="note-input" id="setToken" type="password" placeholder="ghp_…" autocomplete="off">
    <button class="btn gold" id="setConnect" type="button">Подключить</button>
  `;

  if (connected) {
    $("#setSync").onclick = () => { $("#settings").close(); syncNow(true); };
    $("#setOff").onclick = () => {
      cfg.token = ""; cfg.gistId = ""; saveCfg();
      setSyncDot(""); openSettings(); toast("Синхронизация отключена");
    };
  } else {
    $("#setConnect").onclick = () => connectGitHub($("#setToken").value.trim());
  }

  $("#settings").showModal();
}

/* ══════════════ Gist-синхронизация ══════════════ */

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
    if (r.status === 401) throw new Error("Токен не подошёл — проверь, что скопирован целиком и с галочкой gist");
    if (!r.ok) throw new Error("GitHub ответил ошибкой " + r.status);
    const gists = await r.json();
    const found = gists.find(g => g.files && g.files[GIST_FILE]);

    if (found) {
      cfg.gistId = found.id; saveCfg();
      toast("Нашёл твой гист — забираю данные");
      await syncNow(false);
    } else {
      const cr = await gh("/gists", {
        method: "POST",
        body: JSON.stringify({
          description: GIST_DESC, public: false,
          files: { [GIST_FILE]: { content: JSON.stringify(exportData()) } }
        })
      });
      if (!cr.ok) throw new Error("Не получилось создать гист (" + cr.status + ")");
      const g = await cr.json();
      cfg.gistId = g.id; cfg.lastSync = now(); saveCfg();
      setSyncDot("ok");
      toast("Гист создан — данные в надёжном месте");
    }
    $("#settings").close();
  } catch (e) {
    cfg.token = ""; saveCfg();
    setSyncDot("err");
    toast(e.message || "Не получилось подключиться");
  }
}

function exportData() {
  return { v: 4, savedAt: now(), active: data.active, piano: data.piano, book: data.book };
}

function mergeLists(local, remote) {
  const map = new Map();
  for (const item of remote || []) map.set(item.id, item);
  for (const item of local || []) {
    const other = map.get(item.id);
    if (!other || (item.updatedAt || 0) >= (other.updatedAt || 0)) map.set(item.id, item);
  }
  return [...map.values()];
}

async function syncNow(manual) {
  if (!cfg.token || !cfg.gistId || syncing) { if (manual && !cfg.token) openSettings(); return; }
  syncing = true;
  setSyncDot("busy");
  try {
    const r = await gh("/gists/" + cfg.gistId);
    if (r.status === 404) throw new Error("Гист не найден — переподключи в настройках");
    if (!r.ok) throw new Error("Ошибка сети (" + r.status + ")");
    const g = await r.json();
    const f = g.files && g.files[GIST_FILE];

    let remote = emptyData();
    if (f) {
      let txt = f.content;
      if (f.truncated && f.raw_url) txt = await (await fetch(f.raw_url)).text();
      try { remote = migrate(JSON.parse(txt)); } catch {}
    }

    const localJson = JSON.stringify(exportData());
    data.piano.entries = mergeLists(data.piano.entries, remote.piano.entries);
    data.book.entries = mergeLists(data.book.entries, remote.book.entries);
    if ((remote.piano.piece.updatedAt || 0) > (data.piano.piece.updatedAt || 0)) data.piano.piece = remote.piano.piece;
    if ((remote.book.book.updatedAt || 0) > (data.book.book.updatedAt || 0)) data.book.book = remote.book.book;
    cleanTombstones();
    saveData();

    const mergedJson = JSON.stringify(exportData());
    const remoteJson = JSON.stringify({ v: 4, savedAt: 0, active: remote.active, piano: remote.piano, book: remote.book });
    const changed = JSON.stringify([data.piano, data.book]) !== JSON.stringify([remote.piano, remote.book]);

    if (changed) {
      const pr = await gh("/gists/" + cfg.gistId, {
        method: "PATCH",
        body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(exportData()) } } })
      });
      if (!pr.ok) throw new Error("Не удалось сохранить в гист (" + pr.status + ")");
    }

    cfg.lastSync = now(); saveCfg();
    setSyncDot("ok");
    if (mergedJson !== localJson) { syncPickers(); render(); }
    if (manual) toast("Синхронизировано");
  } catch (e) {
    setSyncDot("err");
    if (manual) toast(e.message || "Не получилось синхронизироваться");
  } finally {
    syncing = false;
  }
}

function cleanTombstones() {
  const limit = now() - 60 * 864e5;
  const keep = e => !e.deleted || (e.updatedAt || 0) > limit;
  data.piano.entries = data.piano.entries.filter(keep);
  data.book.entries = data.book.entries.filter(keep);
}

function schedulePush() {
  if (!cfg.token || !cfg.gistId) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => syncNow(false), 1500);
}

/* ══════════════ Запуск ══════════════ */

function init() {
  load();
  const t = new Date();
  calYear = t.getFullYear();
  calMonth = t.getMonth();
  syncPickers();

  $("#gearBtn").addEventListener("click", openSettings);
  $("#logBtn").addEventListener("click", saveDay);
  $("#dayPrev").addEventListener("click", () => shiftDay(-1));
  $("#dayNext").addEventListener("click", () => shiftDay(1));
  $("#logDay").addEventListener("click", () => goToDate(todayStr()));
  $("#setClose").addEventListener("click", () => $("#settings").close());
  $("#calPrev").addEventListener("click", () => {
    calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });
  $("#calNext").addEventListener("click", () => {
    calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });
  $("#lvlupOk").addEventListener("click", () => $("#lvlup").classList.remove("show"));
  $("#lvlup").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) $("#lvlup").classList.remove("show");
  });
  $("#doneOk").addEventListener("click", () => $("#doneOv").classList.remove("show"));
  $("#doneOv").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) $("#doneOv").classList.remove("show");
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      if (selectedDate > todayStr()) selectedDate = todayStr();
      syncNow(false);
      render();
    }
  });
  window.addEventListener("online", () => syncNow(false));

  render();
  if (cfg.token && cfg.gistId) { setSyncDot("ok"); syncNow(false); }

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
