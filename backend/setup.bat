@echo off
REM اسکریپت راه‌اندازی برای ویندوز

echo راه‌اندازی ربات بله...

REM نصب کتابخانه‌ها
echo نصب کتابخانه‌ها...
pip install -r requirements.txt

REM ساخت فایل .env اگر نباشد
if not exist .env (
    copy .env.example .env
    echo.
    echo فایل .env ساخته شد.
    echo لطفا فایل backend\.env را باز کنید و مقادیر زیر را وارد کنید:
    echo   BOT_TOKEN=توکن ربات شما
    echo   BOT_USERNAME=یوزرنیم ربات شما
    echo.
    echo سپس دوباره این فایل را اجرا کنید.
    pause
) else (
    echo اجرای سرور...
    python main.py
)
