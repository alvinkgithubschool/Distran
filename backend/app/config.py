"""Server-only configuration. Never return Settings or secret values in responses."""
from dataclasses import dataclass, field
import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_ROOT / '.env', override=False)

@dataclass(frozen=True)
class Settings:
    tmdb_token: str = field(default_factory=lambda: os.getenv('TMDB_READ_TOKEN', ''), repr=False)
    twitch_id: str = field(default_factory=lambda: os.getenv('TWITCH_CLIENT_ID', ''), repr=False)
    twitch_secret: str = field(default_factory=lambda: os.getenv('TWITCH_CLIENT_SECRET', ''), repr=False)
    openrouter_key: str = field(default_factory=lambda: os.getenv('OPENROUTER_API_KEY', ''), repr=False)
    buddy_enabled: bool = field(default_factory=lambda: os.getenv('BUDDY_ENABLED', 'false').lower() == 'true')
    cache_path: str = field(default_factory=lambda: os.getenv('CATALOG_CACHE_PATH') or str(BACKEND_ROOT / 'data/catalog.sqlite3'))
    origins: tuple[str, ...] = ('http://127.0.0.1:1420', 'http://localhost:1420', 'tauri://localhost', 'http://tauri.localhost', 'https://tauri.localhost')
