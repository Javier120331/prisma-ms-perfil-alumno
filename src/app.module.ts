import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StudentModule } from './modules/student/student.module';
import { PaciProfileModule } from './modules/paci-profile/paci-profile.module';
import { PrismaService } from './common/services/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    StudentModule,
    PaciProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
