import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {ApiOkResponse, ApiOperation, ApiTags} from '@nestjs/swagger';
import {MiniappService as MiniappDomainService} from 'src/modules/miniapp/miniapp.service';
import {
  MiniappPublicDto,
  MiniappPublicIntegrationDto,
  MiniappPublicServiceDto,
  MiniappPublicSpecialistDto,
  MiniappTimeslotDto,
} from './dto/miniapp-public.dto';
import {
  MiniappCreateRecordDto,
  MiniappPublicBookingDto,
  MiniappRecordsQueryDto,
} from './dto/miniapp-record.dto';
import {YclientsClient} from 'src/modules/integrations/yclients/yclients.service';
import {UseTelegramGuard} from 'src/decorators/UseTelegramGuard';
import {JwtService} from '@nestjs/jwt';
import {ConfigService} from '@nestjs/config';
import {JWT_SECRET} from 'src/utils/jwt';
import {JwtStrategy} from '../customer/jwt.strategy';
import {TelegramCustomerService} from 'src/modules/telegram/telegram-customer.service';
import {TelegramCustomer} from 'src/modules/telegram/telegram-customer.entity';
import {MiniappSpecialist} from 'src/modules/miniapp/miniapp-specialist.entity';
import {MiniappBooking} from 'src/modules/miniapp/miniapp-booking.entity';

@ApiTags('public-miniapps')
@Controller('public/miniapps')
export class MiniappsPublicController {
  constructor(
    private readonly miniapps: MiniappDomainService,
    private readonly yclients: YclientsClient,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly customerService: TelegramCustomerService,
  ) {}

  @Get(':slug/:companyId')
  @ApiOperation({summary: 'Miniapp public detail'})
  @ApiOkResponse({type: MiniappPublicDto})
  async bySlug(
    @Param('slug') slug: string,
    @Param('companyId') companyId: string,
  ): Promise<MiniappPublicDto> {
    const miniapp = await this.miniapps.findBySlug(slug);
    if (!miniapp) {
      throw new NotFoundException(`Miniapp ${slug} not found`);
    }
    const companyIdNumber = Number(companyId);
    if (!companyIdNumber || Number.isNaN(companyIdNumber)) {
      throw new BadRequestException('companyId is required');
    }
    const selectedIntegration = await this.miniapps.findIntegrationByCompanyId(
      miniapp.id,
      companyIdNumber,
    );
    if (!selectedIntegration) {
      throw new NotFoundException(`Integration ${companyId} not found`);
    }
    const companies =
      miniapp.yclientsIntegrations
        ?.filter(integration => integration.company_id)
        .map(integration => ({
          id: integration.company_id as number,
          title:
            integration.address_text ||
            integration.city ||
            integration.country ||
            `Компания ${integration.company_id}`,
        })) ?? [];

    return {
      id: miniapp.id,
      name: miniapp.name,
      slug: miniapp.slug,
      logo_url: miniapp.logo_url,
      title: miniapp.title,
      public_title: miniapp.public_title,
      short_descr: miniapp.short_descr,
      description: miniapp.description,
      photos: miniapp.photos ?? [],
      reviews: miniapp.reviews ?? [],
      companies,
      integration: selectedIntegration
        ? (selectedIntegration as MiniappPublicIntegrationDto)
        : null,
    };
  }

  @Get(':slug/:companyId/services')
  @ApiOperation({summary: 'Miniapp services'})
  @ApiOkResponse({type: MiniappPublicServiceDto, isArray: true})
  async services(
    @Param('slug') slug: string,
    @Param('companyId') companyId: string,
    @Query('specialistId') specialistId?: string,
  ): Promise<MiniappPublicServiceDto[]> {
    const miniapp = await this.miniapps.findBySlug(slug);
    if (!miniapp) {
      throw new NotFoundException(`Miniapp ${slug} not found`);
    }
    const companyIdNumber = Number(companyId);
    if (!companyIdNumber || Number.isNaN(companyIdNumber)) {
      throw new BadRequestException('companyId is required');
    }
    const selectedIntegration = await this.miniapps.findIntegrationByCompanyId(
      miniapp.id,
      companyIdNumber,
    );
    if (!selectedIntegration?.company_id) {
      throw new NotFoundException(`Integration ${companyId} not found`);
    }
    const specialistIdNumber = specialistId ? Number(specialistId) : undefined;

    if (selectedIntegration?.company_id) {
      try {
        await this.syncServicesAndStaff({
          miniappId: miniapp.id,
          integrationId: selectedIntegration.id,
          companyId: selectedIntegration.company_id,
          specialistId:
            specialistIdNumber && !Number.isNaN(specialistIdNumber)
              ? specialistIdNumber
              : undefined,
        });
      } catch {
        // fallback to cache
      }
    }

    return this.miniapps.findServicesBySpecialist(
      selectedIntegration.id,
      specialistIdNumber && !Number.isNaN(specialistIdNumber)
        ? specialistIdNumber
        : undefined,
    );
  }

  @Get(':slug/:companyId/staff')
  @ApiOperation({summary: 'Miniapp staff'})
  @ApiOkResponse({type: MiniappPublicSpecialistDto, isArray: true})
  async staff(
    @Param('slug') slug: string,
    @Param('companyId') companyId: string,
    @Query('serviceId') serviceId?: string,
  ): Promise<MiniappPublicSpecialistDto[]> {
    const miniapp = await this.miniapps.findBySlug(slug);
    if (!miniapp) {
      throw new NotFoundException(`Miniapp ${slug} not found`);
    }
    const companyIdNumber = Number(companyId);
    if (!companyIdNumber || Number.isNaN(companyIdNumber)) {
      throw new BadRequestException('companyId is required');
    }
    const selectedIntegration = await this.miniapps.findIntegrationByCompanyId(
      miniapp.id,
      companyIdNumber,
    );
    if (!selectedIntegration?.company_id) {
      throw new NotFoundException(`Integration ${companyId} not found`);
    }
    const serviceIdNumber = serviceId ? Number(serviceId) : undefined;

    if (selectedIntegration?.company_id) {
      try {
        await this.syncServicesAndStaff({
          miniappId: miniapp.id,
          integrationId: selectedIntegration.id,
          companyId: selectedIntegration.company_id,
          serviceId:
            serviceIdNumber && !Number.isNaN(serviceIdNumber)
              ? serviceIdNumber
              : undefined,
        });
      } catch {
        // fallback to cache
      }
    }
    return this.miniapps.findSpecialistsByService(
      selectedIntegration.id,
      serviceIdNumber && !Number.isNaN(serviceIdNumber)
        ? serviceIdNumber
        : undefined,
    );
  }

  @Get(':slug/:companyId/records')
  @ApiOperation({summary: 'Miniapp records'})
  @ApiOkResponse({type: MiniappTimeslotDto, isArray: true})
  async records(
    @Param('slug') slug: string,
    @Param('companyId') companyId: string,
    @Query() query?: MiniappRecordsQueryDto,
    // @Req() request,
  ) {
    const miniapp = await this.miniapps.findBySlug(slug);
    if (!miniapp) {
      throw new NotFoundException(`Miniapp ${slug} not found`);
    }
    const companyIdNumber = Number(companyId);
    if (!companyIdNumber || Number.isNaN(companyIdNumber)) {
      throw new BadRequestException('companyId is required');
    }
    const selectedIntegration = await this.miniapps.findIntegrationByCompanyId(
      miniapp.id,
      companyIdNumber,
    );
    if (!selectedIntegration?.company_id) {
      throw new NotFoundException(`Integration ${companyId} not found`);
    }

    // if (query?.mine === '1' || query?.mine === 'true') {
    //   const customer = await this.getCustomerFromRequest(request);
    //   if (!customer.yclients_id) {
    //     return [];
    //   }
    //   return this.yclients.recordsByClient({
    //     companyId: selectedIntegration.company_id,
    //     clientId: customer.yclients_id,
    //   });
    // }

    if (!query?.date || !query?.serviceId) {
      throw new BadRequestException('date and serviceId are required');
    }

    const service = await this.miniapps.findService(
      selectedIntegration.id,
      Number(query.serviceId),
    );
    if (!service?.yclients_id) {
      throw new BadRequestException('service yclients_id not found');
    }

    const specialistIdNumber = query?.specialistId
      ? Number(query.specialistId)
      : null;
    const specialist = specialistIdNumber
      ? await this.miniapps.findSpecialist(
          selectedIntegration.id,
          specialistIdNumber,
        )
      : null;

    const staffId = specialist?.yclients_id ?? 0;

    try {
      const slots = await this.yclients.bookTimes({
        companyId: selectedIntegration.company_id,
        staffId,
        date: query.date,
        serviceIds: [service.yclients_id],
      });
      await this.miniapps.replaceSeances({
        miniappId: miniapp.id,
        integrationId: selectedIntegration.id,
        serviceId: service.id,
        specialistId: specialistIdNumber ?? null,
        date: query.date,
        slots,
      });
      return slots;
    } catch {
      const cached = await this.miniapps.findSeances({
        miniappId: miniapp.id,
        serviceId: service.id,
        specialistId: specialistIdNumber ?? null,
        date: query.date,
      });
      return cached.map(slot => ({
        time: slot.time,
        seance_length: slot.seance_length,
        datetime: slot.datetime,
      }));
    }
  }

  @Get(':slug/:companyId/bookings')
  @ApiOperation({summary: 'Miniapp bookings'})
  @ApiOkResponse({type: MiniappPublicBookingDto, isArray: true})
  @UseTelegramGuard()
  async bookings(
    @Param('slug') slug: string,
    @Param('companyId') companyId: string,
    @Req() request,
  ): Promise<MiniappPublicBookingDto[]> {
    const miniapp = await this.miniapps.findBySlug(slug);
    if (!miniapp) {
      throw new NotFoundException(`Miniapp ${slug} not found`);
    }
    const companyIdNumber = Number(companyId);
    if (!companyIdNumber || Number.isNaN(companyIdNumber)) {
      throw new BadRequestException('companyId is required');
    }
    const selectedIntegration = await this.miniapps.findIntegrationByCompanyId(
      miniapp.id,
      companyIdNumber,
    );
    if (!selectedIntegration?.company_id) {
      throw new NotFoundException(`Integration ${companyId} not found`);
    }
    const customer = await this.getCustomerFromRequest(request);
    const bookings = await this.miniapps.findBookingsByCustomer({
      miniappId: miniapp.id,
      integrationId: selectedIntegration.id,
      customerId: customer.id,
    });
    return bookings.map(booking => ({
      id: booking.id,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      service: booking.service as MiniappPublicServiceDto,
      specialist: booking.specialist
        ? (booking.specialist as MiniappPublicSpecialistDto)
        : null,
    }));
  }

  @Post(':slug/:companyId/record')
  @ApiOperation({summary: 'Create miniapp record'})
  @ApiOkResponse({type: MiniappBooking})
  @UseTelegramGuard()
  async createRecord(
    @Param('slug') slug: string,
    @Param('companyId') companyId: string,
    @Body() payload: MiniappCreateRecordDto,
    @Req() request,
  ) {
    const miniapp = await this.miniapps.findBySlug(slug);
    if (!miniapp) {
      throw new NotFoundException(`Miniapp ${slug} not found`);
    }
    const companyIdNumber = Number(companyId);
    if (!companyIdNumber || Number.isNaN(companyIdNumber)) {
      throw new BadRequestException('companyId is required');
    }
    const selectedIntegration = await this.miniapps.findIntegrationByCompanyId(
      miniapp.id,
      companyIdNumber,
    );
    if (!selectedIntegration?.company_id) {
      throw new NotFoundException(`Integration ${companyId} not found`);
    }

    const service = await this.miniapps.findService(
      selectedIntegration.id,
      payload.service_id,
    );
    if (!service) {
      throw new BadRequestException('service not found');
    }

    const specialist = payload.specialist_id
      ? await this.miniapps.findSpecialist(
          selectedIntegration.id,
          payload.specialist_id,
        )
      : null;
    if (payload.specialist_id && !specialist) {
      throw new BadRequestException('specialist not found');
    }

    const customer =
      (request?.customer as TelegramCustomer | undefined) ??
      (await this.getCustomerFromRequest(request));

    const booking = await this.miniapps.createBooking({
      miniapp,
      customer,
      service,
      specialist,
      date: payload.date,
      time: payload.time,
    });

    return booking;
  }

  @Get(':slug/:companyId/booking/:bookingId')
  @ApiOperation({summary: 'Get miniapp booking'})
  @ApiOkResponse({type: MiniappPublicBookingDto})
  async bookingById(
    @Param('slug') slug: string,
    @Param('companyId') companyId: string,
    @Param('bookingId') bookingId: string,
  ): Promise<MiniappPublicBookingDto> {
    const miniapp = await this.miniapps.findBySlug(slug);
    if (!miniapp) {
      throw new NotFoundException(`Miniapp ${slug} not found`);
    }
    const companyIdNumber = Number(companyId);
    if (!companyIdNumber || Number.isNaN(companyIdNumber)) {
      throw new BadRequestException('companyId is required');
    }
    const selectedIntegration = await this.miniapps.findIntegrationByCompanyId(
      miniapp.id,
      companyIdNumber,
    );
    if (!selectedIntegration?.company_id) {
      throw new NotFoundException(`Integration ${companyId} not found`);
    }
    const bookingIdNumber = Number(bookingId);
    if (!bookingIdNumber || Number.isNaN(bookingIdNumber)) {
      throw new BadRequestException('bookingId is required');
    }
    const booking = await this.miniapps.findBookingById(
      miniapp.id,
      bookingIdNumber,
    );
    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }
    if (booking.service?.integration?.id !== selectedIntegration.id) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    return {
      id: booking.id,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      service: booking.service as MiniappPublicServiceDto,
      specialist: booking.specialist
        ? (booking.specialist as MiniappPublicSpecialistDto)
        : null,
    };
  }

  private async getCustomerFromRequest(request): Promise<TelegramCustomer> {
    const token = JwtStrategy.getToken(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>(JWT_SECRET),
    });
    const customer = await this.customerService.findOne({
      where: {id: +payload.sub},
    });
    if (!customer) {
      throw new UnauthorizedException();
    }
    return customer;
  }

  private async syncServicesAndStaff(props: {
    miniappId: number;
    integrationId: number;
    companyId: number;
    specialistId?: number;
    serviceId?: number;
  }) {
    const {companyId, miniappId, integrationId} = props;
    const staff = await this.yclients.bookStaff(companyId);
    const specialists = staff.map(member => ({
      name: member.name,
      yclients_id: Number(member.id) || null,
      role: member.specialization || null,
      photo_url: member.avatar || null,
      is_active: !member.hidden && !member.fired && member.status !== 1,
    }));

    const savedSpecialists = await this.miniapps.upsertSpecialists(
      miniappId,
      integrationId,
      specialists,
    );
    const specialistsByYclientsId = new Map<number, MiniappSpecialist>();
    savedSpecialists?.forEach(specialist => {
      if (specialist.yclients_id) {
        specialistsByYclientsId.set(specialist.yclients_id, specialist);
      }
    });

    const servicesData = await this.yclients.bookServices(companyId);
    const services = servicesData.services.map(service => {
      const min = service.price_min ?? 0;
      const max = service.price_max ?? 0;
      let priceText: string | null = null;
      if (min && max && min !== max) {
        priceText = `${min}–${max} ₽`;
      } else if (min || max) {
        priceText = `${min || max} ₽`;
      }
      const durationSeconds = service.seance_length ?? 0;
      const durationMinutes = Math.round(durationSeconds / 60);
      const durationText = durationMinutes ? `${durationMinutes} мин` : null;
      const rawStaffIds =
        (service as {staff_ids?: Array<number | string>}).staff_ids ??
        (
          service as {
            staff?: Array<{id: number | string}> | Array<number | string>;
          }
        ).staff ??
        [];
      const staffIds = Array.isArray(rawStaffIds)
        ? rawStaffIds
            .map(item => {
              if (typeof item === 'number') return item;
              if (typeof item === 'string') return Number(item);
              if (item && typeof item === 'object' && 'id' in item) {
                const idValue = (item as {id: number | string}).id;
                return typeof idValue === 'string' ? Number(idValue) : idValue;
              }
              return NaN;
            })
            .filter(id => Number.isFinite(id))
        : [];

      return {
        title: service.title,
        yclients_id: service.id ?? null,
        price_min: service.price_min ?? null,
        price_max: service.price_max ?? null,
        duration_sec: durationSeconds || null,
        service_type: service.active ?? null,
        weight: service.weight ?? null,
        price_text: priceText,
        duration_text: durationText,
        staff_ids: staffIds.filter((staffId): staffId is number =>
          Boolean(staffId),
        ),
        is_active: !!service.active,
      };
    });

    const savedServices = await this.miniapps.upsertServices(
      miniappId,
      integrationId,
      services,
      specialistsByYclientsId,
    );

    const resolveSpecialistYclientsId = (id?: number) => {
      if (!id) return null;
      const byDb = savedSpecialists?.find(item => +item.id === +id);
      return byDb?.yclients_id ?? null;
    };

    const resolveServiceYclientsId = (id?: number) => {
      if (!id) return null;
      const byDb = savedServices?.find(item => +item.id === +id);
      return byDb?.yclients_id ?? null;
    };

    if (props.specialistId) {
      const staffId = resolveSpecialistYclientsId(props.specialistId);
      if (staffId) {
        const servicesByStaff = await this.yclients.bookServices(companyId, {
          staffId,
        });
        const serviceIds = servicesByStaff.services
          .map(service => service.id ?? null)
          .filter((id): id is number => Boolean(id));
        await this.miniapps.replaceSpecialistServicesByYclientsIds(
          integrationId,
          staffId,
          serviceIds,
        );
      }
    }

    if (props.serviceId) {
      const serviceId = resolveServiceYclientsId(props.serviceId);
      if (serviceId) {
        const staffByService = await this.yclients.bookStaff(companyId, {
          serviceIds: [serviceId],
        });
        const staffIds = staffByService
          .map(member => Number(member.id) || null)
          .filter((id): id is number => Boolean(id));
        await this.miniapps.replaceServiceSpecialistsByYclientsIds(
          integrationId,
          serviceId,
          staffIds,
        );
      }
    }
  }
}
