import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async signupDriver(data: any) {
    const existingDriver = await this.prisma.driver.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone }
        ]
      }
    });

    if (existingDriver) {
      throw new ConflictException('Driver with this email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const driver = await this.prisma.driver.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        status: 'OFFLINE',
        isApproved: false,
        vehicleMake: data.vehicleMake || '',
        vehicleModel: data.vehicleModel || '',
        vehicleReg: data.vehicleReg || '',
        vehicleColour: data.vehicleColour || '',
        licenceDoc: data.licenceDoc || '',
        phLicenceDoc: data.phLicenceDoc || '',
        insuranceDoc: data.insuranceDoc || '',
        motDoc: data.motDoc || '',
        profilePhoto: data.profilePhoto || '',
      }
    });

    const payload = { sub: driver.id, role: 'driver' };
    return {
      access_token: await this.jwtService.signAsync(payload),
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        status: driver.status
      }
    };
  }

  async loginHotelStaff(data: any) {
    const staff = await this.prisma.hotelStaff.findUnique({
      where: { email: data.email },
      include: { hotel: true }
    });

    if (!staff) {
      throw new ConflictException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, staff.password);
    
    if (!isPasswordValid) {
      throw new ConflictException('Invalid credentials');
    }

    const payload = { sub: staff.id, role: 'hotel_staff', hotelId: staff.hotelId };
    return {
      access_token: await this.jwtService.signAsync(payload),
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        hotel: staff.hotel.name,
        hotelId: staff.hotel.id,
        hotelAddress: staff.hotel.address,
        commissionRate: staff.hotel.commission_rate,
        subdomain: staff.hotel.subdomain
      }
    };
  }

  async loginDriver(data: any) {
    const driver = await this.prisma.driver.findUnique({
      where: { email: data.email }
    });

    if (!driver) {
      throw new ConflictException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, driver.password);
    
    if (!isPasswordValid) {
      throw new ConflictException('Invalid credentials');
    }

    const payload = { sub: driver.id, role: 'driver' };
    return {
      access_token: await this.jwtService.signAsync(payload),
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        status: driver.status
      }
    };
  }
}
