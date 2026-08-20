import { PaciProfileController } from './paci-profile.controller';
import { PaciProfileService } from './paci-profile.service';

const serviceMock = {
  create: jest.fn(),
  findAll: jest.fn(),
  findFiltered: jest.fn(),
  findActive: jest.fn(),
  findHistorical: jest.fn(),
  findRecent: jest.fn(),
  findOne: jest.fn(),
  findByStudentId: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
} as unknown as PaciProfileService;

describe('PaciProfileController', () => {
  let controller: PaciProfileController;
  // SUPERADMIN → resolveColegioId devuelve null (acceso cross-colegio), por lo que
  // las aserciones de delegación con colegioId=null siguen siendo válidas.
  const req = { user: { id: 'user-id', role: 'SUPERADMIN', colegioId: null } } as any;

  beforeEach(() => {
    controller = new PaciProfileController(serviceMock);
    jest.clearAllMocks();
  });

  it('delegates create', async () => {
    serviceMock.create.mockResolvedValue({ id: 'p1' });

    const result = await controller.create(req, {
      studentId: 's1',
      diagnostico: 'DX',
      fechaElaboracion: '2024-01-01',
      fechaRevision: '2024-02-01',
      duracion: '1',
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      datosEstructurales: { a: 1 },
    });

    expect(serviceMock.create).toHaveBeenCalledWith('user-id', null, {
      studentId: 's1',
      diagnostico: 'DX',
      fechaElaboracion: '2024-01-01',
      fechaRevision: '2024-02-01',
      duracion: '1',
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      datosEstructurales: { a: 1 },
    });
    expect(result).toEqual({ id: 'p1' });
  });

  it('delegates findAll', async () => {
    serviceMock.findAll.mockResolvedValue([]);

    const result = await controller.findAll(req);

    expect(serviceMock.findAll).toHaveBeenCalledWith('user-id', null);
    expect(result).toEqual([]);
  });

  it('delegates findFiltered', async () => {
    serviceMock.findFiltered.mockResolvedValue([]);

    const result = await controller.findFiltered(req, 's1', 'true', '2B', '2024-01-01', '2024-12-31');

    expect(serviceMock.findFiltered).toHaveBeenCalledWith('user-id', null, {
      studentId: 's1',
      isActive: 'true',
      curso: '2B',
      fromDate: '2024-01-01',
      toDate: '2024-12-31',
    });
    expect(result).toEqual([]);
  });

  it('delegates findActive', async () => {
    serviceMock.findActive.mockResolvedValue([]);

    const result = await controller.findActive(req);

    expect(serviceMock.findActive).toHaveBeenCalledWith('user-id', null);
    expect(result).toEqual([]);
  });

  it('delegates findHistorical', async () => {
    serviceMock.findHistorical.mockResolvedValue([]);

    const result = await controller.findHistorical(req);

    expect(serviceMock.findHistorical).toHaveBeenCalledWith('user-id', null);
    expect(result).toEqual([]);
  });

  it('delegates findRecent', async () => {
    serviceMock.findRecent.mockResolvedValue([]);

    const result = await controller.findRecent(req, '5');

    expect(serviceMock.findRecent).toHaveBeenCalledWith('user-id', null, '5');
    expect(result).toEqual([]);
  });

  it('delegates findOne', async () => {
    serviceMock.findOne.mockResolvedValue({ id: 'p1' });

    const result = await controller.findOne(req, 'p1');

    expect(serviceMock.findOne).toHaveBeenCalledWith('user-id', null, 'p1');
    expect(result).toEqual({ id: 'p1' });
  });

  it('delegates findByStudentId', async () => {
    serviceMock.findByStudentId.mockResolvedValue([]);

    const result = await controller.findByStudentId(req, 's1');

    expect(serviceMock.findByStudentId).toHaveBeenCalledWith('user-id', null, 's1');
    expect(result).toEqual([]);
  });

  it('delegates update', async () => {
    serviceMock.update.mockResolvedValue({ id: 'p1' });

    const result = await controller.update(req, 'p1', { diagnostico: 'DX2' });

    expect(serviceMock.update).toHaveBeenCalledWith('user-id', null, 'p1', { diagnostico: 'DX2' });
    expect(result).toEqual({ id: 'p1' });
  });

  it('delegates remove', async () => {
    serviceMock.remove.mockResolvedValue({ id: 'p1' });

    const result = await controller.remove(req, 'p1');

    expect(serviceMock.remove).toHaveBeenCalledWith('user-id', null, 'p1');
    expect(result).toEqual({ id: 'p1' });
  });
});
