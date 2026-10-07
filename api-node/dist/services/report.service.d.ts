export declare class ReportService {
    getSalesReport(query: any): Promise<{
        totalOrders: number;
        totalRevenue: number;
        byProduct: {
            name: string;
            code: string;
            quantity: number;
            revenue: number;
        }[];
        byCategory: {
            name: string;
            quantity: number;
            revenue: number;
        }[];
    }>;
    getPurchaseReport(query: any): Promise<{
        totalOrders: number;
        totalCost: number;
        byProduct: {
            name: string;
            code: string;
            quantity: number;
            cost: number;
        }[];
        bySupplier: {
            name: string;
            orders: number;
            total: number;
        }[];
    }>;
    getInventoryReport(query: any): Promise<{
        totalItems: number;
        totalValue: number;
        byWarehouse: {
            name: string;
            items: number;
            value: number;
        }[];
        byCategory: {
            name: string;
            items: number;
            value: number;
        }[];
    }>;
    getReceivablesReport(query: any): Promise<{
        totalOutstanding: number;
        byCustomer: {
            name: string;
            invoices: number;
            total: number;
            paid: number;
            outstanding: number;
        }[];
    }>;
    getPayablesReport(query: any): Promise<{
        totalOutstanding: number;
        bySupplier: {
            name: string;
            orders: number;
            total: number;
            paid: number;
            outstanding: number;
        }[];
    }>;
}
export declare const reportService: ReportService;
//# sourceMappingURL=report.service.d.ts.map