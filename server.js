const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Catching Uncaght Exception
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION 🔴 shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

// load environment variables from a .env file
dotenv.config({ path: "./config.env" });

const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

/*
{
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  }
*/

mongoose.connect(DB).then(() => console.log("DB Connected Successfully!"));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App Listening On Port ${port}...`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLER REJECTION 🔴 shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    // to shut down the server
    process.exit(1);
  });
});
