import { Controller, Post, Body, Get, Param, Patch, Delete, Headers, UnauthorizedException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { JwtService } from '@nestjs/jwt';

@Controller('api/v1/bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly jwtService: JwtService,
  ) {}

  private extractHotelId(authHeader: string | undefined): string {
    if (!authHeader) throw new UnauthorizedException('No token provided');
    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = this.jwtService.verify(token) as any;
      if (!payload.hotelId) throw new UnauthorizedException('Not a hotel account');
      return payload.hotelId;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('estimate')
  async estimateFare(@Body() body: { pickup: string; dropoff: string; pickupLat?: number; pickupLng?: number; dropoffLat?: number; dropoffLng?: number }) {
    return this.bookingService.estimateFare(body.pickup, body.dropoff, body.pickupLat, body.pickupLng, body.dropoffLat, body.dropoffLng);
  }

  @Post()
  async create(
    @Body() body: {
      pickupAddress: string;
      dropoffAddress: string;
      fare: number;
      hotelCommission: number;
      driverPayout?: number;
      guestName?: string;
      guestPhone?: string;
      notes?: string;
      scheduledFor?: string;
    },
    @Headers('authorization') auth: string,
  ) {
    const hotelId = this.extractHotelId(auth);
    return this.bookingService.createBooking({
      hotelId,
      pickupAddress: body.pickupAddress,
      dropoffAddress: body.dropoffAddress,
      fare: Number(body.fare),
      hotelCommission: Number(body.hotelCommission),
      driverPayout: Number(body.driverPayout || 0),
      guestName: body.guestName || '',
      guestPhone: body.guestPhone || '',
      notes: body.notes || '',
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
    });
  }

  @Get('active')
  async getActive() {
    return this.bookingService.getActiveBookings();
  }

  @Get('hotel')
  async getHotelBookings(@Headers('authorization') auth: string) {
    const hotelId = this.extractHotelId(auth);
    return this.bookingService.getHotelBookings(hotelId);
  }


  @Patch(':id/cancel')
  async cancelBooking(@Param('id') id: string) {
    return this.bookingService.cancelBooking(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.bookingService.updateBookingStatus(id, status);
  }

  @Patch(':id/accept')
  async acceptBooking(
    @Param('id') id: string,
    @Body('driverId') driverId: string,
    @Headers('authorization') auth: string,
  ) {
    const token = auth?.replace('Bearer ', '');
    let resolvedDriverId = driverId;
    if (!resolvedDriverId && token) {
      try {
        const payload = this.jwtService.verify(token) as any;
        resolvedDriverId = payload.sub;
      } catch {}
    }
    return this.bookingService.acceptBooking(id, resolvedDriverId || 'unknown');
  }

  @Get('drivers/pending')
  async getPendingDrivers() {
    return this.bookingService.getPendingDrivers();
  }

  @Patch('drivers/:id/approve')
  async approveDriver(@Param('id') id: string) {
    return this.bookingService.approveDriver(id);
  }

  @Patch('drivers/:id/reject')
  async rejectDriver(@Param('id') id: string, @Body('notes') notes: string) {
    return this.bookingService.rejectDriver(id, notes);
  }

  @Get('drivers/all')
  async getAllDrivers() {
    return this.bookingService.getAllDrivers();
  }

  @Get('hotel/profile')
  async getHotelProfile(@Headers('authorization') auth: string) {
    const hotelId = this.extractHotelId(auth);
    return this.bookingService.getHotelProfile(hotelId);
  }

  @Patch('hotel/branding')
  async updateBranding(@Headers('authorization') auth: string, @Body() body: { brand_color?: string; logo_url?: string; welcome_text?: string; address?: string }) {
    const hotelId = this.extractHotelId(auth);
    return this.bookingService.updateHotelBranding(hotelId, body);
  }


  @Get('driver/diary')
  async getDriverDiary(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    let driverId = '';
    try { const p = this.jwtService.verify(token) as any; driverId = p.sub; } catch { throw new UnauthorizedException('Invalid token'); }
    return this.bookingService.getDriverBookings(driverId);
  }

  @Get('hotel/staff')
  async getHotelStaff(@Headers('authorization') auth: string) {
    const hotelId = this.extractHotelId(auth);
    return this.bookingService.getHotelStaff(hotelId);
  }

  @Post('hotel/staff')
  async addHotelStaff(@Headers('authorization') auth: string, @Body() body: { name: string; email: string; password: string }) {
    const hotelId = this.extractHotelId(auth);
    return this.bookingService.addHotelStaff(hotelId, body.name, body.email, body.password);
  }

  @Delete('hotel/staff/:id')
  async removeHotelStaff(@Param('id') id: string) {
    return this.bookingService.removeHotelStaff(id);
  }


  @Patch('driver/location')
  async updateDriverLocation(@Headers('authorization') auth: string, @Body() body: { lat: number; lng: number }) {
    const token = auth?.replace('Bearer ', '');
    let driverId = '';
    try { const p = this.jwtService.verify(token) as any; driverId = p.sub; } catch { throw new UnauthorizedException('Invalid token'); }
    return this.bookingService.updateDriverLocation(driverId, body.lat, body.lng);
  }

  @Get('drivers/online')
  async getOnlineDrivers() {
    return this.bookingService.getOnlineDrivers();
  }


  @Get('driver/profile')
  async getDriverProfile(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    let driverId = '';
    try { const p = this.jwtService.verify(token) as any; driverId = p.sub; } catch { throw new UnauthorizedException('Invalid token'); }
    return this.bookingService.getDriverProfile(driverId);
  }

}
