const express = require("express");

const User = require("../models/user");
const Plan = require("../models/Plan");
const TokenPlan = require("../models/tokenPlans");
const paypal = require("@paypal/checkout-server-sdk");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Stripe Webhook (unchanged)
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const body = await req.body;
    const signature = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook error:", err.message);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          try {
            if (session.metadata.type === "subscription") {
              const subscription = await stripe.subscriptions.retrieve(
                session.subscription
              );
              const planId = session.metadata.planId;
              const yearly = session.metadata.yearly === "true";

              const plan = await Plan.findById(planId);
              if (!plan) {
                console.error("Plan not found:", planId);
                return res.status(404).json({ error: "Plan not found" });
              }

              const existingUser = await User.findOne({
                email: session.customer_email,
              });
              if (!existingUser) {
                console.error("User not found:", session.customer_email);
                return res.status(404).json({ error: "User not found" });
              }

              const updateData = {
                subscription: plan._id,
                "subscriptionDetails.startDate": new Date(),
                "subscriptionDetails.endDate": new Date(
                  subscription.current_period_end * 1000
                ),
                "subscriptionDetails.stripeCustomerId": session.customer,
                "subscriptionDetails.stripeSubscriptionId": subscription.id,
                "subscriptionDetails.status": "active",
                "subscriptionDetails.lastPaymentDate": new Date(),
                "subscriptionDetails.plan": plan._id,
                "subscriptionDetails.isYearly": yearly,
                "subscriptionDetails.geoListing": plan.geoListing,
                "subscriptionDetails.geoSearchTokens": plan.geoSearchSessions,
                "subscriptionDetails.productValuation": plan.productValuation,
              };

              console.log("Attempting to update user with data:", updateData);

              const updatedUser = await User.findOneAndUpdate(
                { email: session.customer_email },
                { $set: updateData },
                { new: true, runValidators: true }
              );

              session.metadata.subscription_updated = "true";
              session.metadata.plan_id = plan._id.toString();
            } else if (session.metadata.type === "token") {
              const planId = session.metadata.planId;
              const email = session.customer_email;
              const tokenPlan = await TokenPlan.findOne({ _id: planId });
              const tokens = tokenPlan.tokens;
              await User.findOneAndUpdate(
                { email },
                {
                  $inc: { tokens: tokens },
                }
              );
              console.log("Updated user tokens:", { email, tokens });
            }
          } catch (subscriptionError) {
            console.error("Error updating user tokens:", subscriptionError);
          }
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object;
          try {
            const user = await User.findOne({
              "subscriptionDetails.stripeSubscriptionId": subscription.id,
            });

            if (!user) {
              console.error(
                "User not found for subscription:",
                subscription.id
              );
              break;
            }

            if (subscription.cancel_at_period_end) {
              await User.findOneAndUpdate(
                { _id: user._id },
                {
                  $set: {
                    "subscriptionDetails.status": "canceling",
                    "subscriptionDetails.canceledAt": new Date(),
                    "subscriptionDetails.cancelAtPeriodEnd": true,
                    "subscriptionDetails.endDate": new Date(
                      subscription.current_period_end * 1000
                    ),
                  },
                }
              );
              console.log("Updated user subscription status to canceling");
            } else if (subscription.status === "active") {
              await User.findOneAndUpdate(
                { _id: user._id },
                {
                  $set: {
                    "subscriptionDetails.status": "active",
                    "subscriptionDetails.canceledAt": null,
                    "subscriptionDetails.cancelAtPeriodEnd": false,
                    "subscriptionDetails.endDate": new Date(
                      subscription.current_period_end * 1000
                    ),
                  },
                }
              );
              console.log("Updated user subscription status to active");
            }
          } catch (error) {
            console.error("Error updating subscription status:", error);
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          console.log("Subscription deleted:", subscription.id);

          try {
            await User.findOneAndUpdate(
              { "subscriptionDetails.stripeSubscriptionId": subscription.id },
              {
                $set: {
                  subscription: null,
                  "subscriptionDetails.status": "cancelled",
                  "subscriptionDetails.endDate": new Date(),
                  "subscriptionDetails.canceledAt": new Date(),
                  "subscriptionDetails.cancelAtPeriodEnd": false,
                  "subscriptionDetails.isYearly": false,
                  "subscriptionDetails.geoListing": 5,
                  "subscriptionDetails.geoSearchTokens": 0,
                  "subscriptionDetails.productValuation": 5,
                },
              }
            );
            console.log("Updated user subscription status to cancelled");
          } catch (error) {
            console.error("Error updating cancelled subscription:", error);
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook error:", err.message);
      console.error("Stack trace:", err.stack);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// PayPal Webhook
router.post(
  "/paypal-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      // Verify webhook signature
      const webhookId = process.env.PAYPAL_WEBHOOK_ID;
      const headers = {
        "paypal-auth-algo": req.headers["paypal-auth-algo"],
        "paypal-cert-url": req.headers["paypal-cert-url"],
        "paypal-transmission-id": req.headers["paypal-transmission-id"],
        "paypal-transmission-sig": req.headers["paypal-transmission-sig"],
        "paypal-transmission-time": req.headers["paypal-transmission-time"],
      };
      const webhookEvent = JSON.parse(req.body.toString());
      console.log("PayPal webhook received:", {
        event_type: webhookEvent.event_type,
      });

      const verifyRequest = new paypal.webhook.WebhookEventVerifyRequest();
      verifyRequest.requestBody({
        auth_algo: headers["paypal-auth-algo"],
        cert_url: headers["paypal-cert-url"],
        transmission_id: headers["paypal-transmission-id"],
        transmission_sig: headers["paypal-transmission-sig"],
        transmission_time: headers["paypal-transmission-time"],
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      });

      const verifyResponse = await paypalClient.execute(verifyRequest);
      if (verifyResponse.result.verification_status !== "SUCCESS") {
        console.error(
          "PayPal webhook verification failed:",
          verifyResponse.result
        );
        return res.status(400).json({ error: "Webhook verification failed" });
      }

      // Handle PayPal webhook events
      switch (webhookEvent.event_type) {
        case "CHECKOUT.ORDER.APPROVED ": {
          const order = webhookEvent.resource;
          const type = JSON.parse(order.custom_id || "{}").type;
          if (type === "token") {
            const planId = JSON.parse(order.custom_id || "{}").planId;
            const userEmail = JSON.parse(order.custom_id || "{}").userEmail;
            const tokenPlan = await TokenPlan.findOne({ _id: planId });
            const tokens = tokenPlan.tokens;
            await User.findOneAndUpdate(
              { email: userEmail },
              {
                $inc: { tokens: tokens },
              }
            );
          }
          break;
        }
        case "BILLING.SUBSCRIPTION.ACTIVATED": {
          const subscription = webhookEvent.resource;
          const customId = JSON.parse(subscription.custom_id || "{}");
          const { userEmail, planId, userId, yearly } = customId;

          console.log("PayPal subscription activated:", {
            id: subscription.id,
            userEmail,
            planId,
            yearly,
          });

          try {
            const plan = await Plan.findById(planId);
            if (!plan) {
              console.error("Plan not found:", planId);
              return res.status(404).json({ error: "Plan not found" });
            }

            const existingUser = await User.findOne({ email: userEmail });
            if (!existingUser) {
              console.error("User not found:", userEmail);
              return res.status(404).json({ error: "User not found" });
            }

            const billingCycle =
              subscription.billing_info?.cycle_executions?.find(
                (cycle) => cycle.sequence === 1
              );
            const endDate = billingCycle
              ? new Date(
                  billingCycle.tenure_type === "REGULAR"
                    ? subscription.billing_info.next_billing_time
                    : subscription.end_time
                )
              : new Date(
                  Date.now() + (yearly ? 365 : 30) * 24 * 60 * 60 * 1000
                );

            const updateData = {
              subscription: plan._id,
              "subscriptionDetails.startDate": new Date(),
              "subscriptionDetails.endDate": endDate,
              "subscriptionDetails.paypalPayerId":
                subscription.subscriber.payer_id,
              "subscriptionDetails.paypalSubscriptionId": subscription.id,
              "subscriptionDetails.status": "active",
              "subscriptionDetails.lastPaymentDate": new Date(),
              "subscriptionDetails.plan": plan._id,
              "subscriptionDetails.isYearly": yearly === "true",
              "subscriptionDetails.geoListing": plan.geoListing,
              "subscriptionDetails.geoSearchTokens": plan.geoSearchSessions,
              "subscriptionDetails.productValuation": plan.productValuation,
            };

            console.log("Attempting to update user with data:", updateData);

            const updatedUser = await User.findOneAndUpdate(
              { email: userEmail },
              { $set: updateData },
              { new: true, runValidators: true }
            );

            console.log("User update result:", {
              email: updatedUser.email,
              subscription: updatedUser.subscription,
              status: updatedUser.subscriptionDetails?.status,
              isYearly: updatedUser.subscriptionDetails?.isYearly,
              geoListing: updatedUser.subscriptionDetails?.geoListing,
              geoSearchTokens: updatedUser.subscriptionDetails?.geoSearchTokens,
            });
          } catch (error) {
            // console.error("PayPal subscription processing error:", error);
          }
          break;
        }

        case "BILLING.SUBSCRIPTION.UPDATED": {
          const subscription = webhookEvent.resource;
          console.log("PayPal subscription updated:", {
            id: subscription.id,
            status: subscription.status,
          });

          try {
            const user = await User.findOne({
              "subscriptionDetails.paypalSubscriptionId": subscription.id,
            });

            if (!user) {
              console.error(
                "User not found for subscription:",
                subscription.id
              );
              break;
            }

            if (subscription.status === "SUSPENDED") {
              await User.findOneAndUpdate(
                { _id: user._id },
                {
                  $set: {
                    "subscriptionDetails.status": "canceling",
                    "subscriptionDetails.canceledAt": new Date(),
                    "subscriptionDetails.cancelAtPeriodEnd": true,
                    "subscriptionDetails.endDate": new Date(
                      subscription.billing_info.next_billing_time || Date.now()
                    ),
                  },
                }
              );
              console.log("Updated user subscription status to canceling");
            } else if (subscription.status === "ACTIVE") {
              await User.findOneAndUpdate(
                { _id: user._id },
                {
                  $set: {
                    "subscriptionDetails STATUS": "active",
                    "subscriptionDetails.canceledAt": null,
                    "subscriptionDetails.cancelAtPeriodEnd": false,
                    "subscriptionDetails.endDate": new Date(
                      subscription.billing_info.next_billing_time || Date.now()
                    ),
                  },
                }
              );
              console.log("Updated user subscription status to active");
            }
          } catch (error) {
            console.error("Error updating PayPal subscription status:", error);
          }
          break;
        }

        case "BILLING.SUBSCRIPTION.CANCELLED": {
          const subscription = webhookEvent.resource;
          console.log("PayPal subscription cancelled:", subscription.id);

          try {
            await User.findOneAndUpdate(
              { "subscriptionDetails.paypalSubscriptionId": subscription.id },
              {
                $set: {
                  subscription: null,
                  "subscriptionDetails.status": "cancelled",
                  "subscriptionDetails.endDate": new Date(),
                  "subscriptionDetails.canceledAt": new Date(),
                  "subscriptionDetails.cancelAtPeriodEnd": false,
                  "subscriptionDetails.isYearly": false,
                  "subscriptionDetails.geoListing": 5,
                  "subscriptionDetails.geoSearchTokens": 0,
                  "subscriptionDetails.productValuation": 5,
                },
              }
            );
            console.log("Updated user subscription status to cancelled");
          } catch (error) {
            console.error(
              "Error updating cancelled PayPal subscription:",
              error
            );
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("PayPal webhook error:", err.message);
      console.error("Stack trace:", err.stack);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

module.exports = router;
