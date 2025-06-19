const express = require('express');
const router = express.Router();
const productController = require('../controller/productController');


// CRUD Routes
// router.post('/saved-products', productController.createProduct);         // Create
// router.get('/saved-products', productController.getUserProducts);       // Read all
// router.get('/saved-products/:productId', productController.getProductById); // Read one
// router.put('/saved-products/:productId', productController.updateProduct);  // Update
// router.delete('/saved-products/:productId', productController.deleteProduct); // Delete

router.post('/user/toggleFavorite', productController.toggleFavorite); // Add or remove product to favorites
router.post('/user/favorites', productController.getUserFavorites);             // Get all favorites of user
router.post('/user/following', productController.toggleFollowing);             // Get all favorites of user
router.delete('/user/favorites', productController.clearFavorites);           // Clear all favorites

module.exports = router;