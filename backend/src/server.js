import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Audit Trail Backend] Server listening on port ${PORT}`);
  console.log(`[CQRS Router] Command API mounted at /api/commands (POST)`);
  console.log(`[CQRS Router] Query API mounted at /api/queries (GET)`);
});
