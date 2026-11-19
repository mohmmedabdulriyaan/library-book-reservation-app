# Frontend (React + Vite + Bootstrap)

The app students and the admin use. It talks to the backend at `http://<this computer>:5000/api`.

## Run it

Start the **backend** first (in another terminal: `cd backend` then `npm run dev`). Then:

```bash
cd frontend
npm install      # only the first time
npm run dev
```

Open **http://localhost:5173**.

## Folders

```
frontend/src/
├── api/axios.js           backend address + adds the login token to every request
├── context/               AuthContext (who is logged in), ToastContext (pop-up messages)
├── components/            small reusable pieces (BookCover, StatCard, PasswordInput, ...)
├── layouts/               app frame: top bar on laptop, bottom tabs on phone
├── pages/auth/            Welcome, Student login, Sign up, Admin login
├── pages/student/         Home, Search, My Books, Profile
├── pages/admin/           Dashboard, Books, Reservations, Students, Profile
├── App.jsx                all the page routes
└── index.css              colours and styles (change --primary to restyle the app)
```
