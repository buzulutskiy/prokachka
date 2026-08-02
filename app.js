"use strict";

/* ══════════════ Константы ══════════════ */

const LS = { data: "prokachka-data-v1", cfg: "prokachka-cfg-v1" };
const GIST_FILE = "prokachka.json";
const GIST_DESC = "Прокачка — трекер хобби (данные приложения)";

// Лестница уровней для пианино. Валюта прогресса — опыт: одно занятие = +10 XP.
// Сколько сидел — 15 минут, полчаса или час — не важно: сел, поразбирал такты, отметил.
// Первые уровни берутся за одно-три занятия, дальше шаг растёт плавно — чтобы
// прогресс чувствовался часто, а поздние уровни оставались честными.
const XP_PER_SESSION = 10;

const PIANO_LEVELS = [
  { n: 1,  name: "Старт",             xp: 0,     desc: "Самое сложное — начать, и ты уже здесь" },
  { n: 2,  name: "Первый подход",     xp: 10,    desc: "Первое занятие в копилке!" },
  { n: 3,  name: "Разгон",            xp: 30,    desc: "Пальцы начинают вспоминать сами" },
  { n: 4,  name: "Втянулся",          xp: 60,    desc: "Несколько подходов — и это уже похоже на привычку" },
  { n: 5,  name: "В ритме",           xp: 100,   desc: "Десять занятий — регулярность налицо" },
  { n: 6,  name: "Набираю ход",       xp: 150,   desc: "Куски складываются в целое" },
  { n: 7,  name: "Первые разборы",    xp: 210,   desc: "Композиции собираются из кусков в целые вещи" },
  { n: 8,  name: "Крепкая база",      xp: 280,   desc: "Целый месяц играющей практики" },
  { n: 9,  name: "Уверенный ход",     xp: 360,   desc: "Разбор идёт заметно быстрее, чем раньше" },
  { n: 10, name: "Пара пьес в руках", xp: 450,   desc: "Несколько вещей звучат уверенно от начала до конца" },
  { n: 11, name: "Накат",             xp: 600,   desc: "Руки сами находят знакомые ходы" },
  { n: 12, name: "Своя колея",        xp: 750,   desc: "Заниматься стало так же естественно, как пить кофе" },
  { n: 13, name: "Играющий",          xp: 950,   desc: "Средняя пьеса — это недели разбора, а не месяцы" },
  { n: 14, name: "Твёрдая рука",      xp: 1200,  desc: "Выученное держится в форме почти само" },
  { n: 15, name: "Любитель",          xp: 1500,  desc: "Репертуар растёт на глазах" },
  { n: 16, name: "Крепкий любитель",  xp: 1850,  desc: "Новые такты ложатся с первых повторов" },
  { n: 17, name: "Своя полка пьес",   xp: 2250,  desc: "Есть что сыграть под любое настроение" },
  { n: 18, name: "Продвинутый",       xp: 2700,  desc: "Сложные вещи по зубам" },
  { n: 19, name: "Своя интерпретация", xp: 3300, desc: "Играешь уже не ноты, а музыку" },
  { n: 20, name: "Почти профи",       xp: 4000,  desc: "Шопен и Дебюсси среднего уровня звучат как надо" },
  { n: 21, name: "Легенда клавиш",    xp: 4800,  desc: "Столько занятий — о таком пишут в биографиях" },
  { n: 22, name: "Мастер разбора",    xp: 5700,  desc: "Сложное учится быстро, простое — с листа" },
  { n: 23, name: "Мастер",            xp: 6800,  desc: "Большой репертуар, уверенность в каждой вещи" },
  { n: 24, name: "Монумент",          xp: 8000,  desc: "Планка, до которой доходят единицы" },
  { n: 25, name: "Виртуоз",           xp: 10000, desc: "Уровень, за который не стыдно на любой сцене" }
];

// Подбадривания после отметки занятия
const CHEERS = [
  "Отлично! Такты сами себя не разберут — а ты разобрал",
  "Есть! Ещё кусочек композиции твой",
  "Красавчик, инструмент доволен",
  "Плюс в копилку — так и качаются",
  "Сессия засчитана. Руки помнят!",
  "Ещё один подход — уровень ближе",
  "Хорошая работа, продолжаем разбор",
  "Записал! Главное — регулярность, и она у тебя есть"
];

const DOW = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

/* ══════════════ Состояние ══════════════ */

let data = { hobbies: [], sessions: [] };
let cfg = { token: "", gistId: "", activeHobby: "piano", lastSync: 0 };

let calYear, calMonth;          // отображаемый месяц календаря
let selectedDate = todayStr();  // день, в который пишется занятие
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
  const d = fromStr(s);
  const t = todayStr();
  if (s === t) return "сегодня";
  if (s === dateStr(new Date(Date.now() - 864e5))) return "вчера";
  return new Intl.DateTimeFormat("ru", { day: "numeric", month: "long" }).format(d);
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
  toast.t = setTimeout(() => el.classList.remove("show"), 2000);
}

function plural(n, one, few, many) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}

/* ══════════════ Хранилище ══════════════ */

function load() {
  try { data = Object.assign(data, JSON.parse(localStorage.getItem(LS.data)) || {}); } catch {}
  try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem(LS.cfg)) || {}); } catch {}

  if (!data.hobbies.length) {
    data.hobbies = [{
      id: "piano", name: "Пианино", emoji: "🎹", leveled: true,
      createdAt: now(), updatedAt: now()
    }];
  }
  if (!data.hobbies.some(h => h.id === cfg.activeHobby && !h.deleted)) {
    cfg.activeHobby = data.hobbies.find(h => !h.deleted)?.id || "piano";
  }
}

function saveData() { localStorage.setItem(LS.data, JSON.stringify(data)); }
function saveCfg() { localStorage.setItem(LS.cfg, JSON.stringify(cfg)); }

/* ══════════════ Данные: выборки ══════════════ */

function activeHobby() {
  return data.hobbies.find(h => h.id === cfg.activeHobby && !h.deleted);
}

function hobbySessions(hobbyId) {
  return data.sessions.filter(s => s.hobbyId === hobbyId && !s.deleted);
}

function totalXp(hobbyId) {
  return hobbySessions(hobbyId).length * XP_PER_SESSION;
}

function countByDate(hobbyId) {
  const map = {};
  for (const s of hobbySessions(hobbyId)) map[s.date] = (map[s.date] || 0) + 1;
  return map;
}

// Понедельник недели, в которую входит дата
function mondayOf(d) {
  const r = new Date(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  return r;
}

function weekStats(hobbyId) {
  const start = dateStr(mondayOf(new Date()));
  const list = hobbySessions(hobbyId).filter(s => s.date >= start);
  const days = new Set(list.map(s => s.date));
  return { count: days.size, xp: list.length * XP_PER_SESSION };
}

function streak(hobbyId) {
  const days = new Set(hobbySessions(hobbyId).map(s => s.date));
  let n = 0;
  const d = new Date();
  if (!days.has(dateStr(d))) d.setDate(d.getDate() - 1); // сегодня ещё не занимался — не рвём серию
  while (days.has(dateStr(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ══════════════ Уровни ══════════════ */

function levelInfo(xp) {
  let i = 0;
  while (i + 1 < PIANO_LEVELS.length && xp >= PIANO_LEVELS[i + 1].xp) i++;
  const cur = PIANO_LEVELS[i];
  const next = PIANO_LEVELS[i + 1] || null;
  const progress = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
  return { cur, next, xp, progress: Math.min(1, Math.max(0, progress)) };
}

function fmtXp(xp) {
  return new Intl.NumberFormat("ru").format(Math.round(xp)) + " XP";
}

function maybeLevelUp(hobby, beforeXp, afterXp) {
  if (!hobby.leveled) return false;
  const before = levelInfo(beforeXp).cur.n;
  const after = levelInfo(afterXp).cur.n;
  if (after > before) {
    const lvl = PIANO_LEVELS.find(l => l.n === after);
    $("#lvlupNum").textContent = lvl.n;
    $("#lvlupName").textContent = "«" + lvl.name + "»";
    $("#lvlupDesc").textContent = lvl.desc;
    $("#lvlup").classList.add("show");
    return true;
  }
  return false;
}

/* ══════════════ Действия ══════════════ */

function addSession() {
  const hobby = activeHobby();
  if (!hobby) return;

  const before = totalXp(hobby.id);
  data.sessions.push({
    id: uid(),
    hobbyId: hobby.id,
    date: selectedDate,
    note: $("#noteInput").value.trim(),
    createdAt: now(),
    updatedAt: now()
  });
  $("#noteInput").value = "";
  saveData();
  schedulePush();

  const pop = $("#xpPop");
  pop.textContent = "+" + XP_PER_SESSION + " XP";
  pop.classList.remove("go");
  void pop.offsetWidth;
  pop.classList.add("go");

  render();
  const leveledUp = maybeLevelUp(hobby, before, totalXp(hobby.id));

  // Подбодрить, даже если до нового уровня ещё далеко
  if (!leveledUp) {
    let cheer = CHEERS[Math.floor(Math.random() * CHEERS.length)];
    if (hobby.leveled) {
      const li = levelInfo(totalXp(hobby.id));
      if (li.next) {
        const left = Math.ceil((li.next.xp - li.xp) / XP_PER_SESSION);
        cheer += ` · до уровня ${li.next.n} — ${left} ${plural(left, "занятие", "занятия", "занятий")}`;
      }
    }
    toast(cheer);
  }
}

function deleteSession(id) {
  const s = data.sessions.find(x => x.id === id);
  if (!s) return;
  s.deleted = true;
  s.updatedAt = now();
  saveData();
  schedulePush();
  render();
  toast("Запись удалена");
}

function switchHobby(id) {
  cfg.activeHobby = id;
  saveCfg();
  const t = new Date();
  calYear = t.getFullYear(); calMonth = t.getMonth();
  selectedDate = todayStr();
  render();
}

/* ══════════════ Рендер ══════════════ */

function render() {
  renderTabs();
  renderLevel();
  renderLog();
  renderWeek();
  renderCalendar();
  renderDay();
}

function renderTabs() {
  const hobbies = data.hobbies.filter(h => !h.deleted);
  const nav = $("#hobbyTabs");

  // Пока хобби одно — переключатель ни к чему
  if (hobbies.length < 2) { nav.innerHTML = ""; nav.style.display = "none"; return; }
  nav.style.display = "";

  nav.innerHTML = hobbies.map(h => `
    <button class="htab ${h.id === cfg.activeHobby ? "on" : ""}" data-id="${h.id}" type="button">
      <span>${esc(h.emoji)}</span><span>${esc(h.name)}</span>
    </button>
  `).join("");

  document.querySelectorAll(".htab[data-id]").forEach(b =>
    b.addEventListener("click", () => switchHobby(b.dataset.id)));
}

function renderLevel() {
  const hobby = activeHobby();
  const block = $("#levelBlock");
  if (!hobby) { block.innerHTML = ""; return; }

  const total = totalXp(hobby.id);

  if (!hobby.leveled) {
    const cnt = hobbySessions(hobby.id).length;
    block.innerHTML = `
      <div class="card">
        <h3>Всего</h3>
        <div class="stats-row">
          <div class="stat"><b>${cnt}</b><span>${plural(cnt, "занятие", "занятия", "занятий")}</span></div>
          <div class="stat"><b>${streak(hobby.id)}</b><span>${plural(streak(hobby.id), "день подряд", "дня подряд", "дней подряд")}</span></div>
          <div class="stat"><b>${fmtXp(total)}</b><span>опыта</span></div>
        </div>
      </div>`;
    return;
  }

  const li = levelInfo(total);
  const pct = Math.round(li.progress * 100);

  block.innerHTML = `
    <div class="level-card">
      <div class="level-top">
        <div class="level-badge"><b>${li.cur.n}</b><span>уровень</span></div>
        <div class="level-title">
          <div class="lname">«${esc(li.cur.name)}»</div>
          <div class="ldesc">${esc(li.cur.desc)}</div>
        </div>
      </div>
      <div class="xp-wrap">
        <div class="xp-bar"><div class="xp-fill" id="xpFill"></div></div>
        <div class="xp-nums">
          <span><b>${fmtXp(li.xp)}</b> набрано</span>
          <span>${li.next ? `до ${fmtXp(li.next.xp)} · <b>${pct}%</b>` : "максимум!"}</span>
        </div>
      </div>
      ${li.next ? (() => {
        const left = Math.ceil((li.next.xp - li.xp) / XP_PER_SESSION);
        return `
        <div class="level-next">
          До уровня ${li.next.n} «${esc(li.next.name)}» — <b>${left} ${plural(left, "занятие", "занятия", "занятий")}</b> · занятие = +${XP_PER_SESSION} XP
        </div>`;
      })() : ""}
      <button class="ladder-toggle" id="ladderBtn" type="button">Вся лестница уровней ›</button>
      <div class="ladder" id="ladder">
        ${PIANO_LEVELS.map(l => {
          const state = l.n < li.cur.n ? "done" : l.n === li.cur.n ? "now" : "";
          return `
            <div class="lrow ${state}">
              <span class="ln">${l.n < li.cur.n ? "✓" : l.n}</span>
              <span class="lt">«${esc(l.name)}»</span>
              <span class="lh">от ${fmtXp(l.xp)}</span>
              <span class="ld">${esc(l.desc)}</span>
            </div>`;
        }).join("")}
      </div>
    </div>`;

  requestAnimationFrame(() => { $("#xpFill").style.width = (li.progress * 100).toFixed(1) + "%"; });

  $("#ladderBtn").addEventListener("click", () => {
    const open = $("#ladder").classList.toggle("open");
    $("#ladderBtn").textContent = open ? "Свернуть лестницу ‹" : "Вся лестница уровней ›";
  });
}

function renderLog() {
  $("#logDay").textContent = fmtDay(selectedDate);
}

function renderWeek() {
  const hobby = activeHobby();
  if (!hobby) return;
  const w = weekStats(hobby.id);
  const st = streak(hobby.id);
  $("#weekStats").innerHTML = `
    <div class="stat"><b>${w.count}</b><span>${plural(w.count, "день", "дня", "дней")} на этой неделе</span></div>
    <div class="stat"><b>+${w.xp}</b><span>XP за неделю</span></div>
    <div class="stat"><b>${st}</b><span>${plural(st, "день подряд", "дня подряд", "дней подряд")}</span></div>`;
}

function renderCalendar() {
  const hobby = activeHobby();
  if (!hobby) return;

  const byDate = countByDate(hobby.id);
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
    const cnt = byDate[ds] || 0;
    let cls = "day";
    if (cnt > 0) cls += cnt >= 2 ? " l3" : " l2";
    if (ds === today) cls += " today";
    if (ds === selectedDate) cls += " sel";
    if (ds > today) cls += " future";
    html += `<div class="${cls}" data-date="${ds}" title="${cnt ? cnt + " " + plural(cnt, "занятие", "занятия", "занятий") : ""}">${d}</div>`;
  }
  $("#calGrid").innerHTML = html;

  document.querySelectorAll(".day[data-date]").forEach(el =>
    el.addEventListener("click", () => {
      if (el.dataset.date > today) { toast("Это ещё в будущем 🙂"); return; }
      selectedDate = el.dataset.date;
      render();
    }));
}

function renderDay() {
  const hobby = activeHobby();
  if (!hobby) return;
  const list = hobbySessions(hobby.id)
    .filter(s => s.date === selectedDate)
    .sort((a, b) => a.createdAt - b.createdAt);

  $("#dayTitle").textContent = "Записи · " + fmtDay(selectedDate);
  $("#dayList").innerHTML = list.length
    ? list.map(s => `
        <div class="sess">
          <span class="smin">+${XP_PER_SESSION} XP</span>
          <span class="snote">${s.note ? esc(s.note) : "занимался"}</span>
          <button class="sdel" data-id="${s.id}" type="button" aria-label="Удалить">✕</button>
        </div>`).join("")
    : `<div class="empty">В этот день записей нет — жми «Позанимался», чтобы отметить</div>`;

  document.querySelectorAll(".sdel").forEach(b =>
    b.addEventListener("click", () => deleteSession(b.dataset.id)));
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
      Чтобы часы и уровни не потерялись и были на всех устройствах — подключи <b>GitHub Gist</b>.<br><br>
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
  return { v: 1, savedAt: now(), hobbies: data.hobbies, sessions: data.sessions };
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

    let remote = { hobbies: [], sessions: [] };
    if (f) {
      let txt = f.content;
      if (f.truncated && f.raw_url) txt = await (await fetch(f.raw_url)).text();
      try { remote = JSON.parse(txt) || remote; } catch {}
    }

    const localJson = JSON.stringify(exportData().hobbies) + JSON.stringify(exportData().sessions);
    data.hobbies = mergeLists(data.hobbies, remote.hobbies);
    data.sessions = mergeLists(data.sessions, remote.sessions);
    cleanTombstones();
    saveData();

    const mergedJson = JSON.stringify(data.hobbies) + JSON.stringify(data.sessions);
    const remoteJson = JSON.stringify(remote.hobbies || []) + JSON.stringify(remote.sessions || []);

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

// Надгробия старше 60 дней вычищаем совсем
function cleanTombstones() {
  const limit = now() - 60 * 864e5;
  data.sessions = data.sessions.filter(s => !s.deleted || (s.updatedAt || 0) > limit);
  data.hobbies = data.hobbies.filter(h => !h.deleted || (h.updatedAt || 0) > limit);
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
  $("#logBtn").addEventListener("click", addSession);
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
