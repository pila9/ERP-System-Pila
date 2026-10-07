import { BaseService } from './base.service.js';
export declare class CategoryService extends BaseService {
    getAll(query: any): Promise<import("./base.service.js").PaginatedResult<{
        _count: {
            products: number;
        } | {
            products: number;
        };
        children: {
            id: string;
            code: string | null;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            parentId: string | null;
        }[];
        parent: {
            id: string;
            code: string | null;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            parentId: string | null;
        } | null;
    } & {
        id: string;
        code: string | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        parentId: string | null;
    }>>;
    getTree(): Promise<({
        children: ({
            children: {
                id: string;
                code: string | null;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                parentId: string | null;
            }[];
        } & {
            id: string;
            code: string | null;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            parentId: string | null;
        })[];
    } & {
        id: string;
        code: string | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        parentId: string | null;
    })[]>;
    getById(id: string): Promise<any>;
    create(data: any): Promise<{
        parent: {
            id: string;
            code: string | null;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            parentId: string | null;
        } | null;
    } & {
        id: string;
        code: string | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        parentId: string | null;
    }>;
    update(id: string, data: any): Promise<{
        parent: {
            id: string;
            code: string | null;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            parentId: string | null;
        } | null;
    } & {
        id: string;
        code: string | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        parentId: string | null;
    }>;
    delete(id: string): Promise<void>;
}
export declare const categoryService: CategoryService;
//# sourceMappingURL=category.service.d.ts.map