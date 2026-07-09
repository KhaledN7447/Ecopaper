# 🌿 EcoPaper — منصة إدارة النفايات الورقية الجامعية

## إعداد المشروع (خطوات كاملة)

### 1. تثبيت Node.js
روح [nodejs.org](https://nodejs.org) وحمّل **LTS**

### 2. فك الضغط وتثبيت الحزم
```bash
cd ecopaper
npm install
```

### 3. إنشاء مشروع Supabase
1. روح [supabase.com](https://supabase.com) وأنشئ مشروعاً جديداً
2. من **SQL Editor** الصق محتوى `supabase/schema.sql` واضغط **Run**
3. شغّل أيضاً هذا لإيقاف RLS مؤقتاً:
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_requests DISABLE ROW LEVEL SECURITY;
```

### 4. ضبط المتغيرات البيئية
افتح `.env.local` وحط:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...YOUR_LEGACY_ANON_KEY
```
⚠️ استخدم **Legacy anon key** من Settings → API → Legacy anon, service_role API keys

### 5. إنشاء المستخدمين
في **Authentication → Users → Add User** أنشئ:
- manager@uni.edu / Test1234!
- staff@uni.edu / Test1234!
- dept@uni.edu / Test1234!

ثم في **SQL Editor** شغّل (غيّر الـ UUIDs للصحيحة من profiles table):
```sql
-- اعرف الـ IDs أولاً
SELECT id, name, email FROM auth.users;

-- ثم حدّث
UPDATE profiles SET role = 'facility_manager', name = 'خالد العمري'
WHERE id = 'UUID_OF_MANAGER';

UPDATE profiles SET role = 'facility_staff', name = 'أحمد السالم'
WHERE id = 'UUID_OF_STAFF';

UPDATE profiles SET
  role = 'department_user',
  name = 'سارة المالكي',
  department_id = (SELECT id FROM departments WHERE name = 'شؤون الطلاب')
WHERE id = 'UUID_OF_DEPT';
```

### 6. تشغيل المشروع
```bash
npm run dev
```
افتح [http://localhost:3000](http://localhost:3000)

---

## الأدوار والصفحات
| الدور | الصفحة بعد الدخول |
|---|---|
| facility_manager | /dashboard |
| facility_staff | /queue |
| department_user | /requests |

## النشر على Vercel
```bash
npx vercel
```
أضف المتغيرات البيئية في Vercel Dashboard.
