import { BaseService } from './base.service.js';
export declare class WarehouseService extends BaseService {
    getAll(query: any): Promise<import("./base.service.js").PaginatedResult<{
        _count: {
            stockLevels: number;
        };
    } & {
        id: string;
        code: string;
        name: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        city: string | null;
        country: string | null;
        manager: string | null;
        isDefault: boolean;
    }>>;
    getById(id: string): Promise<any>;
    create(data: any): Promise<{
        id: string;
        code: string;
        name: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        city: string | null;
        country: string | null;
        manager: string | null;
        isDefault: boolean;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        code: string;
        name: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        city: string | null;
        country: string | null;
        manager: string | null;
        isDefault: boolean;
    }>;
    delete(id: string): Promise<void>;
}
export declare const warehouseService: WarehouseService;
//# sourceMappingURL=warehouse.service.d.ts.map