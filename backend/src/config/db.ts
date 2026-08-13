import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { ApiLogs } from "../entities/ApiLogs.ts";
import { ContentManagement } from "../entities/ContentManagement.ts";
import { Portals } from "../entities/Portals.ts";
import { Users } from "../entities/Users.ts";
import { Plugins } from "../entities/Plugins.ts";
import { Pages } from "../entities/Pages.ts";
import { Tasks } from "../entities/Tasks.ts";
import { Messages } from "../entities/Messages.ts";
import { CheckLists } from "../entities/CheckLists.ts";
import { NdaAgreements } from "../entities/NdaAgreements.ts";
import { TestDb } from "../entities/TestDb.ts";
import { InbuildPlugins } from "../entities/InbuildPlugins.ts";
import { PortalPluginConfigs } from "../entities/PortalPluginConfigs.ts";
import { InAppNotifications } from "../entities/InAppNotifications.ts";
import { Theme } from "../entities/Theme.ts";
import { UserPortals } from "../entities/UserPortals.ts";
import { isFirewallError, whitelistIp } from "../utils/azureFirewall.ts";
import { TicketSync } from "../entities/TicketSync.ts";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mssql",
  host: process.env.DB_SERVER,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [
    ApiLogs,
    ContentManagement,
    Portals,
    Users,
    Plugins,
    Pages,
    Tasks,
    Messages,
    CheckLists,
    NdaAgreements,
    TestDb,
    InbuildPlugins,
    PortalPluginConfigs,
    InAppNotifications,
    Theme,
    UserPortals,
    TicketSync
  ],
  logging: false,
  synchronize: true,
  options: {
    encrypt: true,
  },
  extra: {
    trustServerCertificate: true,
    keepAlive: true,
    connectionTimeout: 30000,
    requestTimeout: 30000,
    options: {
      useUTC: true,
    },
  },
});

export const connectDatabase = async () => {
  if (AppDataSource?.isInitialized) {
    return;
  }

  try {
    await AppDataSource?.initialize();

    console.log("TypeORM connected");
  } catch (error) {
    const isDevelopment = process.env.NODE_ENV === "development";

    if (isDevelopment && isFirewallError(error)) {
      console.log("Azure SQL firewall detected.");
      console.log("Starting automatic IP whitelist...");

      await whitelistIp(error);

      console.log("Retrying database connection...");

      await AppDataSource.initialize();

      console.log("TypeORM connected");
      return;
    }

    throw error;
  }
};

export const getConnection = () => {
  if (!AppDataSource.isInitialized) {
    throw new Error("Connection not established");
  }
  return AppDataSource;
};
