import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, firstName, lastName } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Store password as plain text
    const user = await this.prisma.user.create({
      data: {
        email,
        password: password, // Store as plain text
        firstName,
        lastName,
        isActive: true,
        emailVerified: false,
      },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findUserByEmail(email: string) {
    // Use raw SQL to bypass Prisma schema mapping issue
    const users = await this.prisma.$queryRaw`
      SELECT * FROM [app].[User] WHERE email = ${email}
    `;
    
    if (users && Array.isArray(users) && users.length > 0) {
      return users[0];
    }
    
    return null;
  }

  async findUserById(id: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async validateUser(email: string, password: string): Promise<UserResponseDto> {
    const user = await this.findUserByEmail(email);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare passwords as plain text
    const isPasswordValid = password === user.password;
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login using raw SQL
    await this.prisma.$executeRaw`
      UPDATE [app].[User] SET lastLoginAt = ${new Date()} WHERE id = ${user.id}
    `;

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const { password, ...updateData } = updateUserDto;
    
    let data: any = { ...updateData };
    
    // Store password as plain text if provided
    if (password) {
      data.password = password;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async deactivateUser(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = currentPassword === user.password;
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });
  }
}
