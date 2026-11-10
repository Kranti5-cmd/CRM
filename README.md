# Arshith Boot Camp - Student Relationship Management (CRM)

An enterprise-grade Student Relationship Management and Admissions CRM engineered specifically for **Arshith Boot Camp**. Designed for tracking student enrollments, managing fee collections in Indian Rupees (₹), running Brevo transactional email automations, and live syncing with CodeLekho Supabase student admissions.

---

## 🚀 Key Highlights & Modules

- **Executive Daily Brief & Dashboard**:
  - Live synchronization with Supabase & MongoDB Atlas.
  - Core student KPI metrics: Total Enrolled (120+), Verified Revenue (₹594), Pending Admissions (14), Free Foundations (100).
  - Course track distribution analytics with interactive donuts and Sparkline charts.
- **Reports & Analytics**:
  - Executive Daily Status Brief banner with 1-click CSV export and Brevo email dispatch to management (`arshithgroup141@gmail.com`).
  - Verified course revenue breakdowns in Indian Rupees (₹) and genuine track enrollments.
  - Multi-tab performance view covering Course Enrollments, Student Registration Sources, and Advisor Performance.
- **Student Admissions Pipeline**:
  - Student-centric visual admissions board (`/pipeline`).
  - Stages: Inbound Inquiries, Foundations Cohort, Admissions Counseling, Fee Verification, Verified Paid Enrolled, Discontinued.
  - Student cards with initials avatars, enrolled track pills, fee status (`₹99 Paid`, `₹99 Pending`, `Free Track`), and counselor attribution.
- **Student Management & Support**:
  - Real-time student directory, lead scoring, and automated support ticketing system.
- **Automated Communication Engine**:
  - Brevo transactional SMTP gateway with scheduled executive email reports.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js, Express.js, MongoDB Atlas (Mongoose ODM)
- **Database & Sync**: MongoDB Atlas + CodeLekho Supabase PostgreSQL
- **Email Service**: Brevo API & SMTP

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MongoDB Atlas database instance

### 1. Clone the repository
```bash
git clone https://github.com/Kranti5-cmd/CRM.git
cd CRM
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Brevo API credentials
npm start
```

### 3. Frontend Setup
```bash
cd ../client
npm install
npm run dev
```
The client will start at `http://localhost:5173` and communicate with the backend at `http://localhost:5000`.

---

## 🔒 Security
- All sensitive environment credentials (`.env`) are strictly excluded from version control.
- Refer to `server/.env.example` for all configurable environment variables.
