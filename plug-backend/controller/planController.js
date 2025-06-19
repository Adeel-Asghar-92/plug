const Plan = require("../models/Plan");
const TokenPlan = require("../models/tokenPlans");

// Get all plans
exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find()
    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching plans",
    });
  }
};

// Create a new plan
exports.createPlan = async (req, res) => {
  try {
    const {
      title,
      monthlyPrice,
      features,
      isPopular,
      geoListing,
      geoSearchSessions,
      productValuation,
      isYearly,
    } = req.body;

    const plan = await Plan.create({
      title,
      monthlyPrice,
      features,
      isPopular,
      geoListing,
      geoSearchSessions,
      productValuation,
      isYearly,
    });

    res.status(201).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a plan
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      monthlyPrice,
      features,
      isPopular,
      geoListing,
      geoSearchSessions,
      productValuation,
      isYearly,
    } = req.body;

    const plan = await Plan.findByIdAndUpdate(
      id,
      {
        title,
        monthlyPrice,
        features,
        isPopular,
        geoListing,
        geoSearchSessions,
        productValuation,
        isYearly,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a plan
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findByIdAndDelete(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting plan",
    });
  }
};

exports.getTokenPlans = async (req, res) => {
  try {
    const tokenPlans = await TokenPlan.find();
    res.status(200).json({
      success: true,
      count: tokenPlans.length,
      data: tokenPlans,
    });
  } catch (error) {
    console.error("Error fetching token plans:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching token plans",
    });
  }
};
