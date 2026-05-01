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
  MiniappBookDatesDto,
  MiniappBookDatesQueryDto,
  MiniappCreateRecordDto,
  MiniappPublicBookingDto,
  MiniappRecordsQueryDto,
  MiniappUpdateBookingDto,
} from './dto/miniapp-record.dto';
import {YclientsClient} from 'src/modules/integrations/yclients/yclients.service';
import {UseTelegramGuard} from 'src/decorators/UseTelegramGuard';
import {JwtService} from '@nestjs/jwt';
import {ConfigService} from '@nestjs/config';
import {JWT_SECRET} from 'src/utils/jwt';
import {JwtStrategy} from '../customer/jwt.strategy';
import {TelegramCustomerService} from 'src/modules/telegram/telegram-customer.service';
import {TelegramCustomer} from 'src/modules/telegram/telegram-customer.entity';
import {Miniapp} from 'src/modules/miniapp/miniapp.entity';
import {MiniappSpecialist} from 'src/modules/miniapp/miniapp-specialist.entity';
import {
  MiniappBooking,
  MiniappBookingStatus,
} from 'src/modules/miniapp/miniapp-booking.entity';
import {MiniappYclientsIntegration} from 'src/modules/miniapp/miniapp-yclients.entity';
import {MiniappService} from 'src/modules/miniapp/miniapp-service.entity';
import {normalizePhone} from 'src/utils/phone';

const DEFAULT_BOOKING_SELECTION_BY_COMPANY_ID: Record<
  number,
  {serviceId: number; specialistId: number}
> = {
  122686: {serviceId: 1, specialistId: 37},
  520803: {serviceId: 3, specialistId: 44},
};

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
          is_primary: integration.is_primary,
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

  @Get(':slug/:companyId/book-dates')
  @ApiOperation({summary: 'Miniapp available booking dates'})
  @ApiOkResponse({type: MiniappBookDatesDto})
  async bookDates(
    @Param('slug') slug: string,
    @Param('companyId') companyId: string,
    @Query() query?: MiniappBookDatesQueryDto,
  ): Promise<MiniappBookDatesDto> {
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

    const {serviceYclientsId, specialistYclientsId} =
      await this.resolveBookingSelection({
        miniappId: miniapp.id,
        integration: selectedIntegration,
        companyId: companyIdNumber,
      });

    if (!serviceYclientsId || !specialistYclientsId) {
      throw new BadRequestException('booking selection yclients_id not found');
    }

    return this.yclients.bookDates(selectedIntegration.company_id, {
      staffId: specialistYclientsId,
      serviceIds: [serviceYclientsId],
      date: query?.date,
      dateFrom: query?.dateFrom,
      dateTo: query?.dateTo,
    });
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

    if (!query?.date) {
      throw new BadRequestException('date is required');
    }

    const {service, specialist, serviceYclientsId, specialistYclientsId} =
      await this.resolveBookingSelection({
        miniappId: miniapp.id,
        integration: selectedIntegration,
        companyId: companyIdNumber,
        serviceId: query.serviceId ? Number(query.serviceId) : undefined,
        specialistId: query.specialistId
          ? Number(query.specialistId)
          : undefined,
      });

    if (!serviceYclientsId) {
      throw new BadRequestException('service yclients_id not found');
    }

    const staffId = specialistYclientsId ?? 0;

    try {
      const slots = await this.yclients.bookTimes({
        companyId: selectedIntegration.company_id,
        staffId,
        date: query.date,
        serviceIds: [serviceYclientsId],
      });
      await this.miniapps.replaceSeances({
        miniappId: miniapp.id,
        integrationId: selectedIntegration.id,
        serviceId: service.id,
        specialistId: specialist?.id ?? null,
        date: query.date,
        slots,
      });
      return slots;
    } catch {
      const cached = await this.miniapps.findSeances({
        miniappId: miniapp.id,
        serviceId: service.id,
        specialistId: specialist?.id ?? null,
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

    const customer =
      (request?.customer as TelegramCustomer | undefined) ??
      (await this.getCustomerFromRequest(request));

    const booking = await this.createYclientsBackedBooking({
      miniappId: miniapp.id,
      miniapp,
      integration: selectedIntegration,
      companyId: companyIdNumber,
      customer,
      payload,
      date: payload.date,
      time: payload.time,
    });

    return booking;
  }

  @Post(':slug/:companyId/booking/:bookingId')
  @ApiOperation({summary: 'Update miniapp booking'})
  @ApiOkResponse({type: MiniappPublicBookingDto})
  @UseTelegramGuard()
  async updateBooking(
    @Param('slug') slug: string,
    @Param('companyId') companyId: string,
    @Param('bookingId') bookingId: string,
    @Body() payload: MiniappUpdateBookingDto,
    @Req() request,
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

    const customer =
      (request?.customer as TelegramCustomer | undefined) ??
      (await this.getCustomerFromRequest(request));
    if (booking.customer?.id !== customer.id) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    const {service, specialist, serviceYclientsId, specialistYclientsId} =
      await this.resolveBookingSelection({
        miniappId: miniapp.id,
        integration: selectedIntegration,
        companyId: companyIdNumber,
      });

    if (!serviceYclientsId || !specialistYclientsId) {
      throw new BadRequestException('booking selection yclients_id not found');
    }

    const createdRecords = await this.yclients.bookRecord(
      selectedIntegration.company_id,
      this.buildYclientsBookRecordRequest({
        phone: customer.phone,
        fullname: this.getCustomerName(customer),
        email: null,
        comment: 'Перенос записи из мини-приложения',
        date: payload.date,
        time: payload.time,
        serviceYclientsId,
        specialistYclientsId,
        apiId: `miniapp-booking-${booking.id}-reschedule-${Date.now()}`,
      }),
    );
    const createdRecord = createdRecords[0];
    if (!createdRecord?.record_id || !createdRecord.record_hash) {
      throw new BadRequestException('YCLIENTS record was not created');
    }

    try {
      if (booking.yclients_record_id && booking.yclients_record_hash) {
        await this.yclients.deleteUserRecord(
          booking.yclients_record_id,
          booking.yclients_record_hash,
        );
      }
    } catch (error) {
      await this.yclients.deleteUserRecord(
        createdRecord.record_id,
        createdRecord.record_hash,
      );
      throw error;
    }

    const updated = await this.miniapps.updateBooking({
      booking,
      service,
      specialist,
      date: payload.date,
      time: payload.time,
      status: MiniappBookingStatus.Confirmed,
      yclientsRecordId: createdRecord.record_id,
      yclientsRecordHash: createdRecord.record_hash,
    });

    return this.toPublicBookingDto(updated);
  }

  @Post(':slug/:companyId/booking/:bookingId/cancel')
  @ApiOperation({summary: 'Cancel miniapp booking'})
  @ApiOkResponse({type: MiniappPublicBookingDto})
  @UseTelegramGuard()
  async cancelBooking(
    @Param('slug') slug: string,
    @Param('companyId') companyId: string,
    @Param('bookingId') bookingId: string,
    @Req() request,
  ): Promise<MiniappPublicBookingDto> {
    const miniapp = await this.miniapps.findBySlug(slug);
    if (!miniapp) {
      throw new NotFoundException(`Miniapp ${slug} not found`);
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

    const customer =
      (request?.customer as TelegramCustomer | undefined) ??
      (await this.getCustomerFromRequest(request));
    if (booking.customer?.id !== customer.id) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
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
    if (booking.service?.integration?.id !== selectedIntegration.id) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    if (booking.yclients_record_id && booking.yclients_record_hash) {
      await this.yclients.deleteUserRecord(
        booking.yclients_record_id,
        booking.yclients_record_hash,
      );
    }

    const updated = await this.miniapps.cancelBooking(booking);

    return this.toPublicBookingDto(updated);
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

  private toPublicBookingDto(booking: MiniappBooking): MiniappPublicBookingDto {
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

  private async createYclientsBackedBooking(props: {
    miniappId: number;
    miniapp: Miniapp;
    integration: MiniappYclientsIntegration;
    companyId: number;
    customer: TelegramCustomer;
    payload: MiniappCreateRecordDto;
    date: string;
    time: string;
  }) {
    const {service, specialist, serviceYclientsId, specialistYclientsId} =
      await this.resolveBookingSelection({
        miniappId: props.miniappId,
        integration: props.integration,
        companyId: props.companyId,
        serviceId: props.payload.service_id,
        specialistId: props.payload.specialist_id ?? undefined,
      });

    if (!serviceYclientsId || !specialistYclientsId) {
      throw new BadRequestException('booking selection yclients_id not found');
    }

    const createdRecords = await this.yclients.bookRecord(
      props.integration.company_id,
      this.buildYclientsBookRecordRequest({
        phone: props.payload.client_phone,
        fullname: props.payload.client_name,
        email: props.payload.client_email ?? null,
        comment: props.payload.comment ?? 'Запись из мини-приложения',
        date: props.date,
        time: props.time,
        serviceYclientsId,
        specialistYclientsId,
        apiId: `miniapp-booking-create-${props.customer.id}-${Date.now()}`,
      }),
    );
    const createdRecord = createdRecords[0];
    if (!createdRecord?.record_id || !createdRecord.record_hash) {
      throw new BadRequestException('YCLIENTS record was not created');
    }

    try {
      return await this.miniapps.createBooking({
        miniapp: props.miniapp,
        customer: props.customer,
        service,
        specialist,
        date: props.date,
        time: props.time,
        status: MiniappBookingStatus.Confirmed,
        yclientsRecordId: createdRecord.record_id,
        yclientsRecordHash: createdRecord.record_hash,
      });
    } catch (error) {
      await this.yclients.deleteUserRecord(
        createdRecord.record_id,
        createdRecord.record_hash,
      );
      throw error;
    }
  }

  private buildYclientsBookRecordRequest(props: {
    phone: string | null | undefined;
    fullname: string | null | undefined;
    email: string | null | undefined;
    comment?: string | null;
    date: string;
    time: string;
    serviceYclientsId: number;
    specialistYclientsId: number;
    apiId: string;
  }) {
    const phone = normalizePhone(props.phone ?? null);
    if (!phone) {
      throw new BadRequestException('client_phone is required');
    }

    const fullname = props.fullname?.trim();
    if (!fullname) {
      throw new BadRequestException('client_name is required');
    }

    return {
      phone,
      fullname,
      email: props.email?.trim() ?? '',
      comment: props.comment ?? '',
      type: 'mobile',
      api_id: props.apiId,
      appointments: [
        {
          id: 1,
          services: [props.serviceYclientsId],
          staff_id: props.specialistYclientsId,
          datetime: this.formatYclientsDateTime(props.date, props.time),
        },
      ],
      is_newsletter_allowed: false,
      is_personal_data_processing_allowed: true,
    };
  }

  private getCustomerName(customer: TelegramCustomer) {
    const name = [customer.first_name, customer.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    return name || customer.username || `Клиент ${customer.id}`;
  }

  private formatYclientsDateTime(date: string, time: string) {
    const [hours = '00', minutes = '00', seconds = '00'] = time.split(':');
    return `${date} ${hours.padStart(2, '0')}:${minutes.padStart(
      2,
      '0',
    )}:${seconds.padStart(2, '0')}`;
  }

  private getDefaultBookingSelection(companyId: number) {
    return DEFAULT_BOOKING_SELECTION_BY_COMPANY_ID[companyId] ?? null;
  }

  private async resolveBookingSelection(props: {
    miniappId: number;
    integration: MiniappYclientsIntegration;
    companyId: number;
    serviceId?: number | null;
    specialistId?: number | null;
  }): Promise<{
    service: MiniappService;
    specialist: MiniappSpecialist | null;
    serviceYclientsId: number | null;
    specialistYclientsId: number | null;
  }> {
    const defaults = this.getDefaultBookingSelection(props.companyId);
    const serviceId = defaults?.serviceId ?? props.serviceId;
    const specialistId = defaults?.specialistId ?? props.specialistId;

    if (!serviceId) {
      throw new BadRequestException('serviceId is required');
    }

    let serviceSelection = await this.findServiceForBooking(
      props.integration.id,
      serviceId,
      Boolean(defaults),
    );
    let specialistSelection = specialistId
      ? await this.findSpecialistForBooking(
          props.integration.id,
          specialistId,
          Boolean(defaults),
        )
      : null;

    if (!serviceSelection || (specialistId && !specialistSelection)) {
      try {
        await this.syncServicesAndStaff({
          miniappId: props.miniappId,
          integrationId: props.integration.id,
          companyId: props.integration.company_id,
        });
      } catch {
        // fallback to already cached services/staff below
      }

      serviceSelection = await this.findServiceForBooking(
        props.integration.id,
        serviceId,
        Boolean(defaults),
      );
      specialistSelection = specialistId
        ? await this.findSpecialistForBooking(
            props.integration.id,
            specialistId,
            Boolean(defaults),
          )
        : null;
    }

    if (!serviceSelection) {
      throw new BadRequestException('service not found');
    }
    if (specialistId && !specialistSelection) {
      throw new BadRequestException('specialist not found');
    }

    return {
      service: serviceSelection.service,
      specialist: specialistSelection?.specialist ?? null,
      serviceYclientsId: serviceSelection.yclientsId,
      specialistYclientsId: specialistSelection?.yclientsId ?? null,
    };
  }

  private async findServiceForBooking(
    integrationId: number,
    serviceId: number,
    preferYclientsId: boolean,
  ) {
    const byYclientsId = preferYclientsId
      ? await this.miniapps.findServiceByYclientsId(integrationId, serviceId)
      : null;
    if (byYclientsId) {
      return {service: byYclientsId, yclientsId: serviceId};
    }

    const byLocalId = await this.miniapps.findService(integrationId, serviceId);
    if (byLocalId) {
      return {
        service: byLocalId,
        yclientsId: byLocalId.yclients_id ?? serviceId,
      };
    }

    const fallbackByYclientsId = preferYclientsId
      ? null
      : await this.miniapps.findServiceByYclientsId(integrationId, serviceId);
    return fallbackByYclientsId
      ? {service: fallbackByYclientsId, yclientsId: serviceId}
      : null;
  }

  private async findSpecialistForBooking(
    integrationId: number,
    specialistId: number,
    preferYclientsId: boolean,
  ) {
    const byYclientsId = preferYclientsId
      ? await this.miniapps.findSpecialistByYclientsId(
          integrationId,
          specialistId,
        )
      : null;
    if (byYclientsId) {
      return {specialist: byYclientsId, yclientsId: specialistId};
    }

    const byLocalId = await this.miniapps.findSpecialist(
      integrationId,
      specialistId,
    );
    if (byLocalId) {
      return {
        specialist: byLocalId,
        yclientsId: byLocalId.yclients_id ?? specialistId,
      };
    }

    const fallbackByYclientsId = preferYclientsId
      ? null
      : await this.miniapps.findSpecialistByYclientsId(
          integrationId,
          specialistId,
        );
    return fallbackByYclientsId
      ? {specialist: fallbackByYclientsId, yclientsId: specialistId}
      : null;
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
