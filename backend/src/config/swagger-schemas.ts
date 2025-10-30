/**
 * Swagger/OpenAPI Schema Definitions
 * Complete schema definitions for all OBEDIO models with correct enum values
 */

export const swaggerSchemas = {
  // ==================
  // ENUMS
  // ==================

  ServiceRequestStatus: {
    type: 'string',
    enum: ['pending', 'accepted', 'completed', 'cancelled'],
    description: 'Service request status',
    example: 'pending',
  },

  ServiceRequestPriority: {
    type: 'string',
    enum: ['low', 'normal', 'urgent', 'emergency'],
    description: 'Service request priority level',
    example: 'normal',
  },

  ServiceRequestType: {
    type: 'string',
    enum: ['call', 'service', 'emergency'],
    description: 'Type of service request',
    example: 'call',
  },

  GuestStatus: {
    type: 'string',
    enum: ['expected', 'onboard', 'ashore', 'departed'],
    description: 'Guest status on yacht',
    example: 'onboard',
  },

  GuestType: {
    type: 'string',
    enum: ['owner', 'vip', 'guest', 'partner', 'family'],
    description: 'Guest type/category',
    example: 'guest',
  },

  CrewMemberStatus: {
    type: 'string',
    enum: ['active', 'on-duty', 'off-duty', 'on-leave'],
    description: 'Crew member status',
    example: 'on-duty',
  },

  // ==================
  // MODELS
  // ==================

  ServiceRequest: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'sreq_123abc' },
      guestId: { type: 'string', example: 'guest_456def' },
      locationId: { type: 'string', example: 'loc_789ghi', nullable: true },
      categoryId: { type: 'string', example: 'cat_012jkl', nullable: true },
      requestType: { $ref: '#/components/schemas/ServiceRequestType' },
      priority: { $ref: '#/components/schemas/ServiceRequestPriority' },
      status: { $ref: '#/components/schemas/ServiceRequestStatus' },
      message: { type: 'string', example: 'Need fresh towels', nullable: true },
      voiceTranscript: { type: 'string', example: 'Please bring some water', nullable: true },
      voiceAudioUrl: { type: 'string', example: 'https://storage.example.com/audio/123.mp3', nullable: true },
      assignedTo: { type: 'string', example: 'Maria Lopez', nullable: true },
      assignedToId: { type: 'string', example: 'crew_987', nullable: true },
      guestName: { type: 'string', example: 'John Doe', nullable: true },
      guestCabin: { type: 'string', example: 'Owner Suite', nullable: true },
      acceptedAt: { type: 'string', format: 'date-time', nullable: true },
      completedAt: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'guestId', 'requestType', 'priority', 'status', 'createdAt', 'updatedAt'],
  },

  CreateServiceRequestInput: {
    type: 'object',
    properties: {
      guestId: { type: 'string', example: 'guest_456def' },
      locationId: { type: 'string', example: 'loc_789ghi' },
      requestType: { $ref: '#/components/schemas/ServiceRequestType' },
      priority: { $ref: '#/components/schemas/ServiceRequestPriority' },
      message: { type: 'string', example: 'Need assistance' },
    },
    required: ['guestId', 'requestType', 'priority'],
  },

  Guest: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'guest_123abc' },
      firstName: { type: 'string', example: 'John' },
      lastName: { type: 'string', example: 'Doe' },
      preferredName: { type: 'string', example: 'Johnny', nullable: true },
      photo: { type: 'string', example: 'https://example.com/photo.jpg', nullable: true },
      type: { $ref: '#/components/schemas/GuestType' },
      status: { $ref: '#/components/schemas/GuestStatus' },
      nationality: { type: 'string', example: 'US', nullable: true },
      languages: { type: 'array', items: { type: 'string' }, example: ['English', 'French'] },
      passportNumber: { type: 'string', example: 'P123456', nullable: true },
      locationId: { type: 'string', example: 'loc_789', nullable: true },
      checkInDate: { type: 'string', format: 'date-time', nullable: true },
      checkOutDate: { type: 'string', format: 'date-time', nullable: true },
      allergies: { type: 'array', items: { type: 'string' }, example: ['Shellfish', 'Peanuts'] },
      dietaryRestrictions: { type: 'array', items: { type: 'string' }, example: ['Vegetarian'] },
      medicalConditions: { type: 'array', items: { type: 'string' }, example: ['Diabetes'] },
      preferences: { type: 'string', example: 'Prefers room temperature water', nullable: true },
      notes: { type: 'string', example: 'VIP guest, extra attention required', nullable: true },
      emergencyContactName: { type: 'string', example: 'Jane Doe', nullable: true },
      emergencyContactPhone: { type: 'string', example: '+1234567890', nullable: true },
      emergencyContactRelation: { type: 'string', example: 'Spouse', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'firstName', 'lastName', 'type', 'status', 'createdAt', 'updatedAt'],
  },

  CreateGuestInput: {
    type: 'object',
    properties: {
      firstName: { type: 'string', example: 'John' },
      lastName: { type: 'string', example: 'Doe' },
      type: { $ref: '#/components/schemas/GuestType' },
      status: { $ref: '#/components/schemas/GuestStatus' },
      locationId: { type: 'string', example: 'loc_789' },
      checkInDate: { type: 'string', format: 'date-time' },
      checkOutDate: { type: 'string', format: 'date-time' },
    },
    required: ['firstName', 'lastName', 'type', 'status'],
  },

  CrewMember: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'crew_123abc' },
      name: { type: 'string', example: 'Maria Lopez' },
      position: { type: 'string', example: 'Chief Stewardess' },
      department: { type: 'string', example: 'Interior' },
      status: { $ref: '#/components/schemas/CrewMemberStatus' },
      contact: { type: 'string', example: '+1234567890', nullable: true },
      email: { type: 'string', example: 'maria@yacht.local', nullable: true },
      joinDate: { type: 'string', format: 'date-time', nullable: true },
      role: { type: 'string', example: 'chief-stewardess', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'name', 'position', 'department', 'status', 'createdAt', 'updatedAt'],
  },

  Location: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'loc_123abc' },
      name: { type: 'string', example: 'Owner Suite' },
      type: { type: 'string', example: 'cabin' },
      floor: { type: 'string', example: 'Main Deck', nullable: true },
      description: { type: 'string', example: 'Luxury owner suite with balcony', nullable: true },
      image: { type: 'string', example: 'https://example.com/suite.jpg', nullable: true },
      smartButtonId: { type: 'string', example: 'BTN-001', nullable: true },
      doNotDisturb: { type: 'boolean', example: false },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'name', 'type', 'doNotDisturb', 'createdAt', 'updatedAt'],
  },

  // ==================
  // RESPONSE WRAPPERS
  // ==================

  ServiceRequestResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: { $ref: '#/components/schemas/ServiceRequest' },
    },
  },

  ServiceRequestListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/ServiceRequest' },
      },
    },
  },

  GuestResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: { $ref: '#/components/schemas/Guest' },
    },
  },

  GuestListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Guest' },
      },
    },
  },

  CrewMemberResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: { $ref: '#/components/schemas/CrewMember' },
    },
  },

  CrewMemberListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/CrewMember' },
      },
    },
  },

  ErrorResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: { type: 'string', example: 'Error message' },
    },
  },
};
