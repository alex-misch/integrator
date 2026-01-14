// pg-throttler.storage.ts
import {Injectable} from '@nestjs/common';
import {ThrottlerStorage} from '@nestjs/throttler';
import {DataSource, Repository} from 'typeorm';
import {RateLimitEntity} from './rate-limit.entity';

@Injectable()
export class PgThrottlerStorage implements ThrottlerStorage {
  private repo: Repository<RateLimitEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(RateLimitEntity);
  }

  /**
   * Основной метод, который вызывает guard.
   * Возвращает totalHits (в окне ttl), timeToExpire (сек), и blocked (сек).
   */
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ) {
    const now = Date.now();
    const ttlMs = ttl * 1000;

    return this.dataSource.transaction(async manager => {
      const repo = manager.getRepository(RateLimitEntity);

      // Блокируем строку под запись (если есть), чтобы избежать гонок при параллельных запросах.
      let rec = await repo.findOne({
        where: {key, throttlerName},
        lock: {mode: 'pessimistic_write'},
      });

      if (!rec) {
        rec = repo.create({
          key,
          throttlerName,
          hits: [],
          blockedUntil: null,
        });
      }

      // prune старые хиты
      const pruned = (rec.hits ?? [])
        .map(Number)
        .filter(ts => now - ts < ttlMs);

      // если ещё действует блокировка — сразу возвращаем остаток блокировки
      if (rec.blockedUntil && rec.blockedUntil.getTime() > now) {
        const blocked = Math.ceil((rec.blockedUntil.getTime() - now) / 1000);
        // не добавляем хит в период бана
        return {
          totalHits: pruned.length,
          timeToExpire: ttl,
          blocked,
          isBlocked: blocked > 0,
          timeToBlockExpire: blocked,
        };
      }

      // добавляем текущий хит
      pruned.push(now);

      // проверяем лимит
      let blockedSeconds = 0;
      if (pruned.length > limit && blockDuration > 0) {
        const until = new Date(now + blockDuration * 1000);
        rec.blockedUntil = until;
        blockedSeconds = blockDuration;
      } else {
        rec.blockedUntil = null;
      }

      rec.hits = pruned.map(String); // bigint[] → строки
      await repo.save(rec);

      return {
        totalHits: pruned.length,
        timeToExpire: ttl,
        blocked: blockedSeconds,
        isBlocked: blockedSeconds > 0,
        timeToBlockExpire: blockedSeconds,
      };
    });
  }

  /**
   * Возвращает массив отметок времени (ms) для ВСЕХ throttlers по ключу.
   * Нужен для совместимости интерфейса (редко используется).
   */
  async getRecord(key: string): Promise<number[]> {
    const rows = await this.repo.find({where: {key}});
    const all = rows.flatMap(r => (r.hits ?? []).map(Number));
    return all;
  }

  async delete(key: string): Promise<void> {
    await this.repo.delete({key});
  }

  async deleteAll(): Promise<void> {
    await this.repo.deleteAll();
  }
}
