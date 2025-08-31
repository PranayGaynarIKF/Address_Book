import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class FlexibleAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Try API key first (check both cases)
    const apiKey = request.headers['x-api-key'] || request.headers['X-API-Key'];
    if (apiKey) {
      const expectedApiKey = process.env.INGESTION_API_KEY || process.env.API_KEY || '0149f6cf158a88461d1fca0d6da773ac';
      if (apiKey === expectedApiKey) {
        return true;
      }
    }
    
    // Try JWT token
    const token = this.extractTokenFromHeader(request);
    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET,
        });
        
        // Check if user email is in admin emails
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
        if (!adminEmails.includes(payload.email)) {
          throw new UnauthorizedException('User is not an admin');
        }
        
        request['user'] = payload;
        return true;
      } catch {
        // JWT failed, continue to check API key
      }
    }
    
    throw new UnauthorizedException('Valid JWT token or API key is required');
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
