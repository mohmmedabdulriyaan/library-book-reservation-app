# Library Book Reservation App

A college project where students can search and reserve library books, and an admin can manage books and see who reserved or took each book.

**Stack:** React (Vite) + Bootstrap, Node.js + Express.js, MongoDB (Mongoose), tested with Postman.

**Live app:** https://college-library-ieko.onrender.com (free server, the first load can take up to 50 seconds).

## Features

**Students:** sign up with name, roll number and batch · search with filters · reserve a book · **pickup code + QR** to show at the counter · **waitlist** when a book is out (auto-reserved when a copy returns) · **renew** once for 7 days · due dates, overdue and **late fines** · **notification bell** · profile, password, **dark mode**.

**Admin:** dashboard with stats and **charts** (most borrowed books, books per batch) · add / edit / delete books · **who has each book** + waitlist · reservations table with student **name, roll number and batch** · **issue by pickup code** · return, cancel, mark fine paid · students list with history · **export to CSV (Excel)**.

**Extra features:**
- **Wishlist:** save books for later with the heart button.
- **Reading stats:** books read, favourite category, a 6-month chart, a month streak and a reader level (Beginner, Bookworm, Scholar).
- **Book requests:** students ask for books the library doesn't have and +1 each other's requests. The admin approves, marks them added, or rejects them, and everyone who voted gets an alert.
- **E-Library:** PDFs of notes, previous question papers and e-books. The admin uploads them, and students read them in the app.
- **Announcements:** the admin posts notices and every student gets an alert. Important notices are also emailed.
- **Borrowing limit by batch:** for example, batch 4 can hold 5 books while the others hold 3.
- **Email reminders:** due soon, overdue, waitlisted book ready and important notices, plus a welcome email at sign up, sent with Brevo (optional).
- **Import books from CSV:** add many books at once (Excel: File > Save As > CSV).

**Real covers:** loaded by ISBN from Amazon or Open Library, with a printed-style cover when none exists.

**Works like an app:** bottom tabs on phone, top menu on laptop · **installable (PWA)** · offline banner and cached screens · loading placeholders.

**Automatic rules** (backend checks every 10 minutes, see `backend/config/constants.js`):
- Reserved books not collected in **2 days** expire and go to the next student in the waitlist.
- "Due soon" alert 2 days before the due date, and an "Overdue" alert to the student and admin.
- Late fine: **Rs 2 per day** after the due date.

## Folder structure

```
Library Book Reservation App/
├── frontend/                React app (see frontend/README.md)
├── desktop/                 Windows desktop app (.exe) made with Electron
├── render.yaml              free online deploy settings (Render.com)
└── backend/                 Node + Express API
    ├── config/              db.js (MongoDB connection), constants.js (library rules)
    ├── controllers/         the logic for each API
    ├── middleware/          login check (JWT), PDF upload (multer), error handling
    ├── models/              Student, Admin, Book, Reservation, Waitlist, Notification,
    │                        Wishlist, Announcement, BookRequest, Resource, Setting
    ├── services/            library rules, background job, email, batch limits
    ├── routes/              URL paths for each API
    ├── utils/               small helper functions
    ├── seed/                books, demo students, demo extras + seed.js
    ├── postman/             Postman collection to test every API
    ├── server.js            starts the backend (Express app)
    ├── .env.example         sample environment variables
    └── package.json
```

## Run the backend

You need **Node.js** (v18 or newer) and **MongoDB Community Server** running on your laptop.

```bash
cd backend
npm install
copy .env.example .env      # Windows (on Mac/Linux use: cp .env.example .env)
npm run seed                # adds books, admin, demo students and demo data
npm run dev                 # starts the backend with nodemon
```

Open **http://localhost:5000/api/health**. You should see `"status": "ok"` and `"database": "connected"`.

## Run the frontend

Keep the backend running, open a **second terminal** (click **+** in the VS Code terminal panel) and run:

```bash
cd frontend
npm install      # only the first time
npm run dev
```

Open **http://localhost:5173**. Choose **Student** to sign up or log in, or **Admin** (`admin` / `admin123`).

## Run as ONE app (production mode)

For the demo, the backend can serve the finished app itself, so everything is on **one address**:

```bash
cd frontend
npm run build          # makes frontend/dist (do this again after changing frontend code)
cd ../backend
npm start              # prints "Serving the frontend from frontend/dist"
```

Open **http://localhost:5000**. The desktop .exe and your phone use this same address.

## Use it on your phone

**Option A: same Wi-Fi (quick, for testing)**

1. Do "Run as ONE app" above.
2. In a terminal run `ipconfig` and copy the **IPv4 Address** of your Wi-Fi (for example `192.168.1.7`).
3. On the phone (same Wi-Fi) open **http://192.168.1.7:5000**.
4. If Windows asks about the firewall for Node.js, click **Allow** (Private networks).

This works like a website. Installing it as an app needs HTTPS, so use option B for that.

**Option B: put it online for free (works anywhere, installable app)** - see "Deploy online" below.
After deploying, open your `https://....onrender.com` link on the phone in Chrome, tap **⋮ > Add to Home screen / Install app**. It opens full screen with its own icon, like a real app.

## Install as an app on the laptop (PWA)

Open the app at **http://localhost:5000** (or your online link) in Chrome or Edge and click the **install** icon in the address bar. It opens in its own window and still shows saved screens if the internet drops.

## Deploy online (free): MongoDB Atlas + Render

**1. Database in the cloud (MongoDB Atlas)**

1. Sign up at **mongodb.com/cloud/atlas** and create a **free (M0) cluster**.
2. **Database Access:** add a user (username + password, write them down).
3. **Network Access:** add IP address `0.0.0.0/0` (allow from anywhere, needed for Render).
4. **Connect > Drivers:** copy the connection string and put your password in it, and the database name `library_app` before the `?`:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/library_app?retryWrites=true&w=majority`
5. Fill it with demo data from your laptop (VS Code terminal, PowerShell):
   ```powershell
   cd backend
   $env:MONGO_URI="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/library_app?retryWrites=true&w=majority"
   npm run seed
   ```
   (This only affects that one terminal. Your local `.env` is unchanged.)

**2. The app online (Render)**

1. Push the project to GitHub (see below).
2. Sign up at **render.com** with GitHub, click **New > Blueprint** and pick your repository. Render reads `render.yaml`.
3. When asked, paste your Atlas connection string into **MONGO_URI**. (Email settings are optional; leave them empty.)
4. Click **Apply**. The first build takes about 5 minutes. You get a link like **https://college-library.onrender.com**.

The free plan "sleeps" after 15 minutes without visitors, so the first visit after that takes up to a minute to wake up. Open it a minute before your demo.

## Desktop app (.exe)

The `desktop/` folder makes a Windows program that opens the app in its own window (Electron).

1. Choose which address it opens in `desktop/config.json`:
   - `"http://localhost:5000"` - your laptop (do "Run as ONE app" first), or
   - `"https://college-library.onrender.com"` - your online link (works on any PC, no MongoDB needed).
2. Build it:
   ```bash
   cd desktop
   npm install        # first time only, downloads Electron (about 100 MB)
   npm start          # try it in a window first
   npm run dist       # makes the .exe files
   ```
3. Open `desktop/release/`:
   - **College Library Setup 1.0.0.exe** - installer (adds a desktop shortcut and Start menu entry)
   - **College-Library-Portable.exe** - runs without installing (good for a pen drive)

If the server is not running, the app shows "Connecting to the library..." and keeps trying by itself. Windows may show "Windows protected your PC" because the app is not code-signed: click **More info > Run anyway**.

## Push to GitHub

1. On **github.com** click **New repository**, name it `library-book-reservation-app`, keep it **empty** (no README), and create it.
2. In VS Code open a terminal in the project folder (`D:\PROJECTS\Library Book Reservation App`) and run:
   ```bash
   git init
   git add .
   git commit -m "Library Book Reservation App"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/library-book-reservation-app.git
   git push -u origin main
   ```
3. Later changes: `git add .` then `git commit -m "what you changed"` then `git push`.

`.gitignore` keeps `node_modules`, builds, the `.exe` files and your `.env` (passwords) out of GitHub. Before pushing, `git status` should **not** list any `.env` file.

## Default admin account

| Username | Password   |
|----------|------------|
| `admin`  | `admin123` |

Change this password before showing the project publicly.

## How login works

1. The app sends roll number + password (student) or username + password (admin).
2. The backend checks the hashed password with **bcrypt** and sends back a **JWT token**.
3. The app sends that token with every protected request in this header:
   `Authorization: Bearer <token>`
4. The token is valid for 7 days.

## API list

Base URL: `http://localhost:5000/api`

### Auth

| Method | URL | Who | What it does |
|---|---|---|---|
| POST | `/auth/student/register` | Anyone | Student sign up: `name, rollNumber, batch, email (optional), password` |
| POST | `/auth/student/login` | Anyone | Student login: `rollNumber, password` |
| POST | `/auth/admin/login` | Anyone | Admin login: `username, password` |
| GET | `/auth/me` | Logged in | My profile |
| PUT | `/auth/me` | Student | Update `name, batch, email` |
| PUT | `/auth/change-password` | Logged in | `currentPassword, newPassword` |
| POST | `/auth/student/forgot-password/question` | Public | `rollNumber` (returns the security question) |
| POST | `/auth/student/forgot-password/reset` | Public | `rollNumber, answer, newPassword` (logs the student in) |
| PUT | `/auth/security-question` | Student | `currentPassword, question, answer` |

### Books

| Method | URL | Who | What it does |
|---|---|---|---|
| GET | `/books` | Anyone | List books. Options: `?search=java&category=Programming&available=true&sort=title` |
| GET | `/books/categories` | Anyone | List of categories |
| GET | `/books/:id` | Anyone | One book |
| POST | `/books` | Admin | Add a book |
| PUT | `/books/:id` | Admin | Edit a book (changing `totalCopies` also fixes `availableCopies`) |
| DELETE | `/books/:id` | Admin | Delete a book (not allowed while someone has it) |

### Reservations (student)

| Method | URL | What it does |
|---|---|---|
| POST | `/reservations` | Reserve a book: `{ "bookId": "..." }` |
| GET | `/reservations/my` | My reservations (optional `?status=reserved`) |
| PUT | `/reservations/:id/cancel` | Cancel my reservation (only while "reserved") |
| PUT | `/reservations/:id/renew` | Add 7 days to the due date (once, not overdue, nobody waiting) |

### Admin

| Method | URL | What it does |
|---|---|---|
| GET | `/admin/stats` | Numbers for the dashboard |
| GET | `/admin/reservations` | All reservations with student **name, roll number, batch**. Options: `?status=overdue&search=<roll or name>&batch=2` (status can also be `fines` or `expired`) |
| POST | `/admin/reservations/issue-by-code` | Issue using the student's pickup code: `{ "code": "K7P2QX" }` |
| PUT | `/admin/reservations/:id/issue` | Student took the book: reserved → issued (due date = 14 days) |
| PUT | `/admin/reservations/:id/return` | Student returned it: issued → returned |
| PUT | `/admin/reservations/:id/cancel` | Cancel a reservation: reserved → cancelled |
| PUT | `/admin/reservations/:id/fine-paid` | Student paid the late fine |
| GET | `/admin/books/:id/reservations` | Who has this book now + waitlist + history |
| GET | `/admin/students` | All students with how many books they hold (`?search=&batch=`) |
| GET | `/admin/students/:id` | One student and all their reservations |
| PUT | `/admin/students/:id/reset-password` | Backup: gives the student a temporary password (e.g. `lib-4821`) |

### Waitlist (student)

| Method | URL | What it does |
|---|---|---|
| POST | `/waitlist` | Join the waitlist: `{ "bookId": "..." }` (only when 0 copies are left) |
| GET | `/waitlist/my` | My waitlist with my position in line |
| DELETE | `/waitlist/:id` | Leave the waitlist |

### Notifications (student or admin)

| Method | URL | What it does |
|---|---|---|
| GET | `/notifications` | My alerts (latest 50) + unread count |
| GET | `/notifications/unread-count` | Number for the bell |
| PUT | `/notifications/:id/read` | Mark one as read |
| PUT | `/notifications/read-all` | Mark all as read |

### Library rules

Set in `backend/config/constants.js`:

- A student can hold at most **3 books** (reserved + issued) by default. The admin can change this for each batch in the app. A student can't reserve the same book twice.
- A reserved book must be collected within **2 days**, or it expires.
- An issued book is due back in **14 days**. It can be renewed **once** for 7 more days if nobody is waiting.
- Late fine: **Rs 2 per day** after the due date.
- `availableCopies` goes down by 1 on reserve and back up on cancel, return or expiry. A returned copy goes to the first student in the waitlist automatically.

### Extra features

| Method | URL | Who | What it does |
|---|---|---|---|
| GET / POST | `/wishlist` | Student | My wishlist / add `{ bookId }` |
| DELETE | `/wishlist/:bookId` | Student | Remove from wishlist |
| GET | `/reservations/stats` | Student | Reading stats |
| GET / PUT | `/admin/settings` | Admin | Borrowing limits `{ defaultLimit, batchLimits: [{ batch, limit }] }` |
| GET | `/announcements` | Logged in | List notices |
| POST / DELETE | `/announcements`, `/announcements/:id` | Admin | Post `{ title, message, important }` / delete |
| GET | `/requests` | Logged in | Book requests, most wanted first |
| POST | `/requests` | Student | Request `{ title, author, reason }` (adds a vote if it already exists) |
| PUT | `/requests/:id/vote` | Student | Add or remove my +1 |
| PUT | `/requests/:id/status` | Admin | `{ status: approved / added / rejected / pending, adminNote }` |
| POST | `/books/bulk` | Admin | Import `{ books: [ ... ] }` (bad rows and duplicate ISBNs are skipped) |
| GET | `/resources` | Logged in | E-Library PDFs |
| GET | `/resources/:id/file` | Anyone | Open the PDF |
| POST | `/resources` | Admin | Upload a PDF, max 15 MB (form-data: `file`, `title`, `type`, `subject`, `year`, `description`) |
| DELETE | `/resources/:id` | Admin | Delete a PDF |

### Email reminders (optional)

The app works without email. Emails are sent with **Brevo** (free, 300 emails a day). It works on Render's free plan, which blocks Gmail SMTP.

1. Sign up at **brevo.com**.
2. **Senders, Domains & Dedicated IPs > Senders > Add a sender**: add your Gmail and click the link Brevo emails you.
3. Your name (top right) > **SMTP & API > API Keys > Generate a new API key**.
4. Add these to `backend/.env` (laptop) and to **Render > Environment** (online), then restart:

```
BREVO_API_KEY=xkeysib-your-key
EMAIL_FROM="College Library <yourname@gmail.com>"
```

New students who give an email get a welcome email. Students with an email also get due-soon, overdue, waitlist and important notice emails. **Admin > Profile > Borrowing limits and email** shows whether email is ON.

## Test with Postman

1. Open Postman → **Import** → choose `backend/postman/Library-API.postman_collection.json`.
2. Make sure the backend is running (`npm run dev`).
3. Run the requests **from top to bottom** (or right-click the collection → **Run**).
   Login requests save the tokens automatically, so you don't need to copy them.
4. Each request has a small test that shows green (pass) or red (fail).

The collection creates one test student (`2503A51133` / `student123`). Running it again is fine: the sign up request will fail with "already registered", and the login after it will still work.

## Notes

- The seed script adds 48 books, the admin, **12 demo students** (roll numbers `2503A51101` to `2503A51112`, password `student123`) with their reservations, plus announcements, book requests, wishlists, 5 sample PDFs and batch limits.
- Running `npm run seed` again resets all of that. Students you created yourself are kept, but their reservations are cleared.
- E-Library PDFs are saved inside MongoDB (max 15 MB each), so they keep working after deploying.
