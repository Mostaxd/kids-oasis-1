const express = require("express");
const authController = require("./../controllers/authController");
const reviewController = require("./../controllers/reviewController");

const router = express.Router();

router.use(authController.protect);


router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo("parent"),
    reviewController.setNurseryAndUserIDs,
    reviewController.createReview
  );

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo("parent", "admin"),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo("parent", "admin"),
    reviewController.deleteReview
  );
module.exports = router;
