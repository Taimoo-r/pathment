const Joi = require('joi');

const levelValidation = {
  // Create level validation
  createLevel: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Level name is required',
        'string.min': 'Level name must be at least 2 characters',
        'string.max': 'Level name cannot exceed 100 characters'
      }),

    description: Joi.string()
      .min(10)
      .max(1000)
      .allow('')
      .messages({
        'string.min': 'Description must be at least 10 characters',
        'string.max': 'Description cannot exceed 1000 characters'
      }),

    orderIndex: Joi.number()
      .integer()
      .min(0)
      .required()
      .messages({
        'number.base': 'Order index must be a number',
        'number.min': 'Order index must be 0 or greater',
        'any.required': 'Order index is required'
      }),

    durationWeeks: Joi.number()
      .integer()
      .min(1)
      .max(52)
      .required()
      .messages({
        'number.base': 'Duration must be a number',
        'number.min': 'Duration must be at least 1 week',
        'number.max': 'Duration cannot exceed 52 weeks',
        'any.required': 'Duration is required'
      }),

    learningOutcomes: Joi.array()
      .items(Joi.string().max(500))
      .max(20)
      .messages({
        'array.max': 'Cannot have more than 20 learning outcomes',
        'string.max': 'Each learning outcome cannot exceed 500 characters'
      }),

    prerequisites: Joi.array()
      .items(Joi.string().max(200))
      .max(10)
      .messages({
        'array.max': 'Cannot have more than 10 prerequisites',
        'string.max': 'Each prerequisite cannot exceed 200 characters'
      }),

    requiredSkills: Joi.array()
      .items(Joi.string().max(100))
      .max(20)
      .messages({
        'array.max': 'Cannot have more than 20 required skills',
        'string.max': 'Each skill cannot exceed 100 characters'
      }),

    isOptional: Joi.boolean()
      .default(false),

    passingCriteria: Joi.string()
      .max(500)
      .allow('')
      .messages({
        'string.max': 'Passing criteria cannot exceed 500 characters'
      })
  }),

  // Update level validation
  updateLevel: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .messages({
        'string.min': 'Level name must be at least 2 characters',
        'string.max': 'Level name cannot exceed 100 characters'
      }),

    description: Joi.string()
      .min(10)
      .max(1000)
      .allow('')
      .messages({
        'string.min': 'Description must be at least 10 characters',
        'string.max': 'Description cannot exceed 1000 characters'
      }),

    orderIndex: Joi.number()
      .integer()
      .min(0)
      .messages({
        'number.base': 'Order index must be a number',
        'number.min': 'Order index must be 0 or greater'
      }),

    durationWeeks: Joi.number()
      .integer()
      .min(1)
      .max(52)
      .messages({
        'number.base': 'Duration must be a number',
        'number.min': 'Duration must be at least 1 week',
        'number.max': 'Duration cannot exceed 52 weeks'
      }),

    learningOutcomes: Joi.array()
      .items(Joi.string().max(500))
      .max(20),

    prerequisites: Joi.array()
      .items(Joi.string().max(200))
      .max(10),

    requiredSkills: Joi.array()
      .items(Joi.string().max(100))
      .max(20),

    isOptional: Joi.boolean(),

    passingCriteria: Joi.string()
      .max(500)
      .allow('')
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  }),

  // Reorder levels validation
  reorderLevels: Joi.object({
    levelIds: Joi.array()
      .items(Joi.string().uuid())
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one level ID is required',
        'any.required': 'Level IDs array is required',
        'string.guid': 'Invalid level ID format'
      })
  })
};

module.exports = levelValidation;
