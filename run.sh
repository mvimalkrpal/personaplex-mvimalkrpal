cd ~/personaplex-mvimalkrpal
git fetch --all
git reset --hard origin/main
git clean -fd
git pull

export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
source ~/persona_env/bin/activate
uv pip install accelerate
PYTHONPATH=~/personaplex-mvimalkrpal/moshi uv run --python ~/persona_env/bin/python -m moshi.server --device cpu --cpu-offload