"""
ماژول پردازش پیام‌های ربات
"""
import asyncio
from typing import Optional

import bale_api
import storage
from config import BOT_USERNAME


async def handle_update(update: dict) -> None:
    """پردازش یک آپدیت دریافتی از بله"""
    message = update.get("message")
    
    if message:
        await handle_message(message)


async def handle_message(message: dict) -> None:
    """پردازش پیام دریافتی"""
    from_user = message.get("from")
    if not from_user:
        return
    
    user_id = from_user["id"]
    text = message.get("text", "")
    
    # بررسی دستور /start
    if text.startswith("/start"):
        await handle_start(message, from_user, text)
    else:
        # ذخیره پیام عادی
        await handle_regular_message(message, from_user)


async def handle_start(message: dict, from_user: dict, text: str) -> None:
    """
    پردازش دستور /start
    اگر پارامتر داشته باشد (deep link) اون رو هم ذخیره می‌کنیم
    """
    user_id = from_user["id"]
    
    # استخراج پارامتر از /start PAYLOAD
    parts = text.strip().split(maxsplit=1)
    source_link = parts[1].strip() if len(parts) > 1 else ""
    
    # ذخیره / بروزرسانی کاربر
    user_record = storage.upsert_user(from_user, source_link=source_link)
    
    # ثبت کلیک روی لینک
    if source_link:
        storage.record_link_click(source_link, user_id)
    
    # دانلود عکس پروفایل در پس‌زمینه
    asyncio.create_task(_download_and_save_photo(user_id))
    
    # ساخت نام نمایشی
    first_name = from_user.get("first_name", "")
    
    # ارسال پیام خوشامدگویی (از متون داینامیک)
    if source_link:
        welcome_text = storage.get_bot_message(
            "welcome_with_link",
            first_name=first_name,
            source_link=source_link
        )
    else:
        welcome_text = storage.get_bot_message(
            "welcome_direct",
            first_name=first_name
        )
    
    await bale_api.send_message(user_id, welcome_text)
    
    # ذخیره پیام /start هم در لیست پیام‌ها
    storage.save_message(user_id, message)
    
    print(f"[BOT] /start | user={user_id} | link={source_link or '(direct)'}")


async def handle_regular_message(message: dict, from_user: dict) -> None:
    """پردازش پیام عادی (غیر از /start)"""
    user_id = from_user["id"]
    text = message.get("text", "")
    
    # اگر کاربر قبلاً ثبت نشده، الان ثبتش کن
    existing = storage.load_user(user_id)
    if existing is None:
        storage.upsert_user(from_user)
        asyncio.create_task(_download_and_save_photo(user_id))
    else:
        # فقط last_seen رو بروز کن
        storage.upsert_user(from_user)
    
    # ذخیره پیام
    storage.save_message(user_id, message)
    
    # پاسخ تأییدیه (از متون داینامیک)
    if text:
        reply = storage.get_bot_message("message_received")
        await bale_api.send_message(user_id, reply)
    
    print(f"[BOT] message | user={user_id} | type={storage._get_message_type(message)}")


async def _download_and_save_photo(user_id: int) -> None:
    """دانلود عکس پروفایل و ذخیره مسیرش"""
    photo_path = await bale_api.download_profile_photo(user_id)
    if photo_path:
        storage.update_user_photo(user_id, photo_path)
        print(f"[BOT] photo saved | user={user_id} | path={photo_path}")
    else:
        print(f"[BOT] no photo | user={user_id}")
