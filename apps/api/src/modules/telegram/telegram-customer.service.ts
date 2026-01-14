import {Injectable, UnauthorizedException} from '@nestjs/common';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {TelegramCustomer} from './telegram-customer.entity';
import * as crypto from 'crypto';
import {parse} from 'querystring';
import {VerifyCustomerDto} from './dto/telegram-customer.dto';
import {TelegramLogs} from './telegram-log.entity';
import {getBotToken} from 'src/utils/tg';

@Injectable()
export class TelegramCustomerService {
  constructor(
    @InjectRepository(TelegramCustomer)
    private customer: Repository<TelegramCustomer>,

    @InjectRepository(TelegramLogs)
    private log: Repository<TelegramLogs>,
  ) {}

  count(opts?: FindManyOptions<TelegramCustomer>) {
    return this.customer.count(opts);
  }

  find(opts?: FindManyOptions<TelegramCustomer>) {
    return this.customer.findAndCount(opts);
  }

  findOne(opts: FindOneOptions<TelegramCustomer>) {
    return this.customer.findOne(opts);
  }

  async login(id: number) {
    return await this.log.insert({
      action: 'login',
      telegramId: id,
    });
  }

  async update(id: number, data: DeepPartial<TelegramCustomer>) {
    return this.customer.update(id, data);
  }

  private parseInitData(initData: string) {
    try {
      return parse(decodeURIComponent(initData));
    } catch (err) {
      console.log('err', err);
      throw new UnauthorizedException();
    }
  }

  private hmacSHA256(value, key) {
    return crypto.createHmac('sha256', key).update(value).digest();
  }

  async verify(initData: VerifyCustomerDto['initData'], startParam: string) {
    // Parse query data
    const parsedData = this.parseInitData(initData);

    // Get Telegram hash
    const hash = parsedData.hash as string;

    // Remove 'hash' value & Sort alphabetically
    const data_keys = Object.keys(parsedData)
      .filter(v => v !== 'hash')
      .sort();

    // Create line format key=<value>
    const items = data_keys.map(key => key + '=' + parsedData[key]);

    // Create check string with a line feed
    // character ('\n', 0x0A) used as separator
    // result: 'auth_date=<auth_date>\nquery_id=<query_id>\nuser=<user>'
    const data_check_string = items.join('\n');

    const secret_key = this.hmacSHA256(getBotToken(), 'WebAppData');

    // Generate hash to validate
    const hashGenerate = this.hmacSHA256(
      data_check_string,
      secret_key,
    ).toString('hex');

    if (typeof parsedData.user !== 'string') {
      throw new UnauthorizedException('Unknown user');
    }

    if (process.env.NODE_ENV === 'production' && hashGenerate !== hash) {
      throw new UnauthorizedException('Invalid hash');
    }

    const user = JSON.parse(parsedData.user) as {
      id: number;
      first_name: string;
      last_name: string;
      is_bot?: boolean;
      // is_premium?: boolean;
      allows_write_to_pm?: boolean;
      language_code?: string;
      photo_url?: string;
      username?: string;
      start_param?: string;
    };
    return await this.createOrUpdate(
      user.id,
      user,
      startParam || user.start_param,
    );
  }

  async createOrUpdate(
    id: number,
    _fields: {
      first_name?: string;
      last_name?: string;
      is_bot?: boolean;
      language_code?: string;
      photo_url?: string;
      username?: string;
    },
    start_param?: string,
  ) {
    const dbCustomer = await this.customer.findOne({
      where: {id},
    });

    const fields = {
      first_name: _fields.first_name,
      last_name: _fields.last_name,
      is_bot: !!_fields.is_bot,
      language_code: _fields.language_code || 'en',
      photo_url: dbCustomer?.photo_url || _fields.photo_url,
      username: _fields.username || '',
      start_param: start_param || null,
    };

    if (!dbCustomer) {
      const customer = this.customer.create({
        ...fields,
        is_blocked: false,
        id,
      });

      await this.customer.save(customer);

      return customer;
    } else {
      await this.customer.update(dbCustomer.id, {
        ...fields,
        start_param: dbCustomer.start_param || start_param,
      });

      return await this.customer.findOne({
        where: {id: dbCustomer.id},
      });
    }
  }
}
