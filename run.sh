cd ~/personaplex-mvimalkrpal
git fetch --all
git reset --hard origin/main
git clean -fd
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


export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
uv pip install accelerate
uv run --python ~/persona_env/bin/python -m moshi.server --device cpu --cpu-offload