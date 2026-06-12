import os
from dotenv import load_dotenv

load_dotenv()

# ─── Bot ───────────────────────────────────────────────────
BOT_TOKEN = os.getenv("BOT_TOKEN", "")
BOT_USERNAME = os.getenv("BOT_USERNAME", "")

# ─── Data Paths ────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

USERS_DIR = os.path.join(DATA_DIR, "users")
MESSAGES_DIR = os.path.join(DATA_DIR, "messages")
PROFILE_PHOTOS_DIR = os.path.join(DATA_DIR, "profile_photos")
MEDIA_DIR = os.path.join(DATA_DIR, "media")

LINKS_FILE = os.path.join(DATA_DIR, "links.json")
LINK_MAP_FILE = os.path.join(DATA_DIR, "link_map.json")
SENT_MESSAGES_FILE = os.path.join(DATA_DIR, "sent_messages.json")
SPECIAL_MESSAGES_FILE = os.path.join(DATA_DIR, "special_messages.json")
BOT_MESSAGES_FILE = os.path.join(DATA_DIR, "bot_messages.json")

# ─── Ensure dirs exist ─────────────────────────────────────
for _dir in [DATA_DIR, USERS_DIR, MESSAGES_DIR, PROFILE_PHOTOS_DIR, MEDIA_DIR]:
    os.makedirs(_dir, exist_ok=True)
