import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Do'kon egasi uchun ommaviy oferta — e-mall.uz" };

export default function StoreOfferPage() {
  return (
    <LegalPage title="Do'kon egasi uchun ommaviy oferta" updatedAt="2026-09-01">
      <p>
        Ushbu hujjat O&apos;zbekiston Respublikasi Fuqarolik kodeksining 369-moddasiga muvofiq ommaviy oferta
        hisoblanadi. e-mall.uz platformasida (keyingi o&apos;rinlarda — &laquo;Platforma&raquo;) do&apos;kon
        sifatida ro&apos;yxatdan o&apos;tish shu shartlarni to&apos;liq va so&apos;zsiz qabul qilish
        (aksept) hisoblanadi.
      </p>

      <h2>1. Asosiy tushunchalar</h2>
      <ul>
        <li><strong>Platforma</strong> — e-mall.uz onlayn vitrina, marketplace va POS (kassa) xizmatlari majmuasi.</li>
        <li><strong>Do&apos;kon</strong> — Platformada ro&apos;yxatdan o&apos;tgan, o&apos;z nomidan mahsulot sotuvchi tadbirkor yoki tashkilot.</li>
        <li><strong>Katalog mahsuloti</strong> — barcha do&apos;konlar uchun umumiy, bir marta yaratiladigan va qayta ishlatiladigan mahsulot yozuvi.</li>
      </ul>

      <h2>2. Oferta predmeti</h2>
      <p>
        Platforma Do&apos;konga quyidagilardan foydalanish imkoniyatini beradi: o&apos;z subdomeni ostida
        onlayn vitrina (<code>{"{do'kon}"}.e-mall.uz</code>), kassa (POS) tizimi, ombor va inventar hisobi,
        kuponlar, hisobotlar hamda onlayn buyurtmalarni qabul qilish.
      </p>

      <h2>3. Ro&apos;yxatdan o&apos;tish va faollashtirish</h2>
      <ol>
        <li>Do&apos;kon egasi ro&apos;yxatdan o&apos;tishda haqiqiy F.I.Sh., telefon raqami va do&apos;kon nomini kiritadi, Telegram orqali tasdiqlaydi.</li>
        <li>Yangi do&apos;kon &laquo;Tasdiqlanishi kutilmoqda&raquo; (PENDING) holatida ro&apos;yxatga olinadi.</li>
        <li>Super Admin tomonidan tekshiruvdan so&apos;ng do&apos;kon &laquo;Faol&raquo; (ACTIVE) holatiga o&apos;tkaziladi va onlayn vitrina ochiladi.</li>
      </ol>

      <h2>4. Do&apos;konning huquq va majburiyatlari</h2>
      <ul>
        <li>Faqat qonuniy yo&apos;l bilan olingan, sifat sertifikatlari talab qilinadigan tovarlar uchun tegishli hujjatlarga ega mahsulotlarni joylashtirish.</li>
        <li>Mahsulot narxi, qoldig&apos;i va tavsifi uchun to&apos;liq javobgarlik.</li>
        <li>Umumiy katalogdagi mahsulotga tuzatish kerak bo&apos;lsa, uni birlashtiruvchi tahrir so&apos;rovi (Product Edit Request) orqali yuborish — boshqa do&apos;konlar yaratgan yozuvni to&apos;g&apos;ridan-to&apos;g&apos;ri o&apos;zgartirmaslik.</li>
        <li>Onlayn qabul qilingan buyurtmalarni belgilangan muddatda ko&apos;rib chiqish va mijozga holatini (tasdiqlangan/jo&apos;natilgan/bekor qilingan) bildirish.</li>
      </ul>

      <h2>5. Buyurtmalarni yetkazib berish</h2>
      <p>
        Do&apos;kon onlayn buyurtmalarni o&apos;z kuryeri bilan yoki Platformaning hamkor xizmati
        (e-courier.uz) orqali yetkazib berishni tanlashi mumkin — bu sozlama do&apos;kon
        boshqaruv panelida istalgan vaqtda o&apos;zgartiriladi. e-courier orqali yetkazib berish
        yoqilgan bo&apos;lsa, buyurtma &laquo;Jo&apos;natildi&raquo; deb belgilanganda mijoz manzili va
        aloqa telefoni avtomatik ravishda kuryerlik xizmatiga uzatiladi.
      </p>

      <h2>6. To&apos;lov va komissiya</h2>
      <p>
        Platformadan foydalanish shartlari (tarif, komissiya yoki obuna to&apos;lovi bo&apos;lsa) alohida
        kelishuv yoki Platforma boshqaruv panelida e&apos;lon qilinadi. Mijozdan olinadigan to&apos;lovni
        qabul qilish va u bilan hisob-kitob qilish tartibini Do&apos;konning o&apos;zi belgilaydi — Platforma
        pul mablag&apos;larini ushlab turmaydi.
      </p>

      <h2>7. Hisobni to&apos;xtatib qo&apos;yish va bekor qilish</h2>
      <p>
        Do&apos;kon quyidagi hollarda &laquo;To&apos;xtatilgan&raquo; (SUSPENDED) holatiga o&apos;tkazilishi
        mumkin: qonunchilik yoki ushbu oferta talablarini buzish, mijozlardan asossiz shikoyatlarning
        takrorlanishi, soxta yoki noto&apos;g&apos;ri mahsulot ma&apos;lumotlarini joylashtirish. Do&apos;kon
        egasi o&apos;z hisobini istalgan vaqtda yopishni so&apos;rab murojaat qilishi mumkin.
      </p>

      <h2>8. Mas&apos;uliyat</h2>
      <p>
        Do&apos;kon o&apos;zi joylashtirgan mahsulot va uning mijozga yetkazilishi bilan bog&apos;liq
        barcha huquqiy va moliyaviy javobgarlikni mustaqil ko&apos;taradi. Platforma texnik infratuzilma
        va vositachilik xizmatini ko&apos;rsatadi, tovar sifati yoki bitim natijasi uchun javobgar emas.
      </p>

      <h2>9. Maxfiylik</h2>
      <p>
        Do&apos;kon va uning mijozlariga oid ma&apos;lumotlarning qayta ishlanishi{" "}
        <a href="/privacy" className="underline underline-offset-4">Maxfiylik siyosati</a>ga muvofiq amalga oshiriladi.
      </p>

      <h2>10. Nizolarni hal qilish</h2>
      <p>
        Ushbu oferta yuzasidan kelib chiqadigan nizolar muzokaralar yo&apos;li bilan, kelishuvga
        erishilmagan taqdirda O&apos;zbekiston Respublikasi qonunchiligiga muvofiq sud tartibida
        hal qilinadi.
      </p>

      <h2>11. Amal qilish muddati va o&apos;zgartirishlar</h2>
      <p>
        Ushbu oferta do&apos;kon hisobi faol bo&apos;lgan davrda amal qiladi. Platforma ofertaga
        bir tomonlama o&apos;zgartirish kiritishi mumkin — yangi tahrir shu sahifada e&apos;lon
        qilingan paytdan kuchga kiradi.
      </p>

      <h2>12. Aloqa</h2>
      <p>Savol va murojaatlar uchun: support@e-mall.uz</p>
    </LegalPage>
  );
}
