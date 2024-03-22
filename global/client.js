const { Redis } = require("ioredis");

const client = new Redis();

// Event handler for connection errors
client.on("error", (error) => {
    console.error("Redis connection error:", error);
});

module.exports = client;