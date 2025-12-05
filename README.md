# E-Government Citizen Services Portal

A full-stack web application that enables citizens to apply for government services online—eliminating the need to visit physical offices. Built with **Node.js**, **Express**, **PostgreSQL**, and **EJS** for server-side rendering, with a responsive UI powered by **Tailwind CSS**.

---

## Overview

This capstone project implements a secure, role-based e-government platform where:

- **Citizens** can apply for services (e.g., Passport Renewal, Business License), upload documents, and track request status.
- **Government Officers** review and approve/reject requests within their department.
- **Admins** manage users, services, departments, and view system-wide reports.

All data is stored in a **PostgreSQL** database, and the system includes simulated payments, notifications, and department-based access control.

---

## Features

### Authentication & Roles

- Role-based access: Citizen, Officer, Department Head, Admin
- Secure session management with `express-session`
- Password hashing using `bcryptjs`

### Service Requests

- Citizens select a service and upload required documents (PDF/JPG/PNG)
- Requests move through statuses: `Submitted` → `Under Review` → `Approved`/`Rejected`
- File upload handled via `multer` with type validation

### Simulated Payments

- Services may require a fee (e.g., Passport: AFN 1,200)
- Payment status is tracked (even if simulated)

### Notifications

- In-app notifications for status changes
- Sent automatically when officers update requests

### Reports & Analytics (Admin)

- Total requests, approvals, rejections
- Revenue from service fees
- Department-wise request statistics

### Responsive UI

- Mobile-first design with Tailwind CSS
- Dedicated dashboards for each user type
- Dark mode support

---

## Tech Stack

| Layer           | Technologies                          |
| --------------- | ------------------------------------- |
| **Frontend**    | EJS, Tailwind CSS, Vanilla JavaScript |
| **Backend**     | Node.js, Express                      |
| **Database**    | PostgreSQL                            |
| **Auth**        | Session-based, bcrypt                 |
| **File Upload** | multer (with validation)              |
| **Deployment**  | Render (Web + PostgreSQL)             |

---

## Project Structure

```
/backend
├── src/
│   ├── config/          # Database config
│   ├── controllers/     # Business logic
│   ├── middlewares/     # Auth & upload middleware
│   └── routes/          # API & page routes
├── views/               # EJS templates
├── public/              # Static assets (CSS, images)
├── uploads/             # Uploaded documents
├── server.js            # Main entry point
├── .env.example         # Environment template
└── e-gov-db.sql         # Database schema
```

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- `npm` or `yarn`

### Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/your-username/e-gov-portal.git
   cd e-gov-portal/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create the database**

   ```sql
   CREATE DATABASE e_gov_db;
   ```

4. **Run database schema**

   ```bash
   psql -U postgres -d e_gov_db -f e-gov-db.sql
   ```

5. \*\*Start the server

   ```bash
   npm start
   ```

6. Visit `http://localhost:5000`

---

## Default Accounts

After setup, create accounts via the registration page.  
**Note**: Admin accounts should be created directly in the database or via a secure admin route.

---

## Deployment (Render)

1. Push code to a **public GitHub repo**
2. Create a **Web Service** on [Render](https://render.com)
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Add environment variables in Render dashboard (copy from `.env`)
4. (Optional) Create a **PostgreSQL** instance on Render and update `DB_*` variables

---

## License

This project is for educational purposes only.

---

## Acknowledgements

- **Tailwind CSS** – For rapid, responsive UI development
- **Express.js & Node.js** – For a robust backend foundation
- **PostgreSQL** – For reliable relational data storage

---

> **No more queues. No more paperwork. Just fast, secure access to government services.**
