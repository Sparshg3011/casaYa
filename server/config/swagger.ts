import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RentCasaya API Documentation',
      version: '1.0.0',
      description: 'API documentation for RentCasaya application',
      contact: {
        name: 'Yashank',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
      {
        url: 'https://rentcasaya-server.vercel.app',
        description: 'Production server',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: [
    './routes/*.ts',     // Original route files
    './docs/*.ts'        // New Swagger documentation files
  ],
};

export const swaggerSpec = swaggerJsdoc(options); 