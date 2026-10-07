"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const unit_controller_js_1 = require("../controllers/unit.controller.js");
const unit_validators_1 = require("../validators/unit.validators");
const validateRequest_js_1 = require("../middleware/validateRequest.js");
const router = (0, express_1.Router)();
router.get('/', unit_controller_js_1.getUnits);
router.get('/:id', unit_controller_js_1.getUnit);
router.post('/', (0, validateRequest_js_1.validateRequest)(unit_validators_1.createUnitSchema), unit_controller_js_1.createUnit);
router.put('/:id', (0, validateRequest_js_1.validateRequest)(unit_validators_1.updateUnitSchema), unit_controller_js_1.updateUnit);
router.delete('/:id', unit_controller_js_1.deleteUnit);
exports.default = router;
//# sourceMappingURL=unit.routes.js.map