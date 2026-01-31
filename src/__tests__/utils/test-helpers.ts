import { Request, Response } from 'express';

export interface RequestWithUser extends Request {
  user?: {
    id: string;
    username?: string;
    roles?: string[];
    name?: string;
  };
}

export const mockRequest = (data: Partial<RequestWithUser> = {}): RequestWithUser => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ip: '127.0.0.1',
    user: undefined,
    ...data,
  } as unknown as RequestWithUser;
};

export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
};

interface MockModel {
  findMany: jest.Mock;
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  count: jest.Mock;
  delete?: jest.Mock;
}

interface MockPrismaClient {
  violation: MockModel;
  violationApprovalHistory: {
    create: jest.Mock;
  };
  $transaction: jest.Mock;
}

export const mockPrismaClient: MockPrismaClient = {
  violation: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  violationApprovalHistory: {
    create: jest.fn(),
  },
  $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
};

export const mockViolation = {
  id: 'violation-123',
  studentId: 'student-123',
  studentName: 'Ahmad Fauzi',
  studentNisn: '0012345678',
  categoryCode: 'TERLAMBAT_MASUK',
  categoryName: 'Terlambat Masuk Sekolah',
  points: 5,
  status: 'PENDING',
  isActive: true,
  violationDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const resetAllMocks = () => {
  Object.values(mockPrismaClient).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function' && 'mockReset' in method) {
          (method as jest.Mock).mockReset();
        }
      });
    }
  });
};
