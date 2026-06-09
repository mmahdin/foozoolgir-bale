"""
ماژول ارتباط با API بله
"""
import logging
import os
import httpx
from config import BOT_TOKEN, PROFILE_PHOTOS_DIR

logger = logging.getLogger(__name__)

BASE_URL = "https://tapi.bale.ai/bot{token}"


def _url(method: str) -> str:
    return f"{BASE_URL.format(token=BOT_TOKEN)}/{method}"


async def send_message(chat_id: int, text: str, parse_mode: str = "Markdown") -> dict:
    """ارسال پیام به کاربر"""
    if not BOT_TOKEN:
        logger.warning("[API] BOT_TOKEN not set, skipping send_message")
        return {}

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            _url("sendMessage"),
            json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": parse_mode,
            }
        )
        data = resp.json()
        if not data.get("ok"):
            logger.error(f"[API] sendMessage failed: {data}")
        return data.get("result", {})


async def delete_message(chat_id: int, message_id: int) -> dict:
    """حذف پیام"""
    if not BOT_TOKEN:
        return {}

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            _url("deleteMessage"),
            json={
                "chat_id": chat_id,
                "message_id": message_id,
            }
        )
        return resp.json()


async def get_me() -> dict:
    """دریافت اطلاعات ربات"""
    if not BOT_TOKEN:
        return {}

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(_url("getMe"))
        return resp.json()


async def set_webhook(url: str) -> dict:
    """تنظیم webhook"""
    if not BOT_TOKEN:
        return {}

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            _url("setWebhook"),
            json={"url": url}
        )
        return resp.json()


async def get_updates(offset: int = 0, timeout: int = 30) -> list:
    """دریافت آپدیت‌ها (polling)"""
    if not BOT_TOKEN:
        return []

    async with httpx.AsyncClient(timeout=timeout + 5) as client:
        resp = await client.get(
            _url("getUpdates"),
            params={"offset": offset, "timeout": timeout}
        )
        data = resp.json()
        if data.get("ok"):
            return data.get("result", [])
        return []


async def download_profile_photo(user_id: int) -> str:
    """دانلود عکس پروفایل کاربر"""
    if not BOT_TOKEN:
        return ""

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # دریافت اطلاعات عکس پروفایل
            resp = await client.get(
                _url("getUserProfilePhotos"),
                params={"user_id": user_id, "limit": 1}
            )
            data = resp.json()
            if not data.get("ok"):
                return ""

            photos = data.get("result", {}).get("photos", [])
            if not photos:
                return ""

            # دریافت بزرگترین سایز
            photo = photos[0][-1]
            file_id = photo.get("file_id", "")
            if not file_id:
                return ""

            # دریافت مسیر فایل
            file_resp = await client.get(
                _url("getFile"),
                params={"file_id": file_id}
            )
            file_data = file_resp.json()
            if not file_data.get("ok"):
                return ""

            file_path = file_data.get("result", {}).get("file_path", "")
            if not file_path:
                return ""

            # دانلود فایل
            file_url = f"https://tapi.bale.ai/file/bot{BOT_TOKEN}/{file_path}"
            dl_resp = await client.get(file_url)

            # ذخیره
            os.makedirs(PROFILE_PHOTOS_DIR, exist_ok=True)
            save_path = os.path.join(PROFILE_PHOTOS_DIR, f"{user_id}.jpg")
            with open(save_path, "wb") as f:
                f.write(dl_resp.content)

            return save_path

    except Exception as e:
        logger.debug(f"[API] Photo download error for {user_id}: {e}")
        return ""
