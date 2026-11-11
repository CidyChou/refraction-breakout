SSH_TARGET ?= tc
REMOTE_DIR ?= /data/work/client/refraction-breakout
NGINX_CONF ?= /etc/nginx/conf.d/refraction-breakout.conf
REMOTE_PORT ?= 8916
PUBLIC_URL ?= http://106.55.78.71:$(REMOTE_PORT)/
GAME_HOST ?= 0.0.0.0
GAME_PORT ?= 8099


SG_HOST ?= sg
SG_SSH ?= ssh
SG_NAME := refraction-breakout
SG_RELEASES := /srv/h5/releases/$(SG_NAME)
SG_CURRENT := /srv/h5/current/$(SG_NAME)
SG_URL := https://h5.cidychou.com/$(SG_NAME)/

.DEFAULT_GOAL := help

.PHONY: help dev up_106 sg

help: ## 显示全部 Make 命令和说明
	@echo "折射突围 开发命令"
	@echo "用法：make <命令>"
	@awk 'BEGIN { FS = ":.*##" } /^[a-zA-Z0-9_-]+:.*##/ { printf "  %-12s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

dev: ## 启动本地静态服务器（默认端口 8099）
	@echo ""
	@echo "折射突围 — 本地服务"
	@echo "  端口: $(GAME_PORT)  绑定: $(GAME_HOST)"
	@echo ""
	@echo "可点击打开："
	@echo "  http://127.0.0.1:$(GAME_PORT)/"
	@echo "  http://localhost:$(GAME_PORT)/"
	@ifconfig 2>/dev/null | awk -v p="$(GAME_PORT)" '/inet / && $$2 != "127.0.0.1" { printf "  http://%s:%s/\n", $$2, p }' \
		|| ip -4 -o addr show 2>/dev/null | awk -v p="$(GAME_PORT)" '{ split($$4, a, "/"); if (a[1] != "127.0.0.1") printf "  http://%s:%s/\n", a[1], p }' \
		|| true
	@echo ""
	@echo "按 Ctrl+C 停止服务"
	@echo ""
	python3 -m http.server "$(GAME_PORT)" --bind "$(GAME_HOST)"

up_106: ## 部署到 106 正式服（端口 8916）
	SSH_TARGET="$(SSH_TARGET)" \
	REMOTE_DIR="$(REMOTE_DIR)" \
	NGINX_CONF="$(NGINX_CONF)" \
	REMOTE_PORT="$(REMOTE_PORT)" \
	PUBLIC_URL="$(PUBLIC_URL)" \
	./tools/deploy_106.sh

sg: ## 部署到新加坡（https://h5.cidychou.com/refraction-breakout/）
	@set -eu; \
	work=$$(mktemp -d); \
	trap 'rm -rf "$$work"' EXIT; \
	mkdir "$$work/site"; \
	cp -R index.html styles.css src "$$work/site/"; \
	find "$$work/site" \( -name '.DS_Store' -o -name '._*' -o -name '*.map' \) -delete; \
	python3 tools/sg_stamp.py "$$work/site"; \
	test -s "$$work/site/styles.css"; \
	test -s "$$work/site/src/main.js"; \
	grep -q '?v=' "$$work/site/index.html"; \
	COPYFILE_DISABLE=1 tar --no-xattrs -czf "$$work/site.tar.gz" -C "$$work/site" .; \
	$(SG_SSH) -T "$(SG_HOST)" 'set -eu; \
		sudo -n mkdir -p "$(SG_RELEASES)"; \
		release=$$(sudo -n mktemp -d "$(SG_RELEASES)/$$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX"); \
		sudo -n tar -xzf - --no-same-owner -C "$$release"; \
		sudo -n chmod -R u=rwX,go=rX "$$release"; \
		test -s "$$release/index.html"; \
		test -s "$$release/styles.css"; \
		test -s "$$release/src/main.js"; \
		test -s "$$release/src/game.js"; \
		sudo -n ln -s "$$release" "$$release/.current"; \
		sudo -n mv -Tf "$$release/.current" "$(SG_CURRENT)"' < "$$work/site.tar.gz"; \
	printf '已部署 %s\n' "$(SG_URL)"
