/* eslint-disable prettier/prettier */
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class NoQueryParams implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Check if the request has any query parameters
    if (Object.keys(req.query).length > 0) {
      // If there are query parameters, throw an UnauthorizedException
      throw new UnauthorizedException('Invalid request');
    }

    // If there are no query parameters, proceed to the next middleware or controller
    next();
  }
}