import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadsService {
  getFilePath(filename: string): string {
    return join(process.env.UPLOAD_DEST || './uploads', filename);
  }

  deleteFile(filename: string): void {
    const filePath = this.getFilePath(filename);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  getPublicUrl(filename: string): string {
    return `/uploads/${filename}`;
  }

  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
  }
}
