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
        url: 'http://localhost:5000',
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
  apis: ['./src/routes/*.ts', './src/app.ts'], // Path to API docs
};

export const swaggerSpec = swaggerJsdoc(options);
