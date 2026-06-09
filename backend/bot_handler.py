"""
ماژول پردازش پیام‌های ربات
"""
import asyncio
import logging
from typing import Optional

import bale_api
import storage
from config import BOT_USERNAME

logger = logging.getLogger(__name__)


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

    if text.startswith("/start"):
        await handle_start(message, from_user, text)
    elif text.strip() == "/getlink":
        await handle_getlink(message, from_user)
    else:
        await handle_regular_message(message, from_user)


async def handle_start(message: dict, from_user: dict, text: str) -> None:
    """
    پردازش دستور /start
    اگر پارامتر داشته باشد (deep link) اون رو هم ذخیره می‌کنیم
    """
    user_id = from_user["id"]
    first_name = from_user.get("first_name", "")
    username = from_user.get("username", "")

    # استخراج پارامتر از /start PAYLOAD
    parts = text.strip().split(maxsplit=1)
    source_token = parts[1].strip() if len(parts) > 1 else ""

    # بررسی می‌کنیم که آیا source_token یک توکن شخصی است
    # یا یک نام لینک عادی
    owner_user_id = None
    if source_token:
        owner_user_id = storage.get_user_id_by_token(source_token)

    # اگر توکن شخصی بود، source_link را به نام لینک عادی تبدیل می‌کنیم
    # در غیر این صورت، source_token همان نام لینک عادی است
    source_link = source_token

    # ذخیره / بروزرسانی کاربر
    user_record = storage.upsert_user(from_user, source_link=source_link)

    # ثبت کلیک روی لینک (فقط برای لینک‌های عادی که در سیستم ثبت شده‌اند)
    if source_link and owner_user_id is None:
        storage.record_link_click(source_link, user_id)

    # دانلود عکس پروفایل در پس‌زمینه
    asyncio.create_task(_download_and_save_photo(user_id))

    # ─── ارسال پیام به بازدیدکننده ───
    if source_token and owner_user_id is not None:
        # کاربر از طریق لینک شخصی کسی آمده
        owner = storage.load_user(owner_user_id)
        owner_name = owner.get("first_name", "صاحب لینک") if owner else "صاحب لینک"
        owner_username = owner.get("username", "") if owner else ""

        # بررسی پیام سفارشی برای صاحب لینک
        custom = storage.get_special_message(
            owner_user_id, owner_username, "welcome_with_link",
            first_name=first_name, owner_name=owner_name, source_link=source_token
        )
        if custom:
            welcome_text = custom
        else:
            welcome_text = storage.get_bot_message(
                "welcome_with_link",
                first_name=first_name,
                source_link=source_token,
                owner_name=owner_name
            )

        await bale_api.send_message(user_id, welcome_text)

        # اطلاع‌رسانی به صاحب لینک (اگر خودش نباشد)
        if owner_user_id != user_id:
            visitor_name = first_name
            visitor_username = f"@{username}" if username else "(بدون یوزرنیم)"

            # بررسی پیام سفارشی برای اطلاع‌رسانی
            notify_custom = storage.get_special_message(
                owner_user_id, owner_username, "notify_owner",
                visitor_name=visitor_name, visitor_username=visitor_username
            )
            notify_text = notify_custom or storage.get_bot_message(
                "notify_owner",
                visitor_name=visitor_name,
                visitor_username=visitor_username
            )
            await bale_api.send_message(owner_user_id, notify_text)

    elif source_link:
        # لینک عادی (نه توکن شخصی)
        welcome_text = storage.get_bot_message(
            "welcome_with_link",
            first_name=first_name,
            source_link=source_link,
            owner_name=source_link
        )
        await bale_api.send_message(user_id, welcome_text)
    else:
        # ورود مستقیم
        welcome_text = storage.get_bot_message(
            "welcome_direct",
            first_name=first_name
        )
        await bale_api.send_message(user_id, welcome_text)

    # ذخیره پیام /start در لیست پیام‌ها
    storage.save_message(user_id, message)

    logger.info(f"[BOT] /start | user={user_id} | token={source_token or '(direct)'}")


async def handle_getlink(message: dict, from_user: dict) -> None:
    """
    دستور /getlink - ساخت لینک اختصاصی برای کاربر
    از آی‌دی پرایوت (UUID) استفاده می‌کند که قابل حدس نباشد
    """
    user_id = from_user["id"]
    first_name = from_user.get("first_name", "")

    # ذخیره / بروزرسانی کاربر
    storage.upsert_user(from_user)
    asyncio.create_task(_download_and_save_photo(user_id))

    # دریافت یا ساخت توکن اختصاصی
    token = storage.get_or_create_user_token(user_id, first_name)

    # ساخت لینک
    link = f"https://ble.ir/{BOT_USERNAME}?start={token}" if BOT_USERNAME else f"https://ble.ir/BOT_USERNAME?start={token}"

    response_text = storage.get_bot_message(
        "getlink_response",
        first_name=first_name,
        link=link
    )
    await bale_api.send_message(user_id, response_text)

    storage.save_message(user_id, message)
    logger.info(f"[BOT] /getlink | user={user_id} | token={token}")


async def handle_regular_message(message: dict, from_user: dict) -> None:
    """پردازش پیام عادی (غیر از /start و /getlink)"""
    user_id = from_user["id"]
    username = from_user.get("username", "")
    text = message.get("text", "")

    existing = storage.load_user(user_id)
    if existing is None:
        storage.upsert_user(from_user)
        asyncio.create_task(_download_and_save_photo(user_id))
    else:
        storage.upsert_user(from_user)

    storage.save_message(user_id, message)

    if text:
        # بررسی پیام سفارشی برای کاربر
        custom = storage.get_special_message(
            user_id, username, "message_received"
        )
        reply = custom or storage.get_bot_message("message_received")
        await bale_api.send_message(user_id, reply)

    logger.info(f"[BOT] message | user={user_id} | type={storage._get_message_type(message)}")


async def _download_and_save_photo(user_id: int) -> None:
    """دانلود عکس پروفایل و ذخیره مسیرش"""
    photo_path = await bale_api.download_profile_photo(user_id)
    if photo_path:
        storage.update_user_photo(user_id, photo_path)
        logger.info(f"[BOT] photo saved | user={user_id} | path={photo_path}")
    else:
        logger.info(f"[BOT] no photo | user={user_id}")
