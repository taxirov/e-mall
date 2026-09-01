import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Foydalanish shartlari — e-mall.uz" };

export default function TermsPage() {
  return (
    <LegalPage title="Foydalanish shartlari" updatedAt="2026-09-01">
      <p>
        Ushbu Foydalanish shartlari (keyingi o&apos;rinlarda — &laquo;Shartlar&raquo;) e-mall.uz saytidan
        (keyingi o&apos;rinlarda — &laquo;Platforma&raquo;) foydalanadigan barcha shaxslarga — xaridorlarga,
        do&apos;kon egalariga va ularning xodimlariga nisbatan qo&apos;llaniladi. Platformadan foydalanish
        Shartlarni to&apos;liq qabul qilishni bildiradi.
      </p>

      <h2>1. Hisob va ro&apos;yxatdan o&apos;tish</h2>
      <ul>
        <li>Hisob yaratishda faqat haqiqiy va o&apos;ziga tegishli ma&apos;lumotlar (telefon raqami, F.I.Sh.) kiritilishi shart.</li>
        <li>Telefon raqami va parolning maxfiyligini saqlash foydalanuvchining o&apos;z zimmasida.</li>
        <li>Bir kishi bir nechta hisob yaratib, tizimni suiiste&apos;mol qilmasligi kerak.</li>
      </ul>

      <h2>2. Taqiqlangan harakatlar</h2>
      <ul>
        <li>Platformaga zararli kod, avtomatlashtirilgan so&apos;rovlar (bot) orqali ortiqcha yuklama berish.</li>
        <li>Boshqa foydalanuvchi yoki do&apos;kon nomidan soxta harakat qilish.</li>
        <li>Noqonuniy, taqiqlangan yoki litsenziyasiz tovarlarni joylashtirish yoxud buyurtma qilish.</li>
        <li>Platforma orqali olingan ma&apos;lumotlardan (mijozlar bazasi, telefon raqamlari) uning maqsadidan tashqari, ruxsatsiz foydalanish.</li>
      </ul>

      <h2>3. Intellektual mulk</h2>
      <p>
        Platformaning dizayni, kod bazasi, savdo belgisi (e-mall.uz) va boshqa intellektual mulk
        obyektlari uning egasiga tegishli. Do&apos;kon o&apos;zi yuklagan logotip, banner va mahsulot
        rasmlariga bo&apos;lgan huquqlarni saqlab qoladi, ammo ularni Platformada namoyish etish
        huquqini beradi.
      </p>

      <h2>4. Xizmatning mavjudligi</h2>
      <p>
        Platforma texnik profilaktika, yangilanish yoki uchinchi tomon xizmatlaridagi (aloqa, Telegram,
        hosting) uzilishlar sababli vaqtincha ishlamasligi mumkin. Bunday holatlar uchun Platforma
        oldindan xabar berishga harakat qiladi, biroq bu majburiy emas.
      </p>

      <h2>5. Hisobni cheklash yoki yopish</h2>
      <p>
        Ushbu Shartlar yoki tegishli ommaviy oferta (
        <a href="/offer/customer" className="underline underline-offset-4">xaridor</a> /{" "}
        <a href="/offer/store" className="underline underline-offset-4">do&apos;kon egasi</a>) buzilgan
        taqdirda, Platforma foydalanuvchi hisobini ogohlantirishsiz cheklash yoki yopish huquqini
        o&apos;zida saqlaydi.
      </p>

      <h2>6. Mas&apos;uliyatni cheklash</h2>
      <p>
        Platforma vositachi sifatida ishlaydi va do&apos;konlar tomonidan taqdim etilgan ma&apos;lumot
        yoki tovar sifatiga to&apos;g&apos;ridan-to&apos;g&apos;ri javobgar emas. Platforma faoliyatidan
        kelib chiqishi mumkin bo&apos;lgan bilvosita zararlar (o&apos;tkazib yuborilgan foyda va h.k.)
        uchun javobgarlik qonun ruxsat etgan maksimal darajada cheklanadi.
      </p>

      <h2>7. Shartlarga o&apos;zgartirish kiritish</h2>
      <p>
        Platforma ushbu Shartlarga istalgan vaqtda o&apos;zgartirish kiritishi mumkin. Yangi tahrir
        shu sahifada e&apos;lon qilingan paytdan boshlab kuchga kiradi. Platformadan foydalanishni
        davom ettirish yangilangan Shartlarni qabul qilish hisoblanadi.
      </p>

      <h2>8. Amal qiluvchi qonunchilik</h2>
      <p>
        Ushbu Shartlar O&apos;zbekiston Respublikasi qonunchiligiga muvofiq tuziladi va talqin qilinadi.
        Nizolar kelishuv orqali, imkonsiz bo&apos;lganda esa O&apos;zbekiston Respublikasi sudlarida
        hal qilinadi.
      </p>

      <h2>9. Aloqa</h2>
      <p>Savol va murojaatlar uchun: support@e-mall.uz</p>
    </LegalPage>
  );
}
