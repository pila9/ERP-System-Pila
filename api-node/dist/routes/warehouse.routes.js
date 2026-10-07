"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const warehouse_controller_js_1 = require("../controllers/warehouse.controller.js");
const warehouse_validators_1 = require("../validators/warehouse.validators");
const validateRequest_js_1 = require("../middleware/validateRequest.js");
const router = (0, express_1.Router)();
router.get('/', warehouse_controller_js_1.getWarehouses);
router.get('/:id', warehouse_controller_js_1.getWarehouse);
router.post('/', (0, validateRequest_js_1.validateRequest)(warehouse_validators_1.createWarehouseSchema), warehouse_controller_js_1.createWarehouse);
router.put('/:id', (0, validateRequest_js_1.validateRequest)(warehouse_validators_1.updateWarehouseSchema), warehouse_controller_js_1.updateWarehouse);
router.delete('/:id', warehouse_controller_js_1.deleteWarehouse);
exports.default = router;
//# sourceMappingURL=warehouse.routes.js.map