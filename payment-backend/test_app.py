import importlib.util
from pathlib import Path


BACKEND_PATH = Path(__file__).resolve().parent / "app.py"
spec = importlib.util.spec_from_file_location("payment_backend_app", BACKEND_PATH)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def test_get_cors_origins_supports_multiple_frontends(monkeypatch):
    monkeypatch.setenv("FRONTEND_ORIGIN", "https://example.com, https://admin.example.com, http://localhost:5500")

    origins = module.get_allowed_frontend_origins()

    assert origins == [
        "https://example.com",
        "https://admin.example.com",
        "http://localhost:5500",
    ]
