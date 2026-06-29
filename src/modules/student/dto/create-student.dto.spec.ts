import { validate } from 'class-validator';
import { CreateStudentDto } from './create-student.dto';

describe('CreateStudentDto', () => {
  it('accepts valid payload', async () => {
    const dto = Object.assign(new CreateStudentDto(), {
      userId: '11111111-1111-4111-8111-111111111111',
      nombreCompleto: 'Ana Ruiz',
      fechaNacimiento: '2000-01-01',
      cursoActual: '4A',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects invalid payload', async () => {
    const dto = Object.assign(new CreateStudentDto(), {
      userId: 'bad',
      nombreCompleto: '',
      fechaNacimiento: 'not-a-date',
      cursoActual: '',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});
