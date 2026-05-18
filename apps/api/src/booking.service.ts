import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
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
    private dispatchGateway: DispatchGateway,
    private emailService: EmailService
  ) {
    this.mapsClient = new Client({});
  }

  async estimateFare(pickup: string, dropoff: string) {
    const BASE_FARE = 3.50;       // £3.50 flag fall (original spec)
    const PER_MILE = 2.50;        // £2.50 per mile (original spec)
    const MIN_FARE = 8.00;        // minimum fare £8
    const HOTEL_COMMISSION = 0.025; // 2.5% to hotel (original spec)

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
          const etaMinutes = Math.round((element.duration.value / 60) * 1.2); // add 20% for pickup travel
          return {
            distanceMiles: Math.round(distanceMiles * 10) / 10,
            distance: `${Math.round(distanceMiles)} miles`,
            fare: Math.round(fare * 100) / 100,
            hotelCommission: Math.round(fare * HOTEL_COMMISSION * 100) / 100,
            driverPayout: Math.round(fare * 0.90 * 100) / 100,
            platformFee: Math.round(fare * (1 - HOTEL_COMMISSION - 0.90) * 100) / 100,
            etaMinutes,
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

    const etaMinutes = Math.round(estimatedMiles * 2.5 + 5); // rough ETA: 2.5 min/mile + 5 min pickup
    return {
      distanceMiles: estimatedMiles,
      distance: `~${estimatedMiles} miles (estimate)`,
      fare: Math.round(fare * 100) / 100,
      hotelCommission: Math.round(fare * HOTEL_COMMISSION * 100) / 100,
      driverPayout: Math.round(fare * 0.90 * 100) / 100,
      platformFee: Math.round(fare * (1 - HOTEL_COMMISSION - 0.90) * 100) / 100,
      etaMinutes,
    };
  }


  async createBooking(data: Prisma.BookingUncheckedCreateInput) {
    const booking = await this.prisma.booking.create({
      data,
    });
    
    // Broadcast the new booking instantly to all ONLINE drivers via WebSockets
    this.dispatchGateway.server.emit('new_booking_request', booking);
    // Send email confirmation log
    this.emailService.bookingConfirmed('Hotel', data.guestName as string || '', data.pickupAddress, data.dropoffAddress, data.fare);
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


  async cancelBooking(bookingId: string) {
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });
  }

  async updateBookingStatus(bookingId: string, status: string) {
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
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

  async getPendingDrivers() {
    return this.prisma.driver.findMany({
      where: { isApproved: false, isRejected: false },
      orderBy: { createdAt: 'desc' },
      select: { id:true, name:true, email:true, phone:true, vehicleMake:true, vehicleModel:true, vehicleReg:true, vehicleColour:true, licenceDoc:true, phLicenceDoc:true, insuranceDoc:true, motDoc:true, profilePhoto:true, createdAt:true }
    });
  }

  async approveDriver(driverId: string) {
    const driver = await this.prisma.driver.update({ where:{ id:driverId }, data:{ isApproved:true, isRejected:false } });
    this.emailService.driverApproved(driver.email, driver.name);
    return driver;
  }

  async rejectDriver(driverId: string, notes: string) {
    return this.prisma.driver.update({ where:{ id:driverId }, data:{ isApproved:false, isRejected:true, adminNotes:notes } });
  }

  async getAllDrivers() {
    return this.prisma.driver.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id:true, name:true, email:true, phone:true, status:true, isApproved:true, isRejected:true, vehicleMake:true, vehicleModel:true, vehicleReg:true, createdAt:true, adminNotes:true }
    });
  }


  async getHotelProfile(hotelId: string) {
    return this.prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { id:true, name:true, subdomain:true, address:true, brand_color:true, logo_url:true, welcome_text:true, commission_rate:true }
    });
  }

  async updateHotelBranding(hotelId: string, data: { brand_color?: string; logo_url?: string; welcome_text?: string; address?: string }) {
    return this.prisma.hotel.update({ where: { id: hotelId }, data });
  }


  async getDriverBookings(driverId: string) {
    return this.prisma.booking.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
      include: { hotel: { select: { name:true, address:true } } }
    });
  }

  async getHotelStaff(hotelId: string) {
    return this.prisma.hotelStaff.findMany({
      where: { hotelId },
      select: { id:true, name:true, email:true, createdAt:true }
    });
  }

  async addHotelStaff(hotelId: string, name: string, email: string, password: string) {
    const bcrypt = require('bcrypt');
    const hashed = await bcrypt.hash(password, 10);
    return this.prisma.hotelStaff.create({
      data: { hotelId, name, email, password: hashed }
    });
  }

  async removeHotelStaff(staffId: string) {
    return this.prisma.hotelStaff.delete({ where: { id: staffId } });
  }

}
