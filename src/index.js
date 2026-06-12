import "dotenv/config";
import express from "express";
import multer from "multer";
import crypto from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const app = express();
app.use(express.json());

// importing the middleware
import { rateLimiter } from "./middleware/rateLimiter.middleware.js";

// initialising the s3 client
if (
  !process.env.AWS_REGION ||
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_S3_BUCKET_NAME
) {
  console.error("AWS credentials are not set in environment variables.");
  process.exit(1);
}
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// initialising multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // limit file size to 5MB
});

// endpoint to handle file uploads
app.post("/upload", rateLimiter, upload.single("file"), async (req, res) => {
  try {
    // returning error if no files are uploaded
    if (!req.file) {
      console.error("No file uploaded.");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const randomName = crypto.randomBytes(14).toString("hex");
    const fileName = `${randomName}-${req.file.originalname}`;

    // uploading file to s3
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName, // the name of the file in the bucket
      Body: req.file.buffer, // the file content saved in memory by multer
      ContentType: req.file.mimetype, // the MIME type of the file e.g. "image/jpeg" or "application/pdf"
    };

    // shooting the file
    const command = new PutObjectCommand(params);
    await s3.send(command);

    // returning the final cloud url of the uploaded file
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    console.log("File uploaded successfully. URL:", fileUrl);

    res.status(200).json({
      message: "File uploaded successfully",
      url: fileUrl,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// starting the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
