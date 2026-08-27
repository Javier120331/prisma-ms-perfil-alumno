import { Global, Module } from '@nestjs/common';
import { UsersLookupService } from './services/users-lookup.service';

/**
 * Proveedores transversales disponibles en todo el árbol de módulos
 * (los guards se instancian en el contexto del módulo del controller).
 */
@Global()
@Module({
  providers: [UsersLookupService],
  exports: [UsersLookupService],
})
export class CommonModule {}
