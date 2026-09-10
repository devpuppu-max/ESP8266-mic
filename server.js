const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get("/", (req, res) => {
  res.send("ESP8266 MIC SERVER WORKING");
});

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (data, isBinary) => {
    wss.clients.forEach((client) => {
      if (client !== ws &&
          client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
