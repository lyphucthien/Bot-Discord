const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

function createApp() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  app.use(express.static(path.join(__dirname, "../public")));

  return { app, server, io };
}

module.exports = { createApp };