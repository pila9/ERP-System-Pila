import { z } from 'zod';
export declare const reportQuerySchema: z.ZodObject<{
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
    warehouseId: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    categoryId?: string | undefined;
    warehouseId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}, {
    categoryId?: string | undefined;
    warehouseId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}>;
export declare const dashboardQuerySchema: z.ZodObject<{
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}, {
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}>;
//# sourceMappingURL=report.validators.d.ts.map