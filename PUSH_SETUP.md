# تفعيل التذكيرات الخلفية (Web Push)

1. ثبّت المكتبة: `bun add @block65/webcrypto-web-push`
2. نفّذ الملف `drizzle/migrations/0003_push_subscriptions.sql` على قاعدة Supabase (Lovable Cloud ← SQL).
3. ولّد المفاتيح: `node scripts/generate-vapid.mjs`
   - ضع `VITE_VAPID_PUBLIC_KEY` في ملف `.env` (مفتاح عام، لا بأس).
   - ضع `VAPID_PUBLIC_KEY` و`VAPID_PRIVATE_KEY` و`VAPID_SUBJECT` و`REMINDER_CRON_SECRET` كأسرار (Secrets) على الخادم. لا تضع المفتاح الخاص في الكود.
4. جدول استدعاءً كل دقيقة:
   `POST https://dr-day.lovable.app/api/public/hooks/send-reminders` مع الترويسة `Authorization: Bearer <REMINDER_CRON_SECRET>`
   (مثلاً عبر pg_cron + pg_net في Supabase، أو cron-job.org).
5. على الهاتف: افتح التطبيق ← المزيد ← اختر 10 أو 15 دقيقة ← اسمح بالإشعارات.
   على iPhone يجب أولاً «إضافة إلى الشاشة الرئيسية» (iOS 16.4 فما فوق).
