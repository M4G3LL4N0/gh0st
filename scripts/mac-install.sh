#!/usr/bin/env bash
# gh0st macOS local install script
# Installs the built gh0st.app to ~/Applications or /Applications

set -e

# Resolve app path relative to script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_PATH="$REPO_ROOT/apps/client/src-tauri/target/release/bundle/macos/gh0st.app"
INSTALL_DIR="${1:-$HOME/Applications}"

echo "📦 gh0st macOS Installer"
echo "========================"
echo

if [ ! -d "$APP_PATH" ]; then
    echo "❌ App not found at $APP_PATH"
    echo "Run 'pnpm mac:build' first"
    exit 1
fi

mkdir -p "$INSTALL_DIR"

DEST_PATH="$INSTALL_DIR/gh0st.app"

if [ -d "$DEST_PATH" ]; then
    echo "⚠️  gh0st.app already exists at $DEST_PATH"
    read -p "Overwrite? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
    rm -rf "$DEST_PATH"
fi

echo "📦 Installing gh0st.app to $INSTALL_DIR..."
cp -R "$APP_PATH" "$DEST_PATH"

echo "✅ Installed to $DEST_PATH"
echo
echo "🚀 Launch with: open '$DEST_PATH'"
echo "🔐 First run will prompt for xAI API key"
echo