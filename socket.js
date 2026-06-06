const { Server } = require("socket.io");

let io;

const initSocket = (server) => {

  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:8080",
        "https://easygoing-caring-production-9f2c.up.railway.app"
      ],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {

    console.log("✅ Socket Connected:", socket.id);

    socket.on("joinCompany", (companyId) => {

      if (companyId) {
        socket.join(companyId.toString());

        console.log(
          `🏢 Company Room Joined: ${companyId}`
        );
      }

    });

    socket.on("disconnect", () => {
      console.log(
        "❌ Socket Disconnected:",
        socket.id
      );
    });

  });

};

const getIO = () => {

  if (!io) {
    throw new Error(
      "Socket.IO not initialized"
    );
  }

  return io;
};

module.exports = {
  initSocket,
  getIO
};