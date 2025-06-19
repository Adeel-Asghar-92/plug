const express = require("express");
const router = express.Router();
const {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getTokenPlans,
} = require("../controller/planController");

// Public route to get all plans
router.get("/", getPlans);
router.get("/token-plans", getTokenPlans);

// Admin route to create a plan (optional, add middleware for authentication if needed)
router.post("/", createPlan);
router.put("/:id", updatePlan);
router.delete("/:id", deletePlan);

module.exports = router;
