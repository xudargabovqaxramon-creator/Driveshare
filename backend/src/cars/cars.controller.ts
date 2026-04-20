import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CarsService } from './cars.service';
import { CreateCarDto, UpdateCarDto, FilterCarsDto } from './dto/car.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { multerOptions } from '../uploads/multer.config';

@ApiTags('Cars')
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Post()
  @Roles(UserRole.LESSOR, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a car listing (LESSOR/ADMIN)' })
  create(@Body() dto: CreateCarDto, @CurrentUser() user: User) {
    return this.carsService.create(dto, user);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all cars with filters (public)' })
  findAll(@Query() filters: FilterCarsDto) {
    return this.carsService.findAll(filters);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get single car (public)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.findOne(id);
  }

  @Get('my/listings')
  @Roles(UserRole.LESSOR, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my car listings (LESSOR)' })
  getMyListings(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.carsService.findByOwner(user.id, +page, +limit);
  }

  @Patch(':id')
  @Roles(UserRole.LESSOR, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update own car (LESSOR owns it, or ADMIN)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCarDto,
    @CurrentUser() user: User,
  ) {
    return this.carsService.update(id, dto, user);
  }

  @Post(':id/images')
  @Roles(UserRole.LESSOR, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload car images (owner or ADMIN)' })
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
  uploadImages(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: User,
  ) {
    const imagePaths = files.map((f) => `/uploads/${f.filename}`);
    return this.carsService.addImages(id, imagePaths, user);
  }

  @Delete(':id')
  @Roles(UserRole.LESSOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Soft-delete own car (LESSOR owns it, or ADMIN)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.carsService.remove(id, user);
  }

  @Post(':id/restore')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Restore a soft-deleted car (ADMIN only)' })
  restore(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.carsService.restore(id, user);
  }
}
