const Nursery = require("./../models/nurseryModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const APIFeatures = require("./../utils/apiFeatures");

const multer = require("multer");
const sharp = require("sharp");

const multerStorage = multer.memoryStorage();

// check that if uploaded file is image or not!
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadNurseryImages = upload.fields([
  { name: "imageCover", maxCount: 5 },
  { name: "images", maxCount: 10 },
]);

exports.resizeNurseryImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) COVER IMAGE
  req.body.imageCover = `nursery-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`data/images/${req.body.imageCover}`);

  // 2) IMAGES
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `nursery-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`data/images/${filename}`);

      req.body.images.push(filename);
    })
  );
  next();
});

exports.topCheapNurseries = (req, res, next) => {
  req.query.limit = "3";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields =
    "name,price,ratingsAverage,summary,maxGroupSize,numOfChilds";
  next();
};

exports.getAllNurseries = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Nursery.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagenate();

  const nurseries = await features.query; // .populate("finalPrice")

  res.status(200).json({
    status: "success",
    result: nurseries.length,
    data: {
      nurseries,
    },
  });
});

exports.getNursery = catchAsync(async (req, res, next) => {
  const nursery = await Nursery.findById(req.params.id).populate("reviews");
  if (!nursery) {
    return next(new AppError("No Nursery Found With That Id", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      nursery,
    },
  });
});

exports.createNursery = catchAsync(async (req, res, next) => {
  const newNursery = await Nursery.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      nusery: newNursery,
    },
  });
});

exports.updateNursery = catchAsync(async (req, res, next) => {
  const nursery = await Nursery.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!nursery) {
    return next(new AppError("No Nursery Found With That Id", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      nursery,
    },
  });
});

exports.deleteNursery = catchAsync(async (req, res, next) => {
  const nursery = await Nursery.findByIdAndDelete(req.params.id);
  if (!nursery) {
    return next(new AppError("No Nursery Found With That Id", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getNurseryStats = catchAsync(async (req, res, next) => {
  const stats = await Nursery.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4 } },
    },
    {
      $group: {
        _id: { $toUpper: "$name" },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        totalPrice: { $sum: "$price" },
        maxGroupSize: { $sum: "$maxGroupSize" },
        numOfChilds: { $sum: "$numOfChilds" },
      },
    },
    {
      $sort: { avgRating: -1 },
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Nursery.aggregate([
    {
      $match: {
        startDate: {
          $gte: new Date(`${year}-01-01`), // first day of the year
          $lte: new Date(`${year}-12-31`), // last day in the year
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDate" },
        numNurseriesStarted: { $sum: 1 },
        nurseries: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0, // to hide id
      },
    },
    {
      $sort: { month: -1 },
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});
