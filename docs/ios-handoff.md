# Lucifer iOS App - Handoff Document for Claude Code

This document contains everything needed to build the Lucifer iOS companion app. The backend is complete and ready to receive data.

---

## Overview

The iOS app is a **data feeder and control panel** for Lucifer. It does NOT have chat functionality - all conversation happens via the web UI (and eventually iMessage).

**What the app does:**
1. Sends phone data to Lucifer's backend (location, health, screen time)
2. Registers for push notifications from Lucifer
3. Shows a dashboard of what Lucifer knows
4. Provides manual controls (share photo, log mood, etc.)

---

## Backend URL

```
Production: https://lucifer-v0.up.railway.app (or your deployed URL)
Development: http://localhost:3000
```

All API calls should use a configurable `BACKEND_URL` stored in the app.

**Note:** Backend is deployed on Railway. See `docs/cron-setup.md` for scheduled job setup.

---

## API Endpoints

### Device Registration

**POST /api/device/register**

Register the device for push notifications. Call this on app launch after getting APNs token.

```json
// Request
{
  "token": "abc123...device_token_from_apns",
  "platform": "ios"
}

// Response
{
  "success": true,
  "device": {
    "id": "dt_123456",
    "platform": "ios",
    "registered": "2024-01-15T10:00:00Z"
  }
}
```

---

### Location Updates

**POST /api/context/location**

Send location updates. This triggers location-based alerts (gym, work, etc).

```json
// Request
{
  "lat": 37.7749,
  "lng": -122.4194,
  "name": "Equinox Gym"  // Optional - reverse geocoded place name
}

// Response
{
  "success": true,
  "location": {
    "id": "loc_123",
    "lat": 37.7749,
    "lng": -122.4194,
    "name": "Equinox Gym",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**GET /api/context/location**

Get the last known location.

```json
// Response
{
  "location": {
    "id": "loc_123",
    "lat": 37.7749,
    "lng": -122.4194,
    "name": "Equinox Gym",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### Health Data

**POST /api/context/health**

Send HealthKit data. Call this daily or when significant changes occur.

```json
// Request
{
  "steps": 8432,
  "sleepHours": 7.5,
  "activeMinutes": 45,
  "heartRate": 72,
  "workouts": [
    {
      "type": "Running",
      "duration": 30,
      "calories": 320
    }
  ]
}

// Response
{
  "success": true,
  "health": {
    "id": "health_123",
    "steps": 8432,
    "sleep_hours": 7.5,
    "active_minutes": 45,
    "heart_rate": 72,
    "workouts": [...],
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**GET /api/context/health**

Get the latest health data.

---

### Activity Recognition

**POST /api/context/activity**

Send Core Motion activity data.

```json
// Request
{
  "activity": "walking",  // stationary, walking, running, driving, cycling
  "confidence": 0.95
}

// Response
{
  "success": true
}
```

---

### Screen Time

**POST /api/context/screen-time**

Send DeviceActivity screen time data. This powers the "doomscroll" trigger.

```json
// Request
{
  "date": "2024-01-15",
  "appCategory": "social",  // social, productivity, entertainment, games, other
  "appName": "Instagram",   // Optional
  "minutes": 120
}

// Response
{
  "success": true
}
```

---

### Contacts Sync

**POST /api/context/contacts**

Sync contacts from the phone. One-time or periodic.

```json
// Request
{
  "contacts": [
    {
      "id": "contact_123",
      "name": "Mom",
      "phone": "+14155551234",
      "email": "mom@email.com"
    }
  ]
}

// Response
{
  "success": true,
  "synced": 150
}
```

---

### Photo Sharing

**POST /api/context/photo**

Share a photo with Lucifer (manual action).

```json
// Request
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ...",
  "caption": "My new apartment",
  "context": "Just moved in yesterday"
}

// Response
{
  "success": true
}
```

---

### Mood Logging

**POST /api/mood**

Log current mood (manual or prompted).

```json
// Request
{
  "mood": 4,        // 1-5 scale
  "energy": 3,      // 1-5 scale (optional)
  "notes": "Feeling good after workout"  // Optional
}

// Response
{
  "success": true,
  "entry": {
    "id": "mood_123",
    "mood": 4,
    "energy": 3,
    "notes": "...",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**GET /api/mood**

Get mood history.

---

### Goals

**GET /api/goals**

List all goals.

**POST /api/goals**

Create a new goal.

```json
// Request
{
  "title": "Run a marathon",
  "description": "Before end of year"
}
```

**PATCH /api/goals/[id]**

Update a goal.

```json
// Request
{
  "progress": 50,
  "status": "active"  // active, completed, paused
}
```

---

### VIP Contacts

**POST /api/vip**

Add a VIP contact (for email alerts).

```json
// Request
{
  "email": "mom@email.com",
  "name": "Mom",
  "relationship": "family"
}
```

---

### Known Locations

**POST /api/locations**

Add a known location (for location triggers).

```json
// Request
{
  "name": "gym",
  "lat": 37.7749,
  "lng": -122.4194,
  "radiusMeters": 100
}
```

---

## iOS Frameworks to Use

### Required Permissions (Info.plist)

```xml
<!-- Location -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Lucifer uses your location to know where you are and provide contextual help.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Lucifer uses background location to proactively check in when you arrive at places like the gym.</string>

<!-- Health -->
<key>NSHealthShareUsageDescription</key>
<string>Lucifer reads your health data to track sleep, steps, and workouts.</string>

<!-- Motion -->
<key>NSMotionUsageDescription</key>
<string>Lucifer uses motion data to know if you're walking, driving, or stationary.</string>

<!-- Contacts -->
<key>NSContactsUsageDescription</key>
<string>Lucifer syncs your contacts to know who's important to you.</string>

<!-- Photos -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Lucifer lets you share photos for context and memories.</string>

<!-- Push Notifications -->
<key>UIBackgroundModes</key>
<array>
  <string>fetch</string>
  <string>remote-notification</string>
  <string>location</string>
</array>
```

### Core Location (Background)

```swift
import CoreLocation

class LocationManager: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()

    func startTracking() {
        manager.delegate = self
        manager.requestAlwaysAuthorization()
        manager.allowsBackgroundLocationUpdates = true
        manager.pausesLocationUpdatesAutomatically = false
        manager.startMonitoringSignificantLocationChanges()
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }

        // Reverse geocode
        let geocoder = CLGeocoder()
        geocoder.reverseGeocodeLocation(location) { placemarks, error in
            let name = placemarks?.first?.name ?? ""

            // Send to backend
            Task {
                await API.sendLocation(
                    lat: location.coordinate.latitude,
                    lng: location.coordinate.longitude,
                    name: name
                )
            }
        }
    }
}
```

### HealthKit

```swift
import HealthKit

class HealthManager {
    private let store = HKHealthStore()

    func requestAuthorization() {
        let types: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.workoutType()
        ]

        store.requestAuthorization(toShare: nil, read: types) { success, error in
            // Handle
        }
    }

    func fetchDailyData() async -> HealthData {
        // Fetch steps
        let steps = await fetchSteps()

        // Fetch sleep
        let sleep = await fetchSleep()

        // Fetch workouts
        let workouts = await fetchWorkouts()

        return HealthData(
            steps: steps,
            sleepHours: sleep,
            workouts: workouts
        )
    }
}
```

### Core Motion

```swift
import CoreMotion

class ActivityManager {
    private let manager = CMMotionActivityManager()

    func startTracking() {
        manager.startActivityUpdates(to: .main) { activity in
            guard let activity = activity else { return }

            var type = "stationary"
            if activity.walking { type = "walking" }
            else if activity.running { type = "running" }
            else if activity.automotive { type = "driving" }
            else if activity.cycling { type = "cycling" }

            Task {
                await API.sendActivity(type: type, confidence: activity.confidence.rawValue)
            }
        }
    }
}
```

### Push Notifications

```swift
import UserNotifications

class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                DispatchQueue.main.async {
                    application.registerForRemoteNotifications()
                }
            }
        }
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()

        Task {
            await API.registerDevice(token: token)
        }
    }
}
```

### DeviceActivity (Screen Time)

```swift
import DeviceActivity
import FamilyControls

class ScreenTimeManager {
    func requestAuthorization() async {
        let center = AuthorizationCenter.shared
        try? await center.requestAuthorization(for: .individual)
    }

    // Note: DeviceActivity API is limited - you may need to use
    // a DeviceActivityMonitor extension to track app usage
}
```

---

## App Structure

```
LuciferApp/
├── App/
│   ├── LuciferApp.swift
│   └── AppDelegate.swift
├── Views/
│   ├── DashboardView.swift
│   ├── MemoriesView.swift
│   ├── IntegrationsView.swift
│   └── SettingsView.swift
├── Managers/
│   ├── LocationManager.swift
│   ├── HealthManager.swift
│   ├── ActivityManager.swift
│   └── NotificationManager.swift
├── Services/
│   └── APIService.swift
├── Models/
│   ├── HealthData.swift
│   ├── Location.swift
│   └── Goal.swift
└── Utils/
    └── Config.swift
```

---

## Dashboard View

The main view showing:
- Connection status (green/red dot)
- Current location
- Today's steps
- Last night's sleep
- Current activity
- Quick action buttons

```swift
struct DashboardView: View {
    @StateObject var viewModel = DashboardViewModel()

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Status card
                    StatusCard(isConnected: viewModel.isConnected)

                    // Stats grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())]) {
                        StatCard(icon: "location", title: "Location", value: viewModel.location)
                        StatCard(icon: "figure.walk", title: "Steps", value: "\(viewModel.steps)")
                        StatCard(icon: "bed.double", title: "Sleep", value: "\(viewModel.sleep)h")
                        StatCard(icon: "heart", title: "Heart Rate", value: "\(viewModel.heartRate)")
                    }

                    // Quick actions
                    QuickActionsView()
                }
                .padding()
            }
            .navigationTitle("Lucifer")
        }
    }
}
```

---

## Environment Variables (iOS)

Store in a Config.swift or use xcconfig files:

```swift
enum Config {
    static let backendURL = "https://lucifer-v0.vercel.app"
    // Or read from UserDefaults for configurability
}
```

---

## APNs Setup (Apple Developer Portal)

1. Go to developer.apple.com → Certificates, IDs & Profiles
2. Create an APNs Key:
   - Keys → Create a Key
   - Enable "Apple Push Notifications service (APNs)"
   - Download the .p8 file (you only get ONE download)
3. Note down:
   - Key ID (10 characters)
   - Team ID (from Membership)
4. Add to your backend .env:
   ```
   APNS_KEY_ID=ABC123DEFG
   APNS_TEAM_ID=TEAMID1234
   APNS_PRIVATE_KEY=<contents of .p8 file>
   APNS_BUNDLE_ID=com.gokul.lucifer
   ```

---

## Background Refresh

The app should periodically sync data even when closed:

```swift
// In AppDelegate
func application(_ application: UIApplication, performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    Task {
        // Sync health data
        let healthData = await HealthManager.shared.fetchDailyData()
        await API.sendHealth(healthData)

        completionHandler(.newData)
    }
}
```

Enable background fetch in Capabilities → Background Modes → Background fetch

---

## Testing Checklist

- [ ] Location updates work in background
- [ ] Health data syncs correctly
- [ ] Push notifications received
- [ ] App handles no network gracefully
- [ ] Settings URL persists
- [ ] All permissions requested properly

---

## Questions for Claude Code

When building, Claude Code should:

1. Use SwiftUI for all views
2. Use async/await for API calls
3. Store backend URL in UserDefaults (configurable in settings)
4. Handle offline gracefully (queue data locally)
5. Use Combine for reactive updates where needed

The backend is ready at the endpoints above. Start with:
1. Basic app structure and navigation
2. Device registration for push
3. Location tracking
4. Health sync
5. Dashboard UI

---

## Summary

**Backend endpoints ready:**
- POST /api/device/register
- POST/GET /api/context/location
- POST/GET /api/context/health
- POST /api/context/activity
- POST /api/context/screen-time
- POST /api/context/contacts
- POST /api/context/photo
- POST/GET /api/mood
- GET/POST/PATCH /api/goals

**iOS frameworks needed:**
- CoreLocation (Always + Background)
- HealthKit
- CoreMotion
- UserNotifications
- DeviceActivity (optional for screen time)
- Contacts

**Push flow:**
1. App gets APNs token on launch
2. Sends to POST /api/device/register
3. Backend stores token
4. When trigger fires, backend sends push via APNs
5. App receives notification
