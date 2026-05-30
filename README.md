# SmartVerses AI 🎙️📖

### AI-Powered Live Bible Verse Detection and Projection System

SmartVerses AI is an AI-powered church technology platform that listens during sermons, automatically detects Bible verses — even when paraphrased — retrieves scripture references in real time, translates them into Kinyarwanda, and projects them onto screens after operator confirmation.

Built for churches, ministries, Bible studies, conferences, and personal devotion sessions.

---

## ✨ Key Features

### 🎤 Live Sermon Listening

* Real-time microphone input
* Continuous speech recognition
* Works while preaching or teaching naturally

### 🧠 AI-Powered Verse Detection

* Detects explicit Bible references
* Detects paraphrased verses
* Understands natural language context
* Supports spoken references during sermons

### 📖 Automatic Scripture Retrieval

* Fetches verses live from Bible APIs
* Supports dynamic verse lookup
* No hardcoded verse database

### 🌍 Bilingual Projection

Detected verses automatically appear in:

* English 🇬🇧
* Kinyarwanda 🇷🇼

Both languages are displayed side by side for congregational viewing.

### 👥 Operator-Controlled Projection

SmartVerses AI uses a human-in-the-loop workflow:

**Who controls projection?**

✅ AI detects verses automatically
✅ Operator reviews detected verses
✅ Operator confirms before projection

This prevents accidental or incorrect verse projection.

### 🔊 Read Aloud Capability

* Text-to-speech support
* Read projected verses aloud

### ⛪ Multiple Usage Modes

* Church Mode
* Personal Study Mode

### 📊 Session Analytics

Track:

* Session duration
* Number of detected verses
* Number of projected verses

---

# How SmartVerses AI Works

```text
Microphone Input
       ↓
Speech Recognition (Browser)
       ↓
Frontend (JavaScript)
       ↓
Express Backend APIs
       ↓
Claude AI + Bible APIs
       ↓
Translation + Verse Detection
       ↓
Operator Confirmation
       ↓
Projection Screen Output
```

---

# System Workflow

1. Press **Start Listening**
2. Speak naturally during sermon or Bible study
3. AI detects possible Bible references
4. Detected verses appear in queue
5. Operator reviews and confirms
6. Projection screen updates
7. English + Kinyarwanda versions appear together

---

# Technology Stack

## Frontend

* HTML5
* CSS3
* Vanilla JavaScript
* Web Speech API

## Backend

* Node.js
* Express.js
* REST APIs
* dotenv
* CORS

## AI Technologies

### Large Language Models (LLMs)

Used for:

* Verse detection
* Context understanding
* Translation
* Devotional generation
* Semantic matching

Provider:

* Anthropic Claude API

### Natural Language Processing (NLP)

Used for:

* Reference extraction
* Paraphrase understanding
* Semantic search
* Context analysis

### Speech Recognition AI

* Browser-based Speech-to-Text
* Continuous live listening

### Translation AI

* English → Kinyarwanda translation
* Bilingual scripture generation

---

# APIs Used

* Anthropic Claude API
* Bible API
* Scripture API

---

# Project Structure

```bash
smartverses-ai-system/
│
├── server.js
├── package.json
├── package-lock.json
├── README.md
├── setup.sh
├── .env
│
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```

---

# Installation

## 1. Clone Repository

```bash
git clone https://github.com/mariusbayizere/SmartVerses-AI-system.git
cd SmartVerses-AI-system
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create:

```bash
.env
```

Add:

```env
ANTHROPIC_API_KEY=your_key_here
BIBLE_API_KEY=your_key_here
```

## 4. Start Application

```bash
node server.js
```

Open:

```text
http://localhost:3000
```

---

# Deployment

Example deployment using Railway:

```bash
npm install -g @railway/cli

railway login

railway init

railway up
```

Add environment variables from the Railway dashboard.

---

# Use Cases

* Churches
* Conferences
* Bible Studies
* Personal Devotions
* Online Ministries
* Youth Ministries
* Live Scripture Projection

---

# Future Improvements

* Multi-language support
* Mobile application
* Offline verse caching
* Speaker identification
* Church analytics dashboard
* Livestream integration

---

# Project Category

**Type:** AI-Powered Full-Stack Web Application

Categories:

* Conversational AI
* Natural Language Processing
* Speech Recognition System
* Translation System
* Religious Technology Platform
* Human-in-the-Loop AI System

---

# Author

**Bayizere Marius**

Software Engineer | AI Enthusiast | Full Stack Developer

GitHub:

https://github.com/mariusbayizere/SmartVerses-AI-system

---

# License

MIT License

---

*"Making scripture projection smarter through Artificial Intelligence."*

