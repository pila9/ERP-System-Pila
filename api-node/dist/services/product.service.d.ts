import { BaseService } from './base.service.js';
export declare class ProductService extends BaseService {
    getAll(query: any): Promise<import("./base.service.js").PaginatedResult<{
        category: {
            id: string;
            name: string;
        } | null;
        unit: {
            id: string;
            name: string;
            abbreviation: string;
        } | null;
        stockLevels: ({
            warehouse: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            warehouseId: string;
            productId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            reservedQty: import("@prisma/client/runtime/library").Decimal;
        })[];
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
    }>>;
    getById(id: string): Promise<any>;
    create(data: any): Promise<{
        category: {
            id: string;
            code: string | null;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            parentId: string | null;
        } | null;
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
    }>;
    update(id: string, data: any): Promise<{
        category: {
            id: string;
            code: string | null;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            parentId: string | null;
        } | null;
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
    }>;
    delete(id: string): Promise<void>;
}
export declare const productService: ProductService;
//# sourceMappingURL=product.service.d.ts.map