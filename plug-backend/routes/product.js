const express = require("express");
const product = require("../models/product");
const router = express.Router();

router.get("/productDetails/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const productDetails = await product.findById(productId);
    if (req.query.email) {
      if (!productDetails.views.some(view => view.email.toString() === req.query.email)) {
        productDetails.views.push({ email: req.query.email });
        productDetails.viewsCount += 1;
        if (!productDetails.followers.some(follower => follower.email.toString() === req.query.email)) {
          productDetails.followers.push({ email: req.query.email });
          productDetails.followersCount += 1;
        }
        await productDetails.save();
      }
    }
    res.json(productDetails);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
