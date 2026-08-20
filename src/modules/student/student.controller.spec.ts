import { StudentController } from './student.controller';
import { StudentService } from './student.service';

const serviceMock = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByUserId: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  importFromPdf: jest.fn(),
} as unknown as StudentService;

describe('StudentController', () => {
  let controller: StudentController;
  // SUPERADMIN → resolveColegioId devuelve null (acceso cross-colegio), por lo que
  // las aserciones de delegación con colegioId=null siguen siendo válidas.
  const req = { user: { id: 'user-id', role: 'SUPERADMIN', colegioId: null } } as any;

  beforeEach(() => {
    controller = new StudentController(serviceMock);
    jest.clearAllMocks();
  });

  it('delegates create', async () => {
    serviceMock.create.mockResolvedValue({ id: '1' });

    const result = await controller.create(req, {
      nombreCompleto: 'Ana Ruiz',
      fechaNacimiento: '2024-01-01',
      cursoActual: '4A',
    });

    expect(serviceMock.create).toHaveBeenCalledWith('user-id', null, {
      nombreCompleto: 'Ana Ruiz',
      fechaNacimiento: '2024-01-01',
      cursoActual: '4A',
    });
    expect(result).toEqual({ id: '1' });
  });

  it('delegates findAll', async () => {
    serviceMock.findAll.mockResolvedValue([]);

    const result = await controller.findAll(req);

    expect(serviceMock.findAll).toHaveBeenCalledWith('user-id', null);
    expect(result).toEqual([]);
  });

  it('delegates findOne', async () => {
    serviceMock.findOne.mockResolvedValue({ id: '1' });

    const result = await controller.findOne(req, '1');

    expect(serviceMock.findOne).toHaveBeenCalledWith('user-id', '1', null);
    expect(result).toEqual({ id: '1' });
  });

  it('delegates findMe', async () => {
    serviceMock.findByUserId.mockResolvedValue({ id: '1' });

    const result = await controller.findMe({ user: { id: 'u1' } } as any);

    expect(serviceMock.findByUserId).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ id: '1' });
  });

  it('delegates update', async () => {
    serviceMock.update.mockResolvedValue({ id: '1' });

    const result = await controller.update(req, '1', { cursoActual: '3B' });

    expect(serviceMock.update).toHaveBeenCalledWith('user-id', '1', null, { cursoActual: '3B' });
    expect(result).toEqual({ id: '1' });
  });

  it('delegates remove', async () => {
    serviceMock.remove.mockResolvedValue({ id: '1' });

    const result = await controller.remove(req, '1');

    expect(serviceMock.remove).toHaveBeenCalledWith('user-id', '1', null);
    expect(result).toEqual({ id: '1' });
  });

  it('delegates importFromPdf', async () => {
    serviceMock.importFromPdf.mockResolvedValue({ count: 1 });

    const result = await controller.importFromPdf(req, {
      buffer: Buffer.from('data'),
    } as Express.Multer.File);

    expect(serviceMock.importFromPdf).toHaveBeenCalledWith('user-id', null, Buffer.from('data'));
    expect(result).toEqual({ count: 1 });
  });
});
