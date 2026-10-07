import { BaseService } from './base.service.js';
export declare class RoleService extends BaseService {
    getAll(query: any): Promise<import("./base.service.js").PaginatedResult<{
        _count: {
            users: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
        isSystem: boolean;
    }>>;
    getById(id: string): Promise<any>;
    create(data: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
        isSystem: boolean;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
        isSystem: boolean;
    }>;
    delete(id: string): Promise<void>;
}
export declare const roleService: RoleService;
//# sourceMappingURL=role.service.d.ts.map