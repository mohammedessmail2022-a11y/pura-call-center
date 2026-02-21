# نشر PURA Call Center على Railway - خطوات مفصلة

## الخطوة 1: إعداد GitHub Personal Repository

### 1.1 إنشاء Personal Access Token
1. اذهب إلى: https://github.com/settings/tokens
2. اضغط **Generate new token** → **Generate new token (classic)**
3. أعط اسم: `railway-deployment`
4. اختر الصلاحيات:
   - ✅ `repo` (كل الخيارات تحتها)
   - ✅ `workflow`
5. اضغط **Generate token**
6. **انسخ الـ token** (لن تراه مرة أخرى!)

### 1.2 إنشاء Repository جديد
1. اذهب إلى: https://github.com/new
2. أدخل الاسم: `pura-call-center`
3. اختر **Public**
4. **لا تختر** "Initialize with README"
5. اضغط **Create repository**

### 1.3 دفع الكود إلى GitHub

افتح Terminal/Command Prompt وشغل الأوامر دي:

```bash
cd /path/to/pura-call-center

git remote remove origin
git remote add origin https://github.com/mohammedessmail2022/pura-call-center.git
git branch -M main
git push -u origin main
```

عند السؤال عن Password، استخدم **Personal Access Token** اللي نسخته في الخطوة 1.1

---

## الخطوة 2: نشر على Railway

### 2.1 اذهب إلى Railway
1. افتح: https://railway.app
2. اضغط **Login** (إذا كان عندك حساب)
3. أو اضغط **Sign Up** (إذا كنت جديد)
4. اختر **Continue with GitHub**

### 2.2 ربط GitHub
1. اضغط **Authorize railway**
2. أعطه الصلاحيات

### 2.3 إنشاء Project جديد
1. في لوحة التحكم، اضغط **Create New Project**
2. اختر **Deploy from GitHub repo**
3. اضغط **Configure GitHub App**
4. اختر حسابك `mohammedessmail2022`
5. اختر Repository: `pura-call-center`
6. اضغط **Deploy**

Railway سيبدأ البناء تلقائياً.

---

## الخطوة 3: إضافة PostgreSQL Database

### 3.1 إضافة Database Service
1. في لوحة التحكم، اضغط **+ New Service**
2. اختر **Database**
3. اختر **PostgreSQL**
4. اضغط **Create**

Railway سينشئ database تلقائياً.

### 3.2 نسخ DATABASE_URL
1. اضغط على PostgreSQL service
2. اذهب إلى **Variables** tab
3. ابحث عن `DATABASE_URL`
4. **انسخها** (ستحتاجها في الخطوة التالية)

---

## الخطوة 4: إضافة Environment Variables

### 4.1 فتح Web Service Settings
1. اضغط على **pura-call-center** service
2. اذهب إلى **Variables** tab

### 4.2 أضف المتغيرات التالية

**1. DATABASE_URL** (من الخطوة 3.2)
```
DATABASE_URL=postgresql://user:password@host:port/database
```

**2. JWT_SECRET** (اختر واحد عشوائي)
```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

أو شغل الأمر ده لإنشاء واحد عشوائي:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**3. VITE_APP_TITLE**
```
VITE_APP_TITLE=PURA Call Center
```

**4. VITE_APP_LOGO**
```
VITE_APP_LOGO=https://pura.ai/wp-content/uploads/2025/06/logo.png
```

**5. NODE_ENV**
```
NODE_ENV=production
```

### 4.3 حفظ المتغيرات
اضغط **Save** بعد إضافة كل متغير

---

## الخطوة 5: تعديل Build و Start Commands

### 5.1 فتح Settings
1. اضغط على **pura-call-center** service
2. اذهب إلى **Settings** tab

### 5.2 تعديل Build Command
ابحث عن **Build Command** وغيّره إلى:
```
pnpm install && pnpm db:push
```

### 5.3 تعديل Start Command
ابحث عن **Start Command** وغيّره إلى:
```
pnpm start
```

### 5.4 حفظ الإعدادات
اضغط **Save**

---

## الخطوة 6: مراقبة النشر

### 6.1 مشاهدة Logs
1. اذهب إلى **Deployments** tab
2. اضغط على أحدث deployment
3. اضغط **View Logs**
4. انتظر حتى ترى: "Server running on http://localhost:3000/"

### 6.2 الحصول على الـ URL
بعد النشر الناجح:
1. اذهب إلى **Settings** tab
2. ابحث عن **Domains**
3. ستجد URL مثل: `https://pura-call-center.up.railway.app`

---

## الخطوة 7: اختبار التطبيق

### 7.1 فتح التطبيق
1. اذهب إلى الـ URL من الخطوة 6.2
2. يجب أن ترى صفحة Login

### 7.2 اختبر الميزات الأساسية

**اختبار 1: Login**
```
أدخل اسم: Chandan
اضغط Login
```

**اختبار 2: إضافة مريض**
```
Patient Name: Ahmed Ali
Appointment ID: APT-001
Appointment Time: 14:30
Status: Confirmed
اضغط Add Call
```

**اختبار 3: Duplicate Detection**
```
أضف نفس المريض مرة ثانية
تحقق أن numberOfTrials زاد من 1 إلى 2
```

**اختبار 4: CSV Export**
```
اضغط Export as CSV
تحقق أن الملف يحتوي على البيانات
```

**اختبار 5: Admin Dashboard**
```
عند الـ login، اختر Admin Access
تحقق من الإحصائيات
```

---

## حل المشاكل الشائعة

### ❌ خطأ: "Build failed"

**السبب**: مشكلة في الـ dependencies

**الحل**:
```bash
# في جهازك المحلي
rm -rf node_modules pnpm-lock.yaml
pnpm install
git add .
git commit -m "Fix dependencies"
git push
```

---

### ❌ خطأ: "Unknown column 'numberOfTrials'"

**السبب**: قاعدة البيانات لم تتحدث

**الحل**:
1. في Railway، اذهب إلى **pura-call-center** service
2. اذهب إلى **Settings**
3. تأكد أن Build Command يحتوي على `pnpm db:push`
4. اضغط **Redeploy**

---

### ❌ خطأ: "DATABASE_URL is not set"

**السبب**: متغير البيئة لم يتم إضافته

**الحل**:
1. اذهب إلى **Variables** tab
2. تأكد من إضافة `DATABASE_URL`
3. اضغط **Redeploy**

---

### ❌ التطبيق يبدأ لكن الصفحة بيضاء

**السبب**: مشكلة في الـ frontend

**الحل**:
1. افتح Developer Console (F12)
2. اذهب إلى **Console** tab
3. شوف الأخطاء
4. أرسلها إليّ

---

### ❌ الـ Database لا يتصل

**السبب**: مشكلة في الاتصال

**الحل**:
1. تحقق من `DATABASE_URL` صحيح
2. تأكد من إنشاء PostgreSQL service
3. اضغط **Redeploy**

---

## الخطوات التالية

بعد النشر الناجح:

### 1️⃣ أضف Custom Domain (اختياري)
```
في Railway Settings:
- اذهب إلى Domains
- اضغط Add Domain
- أدخل اسم النطاق الخاص بك
```

### 2️⃣ راقب الـ Logs
```
في Railway:
- اذهب إلى Logs
- راقب الأخطاء بانتظام
```

### 3️⃣ أعد الـ Backup للـ Database
```
في Railway:
- اذهب إلى PostgreSQL service
- اضغط Backup
```

---

## معلومات مهمة

| المعلومة | القيمة |
|---------|--------|
| **Email** | mohammedessmail2022@gmail.com |
| **GitHub Username** | mohammedessmail2022 |
| **Repository** | pura-call-center |
| **Platform** | Railway |
| **Database** | PostgreSQL |
| **Status** | جاهز للنشر |

---

**تم! تطبيقك جاهز للنشر على Railway! 🚀**

إذا واجهت أي مشاكل، أخبرني بالخطأ وسأساعدك!
