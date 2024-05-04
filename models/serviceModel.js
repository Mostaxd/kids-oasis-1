const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: [true, "Service Name can not be empty!"],
  },
  description: {
    type: String,
    required: [true, "Please provide a description."],
  },
  ageRange: {
    type: String,
    default: "for all ages",
  },
  additionalService: {
    type: {
      type: String,
      required: [true, "Please provide the type of this additional service!"],
      enum: [
        "Printing",
        "Clothing",
        "Transportation",
        "Language lessons",
        "Auxiliary tools",
      ],
    },
    description: {
      type: String,
      required: [
        true,
        "Please provide a description for this additional service.",
      ],
    },
    price: {
      type: Number,
      required: [true, "Please enter the price of this additional service!"],
    },
  },
  default: "No Additional Services yet!",
});

const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
