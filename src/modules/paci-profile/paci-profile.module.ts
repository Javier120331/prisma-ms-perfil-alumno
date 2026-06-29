import { Module } from '@nestjs/common';
import { PaciProfileService } from './paci-profile.service';
import { PaciProfileController } from './paci-profile.controller';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [PaciProfileController],
  providers: [PaciProfileService, PrismaService],
  exports: [PaciProfileService],
})
export class PaciProfileModule {}
