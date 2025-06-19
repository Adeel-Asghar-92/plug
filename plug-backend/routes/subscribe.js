
const express = require('express');
const User = require('../models/user');
const router = express.Router();


// Update Subscription Route
router.put('/update-subscription', async (req, res) => {
    const { email, subscription } = req.body;
    try {
      const user = await User.findOneAndUpdate(
        { email },
        { subscription },
        { new: true }
      );
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json({ message: 'Subscription updated', user });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Get Subscription Route
  router.get('/get-subscription/:username', async (req, res) => {
      const { username } = req.params;
  
      try {
          const user = await User.findOne({ username });
          if (!user) return res.status(404).json({ message: 'User not found' });
  
          res.status(200).json({ subscription: user.subscription });
      } catch (err) {
          res.status(500).json({ message: 'Error retrieving subscription', error: err.message });
      }
  });


  

module.exports = router;
