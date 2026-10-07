export declare function toNumber(value: any): number;
export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
    take: number;
}
export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
export declare function getPaginationParams(page: number, limit: number): PaginationParams;
export declare function createPaginatedResult<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T>;
export declare class BaseService {
    protected prisma: import(".prisma/client").PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findById(model: any, id: string, include?: any): Promise<any>;
    findByIdOrThrow(model: any, id: string, include?: any): Promise<any>;
    softDelete(model: any, id: string): Promise<void>;
}
//# sourceMappingURL=base.service.d.ts.map