import { validate } from 'class-validator';
import { UpdatePaciProfileDto } from './update-paci-profile.dto';

describe('UpdatePaciProfileDto', () => {
  it('allows empty payload', async () => {
    const dto = new UpdatePaciProfileDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
