# YOUTUBE-2 — Poster preview

## Nima qiladi
- Kino kartochkasi ustiga sichqoncha olib borilganda yoki Android TV pultida fokus tushganda preview boshlanadi.
- Preview 12 soniyadan keyin avtomatik to‘xtaydi va poster qaytadi.
- Preview ovozi yoqilgan (65% balandlikda).
- Brauzer avtomatik ovozli ijroni bloklasa, TV pultidagi yo‘nalish tugmasini bosib fokusni posterga olib boring; ayrim brauzerlarda birinchi marta ovozni ruxsatlash talab qilinishi mumkin.
- Fokus boshqa kartaga o‘tganda avvalgi preview darhol to‘xtaydi.
- Kino OK/click bilan tanlangandagina asosiy player ochiladi.

## Supabase'da bir martalik sozlash
Supabase → SQL Editor → New query bo‘limida `preview-columns.sql` ichidagi SQL'ni ishga tushiring.
Bu `movies` jadvaliga `preview_url` va `preview_start_seconds` ustunlarini qo‘shadi.

## Admin panelda
- `Video URL`: asosiy film manbasi.
- `Poster ichidagi qisqa preview URL`: alohida MP4 lavha bo‘lsa kiriting (eng ishonchli usul).
- `Preview boshlanishi (daqiqada)`: preview_url bo‘sh bo‘lsa asosiy direct video qaysi daqiqadan boshlanishi. Standart 40 daqiqa.
- Davomiyligi 12 soniya, avtomatik.

## Muhim cheklov
Poster ichidagi preview faqat to‘g‘ridan-to‘g‘ri MP4/WebM yoki qo‘llab-quvvatlanadigan HLS (.m3u8) manbada ishlaydi.
YouTube/Vimeo yoki boshqa saytlarning iframe/embed URL'idan boshqa domen ichidagi videoni ajratib olish brauzer xavfsizligi sababli mumkin emas. Bunday kino uchun alohida `preview_url` (to‘g‘ridan-to‘g‘ri MP4 lavha) kerak.
Preview ovoz bilan ishlaydi (65% balandlikda); asosiy filmni bosganda avvalgi player oqimi o‘zgarmaydi. Eslatma: ayrim brauzerlar foydalanuvchi harakatidan oldin ovozli autoplayni bloklashi mumkin. Bunday holatda TV pultida posterga yo‘nalish tugmasi bilan fokus bering yoki bir marta OK bosing; agar brauzer baribir bloklasa, uning autoplay siyosatini chetlab o‘tib bo‘lmaydi.
