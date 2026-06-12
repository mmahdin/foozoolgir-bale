"""
ماژول ارتباط با API بله
"""
import logging
import os
import httpx
from config import BOT_TOKEN, PROFILE_PHOTOS_DIR, MEDIA_DIR

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


async def send_photo(chat_id: int, photo: bytes, caption: str = "", filename: str = "photo.jpg") -> dict:
    """ارسال عکس به کاربر"""
    if not BOT_TOKEN:
        logger.warning("[API] BOT_TOKEN not set, skipping send_photo")
        return {}

    async with httpx.AsyncClient(timeout=60) as client:
        data = {"chat_id": chat_id}
        if caption:
            data["caption"] = caption
            data["parse_mode"] = "Markdown"
        files = {"photo": (filename, photo, "image/jpeg")}
        resp = await client.post(
            _url("sendPhoto"),
            data=data,
            files=files
        )
        result = resp.json()
        if not result.get("ok"):
            logger.error(f"[API] sendPhoto failed: {result}")
        return result.get("result", {})


async def send_video(chat_id: int, video: bytes, caption: str = "", filename: str = "video.mp4") -> dict:
    """ارسال ویدئو به کاربر"""
    if not BOT_TOKEN:
        logger.warning("[API] BOT_TOKEN not set, skipping send_video")
        return {}

    async with httpx.AsyncClient(timeout=120) as client:
        data = {"chat_id": chat_id}
        if caption:
            data["caption"] = caption
            data["parse_mode"] = "Markdown"
        files = {"video": (filename, video, "video/mp4")}
        resp = await client.post(
            _url("sendVideo"),
            data=data,
            files=files
        )
        result = resp.json()
        if not result.get("ok"):
            logger.error(f"[API] sendVideo failed: {result}")
        return result.get("result", {})


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


async def download_media(file_id: str, save_dir: str) -> str:
    """دانلود فایل رسانه با file_id"""
    if not BOT_TOKEN:
        return ""

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            file_resp = await client.get(
                _url("getFile"),
                params={"file_id": file_id}
            )
            if file_resp.status_code != 200:
                logger.warning(f"[API] getFile failed for {file_id}: HTTP {file_resp.status_code}")
                return ""

            file_data = file_resp.json()
            if not file_data.get("ok"):
                logger.warning(f"[API] getFile error for {file_id}: {file_data}")
                return ""

            file_path = file_data.get("result", {}).get("file_path", "")
            if not file_path:
                return ""

            file_url = f"https://tapi.bale.ai/file/bot{BOT_TOKEN}/{file_path}"
            dl_resp = await client.get(file_url)
            if dl_resp.status_code != 200:
                logger.warning(f"[API] Media download failed for {file_id}: HTTP {dl_resp.status_code}")
                return ""

            ext = os.path.splitext(file_path)[1] or ".bin"
            os.makedirs(save_dir, exist_ok=True)
            save_path = os.path.join(save_dir, f"{file_id}{ext}")
            with open(save_path, "wb") as f:
                f.write(dl_resp.content)

            return save_path

    except Exception as e:
        logger.warning(f"[API] Media download error for {file_id}: {e}")
        return ""


async def download_profile_photo(user_id: int) -> str:
    """دانلود عکس پروفایل کاربر با پشتیبان‌گیری از چند روش"""
    if not BOT_TOKEN:
        return ""

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            file_id = None

            # روش ۱: getUserProfilePhotos
            try:
                resp = await client.get(
                    _url("getUserProfilePhotos"),
                    params={"user_id": user_id, "limit": 1}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("ok"):
                        result = data.get("result", {})
                        photos = result.get("photos", []) if isinstance(result, dict) else []
                        if photos and isinstance(photos, list):
                            first = photos[0]
                            if isinstance(first, list) and first:
                                photo = first[-1]
                            elif isinstance(first, dict):
                                photo = first
                            else:
                                photo = None
                            if photo and isinstance(photo, dict):
                                file_id = photo.get("file_id")
            except Exception as e:
                logger.debug(f"[API] getUserProfilePhotos failed for {user_id}: {e}")

            # روش ۲: getChat (fallback برای چت خصوصی)
            if not file_id:
                try:
                    chat_resp = await client.get(
                        _url("getChat"),
                        params={"chat_id": user_id}
                    )
                    if chat_resp.status_code == 200:
                        chat_data = chat_resp.json()
                        if chat_data.get("ok"):
                            chat = chat_data.get("result", {})
                            photo = chat.get("photo")
                            if photo and isinstance(photo, dict):
                                file_id = photo.get("big_file_id") or photo.get("small_file_id")
                except Exception as e:
                    logger.debug(f"[API] getChat fallback failed for {user_id}: {e}")

            if not file_id:
                return ""

            # دریافت مسیر فایل
            file_resp = await client.get(
                _url("getFile"),
                params={"file_id": file_id}
            )
            if file_resp.status_code != 200:
                logger.warning(f"[API] getFile failed for user {user_id}: HTTP {file_resp.status_code}")
                return ""

            file_data = file_resp.json()
            if not file_data.get("ok"):
                logger.warning(f"[API] getFile error for user {user_id}: {file_data}")
                return ""

            file_path = file_data.get("result", {}).get("file_path", "")
            if not file_path:
                return ""

            # دانلود فایل
            file_url = f"https://tapi.bale.ai/file/bot{BOT_TOKEN}/{file_path}"
            dl_resp = await client.get(file_url)
            if dl_resp.status_code != 200:
                logger.warning(f"[API] Profile photo download failed for {user_id}: HTTP {dl_resp.status_code}")
                return ""

            content = dl_resp.content
            # اعتبارسنجی محتوای JPEG
            if not content.startswith(b'\xff\xd8'):
                logger.warning(f"[API] Downloaded file is not a valid JPEG for user {user_id}")
                return ""

            os.makedirs(PROFILE_PHOTOS_DIR, exist_ok=True)
            save_path = os.path.join(PROFILE_PHOTOS_DIR, f"{user_id}.jpg")
            with open(save_path, "wb") as f:
                f.write(content)

            logger.info(f"[API] Profile photo saved for user {user_id}: {save_path}")
            return save_path

    except Exception as e:
        logger.warning(f"[API] Photo download error for {user_id}: {e}")
        return ""
