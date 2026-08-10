import { ClientSecretCredential } from "@azure/identity";
import { SqlManagementClient } from "@azure/arm-sql";

const WAIT_TIME = 5000;

let sqlClient: SqlManagementClient | null = null;

/**
 * Create Azure SQL Client only when required.
 * This ensures environment variables are loaded before authentication.
 */
function getSqlClient(): SqlManagementClient {
    if (!sqlClient) {
        console.log("Azure Configuration Check:", {
            tenantId: process.env.AZURE_TENANT_ID ? "Loaded" : "Missing",
            clientId: process.env.AZURE_CLIENT_ID ? "Loaded" : "Missing",
            clientSecret: process.env.AZURE_CLIENT_SECRET ? "Loaded" : "Missing",
            subscriptionId: process.env.AZURE_SUBSCRIPTION_ID ? "Loaded" : "Missing",
        });

        const credential = new ClientSecretCredential(
            process.env.AZURE_TENANT_ID!,
            process.env.AZURE_CLIENT_ID!,
            process.env.AZURE_CLIENT_SECRET!,
        );

        sqlClient = new SqlManagementClient(
            credential,
            process.env.AZURE_SUBSCRIPTION_ID!,
        );
    }

    return sqlClient;
}

/**
 * Check whether database error is Azure SQL firewall error
 */
export function isFirewallError(error: any): boolean {
    const message = error?.originalError?.message || error?.message || "";

    return (
        message.includes("Cannot open server") &&
        message.includes("Client with IP address") &&
        message.includes("is not allowed to access the server")
    );
}

/**
 * Extract SQL Server name and Client IP from Azure error
 */
export function extractFirewallInfo(error: any) {
    const message = error?.originalError?.message || error?.message || "";

    const serverMatch = message.match(/Cannot open server '([^']+)'/);

    const ipMatch = message.match(/Client with IP address '([^']+)'/);

    if (!serverMatch || !ipMatch) {
        throw new Error("Unable to parse Azure SQL firewall error.");
    }

    return {
        serverName: serverMatch[1],
        ip: ipMatch[1],
    };
}

/**
 * Add Client IP into Azure SQL Firewall Rules
 */
export async function whitelistIp(error: any) {
    const client = getSqlClient();

    const { serverName, ip } = extractFirewallInfo(error);

    const resourceGroup = process.env.AZURE_RESOURCE_GROUP!;

    const now = new Date();

    const formattedDate = now.toISOString().split("T")[0];

    const formattedTime = now.toTimeString().split(" ")[0].replace(/:/g, "-");

    const firewallRuleName = `Auto-ClientIP_${formattedDate}_${formattedTime}`;

    console.log(`Azure Firewall -> Server : ${serverName}`);

    console.log(`Azure Firewall -> IP     : ${ip}`);

    console.log(`Azure Firewall -> Rule   : ${firewallRuleName}`);

    let exists = false;

    /**
     * Check existing firewall rules
     */
    for await (const rule of client.firewallRules.listByServer(
        resourceGroup,
        serverName,
    )) {
        if (rule.startIpAddress === ip && rule.endIpAddress === ip) {
            exists = true;
            break;
        }
    }

    if (exists) {
        console.log("Firewall rule already exists.");

        return;
    }

    console.log("Creating Azure firewall rule...");

    await client.firewallRules.createOrUpdate(
        resourceGroup,
        serverName,
        firewallRuleName,
        {
            startIpAddress: ip,
            endIpAddress: ip,
        },
    );

    console.log("Firewall rule created successfully.");

    /**
     * Wait for Azure firewall propagation
     */
    await new Promise((resolve) => setTimeout(resolve, WAIT_TIME));
}
