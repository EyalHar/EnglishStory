const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRouter = require("./routes/auth");
const onboardingRouter = require("./routes/onboarding");
const storiesRouter = require("./routes/stories");
const sessionsRouter = require("./routes/sessions");
const wordsRouter = require("./routes/words");
const progressRouter = require("./routes/progress");

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/english-story")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err.message));

app.use("/api/auth", authRouter);
app.use("/api/onboarding", onboardingRouter);
app.use("/api/stories", storiesRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/words", wordsRouter);
app.use("/api/progress", progressRouter);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
