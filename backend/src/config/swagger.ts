/**
 * Swagger/OpenAPI Configuration
 * API documentation for OBEDIO Yacht Crew Management System
 */

import swaggerJSDoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'OBEDIO API Documentation',
    version,
    description: 'RESTful API for yacht crew management, guest services, and IoT device management',
    contact: {
      name: 'OBEDIO Support',
      email: 'support@obedio.com',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
    {
      url: 'https://api.obedio.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /auth/login',
      },
    },
    schemas: {
      // Authentication
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin' },
          password: { type: 'string', example: 'admin123' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'cm1234567890' },
              username: { type: 'string', example: 'admin' },
              role: { type: 'string', example: 'admin' },
            },
          },
        },
      },

      // Service Request
      ServiceRequest: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'sreq_123' },
          guestId: { type: 'string', example: 'guest_456' },
          guestName: { type: 'string', example: 'John Doe' },
          locationId: { type: 'string', example: 'loc_789' },
          locationName: { type: 'string', example: 'Stateroom 1' },
          categoryId: { type: 'string', example: 'cat_001' },
          categoryName: { type: 'string', example: 'Housekeeping' },
          status: { type: 'string', enum: ['pending', 'accepted', 'completed'], example: 'pending' },
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], example: 'normal' },
          notes: { type: 'string', example: 'Extra towels requested', nullable: true },
          acceptedBy: { type: 'string', example: 'crew_123', nullable: true },
          completedBy: { type: 'string', example: 'crew_123', nullable: true },
          acceptedAt: { type: 'string', format: 'date-time', nullable: true },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time', example: '2025-10-23T10:30:00Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2025-10-23T10:35:00Z' },
        },
      },
      CreateServiceRequestBody: {
        type: 'object',
        required: ['guestId', 'locationId', 'categoryId'],
        properties: {
          guestId: { type: 'string', example: 'guest_456' },
          locationId: { type: 'string', example: 'loc_789' },
          categoryId: { type: 'string', example: 'cat_001' },
          notes: { type: 'string', example: 'Extra towels', nullable: true },
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], example: 'normal' },
        },
      },

      // Guest
      Guest: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'guest_123' },
          firstName: { type: 'string', example: 'John' },
          lastName: { type: 'string', example: 'Doe' },
          email: { type: 'string', example: 'john.doe@example.com', nullable: true },
          phone: { type: 'string', example: '+1234567890', nullable: true },
          locationId: { type: 'string', example: 'loc_456', nullable: true },
          status: { type: 'string', enum: ['onboard', 'pre-arrival', 'departed'], example: 'onboard' },
          type: { type: 'string', enum: ['owner', 'guest', 'crew-family', 'vip'], example: 'guest' },
          vipStatus: { type: 'boolean', example: false },
          doNotDisturb: { type: 'boolean', example: false },
          allergies: { type: 'array', items: { type: 'string' }, example: ['Nuts', 'Shellfish'] },
          dietaryRestrictions: { type: 'array', items: { type: 'string' }, example: ['Vegetarian'] },
          preferences: { type: 'string', nullable: true },
          notes: { type: 'string', nullable: true },
        },
      },

      // Device
      Device: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'dev_123' },
          name: { type: 'string', example: 'Smart Button - Deck 1' },
          deviceId: { type: 'string', example: 'SB-001-A1B2C3' },
          type: { type: 'string', enum: ['smart_button', 'watch', 'repeater', 'mobile_app'], example: 'smart_button' },
          status: { type: 'string', enum: ['online', 'offline', 'low_battery', 'error'], example: 'online' },
          batteryLevel: { type: 'number', example: 85, nullable: true },
          signalStrength: { type: 'number', example: -45, nullable: true },
          firmwareVersion: { type: 'string', example: '1.2.3', nullable: true },
          locationId: { type: 'string', example: 'loc_456', nullable: true },
          assignedTo: { type: 'string', example: 'crew_789', nullable: true },
          lastSeen: { type: 'string', format: 'date-time', example: '2025-10-23T10:45:00Z' },
        },
      },

      // Location
      Location: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'loc_123' },
          name: { type: 'string', example: 'Stateroom 1' },
          type: { type: 'string', enum: ['stateroom', 'cabin', 'deck', 'salon', 'galley', 'crew-quarters', 'bridge', 'other'], example: 'stateroom' },
          floor: { type: 'string', example: 'Main Deck', nullable: true },
          capacity: { type: 'number', example: 2, nullable: true },
          status: { type: 'string', enum: ['available', 'occupied', 'maintenance', 'reserved'], example: 'occupied' },
          doNotDisturb: { type: 'boolean', example: false },
          imageUrl: { type: 'string', example: 'https://example.com/location.jpg', nullable: true },
        },
      },

      // Crew Member
      CrewMember: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'crew_123' },
          name: { type: 'string', example: 'Jane Smith' },
          position: { type: 'string', example: 'Chief Stewardess' },
          department: { type: 'string', example: 'Interior' },
          email: { type: 'string', example: 'jane@yacht.local', nullable: true },
          phone: { type: 'string', example: '+1234567890', nullable: true },
          status: { type: 'string', enum: ['active', 'on-leave', 'off-duty'], example: 'active' },
          role: { type: 'string', example: 'chief-stewardess', nullable: true },
        },
      },

      // Error Response
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Error message' },
        },
      },

      // Success Response
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation successful' },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required or invalid token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: 'Authentication required',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: 'Insufficient permissions',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: 'Resource not found',
            },
          },
        },
      },
      ValidationError: {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: 'Validation failed: username is required',
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization',
    },
    {
      name: 'Service Requests',
      description: 'Guest service request management',
    },
    {
      name: 'Guests',
      description: 'Guest information and management',
    },
    {
      name: 'Devices',
      description: 'IoT device management (Smart Buttons, Watches, Repeaters)',
    },
    {
      name: 'Locations',
      description: 'Yacht locations and rooms',
    },
    {
      name: 'Crew',
      description: 'Crew member management',
    },
    {
      name: 'Service Categories',
      description: 'Service request categories',
    },
    {
      name: 'Shifts',
      description: 'Duty shift configurations',
    },
    {
      name: 'Assignments',
      description: 'Crew duty assignments',
    },
    {
      name: 'System',
      description: 'System settings and monitoring',
    },
  ],
  security: [
    {
      BearerAuth: [],
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/server.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
