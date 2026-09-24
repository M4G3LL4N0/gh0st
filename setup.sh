#!/usr/bin/env bash
# gh0st setup script
# Usage: pnpm setup

set -e

echo "🔧 gh0st Setup"
echo "=============="
echo

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi
NODE_VERSION=$(node --version)
echo "✓ Node.js: $NODE_VERSION"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Installing..."
    npm install -g pnpm
fi
PNPM_VERSION=$(pnpm --version)
echo "✓ pnpm: $PNPM_VERSION"

# Check Rust (for native builds)
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    echo "✓ Rust: $RUST_VERSION"
else
    echo "⚠ Rust not found. Native builds (macOS/iOS) will not work."
    echo "   Install from https://rustup.rs/"
fi

# Check Xcode (for iOS builds)
if command -v xcodebuild &> /dev/null; then
    XCODE_VERSION=$(xcodebuild -version | head -1)
    echo "✓ Xcode: $XCODE_VERSION"
else
    echo "⚠ Xcode not found. iOS builds will not work."
    echo "   Install from App Store or https://developer.apple.com/xcode/"
fi

echo
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo
echo "🔨 Building all packages..."
pnpm build

echo
echo "✅ Build complete!"
echo
echo "🚀 Quick start:"
echo "  pnpm dev:client    # Start browser dev server"
echo "  pnpm dev:cli       # Run CLI in dev mode"
echo "  ./apps/cli/dist/cli.js doctor   # Run diagnostics"
echo "  ./apps/cli/dist/cli.js doctor --setup  # Interactive setup"
echo
echo "📚 Documentation: docs/"
echo "🐛 Issues: https://github.com/gh0st/gh0st/issues"