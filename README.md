# PayShield

A premium, Full-Stack fintech web application delivering a fraud-aware donation and creator platform. PayShield is architected using bleeding-edge stack dynamics with a dual-tier separation of concerns, providing extreme scalability, rigorous backend token rotation authentication, and high-fidelity 3D Split-Screen interactive React interfaces.

## 🚀 Technology Stack

### Frontend Architecture
- **Framework**: Next.js 14 (App Router enabled)
- **Styling**: Tailwind CSS & Vanilla CSS (Vibrant Glassmorphism, premium dark modes)
- **UI Components**: Shadcn UI & Base UI
- **Animations**: Framer Motion (for massive 3D model rotation and element orchestration)
- **State & Forms**: React Hook Form with Zod schema validation
- **Routing**: Client-side URL param tracking & strictly hard-redirected Context Providers

### Backend Architecture
- **Core Server**: Node.js & Express.js (RESTful API)
- **Database**: PostgreSQL (Containerized via Docker on local port 5433)
- **ORM**: Prisma (Fully typed edge-to-edge schemas for models like `User` and `Session`)
- **Security**: 
  - `bcryptjs` hashing for all passwords.
  - Custom JWT Rotation Strategy allowing infinite session persistence across `accessToken` and HttpOnly `refreshToken` cookies securely.
  - Strict Cross-Origin (CORS) whitelisting properly piped through a direct API proxy loop in Next.js config.
<<<<<<< HEAD

---

## 🎨 User Interface & Design

The frontend strictly enforces a **Premium SaaS Identity** (`#0A0F1E` backgrounds, `blue-500/40` ambient glows, noise texture overlaps). 

**1. The Split-Screen Authentication Flow:**
Whenever a user lands on the site natively, they encounter the `SplitAuthLayout`. 
- **Left Panel**: Floating typography and real-time fraud metrics (`₹2.4Cr Protected`, `94% Fraud blocked`), creating an immersive trust-based ambiance. 
- **Right Panel**: Glassmorphism authentication blocks equipped with active state retention, password strength identifiers, and responsive tab swapping.

**2. The Central Dashboard:**
An integrated application shell holding the authenticated state.
- Features a side navigation array (`Home`, `Transactions`, `Settings`).
- Includes a fully dynamic `SidebarProfile` that reacts to the underlying specific global UI Context, permanently mounting your registered name / email in the bottom-left layout to eliminate hardcoding.

---

## ⚙️ Core System Features

| Feature | Description | Status |
| :--- | :--- | :---: |
| **User Sign Up** | End-to-end `User` creation via Zod inputs through to Postgres. Validates duplicate emails. | ✅ Live |
| **User Login** | JWT Payload assignment mapping the specific Role & session ID to an HTTP-Only secure cookie. | ✅ Live |
| **Refresh Engine** | Invisible API endpoint returning fresh JWT `accessTokens`. Triggered by Next.js component mounts proxying the secure cookie seamlessly. | ✅ Live |
| **Interactive Dashboard** | A fully enclosed UI route layout for authenticated manipulation of PayShield instances. | ✅ Live |
| **Visual Core** | Animated 3D gradients and glowing metric widgets completely overriding default Tailwind styles. | ✅ Live |

---

## 🛠️ Step-by-Step Local Setup

To run PayShield perfectly locally on your machine, launch the backend database first so Prisma has context, then run both servers simultaneously.

### 1. The Database (Docker)
Since local Windows environments occasionally bind ghostly generic PostgreSQL instances to default ports, PayShield handles its core database natively on **Port 5433** to escape port conflicts permanently.

Wipe any old local instances (if any exist) and boot up the persistent database terminal:
```bash
docker rm -f payshield-postgres-clean
docker volume prune -f
docker run --name payshield-postgres-clean -e POSTGRES_PASSWORD=mysecret123 -p 5433:5432 -d postgres
```

### 2. The Backend Server
Launch the main Prisma connection & Express engine:

```bash
cd backend
```

Ensure `backend/.env` is identical to:
```env
DATABASE_URL="postgresql://postgres:mysecret123@localhost:5433/payshield?schema=public"
JWT_SECRET="payshield_dev_access_secret_min_32_chars!!"
JWT_REFRESH_SECRET="payshield_dev_refresh_secret_min_32!"
PORT=5000
FRONTEND_ORIGIN="http://localhost:3000"
NODE_ENV=development
```

Push the Prisma Schema directly into the DB:
```bash
npx prisma db push
```

Start the Engine:
```bash
npm run dev
```

### 3. The Frontend Client
Start your Next.js application side-by-side with your backend:

```bash
cd frontend
```

*Note: In `frontend/next.config.mjs`, all traffic explicitly pointed at `/api/*` is natively rewritten as an invisible backend proxy intercepting into `http://localhost:5000/api/*`. This perfectly circumnavigates cross-port CORS blocks built into modern browsers like Google Chrome!*

Start the React loop:
```bash
npm run dev
```

> **The system is now fully live! Navigate to `http://localhost:3000`, click Register, and witness the full stack flow!**

---

## Quick Start (Full Stack)

Start all infrastructure in one command:

```bash
docker-compose up -d
```

Start the backend:

```bash
cd backend && npm run dev
```

Start the frontend:

```bash
cd frontend && npm run dev
```

Seed campaigns (optional):

```bash
cd backend && npx tsx src/seed.ts
```

View Kafka topics (Kafka UI):

```text
open http://localhost:8080
```

Point `backend/.env` `DATABASE_URL` at `localhost:5433` when using the Compose Postgres service above.
=======
>>>>>>> 381246e71cc1129493062d6422b9522e4cde374a
