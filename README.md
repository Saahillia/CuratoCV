# CuratoCV: AI-Powered Resume Builder

CuratoCV is a powerful, full-stack application designed to help users craft professional, ATS-friendly resumes effortlessly. By integrating AI capabilities, customizable templates, and responsive design, CuratoCV streamlines the process of resume building from start to finish.

## Core Features

- **AI-Enhanced Content:** Utilize AI to generate professional summaries and improve resume content for better impact.
- **Dynamic Template System:** Choose from multiple professional resume templates, fully customizable to match personal branding.
- **Comprehensive Resume Sections:** Manage detailed sections including personal info, experience, education, projects, skills, and custom entries.
- **Robust Authentication:** Secure user management and authentication workflow.
- **Live Preview & Export:** Preview live changes and generate/download high-quality PDF versions of your resume.
- **Public & Private Sharing:** Easily share your resume with a public link or keep it private.
- **Professional Customization:** Detailed settings for accent colors, typography, layout spacing, and branding.

## Technical Architecture

### Frontend
- **Framework:** React / Vite
- **State Management:** Redux Toolkit
- **Styling:** Tailwind CSS
- **Routing:** React Router
- **Services:** Integrated API, Auth, Payment, and PDF Export services.

### Backend
- **Framework:** Node.js / Express
- **Database:** MongoDB / Mongoose
- **Authentication:** JWT & bcrypt
- **Integrations:**
    - **ImageKit:** Profile image hosting and processing.
    - **OpenAI/Gemini:** AI-based content enhancement.
    - **Razorpay:** Secure payment processing for premium features/subscriptions.
    - **Resend:** Automated email notifications.
    - **Puppeteer:** PDF generation and automation.

## Project Structure

```text
CuratoCV/
├── backend/                # Full-stack API & Logic
│   ├── Configs/            # Environment configurations (db, upload, security)
│   ├── Controllers/        # Business logic for auth, resumes, billing, etc.
│   ├── Middlewares/        # Auth, Validation, Upload, and Rate-limiting
│   ├── Models/             # Mongoose schemas (Resume, User, Payment, etc.)
│   ├── Routes/             # API route definitions
│   ├── Services/           # Services for AI, Billing, PDF rendering
│   ├── Tests/              # Vitest suite
│   └── server.js           # Entry point
│
├── frontend/               # React application
│   ├── src/
│   │   ├── app/            # Redux store & setup
│   │   ├── components/     # Reusable components (Forms, Templates, Billing)
│   │   ├── hooks/          # Custom react hooks (autosave, persistence, resume actions)
│   │   ├── pages/          # Application views (Dashboard, Builder, Preview, Billing)
│   │   └── services/       # API abstraction layer
│   └── package.json
│
├── tests/                  # Integration test suites
└── ...
```

## Getting Started

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Saahillia/CuratoCV.git
   cd CuratoCV
   ```

2. **Environment Setup:**
   - Copy `backend/.env.example` to `backend/.env` and update credentials.
   - Copy `frontend/.env.example` to `frontend/.env` and update API endpoints.

3. **Install Dependencies:**
   - Navigate to both `backend/` and `frontend/` folders and run `pnpm install` (or `npm install`).

4. **Run the Application:**
   - **Backend:** `pnpm start` (or `pnpm server` for dev mode)
   - **Frontend:** `pnpm dev`

## Testing
The project includes a robust testing suite using **Vitest**.
- Run all backend tests: `pnpm test` (inside `backend/` directory)
