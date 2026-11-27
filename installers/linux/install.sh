#!/usr/bin/env bash
# Fresh Linux alpha install. Run only on an isolated, authorized test server.
set -euo pipefail
umask 077
APP=/opt/meshwall
SERVICE=meshwall-engine
VERSION=1.3.2
SRC="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
die(){ printf 'ERROR: %s\n' "$*" >&2; exit 1; }
[[ $EUID -eq 0 ]] || die "Run with sudo on a systemd Linux host."
[[ -t 0 ]] || die "Interactive terminal required for administrator setup."
for cmd in node npm tailscale systemctl curl openssl runuser useradd install getent; do command -v "$cmd" >/dev/null || die "Missing prerequisite: $cmd"; done
[[ $(uname -m) == aarch64 || $(uname -m) == x86_64 ]] || die "This alpha supports ARM64/x64 only."
[[ $(node -p 'process.arch') == arm64 || $(node -p 'process.arch') == x64 ]] || die "64-bit Node userspace required."
node -e 'const [a,b,c]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&(b>21||(b===21&&c>=1)))?0:1)' || die "MeshCentral 1.3.2 requires Node >=22.21.1."
NODE="$(command -v node)"; NPM="$(command -v npm)"
[[ "$NODE" =~ ^/usr/(local/)?bin/node$ && "$NPM" =~ ^/usr/(local/)?bin/npm$ ]] || die "Use system-wide Node/npm, not a user-specific installation."
[[ -f "$SRC/apps/web/public/meshwall.html" ]] || die "Run from repository checkout."
[[ ! -e "$APP" && ! -e "/etc/systemd/system/$SERVICE.service" ]] || die "Existing or partial installation found. Do not overwrite; see recovery docs."
! getent passwd meshwall >/dev/null || die "meshwall service account already exists; inspect before continuing."
STATUS="$(tailscale status --json)" || die "Tailscale must be installed and authenticated first."
HOST="$(printf '%s' "$STATUS" | node -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{let x=JSON.parse(s);if(x.BackendState!=="Running"||!x.Self?.DNSName)process.exit(1);console.log(x.Self.DNSName.replace(/\.$/,""))})')" || die "Tailscale must be Running with MagicDNS."
IP="$(tailscale ip -4)" || die "No Tailscale IPv4."
PORT=8443
node -e 'const [h,ip]=process.argv.slice(1);if(!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+\.ts\.net$/i.test(h)||!/^100\.(6[4-9]|[789]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(ip))process.exit(1)' "$HOST" "$IP" || die "Invalid tailnet hostname or IPv4."
if command -v ss >/dev/null && ss -H -ltn "sport = :$PORT" | grep -q .; then die "Port $PORT already in use."; fi
printf 'Fresh MeshCentral %s on %s:%s, bound to %s only.\n' "$VERSION" "$HOST" "$PORT" "$IP"
printf 'Tailscale HTTPS certificates must be enabled; DNS name may appear in public certificate transparency logs.\n'
read -r -p "Proceed on this authorized test host? [y/N] " confirm
[[ $confirm == y || $confirm == Y ]] || exit 1
read -r -p "Initial administrator username: " ADMIN
[[ "$ADMIN" =~ ^[a-zA-Z][a-zA-Z0-9_.-]{2,31}$ ]] || die "Use 3–32 letters/numbers/._- starting with a letter."
read -r -s -p "Initial administrator password (16+ characters): " PASS; printf '\n'
read -r -s -p "Repeat password: " PASS2; printf '\n'
[[ ${#PASS} -ge 16 && "$PASS" == "$PASS2" && "$PASS" =~ [[:alpha:]] && "$PASS" != -* ]] || die "Passwords must match, include a letter, not start with a dash, and be at least 16 characters."
unset PASS2
TMP="$(mktemp -d)"
trap 'unset PASS; rm -rf -- "$TMP"' EXIT
tailscale cert --cert-file "$TMP/fullchain.pem" --key-file "$TMP/key.pem" "$HOST" || die "Certificate issuance failed. Enable HTTPS in Tailscale and retry before installing."
openssl x509 -in "$TMP/fullchain.pem" -noout -checkhost "$HOST" | grep -q 'does match certificate' || die "Certificate hostname mismatch."
openssl x509 -in "$TMP/fullchain.pem" -checkend 86400 -noout || die "Certificate expires too soon."
# Split PEM chain into leaf and intermediate certificates for MeshCentral.
awk -v dir="$TMP" '/-----BEGIN CERTIFICATE-----/{n++} n{print > (dir "/cert-" n ".pem")}' "$TMP/fullchain.pem"
[[ -s "$TMP/cert-1.pem" && -s "$TMP/key.pem" ]] || die "Incomplete certificate material."
useradd --system --user-group --home-dir "$APP" --shell /usr/sbin/nologin meshwall
install -d -o meshwall -g meshwall -m 0750 "$APP" "$APP/engine" "$APP/engine/meshcentral-data" "$APP/engine/meshcentral-web/public"
runuser -u meshwall -- env HOME="$APP" PATH=/usr/local/bin:/usr/bin:/bin "$NPM" install --prefix "$APP/engine" --omit=dev --no-audit --no-fund "meshcentral@$VERSION"
ENGINE="$APP/engine/node_modules/meshcentral"
[[ -f "$ENGINE/package.json" ]] || die "Engine package missing."
"$NODE" -e 'const p=require(process.argv[1]);if(p.version!=="1.3.2")process.exit(1)' "$ENGINE/package.json" || die "Unexpected engine version."
install -d -o meshwall -g meshwall -m 0750 "$APP/engine/meshcentral-web/public/meshwall"
install -o meshwall -g meshwall -m 0640 "$SRC/apps/web/public/meshwall.html" "$APP/engine/meshcentral-web/public/meshwall.html"
install -o meshwall -g meshwall -m 0640 "$SRC/apps/web/public/meshwall/"* "$APP/engine/meshcentral-web/public/meshwall/"
DATA="$APP/engine/meshcentral-data"
install -o meshwall -g meshwall -m 0600 "$TMP/cert-1.pem" "$DATA/webserver-cert-public.crt"
install -o meshwall -g meshwall -m 0600 "$TMP/key.pem" "$DATA/webserver-cert-private.key"
i=2; while [[ -f "$TMP/cert-$i.pem" ]]; do install -o meshwall -g meshwall -m 0600 "$TMP/cert-$i.pem" "$DATA/webserver-cert-chain$((i-1)).crt"; ((i+=1)); done
"$NODE" "$SRC/installers/linux/config.mjs" "$HOST" "$IP" "$PORT" > "$TMP/config.json"
install -o meshwall -g meshwall -m 0600 "$TMP/config.json" "$DATA/config.json"
# Pass secret only through environment to offline upstream account creation; do not log or put in CLI args.
cd "$APP/engine"
out="$(printf '%s' "$PASS" | runuser -u meshwall -- env -i HOME="$APP" PATH=/usr/local/bin:/usr/bin:/bin "$NODE" -e 'const fs=require("node:fs"),cp=require("node:child_process");const pass=fs.readFileSync(0,"utf8");const r=cp.spawnSync(process.execPath,[process.argv[1],"--createaccount",process.argv[2]],{env:{...process.env,meshcentral_pass:pass},encoding:"utf8",stdio:["ignore","pipe","pipe"]});if(r.error||r.status!==0)process.exit(1);process.stdout.write(r.stdout||"");' "$ENGINE" "$ADMIN")" || die "Account creation failed."
unset PASS
grep -q '^Done\.' <<< "$out" || die "Account creation was not confirmed. Inspect offline state before retry."
unset out
out="$(runuser -u meshwall -- env HOME="$APP" "$NODE" "$ENGINE" --adminaccount "$ADMIN")" || die "Administrator promotion failed."
grep -q '^Done\.' <<< "$out" || die "Administrator promotion was not confirmed."
unset out
cat > "$TMP/service" <<EOF
[Unit]
Description=MeshWall / MeshCentral engine
After=network-online.target tailscaled.service
Wants=network-online.target
StartLimitIntervalSec=0
[Service]
Type=simple
User=meshwall
Group=meshwall
WorkingDirectory=$APP/engine
Environment=HOME=$APP
ExecStart=$NODE $ENGINE
Restart=on-failure
RestartSec=10
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
[Install]
WantedBy=multi-user.target
EOF
install -m 0644 "$TMP/service" "/etc/systemd/system/$SERVICE.service"
systemctl daemon-reload
systemctl enable --now "$SERVICE"
URL="https://$HOST:$PORT/meshwall.html"
for _ in $(seq 1 60); do
 if curl --silent --show-error --fail --max-time 3 --resolve "$HOST:$PORT:$IP" "$URL" >/dev/null 2>&1; then
   printf '\nEngine HTTPS and MeshWall static page reachable. Open %s\n' "$URL"
   printf 'Sign in with the MeshCentral account, then return to MeshWall. Verify enrollment and live desktop on an authorized test PC.\n'
   exit 0
 fi
 sleep 2
done
die "HTTPS readiness failed. Inspect: journalctl -u $SERVICE -n 80. No insecure TLS fallback is used."
