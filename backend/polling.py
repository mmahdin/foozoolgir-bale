"""
ماژول polling برای دریافت آپدیت‌ها
"""
import asyncio
import logging

import bale_api
import bot_handler

logger = logging.getLogger(__name__)

_running = False


def stop_polling():
    global _running
    _running = False


async def start_polling():
    global _running
    _running = True
    offset = 0
    logger.info("[Polling] Started")

    while _running:
        try:
            updates = await bale_api.get_updates(offset=offset, timeout=30)
            for update in updates:
                update_id = update.get("update_id", 0)
                offset = update_id + 1
                asyncio.create_task(bot_handler.handle_update(update))
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"[Polling] Error: {e}")
            await asyncio.sleep(5)

    logger.info("[Polling] Stopped")
