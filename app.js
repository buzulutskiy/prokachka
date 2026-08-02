"use strict";

/* ══════════════ Константы ══════════════ */

const LS = { data: "prokachka-data-v2", dataOld: "prokachka-data-v1", cfg: "prokachka-cfg-v1" };
const GIST_FILE = "prokachka.json";
const GIST_DESC = "Прокачка — трекер разбора композиций (данные приложения)";

// Композиция по умолчанию (название и число тактов правятся в карточке)
const DEFAULT_PIECE = {
  name: "Бах — Прелюдия es-moll, BWV 853",
  bars: 40
};

// Подбадривания (для отметок задним числом и просто так)
const CHEERS = [
  "Отлично! Такты сами себя не разберут — а ты разобрал",
  "Есть! Ещё кусочек композиции твой",
  "Красавчик, Бах бы одобрил",
  "Плюс в копилку — так и разбирают великое",
  "Сессия засчитана. Руки помнят!",
  "Хорошая работа, продолжаем разбор"
];

// Заголовки экрана «молодец» после отметки
const DONE_TITLES = ["Молодец!", "Красавчик!", "Есть!", "Сделано!", "Вот это дисциплина!"];

// Мотивашки на день, когда ещё не занимался
const NUDGES = [
  "Один подход сегодня — и ещё пара тактов твои",
  "15 минут за инструментом лучше, чем ноль",
  "Пианино скучает. Загляни к нему сегодня",
  "Маленькое занятие сегодня > большие планы на завтра"
];

const DOW = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

/* ══════════════ Состояние ══════════════ */

let data = { piece: null, entries: [] };
let cfg = { token: "", gistId: "", lastSync: 0 };

let calYear, calMonth;
let selectedDate = todayStr();
let selRight = 0, selLeft = 0;   // значения степперов «до какого такта»
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
  toast.t = setTimeout(() => el.classList.remove("show"), 2200);
}

function plural(n, one, few, many) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}

function takty(n) { return `${n} ${plural(n, "такт", "такта", "тактов")}`; }

/* ══════════════ Хранилище и миграция ══════════════ */

// Приводит данные любой прошлой схемы к v2 {piece, entries}
function migrate(obj) {
  if (!obj || typeof obj !== "object") return { piece: null, entries: [] };
  if (Array.isArray(obj.entries)) return { piece: obj.piece || null, entries: obj.entries };
  // v1: {hobbies, sessions} — переносим отмеченные дни, тактов тогда ещё не было
  const entries = (obj.sessions || []).map(s => ({
    id: s.id, date: s.date, right: null, left: null,
    note: s.note || "", createdAt: s.createdAt || 0, updatedAt: s.updatedAt || 0,
    deleted: s.deleted
  }));
  return { piece: null, entries };
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS.data) || "null")
      || JSON.parse(localStorage.getItem(LS.dataOld) || "null");
    data = migrate(raw);
  } catch { data = { piece: null, entries: [] }; }
  try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem(LS.cfg)) || {}); } catch {}

  if (!data.piece) data.piece = { ...DEFAULT_PIECE, updatedAt: 0 };
}

function saveData() { localStorage.setItem(LS.data, JSON.stringify(data)); }
function saveCfg() { localStorage.setItem(LS.cfg, JSON.stringify(cfg)); }

/* ══════════════ Выборки ══════════════ */

function entries() { return data.entries.filter(e => !e.deleted); }

function entryFor(date) { return entries().find(e => e.date === date); }

// Прогресс: до какого такта дошла каждая рука (максимум по всем записям)
function progress(beforeDate) {
  let right = 0, left = 0;
  for (const e of entries()) {
    if (beforeDate && e.date >= beforeDate) continue;
    if (e.right) right = Math.max(right, e.right);
    if (e.left) left = Math.max(left, e.left);
  }
  const bars = data.piece.bars;
  return { right: Math.min(right, bars), left: Math.min(left, bars) };
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

function weekStats() {
  const start = dateStr(mondayOf(new Date()));
  const days = new Set(entries().filter(e => e.date >= start).map(e => e.date));
  const cur = progress();
  const before = progress(start);
  const bars = Math.max(0, (cur.right + cur.left) - (before.right + before.left));
  return { count: days.size, bars };
}

/* ══════════════ Достижения ══════════════ */

function milestoneList() {
  const bars = data.piece.bars;
  const q = (p) => Math.max(1, Math.round(bars * p));
  const { right, left } = progress();
  const both = right + left, total = bars * 2;

  return [
    { id: "first", icon: "🌱", name: "Первые такты", need: "любой рукой", done: both > 0 },
    { id: "r25", icon: "𝄞", name: "Правая: четверть", need: `до ${q(0.25)}-го такта`, done: right >= q(0.25) },
    { id: "l25", icon: "𝄢", name: "Левая: четверть", need: `до ${q(0.25)}-го такта`, done: left >= q(0.25) },
    { id: "r50", icon: "𝄞", name: "Правая: половина", need: `до ${q(0.5)}-го такта`, done: right >= q(0.5) },
    { id: "l50", icon: "𝄢", name: "Левая: половина", need: `до ${q(0.5)}-го такта`, done: left >= q(0.5) },
    { id: "half", icon: "⛰️", name: "Половина пути", need: "суммарно по обеим рукам", done: both >= total / 2 },
    { id: "r75", icon: "𝄞", name: "Правая: три четверти", need: `до ${q(0.75)}-го такта`, done: right >= q(0.75) },
    { id: "l75", icon: "𝄢", name: "Левая: три четверти", need: `до ${q(0.75)}-го такта`, done: left >= q(0.75) },
    { id: "r100", icon: "🏅", name: "Правая рука готова!", need: `все ${bars} тактов`, done: right >= bars },
    { id: "l100", icon: "🏅", name: "Левая рука готова!", need: `все ${bars} тактов`, done: left >= bars },
    { id: "complete", icon: "🏆", name: "Композиция разобрана!", need: "обе руки целиком", done: right >= bars && left >= bars }
  ];
}

function doneIds() { return new Set(milestoneList().filter(m => m.done).map(m => m.id)); }

/* ══════════════ Действия ══════════════ */

function saveDay() {
  if (entryFor(selectedDate)) {
    toast(selectedDate === todayStr() ? "Сегодня уже отмечено — возвращайся завтра!" : "Этот день уже отмечен");
    return;
  }

  const before = progress();
  const beforeDone = doneIds();

  data.entries.push({
    id: uid(),
    date: selectedDate,
    right: selRight || null,
    left: selLeft || null,
    note: $("#noteInput").value.trim(),
    createdAt: now(),
    updatedAt: now()
  });
  $("#noteInput").value = "";
  saveData();
  schedulePush();

  const after = progress();
  const dRight = Math.max(0, after.right - before.right);
  const dLeft = Math.max(0, after.left - before.left);

  const pop = $("#xpPop");
  pop.textContent = dRight + dLeft > 0 ? "+" + takty(dRight + dLeft) : "🎹";
  pop.classList.remove("go");
  void pop.offsetWidth;
  pop.classList.add("go");

  render();

  // новое достижение — праздник на весь экран
  const fresh = milestoneList().filter(m => m.done && !beforeDone.has(m.id));
  if (fresh.length) {
    const m = fresh[fresh.length - 1];
    $("#lvlupNum").textContent = m.icon;
    $("#lvlupName").textContent = m.name;
    $("#lvlupDesc").textContent = m.id === "complete"
      ? "Ты разобрал её целиком. Теперь — шлифовать и наслаждаться!"
      : "Достижение открыто. Разбор движется!";
    $("#lvlup").classList.add("show");
    return;
  }

  if (selectedDate === todayStr()) showDone(dRight, dLeft);
  else toast(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
}

// Экран «молодец, возвращайся завтра»
function showDone(dRight, dLeft) {
  const st = streak();
  const p = progress();

  $("#doneEmoji").textContent = st >= 2 ? "🔥" : "🎉";
  $("#doneTitle").textContent = DONE_TITLES[Math.floor(Math.random() * DONE_TITLES.length)];

  let text;
  if (dRight + dLeft > 0) {
    const parts = [];
    if (dRight) parts.push(`+${takty(dRight)} правой`);
    if (dLeft) parts.push(`+${takty(dLeft)} левой`);
    text = parts.join(", ") + `. Правая — ${p.right}/${data.piece.bars}, левая — ${p.left}/${data.piece.bars}. `;
  } else {
    text = "Повторение — мать учения: пройденные такты стали крепче. ";
  }
  if (st >= 2) text += `Серия — ${st} ${plural(st, "день", "дня", "дней")} подряд, возвращайся завтра, будет ${st + 1} 🔥`;
  else text += "Возвращайся завтра — начнём серию!";
  $("#doneText").textContent = text;

  $("#doneOv").classList.add("show");
}

function deleteEntry(id) {
  const e = data.entries.find(x => x.id === id);
  if (!e) return;
  e.deleted = true;
  e.updatedAt = now();
  saveData();
  schedulePush();
  syncSteppers();
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
  saveData();
  schedulePush();
  syncSteppers();
  render();
}

/* ══════════════ Рендер ══════════════ */

function syncSteppers() {
  const p = progress();
  selRight = p.right;
  selLeft = p.left;
}

function render() {
  renderPiece();
  renderToday();
  renderLog();
  renderWeek();
  renderCalendar();
  renderDay();
}

function renderPiece() {
  const bars = data.piece.bars;
  const p = progress();
  const pct = Math.round((p.right + p.left) / (bars * 2) * 100);
  const ms = milestoneList();
  const next = ms.find(m => !m.done);

  $("#levelBlock").innerHTML = `
    <div class="level-card">
      <div class="level-top">
        <div class="level-badge"><b>${pct}<i>%</i></b><span>разобрано</span></div>
        <div class="level-title">
          <div class="lname">${esc(data.piece.name)}</div>
          <div class="ldesc">${bars} тактов · <button class="piece-edit" id="pieceEdit" type="button">изменить</button></div>
        </div>
      </div>

      <div class="hand" data-hand="right">
        <div class="hand-head">
          <span>𝄞 Правая · скрипичный ключ</span>
          <b>${p.right} / ${bars}</b>
        </div>
        <div class="xp-bar"><div class="xp-fill" style="width:${(p.right / bars * 100).toFixed(1)}%"></div></div>
      </div>

      <div class="hand" data-hand="left">
        <div class="hand-head">
          <span>𝄢 Левая · басовый ключ</span>
          <b>${p.left} / ${bars}</b>
        </div>
        <div class="xp-bar"><div class="xp-fill vio" style="width:${(p.left / bars * 100).toFixed(1)}%"></div></div>
      </div>

      ${next ? `
        <div class="level-next">
          Следующая цель: ${next.icon} <b>${esc(next.name)}</b> — ${esc(next.need)}
        </div>` : `
        <div class="level-next">🏆 Композиция разобрана целиком — пора выбирать следующую!</div>`}

      <button class="ladder-toggle" id="ladderBtn" type="button">Все достижения ›</button>
      <div class="ladder" id="ladder">
        ${ms.map(m => `
          <div class="lrow ${m.done ? "done" : m === next ? "now" : ""}">
            <span class="ln">${m.done ? "✓" : m.icon}</span>
            <span class="lt">${esc(m.name)}</span>
            <span class="lh"></span>
            <span class="ld">${esc(m.need)}</span>
          </div>`).join("")}
      </div>
    </div>`;

  $("#pieceEdit").addEventListener("click", editPiece);
  $("#ladderBtn").addEventListener("click", () => {
    const open = $("#ladder").classList.toggle("open");
    $("#ladderBtn").textContent = open ? "Свернуть ‹" : "Все достижения ›";
  });
}

function renderToday() {
  const block = $("#todayBlock");
  const doneToday = !!entryFor(todayStr());
  const st = streak();
  const p = progress();
  const bars = data.piece.bars;
  let cls, emoji, text;

  if (doneToday) {
    cls = "done";
    emoji = "✅";
    text = `На сегодня — всё, молодец! Возвращайся завтра — серия станет <b>${st + 1} ${plural(st + 1, "день", "дня", "дней")}</b>`;
  } else {
    cls = "call";
    const next = milestoneList().find(m => !m.done);
    const closeToNext = next && (
      (next.id.startsWith("r") && Math.round(bars * ({ r25: 0.25, r50: 0.5, r75: 0.75, r100: 1 })[next.id]) - p.right <= 2) ||
      (next.id.startsWith("l") && Math.round(bars * ({ l25: 0.25, l50: 0.5, l75: 0.75, l100: 1 })[next.id]) - p.left <= 2)
    );

    if (closeToNext) {
      emoji = "⚡";
      text = `Достижение ${next.icon} «<b>${esc(next.name)}</b>» совсем рядом — пара тактов сегодня, и оно твоё`;
    } else if (st >= 2) {
      emoji = "🔥";
      text = `Серия — <b>${st} ${plural(st, "день", "дня", "дней")} подряд</b>! Сыграешь сегодня — будет ${st + 1}`;
    } else if (st === 1) {
      emoji = "🎹";
      text = `Вчера занимался — сыграй сегодня, и <b>начнётся серия</b>`;
    } else {
      const seed = todayStr().split("-").reduce((a, x) => a + Number(x), 0);
      emoji = "🎹";
      text = NUDGES[seed % NUDGES.length];
    }
  }

  block.innerHTML = `
    <div class="today-card ${cls}">
      <span class="today-emoji">${emoji}</span>
      <span class="today-text">${text}</span>
    </div>`;
}

function renderLog() {
  $("#logDay").textContent = fmtDay(selectedDate);

  const marked = !!entryFor(selectedDate);
  const bars = data.piece.bars;
  const p = progress();

  $("#steppers").innerHTML = marked ? "" : `
    <div class="stepper-row">
      <span class="st-label">𝄞 Правая<br><i>до какого такта</i></span>
      <div class="stepper">
        <button class="st-btn" data-hand="r" data-d="-1" type="button">−</button>
        <button class="st-val" data-hand="r" type="button">${selRight}</button>
        <button class="st-btn" data-hand="r" data-d="1" type="button">＋</button>
      </div>
      <span class="st-delta">${selRight > p.right ? "+" + (selRight - p.right) : ""}</span>
    </div>
    <div class="stepper-row">
      <span class="st-label">𝄢 Левая<br><i>до какого такта</i></span>
      <div class="stepper">
        <button class="st-btn" data-hand="l" data-d="-1" type="button">−</button>
        <button class="st-val" data-hand="l" type="button">${selLeft}</button>
        <button class="st-btn" data-hand="l" data-d="1" type="button">＋</button>
      </div>
      <span class="st-delta">${selLeft > p.left ? "+" + (selLeft - p.left) : ""}</span>
    </div>`;

  const btn = $("#logBtn");
  btn.classList.toggle("off", marked);
  btn.innerHTML = marked
    ? `<span class="log-emoji">✅</span><span>${selectedDate === todayStr() ? "Сегодня отмечено" : "День отмечен"}</span>`
    : `<span class="log-emoji">🎹</span><span>Позанимался!</span>`;
  $("#noteRow").style.display = marked ? "none" : "";

  document.querySelectorAll(".st-btn").forEach(b =>
    b.addEventListener("click", () => {
      const d = Number(b.dataset.d);
      if (b.dataset.hand === "r") selRight = Math.min(bars, Math.max(0, selRight + d));
      else selLeft = Math.min(bars, Math.max(0, selLeft + d));
      renderLog();
    }));

  document.querySelectorAll(".st-val").forEach(b =>
    b.addEventListener("click", () => {
      const hand = b.dataset.hand === "r" ? "правой" : "левой";
      const v = prompt(`До какого такта разобрал ${hand} рукой?`, b.textContent);
      if (v === null) return;
      const n = Math.round(Number(v.replace(",", ".")));
      if (isNaN(n) || n < 0 || n > bars) { toast(`Число от 0 до ${bars}`); return; }
      if (b.dataset.hand === "r") selRight = n; else selLeft = n;
      renderLog();
    }));
}

function renderWeek() {
  const w = weekStats();
  const st = streak();
  $("#weekStats").innerHTML = `
    <div class="stat"><b>${w.count}</b><span>${plural(w.count, "день", "дня", "дней")} на этой неделе</span></div>
    <div class="stat"><b>+${w.bars}</b><span>${plural(w.bars, "такт", "такта", "тактов")} за неделю</span></div>
    <div class="stat"><b>${st}</b><span>${plural(st, "день подряд", "дня подряд", "дней подряд")}</span></div>`;
}

function renderCalendar() {
  const marked = new Set(entries().map(e => e.date));
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
    if (marked.has(ds)) cls += " l3";
    if (ds === today) cls += " today";
    if (ds === selectedDate) cls += " sel";
    if (ds > today) cls += " future";
    html += `<div class="${cls}" data-date="${ds}">${d}</div>`;
  }
  $("#calGrid").innerHTML = html;

  document.querySelectorAll(".day[data-date]").forEach(el =>
    el.addEventListener("click", () => {
      if (el.dataset.date > todayStr()) { toast("Это ещё в будущем 🙂"); return; }
      selectedDate = el.dataset.date;
      render();
    }));
}

function renderDay() {
  const e = entryFor(selectedDate);
  $("#dayTitle").textContent = "Запись · " + fmtDay(selectedDate);

  if (!e) {
    $("#dayList").innerHTML = `<div class="empty">Этот день не отмечен — жми «Позанимался», чтобы записать</div>`;
    return;
  }

  const parts = [];
  if (e.right) parts.push(`𝄞 до ${e.right}-го`);
  if (e.left) parts.push(`𝄢 до ${e.left}-го`);
  const what = parts.length ? parts.join(" · ") : "повторение";

  $("#dayList").innerHTML = `
    <div class="sess">
      <span class="smin">${what}</span>
      <span class="snote">${e.note ? esc(e.note) : "занимался"}</span>
      <button class="sdel" data-id="${e.id}" type="button" aria-label="Удалить">✕</button>
    </div>`;

  document.querySelectorAll(".sdel").forEach(b =>
    b.addEventListener("click", () => deleteEntry(b.dataset.id)));
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
  return { v: 2, savedAt: now(), piece: data.piece, entries: data.entries };
}

// Слияние по id: побеждает более свежий updatedAt
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
    if (remote.piece && (remote.piece.updatedAt || 0) > (data.piece.updatedAt || 0)) {
      data.piece = remote.piece;
    }
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
    if (mergedJson !== localJson) { syncSteppers(); render(); }
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
  syncSteppers();

  $("#gearBtn").addEventListener("click", openSettings);
  $("#logBtn").addEventListener("click", saveDay);
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
