import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const student1 = await prisma.student.create({
    data: {
      userId: 'user-001',
      nombreCompleto: 'Maria Gonzalez Lopez',
      fechaNacimiento: new Date('2010-03-15'),
      cursoActual: '5 Basico A',
      paciProfiles: {
        create: {
          userId: 'user-001',
          diagnostico: 'Dificultades en comprension lectora. Requiere apoyo en estrategias de inferencia y analisis de textos narrativos.',
          fechaElaboracion: new Date('2026-01-10'),
          fechaRevision: new Date('2026-06-10'),
          duracion: '6 meses',
          validFrom: new Date('2026-01-10'),
          validUntil: new Date('2026-07-10'),
          datosEstructurales: {
            areasCognitivas: {
              memoriaTrabajo: 'Media',
              atencionSostenida: 'Media-Baja',
              velocidadProcesamiento: 'Media',
              razonamientoVerbal: 'Baja',
              razonamientoNoVerbal: 'Media-Alta',
            },
            fortalezas: ['Razonamiento visual', 'Memoria auditiva'],
            debilidades: ['Comprension lectora', 'Velocidad de lectura'],
            recomendaciones: [
              'Uso de organizadores graficos',
              'Lectura en voz alta con pausas',
              'Ejercicios de inferencia diaria',
            ],
          },
        },
      },
    },
  });

  const student2 = await prisma.student.create({
    data: {
      userId: 'user-002',
      nombreCompleto: 'Carlos Rodriguez Perez',
      fechaNacimiento: new Date('2009-07-22'),
      cursoActual: '6 Basico B',
      paciProfiles: {
        create: {
          userId: 'user-002',
          diagnostico: 'Perfil cognitivo con fortalezas en razonamiento logico-matematico. Rendimiento academico adecuado con potencial para profundizacion.',
          fechaElaboracion: new Date('2026-02-20'),
          fechaRevision: new Date('2026-05-20'),
          duracion: '3 meses',
          validFrom: new Date('2026-02-20'),
          validUntil: new Date('2026-05-20'),
          datosEstructurales: {
            areasCognitivas: {
              memoriaTrabajo: 'Alta',
              atencionSostenida: 'Alta',
              velocidadProcesamiento: 'Media-Alta',
              razonamientoVerbal: 'Media',
              razonamientoNoVerbal: 'Alta',
              razonamientoLogico: 'Alta',
            },
            fortalezas: ['Razonamiento logico', 'Resolucion de problemas', 'Pensamiento abstracto'],
            debilidades: ['Expresion escrita'],
            recomendaciones: [
              'Desafios matematicos avanzados',
              'Proyectos de programacion',
              'Talleres de escritura creativa',
            ],
          },
        },
      },
    },
  });

  console.log('Seeding completed.');
  console.log('Students created:', student1.nombreCompleto, ',', student2.nombreCompleto);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
