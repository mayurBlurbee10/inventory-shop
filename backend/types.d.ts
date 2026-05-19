import { Request, Response } from 'express';
import { Users } from "./src/entities/Users";

declare module "papaparse" {
  export function parse(csv: string, options?: any): { data: any[]; errors: any[] };
  export default { parse };
}
declare global {
  namespace Express {
    interface Request {
      user?: User; // or `any` if you're not using a defined type
    }
    interface Response {
      user?: User; // or `any` if you're not using a defined type
    }
  }
}