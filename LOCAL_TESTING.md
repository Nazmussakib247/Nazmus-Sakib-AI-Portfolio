# Portfolio Local Testing Guide

এই guide অনুযায়ী আগে পুরো portfolio local machine-এ test করুন। Hosting করার প্রয়োজন নেই।

## 1. Project folder খুলুন

Windows PowerShell খুলে চালান:

```powershell
cd D:\03_Porfolio
```

## 2. Dependencies install করুন

Project-এ `pnpm` ব্যবহার করা হয়েছে:

```powershell
pnpm install
```

যদি `pnpm` command না পাওয়া যায়:

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
```

## 3. Full database ছাড়া basic UI check

শুধু static UI, layout, animation, responsive design এবং asset check করতে:

```powershell
pnpm run dev
```

তারপর browser-এ খুলুন:

```text
http://localhost:3000
```

তবে Awards, Admin CMS, contact messages এবং সব database-backed live content ঠিকভাবে test করতে valid MySQL/PlanetScale database connection লাগবে।

## 4. Local MySQL database ব্যবহার

XAMPP/WAMP/MySQL চালু করে `portfolio` নামে একটি empty database তৈরি করুন। উদাহরণ:

```sql
CREATE DATABASE portfolio;
```

তারপর PowerShell-এ connection string সেট করুন। Local MySQL username `root`, password empty এবং port `3306` হলে:

```powershell
$env:DATABASE_URL="mysql://root:@127.0.0.1:3306/portfolio"
```

Password থাকলে:

```powershell
$env:DATABASE_URL="mysql://root:YOUR_PASSWORD@127.0.0.1:3306/portfolio"
```

তারপর schema apply করুন:

```powershell
pnpm run db:push
```

এটি `db/schema.ts` থেকে database tables এবং নতুন Awards metadata columns তৈরি করবে।

## 5. Seed data insert করুন

Project-এ seed script আলাদা command হিসেবে configured না থাকলে:

```powershell
pnpm exec tsx db\seed.ts
```

Seed সফল হলে profile, projects, experiences, certificates, awards, skills এবং writings-এর initial data database-এ থাকবে। Existing awards থাকলে নতুন image এবং LinkedIn source metadata backfill হবে।

## 6. Local server চালু করুন

Database setup শেষ হওয়ার পরে:

```powershell
pnpm run dev
```

Public portfolio:

```text
http://localhost:3000
```

Admin login:

```text
http://localhost:3000/admin/login
```

Development fallback password:

```text
nazmus-admin-2026
```

Production-এর আগে `ADMIN_PASSWORD` environment variable দিয়ে এটি অবশ্যই পরিবর্তন করবেন:

```powershell
$env:ADMIN_PASSWORD="your-strong-private-password"
```

## 7. Admin CMS test checklist

Admin login করার পরে প্রতিটি tab যাচাই করুন:

| Tab | Test |
|---|---|
| Profile | Name, title, bio, email, university, avatar এবং CV update করে public page refresh করুন। |
| Site Settings | Hero text, availability badge, SEO এবং section visibility পরিবর্তন করুন। |
| Projects | একটি project edit, create, reorder এবং delete করে public Projects section যাচাই করুন। |
| Skills | Skill add/edit/reorder করে floating skills এবং skills section দেখুন। |
| Experience | Experience, education বা industrial training edit করে Journey section refresh করুন। |
| Certificates | Certificate image upload, edit এবং credential link test করুন। |
| Awards | Award add/edit/delete/reorder করে public Awards section যাচাই করুন। Awards এখন database-only। |
| Writings | Medium/blog entry add বা edit করে Blog section পরীক্ষা করুন। |
| Messages | Contact form submit করে Messages tab-এ unread message আসে কি না দেখুন। |

## 8. Public UI test checklist

Public page-এ নিচের বিষয়গুলো পরীক্ষা করুন:

1. Navbar-এর প্রতিটি link সঠিক section-এ যায় কি না।
2. Galaxy background এবং floating technology logos কোনো text বা button ঢেকে ফেলছে কি না।
3. n8n logo safe position-এ আছে কি না।
4. Projects-এর View Details সাধারণ left-click-এ modal খুলছে কি না।
5. Project modal-এর content mouse wheel বা trackpad দিয়ে scroll হচ্ছে কি না এবং background অপ্রত্যাশিতভাবে scroll করছে কি না।
6. GitHub এবং Live Video links নতুন tab-এ খুলছে কি না।
7. Certificates-এর horizontal navigation এবং animated airplane cue কাজ করছে কি না।
8. Certificate এবং Awards image click করলে lightbox খুলছে কি না।
9. AI Assistant-এর typewriter intro, suggestion chips, chat response এবং mobile layout কাজ করছে কি না।
10. Contact form validation, success message এবং database message storage পরীক্ষা করুন।
11. Mobile width, tablet width এবং desktop width-এ layout ভেঙে যাচ্ছে কি না দেখুন।

## 9. Automated validation

Project root থেকে চালান:

```powershell
pnpm run check
pnpm run build
```

দুটিই সফল হলে TypeScript এবং production bundle clean আছে। Build-এর সময় chunk-size warning থাকলে সেটি warning; failure নয়।

## 10. Common errors

### `vite is not recognized`

Dependencies install হয়নি। চালান:

```powershell
pnpm install
```

### `No package.json`

ভুল folder-এ আছেন। নিশ্চিত করুন:

```powershell
cd D:\03_Porfolio
Get-Item package.json
```

### `DATABASE_URL is required`

এই PowerShell window-তে database variable সেট হয়নি:

```powershell
$env:DATABASE_URL="mysql://root:@127.0.0.1:3306/portfolio"
```

### `TypeError: Invalid URL`

Placeholder বা invalid value ব্যবহার করা হয়েছে। এটি ভুল:

```powershell
$env:DATABASE_URL="আপনার-MySQL-or-PlanetScale-connection-string"
```

এটির পরিবর্তে valid `mysql://...` URL দিতে হবে।

### Database connection refused

MySQL/XAMPP service চালু আছে কি না, port `3306` সঠিক কি না এবং database name ঠিক আছে কি না যাচাই করুন।

## 11. দুইটি PowerShell window ব্যবহার করুন

Development-এর জন্য সাধারণত দুইটি PowerShell window সুবিধাজনক:

**Window 1 — server:**

```powershell
cd D:\03_Porfolio
$env:DATABASE_URL="mysql://root:@127.0.0.1:3306/portfolio"
pnpm run dev
```

**Window 2 — checks বা database commands:**

```powershell
cd D:\03_Porfolio
$env:DATABASE_URL="mysql://root:@127.0.0.1:3306/portfolio"
pnpm run check
pnpm run build
```

একটি PowerShell window বন্ধ করলে সেই window-তে সেট করা `$env:` variables মুছে যাবে।

## 12. Test শেষ হলে

Hosting করার আগে নিশ্চিত করুন:

- Public portfolio-এর সব section সঠিক data দেখাচ্ছে।
- Admin থেকে পরিবর্তন করে public page-এ পরিবর্তন দেখা যাচ্ছে।
- Awards-এর data database থেকে আসছে এবং fallback নেই।
- Contact message database-এ জমা হচ্ছে।
- Images এবং CV upload ঠিকভাবে কাজ করছে।
- `pnpm run check` এবং `pnpm run build` সফল হচ্ছে।
- Real production `DATABASE_URL` এবং strong `ADMIN_PASSWORD` আলাদা করে প্রস্তুত আছে।

এই পুরো workflow local-only; কোনো hosting বা public deployment command এখানে প্রয়োজন নেই।

## Copyright

All rights Reserve by Nazmus Sakib.

GitHub: https://github.com/Nazmussakib247

LinkedIn: https://www.linkedin.com/in/nazmussakib247/
