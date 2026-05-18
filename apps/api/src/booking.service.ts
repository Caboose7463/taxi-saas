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

  // Haversine formula - real distance between two lat/lng points
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Geocode an address using OpenStreetMap Nominatim (free, no API key)
  private async geocode(address: string): Promise<{lat: number; lon: number; display: string} | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&countrycodes=gb&limit=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'TransitProTaxi/1.0', 'Accept-Language': 'en' } });
      const data = await res.json();
      if (data && data[0]) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name };
      }
    } catch (e) {
      console.warn('Nominatim geocoding failed:', e.message);
    }
    return null;
  }

  async estimateFare(pickup: string, dropoff: string) {
    const BASE_FARE = 3.50;
    const RATE_PER_MILE = 2.50;
    const MINIMUM_FARE = 8.00;
    const HOTEL_COMMISSION = 0.025;

    // First try Google Maps if key is set
    if (process.env.GOOGLE_MAPS_API_KEY) {
      try {
        const response = await this.mapsClient.distancematrix({
          params: { origins: [pickup], destinations: [dropoff], key: process.env.GOOGLE_MAPS_API_KEY }
        });
        const element = response.data.rows[0]?.elements[0];
        if (element?.status === 'OK') {
          const distanceMeters = element.distance.value;
          const distanceMiles = distanceMeters / 1609.34;
          const fare = Math.max(MINIMUM_FARE, BASE_FARE + (distanceMiles * RATE_PER_MILE));
          const etaMinutes = Math.round(element.duration.value / 60);
          return {
            distanceMiles: Math.round(distanceMiles * 10) / 10,
            distance: `${Math.round(distanceMiles * 10) / 10} miles`,
            fare: Math.round(fare * 100) / 100,
            hotelCommission: Math.round(fare * HOTEL_COMMISSION * 100) / 100,
            driverPayout: Math.round(fare * 0.90 * 100) / 100,
            platformFee: Math.round(fare * (1 - HOTEL_COMMISSION - 0.90) * 100) / 100,
            etaMinutes,
          };
        }
      } catch (e) {
        console.warn('Google Maps failed, falling back to Nominatim:', e.message);
      }
    }

    // Use Nominatim geocoding + Haversine for real distance (free, any address)
    const [pickupGeo, dropoffGeo] = await Promise.all([
      this.geocode(pickup),
      this.geocode(dropoff),
    ]);

    if (pickupGeo && dropoffGeo) {
      const straightLineMiles = this.haversineDistance(pickupGeo.lat, pickupGeo.lon, dropoffGeo.lat, dropoffGeo.lon);
      // Road distance is typically 25-35% longer than straight line - use 1.3x multiplier
      const estimatedRoadMiles = Math.round(straightLineMiles * 1.30 * 10) / 10;
      const fare = Math.max(MINIMUM_FARE, BASE_FARE + (estimatedRoadMiles * RATE_PER_MILE));
      const etaMinutes = Math.round(estimatedRoadMiles * 2.0); // ~2 min per mile
      return {
        distanceMiles: estimatedRoadMiles,
        distance: `${estimatedRoadMiles} miles`,
        fare: Math.round(fare * 100) / 100,
        hotelCommission: Math.round(fare * HOTEL_COMMISSION * 100) / 100,
        driverPayout: Math.round(fare * 0.90 * 100) / 100,
        platformFee: Math.round(fare * (1 - HOTEL_COMMISSION - 0.90) * 100) / 100,
        etaMinutes,
      };
    }

    // Final fallback - city pair lookup
    const CITY_DISTANCES: Record<string, number> = {
      'salisbury-london': 83, 'london-salisbury': 83,
      'salisbury-bournemouth': 30, 'bournemouth-salisbury': 30,
      'salisbury-southampton': 24, 'southampton-salisbury': 24,
      'salisbury-bath': 38, 'bath-salisbury': 38,
      'salisbury-bristol': 55, 'bristol-salisbury': 55,
      'salisbury-winchester': 21, 'winchester-salisbury': 21,
      'salisbury-heathrow': 80, 'heathrow-salisbury': 80,
      'salisbury-gatwick': 85, 'gatwick-salisbury': 85,
      'salisbury-basingstoke': 30, 'basingstoke-salisbury': 30,
    };
    const key = `${pickup.toLowerCase().split(',')[0].trim()}-${dropoff.toLowerCase().split(',')[0].trim()}`;
    const estimatedMiles = CITY_DISTANCES[key] || Math.floor(Math.random() * 20 + 10);
    const fare = Math.max(MINIMUM_FARE, BASE_FARE + (estimatedMiles * RATE_PER_MILE));
    const etaMinutes = Math.round(estimatedMiles * 2.0);
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
