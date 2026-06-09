#!/bin/bash
# اسکریپت راه‌اندازی بک‌اند

echo "🤖 راه‌اندازی ربات بله..."

# بررسی وجود Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 نصب نیست. لطفاً ابتدا Python3 نصب کنید."
    exit 1
fi

# نصب pip اگر نباشد
python3 -m ensurepip --upgrade 2>/dev/null || true

# نصب کتابخانه‌ها
echo "📦 نصب کتابخانه‌ها..."
pip3 install -r requirements.txt

# ساخت فایل .env اگر نباشد
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "⚠️  فایل .env ساخته شد."
    echo "لطفاً فایل backend/.env را باز کنید و مقادیر زیر را وارد کنید:"
    echo "  BOT_TOKEN=توکن ربات شما"
    echo "  BOT_USERNAME=یوزرنیم ربات شما"
    echo ""
    echo "سپس دوباره این اسکریپت را اجرا کنید یا مستقیم python main.py را اجرا کنید."
else
    echo "✅ فایل .env موجود است."
    echo ""
    echo "🚀 اجرای سرور..."
    python3 main.py
fi
