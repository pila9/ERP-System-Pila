import { Router } from 'express';
import { login, register, getProfile, changePassword } from '../controllers/auth.controller.js';
import { loginSchema, registerSchema, changePasswordSchema } from '../validators/auth.validators';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.post('/login', validateRequest(loginSchema), login);
router.post('/register', validateRequest(registerSchema), register);
router.get('/profile', getProfile);
router.post('/change-password', validateRequest(changePasswordSchema), changePassword);

export default router;