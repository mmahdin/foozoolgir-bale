import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
BOT_USERNAME = os.getenv("BOT_USERNAME", "")
PORT = int(os.getenv("PORT", "8000"))
BALE_API_URL = f"https://tapi.bale.ai/bot{BOT_TOKEN}"
BALE_FILE_URL = f"https://tapi.bale.ai/file/bot{BOT_TOKEN}"

# پوشه‌های ذخیره‌سازی
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
USERS_DIR = os.path.join(DATA_DIR, "users")
MESSAGES_DIR = os.path.join(DATA_DIR, "messages")
LINKS_FILE = os.path.join(DATA_DIR, "links.json")
PROFILE_PHOTOS_DIR = os.path.join(DATA_DIR, "profile_photos")

# ساخت پوشه‌ها در صورت نبودن
for directory in [DATA_DIR, USERS_DIR, MESSAGES_DIR, PROFILE_PHOTOS_DIR]:
    os.makedirs(directory, exist_ok=True)
