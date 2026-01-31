import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendResponse, sendError } from '../utils/response';

export const getStatsSummary = async (req: Request, res: Response) => {
  const academicYear = req.query.academicYear as string;
  const semester = parseInt(req.query.semester as string);

  const where = {
    deletedAt: null,
    ...(academicYear && { academicYear }),
    ...(semester && { semester }),
  };

  const total = await prisma.violation.count({ where });
  const byStatus = await prisma.violation.groupBy({
    by: ['status'],
    where,
    _count: true,
  });

  const bySeverity = await prisma.violation.groupBy({
    by: ['categorySeverity'],
    where,
    _count: true,
  });

  return sendResponse(res, 200, true, 'Statistics summary retrieved', {
    total,
    byStatus: byStatus.reduce((acc: any, curr) => ({ ...acc, [curr.status]: curr._count }), {}),
    bySeverity: bySeverity.reduce(
      (acc: any, curr) => ({ ...acc, [curr.categorySeverity]: curr._count }),
      {}
    ),
  });
};

export const getRepeatOffenders = async (req: Request, res: Response) => {
  const minViolations = parseInt(req.query.minViolations as string) || 3;
  const academicYear = req.query.academicYear as string;

  const offenders = await prisma.violationStatistics.findMany({
    where: {
      academicYear,
      totalViolations: { gte: minViolations },
    },
    orderBy: { totalViolations: 'desc' },
  });

  return sendResponse(res, 200, true, 'Repeat offenders retrieved', offenders);
};
