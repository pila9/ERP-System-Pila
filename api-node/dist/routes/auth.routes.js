"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const auth_validators_1 = require("../validators/auth.validators");
const validateRequest_js_1 = require("../middleware/validateRequest.js");
const router = (0, express_1.Router)();
router.post('/login', (0, validateRequest_js_1.validateRequest)(auth_validators_1.loginSchema), auth_controller_js_1.login);
router.post('/register', (0, validateRequest_js_1.validateRequest)(auth_validators_1.registerSchema), auth_controller_js_1.register);
router.get('/profile', auth_controller_js_1.getProfile);
router.post('/change-password', (0, validateRequest_js_1.validateRequest)(auth_validators_1.changePasswordSchema), auth_controller_js_1.changePassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map