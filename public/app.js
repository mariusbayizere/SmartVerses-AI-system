// ═══════════════════════════════════════
//  SmartVerses AI — Frontend Logic
// ═══════════════════════════════════════

const VERSIONS = ['KJV', 'NIV', 'NLT', 'ESV', 'NKJV'];
let curVersion  = 'KJV';
let listening   = false;
let speaking    = false;
let recognition = null;
let finalText   = '';
let queue       = [];
let projected   = null;
let detected    = 0;
let projCount   = 0;
let sessionStart = null;
let sessionTimer = null;
let detectDebounce = null;

// ── Init ──────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  buildPills();
  document.getElementById('manual-in')
    .addEventListener('keydown', e => { if (e.key === 'Enter') manualAdd(); });
});

// ── Version pills ─────────────────────
function buildPills() {
  document.getElementById('ver-pills').innerHTML = VERSIONS.map(v =>
    `<button class="vpill ${v === curVersion ? 'on' : ''}" onclick="setVersion('${v}')">${v}</button>`
  ).join('');
}
function setVersion(v) { curVersion = v; buildPills(); }

// ── Listen toggle ─────────────────────
function toggleListen() {
  listening ? stopListening() : startListening();
}

function startListening() {
  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    setStatus('error', 'Voice input requires Chrome browser');
    return;
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous      = true;
  recognition.interimResults  = true;
  recognition.lang            = 'en-US';
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    listening    = true;
    sessionStart = Date.now();
    sessionTimer = setInterval(tickSession, 1000);

    const btn = document.getElementById('listen-btn');
    btn.classList.add('on');
    document.getElementById('listen-icon').className = 'ti ti-microphone-off';
    document.getElementById('listen-text').textContent = 'Stop Listening';
    setStatus('listening', 'Listening live — speak naturally...');
  };

  recognition.onresult = (e) => {
    let fin = '', intr = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      e.results[i].isFinal ? (fin += t, finalText += t + ' ') : (intr += t);
    }

    // Show transcript
    const box   = document.getElementById('transcript');
    const words = finalText.split(' ').slice(-100).join(' ');
    box.innerHTML = `<span class="spoken">${words}</span>${intr ? ` <span class="interim">${intr}</span>` : ''}`;
    box.scrollTop = box.scrollHeight;

    // Debounce AI detection
    if (fin) {
      clearTimeout(detectDebounce);
      detectDebounce = setTimeout(() => detectVerses(finalText.slice(-500)), 900);
    }
  };

  recognition.onerror = (e) => {
    if (e.error === 'not-allowed')
      setStatus('error', 'Microphone blocked — click the camera icon in browser address bar to allow');
    else if (e.error === 'no-speech')
      setStatus('listening', 'No speech detected — keep talking...');
    else if (e.error !== 'aborted')
      setStatus('listening', `Retrying (${e.error})...`);
  };

  // Auto-restart on end (continuous mode sometimes stops)
  recognition.onend = () => {
    if (listening) setTimeout(() => { try { recognition.start(); } catch (_) {} }, 300);
  };

  try { recognition.start(); }
  catch (e) { setStatus('error', 'Cannot access microphone: ' + e.message); }
}

function stopListening() {
  listening = false;
  try { recognition.abort(); } catch (_) {}
  clearInterval(sessionTimer);
  const btn = document.getElementById('listen-btn');
  btn.classList.remove('on');
  document.getElementById('listen-icon').className = 'ti ti-microphone';
  document.getElementById('listen-text').textContent = 'Start Listening';
  setStatus('', 'Stopped — press Start to listen again');
}

// ── Detect verses via backend ─────────
async function detectVerses(text) {
  if (!text || text.trim().length < 8) return;
  setStatus('listening', 'AI scanning for Bible verses...');
  try {
    const res  = await fetch('/api/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (data.refs && data.refs.length > 0) {
      data.refs.forEach(ref => addToQueue(ref));
    } else {
      setStatus('listening', 'Listening — no verse detected yet, keep speaking...');
    }
  } catch (_) {
    setStatus('listening', 'Listening (server check failed — is server running?)');
  }
}

// ── Add verse to queue ────────────────
async function addToQueue(ref) {
  // Avoid duplicates
  if (queue.find(q => q.ref.toLowerCase() === ref.toLowerCase())) return;

  detected++;
  document.getElementById('s-detected').textContent = detected;
  document.getElementById('q-count').textContent = queue.length + 1;
  setStatus('found', `Detected: ${ref} — fetching...`);

  const item = { id: Date.now(), ref, loading: true, en: '', rw: '', msg_en: '', msg_rw: '' };
  queue.unshift(item);
  renderQueue();

  // Step 1: Fetch English verse
  try {
    const res  = await fetch(`/api/verse?ref=${encodeURIComponent(ref)}&version=${curVersion}`);
    const data = await res.json();
    if (!data.error) {
      item.ref = data.reference || ref;
      item.en  = data.text || '';
    } else {
      item.en = '(Verse not found — check reference)';
    }
  } catch (_) {
    item.en = '(Network error — is the server running?)';
  }

  // Step 2: Translate + devotional via AI
  if (item.en && !item.en.startsWith('(')) {
    try {
      const res  = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: item.ref, english_text: item.en })
      });
      const data = await res.json();
      if (!data.error) {
        item.rw     = data.kinyarwanda  || '';
        item.msg_en = data.message_en   || '';
        item.msg_rw = data.message_rw   || '';
      }
    } catch (_) {
      item.rw = '(Translation unavailable — check Anthropic API key)';
    }
  }

  item.loading = false;
  setStatus('listening', `✓ ${item.ref} ready — operator can project`);
  document.getElementById('q-count').textContent = queue.length;
  renderQueue();

  // If this is the first verse, auto-select it for convenience
  if (queue.length === 1) projectItem(item.id);
}

// ── Render queue ──────────────────────
function renderQueue() {
  const el = document.getElementById('queue');
  if (!queue.length) {
    el.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-microphone-off"></i>
        <p>No verses detected yet.<br/>Start the listener and speak naturally.</p>
        <small>Example: "Let us read from John chapter 3 verse 16"</small>
      </div>`;
    return;
  }

  el.innerHTML = queue.map(item => `
    <div class="q-item ${projected && projected.id === item.id ? 'projected' : ''}" id="qi-${item.id}">
      <div class="q-top">
        <span class="q-ref">${item.ref}</span>
        ${!item.loading ? `<span class="q-tag">ready</span>` : ''}
      </div>
      ${item.loading
        ? `<div class="q-loading"><i class="ti ti-loader"></i> Fetching verse + translating to Kinyarwanda...</div>`
        : `<div class="q-preview">${item.en.slice(0, 65)}...</div>
           <div class="q-btns">
             <button class="q-btn project" onclick="projectItem(${item.id})">
               <i class="ti ti-device-tv"></i> Project
             </button>
             <button class="q-btn remove" onclick="removeItem(${item.id})">
               <i class="ti ti-trash"></i> Remove
             </button>
           </div>`
      }
    </div>`).join('');
}

// ── Project a verse ───────────────────
function projectItem(id) {
  const item = queue.find(q => q.id === id);
  if (!item || item.loading) {
    setStatus('found', 'Still loading — please wait a moment...');
    return;
  }
  projected = item;
  projCount++;
  document.getElementById('s-projected').textContent = projCount;
  document.getElementById('proj-hint').textContent = item.ref;
  renderProjection();
  renderQueue();
}

function renderProjection() {
  if (!projected) return;
  document.getElementById('proj-content').innerHTML = `
    <div class="proj-col">
      <div class="proj-lang"><i class="ti ti-language"></i> English — ${curVersion}</div>
      <div class="proj-ref-big">${projected.ref}</div>
      <div class="proj-verse-text">"${projected.en}"</div>
      ${projected.msg_en ? `<div class="proj-message">${projected.msg_en}</div>` : ''}
    </div>
    <div class="proj-col proj-divider">
      <div class="proj-lang"><i class="ti ti-language"></i> Kinyarwanda</div>
      <div class="proj-ref-big">${projected.ref}</div>
      <div class="proj-verse-text">"${projected.rw || '<em style="opacity:0.45;font-style:normal">Translation loading...</em>'}"</div>
      ${projected.msg_rw ? `<div class="proj-message">${projected.msg_rw}</div>` : ''}
    </div>`;
}

function removeItem(id) {
  queue = queue.filter(q => q.id !== id);
  if (projected && projected.id === id) clearProj();
  document.getElementById('q-count').textContent = queue.length;
  renderQueue();
}

function clearProj() {
  projected = null;
  document.getElementById('proj-hint').textContent = 'No verse projected yet';
  document.getElementById('proj-content').innerHTML = `
    <div class="proj-placeholder">
      <i class="ti ti-layout-columns"></i>
      <p>Verse will appear here in <strong>English</strong> and <strong>Kinyarwanda</strong><br/>when operator presses Project</p>
    </div>`;
  renderQueue();
}

// ── Read aloud ────────────────────────
function toggleSpeak() {
  if (!projected) { setStatus('found', 'No verse projected to read'); return; }
  if (speaking) { stopSpeak(); return; }

  speaking = true;
  const btn = document.getElementById('speak-btn');
  btn.classList.add('on');
  document.getElementById('speak-icon').className = 'ti ti-volume-off';
  document.getElementById('speak-text').textContent = 'Stop';

  window.speechSynthesis.cancel();

  const parts = [
    `${projected.ref}.`,
    projected.en,
    projected.rw ? `Kinyarwanda: ${projected.rw}` : ''
  ].filter(Boolean);

  let i = 0;
  const voices  = window.speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang.startsWith('en-US') && v.name.includes('Google'))
                || voices.find(v => v.lang.startsWith('en'));

  function next() {
    if (i >= parts.length || !speaking) { speaking = false; resetSpeak(); return; }
    const u  = new SpeechSynthesisUtterance(parts[i]);
    u.lang   = 'en-US';
    u.rate   = 0.82;
    u.pitch  = 1;
    if (enVoice) u.voice = enVoice;
    u.onend  = () => { i++; next(); };
    u.onerror = () => { i++; next(); };
    window.speechSynthesis.speak(u);
    i++;
  }
  next();
}

function stopSpeak() {
  window.speechSynthesis.cancel();
  speaking = false;
  resetSpeak();
}

function resetSpeak() {
  const btn = document.getElementById('speak-btn');
  if (!btn) return;
  btn.classList.remove('on');
  document.getElementById('speak-icon').className = 'ti ti-volume';
  document.getElementById('speak-text').textContent = 'Read Aloud';
}

// ── Manual add ────────────────────────
function manualAdd() {
  const val = document.getElementById('manual-in').value.trim();
  if (!val) return;
  const ref = val.charAt(0).toUpperCase() + val.slice(1);
  addToQueue(ref);
  document.getElementById('manual-in').value = '';
}

// ── Helpers ───────────────────────────
function setStatus(state, msg) {
  const dot = document.getElementById('dot');
  dot.className = 'dot' + (state ? ' ' + state : '');
  document.getElementById('status-msg').textContent = msg;
}

function tickSession() {
  const s   = Math.floor((Date.now() - sessionStart) / 1000);
  const m   = String(Math.floor(s / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  document.getElementById('s-time').textContent = `${m}:${sec}`;
}
