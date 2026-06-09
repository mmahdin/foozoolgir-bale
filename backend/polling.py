"""
ماژول Long Polling - دریافت آپدیت‌ها از سرور بله
"""
import asyncio
import logging

import bale_api
import bot_handler

logger = logging.getLogger(__name__)

_running = False
_offset = 0


async def start_polling():
    """شروع long polling در پس‌زمینه"""
    global _running, _offset
    _running = True
    logger.info("[Polling] Started...")
    
    while _running:
        try:
            result = await bale_api.get_updates(offset=_offset, timeout=25)
            
            if not result.get("ok"):
                logger.warning(f"[Polling] API error: {result}")
                await asyncio.sleep(5)
                continue
            
            updates = result.get("result", [])
            
            for update in updates:
                update_id = update.get("update_id", 0)
                _offset = update_id + 1
                
                try:
                    await bot_handler.handle_update(update)
                except Exception as e:
                    logger.error(f"[Polling] Error handling update {update_id}: {e}")
        
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"[Polling] Connection error: {e}")
            await asyncio.sleep(5)
    
    logger.info("[Polling] Stopped.")


def stop_polling():
    global _running
    _running = False
