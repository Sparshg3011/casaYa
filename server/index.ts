import express from 'express';
import cors from 'cors';
import { ensureStorageBuckets } from './lib/supabase';
import landlordRoutes from './routes/landlord.routes';
import tenantRoutes from './routes/tenant.routes';

const app = express();
const port = process.env.PORT || 4000;

// Initialize storage buckets
ensureStorageBuckets().catch(console.error);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/landlord', landlordRoutes);
app.use('/api/tenant', tenantRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 