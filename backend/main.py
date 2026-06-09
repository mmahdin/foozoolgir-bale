"""
سرور اصلی FastAPI — ربات بله با قابلیت‌های کامل
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


# ─────────────────────────────────────────────────────────
#  Lifespan
# ─────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    if BOT_TOKEN:
        logger.info("[App] Starting bot polling...")
        poll_task = asyncio.create_task(polling.start_polling())
    else:
        logger.warning("[App] BOT_TOKEN not set! Polling disabled.")
        poll_task = None

    yield

    if poll_task:
        polling.stop_polling()
        poll_task.cancel()
        try:
            await poll_task
        except asyncio.CancelledError:
            pass


# ─────────────────────────────────────────────────────────
#  ساخت اپلیکیشن
# ─────────────────────────────────────────────────────────

app = FastAPI(
    title="Bale Bot Manager",
    description="مدیریت ربات بله با لینک‌های اختصاصی",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────
#  Webhook
# ─────────────────────────────────────────────────────────

@app.post("/webhook")
async def webhook_endpoint(request: Request):
    try:
        update = await request.json()
        asyncio.create_task(bot_handler.handle_update(update))
        return {"ok": True}
    except Exception as e:
        logger.error(f"[Webhook] Error: {e}")
        return {"ok": False}


# ─────────────────────────────────────────────────────────
#  Pydantic Models
# ─────────────────────────────────────────────────────────

class CreateLinkRequest(BaseModel):
    name: str
    label: Optional[str] = ""


class SetWebhookRequest(BaseModel):
    webhook_url: str


class SendMessageRequest(BaseModel):
    text: str


class UpdateBotMessageRequest(BaseModel):
    text: str


class SetSpecialMessageRequest(BaseModel):
    user_id: int
    key: str
    text: str


class UpdateSettingsRequest(BaseModel):
    bot_token: Optional[str] = None
    bot_username: Optional[str] = None


# ─────────────────────────────────────────────────────────
#  API — Links
# ─────────────────────────────────────────────────────────

@app.get("/api/links")
def get_links():
    links = storage.load_links()
    result = []
    link_map = storage.load_link_map()
    # ساخت map معکوس: user_id -> token
    user_token_map = {str(uid): token for token, uid in link_map.items()}

    for name, info in links.items():
        deep_link = f"https://ble.ir/{BOT_USERNAME}?start={name}" if BOT_USERNAME else f"ble.ir/BOT_USERNAME?start={name}"
        result.append({**info, "deep_link": deep_link})
    return {"links": result}


@app.post("/api/links")
def create_link(req: CreateLinkRequest):
    name = req.name.strip().lower()
    if not name:
        raise HTTPException(status_code=400, detail="نام لینک نمی‌تواند خالی باشد")

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
    success = storage.delete_link(name)
    if not success:
        raise HTTPException(status_code=404, detail="لینک یافت نشد")
    return {"ok": True, "message": f"لینک '{name}' حذف شد"}


@app.get("/api/links/{name}/visitors")
def get_link_visitors(name: str):
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
        "link_name": name,
        "click_count": link_info.get("click_count", 0),
        "visitors": visitors,
    }


# ─────────────────────────────────────────────────────────
#  API — Users
# ─────────────────────────────────────────────────────────

@app.get("/api/users")
def get_users():
    users = storage.load_all_users()
    return {"users": users}


@app.get("/api/users/{user_id}")
def get_user(user_id: int):
    user = storage.load_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    return user


@app.get("/api/users/{user_id}/messages")
def get_user_messages(user_id: int):
    messages = storage.load_messages(user_id)
    return {"messages": messages}


@app.get("/api/users/{user_id}/sent-messages")
def get_user_sent_messages(user_id: int):
    sent = storage.get_user_sent_messages(user_id)
    return {"sent_messages": sent}


@app.post("/api/users/{user_id}/send-message")
async def send_message_to_user(user_id: int, req: SendMessageRequest):
    user = storage.load_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")

    try:
        result = await bale_api.send_message(user_id, req.text)
        message_id = result.get("message_id", 0) if isinstance(result, dict) else 0
        entry = storage.add_sent_message(user_id, message_id, req.text)
        return {"sent_message": entry}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در ارسال پیام: {str(e)}")


@app.get("/api/users/{user_id}/photo")
def get_user_photo(user_id: int):
    user = storage.load_user(user_id)
    if user and user.get("profile_photo_path"):
        path = user["profile_photo_path"]
        if os.path.exists(path):
            return FileResponse(path)
    raise HTTPException(status_code=404, detail="عکس پروفایل یافت نشد")


@app.get("/api/users/{user_id}/link")
def get_user_link(user_id: int):
    """دریافت یا ایجاد لینک اختصاصی کاربر"""
    user = storage.load_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")

    token = storage.get_or_create_user_token(user_id, user.get("first_name", ""))
    deep_link = f"https://ble.ir/{BOT_USERNAME}?start={token}" if BOT_USERNAME else f"ble.ir/BOT_USERNAME?start={token}"
    return {"token": token, "deep_link": deep_link}


# ─────────────────────────────────────────────────────────
#  API — Sent Messages
# ─────────────────────────────────────────────────────────

@app.delete("/api/sent-messages/{entry_id}")
async def delete_sent_message(entry_id: str):
    sent = storage.load_sent_messages()
    if entry_id not in sent:
        raise HTTPException(status_code=404, detail="پیام یافت نشد")

    entry = sent[entry_id]
    if not entry.get("deleted"):
        try:
            await bale_api.delete_message(entry["user_id"], entry["message_id"])
        except Exception as e:
            logger.warning(f"[API] Could not delete from Bale: {e}")

    storage.mark_sent_message_deleted(entry_id)
    return {"ok": True}


# ─────────────────────────────────────────────────────────
#  API — Stats
# ─────────────────────────────────────────────────────────

@app.get("/api/stats")
def get_stats():
    return storage.get_stats(
        bot_username=BOT_USERNAME,
        bot_token_set=bool(BOT_TOKEN)
    )


@app.get("/api/bot/info")
async def get_bot_info():
    try:
        info = await bale_api.get_me()
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────
#  API — Bot Messages
# ─────────────────────────────────────────────────────────

@app.get("/api/bot-messages")
def get_bot_messages():
    messages = storage.load_bot_messages()
    return {"messages": list(messages.values())}


@app.put("/api/bot-messages/{key}")
def update_bot_message(key: str, req: UpdateBotMessageRequest):
    result = storage.update_bot_message(key, req.text)
    if not result:
        raise HTTPException(status_code=404, detail="کلید پیام یافت نشد")
    return result


@app.delete("/api/bot-messages/{key}")
def reset_bot_message(key: str):
    result = storage.reset_bot_message(key)
    if not result:
        raise HTTPException(status_code=404, detail="کلید پیام یافت نشد")
    return result


# ─────────────────────────────────────────────────────────
#  API — Special Messages
# ─────────────────────────────────────────────────────────

@app.get("/api/special-messages")
def get_special_messages():
    entries = storage.get_all_special_messages_with_users()
    return {"entries": entries}


@app.post("/api/special-messages")
def set_special_message(req: SetSpecialMessageRequest):
    storage.set_special_message(req.user_id, req.key, req.text)
    return {"ok": True}


@app.delete("/api/special-messages/{user_id}/{key}")
def delete_special_message(user_id: int, key: str):
    success = storage.delete_special_message_entry(user_id, key)
    if not success:
        raise HTTPException(status_code=404, detail="پیام ویژه یافت نشد")
    return {"ok": True}


# ─────────────────────────────────────────────────────────
#  API — Settings
# ─────────────────────────────────────────────────────────

@app.get("/api/settings")
def get_settings():
    return {
        "bot_token": BOT_TOKEN,
        "bot_username": BOT_USERNAME,
    }


@app.post("/api/settings")
def update_settings(req: UpdateSettingsRequest):
    # در محیط واقعی باید در .env یا فایل config ذخیره شود
    # اینجا فقط response برمی‌گردانیم
    return {"ok": True, "message": "تنظیمات دریافت شد — برای اعمال باید سرور ریستارت شود"}


@app.post("/api/bot/webhook")
async def set_webhook(req: SetWebhookRequest):
    try:
        result = await bale_api.set_webhook(req.webhook_url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
