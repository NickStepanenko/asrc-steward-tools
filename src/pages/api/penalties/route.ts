import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET all penalties (flattened)
export async function GET() {
  const data = await prisma.driver.findMany({
    include: {
      penalties: true,
    },
  });

  return NextResponse.json(data);
}

// PUT updated penalties
export async function PUT(req: NextRequest) {
  const body = await req.json();

  // Example body: [{ carNumber: 44, penaltyPoints: { 1: 3, 2: 2 } }, ...]

  for (const driverData of body) {
    const driver = await prisma.driver.findFirst({
      where: { carNumber: driverData.carNumber },
    });

    if (!driver) continue;

    for (const [roundStr, points] of Object.entries(driverData.penaltyPoints)) {
      const round = parseInt(roundStr);
      const race = await prisma.race.findFirst({ where: { round } });
      if (!race) continue;

      // Upsert penalty
      await prisma.penalty.upsert({
        where: {
          driverId_raceId: {
            driverId: driver.id,
            raceId: race.id,
          },
        },
        update: { points },
        create: {
          driverId: driver.id,
          raceId: race.id,
          points,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}