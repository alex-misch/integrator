import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const isDev = process.env.NODE_ENV !== 'production';
@Injectable()
export class CorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Получаем origin из заголовков запроса
    const origin = req.headers.origin || `http://${req.headers.host}`;

    if (isDev || origin.includes('emomap.online')) {
      // Устанавливаем заголовки CORS для текущего origin
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS',
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization',
      );
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end(); // Отправляем пустой ответ для preflight-запросов
      return;
    }

    // Продолжаем выполнение следующих middleware
    next();
  }
}
