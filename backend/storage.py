"""
ماژول ذخیره‌سازی داده‌های دیتابیس
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
    """
    هر کاربر یک توکن اختصاصی UUID دارد.
    اگر قبلاً ساخته شده برمی‌گرداند، در غیر این صورت می‌سازد.
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

    # بروزرسانی تعداد پیام‌های کاربر
    user = load_user(user_id)
    if user:
        user["message_count"] = user.get("message_count", 0) + 1
        _save_json(_user_path(user_id), user)


def load_messages(user_id: int) -> list:
    return _load_json(_msg_path(user_id), [])


# ─────────────────────────────────────────────────────────
#  Sent Messages (پیام‌های ارسال شده از پنل)
# ─────────────────────────────────────────────────────────

def load_sent_messages() -> dict:
    return _load_json(SENT_MESSAGES_FILE, {})


def save_sent_messages(data: dict):
    _save_json(SENT_MESSAGES_FILE, data)


def add_sent_message(user_id: int, message_id: int, text: str) -> dict:
    sent = load_sent_messages()
    entry_id = str(uuid.uuid4())
    entry = {
        "id": entry_id,
        "user_id": user_id,
        "message_id": message_id,
        "text": text,
        "sent_at": _now(),
        "deleted": False,
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
        "title": "تأییدیه دریافت پیام",
        "description": "پاسخ ربات به هر پیام کاربران",
        "variables": [],
        "text": "پیامت دریافت شد 💬",
    },
    "notify_owner": {
        "key": "notify_owner",
        "title": "اطلاع‌رسانی به صاحب لینک",
        "description": "وقتی کسی روی لینک اختصاصی کاربری کلیک کند، این پیام برای صاحب لینک فرستاده می‌شود",
        "variables": ["visitor_name", "visitor_username"],
        "text": "👁️ {visitor_name} پروفایلت رو دید!",
    },
    "getlink_response": {
        "key": "getlink_response",
        "title": "پاسخ دستور /getlink",
        "description": "لینک اختصاصی کاربر. {link} = لینک، {first_name} = نام کاربر",
        "variables": ["first_name", "link"],
        "text": "لینک اختصاصی تو:\n`[ایجاد لینک]({link})`\n\nاین لینک رو با bio پروفایلت به اشتراک بذار! هر کس کلیک کنه بهت خبر می‌دم 🌟",
    },
}


def load_bot_messages() -> dict:
    data = _load_json(BOT_MESSAGES_FILE, {})
    # ادغام با پیش‌فرض‌ها (اگر کلید جدیدی اضافه شده)
    result = {}
    for key, default in DEFAULT_BOT_MESSAGES.items():
        if key in data:
            result[key] = data[key]
        else:
            result[key] = default
    return result


def save_bot_messages(data: dict):
    _save_json(BOT_MESSAGES_FILE, data)


def get_bot_message(key: str, **kwargs) -> str:
    """دریافت متن پیام ربات با جایگزینی متغیرها"""
    messages = load_bot_messages()
    msg = messages.get(key, {})
    text = msg.get("text", "")
    try:
        return text.format(**kwargs)
    except (KeyError, ValueError):
        return text


def update_bot_message(key: str, text: str) -> Optional[dict]:
    messages = load_bot_messages()
    if key not in messages:
        return None
    messages[key]["text"] = text
    save_bot_messages(messages)
    return messages[key]


def reset_bot_message(key: str) -> Optional[dict]:
    messages = load_bot_messages()
    if key not in DEFAULT_BOT_MESSAGES:
        return None
    messages[key] = DEFAULT_BOT_MESSAGES[key].copy()
    save_bot_messages(messages)
    return messages[key]


# ─────────────────────────────────────────────────────────
#  Special Messages
#  ساختار: { user_id: { key: text } }
# ─────────────────────────────────────────────────────────

def load_special_messages() -> dict:
    return _load_json(SPECIAL_MESSAGES_FILE, {})


def save_special_messages(data: dict):
    _save_json(SPECIAL_MESSAGES_FILE, data)


def set_special_message(user_id: int, key: str, text: str):
    """تنظیم پیام ویژه برای یک کاربر خاص"""
    data = load_special_messages()
    str_id = str(user_id)
    if str_id not in data:
        data[str_id] = {}
    data[str_id][key] = text
    save_special_messages(data)


def delete_special_message_entry(user_id: int, key: str) -> bool:
    data = load_special_messages()
    str_id = str(user_id)
    if str_id not in data or key not in data[str_id]:
        return False
    del data[str_id][key]
    if not data[str_id]:
        del data[str_id]
    save_special_messages(data)
    return True


def get_special_message(user_id: int, username: str, key: str, **kwargs) -> Optional[str]:
    """
    بررسی می‌کند آیا پیام ویژه‌ای برای این کاربر و این کلید تعریف شده.
    اگر بله، متن را با متغیرها برمی‌گرداند.
    """
    data = load_special_messages()
    str_id = str(user_id)
    
    # جستجو با user_id
    if str_id in data and key in data[str_id]:
        text = data[str_id][key]
        try:
            return text.format(**kwargs)
        except (KeyError, ValueError):
            return text
    
    return None


def get_all_special_messages_with_users() -> list:
    """دریافت تمام پیام‌های ویژه به همراه اطلاعات کاربران"""
    data = load_special_messages()
    result = []
    for str_id, messages in data.items():
        try:
            user_id = int(str_id)
        except ValueError:
            continue
        user = load_user(user_id)
        result.append({
            "user_id": user_id,
            "user": user,
            "messages": messages,
        })
    return result


# ─────────────────────────────────────────────────────────
#  Stats
# ─────────────────────────────────────────────────────────

def get_stats(bot_username: str = "", bot_token_set: bool = False) -> dict:
    users = load_all_users()
    links = load_links()
    link_map = load_link_map()
    sent = load_sent_messages()

    total_messages = sum(len(load_messages(u["id"])) for u in users)
    total_clicks = sum(info.get("click_count", 0) for info in links.values())

    return {
        "total_users": len(users),
        "total_links": len(links),
        "total_messages": total_messages,
        "total_clicks": total_clicks,
        "total_sent_messages": len(sent),
        "bot_username": bot_username,
        "bot_token_set": bot_token_set,
    }
