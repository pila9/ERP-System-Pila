"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_js_1 = require("../controllers/user.controller.js");
const user_validators_1 = require("../validators/user.validators");
const validateRequest_js_1 = require("../middleware/validateRequest.js");
const router = (0, express_1.Router)();
router.get('/', user_controller_js_1.getUsers);
router.get('/:id', user_controller_js_1.getUser);
router.post('/', (0, validateRequest_js_1.validateRequest)(user_validators_1.createUserSchema), user_controller_js_1.createUser);
router.put('/:id', (0, validateRequest_js_1.validateRequest)(user_validators_1.updateUserSchema), user_controller_js_1.updateUser);
router.delete('/:id', user_controller_js_1.deleteUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map