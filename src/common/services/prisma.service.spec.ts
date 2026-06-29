import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('connects on module init', async () => {
    const prisma = new PrismaService();
    prisma.$connect = jest.fn().mockResolvedValue(undefined);

    await prisma.onModuleInit();

    expect(prisma.$connect).toHaveBeenCalled();
  });

  it('disconnects on module destroy', async () => {
    const prisma = new PrismaService();
    prisma.$disconnect = jest.fn().mockResolvedValue(undefined);

    await prisma.onModuleDestroy();

    expect(prisma.$disconnect).toHaveBeenCalled();
  });
});
