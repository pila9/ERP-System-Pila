import { BaseService } from './base.service.js';
export declare class UserService extends BaseService {
    getAll(query: any): Promise<import("./base.service.js").PaginatedResult<{
        role: {
            id: string;
            name: string;
            slug: string;
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
    }>>;
    getById(id: string): Promise<any>;
    create(data: any): Promise<{
        role: {
            id: string;
            name: string;
            slug: string;
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
    }>;
    update(id: string, data: any): Promise<{
        role: {
            id: string;
            name: string;
            slug: string;
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
    }>;
    delete(id: string): Promise<void>;
}
export declare const userService: UserService;
//# sourceMappingURL=user.service.d.ts.map