# PURA Call Center - Vercel و Railway Setup

## الخطوة 1: إعداد GitHub Repository

### 1.1 إنشاء حساب GitHub (إذا لم تكن لديك حساب)
1. اذهب إلى https://github.com
2. اضغط **Sign up**
3. أدخل البيانات المطلوبة وأكمل التسجيل

### 1.2 إنشاء Repository جديد
1. بعد تسجيل الدخول، اضغط **+** في الزاوية العلوية اليمين
2. اختر **New repository**
3. أدخل الاسم: `pura-call-center`
4. اختر **Public** (مهم للـ free tier)
5. اضغط **Create repository**

### 1.3 دفع الكود إلى GitHub

افتح Terminal/Command Prompt وشغل الأوامر دي:

```bash
cd /path/to/pura-call-center

# إذا لم تكن قد بدأت git بعد
git init

# أضف جميع الملفات
git add .

# عمل commit
git commit -m "Initial commit: PURA Call Center"

# أضف الـ remote (استبدل YOUR_USERNAME باسم حسابك)
git remote add origin https://github.com/YOUR_USERNAME/pura-call-center.git

# غيّر اسم الـ branch إلى main
git branch -M main

# ادفع الكود
git push -u origin main
```

**ملاحظة**: قد يطلب منك اسم المستخدم وكلمة المرور. استخدم:
- Username: اسم حسابك على GitHub
- Password: استخدم **Personal Access Token** (اتبع الخطوات أدناه)

#### إنشاء Personal Access Token
1. اذهب إلى https://github.com/settings/tokens
2. اضغط **Generate new token** → **Generate new token (classic)**
3. أعط اسم: `pura-deployment`
4. اختر **repo** و **workflow**
5. اضغط **Generate token**
6. **انسخ الـ token** (لن تراه مرة أخرى!)
7. استخدمه كـ password عند الـ git push

---

## الخطوة 2: النشر على Railway

### 2.1 إنشاء حساب Railway
1. اذهب إلى https://railway.app
2. اضغط **Start Project**
3. اختر **Deploy from GitHub repo**
4. اضغط **Connect GitHub** وأعطه الصلاحيات

### 2.2 إنشاء Project
1. اضغط **New Project**
2. اختر **Deploy from GitHub repo**
3. ابحث عن `pura-call-center` واختره
4. اضغط **Deploy**

Railway سيبدأ البناء تلقائياً.

### 2.3 إضافة PostgreSQL Database
1. في لوحة التحكم، اضغط **Add Service**
2. اختر **PostgreSQL**
3. Railway سينشئ database تلقائياً
4. انسخ **DATABASE_URL** من الـ environment variables

### 2.4 إضافة Environment Variables
1. اضغط على Web Service (pura-call-center)
2. اذهب إلى **Variables** tab
3. أضف المتغيرات دي:

```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-random-secret-key-here
VITE_APP_TITLE=PURA Call Center
VITE_APP_LOGO=https://pura.ai/wp-content/uploads/2025/06/logo.png
NODE_ENV=production
```

**لإنشاء JWT_SECRET عشوائي:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.5 تعديل Build & Start Commands
1. اذهب إلى **Settings**
2. عدّل **Build Command**:
   ```
   pnpm install && pnpm db:push
   ```
3. عدّل **Start Command**:
   ```
   pnpm start
   ```
4. اضغط **Save**

Railway سينشر التطبيق تلقائياً!

### 2.6 الحصول على الـ URL
بعد النشر الناجح، ستجد الـ URL في لوحة التحكم (مثل: `https://pura-call-center.up.railway.app`)

---

## الخطوة 3: النشر على Vercel

### ⚠️ ملاحظة مهمة
Vercel مخصص للـ frontend فقط. لأن تطبيقك يحتاج backend و database، ستحتاج:
- **Frontend**: نشر على Vercel
- **Backend + Database**: نشر على Railway أو Render

### 3.1 إنشاء حساب Vercel
1. اذهب إلى https://vercel.com
2. اضغط **Sign Up**
3. اختر **Continue with GitHub**
4. أعطه الصلاحيات

### 3.2 نشر التطبيق
1. اضغط **Add New** → **Project**
2. اختر **Import Git Repository**
3. ابحث عن `pura-call-center` واختره
4. اضغط **Import**

### 3.3 إضافة Environment Variables
1. في صفحة الإعدادات، اذهب إلى **Environment Variables**
2. أضف:

```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-random-secret-key
VITE_APP_TITLE=PURA Call Center
NODE_ENV=production
```

### 3.4 النشر
1. اضغط **Deploy**
2. انتظر حتى ينتهي البناء (2-5 دقائق)
3. ستحصل على URL مثل: `https://pura-call-center.vercel.app`

---

## الخطوة 4: اختبار التطبيق

بعد النشر على أي منصة:

1. **اختبر الـ Login**
   - أدخل اسم أي agent (مثل "Chandan" أو "Esmail")
   - اضغط Login

2. **أضف مريض جديد**
   - أدخل بيانات المريض
   - اضغط "Add Call"

3. **اختبر Duplicate Detection**
   - أضف نفس المريض مرة ثانية
   - تحقق أن `numberOfTrials` زاد من 1 إلى 2

4. **اختبر CSV Export**
   - اضغط "Export as CSV"
   - تحقق أن الملف يحتوي على جميع البيانات

5. **اختبر Admin Dashboard**
   - اضغط على "Admin Access" عند الـ login
   - تحقق من الإحصائيات

---

## مقارنة المنصات

| الميزة | Railway | Vercel | Render |
|--------|---------|--------|--------|
| **Backend** | ✅ | ❌ | ✅ |
| **Database** | ✅ | ❌ | ✅ |
| **Frontend** | ✅ | ✅ | ✅ |
| **Free Tier** | $5 credit | مجاني | مجاني |
| **سهولة الاستخدام** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## التوصيات

### للـ Full Stack (Backend + Frontend)
**استخدم Railway** - يوفر كل شيء في مكان واحد

### للـ Frontend فقط
**استخدم Vercel** - الأسرع والأسهل

### للـ Production
**استخدم Railway + Custom Domain**:
1. اشتر domain من GoDaddy أو Namecheap
2. أضفه في إعدادات Railway
3. تحديث DNS records

---

## Troubleshooting

### خطأ: "Unknown column 'numberOfTrials'"
**الحل**: تأكد من تشغيل `pnpm db:push` في Build Command

### خطأ: "DATABASE_URL is not set"
**الحل**: أضف DATABASE_URL في Environment Variables

### التطبيق يبدأ لكن الصفحة بيضاء
**الحل**: 
1. افتح Developer Console (F12)
2. شوف الأخطاء
3. تحقق من جميع Environment Variables

### الـ Database لا يتصل
**الحل**:
1. تحقق من DATABASE_URL صحيح
2. تأكد من إنشاء database
3. تحقق من firewall rules

---

## الخطوات التالية

بعد النشر الناجح:

1. **أضف Custom Domain** (اختياري)
2. **أعد الـ Backup** للـ database
3. **راقب الـ Logs** للأخطاء
4. **أضف SSL Certificate** (يتم تلقائياً على Vercel و Railway)

---

**تم! تطبيقك جاهز للنشر! 🚀**
