"use strict";

/* ══════════════ Константы ══════════════ */

const LS = { data: "prokachka-data-v3", old2: "prokachka-data-v2", old1: "prokachka-data-v1", cfg: "prokachka-cfg-v1" };
const GIST_FILE = "prokachka.json";
const GIST_DESC = "Прокачка — трекер разбора композиций (данные приложения)";

const DEFAULT_PIECE = { name: "Бах — Прелюдия es-moll, BWV 853", bars: 40 };

// Сколько проходов по такту считаем «закреплено»
const FIRM_AT = 3;

const CHEERS = [
  "Отлично! Такты сами себя не разберут — а ты разобрал",
  "Есть! Ещё кусочек прелюдии твой",
  "Красавчик, Бах бы одобрил",
  "Плюс в копилку — так и разбирают великое",
  "Сессия засчитана. Руки помнят!",
  "Хорошая работа, продолжаем разбор"
];

const DONE_TITLES = ["Молодец!", "Красавчик!", "Есть!", "Сделано!", "Вот это дисциплина!"];

const NUDGES = [
  "Один подход сегодня — и ещё пара тактов твои",
  "15 минут за инструментом лучше, чем ноль",
  "Пианино скучает. Загляни к нему сегодня",
  "Маленькое занятие сегодня > большие планы на завтра"
];

const DOW = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

/* ══════════════ Состояние ══════════════ */

let data = { piece: null, entries: [] };
let cfg = { token: "", gistId: "", lastSync: 0, seenAch: [] };

let calYear, calMonth;
let selectedDate = todayStr();
let pickHand = "right";       // right | left | both
let pickFrom = 1, pickTo = 1; // выбранный диапазон тактов
let pending = [];             // добавленные фрагменты текущего занятия
let addMode = false;          // дополняем уже отмеченный день
let pushTimer = null;
let syncing = false;

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
function handIcon(h) { return h === "left" ? "𝄢" : "𝄞"; }
function handName(h) { return h === "left" ? "левая" : "правая"; }
function spanText(s) {
  return `${handIcon(s.hand)} ${s.from === s.to ? s.from + "-й такт" : s.from + "–" + s.to}`;
}

/* ══════════════ Хранилище и миграция ══════════════ */

// Любая прошлая схема → v3 {piece, entries:[{spans:[{hand,from,to}]}]}
function migrate(obj) {
  if (!obj || typeof obj !== "object") return { piece: null, entries: [] };

  // v3
  if (Array.isArray(obj.entries) && obj.entries.some(e => Array.isArray(e.spans))) {
    return { piece: obj.piece || null, entries: obj.entries };
  }
  // v2: entries с right/left «до какого такта»
  if (Array.isArray(obj.entries)) {
    return {
      piece: obj.piece || null,
      entries: obj.entries.map(e => {
        const spans = [];
        if (e.right) spans.push({ hand: "right", from: 1, to: e.right });
        if (e.left) spans.push({ hand: "left", from: 1, to: e.left });
        return { id: e.id, date: e.date, spans, note: e.note || "", createdAt: e.createdAt || 0, updatedAt: e.updatedAt || 0, deleted: e.deleted };
      })
    };
  }
  // v1: sessions (тактов не было)
  return {
    piece: null,
    entries: (obj.sessions || []).map(s => ({
      id: s.id, date: s.date, spans: [], note: s.note || "",
      createdAt: s.createdAt || 0, updatedAt: s.updatedAt || 0, deleted: s.deleted
    }))
  };
}

function load() {
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(LS.data) || "null")
      || JSON.parse(localStorage.getItem(LS.old2) || "null")
      || JSON.parse(localStorage.getItem(LS.old1) || "null");
  } catch {}
  data = migrate(raw);
  try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem(LS.cfg)) || {}); } catch {}
  if (!Array.isArray(cfg.seenAch)) cfg.seenAch = [];
  if (!data.piece) data.piece = { ...DEFAULT_PIECE, updatedAt: 0 };
}

function saveData() { localStorage.setItem(LS.data, JSON.stringify(data)); }
function saveCfg() { localStorage.setItem(LS.cfg, JSON.stringify(cfg)); }

/* ══════════════ Выборки и статистика ══════════════ */

function entries() { return data.entries.filter(e => !e.deleted); }
function entryFor(date) { return entries().find(e => e.date === date); }

// Сколько раз пройден каждый такт каждой рукой
function passes() {
  const bars = data.piece.bars;
  const right = new Array(bars + 1).fill(0);
  const left = new Array(bars + 1).fill(0);
  for (const e of entries()) {
    for (const s of e.spans || []) {
      const arr = s.hand === "left" ? left : right;
      for (let b = Math.max(1, s.from); b <= Math.min(bars, s.to); b++) arr[b]++;
    }
  }
  return { right, left };
}

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

// Полная статистика — на ней же работают достижения
function stats() {
  const bars = data.piece.bars;
  const p = passes();
  const list = entries().slice().sort((a, b) => a.date < b.date ? -1 : 1);

  const count = (arr, min) => arr.slice(1).filter(v => v >= min).length;
  const touchedR = count(p.right, 1), touchedL = count(p.left, 1);
  const firmR = count(p.right, FIRM_AT), firmL = count(p.left, FIRM_AT);
  const maxPass = Math.max(0, ...p.right.slice(1), ...p.left.slice(1));

  let bothInOne = false, maxRun = 0, weekend = false, comeback = false, totalBarsWorked = 0;
  let prevDate = null;
  for (const e of list) {
    const hands = new Set((e.spans || []).map(s => s.hand));
    if (hands.size >= 2) bothInOne = true;
    for (const s of e.spans || []) {
      maxRun = Math.max(maxRun, s.to - s.from + 1);
      totalBarsWorked += s.to - s.from + 1;
    }
    const dow = fromStr(e.date).getDay();
    if (dow === 0 || dow === 6) weekend = true;
    if (prevDate && daysBetween(prevDate, e.date) >= 7) comeback = true;
    prevDate = e.date;
  }

  return {
    bars, passes: p, days: list.length, streak: streak(),
    touchedR, touchedL, firmR, firmL, maxPass,
    pctR: bars ? touchedR / bars * 100 : 0,
    pctL: bars ? touchedL / bars * 100 : 0,
    pct: bars ? (touchedR + touchedL) / (bars * 2) * 100 : 0,
    pctFirm: bars ? (firmR + firmL) / (bars * 2) * 100 : 0,
    bothInOne, maxRun, weekend, comeback, totalBarsWorked
  };
}

function weekStats() {
  const start = dateStr(mondayOf(new Date()));
  const list = entries().filter(e => e.date >= start);
  let worked = 0;
  for (const e of list) for (const s of e.spans || []) worked += s.to - s.from + 1;
  return { days: list.length, worked };
}

/* ══════════════ Достижения ══════════════ */

// secret: не показываем даже намёка, пока не открыто
const ACHIEVEMENTS = [
  { id: "first",    icon: "🌱", name: "Первое касание",     hint: "Отметить первое занятие",              test: s => s.days >= 1 },
  { id: "bar1",     icon: "🎯", name: "Первый такт",        hint: "Разобрать хотя бы один такт",          test: s => s.touchedR + s.touchedL >= 1 },
  { id: "r10",      icon: "𝄞", name: "Правая проснулась",  hint: "10% правой руки",                      test: s => s.pctR >= 10 },
  { id: "l10",      icon: "𝄢", name: "Левая подтянулась",  hint: "10% левой руки",                       test: s => s.pctL >= 10 },
  { id: "both",     icon: "🤲", name: "В четыре руки",      hint: "Обе руки за одно занятие",             test: s => s.bothInOne },
  { id: "again",    icon: "🔁", name: "А ну-ка ещё разок",  hint: "Пройти один такт трижды",              test: s => s.maxPass >= 3 },
  { id: "streak3",  icon: "🔥", name: "Три дня подряд",     hint: "Серия из 3 дней",                      test: s => s.streak >= 3 },
  { id: "q1",       icon: "🧗", name: "Четверть пути",      hint: "25% композиции",                       test: s => s.pct >= 25 },
  { id: "run8",     icon: "🏃", name: "Длинный забег",      hint: "8 тактов подряд за одно занятие",      test: s => s.maxRun >= 8 },
  { id: "weekend",  icon: "🎩", name: "Выходной у рояля",   hint: "Позаниматься в субботу или воскресенье", test: s => s.weekend, secret: true },
  { id: "streak7",  icon: "🗓️", name: "Неделя без пропусков", hint: "Серия из 7 дней",                   test: s => s.streak >= 7 },
  { id: "stubborn", icon: "🪨", name: "Упрямец",            hint: "Один такт — семь раз",                 test: s => s.maxPass >= 7, secret: true },
  { id: "r50",      icon: "🌗", name: "Половина правой",    hint: "50% правой руки",                      test: s => s.pctR >= 50 },
  { id: "l50",      icon: "🌗", name: "Половина левой",     hint: "50% левой руки",                       test: s => s.pctL >= 50 },
  { id: "half",     icon: "⛰️", name: "Половина пути",      hint: "50% композиции",                       test: s => s.pct >= 50 },
  { id: "firm10",   icon: "🧱", name: "Крепкий фундамент",  hint: `10 тактов пройдены по ${FIRM_AT} раза`, test: s => s.firmR + s.firmL >= 10 },
  { id: "days20",   icon: "📚", name: "Двадцать вечеров",   hint: "20 занятий всего",                     test: s => s.days >= 20 },
  { id: "comeback", icon: "🌙", name: "Возвращение",        hint: "Вернуться после недельного перерыва",  test: s => s.comeback, secret: true },
  { id: "streak14", icon: "💎", name: "Две недели подряд",  hint: "Серия из 14 дней",                     test: s => s.streak >= 14 },
  { id: "q3",       icon: "🧠", name: "Три четверти",       hint: "75% композиции",                       test: s => s.pct >= 75 },
  { id: "streak30", icon: "👑", name: "Месяц дисциплины",   hint: "Серия из 30 дней",                     test: s => s.streak >= 30 },
  { id: "r100",     icon: "🏅", name: "Правая рука готова", hint: "100% правой руки",                     test: s => s.pctR >= 100 },
  { id: "l100",     icon: "🏅", name: "Левая рука готова",  hint: "100% левой руки",                      test: s => s.pctL >= 100 },
  { id: "all100",   icon: "🎼", name: "Вся вещь пройдена",  hint: "100% композиции обеими руками",        test: s => s.pct >= 100 },
  { id: "polished", icon: "💍", name: "Отшлифовано",        hint: `Каждый такт пройден по ${FIRM_AT} раза`, test: s => s.pctFirm >= 100 },
  { id: "bach",     icon: "🏆", name: "Бах доволен",        hint: "Разобрать вещь целиком и отшлифовать её", test: s => s.pct >= 100 && s.pctFirm >= 100 && s.days >= 30, secret: true }
];

// Тексты поздравлений — эмоциональные, по делу
const ACH_WORDS = {
  first: "Начало положено. Дальше — только интереснее",
  bar1: "Первый такт — уже не ноль. Отсюда растёт вся прелюдия",
  r10: "Правая рука вошла во вкус",
  l10: "Левая догоняет — бас держит всё здание",
  both: "Обе руки за один вечер. Так рождается ансамбль",
  again: "Повтор — не топтание на месте, а то, как учат по-настоящему",
  streak3: "Три дня подряд. Это уже не случайность, это привычка",
  q1: "Четверть прелюдии в руках. Разгон закончен, поехали",
  run8: "Восемь тактов за раз — уверенный, широкий заход",
  weekend: "Выходной — а ты за инструментом. Уважение",
  streak7: "Целая неделя без пропусков. Дисциплина уровня «профи»",
  stubborn: "Этот такт не сдавался семь раз. Ты оказался упрямее",
  r50: "Половина правой руки. Мелодия уже узнаётся",
  l50: "Половина левой. Гармония встала на место",
  half: "Половина пути пройдена. Вторая всегда идёт быстрее",
  firm10: "Десять тактов не просто пройдены — они закреплены",
  days20: "Двадцать вечеров за инструментом. Это уже история",
  comeback: "Вернулся после перерыва — самое сложное и самое ценное",
  streak14: "Две недели подряд. Мало кто доходит до этой отметки",
  q3: "Три четверти! Финиш уже виден",
  streak30: "Месяц без единого пропуска. Это уровень характера",
  r100: "Правая рука знает прелюдию от первой до последней ноты",
  l100: "Левая рука прошла всю вещь. Фундамент готов",
  all100: "Вся прелюдия пройдена обеими руками. Огромная работа!",
  polished: "Каждый такт отшлифован. Теперь это твоя музыка",
  bach: "Ты прошёл её целиком, закрепил и не бросил. Бах бы пожал руку"
};

function achState() {
  const s = stats();
  return ACHIEVEMENTS.map(a => ({ ...a, done: !!a.test(s) }));
}

/* ══════════════ Действия ══════════════ */

function normSpan(hand, from, to) {
  const bars = data.piece.bars;
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
  const add = pickHand === "both"
    ? [normSpan("right", pickFrom, pickTo), normSpan("left", pickFrom, pickTo)]
    : [normSpan(pickHand, pickFrom, pickTo)];
  pending.push(...add);
  toast("Фрагмент добавлен — выбери следующий");
  renderLog();
}

function saveDay() {
  const existing = entryFor(selectedDate);
  if (existing && !addMode) {
    toast(selectedDate === todayStr() ? "Сегодня уже отмечено — возвращайся завтра!" : "Этот день уже отмечен");
    return;
  }

  const before = stats();
  const beforeDone = new Set(achState().filter(a => a.done).map(a => a.id));
  const spans = currentSpans();
  const note = $("#noteInput").value.trim();

  if (existing) {
    existing.spans = (existing.spans || []).concat(spans);
    if (note) existing.note = existing.note ? existing.note + "; " + note : note;
    existing.updatedAt = now();
  } else {
    data.entries.push({
      id: uid(),
      date: selectedDate,
      spans,
      note,
      createdAt: now(),
      updatedAt: now()
    });
  }
  $("#noteInput").value = "";
  pending = [];
  addMode = false;
  saveData();
  schedulePush();

  const after = stats();
  const gained = (after.touchedR + after.touchedL) - (before.touchedR + before.touchedL);
  const dPct = after.pct - before.pct;

  const pop = $("#xpPop");
  pop.textContent = dPct >= 0.05 ? "+" + dPct.toFixed(1).replace(".", ",") + "%" : "🎹";
  pop.classList.remove("go");
  void pop.offsetWidth;
  pop.classList.add("go");

  render();

  const fresh = achState().filter(a => a.done && !beforeDone.has(a.id));
  if (fresh.length) {
    fresh.forEach(a => { if (!cfg.seenAch.includes(a.id)) cfg.seenAch.push(a.id); });
    saveCfg();
    showAchievement(fresh[fresh.length - 1], fresh.length);
    return;
  }

  if (selectedDate === todayStr() && !existing) showDone(spans, gained, dPct, after);
  else if (existing) toast("Добавлено: " + spans.map(spanText).join(", "));
  else toast(`${fmtDay(selectedDate)} отмечено · ` + CHEERS[Math.floor(Math.random() * CHEERS.length)]);
}

function showAchievement(a, count) {
  $("#lvlupNum").textContent = a.icon;
  $("#lvlupName").textContent = a.name;
  $("#lvlupDesc").textContent = (ACH_WORDS[a.id] || a.hint) + (count > 1 ? ` · и ещё ${count - 1} достижение открыто!` : "");
  $("#lvlup").classList.add("show");
}

function showDone(spans, gained, dPct, st) {
  $("#doneEmoji").textContent = st.streak >= 2 ? "🔥" : "🎉";
  $("#doneTitle").textContent = DONE_TITLES[Math.floor(Math.random() * DONE_TITLES.length)];

  let text = spans.map(spanText).join(", ") + ". ";
  if (gained > 0) text += `+${takty(gained)} к разбору, всего ${Math.round(st.pct)}%. `;
  else text += "Повторение — эти такты стали крепче. ";
  if (st.streak >= 2) text += `Серия — ${st.streak} ${plural(st.streak, "день", "дня", "дней")} подряд, возвращайся завтра, будет ${st.streak + 1} 🔥`;
  else text += "Возвращайся завтра — начнём серию!";
  $("#doneText").textContent = text;

  $("#doneOv").classList.add("show");
}

// Переход к другому дню: сбрасываем черновик и подтягиваем календарь
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

function deleteEntry(id) {
  const e = data.entries.find(x => x.id === id);
  if (!e) return;
  e.deleted = true;
  e.updatedAt = now();
  saveData();
  schedulePush();
  render();
  toast("Запись удалена");
}

function editPiece() {
  const name = prompt("Название композиции:", data.piece.name);
  if (name === null) return;
  const barsStr = prompt("Сколько в ней тактов?", String(data.piece.bars));
  if (barsStr === null) return;
  const bars = Math.round(Number(barsStr.replace(",", ".")));
  if (!bars || bars < 1 || bars > 2000) { toast("Не понял число тактов"); return; }
  data.piece.name = name.trim() || data.piece.name;
  data.piece.bars = bars;
  data.piece.updatedAt = now();
  pickFrom = Math.min(pickFrom, bars);
  pickTo = Math.min(pickTo, bars);
  saveData();
  schedulePush();
  render();
}

/* ══════════════ Рендер ══════════════ */

function render() {
  renderPiece();
  renderToday();
  renderLog();
  renderWeek();
  renderCalendar();
  renderDay();
}

function barMap(arr, cls) {
  const bars = data.piece.bars;
  let html = "";
  for (let b = 1; b <= bars; b++) {
    const n = arr[b] || 0;
    const lvl = n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : 3;
    html += `<i class="bar l${lvl} ${cls}" title="Такт ${b}: ${n ? n + " " + plural(n, "проход", "прохода", "проходов") : "не разобран"}"></i>`;
  }
  return html;
}

function renderPiece() {
  const s = stats();
  const ach = achState();
  const openCount = ach.filter(a => a.done).length;
  const next = ach.find(a => !a.done && !a.secret);

  $("#levelBlock").innerHTML = `
    <div class="level-card">
      <div class="level-top">
        <div class="level-badge"><b>${Math.round(s.pct)}<i>%</i></b><span>разобрано</span></div>
        <div class="level-title">
          <div class="lname">${esc(data.piece.name)}</div>
          <div class="ldesc">${s.bars} тактов · <button class="piece-edit" id="pieceEdit" type="button">изменить</button></div>
        </div>
      </div>

      <div class="hand">
        <div class="hand-head">
          <span>𝄞 Правая · скрипичный ключ</span>
          <b>${Math.round(s.pctR)}%</b>
        </div>
        <div class="bars">${barMap(s.passes.right, "r")}</div>
      </div>

      <div class="hand">
        <div class="hand-head">
          <span>𝄢 Левая · басовый ключ</span>
          <b>${Math.round(s.pctL)}%</b>
        </div>
        <div class="bars">${barMap(s.passes.left, "l")}</div>
      </div>

      <div class="legend">
        <span><i class="bar l0"></i> не трогал</span>
        <span><i class="bar l1 r"></i> разобрал</span>
        <span><i class="bar l3 r"></i> закрепил (${FIRM_AT}+)</span>
      </div>

      <div class="level-next">
        Открыто достижений: <b>${openCount} из ${ACHIEVEMENTS.length}</b>${next ? ` · ближайшее: ${next.icon} <b>${esc(next.name)}</b> — ${esc(next.hint.toLowerCase())}` : " — все!"}
      </div>

      <button class="ladder-toggle" id="ladderBtn" type="button">Достижения ›</button>
      <div class="ladder" id="ladder">
        ${(() => {
          let teased = 0;
          return ach.map(a => {
            if (a.done) {
              return `
                <div class="lrow done">
                  <span class="ln">${a.icon}</span>
                  <span class="lt">${esc(a.name)}</span>
                  <span class="lh">открыто</span>
                  <span class="ld">${esc(ACH_WORDS[a.id] || a.hint)}</span>
                </div>`;
            }
            // закрытые: пару ближайших дразним, остальные — тайна
            if (!a.secret && teased < 2) {
              teased++;
              return `
                <div class="lrow now">
                  <span class="ln">🔒</span>
                  <span class="lt">${esc(a.name)}</span>
                  <span class="lh"></span>
                  <span class="ld">${esc(a.hint)}</span>
                </div>`;
            }
            return `
              <div class="lrow locked">
                <span class="ln">🔒</span>
                <span class="lt">???</span>
                <span class="lh"></span>
                <span class="ld">Откроется по ходу разбора</span>
              </div>`;
          }).join("");
        })()}
      </div>
    </div>`;

  $("#pieceEdit").addEventListener("click", editPiece);
  $("#ladderBtn").addEventListener("click", () => {
    const open = $("#ladder").classList.toggle("open");
    $("#ladderBtn").textContent = open ? "Свернуть ‹" : "Достижения ›";
  });
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
    const s = stats();
    const next = achState().find(a => !a.done && !a.secret);
    const closeStreak = next && next.id.startsWith("streak");

    if (closeStreak && st >= 2) {
      emoji = "🔥";
      text = `Серия — <b>${st} ${plural(st, "день", "дня", "дней")} подряд</b>! Сыграешь сегодня — будет ${st + 1}, а там и ${next.icon} «${esc(next.name)}»`;
    } else if (st >= 2) {
      emoji = "🔥";
      text = `Серия — <b>${st} ${plural(st, "день", "дня", "дней")} подряд</b>! Сыграешь сегодня — будет ${st + 1}`;
    } else if (st === 1) {
      emoji = "🎹";
      text = `Вчера занимался — сыграй сегодня, и <b>начнётся серия</b>`;
    } else if (next && s.days > 0) {
      emoji = "⚡";
      text = `Следующее достижение: ${next.icon} <b>${esc(next.name)}</b> — ${esc(next.hint.toLowerCase())}`;
    } else {
      const seed = todayStr().split("-").reduce((a, x) => a + Number(x), 0);
      emoji = "🎹";
      text = NUDGES[seed % NUDGES.length];
    }
  }

  $("#todayBlock").innerHTML = `
    <div class="today-card ${cls}">
      <span class="today-emoji">${emoji}</span>
      <span class="today-text">${text}</span>
    </div>`;
}

function renderLog() {
  $("#logDay").textContent = fmtDay(selectedDate);
  $("#dayNext").disabled = selectedDate >= todayStr();

  const marked = !!entryFor(selectedDate);
  const bars = data.piece.bars;
  const box = $("#logBox");

  if (marked && !addMode) {
    const empty = !(entryFor(selectedDate).spans || []).length;
    box.innerHTML = empty
      ? `<div class="marked-note need">
           <span>📝 День отмечен, но такты не указаны</span>
           <button id="addMore" type="button">＋ указать такты</button>
         </div>`
      : `<div class="marked-note">
           <span>✅ ${selectedDate === todayStr() ? "Сегодня уже отмечено" : "Этот день отмечен"}</span>
           <button id="addMore" type="button">＋ дополнить</button>
         </div>`;
    $("#noteRow").style.display = "none";
    $("#addMore").addEventListener("click", () => { addMode = true; renderLog(); });
  } else {
    $("#noteRow").style.display = "";
    box.innerHTML = `
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

  const btn = $("#logBtn");
  const locked = marked && !addMode;
  btn.classList.toggle("off", locked);
  btn.innerHTML = locked
    ? `<span class="log-emoji">✅</span><span>${selectedDate === todayStr() ? "Сегодня отмечено" : "День отмечен"}</span>`
    : addMode
      ? `<span class="log-emoji">＋</span><span>Добавить к записи</span>`
      : `<span class="log-emoji">🎹</span><span>${selectedDate === todayStr() ? "Позанимался!" : "Отметить этот день"}</span>`;
}

function renderWeek() {
  const w = weekStats();
  const st = streak();
  $("#weekStats").innerHTML = `
    <div class="stat"><b>${w.days}</b><span>${plural(w.days, "день", "дня", "дней")} на этой неделе</span></div>
    <div class="stat"><b>${w.worked}</b><span>${plural(w.worked, "такт пройден", "такта пройдено", "тактов пройдено")}</span></div>
    <div class="stat"><b>${st}</b><span>${plural(st, "день подряд", "дня подряд", "дней подряд")}</span></div>`;
}

function renderCalendar() {
  const marked = new Set(entries().map(e => e.date));
  const noBars = new Set(entries().filter(e => !(e.spans || []).length).map(e => e.date));
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
    if (marked.has(ds)) cls += noBars.has(ds) ? " nobars" : " l3";
    if (ds === today) cls += " today";
    if (ds === selectedDate) cls += " sel";
    if (ds > today) cls += " future";
    const tip = noBars.has(ds) ? "Отмечен, но такты не указаны" : marked.has(ds) ? "Занимался" : "";
    html += `<div class="${cls}" data-date="${ds}" title="${tip}">${d}</div>`;
  }
  $("#calGrid").innerHTML = html;

  document.querySelectorAll(".day[data-date]").forEach(el =>
    el.addEventListener("click", () => {
      if (el.dataset.date > todayStr()) { toast("Это ещё в будущем 🙂"); return; }
      goToDate(el.dataset.date);
    }));
}

function renderDay() {
  const e = entryFor(selectedDate);
  $("#dayTitle").textContent = "Запись · " + fmtDay(selectedDate);

  if (!e) {
    $("#dayList").innerHTML = `<div class="empty">Этот день не отмечен — выбери такты и жми «Позанимался»</div>`;
    return;
  }

  const hasSpans = (e.spans || []).length > 0;
  $("#dayList").innerHTML = `
    <div class="sess">
      <span class="smin">${hasSpans ? e.spans.map(spanText).join(" · ") : "занимался"}</span>
      <span class="snote">${e.note ? esc(e.note) : ""}</span>
      <button class="sdel" data-id="${e.id}" type="button" aria-label="Удалить">✕</button>
    </div>
    ${hasSpans ? "" : `<button class="add-span" id="fillBars" type="button">＋ Указать, какие такты разбирал в этот день</button>`}`;

  document.querySelectorAll(".sdel").forEach(b =>
    b.addEventListener("click", () => deleteEntry(b.dataset.id)));

  const fill = $("#fillBars");
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
    headers: {
      "Authorization": "Bearer " + cfg.token,
      "Accept": "application/vnd.github+json"
    }
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
          description: GIST_DESC,
          public: false,
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
  return { v: 3, savedAt: now(), piece: data.piece, entries: data.entries };
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

    let remote = { piece: null, entries: [] };
    if (f) {
      let txt = f.content;
      if (f.truncated && f.raw_url) txt = await (await fetch(f.raw_url)).text();
      try { remote = migrate(JSON.parse(txt)); } catch {}
    }

    const localJson = JSON.stringify(data.piece) + JSON.stringify(data.entries);
    data.entries = mergeLists(data.entries, remote.entries);
    if (remote.piece && (remote.piece.updatedAt || 0) > (data.piece.updatedAt || 0)) data.piece = remote.piece;
    cleanTombstones();
    saveData();

    const mergedJson = JSON.stringify(data.piece) + JSON.stringify(data.entries);
    const remoteJson = JSON.stringify(remote.piece) + JSON.stringify(remote.entries || []);

    if (mergedJson !== remoteJson) {
      const pr = await gh("/gists/" + cfg.gistId, {
        method: "PATCH",
        body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(exportData()) } } })
      });
      if (!pr.ok) throw new Error("Не удалось сохранить в гист (" + pr.status + ")");
    }

    cfg.lastSync = now(); saveCfg();
    setSyncDot("ok");
    if (mergedJson !== localJson) render();
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
  data.entries = data.entries.filter(e => !e.deleted || (e.updatedAt || 0) > limit);
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
      const t2 = todayStr();
      if (selectedDate > t2) selectedDate = t2;
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
