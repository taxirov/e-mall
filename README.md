# e-mall.uz

Do'konlar ro'yxatdan o'tib, o'z onlayn vitrinasi (marketplace) va ichki savdo uchun POS tizimini boshqaradigan ko'p-do'konli (multi-tenant) SaaS platforma.

## Texnologiyalar

- **Next.js 16 (App Router) + TypeScript** — asosiy web ilova, Vercel'da joylashadi
- **PostgreSQL + Prisma ORM** — ma'lumotlar bazasi (lokal dev uchun `prisma dev`, production uchun Neon tavsiya etiladi)
- **Auth.js (NextAuth v5)** — telefon raqam + parol bilan autentifikatsiya, rollarga asoslangan ruxsatlar
- **Socket.IO** (`realtime-server/`) — alohida kichik Node/Express server, real-time hodisalar uchun (POS sotuvlar, ombor qoldig'i, buyurtmalar)
- **Tailwind CSS + shadcn/ui (Base UI)** — mobile-first interfeys

## Rollar

- **SUPER_ADMIN** — platforma egasi: do'konlarni tasdiqlaydi/bloklaydi (`/dashboard/admin`)
- **OWNER** — do'kon egasi: mahsulotlar, kategoriyalar, sotuvchilar, buyurtmalar, hisobotlar (`/dashboard/owner`)
- **SELLER** — sotuvchi: faqat POS'dan foydalanadi (`/dashboard/pos`)
- **CUSTOMER** — xaridor: do'kon vitrinasidan onlayn buyurtma beradi

## Lokal ishga tushirish

### 1. Asosiy ilova

```bash
npm install
npx prisma dev -d          # lokal Postgres serverni fonda ishga tushiradi
npx prisma migrate dev     # jadvallarni yaratadi
npm run seed                # Super Admin akkaunt yaratadi (+998900000000 / admin123)
npm run dev
```

`.env` faylida quyidagilar avtomatik sozlangan (lokal dev uchun):

- `DATABASE_URL` — `prisma dev` bergan lokal Postgres manzili
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `NEXT_PUBLIC_ROOT_DOMAIN=e-mall.uz`
- `NEXT_PUBLIC_REALTIME_URL=http://localhost:4000`
- `REALTIME_JWT_SECRET`, `REALTIME_API_KEY`

**Production'ga chiqishdan oldin barcha secret qiymatlarni albatta almashtiring.**

### 2. Realtime server

Ikkinchi terminalda:

```bash
cd realtime-server
npm install
npm run dev
```

### 3. Do'kon subdomenlarini lokalda sinash

Do'kon vitrinasi `{slug}.e-mall.uz` ko'rinishida ishlaydi. Lokalda buni `*.localhost` orqali sinash mumkin (qo'shimcha sozlash shart emas, zamonaviy brauzerlar buni avtomatik `127.0.0.1`ga yo'naltiradi):

```
http://test-market.localhost:3000
```

## Deploy qilish

### Asosiy ilova — Vercel

1. Repo'ni Vercel'ga ulang, quyidagi environment variable'larni kiriting:
   - `DATABASE_URL` — Neon Postgres connection string
   - `NEXTAUTH_SECRET` — tasodifiy uzun string (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` — `https://e-mall.uz`
   - `NEXT_PUBLIC_ROOT_DOMAIN` — `e-mall.uz`
   - `NEXT_PUBLIC_REALTIME_URL` — Render'dagi realtime server manzili (masalan `https://emall-realtime.onrender.com`)
   - `REALTIME_JWT_SECRET`, `REALTIME_API_KEY` — realtime-server'dagi bilan bir xil bo'lishi shart
   - `BLOB_READ_WRITE_TOKEN` — mahsulot rasmlari uchun (Vercel Blob storage yoqilgach avtomatik beriladi)
2. `npx prisma migrate deploy` — production bazasida migratsiyalarni qo'llash (Vercel build buyrug'iga qo'shish tavsiya etiladi: `prisma migrate deploy && next build`)
3. `npm run seed` — production bazasida Super Admin yarating (yoki qo'lda SQL orqali)

### Ma'lumotlar bazasi — Neon

[neon.tech](https://neon.tech) da bepul Postgres baza yarating, connection string'ni `DATABASE_URL`ga qo'ying.

### Realtime server — Render

1. [render.com](https://render.com) da yangi **Web Service** yarating, repo'ning `realtime-server/` papkasini root sifatida ko'rsating
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Environment variable'lar: `REALTIME_JWT_SECRET`, `REALTIME_API_KEY` (asosiy ilovadagi bilan bir xil), `ALLOWED_ORIGINS=https://e-mall.uz,https://*.e-mall.uz`
5. Eslatma: Render tekin tarifi 15 daqiqa harakatsizlikdan keyin serverni "uxlatadi", birinchi ulanishda ~30-60s kechikish bo'lishi mumkin. Foydalanuvchilar ko'paysa Railway ($5/oy, doim yonik) yoki maxsus serverga ko'chirish mumkin — kod o'zgarmaydi, faqat deploy manzili va env variable'lar ko'chadi.

### Domen va subdomenlar — Cloudflare + Vercel

1. `e-mall.uz` domenini Cloudflare'ga ulang (nameserver sifatida)
2. Cloudflare DNS'da wildcard yozuv qo'shing: `*.e-mall.uz` → Vercel bergan CNAME manzili, **proxy o'chirilgan holatda (DNS-only, kulrang bulut)** — bu muhim, aks holda Vercel SSL sertifikatlarini avtomatik chiqara olmaydi
3. Vercel loyiha sozlamalarida **Domains** bo'limiga `e-mall.uz` va `*.e-mall.uz` qo'shing
4. Shundan so'ng har bir yangi do'kon ro'yxatdan o'tganda qo'shimcha DNS sozlash shart emas — wildcard allaqachon barcha subdomenlarni qamrab oladi, faqat bazada `Store.slug` yozuvi kifoya

## Hozircha qamrovga kirmagan (keyingi bosqichlar)

- To'lov integratsiyasi (Click, Payme) va onlayn kassa/fiskal chek (soliq.uz)
- Ko'p tillilik (hozircha faqat o'zbekcha)
- Mahsulot rasmlarini yuklash UI (hozircha `images` maydoni bo'sh massiv sifatida saqlanadi)
