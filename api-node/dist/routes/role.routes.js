"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_controller_js_1 = require("../controllers/role.controller.js");
const role_validators_1 = require("../validators/role.validators");
const validateRequest_js_1 = require("../middleware/validateRequest.js");
const router = (0, express_1.Router)();
router.get('/', role_controller_js_1.getRoles);
router.get('/:id', role_controller_js_1.getRole);
router.post('/', (0, validateRequest_js_1.validateRequest)(role_validators_1.createRoleSchema), role_controller_js_1.createRole);
router.put('/:id', (0, validateRequest_js_1.validateRequest)(role_validators_1.updateRoleSchema), role_controller_js_1.updateRole);
router.delete('/:id', role_controller_js_1.deleteRole);
exports.default = router;
//# sourceMappingURL=role.routes.js.map