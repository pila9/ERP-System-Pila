import { z } from 'zod';
export declare const salesOrderItemSchema: z.ZodObject<{
    productId: z.ZodString;
    warehouseId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    quantity: z.ZodNumber;
    unitPrice: z.ZodNumber;
    unitCost: z.ZodOptional<z.ZodNumber>;
    discount: z.ZodDefault<z.ZodNumber>;
    taxRate: z.ZodDefault<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    taxRate: number;
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    description?: string | undefined;
    warehouseId?: string | null | undefined;
    unitCost?: number | undefined;
}, {
    productId: string;
    quantity: number;
    unitPrice: number;
    description?: string | undefined;
    warehouseId?: string | null | undefined;
    taxRate?: number | undefined;
    unitCost?: number | undefined;
    discount?: number | undefined;
}>;
export declare const createSalesOrderSchema: z.ZodObject<{
    customerId: z.ZodString;
    warehouseId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    orderDate: z.ZodUnion<[z.ZodString, z.ZodString]>;
    expectedDate: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodString]>>>;
    status: z.ZodDefault<z.ZodEnum<["draft", "confirmed", "shipped", "completed", "cancelled"]>>;
    discountType: z.ZodDefault<z.ZodEnum<["fixed", "percentage"]>>;
    discountValue: z.ZodDefault<z.ZodNumber>;
    shipping: z.ZodDefault<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    terms: z.ZodOptional<z.ZodString>;
    reference: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        warehouseId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        unitCost: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodDefault<z.ZodNumber>;
        taxRate: z.ZodDefault<z.ZodNumber>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        taxRate: number;
        productId: string;
        quantity: number;
        unitPrice: number;
        discount: number;
        description?: string | undefined;
        warehouseId?: string | null | undefined;
        unitCost?: number | undefined;
    }, {
        productId: string;
        quantity: number;
        unitPrice: number;
        description?: string | undefined;
        warehouseId?: string | null | undefined;
        taxRate?: number | undefined;
        unitCost?: number | undefined;
        discount?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "confirmed" | "shipped" | "completed" | "cancelled";
    customerId: string;
    orderDate: string;
    discountType: "fixed" | "percentage";
    discountValue: number;
    shipping: number;
    items: {
        taxRate: number;
        productId: string;
        quantity: number;
        unitPrice: number;
        discount: number;
        description?: string | undefined;
        warehouseId?: string | null | undefined;
        unitCost?: number | undefined;
    }[];
    warehouseId?: string | null | undefined;
    notes?: string | undefined;
    expectedDate?: string | null | undefined;
    terms?: string | undefined;
    reference?: string | undefined;
}, {
    customerId: string;
    orderDate: string;
    items: {
        productId: string;
        quantity: number;
        unitPrice: number;
        description?: string | undefined;
        warehouseId?: string | null | undefined;
        taxRate?: number | undefined;
        unitCost?: number | undefined;
        discount?: number | undefined;
    }[];
    status?: "draft" | "confirmed" | "shipped" | "completed" | "cancelled" | undefined;
    warehouseId?: string | null | undefined;
    notes?: string | undefined;
    expectedDate?: string | null | undefined;
    discountType?: "fixed" | "percentage" | undefined;
    discountValue?: number | undefined;
    shipping?: number | undefined;
    terms?: string | undefined;
    reference?: string | undefined;
}>;
export declare const updateSalesOrderSchema: z.ZodObject<{
    customerId: z.ZodOptional<z.ZodString>;
    warehouseId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    orderDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>;
    expectedDate: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodString]>>>;
    status: z.ZodOptional<z.ZodEnum<["draft", "confirmed", "shipped", "completed", "cancelled"]>>;
    discountType: z.ZodOptional<z.ZodEnum<["fixed", "percentage"]>>;
    discountValue: z.ZodOptional<z.ZodNumber>;
    shipping: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    terms: z.ZodOptional<z.ZodString>;
    reference: z.ZodOptional<z.ZodString>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        warehouseId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        unitCost: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodDefault<z.ZodNumber>;
        taxRate: z.ZodDefault<z.ZodNumber>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        taxRate: number;
        productId: string;
        quantity: number;
        unitPrice: number;
        discount: number;
        description?: string | undefined;
        warehouseId?: string | null | undefined;
        unitCost?: number | undefined;
    }, {
        productId: string;
        quantity: number;
        unitPrice: number;
        description?: string | undefined;
        warehouseId?: string | null | undefined;
        taxRate?: number | undefined;
        unitCost?: number | undefined;
        discount?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status?: "draft" | "confirmed" | "shipped" | "completed" | "cancelled" | undefined;
    warehouseId?: string | null | undefined;
    notes?: string | undefined;
    customerId?: string | undefined;
    orderDate?: string | undefined;
    expectedDate?: string | null | undefined;
    discountType?: "fixed" | "percentage" | undefined;
    discountValue?: number | undefined;
    shipping?: number | undefined;
    terms?: string | undefined;
    reference?: string | undefined;
    items?: {
        taxRate: number;
        productId: string;
        quantity: number;
        unitPrice: number;
        discount: number;
        description?: string | undefined;
        warehouseId?: string | null | undefined;
        unitCost?: number | undefined;
    }[] | undefined;
}, {
    status?: "draft" | "confirmed" | "shipped" | "completed" | "cancelled" | undefined;
    warehouseId?: string | null | undefined;
    notes?: string | undefined;
    customerId?: string | undefined;
    orderDate?: string | undefined;
    expectedDate?: string | null | undefined;
    discountType?: "fixed" | "percentage" | undefined;
    discountValue?: number | undefined;
    shipping?: number | undefined;
    terms?: string | undefined;
    reference?: string | undefined;
    items?: {
        productId: string;
        quantity: number;
        unitPrice: number;
        description?: string | undefined;
        warehouseId?: string | null | undefined;
        taxRate?: number | undefined;
        unitCost?: number | undefined;
        discount?: number | undefined;
    }[] | undefined;
}>;
export declare const salesOrderQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    customerId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["draft", "confirmed", "shipped", "completed", "cancelled"]>>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["number", "orderDate", "grandTotal", "createdAt"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "number" | "createdAt" | "orderDate" | "grandTotal";
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    status?: "draft" | "confirmed" | "shipped" | "completed" | "cancelled" | undefined;
    customerId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}, {
    search?: string | undefined;
    status?: "draft" | "confirmed" | "shipped" | "completed" | "cancelled" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "number" | "createdAt" | "orderDate" | "grandTotal" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    customerId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}>;
//# sourceMappingURL=salesOrder.validators.d.ts.map