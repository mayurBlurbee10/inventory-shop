import { ApiLogs } from "@/entities/ApiLogs";
import { CheckLists } from "@/entities/CheckLists";
import { ContentManagement } from "@/entities/ContentManagement";
import { Messages } from "@/entities/Messages";
import { Pages } from "@/entities/Pages";
import { Plugins } from "@/entities/Plugins";
import { Portals } from "@/entities/Portals";
import { Tasks } from "@/entities/Tasks";
import { Users } from "@/entities/Users";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "mssql",
  host: process.env.DB_SERVER,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [ApiLogs, ContentManagement, Portals, Users, Plugins, Pages, Tasks, Messages, CheckLists],
  logging: false,
  synchronize: true,
});

export const connectDatabase = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log("TypeORM connected");
  }
};

export const getConnection = () => {
  if (!AppDataSource.isInitialized) {
    throw new Error("Connection not established");
  }
  // console.log(AppDataSource.options.entities);
  // console.log(
  //   "Registered Entities:",
  //   AppDataSource.entityMetadatas.map((meta) => meta.name)
  // );
  // console.log("Entity Metadata:", AppDataSource.entityMetadatas);
  return AppDataSource;
};
