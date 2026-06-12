import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { env } from "../../env";
import { asyncHandler, BadRequest } from "../../lib/errors";

/** Diretório físico onde as imagens enviadas são gravadas. */
export const UPLOADS_DIR = path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Formato inválido. Envie JPG, PNG, WEBP, AVIF ou GIF."));
  },
});

export const adminUploadsRouter = Router();

adminUploadsRouter.post(
  "/",
  // single file no campo "file"
  (req, res, next) =>
    upload.single("file")(req, res, (err: unknown) => {
      if (err) return next(BadRequest(err instanceof Error ? err.message : "Falha no upload."));
      next();
    }),
  asyncHandler(async (req, res) => {
    if (!req.file) throw BadRequest("Nenhum arquivo enviado.");
    const url = `${env.PUBLIC_URL.replace(/\/$/, "")}/uploads/${req.file.filename}`;
    res.status(201).json({ url });
  }),
);
