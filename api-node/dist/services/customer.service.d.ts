import { BaseService } from './base.service.js';
export declare class CustomerService extends BaseService {
    getAll(query: any): Promise<import("./base.service.js").PaginatedResult<{
        _count: {
            salesOrders: number;
            invoices: number;
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
        creditLimit: import("@prisma/client/runtime/library").Decimal;
        paymentTermsDays: number;
        notes: string | null;
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
        creditLimit: import("@prisma/client/runtime/library").Decimal;
        paymentTermsDays: number;
        notes: string | null;
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
        creditLimit: import("@prisma/client/runtime/library").Decimal;
        paymentTermsDays: number;
        notes: string | null;
    }>;
    delete(id: string): Promise<void>;
}
export declare const customerService: CustomerService;
//# sourceMappingURL=customer.service.d.ts.map