import json
import os
import tempfile

import pytest

from config_loader import get_config, load_config


@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    for key in list(os.environ):
        if key.startswith("APP_"):
            monkeypatch.delenv(key, raising=False)


def _write_config(tmp_path, data):
    path = tmp_path / "config.json"
    path.write_text(json.dumps(data))
    return str(path)


def test_defaults_when_file_missing(tmp_path):
    cfg = load_config(str(tmp_path / "nope.json"))
    assert cfg == {"host": "localhost", "port": 8080, "timeout_ms": 5000, "debug": False}


def test_file_overrides_defaults(tmp_path):
    path = _write_config(tmp_path, {"host": "trader-1", "port": 9000, "debug": True})
    cfg = load_config(path)
    assert cfg["host"] == "trader-1"
    assert cfg["port"] == 9000
    assert cfg["debug"] is True


def test_env_var_overrides_default_but_not_file(tmp_path, monkeypatch):
    monkeypatch.setenv("APP_HOST", "from-env")
    path = _write_config(tmp_path, {"host": "from-file"})
    cfg = load_config(path)
    assert cfg["host"] == "from-file"


def test_invalid_port_rejected(tmp_path):
    path = _write_config(tmp_path, {"port": 99999})
    with pytest.raises(ValueError):
        load_config(path)


def test_get_config_returns_last_loaded(tmp_path):
    path = _write_config(tmp_path, {"host": "abc"})
    load_config(path)
    assert get_config()["host"] == "abc"
