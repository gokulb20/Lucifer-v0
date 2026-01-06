# Lucifer iOS Companion App - PRD

## Overview

A companion iOS app for Lucifer AI that serves as a **control panel** and **data feeder**. This is NOT a chat app - all conversation happens via iMessage. This app's purpose is to:
1. Feed contextual data from the phone to Lucifer's backend
2. Provide a dashboard to view integration status and memories
3. Give manual controls for sharing content with Lucifer

## Tech Stack
- **Framework**: React Native / Expo (via Rork)
- **Backend**: Existing Next.js API at `{BACKEND_URL}`
- **Auth**: Simple API key or device token (no user accounts needed - single user app)

---

## Core Features

### 1. Dashboard / Home Screen
A simple overview showing:
- Connection status to Lucifer backend (green/red indicator)
- Last sync timestamp
- Quick stats: "X memories stored", "Last location: Home"
- Today's mood (if logged)
- Quick action buttons

### 2. Location Sharing (Background)
**Permission Required**: Location (Always)

- Continuously track location in background
- Send location updates to `POST /api/context/location`
- Only send when location changes significantly (>100m)
- Reverse geocode to get place names
- Show current location on dashboard

**Payload**:
```json
{
  "lat": 37.7749,
  "lng": -122.4194,
  "name": "Coffee Shop on Market St"
}
```

### 3. Health Data Sync
**Permission Required**: HealthKit

Sync daily health data to `POST /api/context/health`:
- Steps count
- Sleep hours (from sleep analysis)
- Active minutes
- Heart rate (average)
- Workouts (type, duration, calories)

**Sync frequency**: Once per hour or on app open

**Payload**:
```json
{
  "steps": 8432,
  "sleepHours": 7.5,
  "activeMinutes": 45,
  "heartRate": 72,
  "workouts": [
    {"type": "Running", "duration": 30, "calories": 320}
  ]
}
```

### 4. Activity Recognition
**Permission Required**: Motion & Fitness

Track current activity and send to `POST /api/context/activity`:
- Stationary
- Walking
- Running
- Driving
- Cycling

**Payload**:
```json
{
  "activity": "walking",
  "confidence": 0.95
}
```

### 5. Contacts Sync
**Permission Required**: Contacts

- One-time sync of contacts on setup
- Option to re-sync manually
- Send to `POST /api/context/contacts`
- Only sends name, phone, email (for context, not storage)

**Payload**:
```json
{
  "contacts": [
    {"id": "1", "name": "Mom", "phone": "+1234567890", "email": "mom@email.com"}
  ]
}
```

### 6. Photo Sharing
**Permission Required**: Photos

Manual feature - user selects photos to share with Lucifer:
- Photo picker UI
- Optional caption input
- Optional context input ("This is my new apartment")
- Converts to base64 and sends to `POST /api/context/photo`

**Payload**:
```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "caption": "My new apartment",
  "context": "Just moved in yesterday"
}
```

### 7. Memories Viewer
Read-only view of what Lucifer remembers:
- Fetch from Mem0 or create a `/api/memories` endpoint
- Display as a scrollable list
- Search/filter functionality
- Shows: memory text, timestamp, source

### 8. Integration Status
Show status of all connected services:
- Gmail: Connected ✓
- Calendar: Connected ✓
- Spotify: Connected ✓
- GitHub: Not Connected
- etc.

Each shows last successful action timestamp.

### 9. Quick Actions
Manual triggers the user can tap:
- "Share my current location" - immediate location send
- "Sync health data now" - immediate health sync
- "Share a photo" - opens photo picker
- "Log my mood" - quick 1-5 mood selector

---

## Screens

### Screen 1: Home / Dashboard
```
┌─────────────────────────────┐
│  LUCIFER                 ●  │  (green dot = connected)
├─────────────────────────────┤
│                             │
│  📍 Location: Home          │
│  🏃 Activity: Stationary    │
│  💤 Sleep: 7.5 hrs          │
│  👟 Steps: 8,432            │
│                             │
├─────────────────────────────┤
│  Quick Actions              │
│  ┌───────┐ ┌───────┐       │
│  │ 📍    │ │ 📸    │       │
│  │Share  │ │Photo  │       │
│  │Loc    │ │       │       │
│  └───────┘ └───────┘       │
│  ┌───────┐ ┌───────┐       │
│  │ 😊    │ │ 🔄    │       │
│  │Mood   │ │Sync   │       │
│  └───────┘ └───────┘       │
│                             │
├─────────────────────────────┤
│  Last sync: 2 min ago       │
└─────────────────────────────┘
```

### Screen 2: Memories
```
┌─────────────────────────────┐
│  ← Memories            🔍   │
├─────────────────────────────┤
│                             │
│  Today                      │
│  ┌─────────────────────────┐│
│  │ Gokul is at the gym     ││
│  │ 10:30 AM                ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ Got 7.5 hours of sleep  ││
│  │ 8:00 AM                 ││
│  └─────────────────────────┘│
│                             │
│  Yesterday                  │
│  ┌─────────────────────────┐│
│  │ Worked out: Running 30m ││
│  │ 6:00 PM                 ││
│  └─────────────────────────┘│
│                             │
└─────────────────────────────┘
```

### Screen 3: Integrations
```
┌─────────────────────────────┐
│  ← Integrations             │
├─────────────────────────────┤
│                             │
│  ┌─────────────────────────┐│
│  │ 📧 Gmail           ✓    ││
│  │ Last: Read 3 emails     ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 📅 Calendar        ✓    ││
│  │ Last: Checked schedule  ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 🎵 Spotify         ✓    ││
│  │ Last: Played music      ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 🐙 GitHub          ○    ││
│  │ Not connected           ││
│  └─────────────────────────┘│
│                             │
└─────────────────────────────┘
```

### Screen 4: Settings
```
┌─────────────────────────────┐
│  ← Settings                 │
├─────────────────────────────┤
│                             │
│  Backend URL                │
│  [https://lucifer.app    ]  │
│                             │
│  Permissions                │
│  Location (Always)     ✓    │
│  Health                ✓    │
│  Motion                ✓    │
│  Contacts              ✓    │
│  Photos                ✓    │
│                             │
│  Data                       │
│  [Re-sync Contacts]         │
│  [Clear Local Data]         │
│                             │
│  About                      │
│  Version 1.0.0              │
│                             │
└─────────────────────────────┘
```

---

## Navigation
Bottom tab bar with 4 tabs:
1. **Home** - Dashboard
2. **Memories** - Memory viewer
3. **Integrations** - Service status
4. **Settings** - Configuration

---

## API Endpoints Used

| Feature | Method | Endpoint |
|---------|--------|----------|
| Location | POST | `/api/context/location` |
| Location | GET | `/api/context/location` |
| Health | POST | `/api/context/health` |
| Health | GET | `/api/context/health` |
| Activity | POST | `/api/context/activity` |
| Activity | GET | `/api/context/activity` |
| Contacts | POST | `/api/context/contacts` |
| Contacts | GET | `/api/context/contacts` |
| Photo | POST | `/api/context/photo` |
| Mood | POST | `/api/mood` |
| Mood | GET | `/api/mood` |

---

## Permissions Summary

| Permission | Usage | Required |
|------------|-------|----------|
| Location (Always) | Background location tracking | Yes |
| HealthKit | Steps, sleep, workouts, heart rate | Yes |
| Motion & Fitness | Activity recognition | Yes |
| Contacts | Contact names for context | Yes |
| Photos | Manual photo sharing | Yes |

---

## MVP Scope (v1.0)

**Must Have**:
- Dashboard with status
- Background location tracking
- Health data sync (daily)
- Activity recognition
- Photo sharing with caption
- Settings with backend URL config

**Nice to Have (v1.1)**:
- Memories viewer
- Integration status page
- Contacts sync
- Mood quick-log widget

---

## Environment Variables

The app needs one config value:
```
BACKEND_URL=https://your-lucifer-backend.vercel.app
```

This can be set in Settings screen.

---

## Notes for Rork

1. **Single User App** - No auth/login needed. This is a personal app.
2. **Background Tasks** - Location needs to work when app is closed.
3. **Minimal UI** - Keep it simple and clean. Dark mode preferred.
4. **Offline Handling** - Queue data locally if backend is unreachable, sync when back online.
5. **Privacy First** - All data stays between the phone and the backend. No third-party analytics.
