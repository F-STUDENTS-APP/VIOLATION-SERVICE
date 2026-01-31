import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendResponse, sendError } from '../utils/response';

export const triggerSystemViolation = async (req: Request, res: Response) => {
  const { studentId, studentName, studentClass, categoryCode, categoryName, points, notes } =
    req.body;

  // Check if a similar violation exists for today to avoid duplicates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.violation.findFirst({
    where: {
      studentId,
      categoryCode,
      violationDate: {
        gte: today,
      },
      status: { not: 'REJECTED' },
    },
  });

  if (existing) {
    return sendResponse(
      res,
      200,
      true,
      'Violation already exists for today, skipping auto-trigger'
    );
  }

  const violation = await prisma.violation.create({
    data: {
      studentId,
      studentName: studentName || 'Student',
      studentNisn: req.body.studentNisn || '0000000000',
      studentClass: studentClass || 'Unknown',
      categoryId: req.body.categoryId || 'system-category-id',
      categoryCode: categoryCode || 'AUTO_VIOLATION',
      categoryName: categoryName || 'Automated Violation',
      categorySeverity: 'RINGAN',
      points: points || 5,
      violationDate: new Date(),
      academicYear: req.body.academicYear || '2024/2025',
      semester: req.body.semester || 1,
      description: notes || 'Automated violation triggered by system',
      status: 'PENDING',
      reportedBy: 'SYSTEM',
      reportedByName: 'System Automation',
      reporterRole: 'SYSTEM',
      createdBy: 'SYSTEM',
    },
  });

  await prisma.violationApprovalHistory.create({
    data: {
      violationId: violation.id,
      action: 'SUBMIT',
      fromStatus: 'PENDING',
      toStatus: 'PENDING',
      approverUserId: 'SYSTEM',
      approverName: 'System Automation',
      approverRole: 'SYSTEM',
      notes: 'Automated trigger from system component',
    },
  });

  return sendResponse(res, 201, true, 'Automated violation recorded', violation);
};
