"""
سرور اصلی FastAPI - ربات بله با قابلیت لینک اختصاصی
"""
import asyncio
import logging
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

import bale_api
import bot_handler
import polling
import storage
from config import BOT_USERNAME, PROFILE_PHOTOS_DIR, BOT_TOKEN

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
#  Lifespan - شروع و پایان برنامه
# ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # اجرای long polling در پس‌زمینه
    if BOT_TOKEN:
        logger.info("[App] Starting bot polling...")
        poll_task = asyncio.create_task(polling.start_polling())
    else:
        logger.warning("[App] BOT_TOKEN not set! Polling disabled.")
        poll_task = None
    
    yield
    
    # پایان polling
    if poll_task:
        polling.stop_polling()
        poll_task.cancel()
        try:
            await poll_task
        except asyncio.CancelledError:
            pass


# ─────────────────────────────────────────────
#  ساخت اپلیکیشن
# ─────────────────────────────────────────────

app = FastAPI(
    title="Bale Bot Manager",
    description="مدیریت ربات بله با لینک‌های اختصاصی",
    version="1.0.0",
    lifespan=lifespan
)

# CORS برای فرانت‌اند
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
#  Webhook (اختیاری)
# ─────────────────────────────────────────────

@app.post("/webhook")
async def webhook_endpoint(request: Request):
    """دریافت آپدیت از طریق webhook"""
    try:
        update = await request.json()
        asyncio.create_task(bot_handler.handle_update(update))
        return {"ok": True}
    except Exception as e:
        logger.error(f"[Webhook] Error: {e}")
        return {"ok": False}


# ─────────────────────────────────────────────
#  Pydantic Models
# ─────────────────────────────────────────────

class CreateLinkRequest(BaseModel):
    name: str
    label: Optional[str] = ""


class SetWebhookRequest(BaseModel):
    webhook_url: str


# ─────────────────────────────────────────────
#  API - مدیریت لینک‌ها
# ─────────────────────────────────────────────

@app.get("/api/links")
def get_links():
    """دریافت تمام لینک‌های اختصاصی"""
    links = storage.load_links()
    result = []
    for name, info in links.items():
        deep_link = f"https://ble.ir/{BOT_USERNAME}?start={name}" if BOT_USERNAME else f"ble.ir/BOT_USERNAME?start={name}"
        result.append({
            **info,
            "deep_link": deep_link
        })
    return {"links": result}


@app.post("/api/links")
def create_link(req: CreateLinkRequest):
    """ساخت لینک اختصاصی جدید"""
    # اعتبارسنجی نام لینک
    name = req.name.strip().lower()
    if not name:
        raise HTTPException(status_code=400, detail="نام لینک نمی‌تواند خالی باشد")
    
    # فقط حروف، اعداد و خط تیره مجاز است
    import re
    if not re.match(r'^[a-zA-Z0-9_\-]+$', name):
        raise HTTPException(
            status_code=400,
            detail="نام لینک فقط می‌تواند شامل حروف انگلیسی، اعداد، خط تیره و زیرخط باشد"
        )
    
    result = storage.create_link(name, req.label)
    if "error" in result:
        raise HTTPException(status_code=409, detail=result["error"])
    
    deep_link = f"https://ble.ir/{BOT_USERNAME}?start={name}" if BOT_USERNAME else f"ble.ir/BOT_USERNAME?start={name}"
    return {**result, "deep_link": deep_link}


@app.delete("/api/links/{name}")
def delete_link(name: str):
    """حذف لینک اختصاصی"""
    success = storage.delete_link(name)
    if not success:
        raise HTTPException(status_code=404, detail="لینک یافت نشد")
    return {"ok": True, "message": f"لینک '{name}' حذف شد"}


@app.get("/api/links/{name}/visitors")
def get_link_visitors(name: str):
    """دریافت بازدیدکنندگان یک لینک خاص"""
    links = storage.load_links()
    if name not in links:
        raise HTTPException(status_code=404, detail="لینک یافت نشد")
    
    link_info = links[name]
    visitor_ids = link_info.get("visitors", [])
    
    visitors = []
    for uid in visitor_ids:
        user = storage.load_user(uid)
        if user:
            visitors.append(user)
    
    return {
        "link": {**link_info, "deep_link": f"https://ble.ir/{BOT_USERNAME}?start={name}"},
        "visitors": visitors,
        "total": len(visitors)
    }


# ─────────────────────────────────────────────
#  API - مدیریت کاربران
# ─────────────────────────────────────────────

@app.get("/api/users")
def get_users():
    """دریافت لیست تمام کاربران"""
    users = storage.load_all_users()
    return {"users": users, "total": len(users)}


@app.get("/api/users/{user_id}")
def get_user(user_id: int):
    """دریافت اطلاعات یک کاربر"""
    user = storage.load_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    return user


@app.get("/api/users/{user_id}/messages")
def get_user_messages(user_id: int):
    """دریافت پیام‌های یک کاربر"""
    user = storage.load_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    messages = storage.load_user_messages(user_id)
    return {
        "user": user,
        "messages": messages,
        "total": len(messages)
    }


@app.get("/api/users/{user_id}/photo")
def get_user_photo(user_id: int):
    """دریافت عکس پروفایل کاربر"""
    user = storage.load_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    
    photo_path = user.get("profile_photo_path", "")
    if not photo_path or not os.path.exists(photo_path):
        raise HTTPException(status_code=404, detail="عکس پروفایل یافت نشد")
    
    return FileResponse(photo_path)


# ─────────────────────────────────────────────
#  API - پیام‌ها
# ─────────────────────────────────────────────

@app.get("/api/messages")
def get_all_messages():
    """دریافت تمام پیام‌ها"""
    messages = storage.load_all_messages()
    return {"messages": messages, "total": len(messages)}


# ─────────────────────────────────────────────
#  API - آمار کلی
# ─────────────────────────────────────────────

@app.get("/api/stats")
def get_stats():
    """دریافت آمار کلی ربات"""
    users = storage.load_all_users()
    links = storage.load_links()
    messages = storage.load_all_messages()
    
    total_clicks = sum(v.get("click_count", 0) for v in links.values())
    
    return {
        "total_users": len(users),
        "total_links": len(links),
        "total_messages": len(messages),
        "total_clicks": total_clicks,
        "bot_username": BOT_USERNAME,
        "bot_token_set": bool(BOT_TOKEN)
    }


# ─────────────────────────────────────────────
#  API - تنظیمات ربات
# ─────────────────────────────────────────────

@app.get("/api/bot/info")
async def get_bot_info():
    """دریافت اطلاعات ربات از API بله"""
    if not BOT_TOKEN:
        raise HTTPException(status_code=400, detail="BOT_TOKEN تنظیم نشده")
    result = await bale_api.get_me()
    return result


@app.post("/api/bot/set-webhook")
async def set_webhook(req: SetWebhookRequest):
    """تنظیم webhook برای ربات"""
    if not BOT_TOKEN:
        raise HTTPException(status_code=400, detail="BOT_TOKEN تنظیم نشده")
    result = await bale_api.set_webhook(req.webhook_url)
    return result


@app.post("/api/bot/delete-webhook")
async def delete_webhook():
    """حذف webhook"""
    if not BOT_TOKEN:
        raise HTTPException(status_code=400, detail="BOT_TOKEN تنظیم نشده")
    result = await bale_api.delete_webhook()
    return result


# ─────────────────────────────────────────────
#  نقطه ورود
# ─────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    from config import PORT
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)


# ─────────────────────────────────────────────
#  API - متون ربات
# ─────────────────────────────────────────────

class UpdateBotMessageRequest(BaseModel):
    text: str


@app.get("/api/bot-messages")
def get_bot_messages():
    """دریافت تمام متون ربات"""
    messages = storage.load_bot_messages()
    return {"messages": list(messages.values())}


@app.put("/api/bot-messages/{key}")
def update_bot_message_endpoint(key: str, req: UpdateBotMessageRequest):
    """بروزرسانی متن یک پیام"""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="متن پیام نمی‌تواند خالی باشد")
    success = storage.update_bot_message(key, req.text)
    if not success:
        raise HTTPException(status_code=404, detail="پیام یافت نشد")
    return {"ok": True, "message": "متن پیام با موفقیت بروز شد"}


@app.post("/api/bot-messages/{key}/reset")
def reset_bot_message_endpoint(key: str):
    """بازگشت متن پیام به حالت پیش‌فرض"""
    success = storage.reset_bot_message(key)
    if not success:
        raise HTTPException(status_code=404, detail="پیام یافت نشد")
    messages = storage.load_bot_messages()
    return {"ok": True, "message": messages[key]}
