import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'English Vocabulary Flashcard API',
      version: '1.0.0',
      description: 'API documentation for English Vocabulary Learning App',
      contact: {
        name: 'API Support',
        email: 'support@vocabulary.com',
      },
    },
    servers: [
      {
        url: process.env.PUBLIC_API_URL || 'http://localhost:' + (process.env.PORT || 5000),
        description: 'Development server',
      },
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
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Topics',
        description: 'Vocabulary topics management',
      },
      {
        name: 'Words',
        description: 'Vocabulary words management',
      },
      {
        name: 'Learning',
        description: 'Learning sessions and progress tracking',
      },
      {
        name: 'Favorites',
        description: 'User favorite words',
      },
      {
        name: 'Admin',
        description: 'Admin management endpoints',
      },
    ],
  },
  apis: [
    path.join(__dirname, '../routes/*.{ts,js}').replace(/\\/g, '/'),
    path.join(__dirname, '../app.{ts,js}').replace(/\\/g, '/'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
