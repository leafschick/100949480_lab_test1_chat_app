require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
const User = require("./models/User");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const PORT = process.env.PORT || 3000;

/* Middleware */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/view", express.static(path.join(__dirname, "view")));

/* MongoDB Connection */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err.message));

/* Routes */

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "view", "home.html"));
});

// IMPORTANT: prevent "Cannot GET /view/" by always redirecting /view to your rooms page
app.get("/view", (req, res) => {
  res.redirect("/view/rooms.html");
});

app.get("/view/", (req, res) => {
  res.redirect("/view/rooms.html");
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "lab_test1_chat_app",
    time: new Date().toISOString()
  });
});

/* Signup API */
app.post("/api/signup", async (req, res) => {
  try {
    const { username, forename, surname, pass, sport } = req.body;

    if (!username || !forename || !surname || !pass || !sport) {
      return res.status(400).json({
        success: false,
        message: "All fields are required."
      });
    }

    const existingUser = await User.findOne({ username: username.trim() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username already exists. Please choose another."
      });
    }

    const newUser = new User({
      username: username.trim(),
      forename: forename.trim(),
      surname: surname.trim(),
      pass: pass.trim(),
      sport: sport.trim()
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "Signup successful!",
      user: {
        username: newUser.username,
        forename: newUser.forename,
        surname: newUser.surname,
        sport: newUser.sport,
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

/* Login API */
app.post("/api/login", async (req, res) => {
  try {
    const { username, pass } = req.body;

    if (!username || !pass) {
      return res.status(400).json({
        success: false,
        message: "Username and password required."
      });
    }

    const user = await User.findOne({ username: username.trim() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Sorry but at this time we cannot find the user. Please try again later."
      });
    }

    if (user.pass !== pass.trim()) {
      return res.status(401).json({
        success: false,
        message: "This is an incorrect password. Try again with the correct password."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      user: {
        username: user.username,
        forename: user.forename,
        surname: user.surname,
        sport: user.sport
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error: " + err.message
    });
  }
});

/* Socket.io */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join Room (load old messages here)
  socket.on("joinRoom", async ({ username, room }) => {
    if (!username || !room) return;

    socket.join(room);
    socket.data.username = username;
    socket.data.room = room;

    console.log(`${username} joined ${room}`);

    io.to(room).emit("roomNotice", {
      message: `${username} joined ${room}`
    });

    //  Send old messages ONLY to this user (history)
    try {
      const oldMessages = await Message.find({ room }).sort({ date_sent: 1 });

      oldMessages.forEach((msg) => {
        socket.emit("roomMessage", {
          username: msg.from_user,
          message: msg.message,
          time: new Date(msg.date_sent).toLocaleTimeString()
        });
      });
    } catch (err) {
      console.log("History load error:", err.message);
    }
  });

  // Send message to room + save in MongoDB
  socket.on("sendRoomMessage", async ({ username, room, message }) => {
    if (!username || !room || !message) return;

    try {
      await Message.create({
        from_user: username,
        room,
        message
      });

      io.to(room).emit("roomMessage", {
        username,
        message,
        time: new Date().toLocaleTimeString()
      });
    } catch (err) {
      console.log("Message save error:", err.message);
    }
  });

  // Typing indicator
  socket.on("typing", (data) => {
    const username = data?.username;
    const isTyping = !!data?.isTyping;
    const room = socket.data?.room;

    if (!username || !room) return;

    socket.to(room).emit("typing", {
      username,
      isTyping
    });
  });

  // Leave room
  socket.on("leaveRoom", ({ username, room }, done) => {
    if (!username || !room) {
      if (typeof done === "function") done({ ok: false });
      return;
    }

    socket.leave(room);
    console.log(`${username} left ${room}`);

    io.to(room).emit("roomNotice", {
      message: `${username} left ${room}`
    });

    if (typeof done === "function") done({ ok: true });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


/* Start Server */
server.listen(PORT, () => {
  console.log(`
====================================
Chat Server Started Successfully
URL: http://localhost:${PORT}
Time: ${new Date().toLocaleString()}
====================================
  `);
});
