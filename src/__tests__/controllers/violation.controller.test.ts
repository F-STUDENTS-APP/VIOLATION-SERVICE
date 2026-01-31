import { Request, Response } from 'express';
import {
  getViolations,
  getViolationById,
  createViolation,
  updateViolation,
  deleteViolation,
} from '../../controllers/violation.controller';
import {
  mockRequest,
  mockResponse,
  mockPrismaClient,
  mockViolation,
  resetAllMocks,
  RequestWithUser,
} from '../utils/test-helpers';

jest.mock('../../config/prisma', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mockPrismaClient } = require('../utils/test-helpers');
  return {
    __esModule: true,
    default: mockPrismaClient,
  };
});

describe('Violation Controller', () => {
  let req: RequestWithUser;
  let res: Response;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse() as unknown as Response;
    resetAllMocks();
    jest.clearAllMocks();
  });

  describe('getViolations', () => {
    it('should return paginated list of violations', async () => {
      req.headers = { 'x-paging-offset': '0', 'x-paging-limit': '25' };

      mockPrismaClient.violation.findMany.mockResolvedValue([mockViolation]);
      mockPrismaClient.violation.count.mockResolvedValue(1);

      await getViolations(req as unknown as Request, res);

      expect(mockPrismaClient.violation.findMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            items: [mockViolation],
          }),
        })
      );
    });

    it('should filter by search term', async () => {
      req.headers = { 'x-paging-search': 'Test' };

      mockPrismaClient.violation.findMany.mockResolvedValue([]);
      mockPrismaClient.violation.count.mockResolvedValue(0);

      await getViolations(req as unknown as Request, res);

      const call = mockPrismaClient.violation.findMany.mock.calls[0][0];
      expect(call.where.OR).toBeDefined();
    });
  });

  describe('getViolationById', () => {
    it('should return violation detail', async () => {
      req.params = { id: 'violation-123' };

      mockPrismaClient.violation.findUnique.mockResolvedValue({
        ...mockViolation,
        approvalHistory: [],
      });

      await getViolationById(req as unknown as Request, res);

      expect(mockPrismaClient.violation.findUnique).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params = { id: 'nonexistent' };

      mockPrismaClient.violation.findUnique.mockResolvedValue(null);

      await getViolationById(req as unknown as Request, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createViolation', () => {
    it('should create new violation record', async () => {
      req.body = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        categoryId: '123e4567-e89b-12d3-a456-426614174001',
        description: 'Late to class',
        violationDate: new Date().toISOString(),
        academicYear: '2023/2024',
        semester: 1,
      };

      req.user = { id: 'teacher-123', name: 'Teacher', roles: ['GURU'] };

      mockPrismaClient.violation.create.mockResolvedValue({
        ...mockViolation,
        ...req.body,
      });

      mockPrismaClient.violationApprovalHistory.create.mockResolvedValue({});

      await createViolation(req as unknown as Request, res);

      expect(mockPrismaClient.violation.create).toHaveBeenCalled();
      expect(mockPrismaClient.violationApprovalHistory.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 on validation error', async () => {
      req.body = { description: '' }; // Invalid

      await createViolation(req as unknown as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateViolation', () => {
    it('should update violation details if PENDING', async () => {
      req.params = { id: 'violation-123' };
      req.body = { description: 'Updated desc' };

      mockPrismaClient.violation.findUnique.mockResolvedValue(mockViolation);
      mockPrismaClient.violation.update.mockResolvedValue({
        ...mockViolation,
        description: 'Updated desc',
      });

      await updateViolation(req as unknown as Request, res);

      expect(mockPrismaClient.violation.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if violation not found', async () => {
      req.params = { id: 'nonexistent' };

      mockPrismaClient.violation.findUnique.mockResolvedValue(null);

      await updateViolation(req as unknown as Request, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if violation not PENDING', async () => {
      req.params = { id: 'violation-123' };

      mockPrismaClient.violation.findUnique.mockResolvedValue({
        ...mockViolation,
        status: 'APPROVED',
      });

      await updateViolation(req as unknown as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteViolation', () => {
    it('should soft delete violation', async () => {
      req.params = { id: 'violation-123' };

      mockPrismaClient.violation.update.mockResolvedValue({});

      await deleteViolation(req as unknown as Request, res);

      expect(mockPrismaClient.violation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'violation-123' },
          data: expect.objectContaining({ isActive: false }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
