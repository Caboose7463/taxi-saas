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
    // Base fare logic: £3.50 + £2.50 per mile
    const BASE_FARE = 3.50;
    const PER_MILE = 2.50;

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      // Fallback for MVP testing without a key
      return {
        distanceMiles: 5.2,
        fare: BASE_FARE + (5.2 * PER_MILE),
        hotelCommission: (BASE_FARE + (5.2 * PER_MILE)) * 0.025,
      };
    }

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
      if (!element || element.status !== 'OK') {
        throw new Error('Could not calculate distance');
      }

      const distanceMiles = element.distance.value / 1609.34;
      const fare = BASE_FARE + (distanceMiles * PER_MILE);

      return {
        distanceMiles,
        fare,
        hotelCommission: fare * 0.025,
      };
    } catch (error) {
      throw new Error('Pricing Engine Error');
    }
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
      where: {
        status: {
          in: ['PENDING', 'ACCEPTED', 'EN_ROUTE'],
        },
      },
      include: {
        hotel: true,
        driver: true,
      }
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
