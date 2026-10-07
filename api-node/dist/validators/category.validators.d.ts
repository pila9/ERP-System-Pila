import { z } from 'zod';
export declare const createCategorySchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isActive: boolean;
    code?: string | undefined;
    description?: string | undefined;
    parentId?: string | null | undefined;
}, {
    name: string;
    code?: string | undefined;
    isActive?: boolean | undefined;
    description?: string | undefined;
    parentId?: string | null | undefined;
}>;
export declare const updateCategorySchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
    description?: string | undefined;
    parentId?: string | null | undefined;
}, {
    code?: string | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
    description?: string | undefined;
    parentId?: string | null | undefined;
}>;
export declare const categoryQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    includeChildren: z.ZodDefault<z.ZodBoolean>;
    sortBy: z.ZodDefault<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
    includeChildren: boolean;
    search?: string | undefined;
    isActive?: boolean | undefined;
    parentId?: string | null | undefined;
}, {
    search?: string | undefined;
    isActive?: boolean | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    parentId?: string | null | undefined;
    includeChildren?: boolean | undefined;
}>;
//# sourceMappingURL=category.validators.d.ts.map