const MODEL = "gemini-2.5-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

async function fetchWithRetry(url, options, retries = 5, delay = 1000) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      if ((response.status === 429 || response.status >= 500) && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      const errBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errBody}`);
    }

    return await response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    throw new Error("GEMINI_API_KEY is not configured on the server.");

  const url = `${BASE_URL}/${MODEL}:generateContent?key=${apiKey}`;

  const requestPayload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.8,
    },
  };

  const data = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestPayload),
  });

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty or malformed response.");
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Failed to parse Gemini JSON output: " + e.message);
  }
}

const VALID_TIME_OF_DAY = ["Morning", "Afternoon", "Evening"];
const VALID_PACKING_CATEGORY = ["Documents", "Clothing", "Gear", "Other"];

// Gemini sometimes returns near-miss enum values (e.g. "Late Morning", "Night").
// Coerce anything invalid into the closest allowed enum value instead of letting
// Mongoose validation reject the whole save.
function normalizeTimeOfDay(value) {
  if (VALID_TIME_OF_DAY.includes(value)) return value;
  const v = String(value || "").toLowerCase();
  if (v.includes("morning")) return "Morning";
  if (v.includes("night") || v.includes("evening") || v.includes("dinner"))
    return "Evening";
  return "Afternoon";
}

function normalizePackingCategory(value) {
  if (VALID_PACKING_CATEGORY.includes(value)) return value;
  const v = String(value || "").toLowerCase();
  if (v.includes("doc") || v.includes("passport") || v.includes("visa"))
    return "Documents";
  if (v.includes("cloth") || v.includes("wear") || v.includes("apparel"))
    return "Clothing";
  if (v.includes("gear") || v.includes("equip")) return "Gear";
  return "Other";
}

// Walk the full AI result and coerce every enum field into a valid value.
function sanitizeTripResult(result) {
  const itinerary = (result.itinerary || []).map((day) => ({
    ...day,
    activities: (day.activities || []).map((act) => ({
      ...act,
      timeOfDay: normalizeTimeOfDay(act.timeOfDay),
    })),
  }));

  const packingList = (result.packingList || []).map((item) => ({
    ...item,
    category: normalizePackingCategory(item.category),
  }));

  return { ...result, itinerary, packingList };
}

function sanitizeDayResult(day) {
  return {
    ...day,
    activities: (day.activities || []).map((act) => ({
      ...act,
      timeOfDay: normalizeTimeOfDay(act.timeOfDay),
    })),
  };
}

function buildTripPrompt({ destination, durationDays, budgetTier, interests }) {
  return `
You are an expert travel-planning assistant. Create a detailed, realistic travel plan.

Destination: ${destination}
Duration: ${durationDays} days
Budget tier: ${budgetTier} (Low = backpacker/budget, Medium = comfortable mid-range, High = luxury)
Traveler interests: ${interests.join(", ") || "general sightseeing"}

Also generate a weather/activity aware packing list based on the destination's typical climate
for a trip of this length and the planned activities.

Respond with ONLY a valid JSON object (no markdown fences, no commentary) matching exactly this structure:
{
  "itinerary": [
    {
      "dayNumber": 1,
      "activities": [
        { "title": "string", "description": "string", "estimatedCostUSD": number, "timeOfDay": "Morning" }
      ]
    }
  ],
  "hotels": [
    { "name": "string", "tier": "Budget|Mid Range|Luxury", "estimatedCostNightUSD": number, "rating": "string e.g. 4.5/5" }
  ],
  "estimatedBudget": {
    "flights": number,
    "transport": number,
    "accommodation": number,
    "food": number,
    "activities": number,
    "total": number
  },
  "packingList": [
    { "item": "string", "category": "Documents|Clothing|Gear|Other", "isPacked": false }
  ]
}

Rules:
- itinerary must have exactly ${durationDays} day objects, numbered 1 to ${durationDays}.
- Each day should have 2-4 activities relevant to the stated interests.
- timeOfDay MUST be exactly one of these three strings: "Morning", "Afternoon", "Evening".
  Never use any other value (no "Late Morning", "Night", "Midday", etc).
- category in packingList MUST be exactly one of: "Documents", "Clothing", "Gear", "Other".
  Never use any other value.
- Suggest 3 hotels spanning a range appropriate to the budget tier (lean toward ${budgetTier}).
- Cost estimates must be realistic for ${destination} and consistent with the ${budgetTier} budget tier.
- total in estimatedBudget must equal the sum of flights+transport+accommodation+food+activities.
- packingList should include items in "Documents", "Clothing", "Gear", and "Other" categories,
  tailored to the destination's climate and the planned activities. Include 8-15 items.
`;
}

function buildRegenerateDayPrompt({ destination, budgetTier, day, feedback }) {
  return `
You are an expert travel-planning assistant. A traveler wants to change a single day of their
existing itinerary for a trip to ${destination} (budget tier: ${budgetTier}).

Current plan for Day ${day.dayNumber}:
${JSON.stringify(day, null, 2)}

Traveler feedback / requested change: "${feedback}"

Regenerate ONLY this day to reflect the feedback. Respond with ONLY a valid JSON object
(no markdown fences, no commentary) matching exactly this structure:
{
  "dayNumber": ${day.dayNumber},
  "activities": [
    { "title": "string", "description": "string", "estimatedCostUSD": number, "timeOfDay": "Morning" }
  ]
}
Include 2-4 activities consistent with the feedback and budget tier.
timeOfDay MUST be exactly one of: "Morning", "Afternoon", "Evening". Never any other value.
`;
}

module.exports = {
  callGemini,
  buildTripPrompt,
  buildRegenerateDayPrompt,
  sanitizeTripResult,
  sanitizeDayResult,
};
