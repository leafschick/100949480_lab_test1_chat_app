const express = require("express");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

const PORT = process.env.PORT || 3000;

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

// Socket connection of connecting a client 
io.on("connection", (socket) => {
  const connectedAt = new Date().toLocaleString();

  console.log("====================================");
  console.log("The new client is now connected");
  console.log("Socket ID:", socket.id);
  console.log("Time the client has connected at:", connectedAt);
  console.log("====================================");

  socket.on("disconnect", () => {
    console.log("Sorry but the client disconnected: Please try again later!", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`
====================================
🚀 Chat Server Started Successfully
🌐 URL: http://localhost:${PORT}
🕒 Time: ${new Date().toLocaleString()}
====================================
  `);
});
