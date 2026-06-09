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
#  Lifespan
# ─────────────────────────────────────────────

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


# ─────────────────────────────────────────────
#  ساخت اپلیکیشن
# ─────────────────────────────────────────────

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


# ─────────────────────────────────────────────
#  Webhook
# ─────────────────────────────────────────────

@app.post("/webhook")
async def webhook_endpoint(request: Request):
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


class SendMessageRequest(BaseModel):
    text: str


class UpdateBotMessageRequest(BaseModel):
    text: str


class SetSpecialMessageRequest(BaseModel):
    identifier: str   # user_id یا username
    key: str          # کلید پیام (مثل welcome_with_link)
    text: str


# ─────────────────────────────────────────────
#  API - مدیریت لینک‌ها
# ─────────────────────────────────────────────

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
        "link": {**link_info, "deep_link": f"https://ble.ir/{BOT_USERNAME}?start={name}"},
        "visitors": visitors,
        "total": len(visitors)
    }


# ─────────────────────────────────────────────
#  API - لینک‌های شخصی (Personal Links)
# ─────────────────────────────────────────────

@app.get("/api/personal-links")
def get_personal_links():
    """دریافت لیست تمام لینک‌های شخصی کاربران"""
    link_map = storage.load_link_map()
    result = []
    for token, user_id_str in link_map.items():
        user_id = int(user_id_str)
        user = storage.load_user(user_id)
        deep_link = f"https://ble.ir/{BOT_USERNAME}?start={token}" if BOT_USERNAME else f"ble.ir/BOT_USERNAME?start={token}"
        result.append({
            "token": token,
            "user_id": user_id,
            "user": user,
            "deep_link": deep_link
        })
    return {"personal_links": result, "total": len(result)}


@app.get("/api/personal-links/{token}/visitors")
def get_personal_link_visitors(token: str):
    """دریافت بازدیدکنندگان یک لینک شخصی"""
    owner_id = storage.get_user_id_by_token(token)
    if owner_id is None:
        raise HTTPException(status_code=404, detail="توکن یافت نشد")

    owner = storage.load_user(owner_id)
    # کاربرانی که این توکن را در source_links دارند
    all_users = storage.load_all_users()
    visitors = [u for u in all_users if token in u.get("source_links", []) and u["id"] != owner_id]

    deep_link = f"https://ble.ir/{BOT_USERNAME}?start={token}" if BOT_USERNAME else f"ble.ir/BOT_USERNAME?start={token}"
    return {
        "token": token,
        "owner": owner,
        "deep_link": deep_link,
        "visitors": visitors,
        "total": len(visitors)
    }


# ─────────────────────────────────────────────
#  API - مدیریت کاربران
# ─────────────────────────────────────────────

@app.get("/api/users")
def get_users():
    users = storage.load_all_users()
    return {"users": users, "total": len(users)}


@app.get("/api/users/{user_id}")
def get_user(user_id: int):
    user = storage.load_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    return user


@app.get("/api/users/{user_id}/messages")
def get_user_messages(user_id: int):
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
    user = storage.load_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")

    photo_path = user.get("profile_photo_path", "")
    if not photo_path or not os.path.exists(photo_path):
        raise HTTPException(status_code=404, detail="عکس پروفایل یافت نشد")

    return FileResponse(photo_path)


# ─────────────────────────────────────────────
#  API - ارسال پیام به کاربران از پنل
# ─────────────────────────────────────────────

@app.post("/api/users/{user_id}/send-message")
async def send_message_to_user(user_id: int, req: SendMessageRequest):
    """ارسال پیام به یک کاربر خاص از پنل"""
    if not BOT_TOKEN:
        raise HTTPException(status_code=400, detail="BOT_TOKEN تنظیم نشده")

    user = storage.load_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")

    result = await bale_api.send_message(user_id, req.text)
    if not result.get("ok"):
        raise HTTPException(status_code=500, detail=f"خطا در ارسال پیام: {result.get('description', '')}")

    message_id = result.get("result", {}).get("message_id")
    entry = storage.save_sent_message(user_id, message_id, req.text)
    return {"ok": True, "sent_message": entry}


@app.get("/api/users/{user_id}/sent-messages")
def get_sent_messages_for_user(user_id: int):
    """دریافت پیام‌های ارسالی از پنل به یک کاربر"""
    msgs = storage.load_sent_messages()
    user_msgs = [m for m in msgs if m["user_id"] == user_id]
    return {"sent_messages": user_msgs, "total": len(user_msgs)}


@app.delete("/api/sent-messages/{entry_id}")
async def delete_sent_message(entry_id: str):
    """حذف پیام ارسالی از پنل (هم از چت، هم از سیستم)"""
    if not BOT_TOKEN:
        raise HTTPException(status_code=400, detail="BOT_TOKEN تنظیم نشده")

    entry = storage.get_sent_message(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="پیام یافت نشد")

    if entry.get("deleted"):
        raise HTTPException(status_code=400, detail="پیام قبلاً حذف شده")

    # حذف از بله
    result = await bale_api.delete_message(entry["user_id"], entry["message_id"])
    if not result.get("ok"):
        logger.warning(f"[API] Could not delete from Bale: {result.get('description')}")

    storage.mark_sent_message_deleted(entry_id)
    return {"ok": True, "message": "پیام حذف شد"}


@app.get("/api/sent-messages")
def get_all_sent_messages():
    """دریافت تمام پیام‌های ارسالی از پنل"""
    msgs = storage.load_sent_messages()
    return {"sent_messages": msgs, "total": len(msgs)}


# ─────────────────────────────────────────────
#  API - پیام‌ها (دریافتی از کاربران)
# ─────────────────────────────────────────────

@app.get("/api/messages")
def get_all_messages():
    messages = storage.load_all_messages()
    return {"messages": messages, "total": len(messages)}


# ─────────────────────────────────────────────
#  API - آمار کلی
# ─────────────────────────────────────────────

@app.get("/api/stats")
def get_stats():
    users = storage.load_all_users()
    links = storage.load_links()
    messages = storage.load_all_messages()
    link_map = storage.load_link_map()
    sent_msgs = storage.load_sent_messages()

    total_clicks = sum(v.get("click_count", 0) for v in links.values())

    # بازدیدکنندگان لینک‌های شخصی
    personal_visitors = 0
    all_users = storage.load_all_users()
    for u in all_users:
        for sl in u.get("source_links", []):
            owner_id = storage.get_user_id_by_token(sl)
            if owner_id is not None and owner_id != u["id"]:
                personal_visitors += 1
                break

    return {
        "total_users": len(users),
        "total_links": len(links),
        "total_messages": len(messages),
        "total_clicks": total_clicks,
        "total_personal_links": len(link_map),
        "total_personal_visitors": personal_visitors,
        "total_sent_messages": len(sent_msgs),
        "bot_username": BOT_USERNAME,
        "bot_token_set": bool(BOT_TOKEN)
    }


# ─────────────────────────────────────────────
#  API - تنظیمات ربات
# ─────────────────────────────────────────────

@app.get("/api/bot/info")
async def get_bot_info():
    if not BOT_TOKEN:
        raise HTTPException(status_code=400, detail="BOT_TOKEN تنظیم نشده")
    result = await bale_api.get_me()
    return result


@app.post("/api/bot/set-webhook")
async def set_webhook(req: SetWebhookRequest):
    if not BOT_TOKEN:
        raise HTTPException(status_code=400, detail="BOT_TOKEN تنظیم نشده")
    result = await bale_api.set_webhook(req.webhook_url)
    return result


@app.post("/api/bot/delete-webhook")
async def delete_webhook():
    if not BOT_TOKEN:
        raise HTTPException(status_code=400, detail="BOT_TOKEN تنظیم نشده")
    result = await bale_api.delete_webhook()
    return result


# ─────────────────────────────────────────────
#  API - متون ربات
# ─────────────────────────────────────────────

@app.get("/api/bot-messages")
def get_bot_messages():
    data = storage.load_bot_messages()
    return {"messages": list(data.values())}


@app.put("/api/bot-messages/{key}")
def update_bot_message(key: str, req: UpdateBotMessageRequest):
    success = storage.update_bot_message(key, req.text)
    if not success:
        raise HTTPException(status_code=404, detail="کلید پیام یافت نشد")
    return {"ok": True}


@app.post("/api/bot-messages/{key}/reset")
def reset_bot_message(key: str):
    result = storage.reset_bot_message(key)
    if not result:
        raise HTTPException(status_code=404, detail="کلید پیام یافت نشد")
    return {"ok": True, "message": result}


# ─────────────────────────────────────────────
#  API - پیام‌های ویژه (Special Messages)
# ─────────────────────────────────────────────

@app.get("/api/special-messages")
def get_special_messages():
    """دریافت تمام پیام‌های سفارشی کاربران ویژه"""
    data = storage.load_special_messages()
    result = []
    for identifier, messages in data.items():
        # تلاش برای پیدا کردن اطلاعات کاربر
        user = None
        try:
            uid = int(identifier)
            user = storage.load_user(uid)
        except ValueError:
            # username است
            all_users = storage.load_all_users()
            user = next((u for u in all_users if u.get("username") == identifier), None)
        result.append({
            "identifier": identifier,
            "user": user,
            "messages": messages
        })
    return {"special_messages": result}


@app.post("/api/special-messages")
def set_special_message(req: SetSpecialMessageRequest):
    """تنظیم پیام سفارشی برای یک کاربر خاص"""
    storage.set_special_message(req.identifier, req.key, req.text)
    return {"ok": True}


@app.delete("/api/special-messages/{identifier}/{key}")
def delete_special_message(identifier: str, key: str):
    """حذف پیام سفارشی"""
    data = storage.load_special_messages()
    if identifier not in data or key not in data[identifier]:
        raise HTTPException(status_code=404, detail="پیام سفارشی یافت نشد")
    del data[identifier][key]
    if not data[identifier]:
        del data[identifier]
    storage._save_json(storage.SPECIAL_MESSAGES_FILE, data)
    return {"ok": True}


# ─────────────────────────────────────────────
#  API - دسته‌بندی کاربران بر اساس لینک
# ─────────────────────────────────────────────

@app.get("/api/links/{name}/users")
def get_link_users(name: str):
    """دریافت کاربران دسته‌بندی‌شده بر اساس لینک"""
    links = storage.load_links()
    if name not in links:
        raise HTTPException(status_code=404, detail="لینک یافت نشد")

    link_info = links[name]
    visitor_ids = link_info.get("visitors", [])

    visitors = []
    for uid in visitor_ids:
        user = storage.load_user(uid)
        if user:
            msgs = storage.load_user_messages(uid)
            visitors.append({
                **user,
                "message_count_for_link": len(msgs)
            })

    return {
        "link": {**link_info, "deep_link": f"https://ble.ir/{BOT_USERNAME}?start={name}"},
        "users": visitors,
        "total": len(visitors)
    }
