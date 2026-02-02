cd ~/personaplex-mvimalkrpal
git pull
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

uv run --python ~/persona_env/bin/python -m moshi.server