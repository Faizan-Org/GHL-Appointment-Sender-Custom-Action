const express = require('express');
const index = express();
const Routes = require('./routes/route');
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const bodyParser = require("body-parser");
const {WebSocketServer} = require("ws");
const http = require('http');
require("dotenv").config();

const port = process.env.PORT || 8000;

index.use(express.json());
index.use(bodyParser.urlencoded({extended: true}));
index.use(bodyParser.json());
index.use(morgan('tiny'));
index.use(cors());
index.use(helmet());

const server = http.createServer(index);
const wss = new WebSocketServer({server});
const clients = new Set();

wss.on("connection", (socket, req) => {
    console.log('A new client connected:', req.socket.remoteAddress);
    clients.add(socket);

    wss.on('error', console.error);

    socket.on("close", (id) => {
        console.log("[close] Client Disconnected, Id => ", id);
        clients.delete(socket);
    });

});

index.use((req, res, next) => {
    req.wss = wss;
    req.clients = clients;
    next();
});

index.use(Routes);

index.get("*", (_, res) => {
    res.status(200).send("Running... OK!");
})

server.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});