# SmartVerses AI 🎙️📖

AI-powered live sermon Bible verse detector.
Listens during church service → detects verses → shows English + Kinyarwanda on screen.

## Setup

1. Install dependencies:
   npm install

2. Add your API keys to .env:
   ANTHROPIC_API_KEY=your-key-here
   BIBLE_API_KEY=fyhclwtr2sTw3Qsczmcdn

3. Start the server:
   node server.js

4. Open Chrome and go to:
   http://localhost:3000

## How to use

1. Press "Start Listening" — allow microphone when asked
2. Speak naturally during service: "Let us read John 3:16"
3. Verse appears in the queue automatically
4. Operator presses "Project" to show on screen
5. Screen shows English + Kinyarwanda side by side

## Deploy to Railway (online hosting)

1. npm install -g @railway/cli
2. railway login
3. railway init
4. railway up
5. Add environment variables in Railway dashboard

## Project structure

smartverses-ai/
├── server.js          ← Express backend (API routes)
├── .env               ← Your secret API keys
├── package.json
└── public/
    ├── index.html     ← App layout
    ├── style.css      ← Styling
    └── app.js         ← Frontend logic
