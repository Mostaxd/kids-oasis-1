const User = require("./../models/userModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const { promisify } = require("util");
const sendEmail = require("./../utils/email");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true; // the cookie will only be sent on an encrypted connection.
  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

// 1) Sign-Up
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    address: req.body.address,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    gender: req.body.gender,
  });
  createSendToken(newUser, 201, res);
});

// 2) Login (with email and password)
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exisit
  if (!email || !password) {
    return next(new AppError("please provide email and password", 400));
  }

  // 2) Check if user exists and password correct
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }
  createSendToken(user, 200, res);
});

// logout function
exports.logout = (req, res) => {
  res.cookie("jwt", "logged out", {
    expiresIn: new Date(Date.now() + 10 * 1000), // 10(sec) * 1000 =10000(millisecond)
    httpOnly: true,
    secure: true,
  });
  res.status(200).json({
    status: "success",
    message: "You have been successfully logged out.",
  });
};

// Protected Middleware
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get token and check it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("you are not logged in! please log in to get access", 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //console.log(decoded);

  // 3) Check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }
  // 4) Check if user changed password after token was issued ?
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! please log in again.", 401)
    );
  }

  // 5) Grant Access to protected route
  req.user = currentUser;
  next();
});

// Authorization:user rules and permissions
// roles:- ["admin", "parent", "nursury-owner", "service-providor"]
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to do this action", 403)
      );
    }
    next();
  };
};

// Password reset function
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user from POSTED email
  if (!req.body.email) {
    return next(new AppError("You should provide your email address"));
  }
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address"));
  }
  // 2) Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email

  /*
    const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;
  */
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword?token=${resetToken}`;
  const message = `Forgot your password? Reset it by submitting a PATCH request with your new password and passwordConfirm to: ${resetURL}.\n\nIf you didn't forget your password, please ignore this email. Thank you!`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }
});

// Reset Password function
exports.resetPassword = catchAsync(async (req, res, next) => {
  console.log("hello dfdf");
  // Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  // If token has not expired and there is a user,THEN set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Update the current password 'allowing validateBeforeSave' to hash password
  await user.save();

  // THEN, user logged in
  createSendToken(user, 200, res);
});

// Update Current User
exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get user
  const user = await User.findById(req.user.id).select("+password");

  // Current password is correct OR not ?
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError("Your current password is wrong!", 401));
  }

  // If so THEN,update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  // save it
  await user.save();

  // user logged in
  createSendToken(user, 200, res);
});
