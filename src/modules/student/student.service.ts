import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import pdfParse from 'pdf-parse';

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, colegioId: string | null, createStudentDto: CreateStudentDto) {
    const normalized = {
      ...createStudentDto,
      fechaNacimiento: this.normalizeDate(createStudentDto.fechaNacimiento),
    };
    return this.prisma.student.create({
      data: {
        ...normalized,
        userId,
        colegioId,
      },
    });
  }

  async findAll(userId: string, colegioId: string | null) {
    const where: any = { userId };
    if (colegioId) {
      where.colegioId = colegioId;
    }
    return this.prisma.student.findMany({
      where,
      include: {
        paciProfiles: true,
      },
    });
  }

  async findOne(userId: string, id: string, colegioId: string | null) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        paciProfiles: true,
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    if (student.userId !== userId) {
      throw new ForbiddenException('You do not have access to this student.');
    }

    if (colegioId && student.colegioId !== colegioId) {
      throw new ForbiddenException('You do not have access to this student.');
    }

    return student;
  }

  async findByUserId(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: { userId },
      include: {
        paciProfiles: true,
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with userId ${userId} not found`);
    }

    return student;
  }

  async update(userId: string, id: string, colegioId: string | null, updateStudentDto: UpdateStudentDto) {
    const existing = await this.findOne(userId, id, colegioId);

    const normalized = {
      ...updateStudentDto,
      ...(updateStudentDto.fechaNacimiento
        ? { fechaNacimiento: this.normalizeDate(updateStudentDto.fechaNacimiento) }
        : {}),
    };

    return this.prisma.student.update({
      where: { id: existing.id },
      data: normalized,
    });
  }

  async remove(userId: string, id: string, colegioId: string | null) {
    const existing = await this.findOne(userId, id, colegioId);

    return this.prisma.student.delete({
      where: { id: existing.id },
    });
  }

  async importFromPdf(userId: string, colegioId: string | null, file: Buffer) {
    try {
      const data = await (pdfParse as any)(file);
      const text = data.text;

      const lines = text.split('\n').filter(line => line.trim());

      const students: CreateStudentDto[] = [];
      for (const line of lines) {
        if (line.includes('RUT:') || line.includes('rut:')) {
          const studentData = this.parseStudentLine(line);
          if (studentData) {
            students.push(studentData);
          }
        }
      }

      const createdStudents = await this.prisma.student.createMany({
        data: students.map(s => ({
          ...s,
          fechaNacimiento: this.normalizeDate(s.fechaNacimiento) as Date,
          userId,
          colegioId,
        })),
        skipDuplicates: true,
      });

      return {
        message: 'Import completed successfully',
        count: createdStudents.count,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse PDF: ${message}`);
    }
  }

  private parseStudentLine(line: string): CreateStudentDto | null {
    const parts = line.split(/[,;|]/).map(p => p.trim());

    if (parts.length >= 3) {
      return {
        nombreCompleto: parts[1] || '',
        fechaNacimiento: parts[2] || '',
        cursoActual: parts[3] || '',
      };
    }

    return null;
  }

  private normalizeDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date;
  }
}
