const express = require("express");
const nurseryController = require("./../controllers/nurseryController");
const authController = require("./../controllers/authController");
const reviewRouter = require("./../routes/reviewRoutes");

const router = express.Router();


router
  .route("/top-3-cheap")
  .get(nurseryController.topCheapNurseries, nurseryController.getAllNurseries);

router.route("/nursery-stats").get(nurseryController.getNurseryStats);

router
  .route("/monthly-Plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "nursury-owner"),
    nurseryController.getMonthlyPlan
  );

router
  .route("/")
  .get(nurseryController.getAllNurseries)
  .post(
    authController.protect,
    authController.restrictTo("admin", "nursury-owner"),
    nurseryController.createNursery
  );

router
  .route("/:id")
  .get(nurseryController.getNursery)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "nursury-owner"),
    nurseryController.uploadNurseryImages,
    nurseryController.resizeNurseryImages,
    nurseryController.updateNursery
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "nursury-owner"),
    nurseryController.deleteNursery
  );

module.exports = router;
