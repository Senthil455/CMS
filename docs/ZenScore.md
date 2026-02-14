# Personalized Health Task App (CMS Demo)

## 1. Overview

This document describes a **small but engaging demo application** built with **React + CMS**, focused on helping users reduce stress and improve well‑being through daily health tasks.

The app demonstrates how CMS can power **dynamic schemas, user‑defined goals, and interactive business logic** without hard‑coding backend models.

---

## 2. Product Vision

**Goal:**
Help users release pressure and build healthy habits by tracking daily progress and receiving a personalized wellness score.

**Core idea:**

> Users set their own health goals, log daily progress, and receive a daily balance score with feedback.

This app is not a medical tool. It is a **habit and self‑reflection assistant**.

---

## 3. Core Features

### 3.1 Daily Health Tasks

Supported habit categories:

* 🥗 Healthy Eating
* 🏃 Exercise
* 😴 Sleep
* 🧘 Meditation
* 🙏 Gratitude

Each habit:

* Has a unit (minutes, hours, yes/no)
* Has a recommended default target
* Contributes to a daily score

---

### 3.2 User‑Defined Goals (Key Feature)

Users can:

* Customize daily targets per habit
* Adjust difficulty to fit their lifestyle
* Change goals at any time

**Example:**

* Sleep goal: 7 → 8 hours
* Meditation: 5 → 15 minutes
* Exercise: 20 → 30 minutes

This increases:

* Ownership
* Motivation
* Retention

---

### 3.3 Daily Logging

Each day, users:

* Input actual values for each habit
* Optionally add short notes
* See real‑time score updates

No fixed form — the UI is **generated dynamically** from schema definitions.

---

### 3.4 Daily Balance Score

The app calculates a **Daily Balance Score (0–100)**.

**Basic formula:**

```
HabitScore = min(Actual / Target, 1.0) × Weight
TotalScore = sum(HabitScores)
```

**Score levels:**

* 0–49  → Low / Recovering
* 50–69 → Improving
* 70–89 → Balanced
* 90–100 → Thriving

---

### 3.5 Feedback & Motivation

Based on score:

* Encouraging message
* Gentle suggestions

Examples:

* “Great balance today. Keep it up!”
* “Sleep was low — consider an earlier bedtime.”

---

### 3.6 Educational Content (Optional)

Each habit may include:

* Embedded educational videos
* Short explanations (e.g., benefits of meditation)

Videos are **embedded by link**, not hosted.

---

## 4. Data Model (CMS‑Driven)

### 4.1 HabitTemplate (Admin)

Defines available habits.

Fields:

* Name
* Description
* Unit (minutes / hours / boolean)
* DefaultTarget
* DefaultWeight
* VideoUrl (optional)

---

### 4.2 UserGoal

Stores per‑user customization.

Fields:

* UserId
* HabitTemplateId
* TargetValue
* WeightOverride (optional)

---

### 4.3 DailyLog

Stores daily user input.

Fields:

* UserId
* Date
* HabitTemplateId
* ActualValue
* Note (optional)

---

### 4.4 DailyScore (Derived)

Stores calculated result.

Fields:

* UserId
* Date
* TotalScore
* Level

---

## 5. React Application Structure

### Pages

1. **Dashboard**

   * Today’s score
   * Progress ring
   * Streak count
   * Feedback message

2. **Daily Check‑In**

   * Dynamic form generated from HabitTemplate
   * Sliders, number inputs, checkboxes

3. **Goals Settings**

   * Edit personal targets
   * Enable / disable habits

4. **Trends**

   * 7‑day / 30‑day chart
   * Best day
   * Average score

---

## 6. Demo Highlights (What to Show)

During demo:

1. Add a new habit in CMS (e.g., “Stretching”)
2. Set default target & weight
3. Refresh React app
4. New habit appears automatically
5. User sets personal goal
6. Score updates immediately

👉 No backend redeploy.

---

## 7. Why This Is a Strong CMS Demo

This app demonstrates:

* Dynamic schema‑driven UI
* User‑defined business logic
* No hard‑coded entities
* Relational data
* Aggregation & scoring
* Real user interaction

It feels like a **real product**, not a toy demo.

---

## 8. MVP Scope (7–10 Days)

**Must‑have:**

* Habit templates
* User goals
* Daily logging
* Score calculation
* Dashboard UI

**Nice‑to‑have:**

* Trends chart
* Educational videos
* Streak badges

---

## 9. Disclaimer

This application is for **habit tracking and self‑reflection only**.
It does not provide medical advice or diagnosis.

---

## 10. Future Extensions

* Adaptive goal suggestions
* Weekly reflection
* Mood tracking
* AI‑generated encouragement

---

**End of Document**
