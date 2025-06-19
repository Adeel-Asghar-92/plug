const dotenv = require("dotenv");
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
dotenv.config({ path: envFile });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const express = require("express");
const User = require("../models/user");
const Plan = require("../models/Plan");
const TokenPlan = require("../models/tokenPlans");
const paypal = require("@paypal/checkout-server-sdk");
const router = express.Router();

// PayPal client setup
const paypalClient = new paypal.core.PayPalHttpClient(
  new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  )
);
// Stripe Checkout Session (unchanged)
router.post("/create-checkout-session", async (req, res) => {
  const { planName, price, userEmail, yearly } = req.body;
  console.log("Create checkout session request:", {
    planName,
    price,
    userEmail,
    yearly,
  });

  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const plan = await Plan.findOne({ _id: planName });
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      client_reference_id: userEmail,
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            recurring: {
              interval: yearly ? "year" : "month",
              interval_count: 1,
            },
            product_data: {
              name: plan.title,
              metadata: {
                plan_id: plan._id.toString(),
              },
            },
            unit_amount: yearly
              ? plan.monthlyPrice * 12 * 100
              : plan.monthlyPrice * 100,
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/subscription/cancel`,
      metadata: {
        userEmail,
        planId: plan._id.toString(),
        userId: user._id.toString(),
        yearly: yearly.toString(),
        type: "subscription",
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error("Create checkout session error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/create-token-stripe-checkout", async (req, res) => {
  const { planId, userEmail } = req.body;
  console.log("Create Stripe checkout session request:", { planId, userEmail });
  try {
    // Verify user exists
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const plan = await TokenPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      client_reference_id: userEmail,
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: plan?.price * 100,
            product_data: {
              name: plan?.name,
              metadata: {
                plan_id: plan?._id?.toString(),
              },
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}`,
      cancel_url: `${process.env.FRONTEND_URL}`,
      metadata: {
        userEmail,
        planId: plan._id.toString(),
        userId: user._id.toString(),
        type: "token",
      },
    });
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error("Create checkout session error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PayPal Checkout Session
router.post("/create-paypal-checkout", async (req, res) => {
  const { planName, price, userEmail, yearly } = req.body;
  console.log("Create PayPal checkout session request:", {
    planName,
    price,
    userEmail,
    yearly,
  });

  try {
    // Verify user exists
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch plan from database
    const plan = await Plan.findOne({ _id: planName });
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Validate price matches plan's monthlyPrice
    const expectedPrice = yearly ? plan.monthlyPrice * 12 : plan.monthlyPrice;
    // if (price !== expectedPrice) {
    //   return res.status(400).json({ error: `Price mismatch with plan. Expected $${expectedPrice} for ${yearly ? 'yearly' : 'monthly'} billing.` });
    // }

    // Create PayPal billing plan
    const billingPlanRequest = new paypal.orders.OrdersCreateRequest();
    billingPlanRequest.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: yearly
              ? (plan.monthlyPrice * 12).toFixed(2)
              : plan.monthlyPrice.toFixed(2),
          },
          custom_id: JSON.stringify({
            userEmail,
            planId: plan._id.toString(),
            userId: user._id.toString(),
            yearly: yearly.toString(),
          }),
        },
      ],
      application_context: {
        return_url: `${process.env.FRONTEND_URL}/dashboard/subscription/success`,
        cancel_url: `${process.env.FRONTEND_URL}/dashboard/subscription/cancel`,
        brand_name: "ValueVault",
        user_action: "PAY_NOW",
      },
    });

    const response = await paypalClient.execute(billingPlanRequest);
    const order = response.result;

    // Return the approval URL for frontend redirection
    const approvalUrl = order.links.find((link) => link.rel === "approve").href;

    res.json({ orderId: order.id, approvalUrl });
  } catch (error) {
    console.error("Create PayPal checkout session error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/create-token-paypal-checkout", async (req, res) => {
  const { planId, userEmail } = req.body;
  try {
    // Verify user exists
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch plan from database
    const plan = await TokenPlan.findOne({ _id: planId });
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Create PayPal billing plan
    const billingPlanRequest = new paypal.orders.OrdersCreateRequest();
    billingPlanRequest.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: plan?.price,
          },
          custom_id: JSON.stringify({
            userEmail,
            planId: plan._id.toString(),
            userId: user._id.toString(),
            type: "token",
          }),
        },
      ],
      application_context: {
        return_url: `${process.env.FRONTEND_URL}`,
        cancel_url: `${process.env.FRONTEND_URL}`,
        brand_name: "ValueVault",
        user_action: "PAY_NOW",
      },
    });

    const response = await paypalClient.execute(billingPlanRequest);
    const order = response.result;

    // Return the approval URL for frontend redirection
    const approvalUrl = order.links.find((link) => link.rel === "approve").href;

    res.json({ orderId: order.id, approvalUrl });
  } catch (error) {
    console.error("Create PayPal checkout session error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Verify PayPal Success
router.get("/verify-paypal-success", async (req, res) => {
  try {
    const { paypal_order_id } = req.query;

    if (!paypal_order_id) {
      return res
        .status(400)
        .json({ success: false, error: "No order ID provided" });
    }

    // Capture the order
    const captureRequest = new paypal.orders.OrdersCaptureRequest(
      paypal_order_id
    );
    const captureResponse = await paypalClient.execute(captureRequest);
    const order = captureResponse.result;

    if (order.status !== "COMPLETED") {
      return res
        .status(400)
        .json({ success: false, error: "Order not completed" });
    }

    const customId = JSON.parse(order.purchase_units[0].custom_id || "{}");
    const { userEmail, planId, userId, yearly } = customId;

    let userDoc = await User.findOne({ email: userEmail })
      .populate("subscription")
      .populate("subscriptionDetails.plan");

    if (!userDoc) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    // Calculate end date (approximate, will be updated by webhook)
    const endDate = new Date(
      Date.now() + (yearly === "true" ? 365 : 30) * 24 * 60 * 60 * 1000
    );

    if (!userDoc.subscription) {
      userDoc = await User.findOneAndUpdate(
        { email: userEmail },
        {
          $set: {
            subscription: plan._id,
            "subscriptionDetails.startDate": new Date(),
            "subscriptionDetails.endDate": endDate,
            "subscriptionDetails.paypalPayerId": order.payer.payer_id,
            "subscriptionDetails.paypalSubscriptionId": paypal_order_id, // Use order ID as placeholder; webhook will update
            "subscriptionDetails.status": "active",
            "subscriptionDetails.lastPaymentDate": new Date(),
            "subscriptionDetails.plan": plan._id,
            "subscriptionDetails.isYearly": yearly === "true",
            "subscriptionDetails.geoListing": plan.geoListing,
            "subscriptionDetails.geoSearchTokens": plan.geoSearchSessions,
          },
        },
        { new: true, runValidators: true }
      )
        .populate("subscription")
        .populate("subscriptionDetails.plan");
    }

    res.json({
      success: true,
      user: {
        email: userDoc.email,
        subscription: userDoc.subscription,
        subscriptionDetails: userDoc.subscriptionDetails,
      },
      order: {
        status: order.status,
      },
    });
  } catch (error) {
    console.error("PayPal subscription verification error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PayPal Subscription Cancellation
router.post("/paypal/subscription/cancel", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email })
      .populate("subscription")
      .populate("subscriptionDetails.plan");

    if (!user || !user.subscriptionDetails?.paypalSubscriptionId) {
      return res.status(404).json({
        success: false,
        message: "No active PayPal subscription found",
      });
    }

    // Check PayPal subscription status
    const request = new paypal.subscriptions.SubscriptionGetRequest(
      user.subscriptionDetails.paypalSubscriptionId
    );
    const response = await paypalClient.execute(request);
    const subscription = response.result;

    if (
      subscription.status === "CANCELLED" ||
      subscription.status === "SUSPENDED"
    ) {
      await User.findOneAndUpdate(
        { email },
        {
          $set: {
            subscription: null,
            "subscriptionDetails.status": "cancelled",
            "subscriptionDetails.canceledAt": new Date(),
            "subscriptionDetails.cancelAtPeriodEnd": true,
            "subscriptionDetails.endDate": new Date(
              subscription.billing_info?.next_billing_time || Date.now()
            ),
            "subscriptionDetails.isYearly": false,
            "subscriptionDetails.geoListing": 5,
            "subscriptionDetails.geoSearchTokens": 0,
          },
        }
      );

      return res.json({
        success: true,
        message: "PayPal subscription is already cancelled",
        subscription,
      });
    }

    // Cancel PayPal subscription
    const cancelRequest = new paypal.subscriptions.SubscriptionCancelRequest(
      user.subscriptionDetails.paypalSubscriptionId
    );
    await paypalClient.execute(cancelRequest);

    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          subscription: null,
          "subscriptionDetails.status": "canceling",
          "subscriptionDetails.canceledAt": new Date(),
          "subscriptionDetails.cancelAtPeriodEnd": true,
          "subscriptionDetails.endDate": new Date(
            subscription.billing_info?.next_billing_time || Date.now()
          ),
          "subscriptionDetails.isYearly": false,
          "subscriptionDetails.geoListing": 5,
          "subscriptionDetails.geoSearchTokens": 0,
        },
      },
      { new: true }
    )
      .populate("subscription")
      .populate("subscriptionDetails.plan");

    res.json({
      success: true,
      message:
        "PayPal subscription will be canceled at the end of the billing period",
      subscription: updatedUser.subscriptionDetails,
    });
  } catch (error) {
    console.error("Error canceling PayPal subscription:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel PayPal subscription",
      error: error.message,
    });
  }
});

// Subscription Status (Updated for PayPal)
router.get("/subscription/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email })
      .populate("subscription")
      .populate("subscriptionDetails.plan");
    if (!user) throw new Error("User not found");

    let paypalSubscription = null;
    if (user.subscriptionDetails?.paypalSubscriptionId) {
      const request = new paypal.subscriptions.SubscriptionGetRequest(
        user.subscriptionDetails.paypalSubscriptionId
      );
      const response = await paypalClient.execute(request);
      paypalSubscription = response.result;
    }

    res.json({
      subscription: user.subscription,
      details: user.subscriptionDetails,
      paypalSubscription,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(404).json({ error: error.message });
  }
});

// Subscription Status Check (Updated for PayPal)
router.get("/subscription/status/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email })
      .populate("subscription")
      .populate("subscriptionDetails.plan");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let stripeStatus = null;
    let paypalStatus = null;
    let currentPeriodEnd = null;

    if (user.subscriptionDetails?.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(
        user.subscriptionDetails.stripeSubscriptionId
      );
      stripeStatus = subscription.status;
      currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    }

    if (user.subscriptionDetails?.paypalSubscriptionId) {
      const request = new paypal.subscriptions.SubscriptionGetRequest(
        user.subscriptionDetails.paypalSubscriptionId
      );
      const response = await paypalClient.execute(request);
      paypalStatus = response.result.status;
      currentPeriodEnd = new Date(
        response.result.billing_info.next_billing_time || Date.now()
      );
    }

    return res.json({
      dbSubscription: user.subscription,
      dbDetails: user.subscriptionDetails,
      stripeStatus,
      paypalStatus,
      currentPeriodEnd,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ error: error.message });
  }
});

// Middleware for raw body parsing (Stripe and PayPal webhooks)
// router.use("/webhook", express.raw({ type: "application/json" }));



module.exports = router;
