import { BaseService } from './base.service.js';
export declare class AuthService extends BaseService {
    login(email: string, password: string): Promise<{
        user: {
            id: string;
            code: string | null;
            name: string;
            email: string;
            phone: string | null;
            avatar: string | null;
            roleId: string | null;
            role: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                description: string | null;
                permissions: import("@prisma/client/runtime/library").JsonValue | null;
                isSystem: boolean;
            } | null;
            isActive: true;
        };
        token: string;
    }>;
    register(data: {
        name: string;
        email: string;
        password: string;
        roleId?: string;
    }): Promise<{
        user: {
            role: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                description: string | null;
                permissions: import("@prisma/client/runtime/library").JsonValue | null;
                isSystem: boolean;
            } | null;
        } & {
            id: string;
            code: string | null;
            email: string;
            name: string;
            emailVerifiedAt: Date | null;
            password: string;
            roleId: string | null;
            phone: string | null;
            avatar: string | null;
            isActive: boolean;
            lastLoginAt: Date | null;
            rememberToken: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        token: string;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        code: string | null;
        name: string;
        email: string;
        phone: string | null;
        avatar: string | null;
        roleId: string | null;
        role: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            description: string | null;
            permissions: import("@prisma/client/runtime/library").JsonValue | null;
            isSystem: boolean;
        } | null;
        isActive: boolean;
        lastLoginAt: Date | null;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    verifyToken(token: string): {
        id: string;
        email: string;
        name: string;
        roleId: string | null;
    };
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map