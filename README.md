# Marksheet GPA Management System

A full-stack student marksheet app built with React + Vite, Express, MongoDB, JWT, and Mongoose. Credits belong only to faculty-managed `Subject` records; students can submit grades but cannot submit or update credits.

## Structure

```text
marksheet/
  client/
    src/main.jsx       React auth, student dashboard, marksheet, admin catalog
    src/styles.css     Responsive dashboard styling
    index.html
    vite.config.js
    package.json
  server/
    src/server.js      Express API and protected routes
    src/models.js      User, Student, Subject, Grade schemas
    src/auth.js        JWT authentication and role guards
    src/gpa.js         Grade mapping and weighted SGPA/CGPA logic
    src/seed.js        Demo users and official subjects
    .env.example
    package.json
  package.json
```

## Setup

Prerequisites: Node.js 18+ and MongoDB running locally or a MongoDB Atlas connection string.

```powershell
npm install
npm run install:all
Copy-Item server/.env.example server/.env
```

Set `MONGO_URI` and a strong `JWT_SECRET` in `server/.env`. Then seed sample records:

```powershell
npm run seed
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:4000`.

## Demo credentials

- Student: `student@marksheet.dev` / `Student@123`
- Teacher/admin: `admin@marksheet.dev` / `Admin@123`

## API surface

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/profile`, `GET /api/subjects`, `GET /api/grades`
- `PUT /api/grades` for the authenticated student's grades only
- `GET /api/results`, `GET /api/marksheet/:semester`
- `GET/POST /api/admin/subjects`, `PUT/DELETE /api/admin/subjects/:id`
- `GET /api/config/grades`

SGPA is calculated as `sum(credits * gradePoint) / sum(credits)`. CGPA uses the same weighted calculation across completed semesters. Subject credits are read from MongoDB at calculation time, so a faculty credit change affects future results.

## Verification

```powershell
npm run build --prefix client
node --check server/src/server.js
```

For a live test, start MongoDB, run `npm run seed`, start the app, sign in with the demo student, enter grades, and verify the SGPA and marksheet. Sign in with the admin account to add or edit official credits.
