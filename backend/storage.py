"""
ماژول مدیریت ذخیره‌سازی داده‌ها در فایل JSON
"""
import json
import os
import asyncio
from datetime import datetime
from typing import Optional
import aiofiles

from config import USERS_DIR, MESSAGES_DIR, LINKS_FILE, PROFILE_PHOTOS_DIR


# ─────────────────────────────────────────────
#  مدیریت لینک‌ها
# ─────────────────────────────────────────────

def load_links() -> dict:
    """بارگذاری لینک‌های اختصاصی از فایل"""
    if not os.path.exists(LINKS_FILE):
        return {}
    try:
        with open(LINKS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}


def save_links(links: dict) -> None:
    """ذخیره لینک‌ها در فایل"""
    with open(LINKS_FILE, "w", encoding="utf-8") as f:
        json.dump(links, f, ensure_ascii=False, indent=2)


def create_link(name: str, label: str = "") -> dict:
    """
    ساخت یک لینک اختصاصی جدید
    name: شناسه یکتا (مثل mahdi, javad)
    label: برچسب نمایشی
    """
    links = load_links()
    if name in links:
        return {"error": f"لینک با نام '{name}' قبلاً وجود دارد"}
    
    links[name] = {
        "name": name,
        "label": label or name,
        "created_at": datetime.now().isoformat(),
        "click_count": 0,
        "visitors": []  # لیست user_id کسانی که روی این لینک کلیک کردن
    }
    save_links(links)
    return links[name]


def delete_link(name: str) -> bool:
    """حذف یک لینک"""
    links = load_links()
    if name not in links:
        return False
    del links[name]
    save_links(links)
    return True


def record_link_click(link_name: str, user_id: int) -> None:
    """ثبت کلیک روی لینک"""
    links = load_links()
    if link_name not in links:
        return
    links[link_name]["click_count"] += 1
    if user_id not in links[link_name]["visitors"]:
        links[link_name]["visitors"].append(user_id)
    save_links(links)


# ─────────────────────────────────────────────
#  مدیریت کاربران
# ─────────────────────────────────────────────

def get_user_file(user_id: int) -> str:
    return os.path.join(USERS_DIR, f"{user_id}.json")


def load_user(user_id: int) -> Optional[dict]:
    path = get_user_file(user_id)
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return None


def save_user(user_data: dict) -> None:
    user_id = user_data["id"]
    path = get_user_file(user_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(user_data, f, ensure_ascii=False, indent=2)


def upsert_user(bale_user: dict, source_link: str = "") -> dict:
    """
    ذخیره یا بروزرسانی اطلاعات کاربر
    bale_user: شیء User از API بله
    source_link: نام لینکی که کاربر از طریق آن اومده
    """
    user_id = bale_user["id"]
    existing = load_user(user_id)
    
    now = datetime.now().isoformat()
    
    if existing is None:
        user_record = {
            "id": user_id,
            "first_name": bale_user.get("first_name", ""),
            "last_name": bale_user.get("last_name", ""),
            "username": bale_user.get("username", ""),
            "is_bot": bale_user.get("is_bot", False),
            "first_seen": now,
            "last_seen": now,
            "profile_photo_path": "",
            "source_links": [source_link] if source_link else [],
            "message_count": 0
        }
    else:
        user_record = existing
        user_record["first_name"] = bale_user.get("first_name", existing.get("first_name", ""))
        user_record["last_name"] = bale_user.get("last_name", existing.get("last_name", ""))
        user_record["username"] = bale_user.get("username", existing.get("username", ""))
        user_record["last_seen"] = now
        
        # اضافه کردن لینک جدید اگر قبلاً نبوده
        if source_link and source_link not in user_record.get("source_links", []):
            user_record.setdefault("source_links", []).append(source_link)
    
    save_user(user_record)
    return user_record


def update_user_photo(user_id: int, photo_path: str) -> None:
    user = load_user(user_id)
    if user:
        user["profile_photo_path"] = photo_path
        save_user(user)


def load_all_users() -> list:
    users = []
    if not os.path.exists(USERS_DIR):
        return users
    for fname in os.listdir(USERS_DIR):
        if fname.endswith(".json"):
            try:
                with open(os.path.join(USERS_DIR, fname), "r", encoding="utf-8") as f:
                    users.append(json.load(f))
            except Exception:
                pass
    users.sort(key=lambda u: u.get("last_seen", ""), reverse=True)
    return users


# ─────────────────────────────────────────────
#  مدیریت پیام‌ها
# ─────────────────────────────────────────────

def get_messages_file(user_id: int) -> str:
    return os.path.join(MESSAGES_DIR, f"{user_id}.json")


def load_user_messages(user_id: int) -> list:
    path = get_messages_file(user_id)
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def save_message(user_id: int, message: dict) -> None:
    """ذخیره یک پیام جدید برای کاربر"""
    messages = load_user_messages(user_id)
    
    msg_record = {
        "message_id": message.get("message_id"),
        "text": message.get("text", ""),
        "date": datetime.fromtimestamp(message.get("date", 0)).isoformat(),
        "type": _get_message_type(message)
    }
    messages.append(msg_record)
    
    path = get_messages_file(user_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(messages, f, ensure_ascii=False, indent=2)
    
    # بروزرسانی تعداد پیام‌های کاربر
    user = load_user(user_id)
    if user:
        user["message_count"] = len(messages)
        user["last_seen"] = datetime.now().isoformat()
        save_user(user)


def _get_message_type(message: dict) -> str:
    if message.get("text"):
        return "text"
    elif message.get("photo"):
        return "photo"
    elif message.get("video"):
        return "video"
    elif message.get("audio"):
        return "audio"
    elif message.get("voice"):
        return "voice"
    elif message.get("document"):
        return "document"
    elif message.get("sticker"):
        return "sticker"
    elif message.get("contact"):
        return "contact"
    elif message.get("location"):
        return "location"
    else:
        return "other"


def load_all_messages() -> list:
    """بارگذاری تمام پیام‌های همه کاربران"""
    all_messages = []
    if not os.path.exists(MESSAGES_DIR):
        return all_messages
    for fname in os.listdir(MESSAGES_DIR):
        if fname.endswith(".json"):
            user_id = int(fname.replace(".json", ""))
            try:
                with open(os.path.join(MESSAGES_DIR, fname), "r", encoding="utf-8") as f:
                    msgs = json.load(f)
                    for m in msgs:
                        m["user_id"] = user_id
                    all_messages.extend(msgs)
            except Exception:
                pass
    all_messages.sort(key=lambda m: m.get("date", ""), reverse=True)
    return all_messages


# ─────────────────────────────────────────────
#  مدیریت متون ربات
# ─────────────────────────────────────────────

BOT_MESSAGES_FILE = os.path.join(os.path.dirname(LINKS_FILE), "bot_messages.json")

DEFAULT_BOT_MESSAGES = {
    "welcome_with_link": {
        "key": "welcome_with_link",
        "title": "خوشامدگویی (با لینک اختصاصی)",
        "description": "وقتی کاربر از طریق لینک اختصاصی وارد می‌شود",
        "variables": ["first_name", "source_link"],
        "text": "سلام {first_name} عزیز! 👋\n\nبه ربات خوش آمدید.\nاطلاعات شما با موفقیت ثبت شد ✅\n\nمی‌توانید پیام خود را بفرستید."
    },
    "welcome_direct": {
        "key": "welcome_direct",
        "title": "خوشامدگویی (ورود مستقیم)",
        "description": "وقتی کاربر مستقیم /start می‌زند",
        "variables": ["first_name"],
        "text": "سلام {first_name} عزیز! 👋\n\nبه ربات خوش آمدید.\nمی‌توانید پیام خود را بفرستید."
    },
    "message_received": {
        "key": "message_received",
        "title": "تأییدیه دریافت پیام",
        "description": "پاسخ ربات به هر پیام عادی کاربر",
        "variables": [],
        "text": "✅ پیام شما دریافت و ذخیره شد."
    }
}


def load_bot_messages() -> dict:
    """بارگذاری متون ربات از فایل (با مقادیر پیش‌فرض)"""
    if not os.path.exists(BOT_MESSAGES_FILE):
        return DEFAULT_BOT_MESSAGES.copy()
    try:
        with open(BOT_MESSAGES_FILE, "r", encoding="utf-8") as f:
            saved = json.load(f)
        # merge با پیش‌فرض‌ها تا اگر کلید جدیدی اضافه شد، از دست نره
        result = DEFAULT_BOT_MESSAGES.copy()
        for key, val in saved.items():
            if key in result:
                result[key]["text"] = val.get("text", result[key]["text"])
        return result
    except (json.JSONDecodeError, IOError):
        return DEFAULT_BOT_MESSAGES.copy()


def save_bot_messages(messages: dict) -> None:
    """ذخیره متون ربات در فایل"""
    os.makedirs(os.path.dirname(BOT_MESSAGES_FILE), exist_ok=True)
    with open(BOT_MESSAGES_FILE, "w", encoding="utf-8") as f:
        json.dump(messages, f, ensure_ascii=False, indent=2)


def get_bot_message(key: str, **kwargs) -> str:
    """دریافت متن یک پیام و جایگذاری متغیرها"""
    messages = load_bot_messages()
    if key not in messages:
        return ""
    text = messages[key]["text"]
    try:
        return text.format(**kwargs)
    except KeyError:
        return text


def update_bot_message(key: str, text: str) -> bool:
    """بروزرسانی متن یک پیام"""
    messages = load_bot_messages()
    if key not in messages:
        return False
    messages[key]["text"] = text
    save_bot_messages(messages)
    return True


def reset_bot_message(key: str) -> bool:
    """بازگشت به متن پیش‌فرض"""
    if key not in DEFAULT_BOT_MESSAGES:
        return False
    messages = load_bot_messages()
    messages[key]["text"] = DEFAULT_BOT_MESSAGES[key]["text"]
    save_bot_messages(messages)
    return True
