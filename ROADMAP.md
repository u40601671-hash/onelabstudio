# One Lab Studio: Poora Plan (Roadmap)

Ye file aap ki website ka poora raasta hai: ab tak kya bana, aage kya banega, kis tarteeb se, aur har hisse mein kya kya hoga.

---

## 1. Ab tak kya ban chuka hai (Phase 0, mukammal)

| Cheez | Haal |
|---|---|
| Design system (rang, fonts, cards, buttons) | Mukammal |
| Home page (hero dashboard, categories, top picks, promo, lists, pricing, FAQ, CTA) | Mukammal |
| 12 tools ki list aur har tool ki illustration | Mukammal (namoona data) |
| Tools page (search, category filter) | Mukammal |
| Blog (3 articles) | Mukammal |
| Legal pages (About, Contact, Privacy, Terms, Cookies, Disclaimer) | Mukammal |
| Cookie consent, `ads.txt`, `robots.txt`, sitemap, SEO | Mukammal |
| Ad slots ka code (AdSense, Adsterra) | Taiyar, abhi pages par laga nahi |
| Login, admin, videos, community, payments | **Abhi nahi bana** |

Ab tak sab kuch "dikhne wala hissa" (frontend) hai. Koi asli database ya login nahi, is liye tools abhi chalte nahi, sirf dikhte hain.

### Phase 1 aur 2: code taiyar, bas Supabase jorna baqi

| Cheez | Haal |
|---|---|
| Signup, login, logout, password bhool gaye, `/account` page, password badalna | **Code taiyar** |
| Header mein user menu (Log in / Sign up, ya Account / Admin / Log out) | **Code taiyar** |
| Admin panel: `/admin` dashboard, `/admin/tools` list, add, edit, delete | **Code taiyar** |
| Free/Paid ka ek-click switch, Draft/Live ka switch | **Code taiyar** |
| Home aur Tools page ka data database se (na ho to purani list) | **Code taiyar** |
| Database ka dhancha (`supabase/schema.sql`) aur setup ki hidayat (`SETUP.md`) | **Taiyar** |
| Supabase account aur 2 keys jorna | **Aap ka kaam, `SETUP.md` ke 4 qadam** |

**Update:** Supabase juda hua hai (Mumbai), `schema.sql` chal chuki hai (12 sample tools), aap ka account ban chuka hai aur admin bhi ban gaya hai. Header mein Admin, Account, Log out nazar aate hain.

### Phase 3: tools asli chalna (shuru ho gaya)

| Tool | Haal |
|---|---|
| Har tool ka apna page `/tools/<naam>` | **Tayyar** |
| Paid tool par "Pro chahiye" ka rok (Pro ya admin ko ijazat) | **Tayyar** (JavaScript tool ko asal mein lock karna mumkin nahi, sirf Python/server tools ko mumkin hai) |
| **Thumbnail Maker** (apni tasveer ya rang, text, PNG download 1280x720) | **Asli, test hua** |
| **Text Cleaner** (spaces, khali aur duplicate lines, case) | **Asli, test hua** |
| **Caption Generator** (templates se, AI nahi; 5 platforms, 4 tone) | **Asli, test hua** |
| Baaqi 9 tools | "Almost ready" ka page dikhate hain, agla qadam |
| Sitemap mein tool pages | **Shamil** |

---

## 2. Users ki qismein

| Qism | Kya kar sakta hai |
|---|---|
| **Visitor** (bina login) | Home, blog, tools ki list aur har tool ka page dekhna. **Tool chalane ke liye pehle free signup zaroori** |
| **Member** (free account) | Sab **free** tools chalana, community mein post aur message, lessons ka progress, apna kaam save |
| **Pro member** | Paid tools, ad-free website, priority support |
| **Admin** (aap) | Tools upload aur Free/Paid badalna, videos, posts moderation, users, ads ka control |

---

## 3. Technology ka faisla

| Hissa | Mera mashwara | Wajah |
|---|---|---|
| Website | Next.js (jo ab hai) | Pehle se bana hua, SEO ke liye behtareen |
| Login + Database + Files | **Supabase** | Free tier, login, database, file storage aur security ek jagah |
| Python tools chalane ke liye | Alag chhota Python server (FastAPI) Render ya Railway par | Python tools browser mein nahi chalte |
| JavaScript tools | Seedha user ke browser mein | Server ka kharcha nahi |
| Videos | YouTube (unlisted) ya Bunny.net, website mein embed | Apni video hosting bohat mehngi hoti hai |
| Payments | Mulk par mabni (neeche dekhein) | Stripe Pakistan mein seedha nahi chalta |
| Hosting | Vercel (website) + Render (Python) | Aasan, shuru mein muft ya sasta |
| Domain | `.com` (lagbhag 10 se 15 dollar saal) | AdSense ke liye zaroori |

**Payment ka masla:** agar aap Pakistan mein hain to Stripe seedha nahi mil sakta. Options: Lemon Squeezy ya Paddle (ye "merchant of record" hain, aur aap ki taraf se tax sambhalte hain), ya Payoneer. Aap ka mulk batane par main sahi raasta chun dunga.

---

## 4. Database ka dhancha (Supabase tables)

**profiles:** `id` (login se juda), `display_name`, `avatar_url`, `role` (`member` ya `admin`), `plan` (`free` ya `pro`), `created_at`

**tools:** `id`, `slug`, `name`, `category`, `description`, `icon_or_image`, `type` (`js` / `python` / `download`), `access` (`free` / `paid`), `status` (`draft` / `live`), `entry` (JS file ka path, ya Python endpoint, ya download link), `sort_order`, `created_at`

**tool_uses:** `id`, `tool_id`, `user_id`, `created_at` (kis ne kaunsa tool kitni baar chalaya)

**courses:** `id`, `title`, `description`, `cover`, `access`, `status`
**lessons:** `id`, `course_id`, `title`, `video_url` (YouTube ya Bunny), `duration`, `position`, `access`
**lesson_progress:** `user_id`, `lesson_id`, `completed_at`

**posts:** `id`, `user_id`, `title`, `body`, `created_at`, `status` (`live` / `hidden`)
**comments:** `id`, `post_id`, `user_id`, `body`, `created_at`
**likes:** `user_id`, `post_id`
**messages:** `id`, `from_user`, `to_user`, `body`, `read_at`, `created_at`
**reports:** `id`, `reporter`, `target_type`, `target_id`, `reason`, `status`

**subscriptions:** `user_id`, `provider`, `provider_id`, `status`, `current_period_end`
**site_settings:** `ads_enabled`, `adsense_client`, `adsterra_keys`, `announcement`

**Security rule (RLS):** har table par Row Level Security lagegi. Matlab user sirf apna data likh aur badal sake, aur sirf `admin` role wale tools, videos aur users badal saken.

---

## 5. Pages ka naqsha

**Public:** `/`, `/tools`, `/tools/[slug]`, `/blog`, `/blog/[slug]`, `/videos`, `/videos/[course]`, `/community`, `/pricing`, policy pages
**Account:** `/login`, `/signup`, `/forgot-password`, `/account` (profile, plan, history)
**Admin (sirf admin):** `/admin` (dashboard), `/admin/tools`, `/admin/videos`, `/admin/community`, `/admin/users`, `/admin/ads`, `/admin/settings`

---

## 6. Kaam ki tarteeb (Phases)

### Phase 1: Login aur accounts
- Signup, login, logout, password bhool gaye, email verification.
- Google se login (option).
- Navbar mein "Log in" ki jagah user ka menu (Account, Logout).
- `/account` page.
- **Tayyar hone ki nishani:** naya user signup kar ke login kar sake, aur logout par chala jaye.

### Phase 2: Admin panel aur Tools database
- Tools ki list `lib/tools.js` se nikal kar database mein.
- Admin page jahan se: naya tool add, badlo, hatao, **Free/Paid ka ek switch**, Draft/Live.
- Tool ki tasveer upload karna.
- Sirf `admin` role wala hi `/admin` dekh sake.
- **Tayyar hone ki nishani:** admin ek tool add kare aur wo home aur tools page par aa jaye.

### Phase 3: Tools asli chalna (sab se bara kaam)
- **JavaScript tools:** har tool ka apna page `/tools/[slug]`, jis mein tool browser ke andar chalta hai. Pehle 3 free tools asli banenge (Thumbnail Maker, Caption Generator, Link Shortener).
- **Python tools:** FastAPI server, jo login token check kare, aur sirf Pro user ko paid tool chalane de.
- **Download tools:** file storage mein, sirf permitted user ko link mile.
- **Free/Paid ki roke:** paid tool par non-Pro user ko "Upgrade" ka page dikhe.
- **Tayyar hone ki nishani:** free tool bina login chale, paid tool Pro ke bina band ho.

### Phase 4: Video lessons
- Admin course aur lessons banaye, YouTube/Bunny ka link de.
- Course page: video player, lessons ki list, "Mark complete".
- Progress bar har user ke liye.
- Kuch lessons free, kuch Pro.

### Phase 5: Community
- Post likhna, comment, like.
- Private messages (user se user).
- Report button, admin moderation (hide/delete), spam se bachao (rate limit).
- Profile page har member ka.

### Phase 6: Pro plan aur payments
- Pricing page ka asli "Upgrade" button.
- Payment provider ka checkout, webhook se `plan = pro` ho jaye.
- Cancel aur renew.
- Pro user ke liye ads band.

### Phase 7: Ads (jab AdSense approve ho jaye)
- Admin se ads on/off, aur ads ki jagah.
- AdSense aur Adsterra ke slots wahan lagenge jahan aap kahein.
- Pro users aur community ke andar ke pages par ads nahi.

### Phase 8: Content, SEO aur taiyari
- Kam az kam 10 se 20 achhe articles.
- Har page ka title/description, structured data, speed check (Lighthouse).
- Analytics (Google Analytics ya Plausible).
- Search Console mein sitemap bhejna.

### Phase 9: Live karna (Deploy)
- Domain khareedna, Vercel par website, Render par Python server.
- Environment keys (secrets) mehfooz rakhna.
- Backups, error monitoring, uptime check.

---

## 7. Security aur privacy ki fehrist

- Har table par RLS, admin ke liye alag role, aur admin login par 2-step verification.
- Passwords hum khud kabhi nahi rakhte, Supabase sambhalta hai.
- File upload par size aur type ki had.
- Community mein XSS se bachao (text ko saaf kar ke dikhana).
- Python server par rate limit aur token check.
- User ka data hata dene ka option (Privacy Policy ke mutabiq).
- API keys kabhi code mein nahi, sirf `.env.local` mein (ye file git mein nahi jati).

---

## 8. AdSense approval ki fehrist (monetization)

1. Asli domain, aur website live.
2. Kam az kam 10 se 20 original articles, aur kuch hafton ka traffic.
3. About, Contact, Privacy, Terms: **ban chuke hain**.
4. Khali ya "coming soon" pages na hon. Videos aur Community ke pages Phase 4 aur 5 mein asli ban jayenge.
5. Cookie consent: **ban chuka hai**.
6. Phir AdSense mein apply, aur approval ke baad `NEXT_PUBLIC_ADSENSE_CLIENT` daalna.
7. Adsterra ke sirf banner ads (popunder nahi), taake AdSense ki policy na tootay.

---

## 9. Aap se kya chahiye

| Cheez | Kab chahiye |
|---|---|
| Faisla: backend (Supabase ya kuch aur) | Abhi |
| Aap ka mulk (payment ke liye) | Phase 6 se pehle |
| Supabase ka free account banana aur do keys dena (`URL` aur `anon key`) | Phase 1 shuru karne se pehle |
| Domain ka naam aur khareedna | Phase 9 |
| Asli tools: aap ke Python, JS aur Java tools kaun se aur kaise chalte hain | Phase 3 se pehle |
| Content (articles, lessons ke videos) | Phase 4 aur 8 |

---

## 10. Khatre (risks) aur hal

| Khatra | Hal |
|---|---|
| Python tools ka server mehnga ya dheema ho sakta hai | Chhote tools se shuru, free tier, baad mein upgrade |
| Java tools browser mein nahi chalte | Download ya server par chalana, ya JS mein dobara likhna |
| AdSense reject ho sakta hai | Zyada articles, asli content, aur khali pages na hon |
| Community mein spam | Rate limit, report button, admin moderation |
| Pro payment ka masla (mulk ki wajah se) | Merchant-of-record provider (Lemon Squeezy/Paddle) |

---

## 11. Mera mashwara: pehla sprint

**Phase 1 (login) aur Phase 2 (admin aur tools database)** ek saath. Ye baqi sab kaam ki buniyad hain. Iske baad Phase 3 mein 3 asli free tools.

Andaza: Phase 1 + 2 mein sab se pehle aap ka Supabase account chahiye; us ke baad kaam seedha aage badhta hai.

## Audio Transcriber (browser version) — done
- Runs fully in the visitor's browser (Whisper via Transformers.js, WASM 8-bit), so server cost is zero and audio stays private.
- Own 30 s windows with 5 s overlap (no lost/duplicated words), timing re-alignment validated on Edge-TTS ground truth
  (median start error ≈ 50 ms, ≈ 85–88 % of words within 150 ms), ghost end-word removal, manual ±1 s fine-tune slider.
- Exports: SRT, VTT, TXT, TXT with times, word-timing JSON. Mic recording, click-to-seek, karaoke highlight.
- Limits: 30 min / 500 MB per file. Speed ≈ 0.6–0.8× real time on an average PC. Small model recommended for Urdu/Hindi/Arabic.
- Database row: supabase/add-audio-transcriber.sql

## Auto Video Editor: done (see docs/auto-video-editor.md)
- One-page browser editor with MP4 render (FFmpeg.wasm), burned-in captions, silence remover, timeline, ZIP package.
- Still to do: CLIP picture matching, music ducking, more testing on phones/Safari/Firefox and on long videos, Prompt Generator tool.
- Needs: run supabase/add-audio-transcriber.sql in Supabase (adds both tool rows).
