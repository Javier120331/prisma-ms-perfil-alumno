import { IsString, IsNotEmpty, IsDateString, IsObject, IsUUID } from 'class-validator';

export class CreatePaciProfileDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  diagnostico: string;

  @IsDateString()
  @IsNotEmpty()
  fechaElaboracion: string;

  @IsDateString()
  @IsNotEmpty()
  fechaRevision: string;

  @IsString()
  @IsNotEmpty()
  duracion: string;

  @IsDateString()
  @IsNotEmpty()
  validFrom: string;

  @IsDateString()
  @IsNotEmpty()
  validUntil: string;

  @IsObject()
  @IsNotEmpty()
  datosEstructurales: object;
}
