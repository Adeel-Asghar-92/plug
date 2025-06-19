const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    firebaseUid: {
      type: String,
      sparse: true, // Allows null/undefined values to be unique
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "email"; // Only required for email auth
      },
    },
    fullName: {
      type: String,
      required: true,
    },
    authProvider: {
      type: String,
      required: true,
      enum: ["email", "google"],
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan", // Reference the Plan model
      default: null, // Default to null for free plan or unset subscription
    },
    balance: {
      type: Number,
      default: 100,
    },
    tokens: {
      type: Number,
      default: 0,
    },
    subscriptionDetails: {
      startDate: { type: Date },
      endDate: { type: Date },
      stripeCustomerId: { type: String },
      stripeSubscriptionId: { type: String },
      paypalPayerId: { type: String }, // PayPal payer ID
      paypalSubscriptionId: { type: String }, // PayPal subscription ID
      status: {
        type: String,
        enum: ["active", "canceling", "cancelled", "past_due"],
        default: "cancelled",
      },
      lastPaymentDate: { type: Date },
      plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
      isYearly: { type: Boolean, default: false },
      canceledAt: { type: Date },
      cancelAtPeriodEnd: { type: Boolean },
      searchByImageCount: {
        type: Number,
        default: 0,
      },
      geoSearchTokens: {
        type: mongoose.Schema.Types.Mixed, // Number or String (e.g., "Unlimited")
        default: 3, // Default to 0 sessions
      },
      geoListing: {
        type: mongoose.Schema.Types.Mixed, // Number or String (e.g., "Unlimited")
        default: 5, // Default to 5 listings
      },
      productValuation: {
        type: mongoose.Schema.Types.Mixed, // Number or String (e.g., "Unlimited")
        default: 5,
      },
    },
    companyName: String,
    phoneNumber: String,
    website: String,
    visitCount: {
      type: Number,
      default: 0,
    },
    savedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    lastLogin: Date,
    lastPasswordResetRequest: Date,
    apiKey: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    photoURL: String,
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add index on firebaseUid
userSchema.index({ firebaseUid: 1 }, { sparse: true });

module.exports = mongoose.model("User", userSchema);
