const mongoose = require("mongoose");
const Nursery = require("./nurseryModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty!"],
    },
    rating: {
      type: Number,
      min: [1, "Review must be above 1"],
      max: [5, "Review must be below 5"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    nursery: {
      type: mongoose.Schema.ObjectId,
      ref: "Nursery",
      required: [true, "Review must belong to a Nursery."],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user."],
    },
    service: {
      type: mongoose.Schema.ObjectId,
      ref: "Service",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// preventing dublicatetd reviews
reviewSchema.index({ nursery: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "firstName lastName photo",
  });
  next();
});

// static method for calculating avgRatings
reviewSchema.statics.calcAverageRatings = async function (nurseryId) {
  const stats = await this.aggregate([
    {
      $match: { nursery: nurseryId },
    },
    {
      $group: {
        _id: "$nursery",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  // console.log(stats);

  if (stats.length > 0) {
    await Nursery.findByIdAndUpdate(nurseryId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Nursery.findByIdAndUpdate(nurseryId, {
      ratingsQuantity: 0,
      ratingsAverage: 1,
    });
  }
};

// post save middleware that called after creating a new review
reviewSchema.post("save", function () {
  this.constructor.calcAverageRatings(this.nursery);
});

// if the review is updated or deleted
reviewSchema.pre(/^findOneAnd/, function (next) {
  // get document before updating or deleting
  this.currentReviewDoc = this.findOne();
  next();
});

// performing action after query has been executed
reviewSchema.post(/^findOneAnd/, async function () {
  await this.currentReviewDoc.constructor.calcAverageRatings(
    this.currentReviewDoc.nursery
  );
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
