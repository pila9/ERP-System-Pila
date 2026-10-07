import { z } from 'zod';
export declare const stockMovementSchema: z.ZodObject<{
    productId: z.ZodString;
    warehouseId: z.ZodString;
    toWarehouseId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodEnum<["in", "out", "transfer", "adjustment", "return"]>;
    quantity: z.ZodNumber;
    unitCost: z.ZodDefault<z.ZodNumber>;
    referenceId: z.ZodOptional<z.ZodString>;
    referenceType: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "in" | "out" | "transfer" | "adjustment" | "return";
    warehouseId: string;
    productId: string;
    quantity: number;
    unitCost: number;
    referenceId?: string | undefined;
    referenceType?: string | undefined;
    note?: string | undefined;
    toWarehouseId?: string | null | undefined;
}, {
    type: "in" | "out" | "transfer" | "adjustment" | "return";
    warehouseId: string;
    productId: string;
    quantity: number;
    unitCost?: number | undefined;
    referenceId?: string | undefined;
    referenceType?: string | undefined;
    note?: string | undefined;
    toWarehouseId?: string | null | undefined;
}>;
export declare const stockLevelQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    productId: z.ZodOptional<z.ZodString>;
    warehouseId: z.ZodOptional<z.ZodString>;
    lowStock: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    warehouseId?: string | undefined;
    lowStock?: boolean | undefined;
    productId?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    warehouseId?: string | undefined;
    lowStock?: boolean | undefined;
    productId?: string | undefined;
}>;
export declare const stockMovementQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    productId: z.ZodOptional<z.ZodString>;
    warehouseId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["in", "out", "transfer", "adjustment", "return"]>>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "type", "quantity"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "createdAt" | "type" | "quantity";
    sortOrder: "asc" | "desc";
    type?: "in" | "out" | "transfer" | "adjustment" | "return" | undefined;
    warehouseId?: string | undefined;
    productId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}, {
    type?: "in" | "out" | "transfer" | "adjustment" | "return" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "createdAt" | "type" | "quantity" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    warehouseId?: string | undefined;
    productId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}>;
//# sourceMappingURL=stock.validators.d.ts.map