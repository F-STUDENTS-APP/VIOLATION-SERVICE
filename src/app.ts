import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import dotenv from 'dotenv';
import logger from './config/logger';
import { sendError } from './utils/response';

dotenv.config();

const app = express();
const port = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
import violationRoutes from './routes/violation.routes';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const swaggerDocument = YAML.load(path.join(__dirname, './config/swagger.yaml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/v1/violations', violationRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', service: 'violation-service' });
});

// Error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  sendError(res, status, message);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`Violation Service listening on port ${port}`);
  });
}

export default app;
