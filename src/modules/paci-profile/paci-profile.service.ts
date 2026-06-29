import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { CreatePaciProfileDto } from './dto/create-paci-profile.dto';
import { UpdatePaciProfileDto } from './dto/update-paci-profile.dto';

@Injectable()
export class PaciProfileService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, colegioId: string | null, createPaciProfileDto: CreatePaciProfileDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: createPaciProfileDto.studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${createPaciProfileDto.studentId} not found`);
    }

    if (student.userId !== userId) {
      throw new ForbiddenException('You do not have access to this student.');
    }

    if (colegioId && student.colegioId !== colegioId) {
      throw new ForbiddenException('You do not have access to this student.');
    }

    const normalized = this.normalizeCreatePaciDates(userId, createPaciProfileDto);

    return this.prisma.paciProfile.create({
      data: normalized,
      include: {
        student: true,
      },
    });
  }

  async findAll(userId: string, colegioId: string | null) {
    const where: Prisma.PaciProfileWhereInput = { userId };
    if (colegioId) {
      where.student = { is: { colegioId } };
    }
    return this.prisma.paciProfile.findMany({
      where,
      include: {
        student: true,
      },
    });
  }

  async findFiltered(
    userId: string,
    colegioId: string | null,
    filters: {
      studentId?: string;
      isActive?: string;
      curso?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const where: Prisma.PaciProfileWhereInput = { userId };

    if (colegioId) {
      where.student = { is: { colegioId } };
    }

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.curso) {
      where.student = { is: { ...((where.student as any)?.is || {}), cursoActual: filters.curso } };
    }

    if (filters.fromDate || filters.toDate) {
      where.fechaElaboracion = {};
      if (filters.fromDate) {
        where.fechaElaboracion.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.fechaElaboracion.lte = new Date(filters.toDate);
      }
    }

    if (filters.isActive !== undefined) {
      const isActive = filters.isActive === 'true' || filters.isActive === '1';
      const now = new Date();
      const activeCondition: Prisma.PaciProfileWhereInput = {
        AND: [{ validFrom: { lte: now } }, { validUntil: { gte: now } }],
      };

      Object.assign(
        where,
        isActive ? activeCondition : { NOT: activeCondition },
      );
    }

    return this.prisma.paciProfile.findMany({
      where,
      include: { student: true },
    });
  }

  async findActive(userId: string, colegioId: string | null) {
    const now = new Date();
    const where: Prisma.PaciProfileWhereInput = {
      userId,
      validFrom: { lte: now },
      validUntil: { gte: now },
    };
    if (colegioId) {
      where.student = { is: { colegioId } };
    }
    return this.prisma.paciProfile.findMany({
      where,
      include: { student: true },
    });
  }

  async findHistorical(userId: string, colegioId: string | null) {
    const now = new Date();
    const where: Prisma.PaciProfileWhereInput = {
      userId,
      validUntil: { lt: now },
    };
    if (colegioId) {
      where.student = { is: { colegioId } };
    }
    return this.prisma.paciProfile.findMany({
      where,
      include: { student: true },
    });
  }

  async findRecent(userId: string, colegioId: string | null, limit?: string) {
    const take = Math.max(1, Number.parseInt(limit || '10', 10) || 10);
    const where: Prisma.PaciProfileWhereInput = { userId };
    if (colegioId) {
      where.student = { is: { colegioId } };
    }
    return this.prisma.paciProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      include: { student: true },
    });
  }

  async findOne(userId: string, colegioId: string | null, id: string) {
    const paciProfile = await this.prisma.paciProfile.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!paciProfile) {
      throw new NotFoundException(`PACI Profile with ID ${id} not found`);
    }

    if (paciProfile.userId !== userId) {
      throw new ForbiddenException('You do not have access to this PACI profile.');
    }

    if (colegioId && paciProfile.student.colegioId !== colegioId) {
      throw new ForbiddenException('You do not have access to this PACI profile.');
    }

    return paciProfile;
  }

  async findByStudentId(userId: string, colegioId: string | null, studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    if (student.userId !== userId) {
      throw new ForbiddenException('You do not have access to this student.');
    }

    if (colegioId && student.colegioId !== colegioId) {
      throw new ForbiddenException('You do not have access to this student.');
    }

    return this.prisma.paciProfile.findMany({
      where: { studentId, userId },
      include: {
        student: true,
      },
    });
  }

  async update(userId: string, colegioId: string | null, id: string, updatePaciProfileDto: UpdatePaciProfileDto) {
    const existing = await this.findOne(userId, colegioId, id);

    const normalized = this.normalizeUpdatePaciDates(updatePaciProfileDto);

    return this.prisma.paciProfile.update({
      where: { id: existing.id },
      data: normalized,
      include: {
        student: true,
      },
    });
  }

  async remove(userId: string, colegioId: string | null, id: string) {
    const existing = await this.findOne(userId, colegioId, id);

    return this.prisma.paciProfile.delete({
      where: { id: existing.id },
    });
  }

  private normalizeCreatePaciDates(userId: string, dto: CreatePaciProfileDto): Prisma.PaciProfileUncheckedCreateInput {
    return {
      userId,
      studentId: dto.studentId,
      diagnostico: dto.diagnostico,
      fechaElaboracion: this.normalizeDate(dto.fechaElaboracion),
      fechaRevision: this.normalizeDate(dto.fechaRevision),
      duracion: dto.duracion,
      validFrom: this.normalizeDate(dto.validFrom),
      validUntil: this.normalizeDate(dto.validUntil),
      datosEstructurales: dto.datosEstructurales,
    };
  }

  private normalizeUpdatePaciDates(dto: UpdatePaciProfileDto): Prisma.PaciProfileUncheckedUpdateInput {
    return {
      ...(dto.studentId ? { studentId: dto.studentId } : {}),
      ...(dto.diagnostico ? { diagnostico: dto.diagnostico } : {}),
      ...(dto.fechaElaboracion ? { fechaElaboracion: this.normalizeDate(dto.fechaElaboracion) } : {}),
      ...(dto.fechaRevision ? { fechaRevision: this.normalizeDate(dto.fechaRevision) } : {}),
      ...(dto.duracion ? { duracion: dto.duracion } : {}),
      ...(dto.validFrom ? { validFrom: this.normalizeDate(dto.validFrom) } : {}),
      ...(dto.validUntil ? { validUntil: this.normalizeDate(dto.validUntil) } : {}),
      ...(dto.datosEstructurales ? { datosEstructurales: dto.datosEstructurales } : {}),
    };
  }

  private normalizeDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date;
  }
}
