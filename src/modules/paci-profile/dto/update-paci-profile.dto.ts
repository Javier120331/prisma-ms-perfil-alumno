import { PartialType } from '@nestjs/mapped-types';
import { CreatePaciProfileDto } from './create-paci-profile.dto';

export class UpdatePaciProfileDto extends PartialType(CreatePaciProfileDto) {}
