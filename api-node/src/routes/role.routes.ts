import { Router } from 'express';
import { getRoles, getRole, createRole, updateRole, deleteRole } from '../controllers/role.controller.js';
import { createRoleSchema, updateRoleSchema } from '../validators/role.validators';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', getRoles);
router.get('/:id', getRole);
router.post('/', validateRequest(createRoleSchema), createRole);
router.put('/:id', validateRequest(updateRoleSchema), updateRole);
router.delete('/:id', deleteRole);

export default router;