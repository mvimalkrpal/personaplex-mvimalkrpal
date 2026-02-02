cd ~/personaplex-mvimalkrpal
git pull
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
source ~/persona_env/bin/activate
python -m moshi.server