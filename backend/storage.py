"""
ماژول ذخیره‌سازی داده‌ها
"""
import json
import os
import uuid
from datetime import datetime
from typing import Optional

from config import (
    USERS_DIR, MESSAGES_DIR, LINKS_FILE, PROFILE_PHOTOS_DIR,
    LINK_MAP_FILE, SENT_MESSAGES_FILE
)


# ─────────────────────────────────────────────
#  Helper
# ─────────────────────────────────────────────

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
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ─────────────────────────────────────────────
#  Link Map  (token → user_id)
# ─────────────────────────────────────────────

def load_link_map() -> dict:
    return _load_json(LINK_MAP_FILE, {})


def save_link_map(data: dict):
    _save_json(LINK_MAP_FILE, data)


def get_or_create_user_token(user_id: int, first_name: str = "") -> str:
    """
    هر کاربر یک توکن اختصاصی دارد.
    اگر قبلاً ساخته نشده، یک UUID جدید می‌سازیم.
    """
    link_map = load_link_map()
    str_id = str(user_id)
    for token, uid in link_map.items():
        if uid == str_id:
            return token
    # ساخت توکن جدید
    token = str(uuid.uuid4()).replace("-", "")[:20]
    link_map[token] = str_id
    save_link_map(link_map)
    return token


def get_user_id_by_token(token: str) -> Optional[int]:
    """پیدا کردن user_id با استفاده از توکن"""
    link_map = load_link_map()
    val = link_map.get(token)
    if val is not None:
        return int(val)
    return None


# ─────────────────────────────────────────────
#  Links
# ─────────────────────────────────────────────

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
    """ثبت کلیک روی لینک"""
    links = load_links()
    if link_name not in links:
        return
    links[link_name]["click_count"] = links[link_name].get("click_count", 0) + 1
    visitors = links[link_name].get("visitors", [])
    if user_id not in visitors:
        visitors.append(user_id)
    links[link_name]["visitors"] = visitors
    save_links(links)


# ─────────────────────────────────────────────
#  Users
# ─────────────────────────────────────────────

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


# ─────────────────────────────────────────────
#  Messages (from users to bot)
# ─────────────────────────────────────────────

def _messages_path(user_id: int) -> str:
    return os.path.join(MESSAGES_DIR, f"{user_id}.json")


def _get_message_type(message: dict) -> str:
    for t in ["text", "photo", "video", "audio", "voice", "document", "sticker", "contact", "location"]:
        if t in message:
            return t
    return "other"


def save_message(user_id: int, message: dict):
    msgs = _load_json(_messages_path(user_id), [])
    entry = {
        "message_id": message.get("message_id"),
        "text": message.get("text", ""),
        "date": datetime.utcfromtimestamp(message.get("date", 0)).isoformat() if message.get("date") else _now(),
        "type": _get_message_type(message),
        "user_id": user_id,
    }
    msgs.append(entry)
    _save_json(_messages_path(user_id), msgs)

    # بروزرسانی تعداد پیام‌های کاربر
    user = load_user(user_id)
    if user:
        user["message_count"] = len(msgs)
        _save_json(_user_path(user_id), user)


def load_user_messages(user_id: int) -> list:
    return _load_json(_messages_path(user_id), [])


def load_all_messages() -> list:
    all_msgs = []
    users = load_all_users()
    user_map = {u["id"]: u for u in users}
    if not os.path.exists(MESSAGES_DIR):
        return all_msgs
    for fname in os.listdir(MESSAGES_DIR):
        if fname.endswith(".json"):
            uid = int(fname.replace(".json", ""))
            msgs = _load_json(os.path.join(MESSAGES_DIR, fname), [])
            for m in msgs:
                all_msgs.append({**m, "user": user_map.get(uid)})
    all_msgs.sort(key=lambda m: m.get("date", ""), reverse=True)
    return all_msgs


# ─────────────────────────────────────────────
#  Sent Messages (from panel to users)
# ─────────────────────────────────────────────

def load_sent_messages() -> list:
    return _load_json(SENT_MESSAGES_FILE, [])


def save_sent_message(user_id: int, message_id: int, text: str) -> dict:
    msgs = load_sent_messages()
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "message_id": message_id,
        "text": text,
        "sent_at": _now(),
        "deleted": False,
    }
    msgs.append(entry)
    _save_json(SENT_MESSAGES_FILE, msgs)
    return entry


def mark_sent_message_deleted(entry_id: str) -> bool:
    msgs = load_sent_messages()
    for m in msgs:
        if m["id"] == entry_id:
            m["deleted"] = True
            _save_json(SENT_MESSAGES_FILE, msgs)
            return True
    return False


def get_sent_message(entry_id: str) -> Optional[dict]:
    for m in load_sent_messages():
        if m["id"] == entry_id:
            return m
    return None


# ─────────────────────────────────────────────
#  Bot Messages (dynamic texts)
# ─────────────────────────────────────────────

BOT_MESSAGES_FILE = os.path.join(os.path.dirname(__file__), "data", "bot_messages.json")

DEFAULT_BOT_MESSAGES = {
    "welcome_with_link": {
        "key": "welcome_with_link",
        "title": "خوشامدگویی (با لینک اختصاصی)",
        "description": "وقتی کاربر از طریق لینک اختصاصی وارد می‌شود. {owner_name} = نام صاحب لینک",
        "variables": ["first_name", "source_link", "owner_name"],
        "text": "به {owner_name} میگم که پروفایلش رو چک کردی😆\nدیگه چی میخوای بهش بگی؟"
    },
    "welcome_direct": {
        "key": "welcome_direct",
        "title": "خوشامدگویی (ورود مستقیم)",
        "description": "وقتی کاربر مستقیم /start می‌زند",
        "variables": ["first_name"],
        "text": "👻"
    },
    "message_received": {
        "key": "message_received",
        "title": "تأییدیه دریافت پیام",
        "description": "پاسخ ربات به هر پیام عادی کاربر",
        "variables": [],
        "text": "باشه به مهدی میگم🤝"
    },
    "notify_owner": {
        "key": "notify_owner",
        "title": "اطلاع‌رسانی به صاحب لینک",
        "description": "وقتی کسی روی لینک شخصی کاربر کلیک می‌کند، این پیام برای صاحب لینک فرستاده می‌شود",
        "variables": ["visitor_name", "visitor_username"],
        "text": "👀 {visitor_name} پروفایل شما را دید!"
    },
    "getlink_response": {
        "key": "getlink_response",
        "title": "پاسخ دستور /getlink",
        "description": "لینک اختصاصی کاربر. {link} = لینک، {first_name} = نام کاربر",
        "variables": ["first_name", "link"],
        "text": "لینک اختصاصی شما:\n{link}\n\nاین لینک رو توی بایو پروفایلت بذار! هر کسی که روش کلیک کنه بهت اطلاع میدم 😎"
    }
}


def load_bot_messages() -> dict:
    data = _load_json(BOT_MESSAGES_FILE, {})
    # اضافه کردن متون پیش‌فرض که ممکنه جدید باشن
    updated = False
    for key, val in DEFAULT_BOT_MESSAGES.items():
        if key not in data:
            data[key] = val
            updated = True
    if updated:
        _save_json(BOT_MESSAGES_FILE, data)
    return data


def update_bot_message(key: str, text: str) -> bool:
    data = load_bot_messages()
    if key not in data:
        return False
    data[key]["text"] = text
    _save_json(BOT_MESSAGES_FILE, data)
    return True


def reset_bot_message(key: str) -> Optional[dict]:
    data = load_bot_messages()
    if key not in data or key not in DEFAULT_BOT_MESSAGES:
        return None
    data[key]["text"] = DEFAULT_BOT_MESSAGES[key]["text"]
    _save_json(BOT_MESSAGES_FILE, data)
    return data[key]


def get_bot_message(key: str, **kwargs) -> str:
    data = load_bot_messages()
    template = data.get(key, {}).get("text", "")
    try:
        return template.format(**kwargs)
    except Exception:
        return template


# ─────────────────────────────────────────────
#  Special User Messages (e.g. mahdi)
# ─────────────────────────────────────────────

SPECIAL_MESSAGES_FILE = os.path.join(os.path.dirname(__file__), "data", "special_messages.json")


def load_special_messages() -> dict:
    """
    ساختار: { "user_id_or_username": { "key": "متن سفارشی" } }
    """
    return _load_json(SPECIAL_MESSAGES_FILE, {})


def set_special_message(identifier: str, key: str, text: str):
    data = load_special_messages()
    if identifier not in data:
        data[identifier] = {}
    data[identifier][key] = text
    _save_json(SPECIAL_MESSAGES_FILE, data)


def get_special_message(user_id: int, username: str, key: str, **kwargs) -> Optional[str]:
    """
    اگر کاربر متن سفارشی داشت برمی‌گردونه، وگرنه None
    """
    data = load_special_messages()
    for identifier in [str(user_id), username]:
        if identifier and identifier in data:
            template = data[identifier].get(key)
            if template:
                try:
                    return template.format(**kwargs)
                except Exception:
                    return template
    return None
