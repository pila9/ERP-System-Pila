import { Router } from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/user.controller.js';
import { createUserSchema, updateUserSchema } from '../validators/user.validators';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', validateRequest(createUserSchema), createUser);
router.put('/:id', validateRequest(updateUserSchema), updateUser);
router.delete('/:id', deleteUser);

export default router;