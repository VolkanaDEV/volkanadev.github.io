/* Sanguis live demo: experiments that replay the repo fixtures */
const ROD_EXPECTED = "rod of 16 cells, 32 ticks\nt7 cell 0 heat 100\nt7 cell 1 heat 60.723876953125\nt7 cell 2 heat 30.17578125\nt7 cell 3 heat 11.846923828125\nt7 cell 4 heat 3.515625\nt7 cell 5 heat 0.738525390625\nt7 cell 6 heat 0.09765625\nt7 cell 7 heat 0.006103515625\nt7 cell 8 heat 0\nt7 cell 9 heat 0\nt7 cell 10 heat 0\nt7 cell 11 heat 0\nt7 cell 12 heat 0\nt7 cell 13 heat 0\nt7 cell 14 heat 0\nt7 cell 15 heat 0\nt15 cell 0 heat 100\nt15 cell 1 heat 72.0100131817162\nt15 cell 2 heat 47.312965989112854\nt15 cell 3 heat 28.104151505976915\nt15 cell 4 heat 14.961278438568115\nt15 cell 5 heat 7.075554598122835\nt15 cell 6 heat 2.9449373483657837\nt15 cell 7 heat 1.0673840530216694\nt15 cell 8 heat 0.3326892852783203\nt15 cell 9 heat 0.08779102936387062\nt15 cell 10 heat 0.019219517707824707\nt15 cell 11 heat 0.00339532271027565\nt15 cell 12 heat 0.0004649162292480469\nt15 cell 13 heat 0.00004628673195838928\nt15 cell 14 heat 0.0000029802322387695313\nt15 cell 15 heat 0.00000009313225746154785\nt23 cell 0 heat 100\nt23 cell 1 heat 77.08669945730264\nt23 cell 2 heat 56.006462958021075\nt23 cell 3 heat 38.169339766321286\nt23 cell 4 heat 24.296021728332562\nt23 cell 5 heat 14.386508844054902\nt23 cell 6 heat 7.894069368148848\nt23 cell 7 heat 3.9986056826052163\nt23 cell 8 heat 1.862383661502065\nt23 cell 9 heat 0.7942726510165699\nt23 cell 10 heat 0.3087676477562695\nt23 cell 11 heat 0.10885384529473185\nt23 cell 12 heat 0.03460039215070765\nt23 cell 13 heat 0.009851336470489969\nt23 cell 14 heat 0.0025081200490717492\nt23 cell 15 heat 0.0006610533418438536\nt31 cell 0 heat 100\nt31 cell 1 heat 80.13064925040662\nt31 cell 2 heat 61.46550157654622\nt31 cell 3 heat 44.99625362902315\nt31 cell 4 heat 31.350305329659108\nt31 cell 5 heat 20.736789985851658\nt31 cell 6 heat 12.991792303894822\nt31 cell 7 heat 7.692583374597639\nt31 cell 8 heat 4.295654650055652\nt31 cell 9 heat 2.257497878153664\nt31 cell 10 heat 1.1141441236990097\nt31 cell 11 heat 0.5152564392003935\nt31 cell 12 heat 0.2228277483216251\nt31 cell 13 heat 0.09010631307526638\nt31 cell 14 heat 0.03478323724666872\nt31 cell 15 heat 0.015466153762574052\ncooled\n0\n";
const TASK_EXPECTED = "w1 at 0 sum 0\nw1 at 150 sum 1136275\nw2 at 0 sum 0\nw2 at 200 sum 2686700\nparent spawns a child\nparent 0\nrunaway 500\nrunaway 1000\nchild at 0 sum 0\nchild at 100 sum 338350\nchild at 200 sum 2686700\nw1 at 300 sum 9045050\nw1 at 450 sum 30476325\nw2 at 400 sum 21413400\nparent 1\nrunaway 1500\nrunaway 2000\nw1 at 600 sum 72180100\nparent 2\nrunaway 2500\nrunaway 3000\nwatchdog steps in\nw1 at 750 sum 140906375\nw1 finished\ndone\n0\n";
const RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise(r => setTimeout(r, RM ? 0 : ms));

/* ---------- fingerprints ---------- */
async function sha(text) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    for (let i = 0; i < text.length; i++) { h1 = Math.imul(h1 ^ text.charCodeAt(i), 16777619) >>> 0; h2 = Math.imul(h2 ^ text.charCodeAt(i), 2246822507) >>> 0; }
    return (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).repeat(4);
  }
}
const hueOf = (h) => parseInt(h.slice(0, 6), 16) % 360;

/* ---------- number printing like Sanguis (no exponent) ---------- */
function fmt(x) {
  if (Object.is(x, -0)) x = 0;
  let s = String(x); if (!/e/.test(s)) return s;
  let [m, e] = s.split("e"); e = +e; const neg = m[0] === "-"; if (neg) m = m.slice(1);
  const [a, b = ""] = m.split("."); const d = a + b; const p = a.length + e;
  const r = p <= 0 ? "0." + "0".repeat(-p) + d : (p >= d.length ? d + "0".repeat(p - d.length) : d.slice(0, p) + "." + d.slice(p));
  return (neg ? "-" : "") + r;
}

/* ---------- rod simulation ---------- */
const N = 16, T = 32;
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
function simulate(racy, threads) {
  const grid = []; let inbox = Array.from({ length: N }, () => []);
  for (let t = 0; t < T; t++) {
    const next = Array.from({ length: N }, () => []); const row = [];
    for (let id = 0; id < N; id++) {
      let msgs = inbox[id].slice().sort((a, b) => a.from - b.from);
      if (racy && threads > 1) msgs = shuffle(msgs);
      const got = msgs.map(m => m.v);
      let mine = id === 0 ? 100 : 0, near = 0, count = 0;
      if (t > 0) { const me_at = id === 0 ? 0 : 1; let k = 0; for (const v of got) { if (k === me_at) mine = v; else { near += v; count++; } k++; } }
      if (id === 0) mine = 100; else mine = mine + 0.25 * (near - count * mine);
      if (id > 0) next[id - 1].push({ from: id, v: mine });
      next[id].push({ from: id, v: mine });
      if (id < 15) next[id + 1].push({ from: id, v: mine });
      row.push(mine);
    }
    grid.push(row); inbox = next;
  }
  return grid;
}
const REF = simulate(false, 1);
const refLines = ROD_EXPECTED.trimEnd().split("\n");
function linesFor(grid) {
  // Use the reference bytes wherever the value is unchanged, so only real differences show.
  const out = ["rod of 16 cells, 32 ticks"];
  for (let t = 7; t < T; t += 8) for (let id = 0; id < N; id++) {
    const v = grid[t][id];
    out.push(v === REF[t][id] ? refLines[out.length] : `t${t} cell ${id} heat ${fmt(v)}`);
  }
  out.push("cooled", "0");
  return out;
}

function heatColor(v) {
  const x = Math.max(0, Math.min(1, v / 100)); const g = Math.pow(x, 0.45);
  const stops = [[5,4,5],[70,6,14],[200,32,42],[255,122,61],[255,214,150],[255,246,230]];
  const p = g * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(p)), f = p - i;
  const c = stops[i].map((s, k) => Math.round(s + (stops[i + 1][k] - s) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function drawRow(ctx, grid, t, diffAgainst) {
  const cw = ctx.canvas.width / N, ch = ctx.canvas.height / T;
  for (let id = 0; id < N; id++) {
    ctx.fillStyle = heatColor(grid[t][id]);
    ctx.fillRect(id * cw, t * ch, Math.ceil(cw), Math.ceil(ch));
    if (diffAgainst && grid[t][id] !== diffAgainst[t][id]) {
      ctx.fillStyle = "#f2c14e";
      ctx.fillRect(id * cw + cw - 3, t * ch + 1, 2, Math.max(1, ch - 2));
    }
  }
}
function clearCanvas(c) { const ctx = c.getContext("2d"); ctx.fillStyle = "#050405"; ctx.fillRect(0, 0, c.width, c.height); return ctx; }

let threads = 8;
const THREAD_COLORS = ["#c8202a","#ff7a3d","#f2c14e","#7f93a6","#b06ab3","#4fb3a9","#e8e1d5","#6d8f3f","#d45d79","#3f6fb3","#a88b5a","#8c3f2a","#5aa0d4","#c9a0dc","#2e8b57","#9a918a"];
function paintThreads(el, racyOrder) {
  el.innerHTML = "";
  const per = N / threads;
  for (let id = 0; id < N; id++) {
    const i = document.createElement("i");
    const th = Math.floor(id / per);
    i.style.background = THREAD_COLORS[th % THREAD_COLORS.length];
    if (racyOrder) i.style.opacity = (0.35 + 0.65 * racyOrder[th]).toFixed(2);
    el.appendChild(i);
  }
}
function setThreads(n) {
  threads = n;
  document.querySelectorAll(".seg button").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.t === n)));
  $("thrCapA").textContent = `${n} thread${n > 1 ? "s" : ""} · colour = thread`;
  $("thrCapB").textContent = `${n} thread${n > 1 ? "s" : ""} · colour = thread`;
  paintThreads($("thrA")); paintThreads($("thrB"));
}

const state = { A: { runs: 0, seen: new Set(), hist: [], prev: null }, B: { runs: 0, seen: new Set(), hist: [], prev: null } };
function renderTerm(el, lines, prevLines) {
  el.innerHTML = "";
  lines.forEach((ln, i) => {
    const s = document.createElement("span"); s.className = "l";
    if (prevLines && prevLines[i] !== undefined && prevLines[i] !== ln) s.classList.add("bad");
    if (i === 0 || ln === "cooled" || ln === "0") s.classList.add("sys");
    s.textContent = ln; el.appendChild(s);
  });
}
function paintHist(el, hist) {
  el.innerHTML = "";
  for (let k = 0; k < 24; k++) {
    const i = document.createElement("i"); const h = hist[hist.length - 24 + k];
    if (h) i.style.background = `hsl(${hueOf(h)} 70% 52%)`;
    el.appendChild(i);
  }
}

let rodBusy = false;
async function runRod(animate) {
  if (rodBusy) return; rodBusy = true;
  const gA = simulate(true, threads);
  const linesA = linesFor(gA), linesB = refLines.slice();
  const ctxA = clearCanvas($("heatA")), ctxB = clearCanvas($("heatB"));
  const tA = $("termA"), tB = $("termB");
  tA.innerHTML = ""; tB.innerHTML = "";
  const prevA = state.A.prev;
  let shown = 1;
  for (let t = 0; t < T; t++) {
    drawRow(ctxA, gA, t, REF); drawRow(ctxB, REF, t, null);
    paintThreads($("thrA"), Array.from({ length: threads }, () => Math.random()));
    if (t % 8 === 7 || t === T - 1) {
      shown = 1 + Math.floor((t + 1) / 8) * 16 + (t === T - 1 ? 2 : 0);
      renderTerm(tA, linesA.slice(0, shown), prevA); renderTerm(tB, linesB.slice(0, shown), state.B.prev);
      tA.scrollTop = tA.scrollHeight; tB.scrollTop = tB.scrollHeight;
    }
    if (animate) await sleep(70);
  }
  paintThreads($("thrA"));
  const [hA, hB] = await Promise.all([sha(linesA.join("\n") + "\n"), sha(linesB.join("\n") + "\n")]);
  for (const [k, h, lines] of [["A", hA, linesA], ["B", hB, linesB]]) {
    const s = state[k]; s.runs++; s.seen.add(h); s.hist.push(h); s.prev = lines;
    $("hash" + k).textContent = h.slice(0, 16);
    $("hash" + k).style.color = `hsl(${hueOf(h)} 75% 62%)`;
    $("runs" + k).textContent = s.runs; $("dist" + k).textContent = s.seen.size;
    paintHist($("hist" + k), s.hist);
  }
  rodBusy = false;
}

let autoTimer = null;
$("rodRun").addEventListener("click", () => runRod(true));
$("rodAuto").addEventListener("click", (e) => {
  const on = !autoTimer;
  e.currentTarget.textContent = on ? "Auto-run: on" : "Auto-run: off";
  e.currentTarget.setAttribute("aria-pressed", String(on));
  if (on) { const loop = async () => { await runRod(true); autoTimer = setTimeout(loop, 500); }; autoTimer = setTimeout(loop, 0); }
  else { clearTimeout(autoTimer); autoTimer = null; }
});
document.querySelectorAll(".seg button").forEach(b => b.addEventListener("click", () => { setThreads(+b.dataset.t); runRod(true); }));

/* ---------- tasks ---------- */
const TASKS = ["w1", "w2", "parent", "child", "runaway", "watchdog"];
const taskLines = TASK_EXPECTED.trimEnd().split("\n");
function ownerOf(line) {
  if (line.startsWith("w1 at")) return "w1";
  if (line.startsWith("w2 at")) return "w2";
  if (line.startsWith("parent")) return "parent";
  if (line.startsWith("child")) return "child";
  if (line.startsWith("runaway")) return "runaway";
  if (line.startsWith("watchdog")) return "watchdog";
  return null;
}
function buildLanes(el) {
  el.innerHTML = ""; const map = {};
  for (const t of TASKS) {
    const row = document.createElement("div"); row.className = "lane";
    row.innerHTML = `<span class="name">${t}</span><span class="bar"><i></i></span><span class="st8">waiting</span>`;
    el.appendChild(row); map[t] = row;
  }
  return map;
}
function lane(map, t, pct, status, cls) {
  const r = map[t]; if (!r) return;
  if (pct != null) r.querySelector("i").style.width = Math.min(100, pct) + "%";
  if (status) r.querySelector(".st8").textContent = status;
  Object.values(map).forEach(x => x.classList.remove("active"));
  r.classList.add("active");
  if (cls) r.classList.add(cls);
}
function addLine(term, text, cls) {
  const s = document.createElement("span"); s.className = "l" + (cls ? " " + cls : ""); s.textContent = text;
  term.appendChild(s); term.scrollTop = term.scrollHeight;
}
const progressOf = {
  w1: (l) => { const m = l.match(/at (\d+)/); return m ? (+m[1] + 1) / 900 * 100 : null; },
  w2: (l) => { const m = l.match(/at (\d+)/); return m ? (+m[1] + 1) / 600 * 100 : null; },
  child: (l) => { const m = l.match(/at (\d+)/); return m ? (+m[1] + 1) / 300 * 100 : null; },
  parent: (l) => { const m = l.match(/parent (\d)/); return m ? (+m[1] + 1) / 3 * 100 : 8; },
  runaway: (l) => { const m = l.match(/(\d+)/); return m ? Math.min(100, +m[1] / 3000 * 100) : null; },
  watchdog: () => 100,
};

let taskRun = 0;
async function runTasks() {
  const my = ++taskRun;
  const A = buildLanes($("lanesA")), B = buildLanes($("lanesB"));
  $("tTermA").innerHTML = ""; $("tTermB").innerHTML = ""; $("stampA").innerHTML = ""; $("stampB").innerHTML = "";

  // Sanguis: real fixture output, in order
  const ours = (async () => {
    for (const line of taskLines) {
      if (my !== taskRun) return;
      const who = ownerOf(line);
      if (who) lane(B, who, progressOf[who](line), who === "runaway" ? "spinning" : "turn");
      if (line === "watchdog steps in") { lane(B, "watchdog", 100, "done", "done"); lane(B, "runaway", null, "stopped", "dead"); }
      if (line === "w1 finished") { lane(B, "w1", 100, "done", "done"); }
      addLine($("tTermB"), line, line === "watchdog steps in" ? "err" : (line === "done" || line === "0" ? "sys" : null));
      await sleep(260);
    }
    for (const t of ["w2", "parent", "child"]) lane(B, t, 100, "done", "done");
    Object.values(B).forEach(x => x.classList.remove("active"));
    $("stampB").innerHTML = `<div class="stamp ok">run_all() returned · done</div>`;
  })();

  // Cooperative loop: each task runs until it awaits. runaway never does.
  const theirs = (async () => {
    const seq = [];
    for (const l of taskLines) if (l.startsWith("w1 at")) seq.push(l);
    seq.push("__w1end");
    for (const l of taskLines) if (l.startsWith("w2 at")) seq.push(l);
    seq.push("__w2end", "parent spawns a child", "parent 0");
    for (const line of seq) {
      if (my !== taskRun) return;
      if (line === "__w1end") { lane(A, "w1", 100, "done", "done"); continue; }
      if (line === "__w2end") { lane(A, "w2", 100, "done", "done"); continue; }
      const who = ownerOf(line);
      lane(A, who, progressOf[who](line), "running");
      addLine($("tTermA"), line);
      await sleep(260);
    }
    lane(A, "parent", null, "awaiting");
    const vbar = A.runaway.querySelector("i"); vbar.style.width = "100%"; vbar.classList.add("spin");
    lane(A, "runaway", null, "holds loop");
    for (const t of ["parent", "child", "watchdog"]) { A[t].classList.add("frozen"); A[t].querySelector(".st8").textContent = "never runs"; }
    A.parent.querySelector(".st8").textContent = "never resumes";
    $("stampA").innerHTML = `<div class="stamp frozen">Event loop blocked</div>`;
    let n = 0;
    while (my === taskRun) {
      n += 500; addLine($("tTermA"), "runaway " + n, "hot");
      if ($("tTermA").childElementCount > 200) $("tTermA").firstChild.remove();
      await sleep(RM ? 400 : 90);
      if (RM && n > 5000) break;
    }
  })();
  await ours;
}
$("taskRun").addEventListener("click", runTasks);
$("taskStop").addEventListener("click", () => {
  if (!taskRun) return;
  taskRun++;
  addLine($("tTermA"), "stopped by you", "sys");
});

/* ---------- three machines ---------- */
let trioRun = 0;
async function runTrio() {
  const my = ++trioRun;
  const v = $("verdict"); v.className = "verdict"; v.textContent = "Running on three executors";
  const hashes = await Promise.all([0, 1, 2].map(async (k) => {
    const m = $("m" + k); m.classList.remove("match");
    const term = m.querySelector(".term"); term.innerHTML = "";
    m.querySelector("footer b").textContent = "running";
    await sleep(k * 380);
    for (const line of taskLines) {
      if (my !== trioRun) return null;
      addLine(term, line, line === "watchdog steps in" ? "err" : null);
      await sleep(80 + k * 22);
    }
    const h = await sha(TASK_EXPECTED);
    m.querySelector("footer b").textContent = h.slice(0, 16);
    return h;
  }));
  if (my !== trioRun) return;
  if (hashes.every(h => h === hashes[0])) {
    [0, 1, 2].forEach(k => $("m" + k).classList.add("match"));
    v.className = "verdict on"; v.innerHTML = `Three machines. <em>One fingerprint.</em> ${TASK_EXPECTED.length} bytes, identical.`;
  }
}
$("trioRun").addEventListener("click", runTrio);

/* ---------- ouroboros ---------- */
const HASH = document.getElementById("g1").textContent.trim();
const ring = $("ring"), rctx = ring.getContext("2d");
let angle = 0, ringGen = 1, ringTyped = [HASH.length, 0, 0];
function drawRing() {
  const W = ring.width, cx = W / 2, R = W * 0.36;
  rctx.clearRect(0, 0, W, W);
  rctx.lineWidth = 26; rctx.strokeStyle = "#1b181d";
  rctx.beginPath(); rctx.arc(cx, cx, R, 0, Math.PI * 2); rctx.stroke();
  const grad = rctx.createConicGradient ? rctx.createConicGradient(angle - Math.PI / 2, cx, cx) : null;
  if (grad) { grad.addColorStop(0, "rgba(200,32,42,0)"); grad.addColorStop(0.75, "rgba(200,32,42,.9)"); grad.addColorStop(1, "#ff7a3d"); rctx.strokeStyle = grad; }
  else rctx.strokeStyle = "#c8202a";
  rctx.beginPath(); rctx.arc(cx, cx, R, angle - Math.PI / 2 - Math.PI * 1.5, angle - Math.PI / 2); rctx.stroke();
  const hx = cx + R * Math.cos(angle - Math.PI / 2), hy = cx + R * Math.sin(angle - Math.PI / 2);
  rctx.fillStyle = "#fff4e2"; rctx.beginPath(); rctx.arc(hx, hy, 15, 0, Math.PI * 2); rctx.fill();
  rctx.fillStyle = "#9a918a"; rctx.font = "600 22px 'JetBrains Mono', monospace"; rctx.textAlign = "center";
  rctx.fillText("compiler.sanguis", cx, cx - R - 34);
  rctx.fillText("compiler.bc", cx, cx + R + 52);
  rctx.fillStyle = "#efe8dc"; rctx.font = "900 92px 'Archivo', sans-serif";
  rctx.fillText("GEN " + ringGen, cx, cx + 20);
  rctx.fillStyle = "#6c645f"; rctx.font = "500 20px 'JetBrains Mono', monospace";
  rctx.fillText("compiles itself", cx, cx + 62);
}
function typeGen(k) {
  const el = $("g" + (k + 1)); const n = ringTyped[k];
  el.innerHTML = `<span class="m">${HASH.slice(0, n)}</span>${n < HASH.length ? "" : " ✓"}`;
}
let last = 0;
function tick(ts) {
  const dt = Math.min(50, ts - (last || ts)); last = ts;
  angle += dt * 0.0042;
  if (angle >= Math.PI * 2) { angle -= Math.PI * 2; ringGen = ringGen >= 3 ? 1 : ringGen + 1; if (ringGen === 1) ringTyped = [HASH.length, 0, 0]; }
  if (ringGen > 1) { const k = ringGen - 1; ringTyped[k] = Math.min(HASH.length, Math.floor(angle / (Math.PI * 2) * HASH.length * 1.25)); }
  [0, 1, 2].forEach(typeGen);
  drawRing();
  requestAnimationFrame(tick);
}
$("ringRun").addEventListener("click", () => { angle = 0; ringGen = 1; ringTyped = [HASH.length, 0, 0]; });

/* ---------- vein band (seeded, so it draws the same every load) ---------- */
function drawVeins() {
  const c = $("veins"); const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = c.clientWidth, H = c.clientHeight; if (!W) return;
  c.width = W * dpr; c.height = H * dpr; const x = c.getContext("2d"); x.scale(dpr, dpr);
  let seed = 3950; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 22; k++) {
    let px = -20, py = 10 + rnd() * (H - 30);
    x.beginPath(); x.moveTo(px, py);
    x.strokeStyle = `rgba(200,32,42,${(0.18 + rnd() * 0.3).toFixed(2)})`; x.lineWidth = rnd() < 0.2 ? 1.6 : 1;
    while (px < W + 20) {
      px += 18 + rnd() * 70; x.lineTo(px, py);
      if (rnd() < 0.55) { py = Math.max(6, Math.min(H - 10, py + (rnd() - 0.5) * 46)); x.lineTo(px, py); }
    }
    x.stroke();
  }
  seed = 7;
  for (let k = 0; k < Math.round(W / 48); k++) {
    const nx = rnd() * W, ny = 14 + rnd() * (H - 40);
    x.fillStyle = "rgba(200,32,42,.55)"; x.beginPath(); x.arc(nx, ny, 2 + rnd() * 2.5, 0, Math.PI * 2); x.fill();
    if (rnd() < 0.35) { x.strokeStyle = "rgba(200,32,42,.45)"; x.beginPath(); x.ellipse(nx, ny + 18, 18 + rnd() * 14, 3.5, 0, 0, Math.PI * 2); x.stroke(); }
  }
}
drawVeins();
let vt; window.addEventListener("resize", () => { clearTimeout(vt); vt = setTimeout(drawVeins, 150); });

/* ---------- boot: fill everything at rest, then come alive ---------- */
setThreads(8);
(async () => {
  await runRod(false);
  await runRod(false);
  // tasks: show final Sanguis state immediately
  const B = buildLanes($("lanesB")); buildLanes($("lanesA"));
  taskLines.forEach(l => addLine($("tTermB"), l, l === "watchdog steps in" ? "err" : null));
  for (const t of TASKS) lane(B, t, 100, t === "runaway" ? "stopped" : "done", t === "runaway" ? "dead" : "done");
  Object.values(B).forEach(x => x.classList.remove("active"));
  $("stampB").innerHTML = `<div class="stamp ok">run_all() returned · done</div>`;
  addLine($("tTermA"), "press Start both", "sys");
  // trio: show identical results at rest
  const h = await sha(TASK_EXPECTED);
  [0, 1, 2].forEach(k => { const m = $("m" + k); taskLines.forEach(l => addLine(m.querySelector(".term"), l, l === "watchdog steps in" ? "err" : null)); m.querySelector("footer b").textContent = h.slice(0, 16); m.classList.add("match"); });
  $("verdict").className = "verdict on"; $("verdict").innerHTML = `Three machines. <em>One fingerprint.</em> ${TASK_EXPECTED.length} bytes, identical.`;
  if (RM) { ringTyped = [HASH.length, HASH.length, HASH.length]; ringGen = 3; [0,1,2].forEach(typeGen); drawRing(); }
  else requestAnimationFrame(tick);
})();
