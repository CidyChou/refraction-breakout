#!/bin/bash
set -e
cd "$(dirname "$0")"

PORT="${1:-8099}"
REQUESTED_PORT="$PORT"
LAN_IP=""

port_free() {
  python3 - "$1" <<'PYPORT' >/dev/null 2>&1
import socket, sys
port=int(sys.argv[1])
s=socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(("0.0.0.0", port))
except OSError:
    raise SystemExit(1)
finally:
    s.close()
PYPORT
}

if ! port_free "$PORT"; then
  CANDIDATE=$((PORT+1))
  LIMIT=$((PORT+20))
  while [ "$CANDIDATE" -le "$LIMIT" ]; do
    if port_free "$CANDIDATE"; then
      PORT="$CANDIDATE"
      break
    fi
    CANDIDATE=$((CANDIDATE+1))
  done
fi

if ! port_free "$PORT"; then
  echo "没有找到可用端口，请手动执行: ./start.sh 9000"
  exit 1
fi

# macOS: Wi-Fi is usually en0, but try a few interfaces.
if command -v ipconfig >/dev/null 2>&1; then
  for IFACE in en0 en1 en2; do
    CANDIDATE="$(ipconfig getifaddr "$IFACE" 2>/dev/null || true)"
    if [ -n "$CANDIDATE" ]; then
      LAN_IP="$CANDIDATE"
      break
    fi
  done
fi

# Linux fallback.
if [ -z "$LAN_IP" ] && command -v hostname >/dev/null 2>&1; then
  LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
fi

# Last fallback using routing information.
if [ -z "$LAN_IP" ] && command -v ip >/dev/null 2>&1; then
  LAN_IP="$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}')"
fi

printf '\n=============================================\n'
printf '  折射突围 · Local Test Server\n'
printf '=============================================\n'
if [ "$PORT" != "$REQUESTED_PORT" ]; then
  printf '  端口 %s 已占用，已自动切换到 %s\n' "$REQUESTED_PORT" "$PORT"
fi
printf '  本机打开:  http://127.0.0.1:%s/\n' "$PORT"
if [ -n "$LAN_IP" ]; then
  printf '  局域网打开: http://%s:%s/\n' "$LAN_IP" "$PORT"
  printf '  手机/其他电脑与本机同一 Wi-Fi 时可直接打开上面的地址。\n'
else
  printf '  局域网 IP: 未自动识别，可运行 ifconfig 查看。\n'
fi
printf '  停止服务:  Ctrl + C\n'
printf '=============================================\n\n'

python3 -m http.server "$PORT" --bind 0.0.0.0
