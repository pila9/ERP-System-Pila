import { BaseService } from './base.service.js';
export declare class StockService extends BaseService {
    getLevels(query: any): Promise<import("./base.service.js").PaginatedResult<{
        warehouse: {
            id: string;
            code: string;
            name: string;
            phone: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            city: string | null;
            country: string | null;
            manager: string | null;
            isDefault: boolean;
        };
        product: {
            unit: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                abbreviation: string;
            } | null;
        } & {
            id: string;
            code: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            categoryId: string | null;
            unitId: string | null;
            sku: string | null;
            barcode: string | null;
            costPrice: import("@prisma/client/runtime/library").Decimal;
            salePrice: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            trackInventory: boolean;
            reorderLevel: import("@prisma/client/runtime/library").Decimal;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        reservedQty: import("@prisma/client/runtime/library").Decimal;
    }>>;
    getMovements(query: any): Promise<import("./base.service.js").PaginatedResult<{
        user: {
            id: string;
            name: string;
        } | null;
        warehouse: {
            id: string;
            code: string;
            name: string;
            phone: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            city: string | null;
            country: string | null;
            manager: string | null;
            isDefault: boolean;
        };
        product: {
            unit: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                abbreviation: string;
            } | null;
        } & {
            id: string;
            code: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            categoryId: string | null;
            unitId: string | null;
            sku: string | null;
            barcode: string | null;
            costPrice: import("@prisma/client/runtime/library").Decimal;
            salePrice: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            trackInventory: boolean;
            reorderLevel: import("@prisma/client/runtime/library").Decimal;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal;
        };
        toWarehouse: {
            id: string;
            code: string;
            name: string;
            phone: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            city: string | null;
            country: string | null;
            manager: string | null;
            isDefault: boolean;
        } | null;
    } & {
        number: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        warehouseId: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        userId: string | null;
        balanceAfter: import("@prisma/client/runtime/library").Decimal;
        referenceId: string | null;
        referenceType: string | null;
        note: string | null;
        toWarehouseId: string | null;
    }>>;
    createMovement(data: any, userId: string): Promise<{
        user: {
            id: string;
            name: string;
        } | null;
        warehouse: {
            id: string;
            code: string;
            name: string;
            phone: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            city: string | null;
            country: string | null;
            manager: string | null;
            isDefault: boolean;
        };
        product: {
            unit: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                abbreviation: string;
            } | null;
        } & {
            id: string;
            code: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            categoryId: string | null;
            unitId: string | null;
            sku: string | null;
            barcode: string | null;
            costPrice: import("@prisma/client/runtime/library").Decimal;
            salePrice: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            trackInventory: boolean;
            reorderLevel: import("@prisma/client/runtime/library").Decimal;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal;
        };
        toWarehouse: {
            id: string;
            code: string;
            name: string;
            phone: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            city: string | null;
            country: string | null;
            manager: string | null;
            isDefault: boolean;
        } | null;
    } & {
        number: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        warehouseId: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        userId: string | null;
        balanceAfter: import("@prisma/client/runtime/library").Decimal;
        referenceId: string | null;
        referenceType: string | null;
        note: string | null;
        toWarehouseId: string | null;
    }>;
    getLowStock(warehouseId?: string): Promise<({
        warehouse: {
            id: string;
            code: string;
            name: string;
            phone: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            city: string | null;
            country: string | null;
            manager: string | null;
            isDefault: boolean;
        };
        product: {
            unit: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                abbreviation: string;
            } | null;
        } & {
            id: string;
            code: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            categoryId: string | null;
            unitId: string | null;
            sku: string | null;
            barcode: string | null;
            costPrice: import("@prisma/client/runtime/library").Decimal;
            salePrice: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            trackInventory: boolean;
            reorderLevel: import("@prisma/client/runtime/library").Decimal;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        reservedQty: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    getStockValuation(warehouseId?: string): Promise<{
        product: {
            id: string;
            code: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            categoryId: string | null;
            unitId: string | null;
            sku: string | null;
            barcode: string | null;
            costPrice: import("@prisma/client/runtime/library").Decimal;
            salePrice: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            trackInventory: boolean;
            reorderLevel: import("@prisma/client/runtime/library").Decimal;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal;
        };
        quantity: number;
        unitCost: number;
        totalValue: number;
    }[]>;
}
export declare const stockService: StockService;
//# sourceMappingURL=stock.service.d.ts.map