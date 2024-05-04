const mongoose = require("mongoose");
const validator = require("validator");

const childSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "please provide firstName of your child!"],
    minlength: 3,
  },
  lastName: {
    type: String,
    required: [true, "please provide lastName of your child!"],
    minlength: 3,
  },
  dateOfBirth: {
    type: Date, // 26/5/2003
    required: [true, "Date Of Birth can not be empty!"],
    validate: {
      validator: function (val) {
        return validator.isDate(val, { format: "DD/MM/YYYY" });
      },
      message:
        "Invalid date format! Please provide the date in the format DD/MM/YYYY",
    },
  },
  age: {
    type: Number,
    default: function () {
      const now = new Date();
      const dob = new Date(this.dateOfBirth);
      const ageInMilliseconds = now - dob;
      const ageInYears = Math.floor(
        ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25)
      );
      return ageInYears;
    },
  },
  gender: {
    type: String,
    required: [true, "please provide the gender of your child!"],
    enum: ["male", "female"],
  },
  medicalInformation: {
    type: [String],
    default: null,
  },
  parentInformations: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Children must belong to a Parent."],
    preferedCommunicationMethod: {
      type: String,
      enum: ["phone", "email"],
      default: "phone",
    },
  },
  nurseryInformation: {
    type: mongoose.Schema.ObjectId,
    ref: "Nursery",
    required: [true, "Children must belong to a Nursery."],
  },
});

const Child = mongoose.model("Child", childSchema);
module.exports = Child;
