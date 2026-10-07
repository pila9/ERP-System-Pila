import { Router } from 'express';
import { getUnits, getUnit, createUnit, updateUnit, deleteUnit } from '../controllers/unit.controller.js';
import { createUnitSchema, updateUnitSchema } from '../validators/unit.validators';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', getUnits);
router.get('/:id', getUnit);
router.post('/', validateRequest(createUnitSchema), createUnit);
router.put('/:id', validateRequest(updateUnitSchema), updateUnit);
router.delete('/:id', deleteUnit);

export default router;