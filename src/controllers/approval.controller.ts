import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendResponse, sendError } from '../utils/response';
import {
  approveWaliKelasSchema,
  approveBKSchema,
  rejectSchema,
} from '../validators/violation.validator';

export const approveWaliKelas = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error, value } = approveWaliKelasSchema.validate(req.body);
  if (error) return sendError(res, 400, error.details[0].message);

  const violation = await prisma.violation.findUnique({ where: { id } });
  if (!violation) return sendError(res, 404, 'Violation not found');
  if (violation.status !== 'PENDING')
    return sendError(res, 400, 'Violation is not in PENDING status');

  const updated = await prisma.violation.update({
    where: { id },
    data: {
      status: 'APPROVED_WALI',
      approvedByWaliAt: new Date(),
      approvedByWaliBy: (req as any).user.id,
      approvedByWaliName: (req as any).user.name,
      waliKelasNotes: value.notes,
    },
  });

  await prisma.violationApprovalHistory.create({
    data: {
      violationId: id,
      action: 'APPROVE_WALI',
      fromStatus: 'PENDING',
      toStatus: 'APPROVED_WALI',
      approverUserId: (req as any).user.id,
      approverName: (req as any).user.name,
      approverRole: (req as any).user.roles?.[0] || 'WALIKELAS',
      notes: value.notes,
    },
  });

  return sendResponse(res, 200, true, 'Violation approved by Wali Kelas', updated);
};

export const approveBK = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error, value } = approveBKSchema.validate(req.body);
  if (error) return sendError(res, 400, error.details[0].message);

  const violation = await prisma.violation.findUnique({ where: { id } });
  if (!violation) return sendError(res, 404, 'Violation not found');
  if (violation.status !== 'APPROVED_WALI' && violation.status !== 'PENDING') {
    return sendError(res, 400, 'Violation status must be PENDING or APPROVED_WALI');
  }

  const updated = await prisma.violation.update({
    where: { id },
    data: {
      status: 'APPROVED_BK',
      approvedByBKAt: new Date(),
      approvedByBKBy: (req as any).user.id,
      approvedByBKName: (req as any).user.name,
      bkNotes: value.notes,
      sanction: value.sanction,
      sanctionStartDate: value.sanctionStartDate,
      sanctionEndDate: value.sanctionEndDate,
    },
  });

  await prisma.violationApprovalHistory.create({
    data: {
      violationId: id,
      action: 'APPROVE_BK',
      fromStatus: violation.status,
      toStatus: 'APPROVED_BK',
      approverUserId: (req as any).user.id,
      approverName: (req as any).user.name,
      approverRole: (req as any).user.roles?.[0] || 'BK',
      notes: value.notes,
    },
  });

  // TODO: Trigger points sync to student-service
  console.log(`Triggering point sync for student ${violation.studentId}`);

  return sendResponse(res, 200, true, 'Violation approved by BK (Final)', updated);
};

export const rejectViolation = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error, value } = rejectSchema.validate(req.body);
  if (error) return sendError(res, 400, error.details[0].message);

  const violation = await prisma.violation.findUnique({ where: { id } });
  if (!violation) return sendError(res, 404, 'Violation not found');

  const updated = await prisma.violation.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedBy: (req as any).user.id,
      rejectedByName: (req as any).user.name,
      rejectionReason: value.rejectionReason,
      rejectionLevel: value.rejectionLevel,
    },
  });

  await prisma.violationApprovalHistory.create({
    data: {
      violationId: id,
      action: 'REJECT',
      fromStatus: violation.status,
      toStatus: 'REJECTED',
      approverUserId: (req as any).user.id,
      approverName: (req as any).user.name,
      approverRole: (req as any).user.roles?.[0] || 'STAFF',
      notes: value.rejectionReason,
    },
  });

  return sendResponse(res, 200, true, 'Violation rejected', updated);
};
