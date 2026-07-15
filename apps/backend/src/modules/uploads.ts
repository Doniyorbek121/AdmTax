import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth';
import { BadRequest } from '../lib/errors';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(jpe?g|png|webp|heic)/.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error('Faqat rasm yuklash mumkin'));
  },
});

export const uploadsRouter = Router();

/** Rasm yuklash → { url } */
uploadsRouter.post('/', authenticate, upload.single('file'), (req, res, next) => {
  if (!req.file) return next(BadRequest('Fayl topilmadi'));
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ url });
});

export { UPLOAD_DIR };
