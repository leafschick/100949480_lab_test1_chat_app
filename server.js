require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
const User = require("./models/User");

const app = express();
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/view", express.static(path.join(__dirname, "view")));

// MongoDB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err.message));

// Serve the test client
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "lab_test1_chat_app",
    time: new Date().toISOString()
  });
});

//  Signup API
app.post("/api/signup", async (req, res) => {
  try {
    const { username, forename, surname, pass } = req.body;

    if (!username || !forename || !surname || !pass) {
      return res.status(400).json({
        success: false,
        message: "You must add all the requriments."
      });
    }

    const existingUser = await User.findOne({ username: username.trim() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Sorry but that username already exists. Please choose another."
      });
    }

    const newUser = new User({
      username: username.trim(),
      forename: forename.trim(),
      surname: surname.trim(),
      pass: pass.trim()
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "Signup has been completed successful!",
      user: {
        username: newUser.username,
        forename: newUser.forename,
        surname: newUser.surname,
        createon: newUser.createon
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error: " + err.message
    });
  }
});

// Socket connection of connecting a client
io.on("connection", (socket) => {
  const connAt = new Date().toLocaleString();

  console.log("====================================");
  console.log("The new client is now connected");
  console.log("Socket ID:", socket.id);
  console.log("Time the client has connected at:", connAt);
  console.log("====================================");

  socket.on("disconnect", () => {
    console.log("Sorry but the client disconnected: Please try again later!", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`
====================================
Chat Server Started Successfully
URL: http://localhost:${PORT}
Time: ${new Date().toLocaleString()}
====================================
  `);
});
