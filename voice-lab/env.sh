# Keeps every download inside this folder, on the same drive as the kit.
export LAB="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export HF_HOME=$LAB/cache/hf TORCH_HOME=$LAB/cache/torch UV_CACHE_DIR=$LAB/cache/uv
export UV_PYTHON_INSTALL_DIR=$LAB/cache/python PIP_CACHE_DIR=$LAB/cache/pip
export HF_HUB_DISABLE_SYMLINKS_WARNING=1 PYTHONUTF8=1
[ -d "$HOME/scoop/shims" ] && export PATH="$HOME/scoop/shims:$PATH"
export HF_TOKEN_PATH="$HOME/.cache/huggingface/token"
