-include .env

# Set shell and options globally
SHELL := /bin/bash
.SHELLFLAGS := -euxo pipefail -c

CUR_DIR := $(shell pwd)

# Detect OS
UNAME_S := $(shell uname -s 2>/dev/null || echo Windows)
ifeq ($(UNAME_S),Darwin)
	DATA_DIR := $(HOME)/Library/Application Support/xyz.polymeer.wallet
else ifeq ($(UNAME_S),Linux)
	DATA_DIR := $(HOME)/.local/share/xyz.polymeer.wallet
else
	DATA_DIR := $(APPDATA)/xyz.polymeer.wallet
endif

.SILENT:

.PHONY: help check install fresh-install build-deps dev wallet generate-auth-schema generate-migrations migrate-local migrate-remote-dev migrate-remote-prod update-shadcn clean-cargo clean-pnpm clean-db clean-recordings download-go2rtc

help:
	@echo "Available targets:"
	@echo ""
	@echo "Setup & Prerequisites:"
	@echo "  check                - Check if required tools are installed with correct versions"
	@echo "  install              - Install all dependencies"
	@echo "  fresh-install        - Clean install (remove node_modules and reinstall)"
	@echo "  download-go2rtc      - Download go2rtc binaries for supported platforms"
	@echo ""
	@echo "Development:"
	@echo "  dev                  - Run all web services in development mode"
	@echo "  wallet              - Run wallet app in development mode"
	@echo "  lint                 - Lint all codebases"
	@echo "  update-shadcn        - Update all shadcn components in packages/ui"
	@echo "  cf-typegen           - Generate Cloudflare types for all services"
	@echo ""
	@echo "Database Management:"
	@echo "  generate-auth-schema - Generate Better Auth schema"
	@echo "  generate-migrations  - Generate Drizzle migrations"
	@echo "  migrate-local        - Apply migrations to local D1 database"
	@echo "  migrate-remote-dev   - Apply migrations to remote dev D1 database (polymeer-dev)"
	@echo "  migrate-remote-prod  - Apply migrations to remote prod D1 database (polymeer)"
	@echo ""
	@echo "Cleanup:"
	@echo "  clean-cargo          - Clean Cargo build artifacts"
	@echo "  clean-pnpm           - Clean all node_modules and pnpm store"
	@echo "  clean-db             - Remove local database directory"
	@echo "  clean-recordings     - Remove local recordings directory"

check:
	@command -v node >/dev/null 2>&1 || { echo "❌ Node.js is not installed. Please install Node.js v22+"; exit 1; }
	@NODE_VERSION=$$(node --version | sed 's/v//'); \
	NODE_MAJOR=$$(echo $$NODE_VERSION | cut -d. -f1); \
	if [ $$NODE_MAJOR -lt 22 ]; then \
		echo "❌ Node.js version $$NODE_VERSION is too old. Please install Node.js v22+"; \
		exit 1; \
	fi
	@command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is not installed. Please install pnpm v10+"; exit 1; }
	@PNPM_VERSION=$$(pnpm --version); \
	PNPM_MAJOR=$$(echo $$PNPM_VERSION | cut -d. -f1); \
	if [ $$PNPM_MAJOR -lt 10 ]; then \
		echo "❌ pnpm version $$PNPM_VERSION is too old. Please install pnpm v10+"; \
		exit 1; \
	fi
	@command -v rustc >/dev/null 2>&1 || { echo "❌ Rust is not installed. Please install Rust 1.75+"; exit 1; }
	@command -v cargo >/dev/null 2>&1 || { echo "❌ Cargo is not installed. Please install Cargo"; exit 1; }

install:
	pnpm install

fresh-install: clean-pnpm
	rm -rf pnpm-lock.yaml
	pnpm install
	@echo "✅ Fresh install completed"

dev:
	pnpm turbo dev

wallet:
	cd apps/wallet && pnpm tauri dev

lint:
	pnpm turbo lint

update-shadcn:
	@cd packages/ui && components=$$(ls src/components/ui | grep -v 'index' | sed 's/\.tsx$$//'); \
	echo "Found components to update: $$components"; \
	echo $$components | xargs -n 1 -I {} bash -c 'echo "Updating {}..." && pnpm dlx shadcn@latest add {} -y -o'

cf-typegen:
	pnpm run --filter=@polymeer/* cf-typegen

generate-auth-schema:
	cd packages/db && pnpm dlx auth@latest generate --config ./src/better-auth.config.ts --output ./src/auth-schema.ts

generate-migrations:
	cd packages/db && pnpm drizzle-kit generate

migrate-local:
	cd services/api && pnpm wrangler d1 migrations apply polymeer-dev --local

migrate-remote-dev:
	cd services/api && pnpm wrangler d1 migrations apply polymeer-dev --remote

migrate-remote-prod:
	cd services/api && pnpm wrangler d1 migrations apply polymeer --remote --env=production

clean-cargo:
	cd apps/wallet/src-tauri && cargo clean

clean-pnpm:
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf services/*/node_modules
	rm -rf packages/*/node_modules

clean-db:
	@echo "⚠️  This will delete the local database at: $(DATA_DIR)/db"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		rm -rf "$(DATA_DIR)/db"; \
		echo "✅ Database directory removed"; \
	else \
		echo "❌ Cancelled"; \
	fi

clean-recordings:
	@echo "⚠️  This will delete all local recordings at: $(DATA_DIR)/recordings"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		rm -rf "$(DATA_DIR)/recordings"; \
		echo "✅ Recordings directory removed"; \
	else \
		echo "❌ Cancelled"; \
	fi

BINARIES_DIR := apps/wallet/src-tauri/binaries

download-go2rtc:
	$(eval GO2RTC_VERSION := $(shell curl -s https://api.github.com/repos/AlexxIT/go2rtc/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/'))
	@echo "Downloading go2rtc $(GO2RTC_VERSION)..."
	@mkdir -p $(BINARIES_DIR)
	# Linux x86_64
	curl -L https://github.com/AlexxIT/go2rtc/releases/download/$(GO2RTC_VERSION)/go2rtc_linux_amd64 -o $(BINARIES_DIR)/go2rtc-x86_64-unknown-linux-gnu
	chmod +x $(BINARIES_DIR)/go2rtc-x86_64-unknown-linux-gnu
# 	# macOS Intel
# 	curl -L https://github.com/AlexxIT/go2rtc/releases/download/$(GO2RTC_VERSION)/go2rtc_mac_amd64.zip -o $(BINARIES_DIR)/go2rtc_mac_amd64.zip
# 	unzip -o $(BINARIES_DIR)/go2rtc_mac_amd64.zip -d $(BINARIES_DIR)
# 	mv $(BINARIES_DIR)/go2rtc $(BINARIES_DIR)/go2rtc-x86_64-apple-darwin || mv $(BINARIES_DIR)/go2rtc_mac_amd64 $(BINARIES_DIR)/go2rtc-x86_64-apple-darwin
# 	rm $(BINARIES_DIR)/go2rtc_mac_amd64.zip
# 	chmod +x $(BINARIES_DIR)/go2rtc-x86_64-apple-darwin
	# macOS ARM64
	curl -L https://github.com/AlexxIT/go2rtc/releases/download/$(GO2RTC_VERSION)/go2rtc_mac_arm64.zip -o $(BINARIES_DIR)/go2rtc_mac_arm64.zip
	unzip -o $(BINARIES_DIR)/go2rtc_mac_arm64.zip -d $(BINARIES_DIR)
	mv $(BINARIES_DIR)/go2rtc $(BINARIES_DIR)/go2rtc-aarch64-apple-darwin || mv $(BINARIES_DIR)/go2rtc_mac_arm64 $(BINARIES_DIR)/go2rtc-aarch64-apple-darwin
	rm $(BINARIES_DIR)/go2rtc_mac_arm64.zip
	chmod +x $(BINARIES_DIR)/go2rtc-aarch64-apple-darwin
	# Windows x86_64
	curl -L https://github.com/AlexxIT/go2rtc/releases/download/$(GO2RTC_VERSION)/go2rtc_win64.zip -o $(BINARIES_DIR)/go2rtc_win64.zip
	unzip -o $(BINARIES_DIR)/go2rtc_win64.zip -d $(BINARIES_DIR)
	mv $(BINARIES_DIR)/go2rtc.exe $(BINARIES_DIR)/go2rtc-x86_64-pc-windows-msvc.exe || mv $(BINARIES_DIR)/go2rtc_win64.exe $(BINARIES_DIR)/go2rtc-x86_64-pc-windows-msvc.exe
	rm $(BINARIES_DIR)/go2rtc_win64.zip
	@echo "✅ go2rtc binaries downloaded"
