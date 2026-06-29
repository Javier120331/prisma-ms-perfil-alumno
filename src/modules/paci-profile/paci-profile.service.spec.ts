import { NotFoundException } from '@nestjs/common';
import { PaciProfileService } from './paci-profile.service';
import { PrismaService } from '../../common/services/prisma.service';

const prismaMock = {
  student: {
    findUnique: jest.fn(),
  },
  paciProfile: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as unknown as PrismaService;

describe('PaciProfileService', () => {
  let service: PaciProfileService;

  beforeEach(() => {
    service = new PaciProfileService(prismaMock);
    jest.clearAllMocks();
  });

  it('throws if student does not exist on create', async () => {
    prismaMock.student.findUnique.mockResolvedValue(null);

    await expect(
      service.create('u1', null, {
        studentId: 's1',
        diagnostico: 'DX',
        fechaElaboracion: '2024-01-01',
        fechaRevision: '2024-02-01',
        duracion: '1',
        validFrom: '2024-01-01',
        validUntil: '2024-12-31',
        datosEstructurales: { a: 1 },
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates a paci profile with normalized dates', async () => {
    prismaMock.student.findUnique.mockResolvedValue({ id: 's1', userId: 'u1' });
    prismaMock.paciProfile.create.mockResolvedValue({ id: 'p1' });

    await service.create('u1', null, {
      studentId: 's1',
      diagnostico: 'DX',
      fechaElaboracion: '2024-01-01',
      fechaRevision: '2024-02-01',
      duracion: '1',
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      datosEstructurales: { a: 1 },
    });

    const call = prismaMock.paciProfile.create.mock.calls[0][0];
    expect(call.data.fechaElaboracion).toBeInstanceOf(Date);
    expect(call.data.validUntil).toBeInstanceOf(Date);
  });

  it('filters paci profiles with combined criteria', async () => {
    prismaMock.paciProfile.findMany.mockResolvedValue([]);

    await service.findFiltered('u1', null, {
      studentId: 's1',
      isActive: 'true',
      curso: '2B',
      fromDate: '2024-01-01',
      toDate: '2024-12-31',
    });

    const call = prismaMock.paciProfile.findMany.mock.calls[0][0];
    expect(call.where.userId).toBe('u1');
    expect(call.where.studentId).toBe('s1');
    expect(call.where.student).toEqual({ is: { cursoActual: '2B' } });
    expect(call.where.fechaElaboracion.gte).toBeInstanceOf(Date);
    expect(call.where.fechaElaboracion.lte).toBeInstanceOf(Date);
    expect(call.where.AND).toBeDefined();
  });

  it('filters paci profiles when inactive', async () => {
    prismaMock.paciProfile.findMany.mockResolvedValue([]);

    await service.findFiltered('u1', null, { isActive: '0' });

    const call = prismaMock.paciProfile.findMany.mock.calls[0][0];
    expect(call.where.NOT).toBeDefined();
  });

  it('finds all profiles with student relation', async () => {
    prismaMock.paciProfile.findMany.mockResolvedValue([]);

    await service.findAll('u1', null);

    expect(prismaMock.paciProfile.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      include: { student: true },
    });
  });

  it('finds active profiles', async () => {
    prismaMock.paciProfile.findMany.mockResolvedValue([]);

    await service.findActive('u1', null);

    const call = prismaMock.paciProfile.findMany.mock.calls[0][0];
    expect(call.where.userId).toBe('u1');
    expect(call.where.validFrom).toBeDefined();
  });

  it('finds historical profiles', async () => {
    prismaMock.paciProfile.findMany.mockResolvedValue([]);

    await service.findHistorical('u1', null);

    const call = prismaMock.paciProfile.findMany.mock.calls[0][0];
    expect(call.where.userId).toBe('u1');
    expect(call.where.validUntil).toBeDefined();
  });

  it('finds recent profiles with minimum limit', async () => {
    prismaMock.paciProfile.findMany.mockResolvedValue([]);

    await service.findRecent('u1', null, '0');

    const call = prismaMock.paciProfile.findMany.mock.calls[0][0];
    expect(call.where.userId).toBe('u1');
    expect(call.take).toBe(10);
  });

  it('throws when paci profile is missing by id', async () => {
    prismaMock.paciProfile.findUnique.mockResolvedValue(null);

    await expect(service.findOne('u1', null, 'missing')).rejects.toThrow(NotFoundException);
  });

  it('finds a paci profile by id with student relation', async () => {
    prismaMock.paciProfile.findUnique.mockResolvedValue({ id: 'p1', userId: 'u1', student: {} });

    const result = await service.findOne('u1', null, 'p1');

    expect(prismaMock.paciProfile.findUnique).toHaveBeenCalledWith({
      where: { id: 'p1' },
      include: { student: true },
    });
    expect(result).toEqual({ id: 'p1', userId: 'u1', student: {} });
  });

  it('finds profiles by student id', async () => {
    prismaMock.student.findUnique.mockResolvedValue({ id: 's1', userId: 'u1' });
    prismaMock.paciProfile.findMany.mockResolvedValue([]);

    const result = await service.findByStudentId('u1', null, 's1');

    expect(prismaMock.paciProfile.findMany).toHaveBeenCalledWith({
      where: { studentId: 's1', userId: 'u1' },
      include: { student: true },
    });
    expect(result).toEqual([]);
  });

  it('updates a paci profile with normalized dates', async () => {
    prismaMock.paciProfile.findUnique.mockResolvedValue({ id: 'p1', userId: 'u1', student: {} });
    prismaMock.paciProfile.update.mockResolvedValue({ id: 'p1' });

    await service.update('u1', null, 'p1', { fechaElaboracion: '2024-01-01' });

    const call = prismaMock.paciProfile.update.mock.calls[0][0];
    expect(call.data.fechaElaboracion).toBeInstanceOf(Date);
  });

  it('updates with multiple fields and preserves invalid dates', async () => {
    prismaMock.paciProfile.findUnique.mockResolvedValue({ id: 'p2', userId: 'u1', student: {} });
    prismaMock.paciProfile.update.mockResolvedValue({ id: 'p2' });

    await service.update('u1', null, 'p2', {
      studentId: 's1',
      diagnostico: 'DX2',
      fechaRevision: 'not-a-date',
      duracion: '2',
      validFrom: '2024-03-01',
      validUntil: '2024-12-31',
      datosEstructurales: { a: 2 },
    });

    const call = prismaMock.paciProfile.update.mock.calls[0][0];
    expect(call.data.studentId).toBe('s1');
    expect(call.data.diagnostico).toBe('DX2');
    expect(call.data.fechaRevision).toBe('not-a-date');
    expect(call.data.validFrom).toBeInstanceOf(Date);
    expect(call.data.validUntil).toBeInstanceOf(Date);
    expect(call.data.datosEstructurales).toEqual({ a: 2 });
  });

  it('throws when update returns null', async () => {
    prismaMock.paciProfile.findUnique.mockResolvedValue(null);
    await expect(service.update('u1', null, 'p1', {})).rejects.toThrow(NotFoundException);
  });

  it('throws when delete returns null', async () => {
    prismaMock.paciProfile.findUnique.mockResolvedValue(null);
    await expect(service.remove('u1', null, 'p1')).rejects.toThrow(NotFoundException);
  });
});
