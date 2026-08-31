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
app.use(express.json());

app.use("/shipment", commandRoutes); // writes  (Commands)
app.use("/shipment", queryRoutes);
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
}); // reads   (Queries)

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
  })
  .catch((err) => {
    console.error("[server] failed to connect to DB:", err);
    process.exit(1);
  });

module.exports = app;
