# 🧠 Student Wellness System

A privacy-first **Student Wellness System** designed to help students understand their personal wellness patterns through daily check-ins, trend analysis, and AI-assisted insights.

## ✨ Features

* 🔐 Secure authentication with JWT and password hashing
* 📝 Daily mood, stress, sleep, and energy check-ins
* 📊 Personal wellness trends with SVG visualizations
* 🔎 **What Changed?** — compares current wellness with personal historical baselines
* 🥗 Habit, activity, and screen-time tracking
* 📖 Personal journal
* 🤖 AI-assisted, explainable wellness insights
* 💡 Personalized wellness recommendations
* 📅 Daily planner and timetable
* 🔐 Privacy-first design with student data isolation
* 📱 Responsive modern UI with dark mode

## 🛠️ Tech Stack

**Frontend:** React.js, JavaScript, Tailwind CSS, SVG
**Backend:** Node.js, Express.js, REST APIs
**Database:** PostgreSQL
**Authentication:** JWT, bcrypt
**AI:** OpenAI API
**Deployment:** Vercel, Render
**Tools:** Git, GitHub, VS Code, Docker

## 🏗️ System Flow

```text
Daily Wellness Data
        ↓
Personal Baseline
        ↓
Pattern Detection
        ↓
Wellness Indicator
        ↓
Explainable AI Insight
        ↓
Personalized Recommendation
        ↓
Human Support when appropriate
```

## 🔐 Privacy & Safety

The system is designed around **privacy-first wellness analytics**. Individual wellness information remains isolated to the student's account, while institutional analytics can use aggregated/anonymized information.

> This project provides wellness insights and is **not intended to provide medical diagnosis or treatment**.

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd student-wellness-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file and add the required database, authentication, and AI API credentials.

### 4. Start the development server

```bash
npm run dev
```

## 📌 Project Goal

The goal is to move beyond a simple wellness tracker by identifying **changes in a student's personal wellness patterns** and providing explainable, personalized support at an early stage.
