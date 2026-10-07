import { BaseService } from './base.service.js';
export declare class SalesOrderService extends BaseService {
    getAll(query: any, userId?: string): Promise<import("./base.service.js").PaginatedResult<{
        user: {
            id: string;
            name: string;
        } | null;
        warehouse: {
            id: string;
            name: string;
        } | null;
        customer: {
            id: string;
            code: string;
            name: string;
        };
        items: ({
            product: {
                unit: {
                    abbreviation: string;
                } | null;
                id: string;
                code: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            total: import("@prisma/client/runtime/library").Decimal;
            warehouseId: string | null;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            salesOrderId: string;
            fulfilledQty: import("@prisma/client/runtime/library").Decimal;
            taxAmount: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        number: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        warehouseId: string | null;
        notes: string | null;
        customerId: string;
        orderDate: Date;
        expectedDate: Date | null;
        discountType: string;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        shipping: import("@prisma/client/runtime/library").Decimal;
        terms: string | null;
        reference: string | null;
        grandTotal: import("@prisma/client/runtime/library").Decimal;
        userId: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        taxTotal: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
        confirmedAt: Date | null;
        shippedAt: Date | null;
        completedAt: Date | null;
        cancelledAt: Date | null;
    }>>;
    getById(id: string): Promise<any>;
    generateNumber(): Promise<string>;
    create(data: any, userId: string): Promise<{
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
        } | null;
        customer: {
            id: string;
            code: string;
            email: string | null;
            name: string;
            phone: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            city: string | null;
            country: string | null;
            company: string | null;
            taxNumber: string | null;
            state: string | null;
            postalCode: string | null;
            creditLimit: import("@prisma/client/runtime/library").Decimal;
            paymentTermsDays: number;
            notes: string | null;
        };
        items: ({
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
            } | null;
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
            description: string | null;
            total: import("@prisma/client/runtime/library").Decimal;
            warehouseId: string | null;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            salesOrderId: string;
            fulfilledQty: import("@prisma/client/runtime/library").Decimal;
            taxAmount: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        number: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        warehouseId: string | null;
        notes: string | null;
        customerId: string;
        orderDate: Date;
        expectedDate: Date | null;
        discountType: string;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        shipping: import("@prisma/client/runtime/library").Decimal;
        terms: string | null;
        reference: string | null;
        grandTotal: import("@prisma/client/runtime/library").Decimal;
        userId: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        taxTotal: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
        confirmedAt: Date | null;
        shippedAt: Date | null;
        completedAt: Date | null;
        cancelledAt: Date | null;
    }>;
    update(id: string, data: any): Promise<{
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
        } | null;
        customer: {
            id: string;
            code: string;
            email: string | null;
            name: string;
            phone: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            city: string | null;
            country: string | null;
            company: string | null;
            taxNumber: string | null;
            state: string | null;
            postalCode: string | null;
            creditLimit: import("@prisma/client/runtime/library").Decimal;
            paymentTermsDays: number;
            notes: string | null;
        };
        items: ({
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
            } | null;
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
            description: string | null;
            total: import("@prisma/client/runtime/library").Decimal;
            warehouseId: string | null;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            salesOrderId: string;
            fulfilledQty: import("@prisma/client/runtime/library").Decimal;
            taxAmount: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        number: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        warehouseId: string | null;
        notes: string | null;
        customerId: string;
        orderDate: Date;
        expectedDate: Date | null;
        discountType: string;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        shipping: import("@prisma/client/runtime/library").Decimal;
        terms: string | null;
        reference: string | null;
        grandTotal: import("@prisma/client/runtime/library").Decimal;
        userId: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        taxTotal: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
        confirmedAt: Date | null;
        shippedAt: Date | null;
        completedAt: Date | null;
        cancelledAt: Date | null;
    }>;
    updateStatus(id: string, status: string): Promise<{
        number: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        warehouseId: string | null;
        notes: string | null;
        customerId: string;
        orderDate: Date;
        expectedDate: Date | null;
        discountType: string;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        shipping: import("@prisma/client/runtime/library").Decimal;
        terms: string | null;
        reference: string | null;
        grandTotal: import("@prisma/client/runtime/library").Decimal;
        userId: string | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        taxTotal: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
        confirmedAt: Date | null;
        shippedAt: Date | null;
        completedAt: Date | null;
        cancelledAt: Date | null;
    }>;
    delete(id: string): Promise<void>;
}
export declare const salesOrderService: SalesOrderService;
//# sourceMappingURL=salesOrder.service.d.ts.map