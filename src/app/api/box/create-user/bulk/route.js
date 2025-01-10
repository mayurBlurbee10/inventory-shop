import BoxSDK from "box-node-sdk";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import Papa from "papaparse";
import { logApiCall, readJsonFile, writeJsonFile } from "@/app/lib/api-log-middleware";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "users.json");

const REQUIRED_HEADERS = ["email", "name", "title", "companyName", "role"];

const sdk = new BoxSDK({
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  appAuth: {
    keyID: process.env.BOX_PUBLIC_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    passphrase: process.env.BOX_PASSPHRASE,
  },
});

const client = sdk.getAppAuthClient(
  "enterprise",
  process.env.BOX_ENTERPRISE_ID
);

export async function POST(request) {
  try {
    await logApiCall(request, () => {});
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json({ error: "File not provided" }, { status: 400 });
    }
    const fileData = await file.text();
    // const fileData = await fs.readFile(file.filepath, "utf-8");
    const parsedCsv = Papa.parse(fileData, {
      header: true,
      skipEmptyLines: true,
    });

    if (!Array.isArray(parsedCsv.data) || parsedCsv.data.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty CSV file" },
        { status: 400 }
      );
    }

    const headers = parsedCsv.meta.fields;
    const missingHeaders = REQUIRED_HEADERS.filter(
      (header) => !headers.includes(header)
    );

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required headers.",
          missingHeaders,
        },
        { status: 400 }
      );
    }

    const users = await readJsonFile(dataFilePath);
    const createdUsers = [];
    const errors = [];

    for (const row of parsedCsv.data) {
      const { email, name, title, companyName, role } = row;

      if (!email || !name || !role) {
        errors.push({ row, error: "Missing required fields" });
        continue;
      }

      if (users.some((user) => user.email === email)) {
        errors.push({ email, error: "User already exists" });
        continue;
      }

      try {
        const appUser = await client.enterprise.addAppUser(name, {
          external_app_user_id: email,
          is_platform_access_only: true,
        });

        const folder = await client.folders.create(
          "0",
          `${appUser.name}'s Files`
        );

        await client.collaborations.createWithUserID(
          appUser.id,
          folder.id,
          client.collaborationRoles.EDITOR
        );

        const newUser = {
          id: Date.now().toString(),
          email,
          name,
          title,
          companyName,
          role,
          password: "000", // Default password
          boxUserId: appUser.id || '000',
          folderId: folder.id || '000',
          createdAt: new Date().toISOString(),
        };

        users.push(newUser);
        createdUsers.push(newUser);
      } catch (error) {
        console.error("Error processing user:", email, error.message);
        errors.push({ email, error: error.message });
      }
    }
    await writeJsonFile(path.join(process.cwd(), "data"), dataFilePath, users);
    return NextResponse.json({
      success: true,
      createdUsers,
      errors,
    });
  } catch (error) {
    console.error("Error creating Box app user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Box user" },
      { status: 500 }
    );
  }
}
