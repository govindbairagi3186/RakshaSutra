export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const {
    action = 'sos',
    contactName = 'Emergency contact',
    contactPhone,
    userName = 'RakshaSutra user',
    latitude,
    longitude,
    accuracy,
    timestamp
  } = req.body || {};

  const phone = normalizePhone(contactPhone);
  if (!phone) {
    return res.status(400).json({ ok: false, error: 'Enter a valid Indian emergency contact number.' });
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = normalizePhone(process.env.TWILIO_FROM_NUMBER);

  if (!sid || !token || !from) {
    return res.status(503).json({
      ok: false,
      error: 'SOS backend is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER in Vercel.'
    });
  }

  const mapLink = validCoordinates(latitude, longitude)
    ? `https://maps.google.com/?q=${encodeURIComponent(`${latitude},${longitude}`)}`
    : null;

  const when = timestamp ? new Date(timestamp).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');

  const body = action === 'stop'
    ? `RakshaSutra: ${userName} has ended the SOS alert at ${when}.`
    : action === 'location'
      ? [
          `RakshaSutra LIVE LOCATION UPDATE for ${userName}.`,
          `Time: ${when}`,
          mapLink ? `Location: ${mapLink}` : 'Location: GPS unavailable.'
        ].join('\n')
      : [
          'RAKSHA SUTRA SOS ALERT',
          `${userName} has activated an emergency alert.`,
          `Time: ${when}`,
          mapLink ? `Current location: ${mapLink}` : 'Current location: GPS unavailable.',
          `Emergency contact: ${contactName}`,
          'Please contact the user and help them reach a safe place.'
        ].join('\n');

  const sms = await twilio(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    sid, token,
    { To: phone, From: from, Body: body }
  );

  if (!sms.ok) {
    return res.status(502).json({ ok: false, sms: false, call: false, error: sms.error });
  }

  let call = { ok: false };
  if (action === 'sos') {
    const spoken = [
      'Emergency alert from RakshaSutra.',
      `${userName} has activated an SOS alert.`,
      'Please check on them immediately.',
      mapLink ? `Their current location is ${mapLink}.` : ''
    ].filter(Boolean).join(' ');

    const twiml = `<Response><Say language="en-IN">${escapeXml(spoken)}</Say></Response>`;

    call = await twilio(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`,
      sid, token,
      { To: phone, From: from, Twiml: twiml }
    );
  }

  return res.status(200).json({
    ok: true,
    sms: true,
    call: action === 'sos' ? call.ok : false,
    message: action === 'sos'
      ? 'Emergency SMS sent and emergency call requested.'
      : action === 'location'
        ? 'Location update sent.'
        : 'SOS stop notification sent.'
  });
}

async function twilio(url, sid, token, fields) {
  const body = new URLSearchParams();
  Object.entries(fields).forEach(([key, value]) => body.set(key, String(value)));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || `Provider error ${response.status}.` };
    return { ok: true, sid: data.sid || null };
  } catch (error) {
    return { ok: false, error: error.message || 'Network error.' };
  }
}

function normalizePhone(value) {
  if (!value) return null;
  const raw = String(value).trim().replace(/[^\d+]/g, '');
  if (raw.startsWith('+')) return raw;
  if (raw.startsWith('00')) return `+${raw.slice(2)}`;
  if (/^0?[6-9]\d{9}$/.test(raw)) return `+91${raw.replace(/^0/, '')}`;
  return null;
}

function validCoordinates(latitude, longitude) {
  return Number.isFinite(Number(latitude))
    && Number.isFinite(Number(longitude))
    && Math.abs(Number(latitude)) <= 90
    && Math.abs(Number(longitude)) <= 180;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
