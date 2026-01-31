import { Router } from 'express';
import * as violationController from '../controllers/violation.controller';
import * as approvalController from '../controllers/approval.controller';
import * as appealController from '../controllers/appeal.controller';
import * as statsController from '../controllers/stats.controller';

import * as automationController from '../controllers/automation.controller';

const router = Router();

// Internal/Automation
router.post('/internal/trigger-auto', automationController.triggerSystemViolation);

// Basic CRUD
router.get('/', violationController.getViolations);
router.post('/', violationController.createViolation);
router.get('/:id', violationController.getViolationById);
router.put('/:id', violationController.updateViolation);
router.delete('/:id', violationController.deleteViolation);

// Approval Workflow
router.post('/:id/approve-walikelas', approvalController.approveWaliKelas);
router.post('/:id/approve-bk', approvalController.approveBK);
router.post('/:id/reject', approvalController.rejectViolation);

// Appeal System
router.post('/:id/appeal', appealController.submitAppeal);
router.post('/:id/appeal/review', appealController.reviewAppeal);

// Stats
router.get('/stats/summary', statsController.getStatsSummary);
router.get('/stats/repeat-offenders', statsController.getRepeatOffenders);

export default router;
