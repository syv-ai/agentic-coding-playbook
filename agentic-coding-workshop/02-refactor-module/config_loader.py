import json
import os

_LOADED_CONFIG = {}


def load_config(path):
    if path is None:
        path = os.environ.get("APP_CONFIG", "./config.json")

    if not os.path.exists(path):
        raw = {}
    else:
        with open(path) as f:
            raw = json.load(f)

    cfg = {}

    if "host" in raw:
        cfg["host"] = str(raw["host"])
    elif os.environ.get("APP_HOST"):
        cfg["host"] = os.environ["APP_HOST"]
    else:
        cfg["host"] = "localhost"

    if "port" in raw:
        try:
            cfg["port"] = int(raw["port"])
        except (TypeError, ValueError):
            raise ValueError(f"port must be an integer, got {raw['port']!r}")
    elif os.environ.get("APP_PORT"):
        cfg["port"] = int(os.environ["APP_PORT"])
    else:
        cfg["port"] = 8080

    if not (1 <= cfg["port"] <= 65535):
        raise ValueError(f"port out of range: {cfg['port']}")

    if "timeout_ms" in raw:
        cfg["timeout_ms"] = int(raw["timeout_ms"])
    elif os.environ.get("APP_TIMEOUT_MS"):
        cfg["timeout_ms"] = int(os.environ["APP_TIMEOUT_MS"])
    else:
        cfg["timeout_ms"] = 5000

    if cfg["timeout_ms"] < 0:
        raise ValueError("timeout_ms must be >= 0")

    if "debug" in raw:
        cfg["debug"] = bool(raw["debug"])
    elif os.environ.get("APP_DEBUG"):
        cfg["debug"] = os.environ["APP_DEBUG"].lower() in ("1", "true", "yes")
    else:
        cfg["debug"] = False

    _LOADED_CONFIG.clear()
    _LOADED_CONFIG.update(cfg)

    return cfg


def get_config():
    return _LOADED_CONFIG
