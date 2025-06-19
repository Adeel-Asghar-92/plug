const dotenv = require("dotenv");
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const User = require('../models/user');
const router = express.Router();

router.use('/webhook', express.raw({ type: 'application/json' }));


router.post('/create-checkout-session', async (req, res) => {
  const { planName, price, userEmail, yearly, coins } = req.body;
  console.log(req.body);
  
  try {
    // Verify user exists before creating session
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      client_reference_id: userEmail,
      customer_email: userEmail,
      line_items: [{
        price_data: {
          currency: 'usd',
          recurring: {
            interval: 'month',
            interval_count: yearly? 12 : 1,
          },
          product_data: {
            name: planName,
            metadata: {
              plan_type: planName.toLowerCase()
            },
          },
          unit_amount: price * 100,
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/subscription/cancel`,
      metadata: {
        userEmail,
        planName: planName.toLowerCase(),
        userId: user._id.toString(),
        coins:coins
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a raw body parser for the webhook route
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    // Log incoming webhook data
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

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        console.log('Session data:', {
          id: session.id,
          customer_email: session.customer_email,
          metadata: session.metadata,
          subscription: session.subscription,
          coins: session.metadata.coins
        });

        try {
          // Retrieve subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          console.log('Subscription details:', {
            id: subscription.id,
            status: subscription.status,
            current_period_end: subscription.current_period_end
          });

          const planName = session.metadata.planName.toLowerCase();
          console.log('Plan name:', planName);

          const existingUser = await User.findOne({ email: session.customer_email });
          if (!existingUser) {
            console.error('User not found:', session.customer_email);
            return res.status(404).json({ error: 'User not found' });
          }

          const updateData = {
            balance:  existingUser.balance + Number(session.metadata.coins),
            subscription: planName,
            'subscriptionDetails.startDate': new Date(),
            'subscriptionDetails.endDate': new Date(subscription.current_period_end * 1000),
            'subscriptionDetails.stripeCustomerId': session.customer,
            'subscriptionDetails.stripeSubscriptionId': subscription.id,
            'subscriptionDetails.status': 'active',
            'subscriptionDetails.lastPaymentDate': new Date(),
            'subscriptionDetails.plan': planName
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
            status: updatedUser.subscriptionDetails?.status
          });

          session.metadata.subscription_updated = 'true';
          session.metadata.new_plan = planName;
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
            // Subscription is set to cancel at period end
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
            // Subscription is active (could be a reactivation)
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
                subscription: 'free',
                'subscriptionDetails.status': 'cancelled',
                'subscriptionDetails.endDate': new Date(),
                'subscriptionDetails.canceledAt': new Date(),
                'subscriptionDetails.cancelAtPeriodEnd': false
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

    // Always acknowledge the webhook
    res.json({ received: true });
    
  } catch (err) {
    console.error('Webhook error:', err.message);
    console.error('Stack trace:', err.stack);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});


router.get('/subscription/:email', async (req, res) => {
    try {
      const user = await User.findOne({ email: req.params.email });
      if (!user) throw new Error('User not found');
      res.json({ subscription: user.subscription, details: user.subscriptionDetails });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });
  
  router.get('/subscription/status/:email', async (req, res) => {
    try {
      const user = await User.findOne({ email: req.params.email });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // If user has a Stripe subscription, get latest details from Stripe
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

  // In stripe.js

  router.get('/verify-success', async (req, res) => {
    try {
      const { session_id } = req.query;
      
      if (!session_id) {
        return res.status(400).json({ 
          success: false, 
          error: 'No session ID provided' 
        });
      }
  
      // Retrieve the checkout session
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['subscription']
      });
      
      if (!session) {
        return res.status(404).json({ 
          success: false, 
          error: 'Session not found' 
        });
      }
  
      // Get user details
      let userDoc = await User.findOne({ email: session.customer_email }); // Changed to let
      
      if (!userDoc) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }
  
      // If subscription hasn't been updated yet, try updating it now
      if (userDoc.subscription === 'free' && session.subscription) {
        const subscription = session.subscription;
        const planName = session.metadata.planName.toLowerCase();
  
        // Update user subscription
        userDoc = await User.findOneAndUpdate(
          { email: session.customer_email },
          { 
            $set: {
              subscription: planName,
              'subscriptionDetails.startDate': new Date(),
              'subscriptionDetails.endDate': new Date(subscription.current_period_end * 1000),
              'subscriptionDetails.stripeCustomerId': session.customer,
              'subscriptionDetails.stripeSubscriptionId': subscription.id,
              'subscriptionDetails.status': 'active',
              'subscriptionDetails.lastPaymentDate': new Date(),
              'subscriptionDetails.plan': planName
            }
          },
          { new: true }
        );
      }
  
      // Return success response
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
      const user = await User.findOne({ email });
      
      if (!user || !user.subscriptionDetails?.stripeSubscriptionId) {
        return res.status(404).json({ 
          success: false, 
          message: 'No active subscription found' 
        });
      }
  
      // First retrieve the subscription to check its status
      const currentSubscription = await stripe.subscriptions.retrieve(
        user.subscriptionDetails.stripeSubscriptionId
      );
  
      // Check if subscription is already cancelled or being cancelled
      if (currentSubscription.status === 'canceled' || 
          currentSubscription.cancel_at_period_end) {
        // Update local database to reflect current status
        await User.findOneAndUpdate(
          { email },
          {
            $set: {
              subscription: 'free',
              'subscriptionDetails.status': 'cancelled',
              'subscriptionDetails.canceledAt': new Date(),
              'subscriptionDetails.cancelAtPeriodEnd': true,
              'subscriptionDetails.endDate': new Date(currentSubscription.current_period_end * 1000)
            }
          }
        );
  
        return res.json({
          success: true,
          message: 'Subscription is already cancelled',
          subscription: currentSubscription
        });
      }
  
      // If not cancelled, proceed with cancellation
      const subscription = await stripe.subscriptions.update(
        user.subscriptionDetails.stripeSubscriptionId,
        { cancel_at_period_end: true }
      );
  
      // Update user document to reflect cancellation
      const updatedUser = await User.findOneAndUpdate(
        { email },
        {
          $set: {
            subscription: 'free',
            'subscriptionDetails.status': 'inActive',
            'subscriptionDetails.canceledAt': new Date(),
            'subscriptionDetails.cancelAtPeriodEnd': true,
            'subscriptionDetails.endDate': new Date(subscription.current_period_end * 1000)
          }
        },
        { new: true }
      );
  
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