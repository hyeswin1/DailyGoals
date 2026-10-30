# 🎯 DailyGoals — Habit, Fitness & Productivity Tracker

A modern, responsive, single-page daily tracking web application built with **HTML5**, **TailwindCSS**, and **Vanilla JavaScript**. All data is automatically persisted locally in `localStorage` across page reloads and browser sessions.

---

## ✨ Features Checklist

1. **Personalized Onboarding & Health Profile:**
   - Asks for user's Name.
   - Collects Health Vitals: Weight (kg), Height (cm), Dietary Restrictions / Allergies, and Primary Fitness Goal.
   - Automatically calculates your BMI and health classification.
   - Saves data to `localStorage` so returning users skip onboarding directly to the dashboard.

2. **3 Core Goal Pillars:**
   - Daily goals are divided into three essential categories:
     - 🏃 **Exercise**
     - ⚡ **Productivity**
     - 🥗 **Nutrition**
   - Quick category filtering pills, custom goal creator, strike-through completion checkboxes, and delete options.

3. **Creative Responsive Home Page & Completion Percentage:**
   - Large Hero section dynamically computing the **percentage of goals completed** for today with an animated gradient progress bar.
   - Triggers celebratory confetti when reaching 100% daily mastery!
   - Category mini-breakdown counters (e.g. `2/2 Exercise`, `3/3 Productivity`, etc.).

4. **Day-Wise Gym & Muscle Planner:**
   - Comprehensive weekly split planner (Monday to Sunday).
   - Allows selecting targeted muscle groups (Chest, Back, Legs/Quads, Shoulders, Biceps, Triceps, Core/Abs, Rest Day).
   - Dynamic exercise builder specifying exercise names, sets, reps, and weights/notes.
   - One-click presets for popular workout splits: **Push/Pull/Legs (PPL)**, **Upper/Lower (4-day)**, and **Body-Part "Bro Split"**.
   - Automatically highlights **Today's Prescribed Workout** according to the day of the week, with interactive checkboxes to tick off completed exercises as you lift.
   - Day switcher tabs allow inspecting or modifying routines for any day of the week.

5. **Log Health Metrics on Any Day:**
   - Accessible from the top header ("Update Health Info") and the Health Vitals widget.
   - Record new weight and height entries on different dates.
   - Updates your current profile, recalculates BMI, and maintains a date-stamped measurement history.

6. **Motivational Tagline in Footer:**
   - Features the inspiring DailyGoals mantra:
     > *"Transform your ambition into daily discipline — one rep, one task, one healthy choice at a time."*

7. **Design & UX Polish:**
   - Dark Mode / Light Mode toggle.
   - Glassmorphic accents and clean dashboard spacing.
   - Crisp Lucide icons.
   - Smooth animated toast alerts for user actions.
   - Mobile-first, fully responsive design.

---

## 🚀 How to Run Locally

Since this is built with standard HTML5, CSS, and Vanilla JavaScript, no build step or node package installation is required!

### Option 1: Open directly in your browser
Double-click `index.html` or open it with your favorite browser:
```bash
# On Windows PowerShell
Start-Process "index.html"
```

### Option 2: Run with any local HTTP server
If you prefer a local dev server:
```bash
# Using Python
python -m http.server 8000

# Or using Node.js npx
npx serve .
```
Then visit `http://localhost:8000` in your web browser.

---

## 🗂️ Project Structure

```
DailyGoals/
├── index.html        # Main HTML layout, modals, onboarding wizard & dashboard
├── styles.css        # Custom styles, transitions, animations, and dark mode helpers
├── script.js         # Core application logic, localStorage state manager, gym planner & BMI engine
└── README.md         # Documentation & guide
```
