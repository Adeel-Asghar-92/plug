const express = require('express');
const router = express.Router();
const Favorite = require('./../models/favorite');
const user = require('../models/user');

// Add to favorites
router.post('/', async (req, res) => {
  try {
    const { productId,email } = req.body;
    const userId = await user.findOne({email});
    console.log(userId._id)
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ userId, productId });
    if (existingFavorite) {
      return res.status(400).json({ message: 'Item already favorited' });
    }

    const favorite = new Favorite({
        userId: userId._id,
      productId
    });
    console.log(favorite)

    await favorite.save();
    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove from favorites
router.delete('/:productId', async (req, res) => {
  try {
    const userId = await user.findOne({email})._id;
    const productId = req.params.productId;

    const favorite = await Favorite.findOneAndDelete({ userId, productId });
    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's favorites
router.get('/', async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email)

    const userId = await user.findOne({email});
    console.log(userId)
    const favorites = await Favorite.find({ userId }).populate('productId');
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;