#!/usr/bin/env bash
# Validates Beefree SDK credentials against https://auth.getbee.io/loginV2.
# On success prints the plan and the application type read from the token.
# On failure prints the HTTP status and the Beefree error code and message.
# Never prints the Client Secret or the token. The secret reaches node through the
# environment and curl through stdin, never through arguments, so it is not in `ps` output.
#
# Usage:
#   BEEFREE_CLIENT_ID=... BEEFREE_CLIENT_SECRET=... scripts/check-credentials.sh
#   scripts/check-credentials.sh path/to/.env        # reads the two variables from a .env file
#   scripts/check-credentials.sh path/to/.env my-uid # custom uid (default: demo-user)
#   scripts/check-credentials.sh my-uid              # custom uid, credentials from the environment
#
# The .env file is parsed, never sourced: only BEEFREE_CLIENT_ID and BEEFREE_CLIENT_SECRET are read,
# with the rules of `node --env-file` (KEY=value, optional `export`, `#` comments, surrounding quotes
# stripped, no expansion, CRLF tolerated, last occurrence wins). Other lines are ignored, so a real
# app's .env with spaces, dotted keys or `$` in values is safe. One difference from node: a value in
# the file replaces one already in the environment, because the file was asked for explicitly.
#
# Exit codes: 0 credentials accepted, 1 rejected by Beefree, 2 usage error.
set -euo pipefail

# read_env_key FILE KEY: prints the value of KEY parsed from FILE, returns 1 when absent.
read_env_key() {
  local file="$1" key="$2" line k v q found=1 value=""
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    line="${line#"${line%%[![:space:]]*}"}"
    [[ -z "$line" || "$line" == \#* ]] && continue
    [[ "$line" == export\ * ]] && line="${line#export }"
    [[ "$line" == *=* ]] || continue
    k="${line%%=*}"
    k="${k%"${k##*[![:space:]]}"}"
    [[ "$k" == "$key" ]] || continue
    v="${line#*=}"
    v="${v#"${v%%[![:space:]]*}"}"
    v="${v%"${v##*[![:space:]]}"}"
    case "$v" in
      \"*|\'*|\`*) q="${v:0:1}"; v="${v#?}"; v="${v%%"$q"*}" ;;  # quoted: up to the closing quote, rest of the line dropped
      *) v="${v%%#*}"; v="${v%"${v##*[![:space:]]}"}" ;;        # unquoted: trailing comment dropped
    esac
    value="$v"; found=0
  done < "$file"
  [[ $found == 0 ]] && printf '%s' "$value"
  return $found
}

DEFAULT_AUTH_URL="https://auth.getbee.io/loginV2"
AUTH_URL="${BEEFREE_AUTH_URL:-$DEFAULT_AUTH_URL}"

if [[ $# -ge 1 && -f "$1" ]]; then
  if [[ ! -r "$1" ]]; then
    echo "error: cannot read $1." >&2
    exit 2
  fi
  if v="$(read_env_key "$1" BEEFREE_CLIENT_ID)"; then BEEFREE_CLIENT_ID="$v"; fi
  if v="$(read_env_key "$1" BEEFREE_CLIENT_SECRET)"; then BEEFREE_CLIENT_SECRET="$v"; fi
  unset v
  shift
fi
UID_VALUE="${1:-demo-user}"  # first non-file argument is the uid

if [[ -z "${BEEFREE_CLIENT_ID:-}" || -z "${BEEFREE_CLIENT_SECRET:-}" ]]; then
  echo "error: BEEFREE_CLIENT_ID and BEEFREE_CLIENT_SECRET must be set (or pass a .env path)." >&2
  exit 2
fi
if [[ "$BEEFREE_CLIENT_ID" == "YOUR_CLIENT_ID" || "$BEEFREE_CLIENT_SECRET" == "YOUR_CLIENT_SECRET" ]]; then
  echo "error: credentials are still the placeholders from .env.example." >&2
  exit 2
fi
if [[ ! "$UID_VALUE" =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "error: uid may contain only letters, digits, _ and -." >&2
  exit 2
fi

HAVE_NODE=0; command -v node >/dev/null 2>&1 && HAVE_NODE=1
HAVE_JQ=0;   command -v jq   >/dev/null 2>&1 && HAVE_JQ=1

if [[ "$AUTH_URL" != "$DEFAULT_AUTH_URL" ]]; then
  echo "note: BEEFREE_AUTH_URL is set, credentials will be sent to $AUTH_URL"
fi

# Payload is built by a tiny node one-liner when available (correct JSON escaping), else by printf.
# Credentials go to node through the environment, not argv.
if [[ $HAVE_NODE == 1 ]]; then
  PAYLOAD="$(BEEFREE_CLIENT_ID="$BEEFREE_CLIENT_ID" BEEFREE_CLIENT_SECRET="$BEEFREE_CLIENT_SECRET" BEEFREE_UID="$UID_VALUE" \
    node -e 'const e=process.env;process.stdout.write(JSON.stringify({client_id:e.BEEFREE_CLIENT_ID,client_secret:e.BEEFREE_CLIENT_SECRET,uid:e.BEEFREE_UID}))')"
else
  PAYLOAD="$(printf '{"client_id":"%s","client_secret":"%s","uid":"%s"}' "$BEEFREE_CLIENT_ID" "$BEEFREE_CLIENT_SECRET" "$UID_VALUE")"
fi

BODY_FILE="$(mktemp)"
trap 'rm -f "$BODY_FILE"' EXIT

# The payload goes to curl through stdin (@-), not argv.
STATUS="$(printf '%s' "$PAYLOAD" | curl -sS -o "$BODY_FILE" -w '%{http_code}' \
  -X POST "$AUTH_URL" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  --data-binary @-)"

# --- failure -----------------------------------------------------------------
if [[ "$STATUS" != "200" ]]; then
  echo "FAILED: HTTP $STATUS"
  if [[ $HAVE_JQ == 1 ]]; then
    jq -r '"code \(.code // "n/a"): \(.message // "no message")"' "$BODY_FILE" 2>/dev/null || cat "$BODY_FILE"
  else
    cat "$BODY_FILE"
  fi
  echo
  echo "Hints: 401/5002 wrong Client ID or Client Secret; 400/5005 invalid uid; 403/5003 application disabled."
  exit 1
fi

# --- success: read plan and application type from the token ------------------
# The access_token is a JWT. Its payload (second segment, base64url) carries
# "plan" and "product_handle" in clear text. Only those two claims are printed.
# This is observed behaviour, not documented by Beefree: on any decode problem
# the script says so and asks the developer for the plan instead of failing.
echo "OK: HTTP 200, token received for uid '$UID_VALUE' (not shown)."

CLAIMS=""
if [[ $HAVE_NODE == 1 ]]; then
  CLAIMS="$(node -e '
    const fs = require("fs");
    try {
      const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      const seg = String(body.access_token || "").split(".")[1] || "";
      const p = JSON.parse(Buffer.from(seg, "base64url").toString("utf8"));
      process.stdout.write(`${p.plan ?? ""}\t${p.product_handle ?? ""}`);
    } catch { process.exit(3); }
  ' "$BODY_FILE" 2>/dev/null || true)"
elif [[ $HAVE_JQ == 1 ]]; then
  SEG="$(jq -r '.access_token // "" | split(".")[1] // ""' "$BODY_FILE" 2>/dev/null | tr '_-' '/+' || true)"
  case $(( ${#SEG} % 4 )) in 2) SEG="${SEG}==";; 3) SEG="${SEG}=";; esac
  CLAIMS="$(printf '%s' "$SEG" | base64 -d 2>/dev/null | jq -r '[(.plan // ""), (.product_handle // "")] | @tsv' 2>/dev/null || true)"
fi

if [[ -z "$CLAIMS" ]]; then
  if [[ $HAVE_NODE == 0 && $HAVE_JQ == 0 ]]; then
    echo "Plan: not read (install node or jq to decode the token). Ask the developer which plan the application is on."
  else
    echo "Plan: not readable from the token. Ask the developer which plan the application is on."
  fi
  exit 0
fi

PLAN_RAW="${CLAIMS%%$'\t'*}"
HANDLE="${CLAIMS#*$'\t'}"
[[ "$HANDLE" == "$CLAIMS" ]] && HANDLE=""

# Billing period does not change entitlements: beeplugin_gold_annual is Superpowers.
PLAN_BASE="${PLAN_RAW%_annual}"
case "$PLAN_BASE" in
  beeplugin_free)       PLAN_NAME="Free";        TIER=10 ;;
  beeplugin_startup)    PLAN_NAME="Essentials";  TIER=20 ;;
  beeplugin_silver)     PLAN_NAME="Core";        TIER=30 ;;
  beeplugin_gold)       PLAN_NAME="Superpowers"; TIER=40 ;;
  beeplugin_enterprise) PLAN_NAME="Enterprise";  TIER=50 ;;
  *)                    PLAN_NAME="";            TIER="" ;;
esac

if [[ -n "$PLAN_NAME" ]]; then
  echo "Plan: $PLAN_NAME (tier $TIER, token value '$PLAN_RAW'). Ask the developer to confirm; then see references/plans.md for what it includes."
elif [[ -n "$PLAN_RAW" ]]; then
  echo "Plan: token value '$PLAN_RAW' is not in the known list (beeplugin_free/startup/silver/gold/enterprise). Ask the developer which plan the application is on."
else
  echo "Plan: the token has no plan claim. Ask the developer which plan the application is on."
fi

case "${HANDLE:-nl}" in
  nl)   TYPE="Email Builder" ;;
  page) TYPE="Page Builder" ;;
  pub)  TYPE="Popup Builder" ;;
  fm)   TYPE="File Manager" ;;
  *)    TYPE="unknown" ;;
esac
if [[ -z "$HANDLE" ]]; then
  echo "Application type: Email Builder assumed (no product_handle claim)."
else
  echo "Application type: $TYPE (product_handle '$HANDLE')."
fi
case "${HANDLE:-nl}" in
  nl|fm) ;;
  *)     echo "Note: the demo in assets/demo covers Email Builder and File Manager applications only." ;;
esac
exit 0
