import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const data = await prisma.championships.findMany({
    select: {
      id: true,
      title: true,
      logo: true,
      serverName: true,
      serverPass: true,
      leagueJoinQr: true,
      cars: {
        select: {
          id: true,
          carNumber: true,
          driverId: true,
          driverFirstName: true,
          driverLastName: true,
          teamId: true,
          teamName: true,
          teamLogo: true,
          carImage: true,
          flagImage: true,
          championshipId: true,
          penalty: {
            select: {
              id: true,
              raceId: true,
              carId: true,
              points: true,
            },
          },
        },
      },
      races: {
        select: {
          id: true,
          name: true,
          round: true,
          laps: true,
          mins: true,
          trackId: true,
          trackMap: true,
          trackLogo: true,
          raceDateTime: true,
          tyres: true,
        },
      },
    },
  });

  console.log("data:", data);

  return NextResponse.json(data);
}