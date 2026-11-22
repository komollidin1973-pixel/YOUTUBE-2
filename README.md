# YOUTUBE-2 — birinchi web prototip

YouTube uslubidagi, o‘zbek tilidagi kino katalogining boshlang‘ich prototipi.

## Ishga tushirish
1. ZIP arxivni oching.
2. `index.html` faylini Chrome yoki Edge brauzerida oching.
3. `Admin panel` tugmasi orqali demo katalogga kino qo‘shing.

## Hozir ishlaydigan qismlar
- Responsive qora-qizil interfeys.
- Qidiruv, janr va kategoriya filtrlari.
- Kino tafsilotlari oynasi.
- Sevimlilar (brauzer xotirasida).
- Demo admin panel: kino qo‘shish, tahrirlash va o‘chirish.
- Kiritilgan HTTPS/HTTP URL uchun iframe player oynasi.

## Muhim cheklovlar
Bu **web prototip**, Android APK emas. Admin ma’lumotlari hozircha faqat shu brauzerning `localStorage` xotirasida saqlanadi; boshqa qurilmalarga sinxronlanmaydi. Haqiqiy admin login, server ma’lumotlar bazasi, poster fayl yuklash, TV pulti bilan native boshqaruv va APK keyingi bosqichda qo‘shiladi.

Video embed faqat sayt egasi ruxsat bergan va iframe orqali ochishga ruxsat beradigan manbalarda ishlaydi. Sayt `X-Frame-Options` yoki CSP bilan iframe'ni taqiqlasa, tashqi player oynasi ochilmasligi mumkin. Himoyalangan kontent yoki pullik kirish cheklovlarini chetlab o‘tish uchun mo‘ljallanmagan.

## Keyingi bosqich
- Supabase backend + autentifikatsiya + Row Level Security.
- Native Android app: Kotlin, Jetpack Compose, AndroidX Media3.
- Android TV focus navigation va telefon UI.
- Ruxsat etilgan embed/player manbalari uchun alohida source adapterlar.


## Android TV uchun player interfeysi

Player oynasi televizor ekraniga mos keng ko‘rinish, katta fokuslanuvchi tugmalar, to‘liq ekran tugmasi va BACK/ESC orqali chiqishni qo‘llab-quvvatlaydi. Klaviatura/pultdagi F tugmasi to‘liq ekranni yoqadi. Video iframe bo‘lsa, Play/Pause, seek va ovoz boshqaruvlari tashqi video manbasining o‘z playeriga bog‘liq; YOUTUBE-2 boshqa sayt playerining ichki tugmalarini boshqara olmaydi.
