import { BaseService } from './base.service.js';
export declare class SupplierService extends BaseService {
    getAll(query: any): Promise<import("./base.service.js").PaginatedResult<{
        _count: {
            purchaseOrders: number;
        };
    } & {
        id: string;
        code: string;
        email: string | null;
        name: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        city: string | null;
        country: string | null;
        company: string | null;
        taxNumber: string | null;
        state: string | null;
        postalCode: string | null;
        paymentTermsDays: number;
        notes: string | null;
        bankName: string | null;
        bankAccount: string | null;
    }>>;
    getById(id: string): Promise<any>;
    create(data: any): Promise<{
        id: string;
        code: string;
        email: string | null;
        name: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        city: string | null;
        country: string | null;
        company: string | null;
        taxNumber: string | null;
        state: string | null;
        postalCode: string | null;
        paymentTermsDays: number;
        notes: string | null;
        bankName: string | null;
        bankAccount: string | null;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        code: string;
        email: string | null;
        name: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        city: string | null;
        country: string | null;
        company: string | null;
        taxNumber: string | null;
        state: string | null;
        postalCode: string | null;
        paymentTermsDays: number;
        notes: string | null;
        bankName: string | null;
        bankAccount: string | null;
    }>;
    delete(id: string): Promise<void>;
}
export declare const supplierService: SupplierService;
//# sourceMappingURL=supplier.service.d.ts.map