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
  <title>ESP8266 Mic Listener</title>
</head>

<body style="font-family:Arial;text-align:center;padding:25px">

<h2>ESP8266 Mic Listener</h2>

<p id="status">Connecting...</p>

<button onclick="startAudio()" style="font-size:22px;padding:15px">
START LISTENING
</button>

<script>

let audioContext;
let nextTime = 0;

const ws = new WebSocket(
  "wss://" + location.host
);

ws.binaryType = "arraybuffer";

ws.onopen = () => {
  document.getElementById("status").innerText =
    "Connected to server";
};

ws.onclose = () => {
  document.getElementById("status").innerText =
    "Disconnected";
};

function startAudio() {
  audioContext = new AudioContext({
    sampleRate: 8000
  });

  nextTime = audioContext.currentTime;

  document.getElementById("status").innerText =
    "Listening...";
}

ws.onmessage = function(event) {

  if (!audioContext) return;

  if (!(event.data instanceof ArrayBuffer)) return;

  const input = new Uint8Array(event.data);

  if (input.length === 0) return;

  const buffer =
    audioContext.createBuffer(
      1,
      input.length,
      8000
    );

  const channel = buffer.getChannelData(0);

  for (let i = 0; i < input.length; i++) {

    channel[i] =
      (input[i] - 128) / 128.0;
  }

  const source =
    audioContext.createBufferSource();

  source.buffer = buffer;

  source.connect(
    audioContext.destination
  );

  if (nextTime <
      audioContext.currentTime) {

    nextTime =
      audioContext.currentTime;
  }

  source.start(nextTime);

  nextTime +=
    buffer.duration;
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
  console.log("Mic server running");
});
