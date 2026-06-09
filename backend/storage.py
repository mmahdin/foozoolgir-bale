"""
ماژول ذخیره‌سازی داده‌های دیتابیس
✨ CHANGE: پارامتر source به add_sent_message اضافه شد
"""
import json
import os
import uuid
from datetime import datetime
from typing import Optional

from config import (
    USERS_DIR, MESSAGES_DIR, LINKS_FILE, PROFILE_PHOTOS_DIR,
    LINK_MAP_FILE, SENT_MESSAGES_FILE, SPECIAL_MESSAGES_FILE,
    BOT_MESSAGES_FILE
)


# ─────────────────────────────────────────────────────────
#  Helper
# ─────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.utcnow().isoformat()


def _load_json(path: str, default):
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def _save_json(path: str, data):
    os.makedirs(os.path.dirname(path), exist_ok=True) if os.path.dirname(path) else None
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ─────────────────────────────────────────────────────────
#  Link Map  (token → user_id)
# ─────────────────────────────────────────────────────────

def load_link_map() -> dict:
    return _load_json(LINK_MAP_FILE, {})


def save_link_map(data: dict):
    _save_json(LINK_MAP_FILE, data)


def get_or_create_user_token(user_id: int, first_name: str = "") -> str:
    link_map = load_link_map()
    str_id = str(user_id)
    for token, uid in link_map.items():
        if uid == str_id:
            return token
    token = str(uuid.uuid4()).replace("-", "")[:20]
    link_map[token] = str_id
    save_link_map(link_map)
    return token


def get_user_id_by_token(token: str) -> Optional[int]:
    link_map = load_link_map()
    val = link_map.get(token)
    if val is not None:
        return int(val)
    return None


# ─────────────────────────────────────────────────────────
#  Links  (name-based public links)
# ─────────────────────────────────────────────────────────

def load_links() -> dict:
    return _load_json(LINKS_FILE, {})


def save_links(data: dict):
    _save_json(LINKS_FILE, data)


def create_link(name: str, label: str = "") -> dict:
    links = load_links()
    if name in links:
        return {"error": f"لینک '{name}' قبلاً وجود دارد"}
    links[name] = {
        "name": name,
        "label": label or name,
        "created_at": _now(),
        "click_count": 0,
        "visitors": [],
    }
    save_links(links)
    return links[name]


def delete_link(name: str) -> bool:
    links = load_links()
    if name not in links:
        return False
    del links[name]
    save_links(links)
    return True


def record_link_click(link_name: str, user_id: int):
    links = load_links()
    if link_name not in links:
        return
    links[link_name]["click_count"] = links[link_name].get("click_count", 0) + 1
    visitors = links[link_name].get("visitors", [])
    if user_id not in visitors:
        visitors.append(user_id)
    links[link_name]["visitors"] = visitors
    save_links(links)


# ─────────────────────────────────────────────────────────
#  Users
# ─────────────────────────────────────────────────────────

def _user_path(user_id: int) -> str:
    return os.path.join(USERS_DIR, f"{user_id}.json")


def load_user(user_id: int) -> Optional[dict]:
    return _load_json(_user_path(user_id), None)


def upsert_user(from_user: dict, source_link: str = "") -> dict:
    user_id = from_user["id"]
    existing = load_user(user_id) or {}

    first_name = from_user.get("first_name", "")
    last_name = from_user.get("last_name", "")
    username = from_user.get("username", "")

    source_links = existing.get("source_links", [])
    if source_link and source_link not in source_links:
        source_links.append(source_link)

    record = {
        "id": user_id,
        "first_name": first_name,
        "last_name": last_name,
        "username": username,
        "is_bot": from_user.get("is_bot", False),
        "first_seen": existing.get("first_seen", _now()),
        "last_seen": _now(),
        "profile_photo_path": existing.get("profile_photo_path", ""),
        "source_links": source_links,
        "message_count": existing.get("message_count", 0),
    }
    os.makedirs(USERS_DIR, exist_ok=True)
    _save_json(_user_path(user_id), record)
    return record


def update_user_photo(user_id: int, photo_path: str):
    user = load_user(user_id)
    if user:
        user["profile_photo_path"] = photo_path
        _save_json(_user_path(user_id), user)


def load_all_users() -> list:
    users = []
    if not os.path.exists(USERS_DIR):
        return users
    for fname in os.listdir(USERS_DIR):
        if fname.endswith(".json"):
            path = os.path.join(USERS_DIR, fname)
            data = _load_json(path, None)
            if data:
                users.append(data)
    users.sort(key=lambda u: u.get("last_seen", ""), reverse=True)
    return users


# ─────────────────────────────────────────────────────────
#  Messages
# ─────────────────────────────────────────────────────────

def _msg_path(user_id: int) -> str:
    return os.path.join(MESSAGES_DIR, f"{user_id}.json")


def save_message(user_id: int, message: dict):
    os.makedirs(MESSAGES_DIR, exist_ok=True)
    messages = _load_json(_msg_path(user_id), [])
    messages.append({
        "message_id": message.get("message_id", 0),
        "text": message.get("text", ""),
        "date": _now(),
        "type": "received",
    })
    _save_json(_msg_path(user_id), messages)

    user = load_user(user_id)
    if user:
        user["message_count"] = user.get("message_count", 0) + 1
        _save_json(_user_path(user_id), user)


def load_messages(user_id: int) -> list:
    return _load_json(_msg_path(user_id), [])


# ─────────────────────────────────────────────────────────
#  Sent Messages (پیام‌های ارسال شده از پنل + ربات)
# ─────────────────────────────────────────────────────────

def load_sent_messages() -> dict:
    return _load_json(SENT_MESSAGES_FILE, {})


def save_sent_messages(data: dict):
    _save_json(SENT_MESSAGES_FILE, data)


def add_sent_message(user_id: int, message_id: int, text: str, source: str = "panel") -> dict:
    """
    ذخیره پیام ارسال شده
    ✨ CHANGE: پارامتر source اضافه شد — "panel" برای پیام‌های پنل، "bot" برای پیام‌های خودکار ربات
    """
    sent = load_sent_messages()
    entry_id = str(uuid.uuid4())
    entry = {
        "id": entry_id,
        "user_id": user_id,
        "message_id": message_id,
        "text": text,
        "sent_at": _now(),
        "deleted": False,
        "source": source,  # ✨ NEW: "panel" or "bot"
    }
    sent[entry_id] = entry
    save_sent_messages(sent)
    return entry


def mark_sent_message_deleted(entry_id: str) -> bool:
    sent = load_sent_messages()
    if entry_id not in sent:
        return False
    sent[entry_id]["deleted"] = True
    save_sent_messages(sent)
    return True


def get_user_sent_messages(user_id: int) -> list:
    sent = load_sent_messages()
    result = [v for v in sent.values() if v.get("user_id") == user_id]
    result.sort(key=lambda m: m.get("sent_at", ""))
    return result


# ─────────────────────────────────────────────────────────
#  Bot Messages (متون پیش‌فرض ربات)
# ─────────────────────────────────────────────────────────

DEFAULT_BOT_MESSAGES = {
    "welcome_with_link": {
        "key": "welcome_with_link",
        "title": "خوش‌آمدگویی (با کلیک روی لینک)",
        "description": "وقتی کاربری روی لینک اختصاصی شخص دیگری کلیک می‌کند",
        "variables": ["first_name", "owner_name", "source_link"],
        "text": "به {owner_name} می‌گم که می‌خواستی پروفایلش رو چک کنی 👀",
    },
    "welcome_direct": {
        "key": "welcome_direct",
        "title": "خوش‌آمدگویی (ورود مستقیم)",
        "description": "وقتی کاربری مستقیماً /start می‌زند",
        "variables": ["first_name"],
        "text": "👋 سلام {first_name}! به ربات خوش آمدی.",
    },
    "message_received": {
        "key": "message_received",
        "title": "دریافت پیام",
        "description": "وقتی کاربر پیام عادی می‌فرستد",
        "variables": [],
        "text": "✅ پیامت دریافت شد!",
    },
    "notify_owner": {
        "key": "notify_owner",
        "title": "اطلاع‌رسانی به صاحب لینک",
        "description": "وقتی کسی روی لینک اختصاصی کلیک کند، به صاحب لینک اطلاع داده می‌شود",
        "variables": ["visitor_name", "visitor_username"],
        "text": "🔔 {visitor_name} ({visitor_username}) پروفایلت رو چک کرد!",
    },
    "getlink_response": {
        "key": "getlink_response",
        "title": "پاسخ /getlink",
        "description": "وقتی کاربر /getlink می‌زند",
        "variables": ["first_name", "link"],
        "text": "🔗 سلام {first_name}! لینک اختصاصی تو:\n\n{link}\n\nاین لینک رو به کسی بده که میخوای پروفایلت رو ببینه 👀",
    },
}


def load_bot_messages() -> dict:
    saved = _load_json(BOT_MESSAGES_FILE, {})
    # Merge with defaults (saved takes priority)
    merged = {**DEFAULT_BOT_MESSAGES}
    for key, val in saved.items():
        if key in merged:
            merged[key]["text"] = val.get("text", merged[key]["text"])
    return merged


def save_bot_message(key: str, text: str) -> dict:
    saved = _load_json(BOT_MESSAGES_FILE, {})
    saved[key] = {"text": text}
    _save_json(BOT_MESSAGES_FILE, saved)
    messages = load_bot_messages()
    return messages.get(key, {})


def reset_bot_message(key: str) -> dict:
    saved = _load_json(BOT_MESSAGES_FILE, {})
    if key in saved:
        del saved[key]
        _save_json(BOT_MESSAGES_FILE, saved)
    messages = load_bot_messages()
    return messages.get(key, {})


def get_bot_message(key: str, **kwargs) -> str:
    messages = load_bot_messages()
    msg = messages.get(key, {})
    text = msg.get("text", "")
    for k, v in kwargs.items():
        text = text.replace(f"{{{k}}}", str(v))
    return text


# ─────────────────────────────────────────────────────────
#  Special Messages (پیام‌های سفارشی هر کاربر)
# ─────────────────────────────────────────────────────────

def load_special_messages() -> dict:
    return _load_json(SPECIAL_MESSAGES_FILE, {})


def save_special_messages(data: dict):
    _save_json(SPECIAL_MESSAGES_FILE, data)


def get_special_message(user_id: int, username: str, key: str, **kwargs) -> Optional[str]:
    special = load_special_messages()
    user_key = str(user_id)
    if user_key in special and key in special[user_key]:
        text = special[user_key][key]
        for k, v in kwargs.items():
            text = text.replace(f"{{{k}}}", str(v))
        return text
    return None


def set_special_message(user_id: int, key: str, text: str):
    special = load_special_messages()
    user_key = str(user_id)
    if user_key not in special:
        special[user_key] = {}
    special[user_key][key] = text
    save_special_messages(special)


def delete_special_message(user_id: int, key: str) -> bool:
    special = load_special_messages()
    user_key = str(user_id)
    if user_key in special and key in special[user_key]:
        del special[user_key][key]
        if not special[user_key]:
            del special[user_key]
        save_special_messages(special)
        return True
    return False


def load_all_special_messages() -> list:
    special = load_special_messages()
    entries = []
    for user_id_str, messages in special.items():
        user = load_user(int(user_id_str))
        entries.append({
            "user_id": int(user_id_str),
            "user": user,
            "messages": messages,
        })
    return entries
