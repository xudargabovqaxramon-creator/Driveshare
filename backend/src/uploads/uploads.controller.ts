import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { multerOptions } from './multer.config';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Uploads')
@ApiBearerAuth('JWT-auth')
// Fix 13: uploads are only for LESSORs managing car images and ADMINs
@Roles(UserRole.LESSOR, UserRole.ADMIN)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('single')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a single image (LESSOR/ADMIN)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  uploadSingle(@UploadedFile() file: Express.Multer.File) {
    this.uploadsService.validateFile(file);
    return {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: this.uploadsService.getPublicUrl(file.filename),
    };
  }

  @Post('multiple')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload multiple images — max 10 (LESSOR/ADMIN)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    return files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: this.uploadsService.getPublicUrl(file.filename),
    }));
  }
}
