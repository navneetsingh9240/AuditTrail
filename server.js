/**
 * WEEK 1 — Dashboard/API scaffolding entry point.
 * Wires the Command router and Query router (CQRS) to the database layer.
 * Run the projection worker separately: npm run worker
 */
//Audit trail 
const express = require("express");
const { connectDB } = require("./config/db");
const commandRoutes = require("./routes/commands");
const queryRoutes = require("./routes/queries");

const app = express();
app.use(express.json({limit:"100kb"}));
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

app.use("/shipment", commandRoutes); // writes  (Commands)
app.use("/shipment", queryRoutes);
//Health check endpoint
app.get("/health",(req,res)=>{
  res.status(200).json({
    success: true,
    message: "AuditTrail server is running",
    timestamp: new
    Date().toISOString()
  });
});
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl
  });
}); // reads   (Queries)

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down server...");
    server.close(() => {
        console.log("Server closed.");
        process.exit(0);
    });
});
  })
  .catch((err) => {
    console.error("[server] failed to connect to DB:", err);
    process.exit(1);
  });

module.exports = app;
