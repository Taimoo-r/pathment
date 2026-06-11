const Joi = require('joi');

/**
 * Changelog admin-list validation. `listQuery` caps pagination server-side so a
 * crafted `?limit=10000` can never dump the whole table — it 400s instead.
 */
module.exports = {
  listQuery: Joi.object({
    search: Joi.string().trim().max(120).optional().allow(''),
    type: Joi.string().valid('feature', 'improvement', 'fix').optional().allow(null, ''),
    status: Joi.string().valid('draft', 'published').optional().allow(null, ''),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional()
  })
};
