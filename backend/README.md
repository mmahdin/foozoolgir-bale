# ربات بله — Backend

## راه‌اندازی

```bash
cd backend
pip install -r requirements.txt
```

## متغیرهای محیطی

```bash
export BOT_TOKEN="توکن ربات بله"
export BOT_USERNAME="یوزرنیم ربات"
```

## اجرا

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### لینک‌ها
- `GET /api/links` — دریافت همه لینک‌ها
- `POST /api/links` — ایجاد لینک جدید
- `DELETE /api/links/{name}` — حذف لینک
- `GET /api/links/{name}/visitors` — بازدیدکنندگان لینک

### کاربران
- `GET /api/users` — دریافت همه کاربران
- `GET /api/users/{user_id}` — اطلاعات یک کاربر
- `GET /api/users/{user_id}/messages` — پیام‌های دریافتی کاربر
- `GET /api/users/{user_id}/sent-messages` — پیام‌های ربات به کاربر
- `POST /api/users/{user_id}/send-message` — ارسال پیام به کاربر
- `GET /api/users/{user_id}/link` — دریافت یا ایجاد لینک اختصاصی کاربر
- `GET /api/users/{user_id}/photo` — عکس پروفایل

### پیام‌های ارسالی
- `DELETE /api/sent-messages/{entry_id}` — حذف پیام ربات

### آمار
- `GET /api/stats` — آمار کلی

### متون ربات
- `GET /api/bot-messages` — دریافت همه متون
- `PUT /api/bot-messages/{key}` — ویرایش متن
- `DELETE /api/bot-messages/{key}` — بازگشت به پیش‌فرض

### پیام‌های ویژه
- `GET /api/special-messages` — دریافت همه پیام‌های ویژه
- `POST /api/special-messages` — تنظیم پیام ویژه (با user_id عددی)
- `DELETE /api/special-messages/{user_id}/{key}` — حذف پیام ویژه

## نحوه عملکرد لینک‌ها

1. هر کاربر با دستور `/getlink` یک توکن UUID اختصاصی دریافت می‌کند
2. وقتی شخص دیگری روی این لینک کلیک کند:
   - به کلیک‌کننده: «به {نام صاحب لینک} می‌گم که می‌خواستی پروفایلش رو چک کنی»
   - به صاحب لینک: «{نام کلیک‌کننده} پروفایلت رو دید»
3. از پنل هم می‌توان لینک‌های سازمانی (name-based) ساخت

## پیام‌های ویژه

- با مشخص کردن `user_id` عددی، می‌توانید برای هر کاربر پیام‌های سفارشی تنظیم کنید
- اگر پیام ویژه‌ای برای کاربر وجود داشته باشد، به جای پیام عمومی ربات فرستاده می‌شود
