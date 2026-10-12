// import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaClient } from "@prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
    // DATABASE_URL uses the Prisma SQL Server format, e.g.
    // sqlserver://<server>.database.windows.net:1433;database=<db>;user=<user>;password=<pwd>;encrypt=true;trustServerCertificate=false
    const adapter = new PrismaMssql(process.env.DATABASE_URL!);
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export async function connectDB() {
    try {
        await prisma.$connect();
        console.log("Database connected successfully.");

        // Product / sales search depends on a case-insensitive collation (PostgreSQL used ILIKE for this).
        const [{ collation }] = await prisma.$queryRaw<{ collation: string }[]>`
            SELECT CONVERT(NVARCHAR(128), DATABASEPROPERTYEX(DB_NAME(), 'Collation')) AS collation`;
        if (collation && !/_CI_/i.test(collation)) {
            console.warn(
                `[DB] Database collation "${collation}" is case-sensitive; product and sales search will be case-sensitive. ` +
                    `Use a *_CI_* collation such as SQL_Latin1_General_CP1_CI_AS (Azure SQL default).`,
            );
        }
    } catch (error: any) {
        console.error("Database connection failed:", error?.message || error);
    }
}

export default prisma;
