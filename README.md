# HireSense AI

AI interview assistant and smart hiring platform for technical screening, coding rounds, resume analysis, confidence detection, and HR reporting.

## Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion, Axios, React Router DOM
- Backend: Node.js, Express.js
- Database: MongoDB Atlas with Mongoose
- Authentication: JWT, bcrypt.js
- AI and analysis: OpenAI-compatible API hooks, Web Speech API, resume PDF parsing, confidence scoring service hooks
- Coding round: Monaco Editor and Judge0 adapter

## Features

- AI interview console with voice or text answers
- Answer scoring with strengths and improvement feedback
- Coding round with Monaco editor and Judge0-ready execution service
- Resume PDF analyzer with ATS score, extracted skills, and suggestions
- Confidence signal scoring for eye contact, speech flow, and attention
- HR dashboard with candidate cards, reports, recommendations, and status tracking
- JWT authentication with demo mode when MongoDB is not configured

## Project Structure

```txt
HireSenseAI/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── data/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── .gitignore
├── package.json
└── README.md
```

## Getting Started

Install dependencies:

```bash
npm run install:all
```

Create environment files:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Run both apps:

```bash
npm run dev
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`:

```bash
npm.cmd run dev
```

Frontend: `http://localhost:5173`

Backend health check: `http://localhost:5000/api/health`

## Demo Mode

The server runs without MongoDB by using mock data and demo authentication.

Default demo login:

```txt
Email: hr@hiresense.ai
Password: password123
```

To enable persistence, set `MONGODB_URI` in `server/.env`.

## API Routes

```txt
GET    /api/health
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
GET    /api/candidates
POST   /api/candidates
PATCH  /api/candidates/:id/status
POST   /api/interviews
POST   /api/interviews/analyze-answer
GET    /api/reports
POST   /api/reports
POST   /api/resumes/analyze
POST   /api/coding/run
POST   /api/coding/confidence
```

## Integration Notes

- Add `OPENAI_API_KEY` to enable live interview answer analysis.
- Add `JUDGE0_API_URL` and related Judge0 variables to enable real code execution.
- Face detection can be connected from the frontend by adding `face-api.js` models and sending normalized metrics to `/api/coding/confidence`.
- Resume analysis currently parses PDF text server-side and applies deterministic ATS scoring. The service is isolated so an AI scoring layer can be added later.

## Deployment

- Deploy `client/` to Vercel.
- Deploy `server/` to Render or Railway.
- Add `CLIENT_URL`, `MONGODB_URI`, `JWT_SECRET`, and any AI or Judge0 keys in the backend hosting environment.
- Set `VITE_API_URL` in the frontend environment to the deployed API base URL.
