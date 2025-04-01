import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import { setTimeout } from "timers";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(bodyParser.json());

// Clear all maps on server start
const EmailToSocket = new Map();
const SocketIdToEmail = new Map();

// // Clear function to reset all connections
const clearAllConnections = () => {
  EmailToSocket.clear();
  SocketIdToEmail.clear();

  // Disconnect all sockets
  io.sockets.sockets.forEach((socket) => {
    socket.disconnect(true);
  });
  console.log("🧹 Cleared all socket connections");
};

// Clear on server start
clearAllConnections();

// Handle graceful shutdown
process.on("SIGINT", () => {
  clearAllConnections();
  process.exit(0);
});

process.on("SIGTERM", () => {
  clearAllConnections();
  process.exit(0);
});

// Helper function for controlled delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // This particular socket from FE request for the Room join with specific Email and RoomID as Prop
  socket.on("room-join", (data) => {
    const { email, roomID } = data;

    console.log("Joiner Email and room:", email, roomID);

    EmailToSocket.set(email, socket.id);
    SocketIdToEmail.set(socket.id, email);

    // Subscribe to a Room.
    socket.join(roomID);
    // Emiting to the FE that the user is joined in the Room.
    socket.emit("room-joined", { roomID });
    // Emitting "user-joined" to the all client joined in the subscribed RoomID
    socket.broadcast.to(roomID).emit("user-joined", { email, roomID });
  });

  // The Offer from the caller to server need to forward to the Callee
  socket.on(
    "call-user",
    async (data: { email: string; offer: RTCSessionDescriptionInit }) => {
      const socketID = EmailToSocket.get(data.email);
      console.log("📞 Call request received for:", socketID);

      try {
        await delay(3000);
        socket.to(socketID).emit("incoming-call", {
          callerEmail: SocketIdToEmail.get(socket.id),
          offer: data.offer,
        });
        console.log("✅ Emitted incoming-call after delay");
      } catch (error) {
        console.error("❌ Error sending incoming-call:", error);
      }
    }
  );

  socket.on(
    "call-accepted",
    async ({
      callerEmail,
      ans,
    }: {
      callerEmail: string;
      ans: RTCSessionDescriptionInit;
    }) => {
      const socketID = EmailToSocket.get(callerEmail);
      console.log("📱 Call accept received for:", socketID);

      try {
        await delay(6000);
        socket.to(socketID).emit("call-accepted-by-calle", { ans });
        console.log("✅ Emitted call-accepted-by-calle after delay");
      } catch (error) {
        console.error("❌ Error sending call-accepted:", error);
      }
    }
  );

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = 8081;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
