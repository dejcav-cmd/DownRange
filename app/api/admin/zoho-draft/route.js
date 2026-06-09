import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ZOHO_ACCOUNT_ID = '5499268000000008002';

async function getAccessToken() {
  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    client_id:     process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    grant_type:    'refresh_token',
  });
  const res = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

export async function POST(request) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { to, toName, subject, textBody, htmlBody, fromAddress } = await request.json();

  if (!to || !subject || (!textBody && !htmlBody)) {
    return NextResponse.json({ error: 'Missing required fields: to, subject, textBody or htmlBody' }, { status: 400 });
  }

  let accessToken;
  try {
    accessToken = await getAccessToken();
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const isPlainText = !!textBody && !htmlBody;

  const payload = {
    mode:        'draft',
    fromAddress: fromAddress || 'dj@downrangeco.com',
    toAddress:   toName ? `${toName} <${to}>` : to,
    subject,
    content:     textBody || htmlBody,
    mailFormat:  isPlainText ? 'plaintext' : 'html',
  };

  const res = await fetch(`https://mail.zoho.com/api/accounts/${ZOHO_ACCOUNT_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization:  `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
      Accept:         'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (data.status?.code === 200) {
    return NextResponse.json({ ok: true, messageId: data.data?.messageId });
  } else {
    return NextResponse.json({ error: 'Zoho API error', detail: data }, { status: 500 });
  }
}
