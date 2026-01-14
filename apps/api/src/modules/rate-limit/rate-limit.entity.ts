// rate-limit.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Ключ формируется самим Throttler’ом (обычно из IP/маршрута/метода).
 * throttlerName нужен, если вы используете несколько «throttlers» в конфиге.
 */
@Entity({name: 'rate_limit'})
@Index(['key', 'throttlerName'], {unique: true})
export class RateLimitEntity {
  /** ключ от throttler’а (ip+route+method и т.п.) */
  @PrimaryColumn({type: 'text'})
  key: string;

  /** имя throttler’а (если в конфиге несколько); для единичного можно поставить 'default' */
  @PrimaryColumn({type: 'text', name: 'throttler_name'})
  throttlerName: string;

  /**
   * массив отметок времени (ms since epoch), попадающих в текущее окно ttl
   * В Postgres: bigint[].
   */
  @Column({type: 'bigint', array: true, default: () => `'{}'`})
  hits: string[]; // храним как string[], т.к. TypeORM для bigint отдаёт строки

  /** если выставлен бан, до какого момента (время в БД — timestamptz) */
  @Column({type: 'timestamptz', name: 'blocked_until', nullable: true})
  blockedUntil: Date | null = null;

  @CreateDateColumn({type: 'timestamptz', name: 'created_at'})
  createdAt: Date;

  @UpdateDateColumn({type: 'timestamptz', name: 'updated_at'})
  updatedAt: Date;
}
