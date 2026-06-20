const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  estimatedCostUSD: { type: Number, default: 0 },
  timeOfDay: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening'],
    default: 'Morning',
  },
});

const DaySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  activities: [ActivitySchema],
});

const HotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tier: { type: String, default: '' },
  estimatedCostNightUSD: { type: Number, default: 0 },
  rating: { type: String, default: '' },
});

const PackingItemSchema = new mongoose.Schema({
  item: { type: String, required: true },
  category: {
    type: String,
    enum: ['Documents', 'Clothing', 'Gear', 'Other'],
    default: 'Other',
  },
  isPacked: { type: Boolean, default: false },
});

const TripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    destination: { type: String, required: true },
    durationDays: { type: Number, required: true },
    budgetTier: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true,
    },
    interests: [{ type: String }],
    itinerary: [DaySchema],
    hotels: [HotelSchema],
    estimatedBudget: {
      flights: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      accommodation: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    packingList: [PackingItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', TripSchema);
