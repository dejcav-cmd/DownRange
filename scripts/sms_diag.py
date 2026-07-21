import os, json, base64, urllib.request, subprocess, sys
from datetime import datetime, timezone

ADMIN_KEY = os.environ['ADMIN_KEY']
BYPASS    = os.environ.get('BYPASS', '')
SID       = os.environ['TWILIO_ACCOUNT_SID']
TOKEN     = os.environ['TWILIO_AUTH_TOKEN']
GH_PAT    = os.environ.get('GH_PAT', '')
REPO      = 'dejcav-cmd/DownRange'

def curl_get(url):
    result = subprocess.run([
        'curl', '-sL', '--max-time', '25', url,
        '-H', f'x-admin-key: {ADMIN_KEY}',
        '-H', f'x-vercel-protection-bypass: {BYPASS}'
    ], capture_output=True, text=True)
    return result.stdout

def curl_post(url, body='{}'):
    result = subprocess.run([
        'curl', '-sL', '--max-time', '25', '-X', 'POST', url,
        '-H', 'Content-Type: application/json',
        '-H', f'x-admin-key: {ADMIN_KEY}',
        '-H', f'x-vercel-protection-bypass: {BYPASS}',
        '-d', body
    ], capture_output=True, text=True)
    return result.stdout

def twilio_sms(to, from_num, body_text):
    result = subprocess.run([
        'curl', '-sL', '--max-time', '25', '-X', 'POST',
        f'https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json',
        '-u', f'{SID}:{TOKEN}',
        '--data-urlencode', f'To={to}',
        '--data-urlencode', f'From={from_num}',
        '--data-urlencode', f'Body={body_text}'
    ], capture_output=True, text=True)
    return result.stdout

lines = []
def log(msg=''):
    print(msg)
    lines.append(str(msg))

# ── 1. Config status ──────────────────────────────────────────────────────────
log("=== 1. SMS CONFIG STATUS ===")
cfg_raw = curl_get("https://downrangeco.com/api/admin/sms-config")
log(f"Raw: {cfg_raw[:500]}")
try:
    cfg_data = json.loads(cfg_raw)
    s = cfg_data.get('status', {})
    o = cfg_data.get('override', {})
    log(f"configured: {s.get('configured')}")
    log(f"enabled:    {s.get('enabled')}")
    log(f"sidSet:     {s.get('sidSet')}")
    log(f"tokenSet:   {s.get('tokenSet')}")
    log(f"from:       {s.get('from')}")
    log(f"to:         {s.get('to')}")
    log(f"cooldown:   {s.get('cooldownSecs')}s")
    log(f"quietStart: {s.get('quietStart')} quietEnd: {s.get('quietEnd')}")
    log(f"criticalJobs: {s.get('criticalJobs')}")
    log(f"Redis override present: {bool(o)}")
    if o:
        log(f"  override.sid set:   {bool(o.get('sid'))}")
        log(f"  override.token set: {bool(o.get('token'))}")
        log(f"  override.from:      {o.get('from')}")
        log(f"  override.to:        {o.get('to')}")
        log(f"  override.enabled:   {o.get('enabled')}")
        log(f"  override.updatedAt: {o.get('updatedAt')}")
    log()
    log("--- Last SMS log entries ---")
    for entry in cfg_data.get('log', [])[:8]:
        log(f"  {entry}")
except Exception as e:
    log(f"PARSE ERROR: {e}")

# ── 2. Test SMS via site API ──────────────────────────────────────────────────
log()
log("=== 2. TEST SMS via /api/admin/test-sms ===")
sms_raw = curl_post("https://downrangeco.com/api/admin/test-sms")
log(f"Result: {sms_raw}")
try:
    sms_data = json.loads(sms_raw)
    log(f"sent:   {sms_data.get('sent')}")
    log(f"sid:    {sms_data.get('sid')}")
    log(f"status: {sms_data.get('status')}")
    log(f"error:  {sms_data.get('error')}")
    log(f"reason: {sms_data.get('reason')}")
    log(f"httpStatus: {sms_data.get('httpStatus')}")
except Exception as e:
    log(f"PARSE ERROR: {e}")

# ── 3. Direct Twilio API call ─────────────────────────────────────────────────
log()
log("=== 3. DIRECT TWILIO API TEST ===")
ts = datetime.now(timezone.utc).strftime('%H:%M UTC')
direct_raw = twilio_sms('+12066016076', '+12062036281', f'DownRange direct test {ts}')
log(f"Result: {direct_raw[:600]}")
try:
    direct_data = json.loads(direct_raw)
    log(f"sid:          {direct_data.get('sid')}")
    log(f"status:       {direct_data.get('status')}")
    log(f"error_code:   {direct_data.get('code')}")
    log(f"error_msg:    {direct_data.get('message')}")
    log(f"to:           {direct_data.get('to')}")
    log(f"from:         {direct_data.get('from_')}")
except Exception as e:
    log(f"PARSE ERROR: {e}")

# ── 4. Quiet hours check ──────────────────────────────────────────────────────
log()
log("=== 4. QUIET HOURS CHECK ===")
now = datetime.now(timezone.utc)
hour = now.hour
log(f"UTC hour: {hour} ({now.strftime('%H:%M UTC')})")
in_quiet = hour >= 23 or hour < 7
log(f"In quiet window (23:00-07:00 UTC): {in_quiet}")
log(f"PT approx: {(hour-7)%24}:xx PT")

# ── 5. Save result ────────────────────────────────────────────────────────────
log()
log("=== DONE ===")

if GH_PAT:
    path = 'docs/sms-diag-result.md'
    ts_str = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    content = f"# SMS Diagnostic — {ts_str}\n\n```\n" + "\n".join(lines) + "\n```\n"
    enc = base64.b64encode(content.encode()).decode()
    sha = ''
    try:
        req = urllib.request.Request(
            f'https://api.github.com/repos/{REPO}/contents/{path}',
            headers={'Authorization': f'Bearer {GH_PAT}'})
        with urllib.request.urlopen(req) as r:
            sha = json.load(r).get('sha', '')
    except: pass
    body = {'message': f'chore: sms diag {ts_str}', 'content': enc}
    if sha: body['sha'] = sha
    req2 = urllib.request.Request(
        f'https://api.github.com/repos/{REPO}/contents/{path}',
        data=json.dumps(body).encode(), method='PUT',
        headers={'Authorization': f'Bearer {GH_PAT}', 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req2) as r:
            print(f"\nSaved to {path}")
    except Exception as e:
        print(f"\nSave failed: {e}")
