const { z } = require('zod');

const submitCheckInSchema = z.object({
  currentWeight: z.number().min(20).max(300).optional(),
  adherenceScore: z.number().int().min(1).max(5, 'Adherence score must be between 1 and 5'),
  energyRating: z.number().int().min(1).max(5, 'Energy rating must be between 1 and 5'),
  sorenessLevel: z.number().int().min(1).max(5, 'Soreness level must be between 1 and 5'),
  userFeedback: z.string().max(1000).optional(),
  autoApplyAdjustments: z.boolean().default(true),
});

module.exports = {
  submitCheckInSchema,
};
