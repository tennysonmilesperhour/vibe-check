# App privacy disclosure draft

Reconfirm these answers against the exact production build before submitting. The current code has no advertising SDK, cross-app tracking, or product analytics SDK.

## Tracking

- **Data used to track you:** No
- **Data linked to third-party advertising:** No
- **Advertising or third-party marketing purposes:** No

## Data linked to the user

| Apple data type | What Vibe Check stores or processes | Purpose |
| --- | --- | --- |
| Contact Info: Email Address | Account email | App Functionality; Account Management |
| Contact Info: Name | Optional account/profile name | App Functionality; Product Personalization |
| Health & Fitness: Health | User-entered mood, energy, and sleep scores | App Functionality; Product Personalization |
| User Content: Other User Content | Journal notes, gratitude, moments, feelings, activities, relationship notes, questions, readings, and optional cosmic profile/birth details | App Functionality; Product Personalization |
| Identifiers: User ID | Supabase account identifier attached to app records | App Functionality; Account Management |

The same user content and profile details may be processed by Anthropic only when the user explicitly requests an AI reflection. This is service-provider processing for App Functionality and Product Personalization, not tracking.

## Not collected by the current app

- Precise or coarse device location. A typed birth city/region/country is user content, not device geolocation.
- Contacts, photos, videos, audio, browsing history, search history, purchases, payment information, advertising data, or device diagnostics.
- HealthKit or Fitness API data.

If any production SDK, telemetry, crash reporting, advertising, payment, or attribution tool is added, redo this disclosure before upload.
