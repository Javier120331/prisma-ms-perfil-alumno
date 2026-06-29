import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [StudentController],
  providers: [StudentService, PrismaService],
  exports: [StudentService],
})
export class StudentModule {}
