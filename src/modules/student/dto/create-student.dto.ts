import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  nombreCompleto: string;

  @IsDateString()
  @IsNotEmpty()
  fechaNacimiento: string;

  @IsString()
  @IsNotEmpty()
  cursoActual: string;
}
