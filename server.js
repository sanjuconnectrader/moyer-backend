import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Import the cors package
import sequelize from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import passwordRoutes from './routes/passwordRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import photographyRoutes from './routes/photographyRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
dotenv.config();
const app = express();

/* core middleware */
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

/* feature routes */
app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordRoutes);

app.use('/uploads', express.static('uploads'));   // serve images
app.use('/api/restaurants', restaurantRoutes);

app.use('/api/photography', photographyRoutes);

app.use('/api/videos', videoRoutes);

app.use('/api/admin/approval', approvalRoutes);


/* global error handler */
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

/* ---- bootstrap ---- */
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();     // swap for migrations in prod
    console.log('DB connected ✅');

    app.listen(PORT, () =>
      console.log(`API ready ➜  http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error('Unable to connect to DB ❌', err);
    process.exit(1);
  }
})();