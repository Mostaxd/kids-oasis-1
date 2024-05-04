const Child = require("./../models/childModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

exports.getAllChilds = catchAsync(async (req, res, next) => {
  const childs = await Child.find();
  res.status(200).json({
    status: "success",
    results: childs.length,
    data: {
      childs,
    },
  });
});

exports.getChild = catchAsync(async (req, res, next) => {
  const child = await Child.findById(req.params.id);
  if (!review) {
    return next(new AppError("No Child Found With this id", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      child,
    },
  });
});

exports.childInfo = catchAsync(async (req, res, next) => {
  const child = await Child.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      child,
    },
  });
});

exports.updateChildInfo = catchAsync(async (req, res, next) => {
  const child = await Child.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!child) {
    return next(new AppError("No Child Found With this id", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      child,
    },
  });
});

exports.deleteChild = catchAsync(async (req, res, next) => {
  const child = await Child.findByIdAndDelete(req.params.id);
  if (!child) {
    return next(new AppError("No Child Found With this id", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
