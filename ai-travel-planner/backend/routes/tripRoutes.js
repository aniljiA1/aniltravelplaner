const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  generateNewTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  regenerateDay,
  addActivity,
  removeActivity,
} = require('../controllers/tripController');

// All trip routes require a valid JWT
router.use(auth);

router.post('/generate', generateNewTrip);
router.get('/', getAllTrips);
router.get('/:id', getTripById);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);

router.post('/:id/regenerate-day', regenerateDay);
router.post('/:id/activities', addActivity);
router.post('/:id/activities/remove', removeActivity);

module.exports = router;
