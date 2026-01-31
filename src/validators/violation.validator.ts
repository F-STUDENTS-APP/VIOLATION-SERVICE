import Joi from 'joi';

export const createViolationSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  categoryId: Joi.string().uuid().required(),
  description: Joi.string().min(10).max(1000).required(),
  location: Joi.string().max(200).optional(),
  violationDate: Joi.date().max('now').required(),
  violationTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
  evidenceUrls: Joi.array().items(Joi.string().uri()).max(5).optional(),
  witnessName: Joi.string().max(100).optional(),
  witnessStatement: Joi.string().max(500).optional(),
  academicYear: Joi.string()
    .pattern(/^\d{4}\/\d{4}$/)
    .required(),
  semester: Joi.number().valid(1, 2).required(),
});

export const approveWaliKelasSchema = Joi.object({
  notes: Joi.string().max(500).optional(),
});

export const approveBKSchema = Joi.object({
  notes: Joi.string().max(500).optional(),
  sanction: Joi.string().max(500).optional(),
  sanctionStartDate: Joi.date().optional(),
  sanctionEndDate: Joi.date().greater(Joi.ref('sanctionStartDate')).optional(),
});

export const rejectSchema = Joi.object({
  rejectionReason: Joi.string().min(10).max(500).required(),
  rejectionLevel: Joi.string().valid('WALIKELAS', 'BK').required(),
});

export const appealSchema = Joi.object({
  appealReason: Joi.string().min(20).max(1000).required(),
});

export const appealReviewSchema = Joi.object({
  appealStatus: Joi.string().valid('APPROVED', 'REJECTED').required(),
  appealNotes: Joi.string().min(10).max(500).required(),
});
