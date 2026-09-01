import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Maxfiylik siyosati — e-mall.uz" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Maxfiylik siyosati" updatedAt="2026-09-01">
      <p>
        Ushbu Maxfiylik siyosati e-mall.uz platformasi (keyingi o&apos;rinlarda — &laquo;Platforma&raquo;)
        foydalanuvchilarning shaxsiy ma&apos;lumotlarini qanday yig&apos;ishi, ishlatishi va saqlashini
        tushuntiradi. Platformadan foydalanish ushbu siyosatga rozilikni bildiradi.
      </p>

      <h2>1. Qanday ma&apos;lumotlar yig&apos;iladi</h2>
      <ul>
        <li>Ro&apos;yxatdan o&apos;tishda: F.I.Sh., telefon raqami, parol (shifrlangan holda saqlanadi).</li>
        <li>Telegram orqali tasdiqlashda: Telegram chat identifikatori va Telegram ulashgan telefon raqami.</li>
        <li>Buyurtma berishda: yetkazib berish manzili, geolokatsiya koordinatalari, aloqa telefoni, izoh.</li>
        <li>Do&apos;kon uchun: do&apos;kon manzili, joylashuvi, ish vaqti, ijtimoiy tarmoq havolalari.</li>
        <li>Foydalanish davomida: sevimli mahsulotlar, buyurtmalar tarixi, brauzerning localStorage&apos;ida saqlanadigan savat ma&apos;lumotlari.</li>
      </ul>

      <h2>2. Ma&apos;lumotlardan foydalanish maqsadi</h2>
      <ul>
        <li>Hisobni yaratish, kirishni tasdiqlash va xavfsizlikni ta&apos;minlash.</li>
        <li>Buyurtmani tegishli do&apos;konga yetkazish va uning bajarilishini kuzatish.</li>
        <li>Yaqin atrofdagi do&apos;kon/kafelarni geolokatsiya asosida ko&apos;rsatish.</li>
        <li>Texnik qo&apos;llab-quvvatlash va foydalanuvchi murojaatlariga javob berish.</li>
      </ul>

      <h2>3. Ma&apos;lumotlarni uchinchi tomonlarga uzatish</h2>
      <p>
        Platforma shaxsiy ma&apos;lumotlarni sotmaydi. Ma&apos;lumotlar faqat quyidagi hollarda va
        faqat zarur hajmda uzatiladi:
      </p>
      <ul>
        <li>Buyurtma berilgan <strong>do&apos;konga</strong> — mijoz ismi, telefoni, manzili va buyurtma tarkibi.</li>
        <li>
          Do&apos;kon yetkazib berishni hamkor kuryerlik xizmati (<strong>e-courier.uz</strong>) orqali
          amalga oshirishni tanlagan bo&apos;lsa — yetkazib berish manzili, koordinatalar va aloqa
          telefoni shu xizmatga uzatiladi.
        </li>
        <li>Telegram orqali tasdiqlash uchun — Telegram Bot API (Telegram LLC) ga tasdiqlash kodi yuboriladi.</li>
        <li>Qonun talab qilgan hollarda — vakolatli davlat organlariga.</li>
      </ul>

      <h2>4. Ma&apos;lumotlarni saqlash va xavfsizlik</h2>
      <p>
        Ma&apos;lumotlar shifrlangan ulanish (HTTPS) orqali uzatiladi va parollar qaytarilmas
        (hash) ko&apos;rinishda saqlanadi. Ma&apos;lumotlar hisobingiz faol bo&apos;lgan davrda
        saqlanadi; hisobni o&apos;chirishni so&apos;rasangiz, qonun talab qilgan hollar
        (masalan, moliyaviy hisobotlar) bundan mustasno, ma&apos;lumotlaringiz o&apos;chiriladi.
      </p>

      <h2>5. Cookie va localStorage</h2>
      <p>
        Platforma tizimga kirish holatini saqlash uchun sessiya cookie&apos;laridan, savatni va
        interfeys sozlamalarini (mavzu, skript) saqlash uchun brauzerning localStorage&apos;idan
        foydalanadi. Bu ma&apos;lumotlar faqat sizning qurilmangizda saqlanadi va Platforma
        serverlariga avtomatik yuborilmaydi.
      </p>

      <h2>6. Foydalanuvchi huquqlari</h2>
      <ul>
        <li>O&apos;z ma&apos;lumotlaringiz bilan tanishish va ularni to&apos;g&apos;rilashni so&apos;rash.</li>
        <li>Hisobingizni va unga bog&apos;liq ma&apos;lumotlarni o&apos;chirishni so&apos;rash.</li>
        <li>Telegram orqali ulanishni istalgan vaqtda bekor qilish.</li>
      </ul>
      <p>Bu huquqlarni amalga oshirish uchun support@e-mall.uz manziliga murojaat qiling.</p>

      <h2>7. Siyosatga o&apos;zgartirish kiritish</h2>
      <p>
        Ushbu Maxfiylik siyosati vaqti-vaqti bilan yangilanishi mumkin. Yangi tahrir shu sahifada
        e&apos;lon qilingan paytdan kuchga kiradi.
      </p>

      <h2>8. Aloqa</h2>
      <p>Savol va murojaatlar uchun: support@e-mall.uz</p>
    </LegalPage>
  );
}
