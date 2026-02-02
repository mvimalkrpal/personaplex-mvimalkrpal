#!/usr/bin/env bash
set -euo pipefail

apt update
apt install -y sudo
apt install -y nvi
sudo apt update
sudo apt install -y git
sudo apt install -y ffmpeg
sudo apt install -y libopus-dev
sudo apt install -y sox
sudo apt install -y ca-certificates
sudo apt install -y build-essential

curl -LsSf https://astral.sh/uv/install.sh | sh

uv python install 3.10
uv venv ~/persona_env --python 3.10
source ~/persona_env/bin/activate

if [[ -z "${HF_TOKEN:-}" ]]; then
  if [[ -t 0 ]]; then
    read -rsp "Enter HF_TOKEN: " HF_TOKEN
    echo
    export HF_TOKEN
  else
    echo "HF_TOKEN not set and no TTY available"
    exit 1
  fi
fi


cd ~/personaplex-mvimalkrpal
uv pip install ./moshi

python - << 'EOF'
import moshi
import moshi.server
print("moshi import OK")
EOF

cd ~/personaplex-mvimalkrpal
source ~/persona_env/bin/activate
