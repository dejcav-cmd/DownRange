"""
One-time setup script: inspects the raw Facebook token provided via FACEBOOK_TEMP_TOKEN,
resolves it to a Page Access Token + Page ID for the DownRange Facebook Page, stores those
as new GitHub Actions secrets (FACEBOOK_PAGE_ACCESS_TOKEN, FACEBOOK_PAGE_ID), and writes a
non-sensitive summary to docs/facebook-token-check.json. Deletes the temp secret afterward.

Never prints the raw token value.
"""
import os
import sys
import json
import base64
import requests
from nacl import encoding, public

OWNER = "dejcav-cmd"
REPO = "DownRange"
GH_PAT = os.environ["GH_PAT_ENV"]
RAW_TOKEN = os.environ["FB_RAW_TOKEN"]
GRAPH_VERSION = "v26.0"

gh_headers = {"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github+json"}


def gh_set_secret(name, value):
    r = requests.get(f"https://api.github.com/repos/{OWNER}/{REPO}/actions/secrets/public-key", headers=gh_headers)
    r.raise_for_status()
    key_data = r.json()
    public_key = public.PublicKey(key_data["key"].encode("utf-8"), encoding.Base64Encoder())
    sealed_box = public.SealedBox(public_key)
    encrypted = sealed_box.encrypt(value.encode("utf-8"))
    encrypted_b64 = base64.b64encode(encrypted).decode("utf-8")
    payload = {"encrypted_value": encrypted_b64, "key_id": key_data["key_id"]}
    r2 = requests.put(f"https://api.github.com/repos/{OWNER}/{REPO}/actions/secrets/{name}", headers=gh_headers, json=payload)
    r2.raise_for_status()
    return r2.status_code


def gh_delete_secret(name):
    r = requests.delete(f"https://api.github.com/repos/{OWNER}/{REPO}/actions/secrets/{name}", headers=gh_headers)
    return r.status_code


def gh_put_file(path, content_str, message):
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{path}"
    sha = None
    r = requests.get(url, headers=gh_headers)
    if r.status_code == 200:
        sha = r.json().get("sha")
    payload = {
        "message": message,
        "content": base64.b64encode(content_str.encode("utf-8")).decode("utf-8"),
    }
    if sha:
        payload["sha"] = sha
    r2 = requests.put(url, headers=gh_headers, json=payload)
    return r2.status_code, r2.text


def mask(tok):
    if not tok or len(tok) < 12:
        return "***"
    return tok[:6] + "..." + tok[-4:]


result = {"steps": []}

# Step 1: debug the token
dbg = requests.get(
    f"https://graph.facebook.com/{GRAPH_VERSION}/debug_token",
    params={"input_token": RAW_TOKEN, "access_token": RAW_TOKEN},
).json()
result["debug_token"] = dbg
data = dbg.get("data", {})
token_type = data.get("type")  # USER or PAGE
scopes = data.get("scopes", [])
expires_at = data.get("expires_at")
is_valid = data.get("is_valid")

result["steps"].append(f"debug_token: type={token_type} valid={is_valid} expires_at={expires_at} scopes={scopes}")

final_page_token = None
final_page_id = None
final_page_name = None
final_expires_at = expires_at

if not is_valid:
    result["error"] = "Provided token is not valid per debug_token."
else:
    if token_type == "PAGE":
        # It's already a page token - confirm identity
        me = requests.get(
            f"https://graph.facebook.com/{GRAPH_VERSION}/me",
            params={"fields": "id,name,category", "access_token": RAW_TOKEN},
        ).json()
        result["me_as_page"] = me
        if "id" in me:
            final_page_token = RAW_TOKEN
            final_page_id = me["id"]
            final_page_name = me.get("name")
            result["steps"].append(f"Token is already a PAGE token for '{final_page_name}' ({final_page_id})")
        else:
            result["error"] = f"Token claims PAGE type but /me failed: {me}"
    elif token_type == "USER":
        accounts = requests.get(
            f"https://graph.facebook.com/{GRAPH_VERSION}/me/accounts",
            params={"access_token": RAW_TOKEN},
        ).json()
        result["accounts"] = accounts
        pages = accounts.get("data", [])
        if not pages:
            result["error"] = f"USER token valid but /me/accounts returned no pages: {accounts}"
        else:
            # Prefer a page literally named DownRange-ish, else take first
            chosen = None
            for p in pages:
                if "downrange" in p.get("name", "").lower():
                    chosen = p
                    break
            if not chosen:
                chosen = pages[0]
            final_page_token = chosen.get("access_token")
            final_page_id = chosen.get("id")
            final_page_name = chosen.get("name")
            result["steps"].append(f"Resolved PAGE token for '{final_page_name}' ({final_page_id}) from USER token's /me/accounts")
            result["all_pages_found"] = [{"id": p.get("id"), "name": p.get("name")} for p in pages]
    else:
        result["error"] = f"Unexpected token type: {token_type}"

if final_page_token and final_page_id:
    status1 = gh_set_secret("FACEBOOK_PAGE_ACCESS_TOKEN", final_page_token)
    status2 = gh_set_secret("FACEBOOK_PAGE_ID", str(final_page_id))
    result["steps"].append(f"Set FACEBOOK_PAGE_ACCESS_TOKEN secret (status {status1})")
    result["steps"].append(f"Set FACEBOOK_PAGE_ID secret (status {status2})")
    result["final_page_name"] = final_page_name
    result["final_page_id"] = final_page_id
    result["final_token_masked"] = mask(final_page_token)
    result["final_token_expires_at"] = final_expires_at
    result["success"] = True
else:
    result["success"] = False

# cleanup temp secret regardless of outcome
del_status = gh_delete_secret("FACEBOOK_TEMP_TOKEN")
result["steps"].append(f"Deleted FACEBOOK_TEMP_TOKEN (status {del_status})")

summary_json = json.dumps(result, indent=2)
status, resp_text = gh_put_file("docs/facebook-token-check.json", summary_json, "chore: facebook token setup result")
print("Contents API PUT status:", status)

print(json.dumps({k: v for k, v in result.items() if k not in ("debug_token", "accounts", "me_as_page")}, indent=2))
