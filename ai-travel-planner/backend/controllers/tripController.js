const Trip = require("../models/Trip");
const {
  callGemini,
  buildTripPrompt,
  buildRegenerateDayPrompt,
  sanitizeTripResult,
  sanitizeDayResult,
} = require("../utils/geminiService");

// Helper: always scope queries to the authenticated user to enforce data isolation
function userScopedFilter(req, extra = {}) {
  return { userId: req.user.id, ...extra };
}

exports.generateNewTrip = async (req, res, next) => {
  try {
    const { destination, durationDays, budgetTier, interests } = req.body;

    if (!destination || !durationDays || !budgetTier) {
      return res.status(400).json({
        message: "destination, durationDays and budgetTier are required.",
      });
    }
    if (!["Low", "Medium", "High"].includes(budgetTier)) {
      return res
        .status(400)
        .json({ message: "budgetTier must be Low, Medium or High." });
    }

    const prompt = buildTripPrompt({
      destination,
      durationDays,
      budgetTier,
      interests: Array.isArray(interests) ? interests : [],
    });

    const rawResult = await callGemini(prompt);
    const aiResult = sanitizeTripResult(rawResult);

    const newTrip = await Trip.create({
      userId: req.user.id,
      destination,
      durationDays,
      budgetTier,
      interests: Array.isArray(interests) ? interests : [],
      itinerary: aiResult.itinerary || [],
      hotels: aiResult.hotels || [],
      estimatedBudget: aiResult.estimatedBudget || {},
      packingList: aiResult.packingList || [],
    });

    return res.status(201).json(newTrip);
  } catch (error) {
    console.error("Trip generation failed:", error.message);
    return res.status(502).json({
      message:
        "The AI service failed to generate your trip. Please try again in a moment.",
    });
  }
};

exports.getAllTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find(userScopedFilter(req)).sort({
      createdAt: -1,
    });
    return res.status(200).json(trips);
  } catch (error) {
    next(error);
  }
};

exports.getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findOne(
      userScopedFilter(req, { _id: req.params.id }),
    );
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    return res.status(200).json(trip);
  } catch (error) {
    next(error);
  }
};

// Generic update: used by frontend for activity add/remove, packing list toggles, etc.
// Only allows whitelisted fields to be patched, and is strictly user-scoped.
exports.updateTrip = async (req, res, next) => {
  try {
    const allowedFields = [
      "itinerary",
      "hotels",
      "estimatedBudget",
      "packingList",
      "interests",
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const trip = await Trip.findOneAndUpdate(
      userScopedFilter(req, { _id: req.params.id }),
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!trip) return res.status(404).json({ message: "Trip not found." });
    return res.status(200).json(trip);
  } catch (error) {
    next(error);
  }
};

exports.deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOneAndDelete(
      userScopedFilter(req, { _id: req.params.id }),
    );
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    return res.status(200).json({ message: "Trip deleted successfully." });
  } catch (error) {
    next(error);
  }
};

// Regenerate a single day via targeted AI prompt + feedback text
exports.regenerateDay = async (req, res, next) => {
  try {
    const { dayNumber, feedback } = req.body;
    if (!dayNumber || !feedback) {
      return res
        .status(400)
        .json({ message: "dayNumber and feedback are required." });
    }

    const trip = await Trip.findOne(
      userScopedFilter(req, { _id: req.params.id }),
    );
    if (!trip) return res.status(404).json({ message: "Trip not found." });

    const day = trip.itinerary.find((d) => d.dayNumber === Number(dayNumber));
    if (!day)
      return res
        .status(404)
        .json({ message: `Day ${dayNumber} not found in itinerary.` });

    const prompt = buildRegenerateDayPrompt({
      destination: trip.destination,
      budgetTier: trip.budgetTier,
      day: day.toObject(),
      feedback,
    });

    const rawDay = await callGemini(prompt);
    const newDay = sanitizeDayResult(rawDay);

    trip.itinerary = trip.itinerary.map((d) =>
      d.dayNumber === Number(dayNumber)
        ? { dayNumber: d.dayNumber, activities: newDay.activities }
        : d,
    );

    await trip.save();
    return res.status(200).json(trip);
  } catch (error) {
    console.error("Day regeneration failed:", error.message);
    return res.status(502).json({
      message:
        "The AI service failed to regenerate this day. Please try again.",
    });
  }
};

// Add a single activity to a specific day
exports.addActivity = async (req, res, next) => {
  try {
    const { dayNumber, activity } = req.body;
    if (!dayNumber || !activity || !activity.title) {
      return res
        .status(400)
        .json({ message: "dayNumber and activity.title are required." });
    }

    const trip = await Trip.findOne(
      userScopedFilter(req, { _id: req.params.id }),
    );
    if (!trip) return res.status(404).json({ message: "Trip not found." });

    const day = trip.itinerary.find((d) => d.dayNumber === Number(dayNumber));
    if (!day)
      return res.status(404).json({ message: `Day ${dayNumber} not found.` });

    day.activities.push({
      title: activity.title,
      description: activity.description || "",
      estimatedCostUSD: activity.estimatedCostUSD || 0,
      timeOfDay: activity.timeOfDay || "Afternoon",
    });

    await trip.save();
    return res.status(200).json(trip);
  } catch (error) {
    next(error);
  }
};

// Remove an activity by its subdocument _id from a specific day
exports.removeActivity = async (req, res, next) => {
  try {
    const { dayNumber, activityId } = req.body;
    if (!dayNumber || !activityId) {
      return res
        .status(400)
        .json({ message: "dayNumber and activityId are required." });
    }

    const trip = await Trip.findOne(
      userScopedFilter(req, { _id: req.params.id }),
    );
    if (!trip) return res.status(404).json({ message: "Trip not found." });

    const day = trip.itinerary.find((d) => d.dayNumber === Number(dayNumber));
    if (!day)
      return res.status(404).json({ message: `Day ${dayNumber} not found.` });

    day.activities = day.activities.filter(
      (a) => a._id.toString() !== activityId,
    );

    await trip.save();
    return res.status(200).json(trip);
  } catch (error) {
    next(error);
  }
};
