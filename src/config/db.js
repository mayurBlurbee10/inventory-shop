import { ApiLogs } from "@/entities/ApiLogs";
import { ContentManagement } from "@/entities/ContentManagement";
import { Portals } from "@/entities/Portals";
import { Users } from "@/entities/Users";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "mssql",
  host: process.env.DB_SERVER,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [ApiLogs, ContentManagement, Portals, Users],
  logging: true,
  synchronize: true,
});

export const connectDatabase = async () => {
  console.log('connect Database: ', AppDataSource.isInitialized)
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log("TypeORM connected");
  }
};

export const getConnection = () => {
  if (!AppDataSource.isInitialized) {
    console.log('get connection: ', 'Connection not established')
    throw new Error("Connection not established");
  }
  console.log(AppDataSource.options.entities);
  console.log(
    "Registered Entities:",
    AppDataSource.entityMetadatas.map((meta) => meta.name)
  );
  console.log("Entity Metadata:", AppDataSource.entityMetadatas);
  return AppDataSource;
};
