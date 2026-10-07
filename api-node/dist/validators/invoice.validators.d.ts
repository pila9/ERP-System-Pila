import { z } from 'zod';
export declare const invoiceItemSchema: z.ZodObject<{
    productId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    salesOrderItemId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    description: z.ZodOptional<z.ZodString>;
    quantity: z.ZodDefault<z.ZodNumber>;
    unitPrice: z.ZodNumber;
    discount: z.ZodDefault<z.ZodNumber>;
    taxRate: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    taxRate: number;
    quantity: number;
    unitPrice: number;
    discount: number;
    description?: string | undefined;
    productId?: string | null | undefined;
    salesOrderItemId?: string | null | undefined;
}, {
    unitPrice: number;
    description?: string | undefined;
    taxRate?: number | undefined;
    productId?: string | null | undefined;
    quantity?: number | undefined;
    discount?: number | undefined;
    salesOrderItemId?: string | null | undefined;
}>;
export declare const createInvoiceSchema: z.ZodObject<{
    customerId: z.ZodString;
    salesOrderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    invoiceDate: z.ZodUnion<[z.ZodString, z.ZodString]>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodString]>>>;
    status: z.ZodDefault<z.ZodEnum<["draft", "sent", "paid", "partial", "cancelled"]>>;
    discountType: z.ZodDefault<z.ZodEnum<["fixed", "percentage"]>>;
    discountValue: z.ZodDefault<z.ZodNumber>;
    shipping: z.ZodDefault<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    terms: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        salesOrderItemId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodString>;
        quantity: z.ZodDefault<z.ZodNumber>;
        unitPrice: z.ZodNumber;
        discount: z.ZodDefault<z.ZodNumber>;
        taxRate: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        taxRate: number;
        quantity: number;
        unitPrice: number;
        discount: number;
        description?: string | undefined;
        productId?: string | null | undefined;
        salesOrderItemId?: string | null | undefined;
    }, {
        unitPrice: number;
        description?: string | undefined;
        taxRate?: number | undefined;
        productId?: string | null | undefined;
        quantity?: number | undefined;
        discount?: number | undefined;
        salesOrderItemId?: string | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "cancelled" | "sent" | "paid" | "partial";
    customerId: string;
    discountType: "fixed" | "percentage";
    discountValue: number;
    shipping: number;
    items: {
        taxRate: number;
        quantity: number;
        unitPrice: number;
        discount: number;
        description?: string | undefined;
        productId?: string | null | undefined;
        salesOrderItemId?: string | null | undefined;
    }[];
    invoiceDate: string;
    notes?: string | undefined;
    terms?: string | undefined;
    salesOrderId?: string | null | undefined;
    dueDate?: string | null | undefined;
}, {
    customerId: string;
    items: {
        unitPrice: number;
        description?: string | undefined;
        taxRate?: number | undefined;
        productId?: string | null | undefined;
        quantity?: number | undefined;
        discount?: number | undefined;
        salesOrderItemId?: string | null | undefined;
    }[];
    invoiceDate: string;
    status?: "draft" | "cancelled" | "sent" | "paid" | "partial" | undefined;
    notes?: string | undefined;
    discountType?: "fixed" | "percentage" | undefined;
    discountValue?: number | undefined;
    shipping?: number | undefined;
    terms?: string | undefined;
    salesOrderId?: string | null | undefined;
    dueDate?: string | null | undefined;
}>;
export declare const updateInvoiceSchema: z.ZodObject<{
    customerId: z.ZodOptional<z.ZodString>;
    salesOrderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    invoiceDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodString]>>>;
    status: z.ZodOptional<z.ZodEnum<["draft", "sent", "paid", "partial", "cancelled"]>>;
    discountType: z.ZodOptional<z.ZodEnum<["fixed", "percentage"]>>;
    discountValue: z.ZodOptional<z.ZodNumber>;
    shipping: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    terms: z.ZodOptional<z.ZodString>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        salesOrderItemId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodString>;
        quantity: z.ZodDefault<z.ZodNumber>;
        unitPrice: z.ZodNumber;
        discount: z.ZodDefault<z.ZodNumber>;
        taxRate: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        taxRate: number;
        quantity: number;
        unitPrice: number;
        discount: number;
        description?: string | undefined;
        productId?: string | null | undefined;
        salesOrderItemId?: string | null | undefined;
    }, {
        unitPrice: number;
        description?: string | undefined;
        taxRate?: number | undefined;
        productId?: string | null | undefined;
        quantity?: number | undefined;
        discount?: number | undefined;
        salesOrderItemId?: string | null | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status?: "draft" | "cancelled" | "sent" | "paid" | "partial" | undefined;
    notes?: string | undefined;
    customerId?: string | undefined;
    discountType?: "fixed" | "percentage" | undefined;
    discountValue?: number | undefined;
    shipping?: number | undefined;
    terms?: string | undefined;
    items?: {
        taxRate: number;
        quantity: number;
        unitPrice: number;
        discount: number;
        description?: string | undefined;
        productId?: string | null | undefined;
        salesOrderItemId?: string | null | undefined;
    }[] | undefined;
    salesOrderId?: string | null | undefined;
    invoiceDate?: string | undefined;
    dueDate?: string | null | undefined;
}, {
    status?: "draft" | "cancelled" | "sent" | "paid" | "partial" | undefined;
    notes?: string | undefined;
    customerId?: string | undefined;
    discountType?: "fixed" | "percentage" | undefined;
    discountValue?: number | undefined;
    shipping?: number | undefined;
    terms?: string | undefined;
    items?: {
        unitPrice: number;
        description?: string | undefined;
        taxRate?: number | undefined;
        productId?: string | null | undefined;
        quantity?: number | undefined;
        discount?: number | undefined;
        salesOrderItemId?: string | null | undefined;
    }[] | undefined;
    salesOrderId?: string | null | undefined;
    invoiceDate?: string | undefined;
    dueDate?: string | null | undefined;
}>;
export declare const invoiceQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    customerId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["draft", "sent", "paid", "partial", "cancelled"]>>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["number", "invoiceDate", "grandTotal", "createdAt"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "number" | "createdAt" | "grandTotal" | "invoiceDate";
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    status?: "draft" | "cancelled" | "sent" | "paid" | "partial" | undefined;
    customerId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}, {
    search?: string | undefined;
    status?: "draft" | "cancelled" | "sent" | "paid" | "partial" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "number" | "createdAt" | "grandTotal" | "invoiceDate" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    customerId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}>;
export declare const createPaymentSchema: z.ZodObject<{
    invoiceId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    amount: z.ZodNumber;
    paidAt: z.ZodString;
    method: z.ZodDefault<z.ZodEnum<["cash", "card", "bank_transfer", "check", "other"]>>;
    reference: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    paidAt: string;
    method: "other" | "cash" | "card" | "bank_transfer" | "check";
    customerId?: string | null | undefined;
    reference?: string | undefined;
    note?: string | undefined;
    invoiceId?: string | null | undefined;
}, {
    amount: number;
    paidAt: string;
    customerId?: string | null | undefined;
    reference?: string | undefined;
    note?: string | undefined;
    invoiceId?: string | null | undefined;
    method?: "other" | "cash" | "card" | "bank_transfer" | "check" | undefined;
}>;
//# sourceMappingURL=invoice.validators.d.ts.map