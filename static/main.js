import {
  parseInputs,
  julianDate,
  calculatePlanets,
  calculateAscendant,
  calculateHouses,
  calculateVimshottariDasha,
  generateSVGWheel,
  buildKpTable,
  organizeHouses,
} from './astro.js';

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'KPAstrologyApp/1.0';

const state = {
  messages: [],
  recording: false,
  mediaRecorder: null,
  mediaChunks: [],
  selectedLocation: null,
  locationCandidates: [],
  profile: loadProfile(),
  currentChart: null,
  activeTab: 'chat', // 'chat' or 'dashboard'
};

// DOM Elements
const chatSection = document.getElementById('chatSection');
const dashboardSection = document.getElementById('dashboardSection');
const navChat = document.getElementById('navChat');
const navChart = document.getElementById('navChart');

const chatThread = document.getElementById('chatThread');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');

const birthModal = document.getElementById('birthModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const birthForm = document.getElementById('birthForm');
const locationInput = document.getElementById('locationInput');
const suggestionsEl = document.getElementById('locationSuggestions');
const toastEl = document.getElementById('toast');

// Dashboard Elements
const birthCard = document.getElementById('birthCard');
const chartContainer = document.getElementById('chartContainer');
const createChartBtn = document.getElementById('createChartBtn');
const editBirthBtn = document.getElementById('editBirthBtn');

function loadProfile() {
  try {
    const raw = localStorage.getItem('astroProfile');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function saveProfile(profile) {
  state.profile = profile;
  localStorage.setItem('astroProfile', JSON.stringify(profile));
  updateDashboard();
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 3000);
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Navigation Logic (Mobile)
function switchTab(tab) {
  state.activeTab = tab;
  if (window.innerWidth <= 900) {
    if (tab === 'chat') {
      chatSection.style.display = 'flex';
      dashboardSection.classList.remove('active');
      navChat.classList.add('active');
      navChart.classList.remove('active');
    } else {
      chatSection.style.display = 'none';
      dashboardSection.classList.add('active');
      navChat.classList.remove('active');
      navChart.classList.add('active');
    }
  }
}

navChat.addEventListener('click', () => switchTab('chat'));
navChart.addEventListener('click', () => switchTab('dashboard'));

// Chat Rendering
function renderMessage(msg) {
  const div = document.createElement('div');
  div.className = `message ${msg.role}`;
  div.id = msg.id;
  
  let contentHtml = '';
  
  if (msg.audioUrl) {
    contentHtml += `<audio controls src="${msg.audioUrl}"></audio>`;
  }
  
  if (msg.text) {
    // Simple markdown-like parsing for bold
    const formatted = msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    contentHtml += `<div class="message-content">${formatted}</div>`;
  }
  
  const time = formatTime(new Date());
  
  div.innerHTML = `
    ${contentHtml}
    <div class="message-meta">
      <span>${time}</span>
    </div>
  `;
  
  chatThread.appendChild(div);
  // chatThread.scrollTop = chatThread.scrollHeight; // Autoscroll disabled
}

function addMessage(msg) {
  const id = crypto.randomUUID();
  const message = { ...msg, id };
  state.messages.push(message);
  renderMessage(message);
  return id;
}

function showTyping() {
  const div = document.createElement('div');
  div.id = 'typingIndicator';
  div.className = 'message assistant';
  div.innerHTML = `<span style="font-size:12px; opacity:0.7;">Consulting the stars...</span>`;
  chatThread.appendChild(div);
  // chatThread.scrollTop = chatThread.scrollHeight; // Autoscroll disabled
}

function hideTyping() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

async function handleSend() {
  const text = chatInput.value.trim();
  if (!text) return;
  
  addMessage({ role: 'user', text });
  chatInput.value = '';
  toggleSendButton();
  
  await processUserMessage(text, {}, false);
}

async function processUserMessage(text, context = {}, isVoice = false) {
  showTyping();
  try {
    // Construct History (Last 10 messages, excluding the current one which is 'text')
    // The current message was just added to state.messages in handleSend, so it's the last one.
    // We want the history *before* this message.
    const history = state.messages
        .slice(0, -1) // Exclude the very last message (current)
        .slice(-10)   // Take last 10 of the remainder
        .map(m => ({
            role: m.role,
            content: m.text || "" // Ensure content exists
        }))
        .filter(m => m.content.trim() !== ""); // Remove empty messages

    const body = {
      message: text,
      context,
      local_birth: state.profile || {},
      chart_data: state.currentChart || null,
      is_voice: isVoice,
      history: history,
    };
    
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const data = await res.json();
    hideTyping();
    
    // Handle Reaction
    if (data.reaction) {
      const lastUserMsg = state.messages.filter(m => m.role === 'user').pop();
      if (lastUserMsg) {
        const el = document.getElementById(lastUserMsg.id);
        if (el) {
            const reactionDiv = document.createElement('div');
            reactionDiv.className = 'reaction-bubble';
            reactionDiv.textContent = data.reaction;
            el.appendChild(reactionDiv);
        }
      }
    }

    // Handle UI Commands
    if (data.command === 'SHOW_CHART') {
        if (window.innerWidth <= 900) {
            switchTab('dashboard');
        } else {
            // On desktop, maybe highlight the chart or scroll to it?
            // For now, just ensure it's visible (it always is on desktop)
            // Maybe a subtle flash?
            chartContainer.style.boxShadow = "0 0 20px var(--accent-primary)";
            setTimeout(() => chartContainer.style.boxShadow = "", 2000);
        }
    }

    // Handle Response
    if (data.messages && Array.isArray(data.messages)) {
        // If this is a voice interaction, only show audio (no text)
        if (isVoice && data.audio?.audio_base64) {
            // Add a single message with just the audio player
            const audioUrl = `data:audio/${data.audio.format};base64,${data.audio.audio_base64}`;
            addMessage({ 
                role: 'assistant', 
                audioUrl: audioUrl
            });
            
            // Auto-play the audio
            const audio = new Audio(audioUrl);
            audio.play().catch(() => {});
        } else {
            // Regular text response (with optional audio for text input)
            for (let i = 0; i < data.messages.length; i++) {
                const msgText = data.messages[i];
                // First message is fast, others are slower to simulate thought/typing
                const delay = i === 0 ? 500 : 2000; 
                
                await new Promise(r => setTimeout(r, delay));
                
                addMessage({ 
                    role: 'assistant', 
                    text: msgText,
                });
            }
            
            // For text input, if audio is present, attach it to last message
            if (data.audio?.audio_base64) {
                const audio = new Audio(`data:audio/${data.audio.format};base64,${data.audio.audio_base64}`);
                audio.play().catch(() => {});
                const lastMsgId = state.messages[state.messages.length - 1].id;
                const lastMsgEl = document.getElementById(lastMsgId);
                if (lastMsgEl) {
                     const audioEl = document.createElement('audio');
                     audioEl.controls = true;
                     audioEl.src = `data:audio/${data.audio.format};base64,${data.audio.audio_base64}`;
                     lastMsgEl.appendChild(audioEl);
                }
            }
        }
    }
    
  } catch (err) {
    console.error("Chat Error:", err);
    hideTyping();
    showToast('The stars are silent (Connection Error)');
    addMessage({ role: 'assistant', text: "I apologize, but I cannot connect to the cosmic source right now. Please check your connection or try again." });
  }
}

// Voice Logic
async function toggleRecording() {
  if (state.recording) {
    state.mediaRecorder.stop();
    return;
  }
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.mediaRecorder = new MediaRecorder(stream);
    state.mediaChunks = [];
    
    state.mediaRecorder.ondataavailable = e => state.mediaChunks.push(e.data);
    state.mediaRecorder.onstop = async () => {
      state.recording = false;
      micBtn.innerHTML = '<i data-lucide="mic"></i>';
      lucide.createIcons();
      
      const blob = new Blob(state.mediaChunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(blob);
      
      addMessage({ role: 'user', audioUrl });
      
      const formData = new FormData();
      formData.append('file', blob, 'voice.webm');
      
      try {
        const res = await fetch('/api/stt', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.transcript) {
          await processUserMessage(data.transcript, {}, true); // isVoice = true
        }
      } catch (e) {
        showToast('Voice processing failed');
      }
    };
    
    state.mediaRecorder.start();
    state.recording = true;
    micBtn.innerHTML = '<i data-lucide="square" style="fill:#ff5252; color:#ff5252;"></i>'; 
    lucide.createIcons();
    
  } catch (e) {
    showToast('Mic permission denied');
  }
}

// Location Search
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

async function searchLocations(query) {
  if (!query || query.length < 3) {
    suggestionsEl.innerHTML = '';
    suggestionsEl.classList.add('hidden');
    return;
  }
  const url = `${NOMINATIM_ENDPOINT}?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const results = await response.json();
    state.locationCandidates = results.map((item) => ({
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
    }));
    renderLocationSuggestions();
  } catch (error) {
    console.warn('Location search error', error);
  }
}

function renderLocationSuggestions() {
  suggestionsEl.innerHTML = '';
  if (state.locationCandidates.length > 0) {
    suggestionsEl.classList.remove('hidden');
    state.locationCandidates.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.style.padding = '8px';
      div.style.cursor = 'pointer';
      div.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
      div.textContent = item.display_name;
      div.addEventListener('click', () => {
        state.selectedLocation = item;
        locationInput.value = item.display_name;
        suggestionsEl.classList.add('hidden');
      });
      suggestionsEl.appendChild(div);
    });
  } else {
    suggestionsEl.classList.add('hidden');
  }
}

const debouncedLocationSearch = debounce(searchLocations, 400);

// Chart Logic
function splitDateParts(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
}

function splitTimeParts(timeStr) {
  const [hour, minute, second = '0'] = timeStr.split(':');
  return { hour: Number(hour), minute: Number(minute), second: Number(second) };
}

async function resolveTimezone(lat, lon, provided) {
  if (provided) return { timeZone: provided, source: 'user' };
  if (Intl?.DateTimeFormat) {
    return { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, source: 'intl-fallback' };
  }
  return { timeZone: 'UTC', source: 'fallback' };
}

function computeOffsetMinutes(birthDate, birthTime, timeZone) {
    const { year, month, day } = splitDateParts(birthDate);
    const { hour, minute, second } = splitTimeParts(birthTime);
    const targetMinutes = hour * 60 + minute + second / 60;
    const referenceUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(referenceUtc).reduce((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value;
      return acc;
    }, {});
    const tzMinutes = Number(parts.hour) * 60 + Number(parts.minute) + Number(parts.second) / 60;
    let offset = tzMinutes - targetMinutes;
    if (offset > 720) offset -= 1440;
    if (offset < -720) offset += 1440;
    return Math.round(offset);
}

async function handleBirthForm(e) {
  e.preventDefault();
  const formData = new FormData(birthForm);
  const raw = Object.fromEntries(formData.entries());
  
  const selected = state.selectedLocation;
  if (!selected) {
    showToast('Please select a location');
    return;
  }

  try {
    const normalized = parseInputs({ ...raw, lat: selected.lat, lon: selected.lon });
    const tz = await resolveTimezone(selected.lat, selected.lon, normalized.time_zone);
    
    let offsetMinutes = 0;
    try {
      offsetMinutes = computeOffsetMinutes(normalized.birth_date, normalized.birth_time, tz.timeZone);
    } catch (err) { console.error(err); }

    const jd = julianDate({ dateString: normalized.birth_date, timeString: normalized.birth_time }, offsetMinutes);
    const planets = calculatePlanets(jd, normalized.precision);
    const asc = calculateAscendant(jd, Number(selected.lat), Number(selected.lon), normalized.precision);
    const cusps = calculateHouses(asc.longitude, normalized.precision);
    const houses = organizeHouses(planets, cusps);
    const kpTable = buildKpTable(planets, cusps, normalized.precision);
    const vimshottari = calculateVimshottariDasha(planets.Moon.longitude, jd, normalized.precision);
    const wheel = generateSVGWheel({ longitude: asc.longitude }, { ...planets, Ascendant: asc }, cusps, {});
    
    const result = {
      meta: { inputs: { ...normalized, timezone_offset_minutes: offsetMinutes } },
      planets, ascendant: asc, cusps, houses, kp_table: kpTable, vimshottari, wheel,
    };

    state.currentChart = result;
    saveProfile({
      ...normalized,
      lat: selected.lat,
      lon: selected.lon,
      location_text: selected.display_name,
      timezone: tz.timeZone,
    });
    
    birthModal.classList.add('hidden');
    showToast('Stars aligned.');
    
    // Switch to dashboard to show chart
    if (window.innerWidth > 900) {
        // Already visible
    } else {
        switchTab('dashboard');
    }
    
    processUserMessage("I've updated my chart. What do you see?");

  } catch (err) {
    console.error(err);
    showToast('Calculation error');
  }
}

function updateDashboard() {
    if (state.profile) {
        birthCard.classList.remove('hidden');
        document.getElementById('dispName').textContent = state.profile.name;
        document.getElementById('dispDate').textContent = state.profile.birth_date;
        document.getElementById('dispPlace').textContent = state.profile.location_text.split(',')[0];
        
        // If we have a calculated chart, render it
        if (state.currentChart) {
            // FIX: Ensure we are rendering the SVG string, not the object
            // The generateSVGWheel function returns { svg: string, canvas_instructions: ... }
            // So we need to access .svg property if it's an object, or just the string if it's already a string.
            // Based on astro.js, it returns an object { svg, canvas_instructions }
            
            let svgContent = "";
            if (typeof state.currentChart.wheel === 'string') {
                svgContent = state.currentChart.wheel;
            } else if (state.currentChart.wheel && state.currentChart.wheel.svg) {
                svgContent = state.currentChart.wheel.svg;
            }
            
            chartContainer.innerHTML = svgContent;
            
            // Make SVG responsive
            const svg = chartContainer.querySelector('svg');
            if (svg) {
                svg.style.width = '100%';
                svg.style.height = '100%';
                // Add a glow filter
                svg.style.filter = "drop-shadow(0 0 5px var(--accent-primary))";
            }
        } else {
             chartContainer.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="map"></i>
                    <p>Chart ready to generate</p>
                    <button class="cta-btn" id="regenChartBtn">View Chart</button>
                </div>
             `;
             const btn = document.getElementById('regenChartBtn');
             if(btn) btn.addEventListener('click', () => {
                 birthModal.classList.remove('hidden');
             });
        }
    } else {
        birthCard.classList.add('hidden');
        chartContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="map"></i>
                <p>No chart loaded</p>
                <button class="cta-btn" id="createChartBtnInner">Create Birth Chart</button>
            </div>
        `;
        document.getElementById('createChartBtnInner')?.addEventListener('click', () => birthModal.classList.remove('hidden'));
    }
}

// UI Helpers
function toggleSendButton() {
  if (chatInput.value.trim()) {
    sendBtn.classList.remove('hidden');
    micBtn.classList.add('hidden');
  } else {
    sendBtn.classList.add('hidden');
    micBtn.classList.remove('hidden');
  }
}

// Event Listeners
// Event Listeners
sendBtn.addEventListener('click', handleSend);
micBtn.addEventListener('click', toggleRecording);
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = chatInput.scrollHeight + 'px';
  toggleSendButton();
});

// Handle Enter key in chat input
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

createChartBtn?.addEventListener('click', () => birthModal.classList.remove('hidden'));
editBirthBtn.addEventListener('click', () => {
    birthModal.classList.remove('hidden');
    if (state.profile) {
        Object.keys(state.profile).forEach(key => {
            if (birthForm.elements[key]) birthForm.elements[key].value = state.profile[key];
        });
        if (state.profile.location_text) {
            state.selectedLocation = {
                lat: state.profile.lat,
                lon: state.profile.lon,
                display_name: state.profile.location_text
            };
        }
    }
});

closeModalBtn.addEventListener('click', () => birthModal.classList.add('hidden'));
birthForm.addEventListener('submit', handleBirthForm);
locationInput.addEventListener('input', (evt) => {
    const query = evt.target.value.trim();
    debouncedLocationSearch(query);
});

// Settings & Attach (Placeholders for now)
const navSettings = document.getElementById('navSettings');
if (navSettings) {
    navSettings.addEventListener('click', () => {
        showToast('Rituals & Settings coming soon');
    });
}

const attachBtn = document.getElementById('attachBtn');
if (attachBtn) {
    attachBtn.addEventListener('click', () => {
        showToast('Astral attachments not yet available');
    });
}

// Close modal on outside click
birthModal.addEventListener('click', (e) => {
    if (e.target === birthModal) {
        birthModal.classList.add('hidden');
    }
});

// Quick Actions
document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const query = btn.dataset.query;
        if (!state.currentChart) {
            showToast('Please create your chart first');
            birthModal.classList.remove('hidden');
            return;
        }
        addMessage({ role: 'user', text: query });
        processUserMessage(query);
    });
});

// Close Dashboard (Mobile)
const closeDashboardBtn = document.getElementById('closeDashboardBtn');
if (closeDashboardBtn) {
    closeDashboardBtn.addEventListener('click', () => {
        switchTab('chat');
    });
}

// Restore Session Logic
async function restoreSession() {
    if (state.profile) {
        // We have a profile, let's re-calculate the chart silently
        try {
            const { birth_date, birth_time, lat, lon, precision, time_zone } = state.profile;
            // We need to re-resolve timezone if not stored, but we stored it.
            // Re-run calculation
            const tz = state.profile.timezone || 'UTC';
            
            let offsetMinutes = 0;
            try {
               offsetMinutes = computeOffsetMinutes(birth_date, birth_time, tz);
            } catch (err) { console.error(err); }

            const jd = julianDate({ dateString: birth_date, timeString: birth_time }, offsetMinutes);
            const planets = calculatePlanets(jd, precision || 4);
            const asc = calculateAscendant(jd, Number(lat), Number(lon), precision || 4);
            const cusps = calculateHouses(asc.longitude, precision || 4);
            const houses = organizeHouses(planets, cusps);
            const kpTable = buildKpTable(planets, cusps, precision || 4);
            const vimshottari = calculateVimshottariDasha(planets.Moon.longitude, jd, precision || 4);
            const wheel = generateSVGWheel({ longitude: asc.longitude }, { ...planets, Ascendant: asc }, cusps, {});
            
            const result = {
              meta: { inputs: { ...state.profile, timezone_offset_minutes: offsetMinutes } },
              planets, ascendant: asc, cusps, houses, kp_table: kpTable, vimshottari, wheel,
            };
            
            state.currentChart = result;
            updateDashboard();
            
            // Don't ask again, just welcome back
            addMessage({ role: 'assistant', text: `Welcome back, ${state.profile.name}. Your chart is ready.` });
            
        } catch (e) {
            console.error("Failed to restore session", e);
            state.profile = null; // Corrupt data?
            localStorage.removeItem('astroProfile');
            addMessage({ role: 'assistant', text: 'Welcome, seeker. I am Astrix. To begin our journey, please provide your birth details in the dashboard.' });
        }
    } else {
        addMessage({ role: 'assistant', text: 'Welcome, seeker. I am Astrix. To begin our journey, please provide your birth details in the dashboard.' });
    }
}

// Daily Horoscope
const dailyHoroscopeBtn = document.getElementById('dailyHoroscopeBtn');
if (dailyHoroscopeBtn) {
    dailyHoroscopeBtn.addEventListener('click', () => {
        if (!state.currentChart) {
            showToast('Please create your chart first');
            birthModal.classList.remove('hidden');
            return;
        }
        // Switch to chat
        switchTab('chat');
        const prompt = "What is my horoscope for today based on my chart?";
        addMessage({ role: 'user', text: prompt });
        processUserMessage(prompt);
    });
}

// Init
lucide.createIcons();
restoreSession();
