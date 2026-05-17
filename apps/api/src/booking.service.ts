import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';
import { Client } from '@googlemaps/google-maps-services-js';
import { DispatchGateway } from './dispatch.gateway';

@Injectable()
export class BookingService {
  private mapsClient: Client;

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => DispatchGateway))
    private dispatchGateway: DispatchGateway
  ) {
    this.mapsClient = new Client({});
  }

  async estimateFare(pickup: string, dropoff: string) {
    const BASE_FARE = 4.50;   // £4.50 flag fall
    const PER_MILE = 3.20;    // £3.20 per mile (premium rate)
    const MIN_FARE = 15.00;   // minimum fare £15

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (apiKey && apiKey !== 'YOUR_API_KEY_HERE' && apiKey !== '') {
      try {
        const response = await this.mapsClient.distancematrix({
          params: {
            origins: [pickup],
            destinations: [dropoff],
            key: apiKey,
            units: 'imperial' as any,
          }
        });

        const element = response.data.rows[0]?.elements[0];
        if (element && element.status === 'OK') {
          const distanceMiles = element.distance.value / 1609.34;
          const rawFare = BASE_FARE + (distanceMiles * PER_MILE);
          const fare = Math.max(MIN_FARE, rawFare);
          const commissionRate = 0.15;
          return {
            distanceMiles: Math.round(distanceMiles * 10) / 10,
            distance: `${Math.round(distanceMiles)} miles`,
            fare: Math.round(fare * 100) / 100,
            hotelCommission: Math.round(fare * commissionRate * 100) / 100,
          };
        }
      } catch (error) {
        // Fall through to estimation below
      }
    }

    // Intelligent fallback: estimate distance from address strings
    // Simple heuristic: count words that differ + base distance estimate
    const pickupLower = pickup.toLowerCase();
    const dropoffLower = dropoff.toLowerCase();
    
    // Known UK city distances from common hotel locations (rough estimates)
    let estimatedMiles = 12; // default
    
    const cityPairs: [string, string, number][] = [
      ['london', 'salisbury', 83],
      ['london', 'bristol', 118],
      ['london', 'manchester', 209],
      ['london', 'birmingham', 120],
      ['london', 'oxford', 56],
      ['london', 'cambridge', 60],
      ['london', 'bath', 107],
      ['london', 'cardiff', 151],
      ['london', 'edinburgh', 413],
      ['london', 'heathrow', 15],
      ['london', 'gatwick', 27],
      ['london', 'stansted', 35],
      ['london', 'luton', 35],
      ['salisbury', 'london', 83],
      ['salisbury', 'bristol', 40],
      ['salisbury', 'southampton', 22],
      ['salisbury', 'bath', 38],
      ['salisbury', 'bournemouth', 30],
      ['salisbury', 'heathrow', 78],
      ['salisbury', 'gatwick', 80],
    ];

    for (const [from, to, miles] of cityPairs) {
      if (pickupLower.includes(from) && dropoffLower.includes(to)) {
        estimatedMiles = miles;
        break;
      }
      if (dropoffLower.includes(from) && pickupLower.includes(to)) {
        estimatedMiles = miles;
        break;
      }
    }

    const rawFare = BASE_FARE + (estimatedMiles * PER_MILE);
    const fare = Math.max(MIN_FARE, rawFare);
    const commissionRate = 0.15;

    return {
      distanceMiles: estimatedMiles,
      distance: `~${estimatedMiles} miles (estimate)`,
      fare: Math.round(fare * 100) / 100,
      hotelCommission: Math.round(fare * commissionRate * 100) / 100,
    };
  }


  async createBooking(data: Prisma.BookingUncheckedCreateInput) {
    const booking = await this.prisma.booking.create({
      data,
    });
    
    // Broadcast the new booking instantly to all ONLINE drivers via WebSockets
    this.dispatchGateway.server.emit('new_booking_request', booking);
    
    return booking;
  }

  async getActiveBookings() {
    return this.prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      include: { hotel: true, driver: true },
    });
  }

  async getHotelBookings(hotelId: string) {
    return this.prisma.booking.findMany({
      where: { hotelId },
      orderBy: { createdAt: 'desc' },
      include: { driver: true },
    });
  }

  async acceptBooking(bookingId: string, driverId: string) {
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        driverId,
        status: 'ACCEPTED',
      },
    });
  }
}
