-include .env

# Set shell and options globally
SHELL := /bin/bash
.SHELLFLAGS := -euxo pipefail -c

CUR_DIR := $(shell pwd)

.SILENT:

.PHONY: help check install fresh-install dev web update-shadcn clean-cargo clean-pnpm

help:
	@echo "Available targets:"
	@echo ""
	@echo "Setup & Prerequisites:"
	@echo "  check                - Check if required tools are installed with correct versions"
	@echo "  install              - Install all dependencies"
	@echo "  fresh-install        - Clean install (remove node_modules and reinstall)"
	@echo ""
	@echo "Development:"
	@echo "  dev                  - Run all web services in development mode"
	@echo "  web                  - Run wallet app in development mode"
	@echo "  lint                 - Lint all codebases"
	@echo "  update-shadcn        - Update all shadcn components in packages/ui"
	@echo ""
	@echo "Cleanup:"
	@echo "  clean-cargo          - Clean Cargo build artifacts"
	@echo "  clean-pnpm           - Clean all node_modules and pnpm store"

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

web:
	pnpm run --filter=@polymeer/web dev

lint:
	pnpm turbo lint

update-shadcn:
	@cd packages/ui && components=$$(ls src/components/ui | grep -v 'index' | sed 's/\.tsx$$//'); \
	echo "Found components to update: $$components"; \
	echo $$components | xargs -n 1 -I {} bash -c 'echo "Updating {}..." && pnpm dlx shadcn@latest add {} -y -o'

clean-cargo:
	cd apps/wallet/src-tauri && cargo clean

clean-pnpm:
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf services/*/node_modules
	rm -rf packages/*/node_modules
