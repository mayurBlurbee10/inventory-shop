import { Request, Response } from "express";
import fs from "fs";
import path from "path";

const getUploadedFile = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(process.cwd(), "public/uploads", filename);

    if (fs.existsSync(filepath)) {
      const file = fs.readFileSync(filepath);
      return res.status(200).send(file);
    } else {
      return res.status(404).json({ error: "File not found" });
    }
  } catch (error) {
    console.error("Error fetching file:", error);
    return res.status(500).json({
      error: "Failed to fetch file.",
      details: (error as Error).message,
    });
  }
};

export default {
  getUploadedFile,
};

