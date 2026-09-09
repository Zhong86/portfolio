# Android App — Planned Stack

A native Android companion app for this portfolio, with home-screen widgets. Android only (no iOS — development happens on Linux, and iOS builds require macOS/Xcode).

## Architecture

The Vercel deployment becomes a **backend for both clients**. The website and the Android app share one source of truth (Vercel KV), reached through the existing `/api/*` routes.

```
                                  ┌── website (this repo)
Vercel KV ── /api/* routes ──HTTPS─┤
                                  └── Android app
```

The app never talks to Vercel KV directly. Doing so would require shipping `KV_REST_API_TOKEN` inside the APK, where it is trivially extractable. All secrets (`GROQ_API_KEY`, `GITHUB_TOKEN`, `SUDO_PASSWORD`, KV tokens) stay server-side.

## Stack

| Layer | Choice |
|---|---|
| Language | Kotlin |
| Build | Gradle — Kotlin DSL (`build.gradle.kts`) + version catalog (`libs.versions.toml`) |
| UI | Jetpack Compose |
| Widgets | Jetpack Glance |
| Architecture | MVVM — `ViewModel` + `StateFlow` + sealed `UiState` |
| DI | Hilt (via KSP, not kapt) |
| Networking | Retrofit + kotlinx.serialization |
| Background work | WorkManager |
| Widget cache | Glance state (`PreferencesGlanceStateDefinition`, DataStore-backed) |
| Source of truth | Vercel KV, via `/api/*` |

No Room. Local persistence is a cache, not a database — the only thing that strictly needs it is the widget, and Glance's own state mechanism covers that. App screens fetch on open and hold results in the ViewModel.

## Widgets

Home-screen widgets are the main reason for going native — a PWA cannot create them on Android or iOS, since widgets are rendered by the OS in a separate process while the app is not running.

Data flow:

```
WorkManager (every 15–30 min)
  └─► Retrofit ──► /api/goals-progress, /api/leetcode, /api/github
        └─► Glance state
              └─► widget renders on home screen
```

Widgets read from local state, never from the network — `provideGlance` must return fast and may run while the app is dead.

Constraints:
- `updatePeriodMillis` caps at once per 30 minutes; WorkManager's periodic floor is 15 minutes. Push an immediate update when the app is in the foreground instead of polling aggressively.
- Interactivity is limited to Glance actions (`actionRunCallback`) — tap to refresh, tap to open a screen. Not a mini app.
- `glance-appwidget` is production-used but still publishing alpha artifacts; expect occasional API churn on upgrade.

### Candidate widgets

Endpoints already return the right shape — periodic, glanceable, low-volume.

| Widget | Endpoint |
|---|---|
| Goals streak / progress | `/api/goals-progress` |
| LeetCode solve stats | `/api/leetcode` |
| GitHub contributions | `/api/github` |

## Project layout

```
PortfolioApp/
├── settings.gradle.kts
├── build.gradle.kts
├── gradle/
│   └── libs.versions.toml
└── app/
    ├── build.gradle.kts
    └── src/main/
        ├── AndroidManifest.xml
        ├── res/
        └── java/com/zhong86/portfolio/
            ├── MainActivity.kt
            ├── ui/          composables + ViewModels
            ├── data/        Retrofit api, repositories
            └── widget/      GlanceAppWidget + receiver
```

Separate repository. The only shared surface with the website is a handful of response types, which is not enough to justify a monorepo.

## Notes

- Distribution is sideload-only for now: USB debugging + `./gradlew installDebug`. No Play Store account ($25) needed unless the app is published.
- Sudo-authenticated endpoints take an `x-sudo-token` header. The token is entered at runtime and stored in EncryptedSharedPreferences — never bundled.
- The web UI does not port. Compose has no DOM, so `Terminal.tsx`, the theme CSS, and the SFX layer are a rewrite. Only the API contract carries over.

## First milestone

One screen — stats — hitting `/api/leetcode` and `/api/github` via Retrofit, rendered in Compose with ViewModel + StateFlow. That slice exercises the whole stack before committing to a full port.
