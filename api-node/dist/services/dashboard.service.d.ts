export declare class DashboardService {
    getOverview(query: any): Promise<{
        stats: {
            salesOrders: number;
            purchaseOrders: number;
            invoices: number;
            products: number;
            customers: number;
            suppliers: number;
            salesRevenue: number;
            purchaseCost: number;
            outstandingReceivables: number;
            outstandingPayables: number;
            lowStockCount: number;
        };
        recentSalesOrders: ({
            customer: {
                name: string;
            };
            items: ({
                product: {
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
        })[];
        recentInvoices: ({
            customer: {
                name: string;
            };
        } & {
            number: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            notes: string | null;
            customerId: string;
            discountType: string;
            discountValue: import("@prisma/client/runtime/library").Decimal;
            shipping: import("@prisma/client/runtime/library").Decimal;
            terms: string | null;
            grandTotal: import("@prisma/client/runtime/library").Decimal;
            userId: string | null;
            discountAmount: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            taxTotal: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal;
            cancelledAt: Date | null;
            salesOrderId: string | null;
            invoiceDate: Date;
            dueDate: Date | null;
            paidAt: Date | null;
            sentAt: Date | null;
        })[];
    }>;
    getSalesChart(query: any): Promise<{
        date: string;
        total: number;
    }[]>;
    getTopProducts(limit?: number): Promise<{
        product: ({
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
        }) | undefined;
        quantitySold: number;
        revenue: number;
    }[]>;
    getTopCustomers(limit?: number): Promise<{
        customer: {
            id: string;
            code: string;
            name: string;
        };
        totalInvoices: number;
        totalRevenue: number;
        totalPaid: number;
        outstanding: number;
    }[]>;
}
export declare const dashboardService: DashboardService;
//# sourceMappingURL=dashboard.service.d.ts.map