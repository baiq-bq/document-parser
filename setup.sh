#!/usr/bin/env bash
set -euo pipefail

# 1) Where to install
DENO_INSTALL="${HOME}/.deno"
BIN_DIR="$DENO_INSTALL/bin"
mkdir -p "$BIN_DIR"

# 2) Pick your version and platform
VERSION="v2.3.3"
ARCHIVE="deno-x86_64-unknown-linux-gnu.zip"
URL="https://github.com/denoland/deno/releases/download/${VERSION}/${ARCHIVE}"

# 3) Download & unpack
curl -fsSL "$URL" -o "/tmp/$ARCHIVE"
unzip -o "/tmp/$ARCHIVE" -d "$BIN_DIR"
rm "/tmp/$ARCHIVE"

# 4) Ensure your PATH knows about it (for future shells)
if ! grep -q 'export DENO_INSTALL' ~/.bashrc; then
  {
    echo
    echo '# Deno runtime'
    echo "export DENO_INSTALL=\"$HOME/.deno\""
    echo 'export PATH="$DENO_INSTALL/bin:$PATH"'
  } >> ~/.bashrc
fi

# 5) Activate in this session
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"

# 6) Verify
deno --version
