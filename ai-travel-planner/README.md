# Trao — AI Travel Planner

A full-stack, multi-user travel itinerary planner powered by Google's Gemini API.
Users register, describe a trip (destination, duration, budget tier, interests), and the AI agent
generates a day-by-day itinerary, budget breakdown, hotel suggestions, and a weather-aware packing
checklist — all editable and persisted per-user in MongoDB.

##Live
Live: https://aniltravelplaner-1.vercel.app

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Auth:** JWT + bcryptjs password hashing
- **AI:** Google Gemini API (`gemini-2.5-flash`), structured JSON output mode

## Project Structure

```
ai-travel-planner/
├── backend/        # Express REST API
│   ├── config/db.js
│   ├── middleware/ (auth.js, errorHandler.js)
│   ├── models/     (User.js, Trip.js)
│   ├── controllers/(authController.js, tripController.js)
│   ├── routes/     (authRoutes.js, tripRoutes.js)
│   ├── utils/geminiService.js
│   └── server.js
└── frontend/       # Next.js client
    └── src/
        ├── app/ (login, register, create-trip, dashboard)
        ├── components/ (ItineraryCard, PackingList, TripList)
        ├── types/
        └── utils/api.ts
```

## Local Setup

### Prerequisites
- Node.js 18.x or 20.x
- A MongoDB Atlas connection string (free tier works)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 1. Backend

```bash
cd backend
npm install
cp .env
# Fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY in .env
npm run dev   # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env
# NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev   # starts on http://localhost:3000
```

Visit `http://localhost:3000`, register an account, and create your first trip.

## Authentication & Authorization

- Passwords are hashed with `bcryptjs` before storage — plaintext passwords are never persisted.
- On login/register, the backend signs a JWT containing `{ id, email }`, returned to the client
  and stored in `localStorage`.
- Every protected API request sends `Authorization: Bearer <token>`.
- The `auth.js` middleware verifies the JWT and attaches `req.user`, used in **every** trip query
  (`Trip.find({ userId: req.user.id, ... })`) — this guarantees one user can never read, edit, or
  delete another user's trips, even if they know another trip's ID.

## AI Agent Design

- `geminiService.js` builds two prompts:
  1. **Full trip generation** — given destination/duration/budget/interests, asks Gemini to return
     a single JSON object containing the itinerary, hotel suggestions, budget breakdown, and packing
     list, using `responseMimeType: "application/json"` to force structured output.
  2. **Single-day regeneration** — given the current day's JSON and free-text traveler feedback
     (e.g. "more outdoor activities"), asks Gemini to return just that one day's replacement JSON,
     which is merged back into the stored itinerary.
- All Gemini calls go through `fetchWithRetry`, which retries on `429`/`5xx` with exponential
  backoff (1s → 2s → 4s → 8s → 16s, up to 5 attempts) before surfacing a graceful error to the user.

## Creative Feature: AI Weather-Aware Packing Assistant

**Why:** Travelers often forget destination- and activity-specific gear (hiking boots for a planned
trek, rain gear for a monsoon season trip, etc.).

**What it does:** As part of the same generation call, Gemini is prompted to produce a packing
checklist split into `Documents`, `Clothing`, `Gear`, and `Other`, informed by the destination's
typical climate for the trip dates and the specific activities already planned in the itinerary.
The checklist is interactive — clicking an item toggles `isPacked` and persists immediately via
`PUT /api/trips/:id`.

## Key Design Decisions & Trade-offs

- **Single generation call** combines itinerary + hotels + budget + packing list in one Gemini
  request rather than four separate calls — faster and cheaper, at the cost of a larger prompt and
  JSON payload to validate.
- **Day regeneration is scoped to one day** rather than regenerating the whole trip, preserving the
  rest of the user's edits and reducing AI cost/latency.
- **localStorage for JWT** keeps the auth flow simple for this assessment; a production app would
  prefer httpOnly cookies to mitigate XSS token theft.
- **Generic `PUT /api/trips/:id`** with a field whitelist powers packing-list toggles and other bulk
  edits without needing a new endpoint per field.

## Known Limitations

- Gemini's JSON output is generally reliable with `responseMimeType: application/json`, but is not
  schema-enforced server-side beyond basic existence checks — malformed AI output could fail trip
  creation (surfaced as a 502 with a friendly message).
- No rate limiting/throttling on AI generation endpoints — a production deployment should add
  per-user request throttling to control Gemini API costs.
- No automated test suite included; manual testing checklist is in the assessment doc.

## Deployment

- **Backend:** https://aniltravelplaner.onrender.com/api/health
- 
- **Frontend:** https://aniltravelplaner-1.vercel.app

## Author
**Anil Kumar**
