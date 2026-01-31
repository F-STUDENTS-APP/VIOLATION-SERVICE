import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendResponse, sendError } from '../utils/response';
import { appealSchema, appealReviewSchema } from '../validators/violation.validator';

export const submitAppeal = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error, value } = appealSchema.validate(req.body);
  if (error) return sendError(res, 400, error.details[0].message);

  const violation = await prisma.violation.findUnique({ where: { id } });
  if (!violation) return sendError(res, 404, 'Violation not found');
  if (violation.status !== 'APPROVED_BK')
    return sendError(res, 400, 'Can only appeal finalized (APPROVED_BK) violations');

  const updated = await prisma.violation.update({
    where: { id },
    data: {
      status: 'APPEALED',
      appealReason: value.appealReason,
      appealedAt: new Date(),
      appealedBy: (req as any).user.id,
      appealStatus: 'PENDING',
    },
  });

  await prisma.violationApprovalHistory.create({
    data: {
      violationId: id,
      action: 'APPEAL',
      fromStatus: 'APPROVED_BK',
      toStatus: 'APPEALED',
      approverUserId: (req as any).user.id,
      approverName: (req as any).user.name,
      approverRole: (req as any).user.roles?.[0] || 'STUDENT',
      notes: value.appealReason,
    },
  });

  return sendResponse(res, 200, true, 'Appeal submitted successfully', updated);
};

export const reviewAppeal = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error, value } = appealReviewSchema.validate(req.body);
  if (error) return sendError(res, 400, error.details[0].message);

  const violation = await prisma.violation.findUnique({ where: { id } });
  if (!violation) return sendError(res, 404, 'Violation not found');
  if (violation.status !== 'APPEALED')
    return sendError(res, 400, 'Violation is not in APPEALED status');

  const finalStatus = value.appealStatus === 'APPROVED' ? 'APPEAL_APPROVED' : 'APPEAL_REJECTED';

  const updated = await prisma.violation.update({
    where: { id },
    data: {
      status: finalStatus,
      appealStatus: value.appealStatus,
      appealReviewedAt: new Date(),
      appealReviewedBy: (req as any).user.id,
      appealNotes: value.appealNotes,
    },
  });

  await prisma.violationApprovalHistory.create({
    data: {
      violationId: id,
      action: value.appealStatus === 'APPROVED' ? 'APPEAL_APPROVE' : 'APPEAL_REJECT',
      fromStatus: 'APPEALED',
      toStatus: finalStatus,
      approverUserId: (req as any).user.id,
      approverName: (req as any).user.name,
      approverRole: (req as any).user.roles?.[0] || 'BK',
      notes: value.appealNotes,
    },
  });

  return sendResponse(res, 200, true, `Appeal ${value.appealStatus.toLowerCase()}`, updated);
};
