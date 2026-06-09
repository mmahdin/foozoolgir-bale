# 📋 فهرست تغییرات (Changelog)

## تغییرات اعمال‌شده نسبت به نسخه اصلی

---

### ۱. 🐛 اصلاح باگ خوشامدگویی (با لینک اختصاصی)

**فایل:** `backend/bot_handler.py`

**مشکل:** در پیام خوشامدگویی وقتی کسی روی لینک اختصاصی یک نفر کلیک می‌کرد، متغیر `{first_name}` به اشتباه اسم شخصی که کلیک کرده بود (بازدیدکننده) را نشان می‌داد. در حالی که باید اسم شخصی که لینکش کلیک شده (صاحب لینک) را نشان بدهد.

**مثال مشکل:**
- جواد لینک اختصاصی می‌گیرد
- رضا روی لینک جواد کلیک می‌کند
- ❌ قبلاً: ربات به رضا می‌گفت «به **رضا** می‌گم...» (اشتباه!)
- ✅ الان: ربات به رضا می‌گفت «به **جواد** می‌گم...» (درست!)

**تغییر کد:**
```python
# قبل (اشتباه):
welcome_text = storage.get_bot_message(
    "welcome_with_link",
    first_name=first_name,  # ← اسم بازدیدکننده
    ...
)

# بعد (اصلاح شده):
target_first_name = owner_name  # ← اسم صاحب لینک
welcome_text = storage.get_bot_message(
    "welcome_with_link",
    first_name=target_first_name,  # ← اسم صاحب لینک
    ...
)
```

**محل تغییر:** تابع `handle_start` در فایل `bot_handler.py` — خطوط مربوط به ارسال پیام خوشامدگویی وقتی `owner_user_id is not None`

---

### ۲. 💬 صفحه کاربران — نمایش تاریخچه چت مانند تلگرام

**فایل:** `src/pages/UsersPage.tsx`

**تغییرات:**
- 🔄 طراحی کاملاً جدید صفحه کاربران با دو پنل (لیست کاربران + چت)
- 📱 رابط کاربری واکنش‌گرا (Responsive) — در موبایل فقط یک پنل نمایش داده می‌شود
- 💬 نمایش تاریخچه پیام‌ها به صورت حباب چت (Chat Bubbles) مشابه تلگرام
  - پیام‌های کاربر: سمت راست با پس‌زمینه سفید و آواتار آبی
  - پیام‌های ربات/ادمین: سمت چپ با پس‌زمینه آبی و آواتار سبز
- 📅 جداکننده تاریخ بین پیام‌های روزهای مختلف
- ⏰ نمایش ساعت ارسال روی هر پیام
- 🗑️ امکان حذف پیام‌های ارسالی (با هاور روی پیام، دکمه حذف ظاهر می‌شود)
- ✉️ ارسال پیام جدید به کاربر مستقیماً از صفحه چت
- 🔗 نمایش و کپی لینک اختصاصی کاربر در هدر چت
- 🔄 بارگذاری خودکار به پایین هنگام دریافت پیام‌های جدید
- ✨ انیمیشن ظاهر شدن حباب‌ها

---

### ۳. 📝 فایل‌های باقی‌مانده بدون تغییر

فایل‌های زیر بدون تغییر از نسخه اصلی بازسازی شده‌اند:
- `backend/bale_api.py`
- `backend/config.py`
- `backend/main.py`
- `backend/polling.py`
- `backend/storage.py`
- `src/api.ts`
- `src/pages/DashboardPage.tsx`
- `src/pages/LinksPage.tsx`
- `src/pages/MessagesPage.tsx`
- `src/pages/BotMessagesPage.tsx`
- `src/pages/SpecialMessagesPage.tsx`
- `src/pages/SettingsPage.tsx`

---

## نحوه اعمال تغییرات بک‌اند

فایل `backend/bot_handler.py` اصلاح‌شده را جایگزین فایل اصلی در سرور کنید:

```bash
cp backend/bot_handler.py /path/to/foozoolgir-bale/backend/bot_handler.py
```

سپس سرویس را ری‌استارت کنید.

---

## پچ (Diff) بک‌اند

```diff
--- a/backend/bot_handler.py
+++ b/backend/bot_handler.py
@@ -60,6 +60,10 @@ async def handle_start(message: dict, from_user: dict, text: str) -> None:
         owner_name = owner.get("first_name", "صاحب لینک") if owner else "صاحب لینک"
         owner_username = owner.get("username", "") if owner else ""
 
+        # FIX: first_name باید اسم صاحب لینک باشد (کسی که لینکش کلیک شده)
+        # قبلاً اشتباهاً از first_name بازدیدکننده استفاده می‌شد
+        target_first_name = owner_name
+
         # بررسی پیام ویژه سفارشی برای این کاربر
         custom = storage.get_special_message(
             owner_user_id, owner_username, "welcome_with_link",
-            first_name=first_name, owner_name=owner_name, source_link=source_token
+            first_name=target_first_name, owner_name=owner_name, source_link=source_token
         )
         if custom:
             welcome_text = custom
         else:
             welcome_text = storage.get_bot_message(
                 "welcome_with_link",
-                first_name=first_name,
+                first_name=target_first_name,
                 source_link=source_token,
                 owner_name=owner_name
             )
```
