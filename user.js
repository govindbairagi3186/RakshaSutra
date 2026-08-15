import { addIncident, readUsers } from './dataStore.js';

const $ = (id) => document.getElementById(id);
const SESSION_KEY = 'rakshasutra-current-user';

const els = {
  sosBtn: $('sosBtn'), voiceBtn: $('voiceBtn'), callBtn: $('callBtn'), shareBtn: $('shareBtn'),
  scanBtn: $('scanBtn'), logoutBtn: $('logoutBtn'), userBadge: $('userBadge'),
  riskScore: $('riskScore'), locationText: $('locationText'), coordsText: $('coordsText'),
  statusNote: $('statusNote'), activityList: $('activityList'), toast: $('toast'),
  guardianName: $('guardianNameDisplay'), guardianPhone: $('guardianPhoneDisplay'),
  trustedName: $('trustedNameDisplay'), trustedPhone: $('trustedPhoneDisplay'),
  trustedAddress: $('trustedAddressDisplay'),
  guardianSmsBtn: $('guardianSmsBtn'), trustedSmsBtn: $('trustedSmsBtn'),
  emergencyModal: $('emergencyModal'), emergencySummary: $('emergencySummary'),
  closeEmergencyBtn: $('closeEmergencyBtn'), guardianEmergencySmsBtn: $('guardianEmergencySmsBtn'),
  trustedEmergencySmsBtn: $('trustedEmergencySmsBtn'),
  callModal: $('callModal'), callName: $('callName'), callStatus: $('callStatus'),
  incomingCallScreen: $('incomingCallScreen'), pickupScreen: $('pickupScreen'),
  answerCallBtn: $('answerCallBtn'), declineCallBtn: $('declineCallBtn'), endCallBtn: $('endCallBtn')
};

let currentUser = null;
let lastPosition = null;
let sosActive = false;
let locationWatchId = null;
let ringtoneTimer = null;
let audioContext = null;

function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.add('hidden'), 3200);
}

function addActivity(message) {
  const item = document.createElement('li');
  item.textContent = message;
  els.activityList.prepend(item);
}

function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    id: user.id, email: user.email, fullName: user.fullName, phone: user.phone,
    guardianName: user.guardianName, guardianPhone: user.guardianPhone,
    trustedName: user.trustedName, trustedPhone: user.trustedPhone,
    trustedAddress: user.trustedAddress
  }));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw);
    const users = readUsers();
    const latest = users.find((u) => u.id === snapshot.id);
    return latest || snapshot;
  } catch {
    return null;
  }
}

function requireLogin() {
  if (!currentUser) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function contact(kind) {
  if (!currentUser) return null;
  if (kind === 'guardian') {
    return { name: currentUser.guardianName || 'Guardian', phone: currentUser.guardianPhone || '' };
  }
  return { name: currentUser.trustedName || 'Trusted Contact', phone: currentUser.trustedPhone || '' };
}

function cleanPhone(phone) {
  return String(phone || '').replace(/[^0-9+]/g, '');
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('GPS is not available in this browser.'));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, timeout: 15000, maximumAge: 0
    });
  });
}

function setPosition(position) {
  lastPosition = {
    latitude: Number(position.coords.latitude.toFixed(6)),
    longitude: Number(position.coords.longitude.toFixed(6)),
    accuracy: Math.round(position.coords.accuracy || 0),
    timestamp: new Date().toISOString()
  };
  els.locationText.textContent = 'GPS location active';
  els.coordsText.textContent = `${lastPosition.latitude}, ${lastPosition.longitude} · ±${lastPosition.accuracy}m`;
}

function mapsLink() {
  return lastPosition ? `https://maps.google.com/?q=${lastPosition.latitude},${lastPosition.longitude}` : '';
}

function buildMessage() {
  return [
    '🚨 RAKSHASUTRA SOS ALERT',
    `${currentUser.fullName || 'User'} needs help.`,
    `Time: ${new Date().toLocaleString('en-IN')}`,
    lastPosition ? `Location: ${mapsLink()}` : 'Location: GPS unavailable.',
    `GPS accuracy: ${lastPosition?.accuracy ?? 'unknown'}m`,
    'Please contact the user immediately.'
  ].join('\n');
}

function smsTo(kind) {
  const c = contact(kind);
  if (!c?.phone) {
    showToast(`${kind === 'guardian' ? 'Guardian' : 'Trusted contact'} phone number is not saved.`);
    return;
  }
  const body = encodeURIComponent(buildMessage());
  window.location.href = `sms:${cleanPhone(c.phone)}?body=${body}`;
}

function openEmergencyModal() {
  els.emergencySummary.textContent = lastPosition
    ? `GPS: ${lastPosition.latitude}, ${lastPosition.longitude} · ±${lastPosition.accuracy}m`
    : 'GPS was unavailable. You can still choose an emergency service.';
  els.emergencyModal.classList.remove('hidden');
  els.emergencyModal.setAttribute('aria-hidden', 'false');
}

function closeEmergencyModal() {
  els.emergencyModal.classList.add('hidden');
  els.emergencyModal.setAttribute('aria-hidden', 'true');
}

async function triggerSOS() {
  if (!requireLogin()) return;
  els.sosBtn.disabled = true;
  els.sosBtn.textContent = '⏳ Getting GPS…';

  try {
    try {
      const position = await getPosition();
      setPosition(position);
    } catch (error) {
      showToast(`GPS unavailable: ${error.message}`);
      addActivity('SOS started without a fresh GPS fix.');
    }

    sosActive = true;
    startLiveLocation();
    els.sosBtn.textContent = '🛑 Stop SOS';
    els.statusNote.textContent = 'SOS active. Choose an emergency service or send the prepared SOS SMS.';
    addIncident({
      type: 'sos',
      message: 'SOS activated; emergency center displayed.',
      latitude: lastPosition?.latitude ?? null,
      longitude: lastPosition?.longitude ?? null
    });
    addActivity('SOS activated. Emergency center opened.');
    openEmergencyModal();
  } finally {
    els.sosBtn.disabled = false;
  }
}

function stopSOS() {
  sosActive = false;
  stopLiveLocation();
  els.sosBtn.textContent = '🚨 One-Tap SOS';
  els.statusNote.textContent = 'SOS stopped on this device.';
  addIncident({ type: 'sos-stop', message: 'SOS stopped on the device.' });
  addActivity('SOS stopped.');
}

function startLiveLocation() {
  if (!navigator.geolocation || locationWatchId !== null) return;
  locationWatchId = navigator.geolocation.watchPosition(
    setPosition,
    () => {},
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
  );
}

function stopLiveLocation() {
  if (locationWatchId !== null) {
    navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
  }
}

function emergencyVoiceCall() {
  if (!requireLogin()) return;
  const c = contact('guardian');
  if (!c?.phone) {
    showToast('Guardian phone number is not saved.');
    return;
  }
  window.location.href = `tel:${cleanPhone(c.phone)}`;
}

function playRingtone() {
  stopRingtone();
  if (navigator.vibrate) navigator.vibrate([350, 180, 350, 180, 350, 180, 350]);

  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const beep = () => {
      if (!audioContext) return;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.045;
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start();
      osc.stop(audioContext.currentTime + 0.25);
    };
    beep();
    ringtoneTimer = window.setInterval(beep, 1200);
  } catch {
    // Some browsers block synthesized audio; vibration may still work.
  }
}

function stopRingtone() {
  if (ringtoneTimer) {
    window.clearInterval(ringtoneTimer);
    ringtoneTimer = null;
  }
  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
  if (navigator.vibrate) navigator.vibrate(0);
}

function openFakeCall() {
  if (!requireLogin()) return;
  const c = contact('guardian') || { name: 'Trusted Contact' };
  els.callName.textContent = c.name || 'Trusted Contact';
  els.callStatus.textContent = 'Ringing…';
  els.incomingCallScreen.hidden = false;
  els.pickupScreen.hidden = true;
  els.callModal.classList.remove('hidden');
  els.callModal.setAttribute('aria-hidden', 'false');
  playRingtone();
}

function answerFakeCall() {
  stopRingtone();
  els.incomingCallScreen.hidden = true;
  els.pickupScreen.hidden = false;
  els.callModal.classList.remove('hidden');
  els.callStatus.textContent = 'Connected';
  addActivity('Fake safety call answered.');
}

function closeFakeCall() {
  stopRingtone();
  els.callModal.classList.add('hidden');
  els.callModal.setAttribute('aria-hidden', 'true');
}

function renderUser() {
  els.userBadge.textContent = `Welcome, ${currentUser.fullName?.split(' ')[0] || 'User'}`;
  els.guardianName.textContent = currentUser.guardianName || '—';
  els.guardianPhone.textContent = currentUser.guardianPhone || '—';
  els.trustedName.textContent = currentUser.trustedName || '—';
  els.trustedPhone.textContent = currentUser.trustedPhone || '—';
  els.trustedAddress.textContent = currentUser.trustedAddress || '—';
  els.statusNote.textContent = 'Account active. Your emergency controls are ready.';
}

els.sosBtn.addEventListener('click', () => sosActive ? stopSOS() : triggerSOS());
els.voiceBtn.addEventListener('click', emergencyVoiceCall);
els.callBtn.addEventListener('click', openFakeCall);
els.shareBtn.addEventListener('click', async () => {
  if (!requireLogin()) return;
  try {
    setPosition(await getPosition());
    addIncident({ type: 'location-share', message: 'Location SMS prepared.', latitude: lastPosition.latitude, longitude: lastPosition.longitude });
    addActivity('Location SMS prepared.');
    smsTo('guardian');
  } catch (error) {
    showToast(`GPS unavailable: ${error.message}`);
  }
});
els.guardianSmsBtn.addEventListener('click', () => smsTo('guardian'));
els.trustedSmsBtn.addEventListener('click', () => smsTo('trusted'));
els.guardianEmergencySmsBtn.addEventListener('click', () => smsTo('guardian'));
els.trustedEmergencySmsBtn.addEventListener('click', () => smsTo('trusted'));
els.closeEmergencyBtn.addEventListener('click', closeEmergencyModal);
els.declineCallBtn.addEventListener('click', closeFakeCall);
els.answerCallBtn.addEventListener('click', answerFakeCall);
els.endCallBtn.addEventListener('click', closeFakeCall);

els.scanBtn.addEventListener('click', () => {
  if (!requireLogin()) return;
  const score = Number(els.riskScore.textContent || 24);
  els.riskScore.textContent = String(Math.min(100, score + 5));
  addIncident({ type: 'scan', message: 'Safety scan completed.' });
  addActivity('Safety scan completed.');
  showToast('Safety scan complete.');
});

els.logoutBtn.addEventListener('click', () => {
  stopLiveLocation();
  stopRingtone();
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'login.html';
});

currentUser = loadSession();
if (!currentUser) {
  window.location.replace('login.html');
} else {
  renderUser();
}
