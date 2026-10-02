# AdivasiSetu (आदिवासीसेतु)
> **One Platform • Five Schemes • One Scholarship Journey**  
> *Discover → Check Eligibility → Verify → Apply → Track → Receive*

---

## 📌 Project Overview

**AdivasiSetu** is an integrated, accessible, and transparent scholarship enablement portal specifically architected for Scheduled Tribe (ST) students across India. It unifies five major central and state schemes under a single digital roof, eliminating repeated documentation and information fragmentation.

---

## 🏛️ The Five Core Scholarship Schemes Supported

1. **Pre-Matric Scholarship for ST Students (Class 9 & 10)**
   - *Target:* Secondary school tribal students
   - *Income Limit:* ≤ ₹2,50,000 / year
   - *Benefits:* ₹3,500 - ₹7,000 / year plus book grants

2. **Post-Matric Scholarship for ST Students (PMS-ST)**
   - *Target:* Class 11-12, ITI, Diploma, Undergraduate & Postgraduate degrees
   - *Income Limit:* ≤ ₹2,50,000 / year
   - *Benefits:* 100% compulsory tuition fee cover + monthly maintenance allowance

3. **Top Class Education for ST Students**
   - *Target:* Notified premier institutes (IITs, IIMs, NITs, AIIMS, NLUs, etc.)
   - *Income Limit:* ≤ ₹6,00,000 / year
   - *Benefits:* Full tuition fee waiver + ₹45,000 laptop grant + living allowances

4. **National Fellowship and Scholarship for Higher Education of ST Students (NFST)**
   - *Target:* M.Phil and Ph.D. research scholars
   - *Income Limit:* ≤ ₹6,00,000 / year
   - *Benefits:* ₹37,000/month (JRF) & ₹42,000/month (SRF) + HRA & contingency grant

5. **National Overseas Scholarship for ST Candidates (NOS-ST)**
   - *Target:* Master’s & Ph.D. abroad in Top 500 QS world-ranked universities
   - *Income Limit:* ≤ ₹8,00,000 / year
   - *Benefits:* 100% international university tuition fees + $15,400 / £9,900 annual living maintenance + airfare

---

## ⚙️ Core Technical Features

### 1. 6-Factor Explainable Eligibility Engine
Rather than binary opaque decisions, AdivasiSetu scores applicants transparently across six weighted dimensions:
- **Category Match (20%):** Validates Scheduled Tribe classification & community.
- **Academic Level (20%):** Checks course and study level against scheme eligibility.
- **Family Income (20%):** Validates income ceiling compliance with published norms.
- **Qualifying Marks (15%):** Assesses previous examination performance.
- **State Domicile (10%):** Confirms central or state-specific regional coverage.
- **Document Readiness (15%):** Scans the student's Document Vault for mandatory proofs.

Matches are categorized into:
- 🟢 **Highly Matched (Score ≥ 80%)**
- 🟡 **Potential Match (Score 50% - 79%)**
- 🔴 **Needs Verification (Score < 50%)**

### 2. One-Time Document Vault
- Upload once across 6 categories: *Identity, Academic, Category, Income, Bank, and Admission*.
- File validation (PDF, JPG, PNG &le; 5 MB).
- Rejection feedback handling (e.g., blurred certificate, missing seal) with instant "Upload Again" replacement.

### 3. Live 6-Stage Application Tracker
Follows the real welfare pipeline:
```
Profile Completed → Documents Submitted → Application Submitted → Under Verification → Final Decision → Scholarship Received (DBT)
```

### 4. Admin Scrutiny & Sanction Portal
- Real-time desk review of submitted certificates.
- Direct status transitions (`Under Review`, `Approved`, `Rejected`) with official notes.
- Instant automated notifications dispatched to student accounts upon decision updates.
- Real-time analytics charts (Applications by scheme, geographic distribution by state, status funnel).

### 5. JAGO Awareness & Advisory System
- Deadline countdown alerts.
- Scheme opening announcements.
- Status update notifications.

---

## 🔑 Demo Access Credentials (1-Click Instant Login Available)

For seamless evaluation, quick demo buttons are embedded on the login page:

| Role | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **Demo Student** | `student@adivasisetu.in` | `Student@123` | Birsa Soren (Santhal Tribe, NIT Jamshedpur, B.Tech, 100% profile, active applications in tracker) |
| **Demo Admin** | `admin@adivasisetu.in` | `Admin@123` | Dr. Rameshwar Munda (Full Welfare Board Admin console, application review, scheme CRUD, analytics) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### Installation & Launch

1. **Navigate to project directory:**
   ```bash
   cd adivas-setu
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Seed database (Pre-populates 5 official schemes and demo users):**
   ```bash
   npm run seed
   ```

4. **Start the application:**
   ```bash
   npm start
   ```

5. **Open in browser:**
   - Landing Page: [http://localhost:5000/index.html](http://localhost:5000/index.html)
   - Student Dashboard: [http://localhost:5000/dashboard.html](http://localhost:5000/dashboard.html)
   - Admin Portal: [http://localhost:5000/admin.html](http://localhost:5000/admin.html)

---

## 📁 Project Directory Structure

```text
adivas-setu/
├── frontend/
│   ├── index.html                   # Landing page with journey visual & scheme cards
│   ├── login.html                   # Login with 1-click test credentials
│   ├── register.html                # Tribal student registration
│   ├── onboarding.html              # 5-step wizard & live completion meter
│   ├── dashboard.html               # Student dashboard & recommended matches
│   ├── scholarships.html            # Discovery catalog with multi-faceted filters
│   ├── scholarship-details.html     # Detailed scheme specs & application modal
│   ├── eligibility.html             # Interactive 6-factor criteria calculator
│   ├── documents.html               # Document vault with 5MB uploads & re-upload
│   ├── applications.html            # Applications center with status tabs
│   ├── application-details.html     # Live 6-stage journey tracker
│   ├── profile.html                 # Student profile & MongoDB updates
│   ├── notifications.html           # JAGO alerts & notification feed
│   ├── admin.html                   # Admin portal & analytics console
│   │
│   ├── css/
│   │   ├── style.css                # Core design system & typography
│   │   ├── auth.css                 # Auth & onboarding wizard styles
│   │   ├── dashboard.css            # Dashboard widgets & metric cards
│   │   ├── scholarships.css         # Catalog & eligibility engine layout
│   │   └── admin.css                # Admin data tables & analytics bars
│   │
│   └── js/
│       ├── main.js                  # Global API helpers & navbar state
│       ├── auth.js                  # Login, register & 5-step wizard
│       ├── dashboard.js             # Dashboard loader & match renderer
│       ├── scholarships.js          # Search, filters & application submission
│       ├── eligibility.js           # 6-factor rule-based algorithm
│       ├── documents.js             # Vault uploads, size checks & statuses
│       ├── applications.js          # Applications list & 6-stage tracker
│       └── admin.js                 # Admin CRUD, review & analytics
│
├── backend/
│   ├── server.js                    # Express app & static serving
│   ├── middleware/
│   │   └── auth.js                  # JWT & role-based route guard
│   ├── routes/
│   │   ├── auth.js                  # Registration, login & demo auth
│   │   ├── students.js              # Profile & dashboard summary
│   │   ├── scholarships.js          # Catalog & scheme CRUD
│   │   ├── eligibility.js           # Rule engine endpoint
│   │   ├── documents.js             # Multer upload & status management
│   │   ├── applications.js          # Application filing & status transitions
│   │   ├── notifications.js         # JAGO alerts & mark-read
│   │   └── admin.js                 # Dashboard stats & analytics
│   ├── models/
│   │   ├── User.js                  # User credentials & roles
│   │   ├── Student.js               # Demographic & academic dossier
│   │   ├── Scholarship.js           # Schemes & eligibility rules
│   │   ├── Application.js           # Filing dossier & 6-stage timeline
│   │   ├── Document.js              # Uploaded certificate records
│   │   └── Notification.js          # JAGO alerts & update notices
│   ├── services/
│   │   ├── eligibilityEngine.js     # 6-factor scoring service
│   │   └── notificationService.js   # Automated alert dispatcher
│   └── data/
│       └── seed.js                  # Database seeder with 5 schemes
│
├── uploads/                         # Storage directory for verified files
├── .env                             # Environment configuration
├── package.json
└── README.md
```

---

## 🛡️ Official Guidance Disclaimer
Match scores and eligibility evaluations generated by AdivasiSetu are platform-generated guidance calculated from published criteria and user profile inputs. They serve as guidance and do not replace official government authority review or guarantee final grant sanction by the Ministry of Tribal Affairs or implementing state authorities.
