import { BaseService } from './base.service.js';
export declare class UnitService extends BaseService {
    getAll(query: any): Promise<import("./base.service.js").PaginatedResult<{
        _count: {
            products: number;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        abbreviation: string;
    }>>;
    getById(id: string): Promise<any>;
    create(data: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        abbreviation: string;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        abbreviation: string;
    }>;
    delete(id: string): Promise<void>;
}
export declare const unitService: UnitService;
//# sourceMappingURL=unit.service.d.ts.map