"""
ماژول ارتباط با API بله
"""
import httpx
import os
import asyncio
from typing import Optional

from config import BALE_API_URL, BALE_FILE_URL, PROFILE_PHOTOS_DIR


async def api_call(method: str, data: dict = None, files: dict = None) -> dict:
    """ارسال درخواست به API بله"""
    url = f"{BALE_API_URL}/{method}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        if files:
            response = await client.post(url, data=data or {}, files=files)
        elif data:
            response = await client.post(url, json=data)
        else:
            response = await client.get(url)
    return response.json()


async def get_me() -> dict:
    """دریافت اطلاعات ربات"""
    return await api_call("getMe")


async def send_message(chat_id: int, text: str, reply_markup: dict = None) -> dict:
    """ارسال پیام متنی"""
    data = {"chat_id": chat_id, "text": text}
    if reply_markup:
        data["reply_markup"] = reply_markup
    return await api_call("sendMessage", data)


async def get_user_profile_photos(user_id: int, limit: int = 1) -> dict:
    """دریافت عکس‌های پروفایل کاربر"""
    return await api_call("getUserProfilePhotos", {"user_id": user_id, "limit": limit})


async def get_file(file_id: str) -> dict:
    """دریافت اطلاعات فایل"""
    return await api_call("getFile", {"file_id": file_id})


async def download_profile_photo(user_id: int) -> Optional[str]:
    """
    دانلود و ذخیره عکس پروفایل کاربر
    برمی‌گرداند: مسیر فایل ذخیره‌شده یا None
    """
    try:
        # دریافت لیست عکس‌های پروفایل
        photos_resp = await get_user_profile_photos(user_id, limit=1)
        
        if not photos_resp.get("ok"):
            return None
        
        photos = photos_resp.get("result", {})
        total = photos.get("total_count", 0)
        
        if total == 0:
            return None
        
        # انتخاب بزرگ‌ترین سایز
        photo_sizes = photos.get("photos", [[]])[0]
        if not photo_sizes:
            return None
        
        # بزرگ‌ترین سایز (آخرین آیتم)
        largest = photo_sizes[-1]
        file_id = largest["file_id"]
        
        # دریافت مسیر فایل
        file_resp = await get_file(file_id)
        if not file_resp.get("ok"):
            return None
        
        file_path = file_resp["result"].get("file_path")
        if not file_path:
            return None
        
        # دانلود فایل
        download_url = f"{BALE_FILE_URL}/{file_path}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(download_url)
            if resp.status_code != 200:
                return None
            
            # تعیین پسوند
            ext = os.path.splitext(file_path)[-1] or ".jpg"
            save_path = os.path.join(PROFILE_PHOTOS_DIR, f"{user_id}{ext}")
            
            with open(save_path, "wb") as f:
                f.write(resp.content)
            
            return save_path
    
    except Exception as e:
        print(f"[ERROR] download_profile_photo({user_id}): {e}")
        return None


async def set_webhook(webhook_url: str) -> dict:
    """تنظیم webhook"""
    return await api_call("setWebhook", {"url": webhook_url})


async def delete_webhook() -> dict:
    """حذف webhook"""
    return await api_call("deleteWebhook")


async def get_updates(offset: int = 0, timeout: int = 30) -> dict:
    """دریافت آپدیت‌ها با long polling"""
    return await api_call("getUpdates", {
        "offset": offset,
        "timeout": timeout,
        "limit": 100
    })
