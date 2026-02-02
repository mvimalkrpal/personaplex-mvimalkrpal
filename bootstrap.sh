#!/usr/bin/env bash
set -euo pipefail

apt update
apt install -y sudo
apt install -y nvi
sudo apt update
sudo apt install -y ffmpeg
sudo apt install -y libopus-dev
sudo apt install -y sox
sudo apt install -y ca-certificates
sudo apt install -y build-essential

uv python install 3.10
uv venv ~/persona_env --python 3.10
source ~/persona_env/bin/activate

cd ~/personaplex-mvimalkrpal
uv pip install ./moshi

python - << 'EOF'
import moshi
import moshi.server
print("moshi import OK")
EOF

deactivate