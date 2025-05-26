#!/usr/bin/env bash
set -e

echo 'export DENO_INSTALL="$HOME/.deno"' >> ~/.bashrc
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Install Deno
# Using the official install script from Deno's website
curl -fsSL https://deno.land/install.sh | sh


