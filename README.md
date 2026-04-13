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
