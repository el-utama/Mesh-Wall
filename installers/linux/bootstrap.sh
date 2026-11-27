#!/usr/bin/env bash
# Prepare a fresh supported Armbian/Debian/Ubuntu ARM64 or x64 host.
# Run from a reviewed checkout, with sudo and an interactive terminal.
set -euo pipefail
umask 022
die(){ printf 'ERROR: %s\n' "$*" >&2; exit 1; }
[[ $EUID -eq 0 && -t 0 && -t 1 ]] || die "Run in an interactive terminal with sudo."
[[ $# -eq 0 ]] || die "No arguments accepted."
SRC="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
[[ -f "$SRC/installers/linux/setup.mjs" ]] || die "Run from a trusted repository checkout."
[[ ! -e /opt/meshwall && ! -e /etc/systemd/system/meshwall-engine.service ]] || die "Existing or partial install; use maintenance, not bootstrap."
[[ -d /run/systemd/system ]] || die "systemd required."
command -v apt-get >/dev/null || die "APT required."
case "$(uname -m)" in aarch64) ARCH=arm64;; x86_64) ARCH=x64;; *) die "Only 64-bit ARM or x86 systems supported.";; esac
[[ "$(getconf LONG_BIT)" == 64 ]] || die "64-bit userspace required, not just a 64-bit kernel."
# /etc/os-release is system-owned; do not read arbitrary user-supplied paths.
. /etc/os-release
case "${ID:-}:${VERSION_CODENAME:-}" in
 debian:bullseye|debian:bookworm|debian:trixie) DIST=debian; CODENAME=$VERSION_CODENAME;;
 ubuntu:jammy|ubuntu:noble|ubuntu:resolute) DIST=ubuntu; CODENAME=$VERSION_CODENAME;;
 *) die "Unsupported base distribution: ${ID:-unknown} ${VERSION_CODENAME:-unknown}. Install prerequisites manually.";;
esac
[[ $(df -Pk /opt | awk 'NR==2 {print $4}') -ge 1048576 ]] || die "At least 1 GiB free under /opt required for setup."
printf 'Base OS: %s %s · architecture %s\n' "$DIST" "$CODENAME" "$ARCH"
printf 'This prepares system packages, installs a verified Node.js release if required, installs the official Tailscale package if missing, and opens the local setup wizard. No public ingress or tailnet ACL changes.\n'
read -r -p "Proceed on this authorized test host? [y/N] " answer
[[ $answer == y || $answer == Y ]] || exit 1
apt-get update
apt-get install -y ca-certificates curl openssl xz-utils tar iproute2 util-linux passwd coreutils
export PATH=/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
TMP="$(mktemp -d)"
trap 'rm -rf -- "$TMP"' EXIT
download(){ curl --proto '=https' --tlsv1.2 --fail --silent --show-error --location --retry 2 --max-time 180 "$1" --output "$2"; }
node_ok(){ command -v node >/dev/null && command -v npm >/dev/null && node -e 'const [a,b,c]=process.versions.node.split(".").map(Number);process.exit(["arm64","x64"].includes(process.arch)&&(a>22||(a===22&&(b>21||(b===21&&c>=1))))?0:1'; }
if ! node_ok; then
 VERSION=v22.23.5
 ARTIFACT="node-$VERSION-linux-$ARCH.tar.xz"
 TARGET="/opt/meshwall-runtime/node-$VERSION-linux-$ARCH"
 [[ ! -e /usr/local/bin/node && ! -L /usr/local/bin/node && ! -e /usr/local/bin/npm && ! -L /usr/local/bin/npm ]] || die "Existing /usr/local/bin Node/npm conflict; resolve manually."
 [[ ! -e /opt/meshwall-runtime && ! -L /opt/meshwall-runtime ]] || die "Existing runtime directory; inspect before proceeding."
 download "https://nodejs.org/dist/$VERSION/SHASUMS256.txt" "$TMP/SHASUMS256.txt"
 download "https://nodejs.org/dist/$VERSION/$ARTIFACT" "$TMP/$ARTIFACT"
 awk -v f="$ARTIFACT" '$2==f && length($1)==64 && $1 ~ /^[a-fA-F0-9]+$/ {print $1 "  " f}' "$TMP/SHASUMS256.txt" > "$TMP/checksum"
 [[ $(wc -l < "$TMP/checksum") -eq 1 ]] || die "Official checksum entry missing or ambiguous."
 (cd "$TMP" && sha256sum -c checksum)
 tar -xJf "$TMP/$ARTIFACT" -C "$TMP" --no-same-owner
 mkdir -m 0755 /opt/meshwall-runtime
 mv "$TMP/node-$VERSION-linux-$ARCH" "$TARGET"
 chown -R root:root "$TARGET"
 ln -s "$TARGET/bin/node" /usr/local/bin/node
 ln -s "$TARGET/bin/npm" /usr/local/bin/npm
 hash -r
fi
node_ok || die "Compatible Node/npm unavailable."
if ! command -v tailscale >/dev/null; then
 KEY=/usr/share/keyrings/tailscale-archive-keyring.gpg
 LIST=/etc/apt/sources.list.d/tailscale.list
 [[ ! -e "$KEY" && ! -L "$KEY" && ! -e "$LIST" && ! -L "$LIST" ]] || die "Existing Tailscale APT config; review and install manually."
 download "https://pkgs.tailscale.com/stable/$DIST/$CODENAME.noarmor.gpg" "$TMP/tailscale.gpg"
 download "https://pkgs.tailscale.com/stable/$DIST/$CODENAME.tailscale-keyring.list" "$TMP/tailscale.list"
 grep -Fxq "deb [signed-by=$KEY] https://pkgs.tailscale.com/stable/$DIST $CODENAME main" "$TMP/tailscale.list" || die "Unexpected repository configuration."
 [[ $(grep -cvE '^[[:space:]]*(#|$)' "$TMP/tailscale.list") -eq 1 ]] || die "Unexpected extra APT sources."
 install -m 0644 "$TMP/tailscale.gpg" "$KEY"
 install -m 0644 "$TMP/tailscale.list" "$LIST"
 apt-get update
 apt-get install -y tailscale
fi
systemctl enable --now tailscaled
if ! tailscale status --json | node -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{try{process.exit(JSON.parse(s).BackendState==="Running"?0:1)}catch{process.exit(1)}})'; then
 printf 'Complete Tailscale login in the browser using the official URL printed below.\n'
 tailscale up
fi
printf 'Enable MagicDNS and HTTPS certificates in your Tailscale admin console before completing the wizard.\n'
rm -rf -- "$TMP"; trap - EXIT
exec node "$SRC/installers/linux/setup.mjs"
