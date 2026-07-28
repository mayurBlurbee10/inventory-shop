import { Request, Response } from 'express';
import { Users } from "./src/entities/Users";

declare module "papaparse" {
  export function parse(csv: string, options?: any): { data: any[]; errors: any[] };
  export default { parse };
}

declare module "xlsx" {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: Record<string, unknown>;
  }

  export interface ParsingOptions {
    type?: string;
    cellDates?: boolean;
  }

  export function read(data: Buffer | Uint8Array, opts?: ParsingOptions): WorkBook;

  export namespace utils {
    function sheet_to_json<T = unknown>(
      worksheet: unknown,
      opts?: Record<string, unknown>,
    ): T[];
  }
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