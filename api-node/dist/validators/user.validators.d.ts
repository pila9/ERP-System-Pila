import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    roleId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    phone: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    password: string;
    isActive: boolean;
    code?: string | undefined;
    roleId?: string | null | undefined;
    phone?: string | undefined;
    avatar?: string | undefined;
}, {
    email: string;
    name: string;
    password: string;
    code?: string | undefined;
    roleId?: string | null | undefined;
    phone?: string | undefined;
    avatar?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    roleId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    phone: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    email?: string | undefined;
    name?: string | undefined;
    roleId?: string | null | undefined;
    phone?: string | undefined;
    avatar?: string | undefined;
    isActive?: boolean | undefined;
}, {
    code?: string | undefined;
    email?: string | undefined;
    name?: string | undefined;
    roleId?: string | null | undefined;
    phone?: string | undefined;
    avatar?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const userQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    roleId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    sortBy: z.ZodDefault<z.ZodEnum<["name", "email", "createdAt"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "email" | "name" | "createdAt";
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    roleId?: string | undefined;
    isActive?: boolean | undefined;
}, {
    search?: string | undefined;
    roleId?: string | undefined;
    isActive?: boolean | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "email" | "name" | "createdAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
//# sourceMappingURL=user.validators.d.ts.map