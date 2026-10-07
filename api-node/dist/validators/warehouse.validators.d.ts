import { z } from 'zod';
export declare const createWarehouseSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    manager: z.ZodOptional<z.ZodString>;
    isDefault: z.ZodDefault<z.ZodBoolean>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    isActive: boolean;
    isDefault: boolean;
    phone?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    country?: string | undefined;
    manager?: string | undefined;
}, {
    code: string;
    name: string;
    phone?: string | undefined;
    isActive?: boolean | undefined;
    address?: string | undefined;
    city?: string | undefined;
    country?: string | undefined;
    manager?: string | undefined;
    isDefault?: boolean | undefined;
}>;
export declare const updateWarehouseSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    manager: z.ZodOptional<z.ZodString>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    name?: string | undefined;
    phone?: string | undefined;
    isActive?: boolean | undefined;
    address?: string | undefined;
    city?: string | undefined;
    country?: string | undefined;
    manager?: string | undefined;
    isDefault?: boolean | undefined;
}, {
    code?: string | undefined;
    name?: string | undefined;
    phone?: string | undefined;
    isActive?: boolean | undefined;
    address?: string | undefined;
    city?: string | undefined;
    country?: string | undefined;
    manager?: string | undefined;
    isDefault?: boolean | undefined;
}>;
export declare const warehouseQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
    sortBy: z.ZodDefault<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    isActive?: boolean | undefined;
    isDefault?: boolean | undefined;
}, {
    search?: string | undefined;
    isActive?: boolean | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    isDefault?: boolean | undefined;
}>;
//# sourceMappingURL=warehouse.validators.d.ts.map