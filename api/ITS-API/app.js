const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const bodyParser = require("body-parser");

dotenv.config();

const { swaggerUi, swaggerSpec } = require("./swagger");

// ================== Here Import Routes=================
const userRoute = require("./routers/userRoutes");
const roleRoute = require("./routers/roleRoutes");
const rolePermissionRoute = require("./routers/rolePermissionRoutes");
const userRoleRoute = require("./routers/userRoleRoutes");
const authRoute = require("./routers/authRoutes");

const issueCategories = require("./routers/issueCategoryRoutes");
const issuePriorities = require("./routers/issuePriorityRoutes");

const issueRoutes = require("./routers/issueRoutes");
const issueAssignmentRoutes = require("./routers/issueAssignmentRoutes");
const issueEscalationRoutes = require("./routers/issueEscaltionRoute");

const app = express();
const appServer = http.createServer(app);

// ================== Middleware ==================
app.use(express.json());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// ===========Serve static files (PDFs, uploads)=====================
app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders: (res, filePath) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      if (filePath.endsWith(".pdf")) {
        res.set("Content-Disposition", "inline");
      }
    },
  })
);

// ================== CORS Configuration ==================
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:4000",
  process.env.FRONTEND_URL,
];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

// ================== Database Connection ==================
const { sequelize } = require("./models");

sequelize
  .authenticate()
  .then(() => console.log(" Database connected successfully"))
  .catch((err) => console.error(" Database connection error:", err));

// ================== Swagger Setup ==================
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ================== API Routes go here ==================

app.use("/api/users", userRoute);
app.use("/api/roles", roleRoute);
app.use("/api/role-permission", rolePermissionRoute);
app.use("/api/user-roles", userRoleRoute);

app.use("/api/auth", authRoute);

app.use("/api/issue-categories", issueCategories);
app.use("/api/issue-priorities", issuePriorities);
app.use("/api/issues", issueRoutes);
app.use("/api/assignments", issueAssignmentRoutes);
app.use("/api/issue-escalations", issueEscalationRoutes);
// ================== Root Endpoint ==================
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Issue Tracking System API 🚀" });
});

// ================== Error Handler ==================
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ================== Start App Server ==================
const appPort = process.env.PORT || 4000;
appServer.listen(appPort, () => {
  console.log(` App server running at http://localhost:${appPort}`);
});

// ================== Socket.IO Setup ==================
const socketServer = http.createServer();
const io = new Server(socketServer, {
  cors: corsOptions,
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    onlineUsers.set(userId, socket.id);
    console.log(` User ${userId} connected: ${socket.id}`);
  }

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    console.log(`User ${userId} disconnected`);
  });
});

const socketPort = process.env.SOCKET_PORT || 5000;
socketServer.listen(socketPort, () => {
  console.log(`Socket.IO server running at http://localhost:${socketPort}`);
});

// Make Socket.IO accessible globally
app.set("socketio", io);

module.exports = { appServer, io, onlineUsers };
