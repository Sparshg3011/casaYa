# Casaya - Property Management System

A full-stack property management system built with Node.js, Express, TypeScript, and Supabase.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- PostgreSQL (handled by Supabase)

## Project Structure

```
casaya/
├── client/          # Frontend application
└── server/          # Backend application
    ├── prisma/      # Database schema and migrations
    ├── routes/      # API routes
    ├── services/    # Business logic
    ├── middleware/  # Custom middleware
    └── models/      # Data models
```

## Supabase Setup

1. Create a new Supabase project:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Click "New Project"
   - Fill in your project details
   - Wait for the database to be provisioned

2. Get your Supabase credentials:
   - In your Supabase dashboard, go to Project Settings (gear icon)
   - Click on "API" in the sidebar
   - Note down:
     - Project URL
     - `anon/public` key
     - `service_role` key (keep this secret!)

3. Database Configuration:
   - Your database connection string will be available in the same API settings page
   - It follows the format: `postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

4. Storage Setup for Profile Images:
   - Go to Storage in your Supabase dashboard
   - Create a new bucket named `profile-images`
   - Go to "Policies" tab
   - Add the following policies for the bucket:
     
     For SELECT (read) operations:
     ```sql
     (bucket_id = 'profile-images'::text)
     ```
     
     For INSERT and UPDATE operations:
     ```sql
     ((bucket_id = 'profile-images'::text) AND (auth.uid() = (split_part(name, '/'::text, 1))::uuid))
     ```
     
     For DELETE operations:
     ```sql
     ((bucket_id = 'profile-images'::text) AND (auth.uid() = (split_part(name, '/'::text, 1))::uuid))
     ```

## Server Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment Setup:
   - Copy `.envtemplate` to `.env`:
     ```bash
     cp .envtemplate .env
     ```
   - Update `.env` with your Supabase credentials:
     ```
     PORT=3000
     NEXT_PUBLIC_SUPABASE_URL=your_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     DATABASE_URL=your_database_url
     ```

4. Initialize Prisma:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:4000` (or your specified PORT).

## API Endpoints

### Landlord Routes
- POST `/api/landlord/signup` - Register a new landlord
- POST `/api/landlord/login` - Landlord login
- GET `/api/landlord/profile` - Get landlord profile
- PUT `/api/landlord/profile` - Update landlord profile
- PUT `/api/landlord/bank-info` - Update bank information
- POST `/api/landlord/profile-image` - Upload profile image
- DELETE `/api/landlord/profile-image` - Delete profile image

### Tenant Routes
- POST `/api/tenant/signup` - Register a new tenant
- POST `/api/tenant/login` - Tenant login
- GET `/api/tenant/profile` - Get tenant profile
- PUT `/api/tenant/profile` - Update tenant profile
- PUT `/api/tenant/bank-info` - Update bank information
- POST `/api/tenant/profile-image` - Upload profile image
- DELETE `/api/tenant/profile-image` - Delete profile image
- GET `/api/tenant/properties` - Get available properties for rent
- POST `/api/tenant/rent-request/:propertyId` - Submit rent request for a property
- GET `/api/tenant/rent-requests` - Get tenant's rent requests
- PUT `/api/tenant/rent-request/:requestId` - Update rent request

### Property Routes
- POST `/api/landlord/properties` - Add new property
- PUT `/api/landlord/properties/:propertyId` - Update property
- DELETE `/api/landlord/properties/:propertyId` - Delete property
- GET `/api/landlord/properties/:propertyId` - Get specific property

## Authentication

The application uses JWT tokens for authentication. Include the following headers in your requests:
- `Authorization: Bearer your_jwt_token`
- `x-supabase-id: your_supabase_user_id`

## Development

To run the server in development mode with hot reloading:
```bash
npm run dev
```

To build for production:
```bash
npm run build
```

To start the production server:
```bash
npm start
```

## Error Handling

The API returns standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

Error responses include a JSON object with an `error` message.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request # casaYa
