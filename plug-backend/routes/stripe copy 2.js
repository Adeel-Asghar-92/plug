const dotenv = require("dotenv");
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const User = require('../models/user');
const Plan = require('../models/Plan');
const   router = express.Router();

router.use('/webhook', express.raw({ type: 'application/json' }));

// router.post('/create-checkout-session', async (req, res) => {
//   const { planName, price, userEmail, yearly } = req.body;
//   console.log('Create checkout session request:', { planName, price, userEmail, yearly });

//   try {
//     // Verify user exists
//     const user = await User.findOne({ email: userEmail });
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Fetch plan from database
//     const plan = await Plan.findOne({_id:planName});
//     if (!plan) {
//       return res.status(404).json({ error: 'Plan not found' });
//     }

//     // Validate price matches plan's monthlyPrice
//     if (price !== plan.monthlyPrice) {
//       return res.status(400).json({ error: 'Price mismatch with plan' });
//     }

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       client_reference_id: userEmail,
//       customer_email: userEmail,
//       line_items: [{
//         price_data: {
//           currency: 'usd',
//           recurring: {
//             interval: 'month',
//             interval_count: yearly ? 12 : 1,
//           },
//           product_data: {
//             name: plan.title,
//             metadata: {
//               plan_id: plan._id.toString(),
//             },
//           },
//           unit_amount: plan.monthlyPrice * 100, // Use plan's monthlyPrice directly
//         },
//         quantity: 1,
//       }],
//       mode: 'subscription',
//       success_url: `${process.env.FRONTEND_URL}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.FRONTEND_URL}/dashboard/subscription/cancel`,
//       metadata: {
//         userEmail,
//         planId: plan._id.toString(),
//         userId: user._id.toString(),
//         yearly: yearly.toString(),
//       }
//     });

//     res.json({ sessionId: session.id });
//   } catch (error) {
//     console.error('Create checkout session error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });
router.post('/create-checkout-session', async (req, res) => {
  const { planName, price, userEmail, yearly } = req.body;
  console.log('Create checkout session request:', { planName, price, userEmail, yearly });

  try {
    // Verify user exists
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch plan from database
    const plan = await Plan.findOne({ _id: planName });
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Validate price matches plan's monthlyPrice
    const expectedPrice = yearly ? plan.monthlyPrice * 12 : plan.monthlyPrice;
    // if (price !== expectedPrice) {
    //   return res.status(400).json({ error: `Price mismatch with plan. Expected $${expectedPrice} for ${yearly ? 'yearly' : 'monthly'} billing.` });
    // }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      client_reference_id: userEmail,
      customer_email: userEmail,
      line_items: [{
        price_data: {
          currency: 'usd',
          recurring: {
            interval: yearly ? 'year' : 'month',
            interval_count: 1,
          },
          product_data: {
            name: plan.title,
            metadata: {
              plan_id: plan._id.toString(),
            },
          },
          unit_amount: yearly ? plan.monthlyPrice * 12 * 100 : plan.monthlyPrice * 100, // Multiply by 12 for yearly
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/subscription/cancel`,
      metadata: {
        userEmail,
        planId: plan._id.toString(),
        userId: user._id.toString(),
        yearly: yearly.toString(),
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    console.log('Webhook received:', {
      signature: sig ? 'Present' : 'Missing',
      body: typeof req.body === 'string' ? 'Raw' : 'Parsed'
    });

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('Webhook event type:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        console.log('Session data:', {
          id: session.id,
          customer_email: session.customer_email,
          metadata: session.metadata,
          subscription: session.subscription,
        });

        try {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          console.log('Subscription details:', {
            id: subscription.id,
            status: subscription.status,
            current_period_end: subscription.current_period_end
          });

          const planId = session.metadata.planId;
          const yearly = session.metadata.yearly === 'true';

          const plan = await Plan.findById(planId);
          if (!plan) {
            console.error('Plan not found:', planId);
            return res.status(404).json({ error: 'Plan not found' });
          }

          const existingUser = await User.findOne({ email: session.customer_email });
          if (!existingUser) {
            console.error('User not found:', session.customer_email);
            return res.status(404).json({ error: 'User not found' });
          }

          const updateData = {
            subscription: plan._id,
            'subscriptionDetails.startDate': new Date(),
            'subscriptionDetails.endDate': new Date(subscription.current_period_end * 1000),
            'subscriptionDetails.stripeCustomerId': session.customer,
            'subscriptionDetails.stripeSubscriptionId': subscription.id,
            'subscriptionDetails.status': 'active',
            'subscriptionDetails.lastPaymentDate': new Date(),
            'subscriptionDetails.plan': plan._id,
            'subscriptionDetails.isYearly': yearly,
            'subscriptionDetails.geoListing': plan.geoListing,
            'subscriptionDetails.geoSearchTokens': plan.geoSearchSessions,
          };

          console.log('Attempting to update user with data:', updateData);

          const updatedUser = await User.findOneAndUpdate(
            { email: session.customer_email },
            { $set: updateData },
            { new: true, runValidators: true }
          );

          console.log('User update result:', {
            email: updatedUser.email,
            subscription: updatedUser.subscription,
            status: updatedUser.subscriptionDetails?.status,
            isYearly: updatedUser.subscriptionDetails?.isYearly,
            geoListing: updatedUser.subscriptionDetails?.geoListing,
            geoSearchTokens: updatedUser.subscriptionDetails?.geoSearchTokens,
          });

          session.metadata.subscription_updated = 'true';
          session.metadata.plan_id = plan._id.toString();
        } catch (subscriptionError) {
          console.error('Subscription processing error:', subscriptionError);
          console.error('Stack trace:', subscriptionError.stack);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription updated:', {
          id: subscription.id,
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end
        });

        try {
          const user = await User.findOne({
            'subscriptionDetails.stripeSubscriptionId': subscription.id
          });

          if (!user) {
            console.error('User not found for subscription:', subscription.id);
            break;
          }

          if (subscription.cancel_at_period_end) {
            await User.findOneAndUpdate(
              { _id: user._id },
              {
                $set: {
                  'subscriptionDetails.status': 'canceling',
                  'subscriptionDetails.canceledAt': new Date(),
                  'subscriptionDetails.cancelAtPeriodEnd': true,
                  'subscriptionDetails.endDate': new Date(subscription.current_period_end * 1000)
                }
              }
            );
            console.log('Updated user subscription status to canceling');
          } else if (subscription.status === 'active') {
            await User.findOneAndUpdate(
              { _id: user._id },
              {
                $set: {
                  'subscriptionDetails.status': 'active',
                  'subscriptionDetails.canceledAt': null,
                  'subscriptionDetails.cancelAtPeriodEnd': false,
                  'subscriptionDetails.endDate': new Date(subscription.current_period_end * 1000)
                }
              }
            );
            console.log('Updated user subscription status to active');
          }
        } catch (error) {
          console.error('Error updating subscription status:', error);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription deleted:', subscription.id);

        try {
          await User.findOneAndUpdate(
            { 'subscriptionDetails.stripeSubscriptionId': subscription.id },
            {
              $set: {
                subscription: null,
                'subscriptionDetails.status': 'cancelled',
                'subscriptionDetails.endDate': new Date(),
                'subscriptionDetails.canceledAt': new Date(),
                'subscriptionDetails.cancelAtPeriodEnd': false,
                'subscriptionDetails.isYearly': false,
                'subscriptionDetails.geoListing': 5, // Default for free plan
                'subscriptionDetails.geoSearchTokens': 0 // Default for free plan
              }
            }
          );
          console.log('Updated user subscription status to cancelled');
        } catch (error) {
          console.error('Error updating cancelled subscription:', error);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    console.error('Stack trace:', err.stack);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

router.get('/subscription/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).populate('subscription').populate('subscriptionDetails.plan');
    if (!user) throw new Error('User not found');
    res.json({ subscription: user.subscription, details: user.subscriptionDetails });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get('/subscription/status/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).populate('subscription').populate('subscriptionDetails.plan');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.subscriptionDetails?.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(
        user.subscriptionDetails.stripeSubscriptionId
      );

      return res.json({
        dbSubscription: user.subscription,
        dbDetails: user.subscriptionDetails,
        stripeStatus: subscription.status,
        stripePlan: subscription.items.data[0]?.price?.product,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      });
    }

    return res.json({
      dbSubscription: user.subscription,
      dbDetails: user.subscriptionDetails,
      stripeStatus: null
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/verify-success', async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'No session ID provided' 
      });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription']
    });

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        error: 'Session not found' 
      });
    }

    let userDoc = await User.findOne({ email: session.customer_email }).populate('subscription').populate('subscriptionDetails.plan');

    if (!userDoc) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    if (!userDoc.subscription && session.subscription) {
      const subscription = session.subscription;
      const planId = session.metadata.planId;
      const yearly = session.metadata.yearly === 'true';

      const plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(404).json({ 
          success: false, 
          error: 'Plan not found' 
        });
      }

      userDoc = await User.findOneAndUpdate(
        { email: session.customer_email },
        { 
          $set: {
            subscription: plan._id,
            'subscriptionDetails.startDate': new Date(),
            'subscriptionDetails.endDate': new Date(subscription.current_period_end * 1000),
            'subscriptionDetails.stripeCustomerId': session.customer,
            'subscriptionDetails.stripeSubscriptionId': subscription.id,
            'subscriptionDetails.status': 'active',
            'subscriptionDetails.lastPaymentDate': new Date(),
            'subscriptionDetails.plan': plan._id,
            'subscriptionDetails.isYearly': yearly,
            'subscriptionDetails.geoListing': plan.geoListing,
            'subscriptionDetails.geoSearchTokens': plan.geoSearchSessions,
          }
        },
        { new: true, runValidators: true }
      ).populate('subscription').populate('subscriptionDetails.plan');
    }

    res.json({
      success: true,
      user: {
        email: userDoc.email,
        subscription: userDoc.subscription,
        subscriptionDetails: userDoc.subscriptionDetails
      },
      session: {
        payment_status: session.payment_status,
        subscription_status: session.subscription?.status
      }
    });
  } catch (error) {
    console.error('Subscription verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/subscription/cancel', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).populate('subscription').populate('subscriptionDetails.plan');

    if (!user || !user.subscriptionDetails?.stripeSubscriptionId) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active subscription found' 
      });
    }

    const currentSubscription = await stripe.subscriptions.retrieve(
      user.subscriptionDetails.stripeSubscriptionId
    );

    if (currentSubscription.status === 'canceled' || 
        currentSubscription.cancel_at_period_end) {
      await User.findOneAndUpdate(
        { email },
        {
          $set: {
            subscription: null,
            'subscriptionDetails.status': 'cancelled',
            'subscriptionDetails.canceledAt': new Date(),
            'subscriptionDetails.cancelAtPeriodEnd': true,
            'subscriptionDetails.endDate': new Date(currentSubscription.current_period_end * 1000),
            'subscriptionDetails.isYearly': false,
            'subscriptionDetails.geoListing': 5, // Default for free plan
            'subscriptionDetails.geoSearchTokens': 0 // Default for free plan
          }
        }
      );

      return res.json({
        success: true,
        message: 'Subscription is already cancelled',
        subscription: currentSubscription
      });
    }

    const subscription = await stripe.subscriptions.update(
      user.subscriptionDetails.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          subscription: null,
          'subscriptionDetails.status': 'canceling',
          'subscriptionDetails.canceledAt': new Date(),
          'subscriptionDetails.cancelAtPeriodEnd': true,
          'subscriptionDetails.endDate': new Date(subscription.current_period_end * 1000),
          'subscriptionDetails.isYearly': false,
          'subscriptionDetails.geoListing': 5, // Default for free plan
          'subscriptionDetails.geoSearchTokens': 0 // Default for free plan
        }
      },
      { new: true }
    ).populate('subscription').populate('subscriptionDetails.plan');

    res.json({ 
      success: true, 
      message: 'Subscription will be canceled at the end of the billing period',
      subscription: updatedUser.subscriptionDetails
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
});

module.exports = router;