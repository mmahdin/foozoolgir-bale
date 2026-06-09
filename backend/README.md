# ربات بله - بک‌اند

## ساختار پروژه

```
backend/
├── main.py          # سرور FastAPI اصلی
├── bot_handler.py   # پردازش پیام‌های ربات
├── bale_api.py      # ارتباط با API بله
├── polling.py       # Long Polling
├── storage.py       # ذخیره‌سازی داده‌ها
├── config.py        # تنظیمات
├── .env             # متغیرهای محیطی (باید بسازید)
├── .env.example     # نمونه تنظیمات
├── requirements.txt # کتابخانه‌های مورد نیاز
└── data/            # داده‌ها (خودکار ساخته می‌شود)
    ├── links.json   # لینک‌های اختصاصی
    ├── users/       # اطلاعات کاربران (user_id.json)
    ├── messages/    # پیام‌های کاربران (user_id.json)
    └── profile_photos/ # عکس‌های پروفایل
```

## راه‌اندازی

### ۱. نصب کتابخانه‌ها
```bash
cd backend
pip install -r requirements.txt
```

### ۲. تنظیم متغیرهای محیطی
```bash
cp .env.example .env
```
فایل `.env` را باز کنید و مقادیر زیر را وارد کنید:
- `BOT_TOKEN`: توکن ربات از @botfather در بله
- `BOT_USERNAME`: یوزرنیم ربات (بدون @)

### ۳. اجرای سرور
```bash
python main.py
```
یا:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

سرور روی پورت `8000` اجرا می‌شود.

## نحوه کارکرد لینک‌های اختصاصی

### ساخت لینک
از طریق داشبورد یا API:
```
POST /api/links
{"name": "mahdi", "label": "لینک مهدی"}
```

### لینک تولیدشده
```
https://ble.ir/YOUR_BOT?start=mahdi
```

### چه اتفاقی می‌افتد؟
وقتی کاربری روی این لینک کلیک کند:
1. وارد ربات می‌شود
2. دستور `/start mahdi` برای ربات ارسال می‌شود
3. ربات می‌فهمد این کاربر از لینک `mahdi` آمده
4. اطلاعات کاربر (نام، یوزرنیم، عکس پروفایل) ذخیره می‌شود
5. کلیک روی لینک `mahdi` ثبت می‌شود

## API Endpoints

### لینک‌ها
| Method | Path | توضیح |
|--------|------|-------|
| GET | `/api/links` | لیست تمام لینک‌ها |
| POST | `/api/links` | ساخت لینک جدید |
| DELETE | `/api/links/{name}` | حذف لینک |
| GET | `/api/links/{name}/visitors` | بازدیدکنندگان لینک |

### کاربران
| Method | Path | توضیح |
|--------|------|-------|
| GET | `/api/users` | لیست تمام کاربران |
| GET | `/api/users/{id}` | اطلاعات یک کاربر |
| GET | `/api/users/{id}/messages` | پیام‌های یک کاربر |
| GET | `/api/users/{id}/photo` | عکس پروفایل کاربر |

### آمار
| Method | Path | توضیح |
|--------|------|-------|
| GET | `/api/stats` | آمار کلی |
| GET | `/api/bot/info` | اطلاعات ربات |

## Webhook (اختیاری)
اگر سرور عمومی دارید می‌توانید از webhook استفاده کنید:
```bash
curl -X POST http://localhost:8000/api/bot/set-webhook \
  -H "Content-Type: application/json" \
  -d '{"webhook_url": "https://your-server.com/webhook"}'
```

در غیر این صورت، برنامه به‌صورت خودکار از **Long Polling** استفاده می‌کند.
