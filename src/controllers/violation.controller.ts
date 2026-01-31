import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendResponse, sendError } from '../utils/response';
import { createViolationSchema } from '../validators/violation.validator';

export const getViolations = async (req: Request, res: Response) => {
  const offset = parseInt(req.headers['x-paging-offset'] as string) || 0;
  const limit = parseInt(req.headers['x-paging-limit'] as string) || 25;
  const search = req.headers['x-paging-search'] as string;
  const studentId = req.query.studentId as string;
  const status = req.query.status as any;

  const where = {
    deletedAt: null,
    ...(studentId && { studentId }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { studentName: { contains: search, mode: 'insensitive' as any } },
        { studentNisn: { contains: search, mode: 'insensitive' as any } },
        { categoryName: { contains: search, mode: 'insensitive' as any } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.violation.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { violationDate: 'desc' },
    }),
    prisma.violation.count({ where }),
  ]);

  return sendResponse(res, 200, true, 'Violations retrieved', {
    items,
    pagination: {
      offset,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const createViolation = async (req: Request, res: Response) => {
  const { error, value } = createViolationSchema.validate(req.body);
  if (error) return sendError(res, 400, error.details[0].message);

  // Mocking student and category info - usually would come from inter-service calls or be passed from frontend
  // For this implementation, we assume the frontend sends the denormalized names or we fetch them
  const studentName = 'Ahmad Fauzi'; // Mock
  const studentNisn = '0012345678'; // Mock
  const studentClass = '10 IPA 1'; // Mock
  const categoryName = 'Terlambat Masuk Sekolah'; // Mock
  const categoryCode = 'TERLAMBAT_MASUK'; // Mock
  const categorySeverity = 'RINGAN' as any; // Mock
  const points = 5; // Mock

  const violation = await prisma.violation.create({
    data: {
      ...value,
      studentName,
      studentNisn,
      studentClass,
      categoryName,
      categoryCode,
      categorySeverity,
      points,
      reportedBy: (req as any).user?.id || 'SYSTEM',
      reportedByName: (req as any).user?.name || 'System User',
      reporterRole: (req as any).user?.roles?.[0] || 'GURUMAPEL',
      createdBy: (req as any).user?.id || 'SYSTEM',
    },
  });

  await prisma.violationApprovalHistory.create({
    data: {
      violationId: violation.id,
      action: 'SUBMIT',
      fromStatus: 'PENDING',
      toStatus: 'PENDING',
      approverUserId: (req as any).user?.id || 'SYSTEM',
      approverName: (req as any).user?.name || 'System User',
      approverRole: (req as any).user?.roles?.[0] || 'GURUMAPEL',
      notes: 'Initial record submission',
    },
  });

  return sendResponse(res, 201, true, 'Violation recorded successfully', violation);
};

export const getViolationById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await prisma.violation.findUnique({
    where: { id },
    include: {
      approvalHistory: {
        orderBy: { actionDate: 'asc' },
      },
    },
  });

  if (!item) return sendError(res, 404, 'Violation not found');

  return sendResponse(res, 200, true, 'Violation detail retrieved', item);
};

export const updateViolation = async (req: Request, res: Response) => {
  const { id } = req.params;
  // Use a partial validation or update schema
  const violation = await prisma.violation.findUnique({ where: { id } });
  if (!violation) return sendError(res, 404, 'Violation not found');
  if (violation.status !== 'PENDING')
    return sendError(res, 400, 'Cannot update violation that is already processed');

  const updated = await prisma.violation.update({
    where: { id },
    data: {
      ...req.body,
      updatedBy: (req as any).user?.id || 'SYSTEM',
    },
  });

  return sendResponse(res, 200, true, 'Violation updated', updated);
};

export const deleteViolation = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.violation.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedBy: (req as any).user?.id || 'SYSTEM',
    },
  });

  return sendResponse(res, 200, true, 'Violation deleted successfully');
};
