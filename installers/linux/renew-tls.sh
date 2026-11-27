#!/usr/bin/env bash
# Reviewed local maintenance script, not a public service or automatic timer.
set -euo pipefail
umask 077
export PATH=/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
die(){ printf 'ERROR: %s\n' "$*" >&2; exit 1; }
[[ $EUID -eq 0 && $# -eq 0 ]] || die "Run using sudo without arguments."
ROOT=/opt/meshwall/engine
SERVICE=meshwall-engine.service
SRC="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
NODE="$(command -v node)"
[[ "$NODE" =~ ^/usr/(local/)?bin/node$ ]] || die "System-wide Node required."
[[ "$(systemctl show "$SERVICE" -p User --value)" == meshwall && "$(systemctl show "$SERVICE" -p WorkingDirectory --value)" == "$ROOT" ]] || die "Expected fresh MeshWall service."
systemctl is-active --quiet "$SERVICE" || die "Engine must be running before renewal."
as_engine(){ runuser -u meshwall -- env -i PATH=/usr/local/bin:/usr/bin:/bin HOME=/opt/meshwall "$NODE" "$SRC/scripts/tls.mjs" "$@"; }
STATUS="$(as_engine status "$ROOT")"
HOST="$(printf '%s' "$STATUS" | "$NODE" -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{let x=JSON.parse(s);if(!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+\.ts\.net$/i.test(x.host))process.exit(1);console.log(x.host)})')"
DAYS="$(printf '%s' "$STATUS" | "$NODE" -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{let n=JSON.parse(s).daysRemaining;if(!Number.isInteger(n))process.exit(1);console.log(n)})')"
if (( DAYS > 30 )); then printf 'Certificate valid for %s more days; no restart required.\n' "$DAYS"; exit 0; fi
TSHOST="$(tailscale status --json | "$NODE" -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{let x=JSON.parse(s);if(x.BackendState!=="Running"||!x.Self?.DNSName)process.exit(1);console.log(x.Self.DNSName.replace(/\.$/,""))})')"
[[ "$HOST" == "$TSHOST" ]] || die "Configured hostname differs from this tailnet node."
IP="$(tailscale ip -4)"
"$NODE" -e 'const ip=process.argv[1];if(!/^100\.(6[4-9]|[789]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(ip)||ip.split(".").some(x=>Number(x)>255))process.exit(1)' "$IP" || die "Invalid tailnet IP."
# Root-owned temp parent; only the dedicated input directory is readable by the service user.
TMP="$(mktemp -d)"
trap 'rm -rf -- "$TMP"' EXIT
chmod 0711 "$TMP"
tailscale cert --cert-file "$TMP/fullchain.pem" --key-file "$TMP/key.pem" "$HOST"
install -d -o meshwall -g meshwall -m 0700 "$TMP/input"
install -o meshwall -g meshwall -m 0600 "$TMP/fullchain.pem" "$TMP/input/chain.pem"
install -o meshwall -g meshwall -m 0600 "$TMP/key.pem" "$TMP/input/key.pem"
# Validate candidate before interrupting service, including whether it actually extends validity.
CANDIDATE="$(as_engine inspect "$ROOT" "$TMP/input/chain.pem" "$TMP/input/key.pem")"
parse_fingerprint(){ "$NODE" -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{let x=JSON.parse(s);if(!/^([A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(x.fingerprint))process.exit(1);console.log(x.fingerprint)})'; }
OLD_FP="$(printf '%s' "$STATUS" | parse_fingerprint)"
NEW_FP="$(printf '%s' "$CANDIDATE" | parse_fingerprint)"
if [[ "$OLD_FP" == "$NEW_FP" ]]; then printf 'Tailscale returned the existing certificate; no service restart. Check again before expiry.\n'; exit 0; fi
URL="https://$HOST:8443/meshwall.html"
# Both HTTPS content and the actual TLS peer fingerprint must match.
peer(){ "$NODE" -e 'const tls=require("node:tls");const [ip,host]=process.argv.slice(1);const s=tls.connect({host:ip,port:8443,servername:host,rejectUnauthorized:true},()=>{console.log(s.getPeerCertificate().fingerprint256);s.end()});s.setTimeout(3000,()=>s.destroy(Error("timeout")));s.on("error",()=>{process.exitCode=1});' "$IP" "$HOST"; }
ready(){ local expected="$1" body; for _ in $(seq 1 30); do if body="$(curl --silent --fail --max-time 3 --resolve "$HOST:8443:$IP" "$URL")" && [[ "$body" == *'<title>MeshWall</title>'* ]] && [[ "$(peer)" == "$expected" ]]; then return 0; fi; sleep 2; done; return 1; }
printf 'Certificate renewal requires a brief service interruption.\n'
systemctl stop "$SERVICE"
if systemctl is-active --quiet "$SERVICE"; then die "Engine did not stop."; fi
if ! RECOVERY="$(as_engine rotate "$ROOT" "$TMP/input/chain.pem" "$TMP/input/key.pem" --engine-stopped)"; then
 printf 'Rotation failed. Inspect certificate state before restarting.\n' >&2; exit 1
fi
if [[ "$RECOVERY" == UNCHANGED ]]; then systemctl start "$SERVICE"; ready "$OLD_FP" || die "HTTPS readiness failed."; printf 'Tailscale returned the existing certificate; check again before expiry.\n'; exit 0; fi
[[ "$RECOVERY" =~ ^/opt/meshwall/engine/meshwall-tls-recovery-[a-f0-9]{24}$ ]] || die "Unexpected recovery path; inspect before restarting."
if systemctl start "$SERVICE" && ready "$NEW_FP"; then
 printf 'Renewed HTTPS certificate; previous certificate retained in %s\n' "$RECOVERY"; exit 0
fi
printf 'HTTPS readiness failed; attempting offline certificate rollback.\n' >&2
systemctl stop "$SERVICE"
if systemctl is-active --quiet "$SERVICE"; then die "Engine did not stop for rollback."; fi
as_engine rollback "$ROOT" "$RECOVERY" --engine-stopped
systemctl start "$SERVICE"
ready "$OLD_FP" || die "Rollback HTTPS verification failed; inspect service and recovery directories."
die "Renewal failed; previous certificate restored and HTTPS verified."
