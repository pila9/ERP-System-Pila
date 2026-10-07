import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
        roleId: string | null;
        role?: {
            id: string;
            name: string;
            slug: string;
            permissions: any;
        };
    };
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requirePermission: (permission: string) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const generateToken: (user: {
    id: string;
    email: string;
    name: string;
    roleId: string | null;
}) => string;
export declare const verifyToken: (token: string) => {
    id: string;
    email: string;
    name: string;
    roleId: string | null;
};
//# sourceMappingURL=auth.d.ts.map