const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
// const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const AppError = require("./utils/appError");
const compression = require("compression");
const cors = require("cors");

const globalErrorHandler = require("./controllers/errorController");

const userRouter = require("./routes/userRoutes");
const nurseryRouter = require("./routes/nurseryRoutes");
const reviewRouter = require("./routes/reviewRoutes");

// start express app
const app = express();

// 1) Global Middleware

app.use(
  cors({
    origin: "http://localhost:5173", // Replace with the actual origin of your client application
    credentials: true, // Allow credentials (cookies) to be included in the request
  })
);

//app.use(cors()); // Access-Control-Allow-Origin
//app.options("*", cors());

app.use(helmet()); // setting the security http headers

//console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // (morgan):- to get loogger back (GET /api/v1/users/ 200 23.994 ms - 8933)
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 100,
  message: "Too many requests from this IP, please try again in an hour", // (429) :- Too Many Requests
});

app.use("/api", limiter);

// limit the size of the JSON request body to 10 kilobytes
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

/*
sanitizing user input by removing or replacing certain characters that
could be used for MongoDB operator injection attacks
*/
app.use(mongoSanitize());

/*
prevent cross-site scripting (XSS) attacks by sanitizing user input and
escaping potentially malicious characters.
*/
app.use(xss());

app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2) Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/nurseries", nurseryRouter);
app.use("/api/v1/reviews", reviewRouter);

// Handling unHandled Routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 3) Error handling middleware
app.use(globalErrorHandler);

// 4) Start the server
module.exports = app;
