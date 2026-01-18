import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import tenantRoutes from './routes/tenant.routes';
import landlordRoutes from './routes/landlord.routes';
import propertyRoutes from './routes/property.routes';
import scoringRoutes from './routes/scoring.routes';
import profileRoutes from './routes/profile.routes';
import newsletterRoutes from './routes/newsletter.routes';
import testEmailRoutes from './routes/test-email.routes';

dotenv.config();

const app: Express = express();

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      // Production domains
      'https://rentcasaya.com',
      'https://www.rentcasaya.com',
      'https://api.rentcasaya.com',
      /^https:\/\/[a-zA-Z0-9-]+\.rentcasaya\.com$/,  // Allow all subdomains
      // Vercel domains
      'https://rentcasaya.vercel.app',
      'https://rentcasaya-server.vercel.app',
      'https://rentcasaya-client.vercel.app',
      /^https:\/\/rentcasaya-client(?:-[a-z0-9-]+)?\.vercel\.app$/,  // Match any client deployment URL
      /\.vercel\.app$/  // Allow all vercel.app subdomains as fallback
    ];
    
    if (!origin || allowedOrigins.some(allowed => 
      typeof allowed === 'string' ? origin === allowed : allowed.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-supabase-id']
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/tenant', tenantRoutes);
app.use('/api/landlord', landlordRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/scoring', scoringRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/test-email', testEmailRoutes);

// Add this after your other middleware setup
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  next();
});

// Only start the server if we're not in a serverless environment
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
    console.log(`📚 Swagger documentation available at http://localhost:${port}/api-docs`);
  });
}

// Export the Express app
export default app;
