import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE_PATH = path.join(__dirname, "../../data/users.json");

export function readData() {
  try {
    const jsonData = fs.readFileSync(DATA_FILE_PATH, "utf8");
    return JSON.parse(jsonData);
  } catch (error) {
    console.error("Error reading data file:", error);
    return { companies: [], adminUsers: [] };
  }
}

export function writeData(data: any) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing data file:", error);
    return false;
  }
}

export function validateAdminUser(email: string, password: string) {
  const data = readData();
  return data.adminUsers.find(
    (user: any) => user.email === email && user.password === password
  );
}

