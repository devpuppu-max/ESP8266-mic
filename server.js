const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ESP8266 Mic</title>

  <style>
    body {
      font-family: Arial;
      text-align: center;
      background: #111;
      color: white;
      padding: 30px;
    }

    button {
      font-size: 24px;
      padding: 15px 30px;
      margin: 20px;
    }

    #bar {
      width: 90%;
      height: 35px;
      background: #333;
      margin: auto;
    }

    #level {
      height: 100%;
      width: 0%;
      background: lime;
    }
  </style>
</head>

<body>

<h2>ESP8266 Microphone</h2>

<p id="status">Not connected</p>

<button onclick="startAudio()">🔊 START LISTENING</button>

<div id="bar">
  <div id="level"></div>
</div>

<script>

let ctx;
let oscillator;
let gain;

const ws = new WebSocket(
  (location.protocol === "https:" ? "wss://" : "ws://")
  + location.host
);

ws.binaryType = "arraybuffer";

ws.onopen = () => {
  document.getElementById("status").innerText =
    "Connected to server ✅";
};

ws.onclose = () => {
  document.getElementById("status").innerText =
    "Disconnected";
};

function startAudio() {

  ctx = new AudioContext();

  oscillator = ctx.createOscillator();
  gain = ctx.createGain();

  oscillator.frequency.value = 500;
  gain.gain.value = 0;

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();

  document.getElementById("status").innerText =
    "Listening...";
}

ws.onmessage = function(event) {

  if (!(event.data instanceof ArrayBuffer))
    return;

  const data = new Uint8Array(event.data);

  if (data.length === 0)
    return;

  const sample = data[0];

  // MAX4466 signal is approximately centered
  const level =
    Math.min(100, Math.abs(sample - 128) * 1.5);

  document.getElementById("level").style.width =
    level + "%";

  if (gain && ctx) {

    gain.gain.setTargetAtTime(
      level / 500,
      ctx.currentTime,
      0.02
    );
  }
};

</script>

</body>
</html>
  `);
});


wss.on("connection", (ws) => {

  console.log("Client connected");

  ws.on("message", (data, isBinary) => {

    wss.clients.forEach(client => {

      if (
        client !== ws &&
        client.readyState === WebSocket.OPEN
      ) {

        client.send(data, {
          binary: isBinary
        });

      }

    });

  });

});


const PORT = process.env.PORT || 10000;

server.listen(PORT, "0.0.0.0", () => {

  console.log(
    "ESP8266 microphone server running"
  );

});
