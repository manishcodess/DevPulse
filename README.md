# DevPulse — Your AI Developer Coach

DevPulse is an AI-powered developer mentor and dashboard designed to help you stay consistent, track your progress, and level up your skills. It provides real-time statistics from GitHub, LeetCode, and GeeksforGeeks, and offers personalized coaching using the Google Gemini AI.

## Features
- **Real-Time Stats Tracking:** Fetches live data including your GitHub commits, current coding streak, top languages, and LeetCode problem-solving stats.
- **AI Coach (Powered by Gemini):** Acts as a senior developer mentor to give actionable, personalized advice based on your current stats, weak areas, and career goals.
- **AI Resume Reviewer:** Upload your resume for an instant, critical breakdown from a "senior tech recruiter" perspective, providing a score out of 10 and identifying missing keywords.
- **Daily Briefs:** Generates quick, personalized morning briefs to set your focus for the day.

## Architecture & Tech Stack
This project uses a decoupled Full-Stack architecture (JAMStack):
- **Frontend (Vite + React):** Deployed on **Vercel**. Handles the beautiful, responsive UI, state management, and direct communication with the Gemini AI.
- **Backend (Node.js + Express):** Deployed on **Render**. Acts as a proxy API to scrape GitHub stats and interact with LeetCode's GraphQL API without hitting CORS issues on the frontend.

## Local Setup & Development

### 1. Clone the repository
```bash
git clone https://github.com/manishcodess/Future-Me-AI.git
cd Future-Me-AI
```

### 2. Backend Setup
The backend serves as a proxy for GitHub and LeetCode data.
```bash
# Install backend dependencies
npm install

# Start the Express server (runs on port 3001)
npm start
```

### 3. Frontend Setup
Open a new terminal window for the frontend.
```bash
cd frontend

# Install frontend dependencies
npm install

# Create a .env file and add your Gemini API Key
echo VITE_GEMINI_API_KEY=your_api_key_here > .env

# Start the Vite development server
npm run dev
```

## Deployment Notes
- **Frontend:** Pushed to Vercel. Ensure `VITE_GEMINI_API_KEY` is added to your Vercel Environment Variables.
- **Backend:** Pushed to Render as a Web Service using the `npm start` command. Ensure the frontend `fetch` URLs point to your live Render backend URL in production.
