#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SSH_TARGET="${SSH_TARGET:-tc}"
REMOTE_DIR="${REMOTE_DIR:-/data/work/client/refraction-breakout}"
NGINX_CONF="${NGINX_CONF:-/etc/nginx/conf.d/refraction-breakout.conf}"
PUBLIC_URL="${PUBLIC_URL:-http://106.55.78.71:8916/}"
REMOTE_PORT="${REMOTE_PORT:-8916}"

required_paths=(
	"index.html"
	"styles.css"
	"src/main.js"
	"src/game.js"
	"src/renderer.js"
)

for required_path in "${required_paths[@]}"; do
	if [[ ! -f "$PROJECT_DIR/$required_path" ]]; then
		echo "Missing deploy file: $required_path" >&2
		exit 1
	fi
done

echo "Uploading game to $SSH_TARGET:$REMOTE_DIR ..."
COPYFILE_DISABLE=1 tar -C "$PROJECT_DIR" --no-xattrs --exclude='._*' -cf - index.html styles.css src | ssh "$SSH_TARGET" "
	set -euo pipefail
	TARGET='$REMOTE_DIR'
	TMP=\"\${TARGET}.deploy.\$\$\"
	PREV=\"\${TARGET}.previous\"
	trap 'rm -rf \"\$TMP\"' EXIT
	rm -rf \"\$TMP\"
	mkdir -p \"\$TMP\"
	tar -C \"\$TMP\" -xf -
	find \"\$TMP\" -type d -exec chmod 0755 {} +
	find \"\$TMP\" -type f -exec chmod 0644 {} +
	test -f \"\$TMP/index.html\"
	test -f \"\$TMP/styles.css\"
	test -f \"\$TMP/src/main.js\"
	rm -rf \"\$PREV\"
	if [[ -d \"\$TARGET\" ]]; then
		mv \"\$TARGET\" \"\$PREV\"
	fi
	mv \"\$TMP\" \"\$TARGET\"
"

echo "Ensuring Nginx serves 折射突围 on port $REMOTE_PORT ..."
ssh "$SSH_TARGET" \
	"NGINX_CONF='$NGINX_CONF' REMOTE_DIR='$REMOTE_DIR' REMOTE_PORT='$REMOTE_PORT' bash -s" <<'REMOTE_SCRIPT'
set -euo pipefail

tmp_conf="$(mktemp)"
backup_conf=""
cleanup() {
	rm -f "$tmp_conf"
}
trap cleanup EXIT

cat >"$tmp_conf" <<NGINX
server {
    listen $REMOTE_PORT;
    listen [::]:$REMOTE_PORT;
    server_name _;

    root $REMOTE_DIR;
    index index.html;

    location / {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /index.html;
    }

    location /src/ {
        add_header Cache-Control "no-cache";
        types { application/javascript js; }
        try_files \$uri =404;
    }
}
NGINX

if [[ ! -f "$NGINX_CONF" ]] || ! cmp -s "$tmp_conf" "$NGINX_CONF"; then
	if [[ -f "$NGINX_CONF" ]]; then
		backup_conf="${NGINX_CONF}.deploy-backup"
		cp "$NGINX_CONF" "$backup_conf"
	fi

	install -m 0644 "$tmp_conf" "$NGINX_CONF"
	if ! nginx -t; then
		if [[ -n "$backup_conf" ]]; then
			mv "$backup_conf" "$NGINX_CONF"
		else
			rm -f "$NGINX_CONF"
		fi
		exit 1
	fi

	rm -f "$backup_conf"
	nginx -s reload
fi

if command -v firewall-cmd >/dev/null 2>&1 && firewall-cmd --state >/dev/null 2>&1; then
	if ! firewall-cmd --quiet --query-port="$REMOTE_PORT"/tcp; then
		firewall-cmd --quiet --permanent --add-port="$REMOTE_PORT"/tcp
		firewall-cmd --quiet --reload
	fi
fi
REMOTE_SCRIPT

echo "Verifying deployed game ..."
ssh "$SSH_TARGET" \
	"curl -fsS --retry 5 --retry-delay 1 --connect-timeout 8 http://127.0.0.1:$REMOTE_PORT/" \
	| grep -Fq '<canvas id="game"'
ssh "$SSH_TARGET" \
	"curl -fsS --retry 5 --retry-delay 1 --connect-timeout 8 http://127.0.0.1:$REMOTE_PORT/styles.css" \
	>/dev/null
ssh "$SSH_TARGET" \
	"curl -fsS --retry 5 --retry-delay 1 --connect-timeout 8 http://127.0.0.1:$REMOTE_PORT/src/main.js" \
	>/dev/null

echo "Deployed $PUBLIC_URL"
