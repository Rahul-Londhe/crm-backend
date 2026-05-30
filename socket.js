let io;

const initSocket = (server) => {

const { Server } = require("socket.io");

io = new Server(server, {


cors: {

  origin: [
    "http://localhost:8080",
    "http://localhost:3000",
    "https://easygoing-caring-production-9f2c.up.railway.app"
  ],

  methods: ["GET", "POST", "PUT", "DELETE"],

  credentials: true

},

transports: ["websocket", "polling"]


});

io.on("connection", (socket) => {

console.log("✅ Socket Connected:", socket.id);

socket.on("joinCompany", (companyId) => {

  socket.join(companyId);

});

socket.on("disconnect", () => {

  console.log("❌ Socket Disconnected:", socket.id);

});


});

};

const getIO = () => {

if (!io) {


throw new Error("Socket.io not initialized");


}

return io;

};

module.exports = {
initSocket,
getIO
};
