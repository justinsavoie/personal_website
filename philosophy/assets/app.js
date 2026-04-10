/* global fetch */

const dom = {
  // Landing and flow
  intro: document.getElementById('intro'),
  start: document.getElementById('start-btn'),
  carousel: document.getElementById('carousel-section'),
  progress: document.getElementById('progress-text'),
  qText: document.getElementById('q-text'),
  qDomain: document.getElementById('q-domain'),
  likert: document.getElementById('likert-container'),
  prev: document.getElementById('prev-btn'),
  next: document.getElementById('next-btn'),
  see: document.getElementById('see-results-btn'),
  reset: document.getElementById('reset-btn'),
  // Results
  results: document.getElementById('results'),
  nearest: document.getElementById('nearest-list'),
  justs: document.getElementById('justifications'),
  canvas: document.getElementById('scatter')
};

let MODEL = null; // loaded from data/model.json
let QUESTIONS = [];
const LIKERT_LABELS = [
  'Strongly disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly agree'
];
// Axis labels can be overridden by MODEL.meta.axis_labels after load
let AXIS_LABELS = { x: 'Factor 1', y: 'Factor 2' };
let LAST_USER_XY = null;
let SHOW_BIPLOT = false;
let ANSWERS = []; // number | null
let CUR = 0;
let VIEW_BOUNDS = null; // {minX,maxX,minY,maxY}
let HOVER_PHIL_ID = null;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInlineMarkdownSafe(s) {
  // Escape first to prevent HTML injection
  let t = escapeHtml(s);
  // Convert inline code `code`
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Convert bold **text** first
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Convert italics *text* (non-greedy, avoid matching already converted tags)
  t = t.replace(/(^|[\s\(\[\{\-\–\—])\*([^*]+)\*(?=$|[\s\)\]\}\.,;:!\?\-\–\—])/g, '$1<em>$2</em>');
  // Newlines to <br>
  t = t.replace(/\n/g, '<br>');
  return t;
}

async function loadModel() {
  // Try a couple of URL candidates to be resilient to odd hosts (e.g., http://[::]:8000/)
  const candidates = [
    new URL('data/model.json', window.location.href).toString(),
    new URL('/data/model.json', window.location.origin).toString()
  ];
  let lastErr = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (res.ok) {
        MODEL = await res.json();
        QUESTIONS = MODEL.questions;
        try { window.MODEL = MODEL; window.QUESTIONS = QUESTIONS; } catch (_) {}
        return;
      } else {
        lastErr = new Error(`HTTP ${res.status} loading ${url}`);
      }
    } catch (e) {
      lastErr = e;
    }
  }
  const host = window.location.host;
  throw new Error(`Failed to load model.json (host ${host}). Tried ${candidates.join(', ')}. ${lastErr ? String(lastErr) : ''}`);
}

function renderLikertButtons() {
  dom.likert.innerHTML = '';
  LIKERT_LABELS.forEach((label, j) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'likert-btn';
    btn.dataset.value = String(j + 1);
    btn.textContent = label;
    dom.likert.appendChild(btn);
  });
}

function renderCurrentQuestion() {
  const total = QUESTIONS.length;
  const q = QUESTIONS[CUR];
  dom.progress.textContent = `Question ${CUR + 1} of ${total}`;
  dom.qText.textContent = `${q.text}`;
  dom.qDomain.textContent = q.domain || '';
  // Ensure the info button is visible; fallback text will be shown if none
  const infoBtn = document.querySelector('.q-info-open');
  if (infoBtn) {
    infoBtn.style.visibility = 'visible';
    infoBtn.setAttribute('aria-hidden', 'false');
    try { infoBtn.dataset.info = (q && q.info) ? String(q.info) : ''; } catch (_) {}
  }
  // Restore selection state
  const val = ANSWERS[CUR];
  dom.likert.querySelectorAll('.likert-btn').forEach(b => {
    b.classList.toggle('active', Number(b.dataset.value) === val);
  });
  // Update nav buttons
  dom.prev.disabled = CUR === 0;
  dom.next.disabled = CUR === total - 1;
  // Toggle See Results visibility if complete
  const complete = ANSWERS.every(v => typeof v === 'number');
  dom.see.classList.toggle('hidden', !complete);
}

function collectAnswers() {
  if (!ANSWERS.every(v => typeof v === 'number')) return null;
  return ANSWERS.slice();
}

function projectUser(answers) {
  const means = MODEL.pca.means; // length 30
  const comps = MODEL.pca.components; // [2][30]
  const centered = answers.map((v, j) => v - means[j]);
  const x = centered.reduce((acc, vj, j) => acc + vj * comps[0][j], 0);
  const y = centered.reduce((acc, vj, j) => acc + vj * comps[1][j], 0);
  return [x, y];
}

function nearestPhilosophers(userXY, k = 3) {
  const entries = MODEL.philosophers.map(p => ({
    id: p.id, name: p.name, xy: MODEL.pca.coords[p.id], justification: p.justification
  }));
  entries.forEach(e => {
    const dx = e.xy[0] - userXY[0];
    const dy = e.xy[1] - userXY[1];
    e.dist = Math.hypot(dx, dy);
  });
  entries.sort((a, b) => a.dist - b.dist);
  return entries.slice(0, k);
}

function computeDefaultBounds(userXY) {
  const coords = Object.values(MODEL.pca.coords);
  const xs = coords.map(c => c[0]).concat([userXY[0]]);
  const ys = coords.map(c => c[1]).concat([userXY[1]]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 0.1;
  const rangeX = (maxX - minX) || 1;
  const rangeY = (maxY - minY) || 1;
  return {
    minX: minX - pad * rangeX,
    maxX: maxX + pad * rangeX,
    minY: minY - pad * rangeY,
    maxY: maxY + pad * rangeY,
  };
}

function drawPlot(userXY) {
  const canvas = dom.canvas;
  const ctx = canvas.getContext('2d');
  const W = canvas.__cssW || canvas.width, H = canvas.__cssH || canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Compute bounds from philosopher coords and user
  if (!VIEW_BOUNDS) VIEW_BOUNDS = computeDefaultBounds(userXY);
  const {minX, maxX, minY, maxY} = VIEW_BOUNDS;
  const rangeX = (maxX - minX) || 1;
  const rangeY = (maxY - minY) || 1;
  const sx = (x) => 30 + (W - 60) * (x - minX) / (rangeX || 1);
  const sy = (y) => H - (30 + (H - 60) * (y - minY) / (rangeY || 1));

  // Plot background and grid
  const plotX = 30, plotY = 30, plotW = W - 60, plotH = H - 60;
  // Soft background
  const bgGrad = ctx.createLinearGradient(0, plotY, 0, plotY + plotH);
  bgGrad.addColorStop(0, '#f8fafc');
  bgGrad.addColorStop(1, '#eef2f7');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(plotX, plotY, plotW, plotH);
  // Grid lines
  ctx.save();
  ctx.beginPath();
  const gridN = 6;
  ctx.strokeStyle = '#d9e0ea';
  ctx.lineWidth = 1;
  for (let i = 1; i < gridN; i++) {
    const gx = plotX + (plotW * i) / gridN;
    const gy = plotY + (plotH * i) / gridN;
    ctx.moveTo(gx, plotY); ctx.lineTo(gx, plotY + plotH);
    ctx.moveTo(plotX, gy); ctx.lineTo(plotX + plotW, gy);
  }
  ctx.stroke();
  ctx.restore();
  // Frame
  ctx.strokeStyle = '#2a3346';
  ctx.lineWidth = 1;
  ctx.strokeRect(plotX, plotY, plotW, plotH);

  // Labels
  ctx.fillStyle = '#5f6b7a';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(AXIS_LABELS.x, W/2 - ctx.measureText(AXIS_LABELS.x).width/2, H - 10);
  ctx.save();
  ctx.translate(12, H/2 + 24);
  ctx.rotate(-Math.PI/2);
  ctx.fillText(AXIS_LABELS.y, 0, 0);
  ctx.restore();

  // Draw axes at zero if within bounds
  const x0In = (0 >= minX) && (0 <= maxX);
  const y0In = (0 >= minY) && (0 <= maxY);
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#94a3b8';
  if (x0In) {
    const x0 = sx(0);
    ctx.beginPath(); ctx.moveTo(x0, plotY); ctx.lineTo(x0, plotY + plotH); ctx.stroke();
  }
  if (y0In) {
    const y0 = sy(0);
    ctx.beginPath(); ctx.moveTo(plotX, y0); ctx.lineTo(plotX + plotW, y0); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Philosophers
  // Precompute for hover hit-testing
  const hit = [];
  for (const p of MODEL.philosophers) {
    const [px, py] = MODEL.pca.coords[p.id];
    const cx = sx(px), cy = sy(py);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = (HOVER_PHIL_ID === p.id ? '#10b981' : '#22c55e');
    ctx.beginPath();
    ctx.arc(cx, cy, HOVER_PHIL_ID === p.id ? 6 : 4, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    // label box
    const label = p.name;
    const tw = ctx.measureText(label).width + 8;
    const th = 14;
    const lx = cx + 8, ly = cy - 6 - th;
    ctx.fillStyle = HOVER_PHIL_ID === p.id ? 'rgba(16,185,129,0.15)' : 'rgba(34,197,94,0.1)';
    ctx.fillRect(lx - 2, ly + 2, tw, th);
    ctx.fillStyle = HOVER_PHIL_ID === p.id ? '#064e3b' : '#14532d';
    ctx.fillText(label, lx, ly + th - 4);
    hit.push({x: cx, y: cy, r: 8, name: p.name, id: p.id});
  }

  // User point
  const ux = sx(userXY[0]), uy = sy(userXY[1]);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(ux, uy, 5, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
  // User label
  const ltxt = 'You';
  const tw2 = ctx.measureText(ltxt).width + 8;
  const th2 = 14;
  ctx.fillStyle = 'rgba(239,68,68,0.12)';
  ctx.fillRect(ux + 8 - 2, uy - 8 - th2 + 2, tw2, th2);
  ctx.fillStyle = '#7f1d1d';
  ctx.fillText(ltxt, ux + 8, uy - 8);

  // Store hit targets for tooltip
  canvas.__pcHits = hit;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (let n = 0; n < words.length; n++) {
    const test = line ? line + ' ' + words[n] : words[n];
    const w = ctx.measureText(test).width;
    if (w > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = words[n];
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
  return yy - y + lineHeight;
}

function drawBiplot(userXY) {
  const canvas = dom.canvas;
  const ctx = canvas.getContext('2d');
  const W = canvas.__cssW || canvas.width, H = canvas.__cssH || canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Bounds from philosopher coords and user
  if (!VIEW_BOUNDS) VIEW_BOUNDS = computeDefaultBounds(userXY);
  const {minX, maxX, minY, maxY} = VIEW_BOUNDS;
  const rangeX = (maxX - minX) || 1;
  const rangeY = (maxY - minY) || 1;
  const sx = (x) => 30 + (W - 60) * (x - minX) / (rangeX || 1);
  const sy = (y) => H - (30 + (H - 60) * (y - minY) / (rangeY || 1));

  // Axes frame + background
  const plotX = 30, plotY = 30, plotW = W - 60, plotH = H - 60;
  const bgGrad = ctx.createLinearGradient(0, plotY, 0, plotY + plotH);
  bgGrad.addColorStop(0, '#f8fafc');
  bgGrad.addColorStop(1, '#eef2f7');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(plotX, plotY, plotW, plotH);
  // Grid
  ctx.beginPath();
  ctx.strokeStyle = '#d9e0ea';
  for (let i = 1; i < 6; i++) {
    const gx = plotX + (plotW * i) / 6;
    const gy = plotY + (plotH * i) / 6;
    ctx.moveTo(gx, plotY); ctx.lineTo(gx, plotY + plotH);
    ctx.moveTo(plotX, gy); ctx.lineTo(plotX + plotW, gy);
  }
  ctx.stroke();
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(plotX, plotY, plotW, plotH);

  // Axis labels
  ctx.fillStyle = '#5f6b7a';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(AXIS_LABELS.x, W/2 - ctx.measureText(AXIS_LABELS.x).width/2, H - 10);
  ctx.save();
  ctx.translate(12, H/2 + 24);
  ctx.rotate(-Math.PI/2);
  ctx.fillText(AXIS_LABELS.y, 0, 0);
  ctx.restore();

  // Draw philosophers
  ctx.font = '12px system-ui, sans-serif';
  const hit = [];
  for (const p of MODEL.philosophers) {
    const [px, py] = MODEL.pca.coords[p.id];
    const cx = sx(px), cy = sy(py);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = (HOVER_PHIL_ID === p.id ? '#10b981' : '#16a34a');
    ctx.beginPath();
    ctx.arc(cx, cy, HOVER_PHIL_ID === p.id ? 5 : 3, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    // label background
    const label = p.name;
    const tw = ctx.measureText(label).width + 6;
    const th = 12;
    ctx.fillStyle = HOVER_PHIL_ID === p.id ? 'rgba(16,185,129,0.15)' : 'rgba(22,163,74,0.1)';
    ctx.fillRect(cx + 6 - 2, cy - 4 - th + 2, tw, th);
    ctx.fillStyle = HOVER_PHIL_ID === p.id ? '#064e3b' : '#0f5132';
    ctx.fillText(label, cx + 6, cy - 4);
    hit.push({x: cx, y: cy, r: 8, name: p.name, id: p.id});
  }

  // User point
  const ux = sx(userXY[0]), uy = sy(userXY[1]);
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(ux, uy, 4, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#7f1d1d';
  ctx.fillText('You', ux + 8, uy - 6);

  // Items as arrows from origin scaled to fit into philosopher ranges
  const comp = MODEL.pca.components; // [2][30]
  const maxAbsX = Math.max(...comp[0].map(Math.abs)) || 1;
  const maxAbsY = Math.max(...comp[1].map(Math.abs)) || 1;
  // Push item vectors closer to borders (increase scale factor)
  const sX = (maxX - minX) / maxAbsX * 0.55;
  const sY = (maxY - minY) / maxAbsY * 0.55;
  const s = Math.min(sX || 1, sY || 1);

  // Simple repel for labels
  const placed = [];
  function overlaps(r1, r2){ return !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y); }

  ctx.strokeStyle = '#2563eb';
  ctx.fillStyle = '#1e3a8a';
  ctx.lineWidth = 1;
  for (let j = 0; j < QUESTIONS.length; j++) {
    const x = comp[0][j] * s;
    const y = comp[1][j] * s;
    const cx = sx(x), cy = sy(y);
    // Arrow from center
    const ox = sx(0), oy = sy(0);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    // Arrowhead
    const ang = Math.atan2(cy - oy, cx - ox);
    const ah = 8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - ah * Math.cos(ang - Math.PI/8), cy - ah * Math.sin(ang - Math.PI/8));
    ctx.lineTo(cx - ah * Math.cos(ang + Math.PI/8), cy - ah * Math.sin(ang + Math.PI/8));
    ctx.closePath();
    ctx.fill();

    // Label near the end; wrap to max width and repel
    const label = `Q${j+1}: ${QUESTIONS[j].text}`;
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillStyle = '#374151';
    const maxW = 140;
    const lh = 11;
    // Place label a bit beyond the arrow tip along its direction
    const dx = cx - ox, dy = cy - oy;
    const len = Math.hypot(dx, dy) || 1;
    const pad = 12;
    let lx = cx + (dx / len) * pad;
    let ly = cy + (dy / len) * pad;
    // Probe positions to avoid overlap
    const trials = [0, -1, 1, -2, 2, -3, 3, -4, 4];
    let bbox = null;
    for (const t of trials) {
      let ty = ly + t * lh;
      // measure rough height by simulating wrapping lines count
      const words = label.split(' ');
      let line = '';
      let lines = 1;
      words.forEach(w => {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line){ lines += 1; line = w; }
        else { line = test; }
      });
      // Clamp inside plot bounds
      let rx = Math.min(Math.max(lx, 34), W - 34 - maxW);
      ty = Math.min(Math.max(ty, 34 + lh), H - 34 - lines * lh);
      const rect = { x: rx, y: ty - lh, w: maxW, h: lines * lh + 4 };
      if (!placed.some(r => overlaps(r, rect))) { bbox = rect; ly = ty; break; }
    }
    // Draw label
    // Label backdrop
    const bx = bbox ? bbox.x : lx;
    const by = ly - lh + 2;
    ctx.save();
    ctx.fillStyle = 'rgba(37,99,235,0.06)';
    ctx.fillRect(bx - 2, by, maxW + 4, lh * 2);
    ctx.restore();
    drawWrappedText(ctx, label, bx, ly, maxW, lh);
    if (bbox) placed.push(bbox);
  }
  // Store hits for hover
  dom.canvas.__pcHits = hit;
}

function showNearest(list) {
  dom.nearest.innerHTML = '';
  list.forEach(item => {
    const li = document.createElement('li');
    li.dataset.philId = item.id;
    li.textContent = `${item.name} (distance ${item.dist.toFixed(2)})`;
    dom.nearest.appendChild(li);
  });
}

function showJustifications(list) {
  dom.justs.innerHTML = '';
  list.forEach(item => {
    const wrap = document.createElement('div');
    wrap.className = 'justification';
    const h = document.createElement('h4');
    h.textContent = item.name;
    const p = document.createElement('p');
    p.innerHTML = renderInlineMarkdownSafe(item.justification || '');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'secondary see-positions';
    btn.dataset.philId = item.id;
    btn.textContent = 'See all positions';
    wrap.appendChild(h);
    wrap.appendChild(p);
    wrap.appendChild(btn);
    dom.justs.appendChild(wrap);
  });
}

function requireComplete() {
  const done = collectAnswers();
  dom.submit.disabled = !done;
}

async function init() {
  await loadModel();
  applyAxisLabelsFromModel();
  // Initialize answer state
  ANSWERS = Array(QUESTIONS.length).fill(null);
  CUR = 0;
  // High-DPI canvas scaling and resize
  function resizeCanvas() {
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const parent = dom.canvas.parentElement;
    const parentW = (parent && parent.clientWidth) || (dom.canvas.clientWidth) || 640;
    const cssW = Math.max(280, Math.min(900, parentW));
    const cssH = Math.round(cssW * 0.75); // keep 4:3 aspect
    // Set CSS size to keep layout reasonable
    dom.canvas.style.width = cssW + 'px';
    dom.canvas.style.height = cssH + 'px';
    // Set drawing buffer size for crispness
    dom.canvas.width = Math.round(cssW * dpr);
    dom.canvas.height = Math.round(cssH * dpr);
    const ctx = dom.canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dom.canvas.__cssW = cssW;
    dom.canvas.__cssH = cssH;
  }
  resizeCanvas();
  window.addEventListener('resize', () => {
    resizeCanvas();
    if (LAST_USER_XY) { if (SHOW_BIPLOT) drawBiplot(LAST_USER_XY); else drawPlot(LAST_USER_XY); }
  });
  renderLikertButtons();
  renderCurrentQuestion();

  // Start flow
  dom.start.addEventListener('click', () => {
    dom.intro.classList.add('hidden');
    dom.carousel.classList.remove('hidden');
    renderCurrentQuestion();
  });

  // Dedicated info button handler to ensure clicks are captured
  const infoBtnEl = document.querySelector('.q-info-open');
  if (infoBtnEl) {
    infoBtnEl.addEventListener('click', (e) => {
      e.preventDefault();
      try { console.log('[pc] info button clicked'); } catch (_) {}
      openInfoModal();
    });
  }

  // Handle likert selection; auto-advance when chosen
  dom.likert.addEventListener('click', (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    const btn = target.closest('.likert-btn');
    if (!btn) return;
    const val = Number(btn.dataset.value);
    ANSWERS[CUR] = val;
    // Update active state
    dom.likert.querySelectorAll('.likert-btn').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    // Auto-advance if not last
    if (CUR < QUESTIONS.length - 1) {
      CUR += 1;
    }
    renderCurrentQuestion();
  });

  // Navigation
  dom.prev.addEventListener('click', () => {
    if (CUR > 0) {
      CUR -= 1;
      renderCurrentQuestion();
    }
  });
  dom.next.addEventListener('click', () => {
    if (CUR < QUESTIONS.length - 1) {
      CUR += 1;
      renderCurrentQuestion();
    }
  });

  // See results
  dom.see.addEventListener('click', () => {
    const answers = collectAnswers();
    if (!answers) return;
    const userXY = projectUser(answers);
    LAST_USER_XY = userXY;
    VIEW_BOUNDS = computeDefaultBounds(userXY);
    SHOW_BIPLOT = false;
    const btn = document.getElementById('biplot-btn');
    if (btn) btn.textContent = 'See biplot';
    drawPlot(userXY);
    const nearest = nearestPhilosophers(userXY, 3);
    showNearest(nearest);
    // Show all philosopher justifications
    showJustifications(MODEL.philosophers.map(p => ({ id: p.id, name: p.name, justification: p.justification })));
    dom.results.classList.remove('hidden');
  });

  // Toggle biplot
  const biplotBtn = document.getElementById('biplot-btn');
  if (biplotBtn) {
    biplotBtn.addEventListener('click', () => {
      if (!LAST_USER_XY) return;
      SHOW_BIPLOT = !SHOW_BIPLOT;
      biplotBtn.textContent = SHOW_BIPLOT ? 'See scatter' : 'See biplot';
      if (SHOW_BIPLOT) drawBiplot(LAST_USER_XY); else drawPlot(LAST_USER_XY);
    });
  }

  // Reset
  dom.reset.addEventListener('click', () => {
    ANSWERS = Array(QUESTIONS.length).fill(null);
    CUR = 0;
    VIEW_BOUNDS = null;
    HOVER_PHIL_ID = null;
    dom.results.classList.add('hidden');
    dom.see.classList.add('hidden');
    dom.intro.classList.remove('hidden');
    dom.carousel.classList.add('hidden');
    renderCurrentQuestion();
  });
}

init().catch(err => {
  console.error(err);
  const hint = 'Tip: if you used the IPv6 link http://[::]:8000/, try http://localhost:8000/ or http://[::1]:8000/ instead.';
  alert(`Failed to initialize app. Ensure data/model.json is present and accessible.\n\n${hint}\n\nDetails: ${err && err.message ? err.message : err}`);
});

// Modal logic for positions
function likertLabel(v) { return LIKERT_LABELS[(Number(v) || 1) - 1] || String(v); }

function openPositionsModal(philId) {
  const phil = MODEL.philosophers.find(p => p.id === philId);
  if (!phil) return;
  const body = document.getElementById('modal-body');
  const title = document.getElementById('modal-title');
  title.textContent = `${phil.name} — All Positions`;
  body.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'positions-list';
  for (let i = 0; i < QUESTIONS.length; i++) {
    const item = document.createElement('div');
    item.className = 'positions-item';
    const qid = document.createElement('div');
    qid.className = 'qid';
    qid.textContent = `Q${i+1}`;
    const qtext = document.createElement('div');
    qtext.className = 'qtext';
    qtext.textContent = QUESTIONS[i].text;
    const ans = document.createElement('div');
    ans.className = 'answer';
    const v = phil.positions[i];
    ans.textContent = `${likertLabel(v)} (${v})`;
    const just = document.createElement('div');
    just.className = 'pos-just';
    const jtxt = (phil.position_justifications && phil.position_justifications[i]) || '';
    just.textContent = jtxt || '';
    item.appendChild(qid);
    item.appendChild(qtext);
    item.appendChild(ans);
    if (jtxt) item.appendChild(just);
    list.appendChild(item);
  }
  body.appendChild(list);
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

function openInfoModal() {
  const q = QUESTIONS[CUR];
  if (!q) return;
  try { console.log('[pc] openInfoModal for', { index: CUR, id: q.id }); } catch (_) {}
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  title.textContent = `${q.id}: ${q.text}`;
  body.innerHTML = '';
  const p = document.createElement('p');
  p.style.lineHeight = '1.7';
  const infoText = (q.info && String(q.info).trim()) ? q.info : 'No additional info for this question.';
  p.textContent = infoText;
  body.appendChild(p);
  document.getElementById('modal').classList.remove('hidden');
}

document.addEventListener('click', (ev) => {
  const raw = ev.target;
  const t = raw instanceof Element ? raw : (raw && raw.parentElement ? raw.parentElement : null);
  if (!t) return;

  const infoBtn = t.closest('.q-info-open');
  if (infoBtn) { openInfoModal(); return; }

  const closeBtn = t.closest('#modal-close');
  if (closeBtn) { closeModal(); return; }

  const seePos = t.closest('.see-positions');
  if (seePos) {
    const id = seePos.dataset.philId;
    if (id) openPositionsModal(id);
    return;
  }
  // Close when clicking backdrop
  const modal = document.getElementById('modal');
  if (!modal.classList.contains('hidden') && t === modal) {
    closeModal();
  }
});

// Extra safety: direct listeners on modal and Escape key
window.addEventListener('keydown', (e) => {
  const modal = document.getElementById('modal');
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
  }
});

const modalEl = document.getElementById('modal');
if (modalEl) {
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeModal();
  });
}

// Expose an explicit opener for inline handler fallback
window.__pcOpenInfo = () => {
  try { openInfoModal(); } catch (e) { console.error('openInfoModal failed', e); }
};

// Provide info text for inline fallback in HTML
window.__pcGetInfo = () => {
  try {
    const q = QUESTIONS && QUESTIONS[CUR];
    return q && q.info ? q.info : '';
  } catch (_) {
    return '';
  }
};

// Override axis labels from model if available
function applyAxisLabelsFromModel() {
  try {
    if (MODEL && MODEL.meta && MODEL.meta.axis_labels && MODEL.meta.axis_labels.x && MODEL.meta.axis_labels.y) {
      AXIS_LABELS = { x: String(MODEL.meta.axis_labels.x), y: String(MODEL.meta.axis_labels.y) };
    }
  } catch (_) {}
}
applyAxisLabelsFromModel();

// Simple tooltip for hover over philosopher points
(function setupTooltip(){
  if (!dom || !dom.canvas) return;
  const tip = document.createElement('div');
  tip.id = 'tooltip';
  tip.className = 'tooltip hidden';
  document.body.appendChild(tip);
  function syncNearestHover(id){
    const items = dom.nearest.querySelectorAll('li[data-phil-id]');
    items.forEach(li => {
      if (id && li.dataset.philId === id) li.classList.add('hover'); else li.classList.remove('hover');
    });
  }
  function show(x,y,text){
    tip.textContent = text;
    tip.style.left = (x + 12) + 'px';
    tip.style.top = (y + 12) + 'px';
    tip.classList.remove('hidden');
  }
  function hide(){ tip.classList.add('hidden'); }
  dom.canvas.addEventListener('mousemove', (e) => {
    const rect = dom.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const arr = dom.canvas.__pcHits || [];
    let found = null;
    for (const h of arr){
      const dx = x - h.x; const dy = y - h.y; if (dx*dx+dy*dy <= (h.r*h.r)) { found = h; break; }
    }
    const prev = HOVER_PHIL_ID;
    if (found) {
      show(e.clientX, e.clientY, found.name);
      HOVER_PHIL_ID = found.id;
    } else {
      hide();
      HOVER_PHIL_ID = null;
    }
    syncNearestHover(HOVER_PHIL_ID);
    if (prev !== HOVER_PHIL_ID && LAST_USER_XY) { if (SHOW_BIPLOT) drawBiplot(LAST_USER_XY); else drawPlot(LAST_USER_XY); }
  });
  dom.canvas.addEventListener('mouseleave', () => hide());
})();

// Zoom & Pan interactions
(function setupZoomPan(){
  if (!dom || !dom.canvas) return;
  let dragging = false;
  let startX = 0, startY = 0;
  let startBounds = null;
  function redraw(){ if (LAST_USER_XY) { if (SHOW_BIPLOT) drawBiplot(LAST_USER_XY); else drawPlot(LAST_USER_XY); } }
  dom.canvas.addEventListener('wheel', (e) => {
    if (!LAST_USER_XY || !VIEW_BOUNDS) return;
    e.preventDefault();
    const rect = dom.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const W = dom.canvas.__cssW || dom.canvas.width;
    const H = dom.canvas.__cssH || dom.canvas.height;
    const plotX = 30, plotY = 30, plotW = W - 60, plotH = H - 60;
    const {minX, maxX, minY, maxY} = VIEW_BOUNDS;
    const rangeX = maxX - minX; const rangeY = maxY - minY;
    const clampedX = Math.max(plotX, Math.min(plotX + plotW, x));
    const clampedY = Math.max(plotY, Math.min(plotY + plotH, y));
    const mx = minX + (clampedX - plotX) / (plotW || 1) * rangeX;
    const my = minY + (plotH - (clampedY - plotY)) / (plotH || 1) * rangeY;
    const factor = e.deltaY < 0 ? 0.85 : 1.15;
    VIEW_BOUNDS = {
      minX: mx - (mx - minX) * factor,
      maxX: mx + (maxX - mx) * factor,
      minY: my - (my - minY) * factor,
      maxY: my + (maxY - my) * factor,
    };
    redraw();
  }, { passive: false });

  dom.canvas.addEventListener('mousedown', (e) => {
    if (!LAST_USER_XY || !VIEW_BOUNDS) return;
    dragging = true;
    const rect = dom.canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    startBounds = { ...VIEW_BOUNDS };
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  window.addEventListener('mousemove', (e) => {
    if (!dragging || !startBounds) return;
    const rect = dom.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - startX; const dy = y - startY;
    const W = dom.canvas.__cssW || dom.canvas.width;
    const H = dom.canvas.__cssH || dom.canvas.height;
    const plotW = W - 60, plotH = H - 60;
    const rx = (startBounds.maxX - startBounds.minX) / (plotW || 1);
    const ry = (startBounds.maxY - startBounds.minY) / (plotH || 1);
    const ddx = -dx * rx; // invert to move in drag direction
    const ddy = +dy * ry; // screen y grows down; data y grows up
    VIEW_BOUNDS = {
      minX: startBounds.minX + ddx,
      maxX: startBounds.maxX + ddx,
      minY: startBounds.minY + ddy,
      maxY: startBounds.maxY + ddy,
    };
    redraw();
  });
  dom.canvas.addEventListener('dblclick', () => {
    if (!LAST_USER_XY) return;
    VIEW_BOUNDS = computeDefaultBounds(LAST_USER_XY);
    if (LAST_USER_XY) { if (SHOW_BIPLOT) drawBiplot(LAST_USER_XY); else drawPlot(LAST_USER_XY); }
  });
})();

// Nearest list hover syncing
(function setupNearestHover(){
  if (!dom || !dom.nearest) return;
  dom.nearest.addEventListener('mouseover', (e) => {
    const li = e.target && e.target.closest('li[data-phil-id]');
    if (!li) return;
    const id = li.dataset.philId;
    HOVER_PHIL_ID = id;
    li.classList.add('hover');
    if (LAST_USER_XY) { if (SHOW_BIPLOT) drawBiplot(LAST_USER_XY); else drawPlot(LAST_USER_XY); }
  });
  dom.nearest.addEventListener('mouseout', (e) => {
    const li = e.target && e.target.closest('li[data-phil-id]');
    if (!li) return;
    HOVER_PHIL_ID = null;
    li.classList.remove('hover');
    if (LAST_USER_XY) { if (SHOW_BIPLOT) drawBiplot(LAST_USER_XY); else drawPlot(LAST_USER_XY); }
  });
})();
