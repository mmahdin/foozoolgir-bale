"""
ماژول پردازش پیام‌های ربات
⚠️ این فایل نسخه اصلاح‌شده است — تغییرات نسبت به نسخه اصلی با کامنت # FIX مشخص شده‌اند
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
    اگر پارامتر داشته باشد (deep link) یعنی کاربر روی لینک اختصاصی کسی کلیک کرده
    """
    user_id = from_user["id"]
    first_name = from_user.get("first_name", "")
    username = from_user.get("username", "")

    # استخراج پارامتر پس از /start PAYLOAD
    parts = text.strip().split(maxsplit=1)
    source_token = parts[1].strip() if len(parts) > 1 else ""

    # بررسی می‌کنیم آیا source_token یک توکن لینک اختصاصی است
    # یا اینکه یک نام لینک عمومی است
    owner_user_id = None
    if source_token:
        owner_user_id = storage.get_user_id_by_token(source_token)

    # ذخیره / بروزرسانی کاربران در دیتابیس
    source_link = source_token
    user_record = storage.upsert_user(from_user, source_link=source_link)

    # ثبت کلیک روی لینک (فقط برای لینک‌های عمومی که owner ندارند)
    if source_link and owner_user_id is None:
        storage.record_link_click(source_link, user_id)

    # دانلود عکس پروفایل در پس‌زمینه
    asyncio.create_task(_download_and_save_photo(user_id))

    # ─── ارسال پیام به کاربر بر اساس source_token ───
    if source_token and owner_user_id is not None:
        # کاربر روی لینک اختصاصی یک نفر دیگر کلیک کرده
        owner = storage.load_user(owner_user_id)
        # owner_name = first_name صاحب لینک (کسی که لینکش کلیک شده)
        owner_name = owner.get("first_name", "صاحب لینک") if owner else "صاحب لینک"
        owner_username = owner.get("username", "") if owner else ""

        # ═══════════════════════════════════════════════════════
        # FIX: first_name باید اسم صاحب لینک باشد (کسی که لینکش کلیک شده)
        # قبلاً اشتباهاً از first_name بازدیدکننده استفاده می‌شد
        # ═══════════════════════════════════════════════════════
        target_first_name = owner_name  # FIX: قبلاً بود: first_name

        # بررسی پیام ویژه سفارشی برای این کاربر
        custom = storage.get_special_message(
            owner_user_id, owner_username, "welcome_with_link",
            first_name=target_first_name, owner_name=owner_name, source_link=source_token  # FIX
        )
        if custom:
            welcome_text = custom
        else:
            welcome_text = storage.get_bot_message(
                "welcome_with_link",
                first_name=target_first_name,  # FIX: قبلاً بود: first_name=first_name
                source_link=source_token,
                owner_name=owner_name
            )

        await bale_api.send_message(user_id, welcome_text)

        # اطلاع‌رسانی به صاحب لینک (اگر خودش نباشد)
        if owner_user_id != user_id:
            visitor_name = first_name
            visitor_username = f"@{username}" if username else "(بدون یوزرنیم)"

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
        # لینک عمومی (name-based link) - بدون owner
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

    # ذخیره پیام /start در لیست پیام‌های کاربر
    storage.save_message(user_id, message)

    logger.info(f"[BOT] /start | user={user_id} | token={source_token or '(direct)'}")


async def handle_getlink(message: dict, from_user: dict) -> None:
    """
    دستور /getlink - ساخت لینک اختصاصی برای کاربر
    به هر کاربر یک توکن UUID منحصربه‌فرد می‌دهد و لینک ساخته می‌شود
    """
    user_id = from_user["id"]
    first_name = from_user.get("first_name", "")

    # ذخیره / بروزرسانی کاربران
    storage.upsert_user(from_user)
    asyncio.create_task(_download_and_save_photo(user_id))

    # دریافت یا ایجاد توکن اختصاصی
    token = storage.get_or_create_user_token(user_id, first_name)

    # ساخت deep link
    if BOT_USERNAME:
        deep_link = f"https://ble.ir/{BOT_USERNAME}?start={token}"
    else:
        deep_link = f"ble.ir/BOT_USERNAME?start={token}"

    # ساخت متن پاسخ
    custom = storage.get_special_message(
        user_id, from_user.get("username", ""), "getlink_response",
        first_name=first_name, link=deep_link
    )
    response_text = custom or storage.get_bot_message(
        "getlink_response",
        first_name=first_name,
        link=deep_link
    )

    await bale_api.send_message(user_id, response_text)

    # ذخیره پیام
    storage.save_message(user_id, message)

    logger.info(f"[BOT] /getlink | user={user_id} | token={token}")


async def handle_regular_message(message: dict, from_user: dict) -> None:
    """پردازش پیام‌های عادی"""
    user_id = from_user["id"]

    # ذخیره / بروزرسانی کاربر
    storage.upsert_user(from_user)

    # ذخیره پیام
    storage.save_message(user_id, message)

    # ارسال تأییدیه دریافت
    custom = storage.get_special_message(
        user_id, from_user.get("username", ""), "message_received"
    )
    response_text = custom or storage.get_bot_message("message_received")
    await bale_api.send_message(user_id, response_text)

    logger.info(f"[BOT] message | user={user_id}")


async def _download_and_save_photo(user_id: int) -> None:
    """دانلود و ذخیره عکس پروفایل کاربر"""
    try:
        photo_path = await bale_api.download_profile_photo(user_id)
        if photo_path:
            storage.update_user_photo(user_id, photo_path)
    except Exception as e:
        logger.debug(f"[BOT] Photo download failed for {user_id}: {e}")
