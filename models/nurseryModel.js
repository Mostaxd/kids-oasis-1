const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");

const nurserySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A Nursery must have a name"],
      unique: true,
      trim: true,
      maxlength: [30, "A Nursery name must be below or equal to 30 characters"],
      minlength: [
        10,
        "A Nursery name must be a bove or equal to 10 characters",
      ],
    },
    slug: String,
    phoneNumber: {
      type: String,
      required: [true, "Please provide the phone number"],
      unique: true,
      minlength: [
        11,
        "phoneNumber ({VALUE}) can not be longer or smaller than the maximum allowed length",
      ],
      maxlength: [
        11,
        "phoneNumber ({VALUE}) can not be longer or smaller than the maximum allowed length",
      ],
      validate: {
        validator: function (phoneNum) {
          return validator.isMobilePhone(phoneNum, "any", {
            locale: "en-EG",
          });
        },
        message: "Please provide a valid phone number",
      },
    },

    maxGroupSize: {
      type: Number,
      required: [true, "A Nursery must have a size"],
    },
    numOfChilds: {
      type: Number,
      default: 0,
    },
    ratingsAverage: {
      type: Number,
      default: 1,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A Nursery must have a price"],
    },
    priceDiscount: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          return val < this.price; // if so -> return true
        },
        massage: "Discount price ({VALUE}) should be below regular price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A Nursery must have a summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A Nursery must have a cover image"],
    },
    images: [String],
    startDate: Date,
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    // EMBEDDED
    /*
        services: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Service",
      },
    ],
    */
    // EMBEDDED 'location'
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number, // the day of the Nursery  in which childs will go to this location.
      },
    ],
  },
  // Allowing virtual fields
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

nurserySchema.index({ price: 1, ratingsAverage: -1 });
nurserySchema.index({ slug: 1 });

// Virtuatl property
nurserySchema.virtual("reviews", {
  ref: "Review",
  foreignField: "nursery",
  localField: "_id",
});

nurserySchema.virtual("finalPrice").get(function () {
  return this.price - this.priceDiscount;
});

nurserySchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});


/*
nurserySchema.pre(/^find/, function (next) {
  this.populate({
    path: "services",
    select: "-__v",
  });
  next();
});
*/



const Nursery = mongoose.model("Nursery", nurserySchema);
module.exports = Nursery;
