import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {In, Repository} from 'typeorm';
import {Miniapp} from './miniapp.entity';
import {MiniappYclientsIntegration} from './miniapp-yclients.entity';
import {MiniappService as MiniappServiceEntity} from './miniapp-service.entity';
import {MiniappSpecialist as MiniappSpecialistEntity} from './miniapp-specialist.entity';
import {MiniappSeance} from './miniapp-seance.entity';
import {MiniappBooking, MiniappBookingStatus} from './miniapp-booking.entity';
import {TelegramCustomer} from '../telegram/telegram-customer.entity';
import {MiniappCreateDto} from '../../interfaces/admin/miniapps/dto/miniapp-create.dto';
import {MiniappUpdateDto} from '../../interfaces/admin/miniapps/dto/miniapp-update.dto';

@Injectable()
export class MiniappService {
  constructor(
    @InjectRepository(Miniapp)
    private readonly miniappRepository: Repository<Miniapp>,
    @InjectRepository(MiniappYclientsIntegration)
    private readonly yclientsRepository: Repository<MiniappYclientsIntegration>,
    @InjectRepository(MiniappServiceEntity)
    private readonly servicesRepository: Repository<MiniappServiceEntity>,
    @InjectRepository(MiniappSpecialistEntity)
    private readonly specialistsRepository: Repository<MiniappSpecialistEntity>,
    @InjectRepository(MiniappSeance)
    private readonly seancesRepository: Repository<MiniappSeance>,
    @InjectRepository(MiniappBooking)
    private readonly bookingsRepository: Repository<MiniappBooking>,
  ) {}

  findAll() {
    return this.miniappRepository.find({
      relations: ['photos', 'yclientsIntegrations'],
      order: {id: 'ASC'},
    });
  }

  findOne(id: number) {
    return this.miniappRepository.findOne({
      where: {id},
      relations: [
        'photos',
        'yclientsIntegrations',
        'reviews',
        'reviews.author_photo',
        'services',
        'services.specialists',
        'specialists',
        'specialists.photo',
        'specialists.services',
        'bookings',
        'bookings.customer',
        'bookings.service',
        'bookings.specialist',
      ],
    });
  }

  findIntegrations(miniappId: number) {
    return this.yclientsRepository.find({
      where: {miniapp: {id: miniappId}},
      order: {id: 'ASC'},
    });
  }

  findBySlug(slug: string) {
    return this.miniappRepository.findOne({
      where: {slug},
      relations: [
        'photos',
        'yclientsIntegrations',
        'reviews',
        'reviews.author_photo',
      ],
    });
  }

  findPrimaryIntegration(miniappId: number) {
    return this.yclientsRepository.findOne({
      where: {miniapp: {id: miniappId}, is_primary: true},
    });
  }

  findIntegration(miniappId: number, integrationId: number) {
    return this.yclientsRepository.findOne({
      where: {id: integrationId, miniapp: {id: miniappId}},
    });
  }

  findIntegrationByCompanyId(miniappId: number, companyId: number) {
    return this.yclientsRepository.findOne({
      where: {miniapp: {id: miniappId}, company_id: companyId},
    });
  }

  create(payload: MiniappCreateDto) {
    const miniapp = this.miniappRepository.create(payload);
    return this.miniappRepository.save(miniapp);
  }

  async update(id: number, payload: MiniappUpdateDto) {
    const miniapp = await this.miniappRepository.findOne({where: {id}});
    if (!miniapp) {
      return null;
    }
    Object.assign(miniapp, payload);
    return this.miniappRepository.save(miniapp);
  }

  async updateCompanyInfo(
    id: number,
    payload: Partial<
      Pick<
        Miniapp,
        'title' | 'public_title' | 'short_descr' | 'description' | 'logo_url'
      >
    >,
  ) {
    const miniapp = await this.miniappRepository.findOne({where: {id}});
    if (!miniapp) {
      return null;
    }
    Object.assign(miniapp, payload);
    return this.miniappRepository.save(miniapp);
  }

  async createIntegration(
    miniappId: number,
    payload: Partial<MiniappYclientsIntegration>,
  ) {
    const miniapp = await this.miniappRepository.findOne({
      where: {id: miniappId},
    });
    if (!miniapp) {
      return null;
    }
    const integration = this.yclientsRepository.create({
      ...payload,
      miniapp,
    });
    return this.yclientsRepository.save(integration);
  }

  async updateIntegration(
    miniappId: number,
    integrationId: number,
    payload: Partial<MiniappYclientsIntegration>,
  ) {
    const integration = await this.yclientsRepository.findOne({
      where: {id: integrationId, miniapp: {id: miniappId}},
    });
    if (!integration) {
      return null;
    }
    Object.assign(integration, payload);
    return this.yclientsRepository.save(integration);
  }

  async upsertIntegration(
    miniappId: number,
    companyId: number,
    payload: Partial<MiniappYclientsIntegration>,
  ) {
    const existing = await this.findIntegrationByCompanyId(
      miniappId,
      companyId,
    );
    if (existing) {
      Object.assign(existing, payload);
      return this.yclientsRepository.save(existing);
    }
    return this.createIntegration(miniappId, {
      ...payload,
      company_id: companyId,
    });
  }

  async deleteIntegration(miniappId: number, integrationId: number) {
    const integration = await this.yclientsRepository.findOne({
      where: {id: integrationId, miniapp: {id: miniappId}},
    });
    if (!integration) {
      return null;
    }
    await this.yclientsRepository.remove(integration);
    return integration;
  }

  async setPrimaryIntegration(miniappId: number, integrationId: number) {
    const integration = await this.yclientsRepository.findOne({
      where: {id: integrationId, miniapp: {id: miniappId}},
    });
    if (!integration) {
      return null;
    }

    await this.yclientsRepository.update(
      {miniapp: {id: miniappId}},
      {is_primary: false},
    );

    integration.is_primary = true;
    return this.yclientsRepository.save(integration);
  }

  async upsertServices(
    miniappId: number,
    integrationId: number,
    services: Array<{
      title: string;
      yclients_id: number | null;
      price_min: number | null;
      price_max: number | null;
      duration_sec: number | null;
      service_type: number | null;
      weight: number | null;
      price_text: string | null;
      duration_text: string | null;
      staff_ids?: number[];
      is_active: boolean;
    }>,
    specialistsByYclientsId?: Map<number, MiniappSpecialistEntity>,
  ) {
    const [miniapp, integration] = await Promise.all([
      this.miniappRepository.findOne({where: {id: miniappId}}),
      this.yclientsRepository.findOne({where: {id: integrationId}}),
    ]);
    if (!miniapp || !integration) {
      return null;
    }
    const yclientsIds = services
      .map(service => service.yclients_id)
      .filter((id): id is number => Boolean(id));
    const existingServices = yclientsIds.length
      ? await this.servicesRepository.find({
          where: {
            miniapp: {id: miniappId},
            integration: {id: integrationId},
            yclients_id: In(yclientsIds),
          },
          relations: ['specialists'],
        })
      : [];
    const existingByYclientsId = new Map<number, MiniappServiceEntity>();
    existingServices.forEach(service => {
      if (service.yclients_id) {
        existingByYclientsId.set(service.yclients_id, service);
      }
    });

    const staffByServiceId = new Map<number, number[]>();
    services.forEach(service => {
      if (service.yclients_id && service.staff_ids?.length) {
        staffByServiceId.set(service.yclients_id, service.staff_ids);
      }
    });

    const entities = services.map(service => {
      const specialists =
        service.staff_ids?.length && specialistsByYclientsId
          ? service.staff_ids
              .map(id => specialistsByYclientsId.get(id))
              .filter((specialist): specialist is MiniappSpecialistEntity =>
                Boolean(specialist),
              )
          : [];
      const existing = service.yclients_id
        ? existingByYclientsId.get(service.yclients_id)
        : undefined;
      const base =
        existing ?? this.servicesRepository.create({miniapp, integration});
      Object.assign(base, service, {specialists});
      return base;
    });
    const saved = await this.servicesRepository.save(entities);

    if (specialistsByYclientsId) {
      for (const savedService of saved) {
        if (!savedService.yclients_id) continue;

        const staffIds = staffByServiceId.get(savedService.yclients_id) ?? [];
        const specialistIds = staffIds
          .map(id => specialistsByYclientsId.get(id)?.id)
          .filter((id): id is number => Boolean(id));

        const currentSpecialists = await this.servicesRepository
          .createQueryBuilder()
          .relation(MiniappServiceEntity, 'specialists')
          .of(savedService.id)
          .loadMany<MiniappSpecialistEntity>();

        const currentIds = currentSpecialists.map(item => item.id);
        const toAdd = specialistIds.filter(id => !currentIds.includes(id));
        const toRemove = currentIds.filter(id => !specialistIds.includes(id));

        if (toAdd.length) {
          await this.servicesRepository
            .createQueryBuilder()
            .relation(MiniappServiceEntity, 'specialists')
            .of(savedService.id)
            .add(toAdd);
        }

        if (toRemove.length) {
          await this.servicesRepository
            .createQueryBuilder()
            .relation(MiniappServiceEntity, 'specialists')
            .of(savedService.id)
            .remove(toRemove);
        }
      }
    }

    if (yclientsIds.length) {
      await this.servicesRepository
        .createQueryBuilder()
        .update()
        .set({is_active: false})
        .where('"miniapp_id" = :miniappId', {miniappId})
        .andWhere('"integration_id" = :integrationId', {integrationId})
        .andWhere('"yclients_id" IS NOT NULL')
        .andWhere('"yclients_id" NOT IN (:...ids)', {ids: yclientsIds})
        .execute();
    } else {
      await this.servicesRepository
        .createQueryBuilder()
        .update()
        .set({is_active: false})
        .where('"miniapp_id" = :miniappId', {miniappId})
        .andWhere('"integration_id" = :integrationId', {integrationId})
        .andWhere('"yclients_id" IS NOT NULL')
        .execute();
    }

    return saved;
  }

  async upsertSpecialists(
    miniappId: number,
    integrationId: number,
    specialists: Array<{
      name: string;
      yclients_id: number | null;
      role: string | null;
      photo_url: string | null;
      is_active: boolean;
    }>,
  ) {
    const [miniapp, integration] = await Promise.all([
      this.miniappRepository.findOne({where: {id: miniappId}}),
      this.yclientsRepository.findOne({where: {id: integrationId}}),
    ]);
    if (!miniapp || !integration) {
      return null;
    }
    const yclientsIds = specialists
      .map(specialist => specialist.yclients_id)
      .filter((id): id is number => Boolean(id));
    const existingSpecialists = yclientsIds.length
      ? await this.specialistsRepository.find({
          where: {
            miniapp: {id: miniappId},
            integration: {id: integrationId},
            yclients_id: In(yclientsIds),
          },
        })
      : [];
    const existingByYclientsId = new Map<number, MiniappSpecialistEntity>();
    existingSpecialists.forEach(specialist => {
      if (specialist.yclients_id) {
        existingByYclientsId.set(specialist.yclients_id, specialist);
      }
    });

    const entities = specialists.map(specialist => {
      const existing = specialist.yclients_id
        ? existingByYclientsId.get(specialist.yclients_id)
        : undefined;
      const base =
        existing ?? this.specialistsRepository.create({miniapp, integration});
      Object.assign(base, specialist);
      return base;
    });
    const saved = await this.specialistsRepository.save(entities);

    if (yclientsIds.length) {
      await this.specialistsRepository
        .createQueryBuilder()
        .update()
        .set({is_active: false})
        .where('"miniapp_id" = :miniappId', {miniappId})
        .andWhere('"integration_id" = :integrationId', {integrationId})
        .andWhere('"yclients_id" IS NOT NULL')
        .andWhere('"yclients_id" NOT IN (:...ids)', {ids: yclientsIds})
        .execute();
    } else {
      await this.specialistsRepository
        .createQueryBuilder()
        .update()
        .set({is_active: false})
        .where('"miniapp_id" = :miniappId', {miniappId})
        .andWhere('"integration_id" = :integrationId', {integrationId})
        .andWhere('"yclients_id" IS NOT NULL')
        .execute();
    }

    return saved;
  }

  async replaceSpecialistServicesByYclientsIds(
    integrationId: number,
    specialistYclientsId: number,
    serviceYclientsIds: number[],
  ) {
    const specialist = await this.specialistsRepository.findOne({
      where: {
        integration: {id: integrationId},
        yclients_id: specialistYclientsId,
      },
      relations: ['services'],
    });
    if (!specialist) {
      return null;
    }
    const services = serviceYclientsIds.length
      ? await this.servicesRepository.find({
          where: {
            integration: {id: integrationId},
            yclients_id: In(serviceYclientsIds),
          },
        })
      : [];
    const currentIds = specialist.services?.map(service => service.id) ?? [];
    const nextIds = services.map(service => service.id);

    if (currentIds.length) {
      await this.specialistsRepository
        .createQueryBuilder()
        .relation(MiniappSpecialistEntity, 'services')
        .of(specialist.id)
        .remove(currentIds);
    }

    if (nextIds.length) {
      await this.specialistsRepository
        .createQueryBuilder()
        .relation(MiniappSpecialistEntity, 'services')
        .of(specialist.id)
        .add(nextIds);
    }

    return specialist;
  }

  async replaceServiceSpecialistsByYclientsIds(
    integrationId: number,
    serviceYclientsId: number,
    specialistYclientsIds: number[],
  ) {
    const service = await this.servicesRepository.findOne({
      where: {integration: {id: integrationId}, yclients_id: serviceYclientsId},
      relations: ['specialists'],
    });
    if (!service) {
      return null;
    }
    const specialists = specialistYclientsIds.length
      ? await this.specialistsRepository.find({
          where: {
            integration: {id: integrationId},
            yclients_id: In(specialistYclientsIds),
          },
        })
      : [];
    const currentIds = service.specialists?.map(item => item.id) ?? [];
    const nextIds = specialists.map(item => item.id);

    if (currentIds.length) {
      await this.servicesRepository
        .createQueryBuilder()
        .relation(MiniappServiceEntity, 'specialists')
        .of(service.id)
        .remove(currentIds);
    }

    if (nextIds.length) {
      await this.servicesRepository
        .createQueryBuilder()
        .relation(MiniappServiceEntity, 'specialists')
        .of(service.id)
        .add(nextIds);
    }

    return service;
  }

  async findServicesBySpecialist(integrationId: number, specialistId?: number) {
    const qb = this.servicesRepository
      .createQueryBuilder('service')
      .where('service.integration_id = :integrationId', {integrationId})
      .andWhere('service.is_active = true');

    if (specialistId) {
      qb.innerJoin(
        'service.specialists',
        'specialist',
        'specialist.id = :specialistId',
        {specialistId},
      );
    }

    return qb.orderBy('service.weight', 'ASC').getMany();
  }

  async findSpecialistsByService(integrationId: number, serviceId?: number) {
    const qb = this.specialistsRepository
      .createQueryBuilder('specialist')
      .where('specialist.integration_id = :integrationId', {integrationId})
      .andWhere('specialist.is_active = true');

    if (serviceId) {
      qb.innerJoin(
        'specialist.services',
        'service',
        'service.id = :serviceId',
        {serviceId},
      );
    }

    return qb.orderBy('specialist.id', 'ASC').getMany();
  }

  async replaceSeances(params: {
    miniappId: number;
    integrationId: number;
    serviceId: number;
    specialistId?: number | null;
    date: string;
    slots: Array<{time: string; datetime: string; seance_length: number}>;
  }) {
    const {miniappId, integrationId, serviceId, specialistId, date, slots} =
      params;
    const miniapp = await this.miniappRepository.findOne({
      where: {id: miniappId},
    });
    if (!miniapp) {
      return null;
    }
    const service = await this.servicesRepository.findOne({
      where: {
        id: serviceId,
        miniapp: {id: miniappId},
        integration: {id: integrationId},
      },
    });
    if (!service) {
      return null;
    }
    const specialist = specialistId
      ? await this.specialistsRepository.findOne({
          where: {
            id: specialistId,
            miniapp: {id: miniappId},
            integration: {id: integrationId},
          },
        })
      : null;

    await this.seancesRepository.delete({
      miniapp: {id: miniappId},
      service: {id: serviceId},
      specialist: specialistId ? {id: specialistId} : null,
      date,
    });

    const entities = slots.map(slot =>
      this.seancesRepository.create({
        miniapp,
        service,
        specialist: specialist ?? null,
        date,
        time: slot.time,
        datetime: slot.datetime,
        seance_length: slot.seance_length,
      }),
    );

    return this.seancesRepository.save(entities);
  }

  async findSeances(params: {
    miniappId: number;
    serviceId: number;
    specialistId?: number | null;
    date: string;
  }) {
    const {miniappId, serviceId, specialistId, date} = params;
    const qb = this.seancesRepository
      .createQueryBuilder('seance')
      .where('seance.miniapp_id = :miniappId', {miniappId})
      .andWhere('seance.service_id = :serviceId', {serviceId})
      .andWhere('seance.date = :date', {date});

    if (specialistId) {
      qb.andWhere('seance.specialist_id = :specialistId', {specialistId});
    } else {
      qb.andWhere('seance.specialist_id IS NULL');
    }

    return qb.orderBy('seance.time', 'ASC').getMany();
  }

  findService(integrationId: number, serviceId: number) {
    return this.servicesRepository.findOne({
      where: {id: serviceId, integration: {id: integrationId}},
    });
  }

  findSpecialist(integrationId: number, specialistId: number) {
    return this.specialistsRepository.findOne({
      where: {id: specialistId, integration: {id: integrationId}},
    });
  }

  findBookingById(miniappId: number, bookingId: number) {
    return this.bookingsRepository.findOne({
      where: {id: bookingId, miniapp: {id: miniappId}},
      relations: ['service', 'service.integration', 'specialist'],
    });
  }

  findBookingsByCustomer(params: {
    miniappId: number;
    integrationId: number;
    customerId: number;
  }) {
    const {miniappId, integrationId, customerId} = params;
    return this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.specialist', 'specialist')
      .where('booking.miniapp_id = :miniappId', {miniappId})
      .andWhere('booking.customer_id = :customerId', {customerId})
      .andWhere('service.integration_id = :integrationId', {integrationId})
      .orderBy('booking.date', 'DESC')
      .addOrderBy('booking.time', 'DESC')
      .getMany();
  }

  async createBooking(params: {
    miniapp: Miniapp;
    customer: TelegramCustomer;
    service: MiniappServiceEntity;
    specialist?: MiniappSpecialistEntity | null;
    date: string;
    time: string;
  }) {
    const booking = this.bookingsRepository.create({
      miniapp: params.miniapp,
      customer: params.customer,
      service: params.service,
      specialist: params.specialist ?? null,
      date: params.date,
      time: params.time,
      status: MiniappBookingStatus.Pending,
    });
    return this.bookingsRepository.save(booking);
  }
}
