const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "please provide your firstName!"],
    minlength: 3,
  },
  lastName: {
    type: String,
    required: [true, "please provide your lastName!"],
    minlength: 3,
  },
  email: {
    type: String,
    required: [true, "please provide your email!"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "please provide a valid email!"],
  },
  address: {
    type: String,
    required: [true, "please provide your address!"],
  },
  role: {
    type: String,
    enum: ["admin", "parent", "nursury-owner"],
    required: [true, "please provide your role!"],
  },
  password: {
    type: String,
    required: [true, "please provide your password!"],
    minlength: 8,
     select: false, // hiding the password
  },
  passwordConfirm: {
    type: String,
    required: [true, "please confirm your password!"],
    minlength: 8,
    validate: {
      validator: function (passConf) {
        return passConf === this.password;
      },
      message: "password are not the same!",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  gender: {
    type: String,
    required: [true, "please provide your gender"],
    enum: ["male", "female"],
  },
  photo: {
    type: String,
    default: "default.jpeg",
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Hashing the password using bcrypt
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//  Using an instance method (to check passOfBody === passOfDB)
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//  If user changed password after the token was issued
userSchema.methods.changedPasswordAfter = function (jwtTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return jwtTimeStamp < changedTimestamp;
  }
  return false;
};

// If user forgot it's password , generate random reset token Using 'instance method'
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
