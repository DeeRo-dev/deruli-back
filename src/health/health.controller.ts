import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../common/decorators/public.decorator';

/**
 * Para el health check de Render y para verificar un deploy de un vistazo.
 *
 * Es @Public porque un chequeo de salud no puede depender de un token, y
 * no expone nada: solo dice si el proceso responde y si la base contesta.
 */
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  @Public()
  @Get()
  async check() {
    let database = 'down';

    try {
      await this.dataSource.query('SELECT 1');
      database = 'up';
    } catch {
      // El detalle del error no se devuelve: iría a un endpoint público.
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      uptime: Math.round(process.uptime()),
    };
  }
}
