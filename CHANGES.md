# تغییرات نسخه ۲.۰ نسبت به نسخه اصلی

## فایل‌های تغییر یافته / اضافه شده

### 🔧 Backend

#### `backend/config.py` (تغییر یافته)
- اضافه شدن `LINK_MAP_FILE` برای ذخیره مپ توکن → user_id
- اضافه شدن `SENT_MESSAGES_FILE` برای ذخیره پیام‌های ارسالی از پنل

#### `backend/storage.py` (بازنویسی کامل)
**قابلیت‌های جدید:**
- `get_or_create_user_token(user_id)` — ساخت توکن UUID منحصربه‌فرد برای هر کاربر
- `get_user_id_by_token(token)` — پیدا کردن کاربر با توکن
- `save_sent_message(user_id, message_id, text)` — ذخیره پیام ارسالی از پنل
- `mark_sent_message_deleted(entry_id)` — علامت‌گذاری پیام حذف‌شده
- `get_sent_message(entry_id)` — دریافت یک پیام ارسالی
- `set_special_message(identifier, key, text)` — تنظیم پیام ویژه برای کاربر خاص
- `get_special_message(user_id, username, key)` — دریافت پیام ویژه اگر وجود داشت
- اضافه شدن پیام‌های پیش‌فرض جدید: `notify_owner` و `getlink_response`
- بروزرسانی `welcome_with_link` با متغیر `{owner_name}`

#### `backend/bot_handler.py` (تغییر یافته)
**قابلیت‌های جدید:**
- `handle_getlink()` — پردازش دستور `/getlink` و ساخت لینک شخصی
- منطق پردازش توکن شخصی در `handle_start()`:
  - تشخیص توکن شخصی از لینک عادی
  - ارسال پیام «به {owner_name} می‌گم» به بازدیدکننده
  - ارسال اطلاع‌رسانی به صاحب لینک
- پشتیبانی از پیام‌های ویژه در `handle_regular_message()` و `handle_start()`

#### `backend/main.py` (تغییر یافته)
**API Endpoints جدید:**
- `GET /api/personal-links` — لیست لینک‌های شخصی
- `GET /api/personal-links/{token}/visitors` — بازدیدکنندگان لینک شخصی
- `POST /api/users/{id}/send-message` — ارسال پیام از پنل
- `GET /api/users/{id}/sent-messages` — پیام‌های ارسالی به کاربر
- `DELETE /api/sent-messages/{id}` — حذف پیام ارسالی (از بله هم حذف می‌شود)
- `GET /api/sent-messages` — همه پیام‌های ارسالی
- `GET /api/special-messages` — پیام‌های ویژه
- `POST /api/special-messages` — تنظیم پیام ویژه
- `DELETE /api/special-messages/{id}/{key}` — حذف پیام ویژه
- `GET /api/links/{name}/users` — کاربران دسته‌بندی‌شده بر اساس لینک
- بروزرسانی `GET /api/stats` با آمار جدید

#### `backend/bale_api.py` (تغییر یافته)
- اضافه شدن `delete_message(chat_id, message_id)` — حذف پیام از بله

#### `backend/data/bot_messages.json` (تغییر یافته)
- اضافه شدن `notify_owner` — پیام اطلاع‌رسانی به صاحب لینک
- اضافه شدن `getlink_response` — پاسخ دستور /getlink
- بروزرسانی `welcome_with_link` با متغیر `{owner_name}`

---

### 🎨 Frontend

#### `src/api.ts` (تغییر یافته)
**تایپ‌های جدید:**
- `SentMessage` — پیام ارسالی از پنل
- `PersonalLink` — لینک شخصی کاربر
- `SpecialMessageEntry` — پیام ویژه کاربر خاص

**توابع جدید:**
- `fetchPersonalLinks()` — لیست لینک‌های شخصی
- `fetchPersonalLinkVisitors(token)` — بازدیدکنندگان لینک شخصی
- `fetchUserSentMessages(userId)` — پیام‌های ارسالی به کاربر
- `sendMessageToUser(userId, text)` — ارسال پیام از پنل
- `deleteSentMessage(entryId)` — حذف پیام ارسالی
- `fetchSpecialMessages()` — پیام‌های ویژه
- `setSpecialMessage(identifier, key, text)` — تنظیم پیام ویژه
- `deleteSpecialMessage(identifier, key)` — حذف پیام ویژه
- `fetchAllMessages()` — همه پیام‌ها

#### `src/pages/UsersPage.tsx` (بازنویسی)
- قابلیت ارسال پیام به کاربر از پنل
- نمایش پیام‌های ارسالی و حذف آن‌ها
- نمایش پیام‌های دریافتی از کاربر

#### `src/pages/LinksPage.tsx` (بازنویسی)
- دو تب: لینک‌های عمومی + لینک‌های شخصی
- نمایش لینک‌های شخصی کاربران (/getlink)
- نمایش بازدیدکنندگان هر لینک

#### `src/pages/SpecialMessagesPage.tsx` (جدید)
- مدیریت پیام‌های ویژه برای کاربران خاص
- تنظیم متن سفارشی بر اساس آیدی عددی یا یوزرنیم

#### `src/pages/DashboardPage.tsx` (بروزرسانی)
- آمار جدید: تعداد لینک‌های شخصی، پیام‌های ارسالی
- راهنمای جامع

#### `src/pages/MessagesPage.tsx` (بروزرسانی)
- فیلتر بر اساس نوع پیام
- نمایش منبع لینک کاربر

#### `src/App.tsx` (بروزرسانی)
- اضافه شدن آیتم منو «پیام‌های ویژه»

---

## ساختار داده‌ها

### `link_map.json`
```json
{
  "abc123def456ghi789jk": "12345678"
}
```
کلید: توکن UUID (۲۰ کاراکتر) | مقدار: user_id کاربر

### `sent_messages.json`
```json
[
  {
    "id": "uuid",
    "user_id": 12345678,
    "message_id": 100,
    "text": "متن پیام",
    "sent_at": "2024-01-01T10:00:00",
    "deleted": false
  }
]
```

### `special_messages.json`
```json
{
  "mahdi": {
    "welcome_with_link": "متن سفارشی برای مهدی"
  },
  "12345678": {
    "message_received": "پیام دریافت شد ✅"
  }
}
```
