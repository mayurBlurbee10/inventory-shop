import type { ShopMember } from "@prisma/client";
import type { Session } from "../lib/session.js";

declare global {
    namespace Express {
        interface Request {
            session: Session;
            shopId?: string;
            shop?: any;
            // undefined = not looked up yet, null = owner / no membership
            member?: ShopMember | null;
        }
    }
}