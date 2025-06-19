const express = require('express');
const router = express.Router();
const uuid = require('uuid'); // For generating unique session tokens
const Session = require('../models/session');
const User = require('../models/user');
const Product = require('../models/product');
const socket = require('socket.io');

router.post('/start-session', async (req, res) => {
  try {
    const { productId, userId } = req.body;

    const user = await User.findById(userId);
    if(!user){
        return res.status(404).json({ error: 'User not found' });
    }
  // Generate a unique session token (UUID) for unregistered users
  const unregisteredUserToken = uuid.v4();

  const product = await Product.findOne({ productId: productId });
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const existingSession = await Session.findOne({
    user: userId || null,
    status: 'active',
  })
  if (existingSession) {
    return res.status(200).json({ sessionId: existingSession._id });
  }
  // Create a new session
  const session = new Session({
    user: user?._id || null,
    unregisteredUserToken: unregisteredUserToken, // For unregistered users, this can be null
    product: product._id,
    status: 'active',
  });

  await session.save();



  res.status(201).json({ sessionId: session._id });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});


router.get('/fetch-session', async (req, res) => {
  const { userid } = req.query;
    if ( !userid) {
      return res.status(401).json({ message: 'No session token provided' });
    }
  
    let find;
  
    try {
      const user = await User.findById(userid);
      if(user){
        find = { user: user._id, status: 'active' };
      }else{
        find = { unregisteredUserToken: token, status: 'active' };
      }
    } catch (error) {
        return res.status(401).json({ message: 'Invalid user ID' });
    }
      
  

  // Fetch the session details from the database
  const session = await Session.findOne(find).populate('product');

  if (!session || session.status !== 'active') {
    return res.status(404).json({ message: 'Session not found' });
  }

  res.json(session);
});


router.get('/all-sessions', async (req, res) => {
  try {
    const { email } = req.query;

  if (!email || email !== process.env.ADMIN_EMAIL) {
    return res.status(400).json({ message: 'Unauthorized access' });
  }
  const session = await Session.aggregate([
    {
      $addFields: {
        latestMessageTimestamp: {
          $max: "$messages.timestamp", 
        },
        statusSortOrder: {
          $cond: { if: { $eq: ["$status", "active"] }, then: 1, else: 2 }, 
        },
      },
    },
    
    {
      $sort: {
        statusSortOrder: 1,
        latestMessageTimestamp: -1, 
      },
    },
    {
      $lookup: {
        from: "products", 
        localField: "product",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: { path: "$product", preserveNullAndEmptyArrays: true },
    },
    {
      $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
    },
  ]);
      
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch session', error: error.message });
  }
  
});



router.get('/seen', async (req, res) => {
    const { sessionId } = req.query;
  
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID not provided' });
    }
  
    try {
      const session = await Session.findOneAndUpdate(
        { _id: sessionId },
        {
          $set: {
            'messages.$[message].isReadByAdmin': true,
          },
        },
        {
          arrayFilters: [{ 'message.isReadByAdmin': { $ne: true } }],
          new: true,
        }
      );
  
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
  
      // Correctly update the messages array using map
    //   session.messages = session.messages.map((message) => ({
    //     ...message,
    //     isReadByAdmin: true,
    //   }));
  
    //   await session.save();
      res.json({ message: 'Session marked as seen' });
    } catch (error) {
      console.error('Error marking session as seen:', error);
      res.status(500).json({ message: 'Failed to mark session as seen' });
    }
  });


router.post('/delete', async (req, res) => {
    const { sessionId } = req.body;
  
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID not provided' });
    }
  
    try {
      const session = await Session.findOneAndDelete({ _id: sessionId });
  
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
  
      res.json({ message: 'Session deleted successfully' });
    } catch (error) {
      console.error('Error deleting session:', error);
      res.status(500).json({ message: 'Failed to delete session' });
    }
  });



router.post('/end', async (req, res) => {
    const { sessionId } = req.body;
  
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID not provided' });
    }
  
    try {
      const session = await Session.findOneAndUpdate({ _id: sessionId }, { status: 'ended' });
  
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
  
      res.json({ message: 'Session ended successfully' });
    } catch (error) {
      console.error('Error deleting session:', error);
      res.status(500).json({ message: 'Failed to delete session' });
    }
  });


  module.exports = router;