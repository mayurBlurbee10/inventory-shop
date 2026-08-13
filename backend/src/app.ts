import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.ts";
import userRoutes from "./routes/user.route.ts";
import taskRoutes from "./routes/task.route.ts";
import messageRoutes from "./routes/message.route.ts";
import portalRoutes from "./routes/portal.route.ts";
import contentManagementRoutes from "./routes/contentManagement.route.ts";
import pageRoutes from "./routes/page.route.ts";
import pluginRoutes from "./routes/plugin.route.ts";
import pluginsRoutes from "../Plugins/plugins.route.ts";
import chartRoutes from "./routes/chart.route.ts";
import uploadRoutes from "./routes/upload.route.ts";
import apiLogsRoutes from "./routes/apiLogs.route.ts";
import boxFilesRoutes from "./routes/boxFiles.route.ts";
import boxFoldersRoutes from "./routes/boxFolders.route.ts";
import boxShareRoutes from "./routes/boxShare.route.ts";
import boxMoveRoutes from "./routes/boxMove.route.ts";
import boxDownloadRoutes from "./routes/boxDownload.route.ts";
import boxESignRoutes from "./routes/boxESign.route.ts";
import boxEditorRoutes from "./routes/boxEditor.route.ts";
import boxCreateUserRoutes from "./routes/boxCreateUser.route.ts";
import boxSearchRoutes from "./routes/boxSearch.route.ts";
import boxPreviewRoutes from "./routes/boxPreview.route.ts";
import boxCollaborationsRoutes from "./routes/boxCollaborations.route.ts";
import boxCommentRoutes from "./routes/boxComment.route.ts";
import boxBulkRoutes from "./routes/boxBulk.route.ts";
import boxEventsRoutes from "./routes/boxEvents.route.ts";
import zendeskRoutes from "./routes/zendesk.route.ts";
import ndaAgreementsRoutes from "./routes/ndaAgreements.route.ts";
import resetRoutes from "./routes/reset.route.ts";
// import socketRoutes from "./routes/socket.route.ts";
import checklistsRoutes from "./routes/checkList.route.ts";
import setPasswordRoutes from "./routes/setPassword.route.ts";
import zendeskToAzureRoutes from "./routes/zendeskToAzure.route.ts";
import portalPluginConfigsRoutes from "./routes/portalPluginConfigs.route.ts";
import inbuildPluginsRoutes from "./routes/inbuildPlugins.route.ts";
import azureToZendeskRoutes from "./routes/azureToZendesk.routes.ts";
import inAppnotificationRoutes from "./routes/inAppNotification.route.ts";
import realMessageRoutes from "./routes/messages.route.ts";
import themeRoutes from "./routes/theme.route.ts";
import reportsRoutes from "./routes/reports.route.ts";

dotenv.config();

const port = process.env.PORT || 5000;

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3025", process.env.NEXT_PUBLIC_APP_BASE_URL!],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api", async (_, res) => {
  res.status(200).send({ message: `Api is running: ${process.env.NEXT_PUBLIC_APP_BASE_URL}` });
});

// Health check endpoint for Azure App Service
app.get("/api/health", async (_, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "backend"
  });
});

app.use("/api/api-logs", apiLogsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/box/files", boxFilesRoutes);
app.use("/api/box/folders", boxFoldersRoutes);
app.use("/api/box/share", boxShareRoutes);
app.use("/api/box/move", boxMoveRoutes);
app.use("/api/box/download", boxDownloadRoutes);
app.use("/api/box/e-sign", boxESignRoutes);
app.use("/api/box/editor", boxEditorRoutes);
app.use("/api/box/create-user", boxCreateUserRoutes);
app.use("/api/box/search", boxSearchRoutes);
app.use("/api/box/preview", boxPreviewRoutes);
app.use("/api/box/collaborations", boxCollaborationsRoutes);
app.use("/api/box/comment", boxCommentRoutes);
app.use("/api/box/bulk", boxBulkRoutes);
app.use("/api/box/events", boxEventsRoutes);
app.use("/api/chart", chartRoutes);
app.use("/api/checklists", checklistsRoutes);
app.use("/api/contentManagement", contentManagementRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/nda-agreements", ndaAgreementsRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/plugins", pluginRoutes);
app.use("/api/plugins", pluginsRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/setPassword", setPasswordRoutes);
app.use("/api/reset", resetRoutes);
// app.use("/api/socket", socketRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/zendesk", zendeskRoutes);
app.use("/api/zendesk-to-azure", zendeskToAzureRoutes);
app.use("/api/portal-plugin-configs", portalPluginConfigsRoutes);
app.use("/api/inbuild-plugins", inbuildPluginsRoutes);
app.use("/api/real-messages", realMessageRoutes);
app.use("/api/azure", azureToZendeskRoutes); // Matches client documentation
app.use("/api/in-app-notification", inAppnotificationRoutes);
app.use("/api/theme", themeRoutes);
app.use("/api/reports", reportsRoutes);

export { app };