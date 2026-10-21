# Database (Supabase) jorne ke 4 aasan qadam

Jab tak ye 4 qadam nahi hote, website purani sample list ke saath chalti rehti hai aur kuch nahi toota. Login aur admin panel sirf "Database not connected" ka paigham dikhate hain.

Kul waqt: lagbhag 10 minute. Sab kuch muft hai.

---

## Qadam 1: Supabase account aur project

1. Browser mein **supabase.com** kholen aur **Start your project** par click karein.
2. Apne email ya GitHub se account banayein.
3. **New project** dabayein:
   - **Name:** `onelabstudio`
   - **Database password:** koi mazboot password likhein aur **kahin mehfooz kar lein** (baad mein kaam aa sakta hai)
   - **Region:** apne sab se qareebi mulk ka chunein
4. Project banne mein 1 se 2 minute lagte hain. Intezar karein.

## Qadam 2: Database ka dhancha banana

1. Supabase ke baayen menu mein **SQL Editor** par jayein, phir **New query**.
2. Is project ki file `supabase/schema.sql` kholen, **poora text copy** karein aur SQL Editor mein paste kar dein.
3. **Run** dabayein. Neeche "Success" aana chahiye.

Isse tools aur users ke tables ban jate hain, aur 12 sample tools bhi aa jate hain.

## Qadam 3: Do keys website ko dena

1. Supabase mein **Project Settings** (gear) > **API** par jayein.
2. Wahan se do cheezein copy karein:
   - **Project URL** (`https://xxxx.supabase.co` jaisa)
   - **anon public** key (lambi si line)
3. Project folder mein `.env.local.example` ki **copy** banayein aur us ka naam `.env.local` rakhein.
4. `.env.local` mein ye do line bharein:
   ```
   NEXT_PUBLIC_SUPABASE_URL=aap_ka_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=aap_ki_anon_key
   ```
5. Website ko band kar ke dobara chalayein (`npm run dev`).

**Zaroori:** `service_role` wali key **kabhi** kisi ko na dein aur kahin na likhein. Website ko sirf `anon` key chahiye.

Phir Supabase mein **Authentication > URL Configuration** par:
- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** `http://localhost:3000/auth/callback` add karein.

(Jab website live ho jaye to yahan apna asli domain bhi add karna hoga.)

## Qadam 4: Khud ko admin banana

1. Website par **Sign up** karein (apna email aur password).
   - Agar email confirm karne ko kahe to inbox mein link par click karein. Tez test ke liye aap Supabase mein **Authentication > Providers > Email** mein "Confirm email" band bhi kar sakte hain.
2. Supabase **SQL Editor** mein ye ek line chalayein (apna email badal kar):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'YOUR_EMAIL@example.com');
   ```
3. Website par dobara login karein. Ab upar **Admin** ka button dikhega.

---

## Ab kya kya kaam karna chahiye (test ki fehrist)

- [ ] `/signup` se naya account ban jaye, aur `/login` se login ho.
- [ ] Login ke baad upar "Account" aur "Log out" dikhe.
- [ ] `/account` par apna naam, email, plan aur role dikhe.
- [ ] `/admin` sirf admin ko khule. Dusre user ko "admins only" dikhe.
- [ ] `/admin/tools` mein 12 tools dikhein.
- [ ] Kisi tool ka **FREE/PAID** button dabane se wo turant badal jaye.
- [ ] "Add tool" se naya tool banayein, **Live** karein, aur wo home aur Tools page par aa jaye.
- [ ] Kisi tool ko **Draft** karein to wo website se chhup jaye.

## Agar kuch na chale

- Website "Database not connected" dikhaye: `.env.local` ka naam aur keys check karein, aur `npm run dev` dobara chalayein.
- Login ke baad bhi Admin na dikhe: Qadam 4 ki SQL line dobara chalayein (email sahi likha ho).
- "Row level security" ka error: Qadam 2 dobara chalayein.
