cd ~/personaplex-mvimalkrpal
git fetch --all
git reset --hard origin/main
git clean -fd
git pull

source ~/persona_env/bin/activate
PYTHONPATH=~/personaplex-mvimalkrpal/moshi uv run --python ~/persona_env/bin/python -m moshi.server --static ~/personaplex-mvimalkrpal/client/dist