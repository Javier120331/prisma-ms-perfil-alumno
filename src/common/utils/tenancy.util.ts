import { ForbiddenException } from '@nestjs/common';

export type TenancyContext = {
  id?: string;
  role?: string;
  colegioId?: string | null;
};

const SUPERADMIN_ROLES = ['SUPERADMIN'];

/**
 * Resuelve el colegioId efectivo para operaciones multi-tenant.
 *
 * Politica estricta: en producción, cualquier usuario (no-SUPERADMIN) que
 * no tenga colegioId en el token sera rechazado con 403. Esto evita el
 * "soft-fail" donde se omitia el scoping por colegio.
 *
 * SUPERADMIN puede omitir colegioId (acceso cross-colegio).
 */
export function resolveColegioId(user: TenancyContext | null | undefined): string | null {
  if (!user?.id) {
    throw new ForbiddenException('Authenticated user is required.');
  }

  if (user.role && SUPERADMIN_ROLES.includes(user.role)) {
    return null;
  }

  if (!user.colegioId) {
    throw new ForbiddenException(
      'User has no colegioId in token. Contact your administrator to be assigned to a colegio.',
    );
  }

  return user.colegioId;
}

/**
 * Verifica que el usuario (no-SUPERADMIN) pueda acceder al recurso de un colegio dado.
 * SUPERADMIN puede acceder a cualquier colegio.
 */
export function assertColegioAccess(
  user: TenancyContext | null | undefined,
  targetColegioId: string | null | undefined,
): void {
  if (!user?.id) {
    throw new ForbiddenException('Authenticated user is required.');
  }

  if (user.role && SUPERADMIN_ROLES.includes(user.role)) {
    return;
  }

  if (!user.colegioId) {
    throw new ForbiddenException(
      'User has no colegioId in token. Contact your administrator.',
    );
  }

  if (targetColegioId && targetColegioId !== user.colegioId) {
    throw new ForbiddenException(
      'You do not have access to this recurso (colegio mismatch).',
    );
  }
}
