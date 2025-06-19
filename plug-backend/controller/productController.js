const Product = require("../models/product");
const axios = require('axios');

// CREATE - Add a new product
exports.createProduct = async (req, res) => {
  try {
    const {
      title, price, imageUrl, withVendor, seller, shopId, detailUrl,
      category, subcategory, description, colors, sizes, images,secondSubcategory
    } = req.body;

    // Generate a unique productId (e.g., timestamp + random string)
    const productId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newProduct = new Product({
      productId,
      title,
      price,
      imageUrl,
      withVendor: withVendor || [],
      seller,
      shopId,
      detailUrl,
      secondSubcategory,
      category,
      subcategory,
      description,
      colors: colors || [],
      sizes: sizes || [],
      images: images || [],
      savedBy: req.user.email // Assuming req.user.email comes from auth middleware
    });

    conosle.log(newProduct)

    const savedProduct = await newProduct.save();
    res.status(201).json({ success: true, product: savedProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// READ - Get all products for the user
exports.getUserProducts = async (req, res) => {
  try {
    const products = await Product.find({ savedBy: req.user.email });
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// READ - Get a single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      productId: req.params.productId,
      savedBy: req.user.email
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE - Update a product
exports.updateProduct = async (req, res) => {
  try {
    const {
      title, price, imageUrl, withVendor, seller, shopId, detailUrl,
      category, subcategory, description, colors, sizes, images,secondSubcategory
    } = req.body;

    const product = await Product.findOneAndUpdate(
      { productId: req.params.productId, savedBy: req.user.email },
      {
        title, price, imageUrl, withVendor, seller, shopId, detailUrl,
        category, subcategory, description, colors, sizes, images,secondSubcategory
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE - Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      productId: req.params.productId,
      savedBy: req.user.email
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW OXYLABS INTEGRATION (added to your existing file)
exports.scrapeAndCreateProduct = async (req, res) => {
  console.log('we are there and its working there')
  try {
    const { url, category } = req.body;
    
    if (!url || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'URL and category are required' 
      });
    }

    // Oxylabs scraping logic
    const oxylabsResponse = await axios.post(
      'https://realtime.oxylabs.io/v1/queries',
      {
        source: 'universal_ecommerce',
        url: url,
        geo_location: 'United States',
        parse: true,
        context: [{ key: 'category', value: category }]
      },
      {
        auth: {
          username: 'Barine.deezia@doane.edu',
          password: 'PS:  @1414Peaceful1'
        }
      }
    );

    const scrapedData = oxylabsResponse.data.results[0].content;

    // Create product using your existing schema
    const productId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newProduct = new product({
      productId,
      title: scrapedData.title || scrapedData.product_name || 'Unknown Product',
      price: scrapedData.price || 0,
      imageUrl: scrapedData.main_image || scrapedData.images?.[0] || '',
      withVendor: scrapedData.seller ? [scrapedData.seller] : [],
      seller: scrapedData.seller || 'Unknown Seller',
      detailUrl: url,
      category,
      subcategory: '', // Add as needed
      description: scrapedData.description || '',
      colors: scrapedData.variants?.map(v => v.color).filter(Boolean) || [],
      sizes: scrapedData.variants?.map(v => v.size).filter(Boolean) || [],
      images: scrapedData.images || [],
      savedBy: req.user.email
    });

    const savedProduct = await newProduct.save();
    res.status(201).json({ success: true, product: savedProduct });
  } catch (error) {
    console.error('Oxylabs error:', error.response?.data || error.message);
    res.status(400).json({ 
      success: false, 
      message: error.response?.data?.message || 'Failed to scrape product' 
    });
  }
};


// Add or remove favorite
exports.toggleFavorite = async (req, res) => {
  try {
    const productId = req.query.id;
    const email =req.query.email;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if already favorited
    const existingFavourteIndex = product.favourites.findIndex(
      favourte => favourte.email.toString() === email
    );

    let isFavorited;
    if (existingFavourteIndex > -1) {
      // Remove from favorites
      product.favourites.splice(existingFavourteIndex, 1);
      product.favouritesCount = Math.max(0, product.favouritesCount - 1);
      isFavorited = false;
    } else {
      // Add to favorites
      product.favourites.push({
        email: email,
      });
      product.favouritesCount += 1;
      isFavorited = true;
    }

    await product.save();

    res.json({
      message: isFavorited ? 'Added to favorites' : 'Removed from favorites',
      isFavorited,
      favouritesCount: product.favouritesCount
    });
  } catch (error) {
    console.error('Error updating favorite:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's favorite products
exports.getUserFavorites = async (req, res) => {
  try {
    const userEmail = req.body.email;

    const products = await Product.find({
      'favourites.email': userEmail
    })
    .select('-favourites -views')

    const productsWithUserData = products.map(product => ({
      ...product.toObject(),
      isFavorited: true
    }));

    res.json({
      products: productsWithUserData,
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear all favorites for user
exports.clearFavorites = async (req, res) => {
  try {
    const email = req.body.email;

    const products = await Product.find({
      'favourites.email': email
    });

    const updatePromises = products.map(async (product) => {
      product.favourites = product.favourites.filter(
        follower => follower.email.toString() !== email
      );
      product.favouritesCount = Math.max(0, product.favouritesCount - 1);
      return product.save();
    });

    await Promise.all(updatePromises);

    res.json({ message: 'All favorites cleared successfully' });
  } catch (error) {
    console.error('Error clearing favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle follow of product
exports.toggleFollowing = async (req, res) => {
  try {
    const productId = req.body.productId;
    const email = req.body.email;

    const productDetails = await Product.findById(productId);

    if (!productDetails) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const isFollowing = productDetails.followers.some(follower => follower.email.toString() === email);

    if (!isFollowing) {
      productDetails.followers.push({ email });
      productDetails.followersCount += 1;
    } else {
      productDetails.followers = productDetails.followers.filter(follower => follower.email.toString() !== email);
      productDetails.followersCount = Math.max(0, productDetails.followersCount - 1);
    }

    await productDetails.save();

    res.json({
      message: isFollowing ? 'Unfollowed product' : 'Followed product',
      isFollowing: !isFollowing,
      followersCount: productDetails.followersCount
    });
  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
