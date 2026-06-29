import { validate } from 'class-validator';
import { UpdateStudentDto } from './update-student.dto';

describe('UpdateStudentDto', () => {
  it('allows empty payload', async () => {
    const dto = new UpdateStudentDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
