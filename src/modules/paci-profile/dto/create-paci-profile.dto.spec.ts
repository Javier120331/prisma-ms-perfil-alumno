import { validate } from 'class-validator';
import { CreatePaciProfileDto } from './create-paci-profile.dto';

describe('CreatePaciProfileDto', () => {
  it('accepts valid payload', async () => {
    const dto = Object.assign(new CreatePaciProfileDto(), {
      studentId: '11111111-1111-4111-8111-111111111111',
      userId: '22222222-2222-4222-8222-222222222222',
      diagnostico: 'DX',
      fechaElaboracion: '2024-01-01',
      fechaRevision: '2024-02-01',
      duracion: '1',
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      datosEstructurales: { a: 1 },
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects invalid payload', async () => {
    const dto = Object.assign(new CreatePaciProfileDto(), {
      studentId: 'bad',
      userId: 'bad',
      diagnostico: '',
      fechaElaboracion: 'bad-date',
      fechaRevision: 'bad-date',
      duracion: '',
      validFrom: 'bad-date',
      validUntil: 'bad-date',
      datosEstructurales: null,
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});
