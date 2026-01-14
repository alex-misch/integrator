import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  BadRequestException,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import {ApiOkResponse, ApiOperation, ApiTags} from '@nestjs/swagger';
import {UseAdminGuard} from '../../../decorators/UseAdminGuard';
import {MiniappService} from '../../../modules/miniapp/miniapp.service';
import {MiniappListItemDto} from './dto/miniapp-list.dto';
import {MiniappDetailDto} from './dto/miniapp-detail.dto';
import {MiniappYclientsCreateDto} from './dto/miniapp-yclients.dto';
import {MiniappYclientsPreviewDto} from './dto/miniapp-yclients-preview.dto';
import {MiniappCreateDto} from './dto/miniapp-create.dto';
import {MiniappUpdateDto} from './dto/miniapp-update.dto';
import {YclientsClient} from 'src/modules/integrations/yclients/yclients.service';
import {MiniappSpecialist} from 'src/modules/miniapp/miniapp-specialist.entity';

@ApiTags('admin-miniapps')
@Controller('admin/miniapps')
@UseAdminGuard()
export class MiniappsAdminController {
  constructor(
    private readonly miniappService: MiniappService,
    private readonly yclients: YclientsClient,
  ) {}

  @Get('list')
  @ApiOperation({summary: 'Miniapps list'})
  @ApiOkResponse({type: MiniappListItemDto, isArray: true})
  async list(): Promise<MiniappListItemDto[]> {
    const miniapps = await this.miniappService.findAll();
    return miniapps.map(({id, name, slug, photos, ...rest}) => ({
      id,
      name,
      slug,
      photos,
      integrations: rest.yclientsIntegrations.map(i => ({
        company_id: i.company_id,
        address_text: i.address_text || i.city,
      })),
    }));
  }

  @Post()
  @ApiOperation({summary: 'Create miniapp'})
  async create(@Body() payload: MiniappCreateDto) {
    return this.miniappService.create(payload);
  }

  @Get(':id')
  @ApiOperation({summary: 'Miniapp detail'})
  @ApiOkResponse({type: MiniappDetailDto})
  async byId(@Param('id') id: number): Promise<MiniappDetailDto> {
    const miniapp = await this.miniappService.findOne(id);
    if (!miniapp) {
      throw new NotFoundException(`Miniapp with ID ${id} not found`);
    }
    return miniapp;
  }

  @Post(':id')
  @ApiOperation({summary: 'Update miniapp'})
  async update(@Param('id') id: number, @Body() payload: MiniappUpdateDto) {
    const miniapp = await this.miniappService.update(id, payload);
    if (!miniapp) {
      throw new NotFoundException(`Miniapp with ID ${id} not found`);
    }
    return miniapp;
  }

  @Get(':id/yclients')
  @ApiOperation({summary: 'Miniapp Yclients integrations'})
  async listIntegrations(@Param('id') id: number) {
    return this.miniappService.findIntegrations(id);
  }

  @Post(':id/yclients-preview')
  @ApiOperation({summary: 'Preview miniapp Yclients integration'})
  @ApiOkResponse({type: MiniappYclientsPreviewDto})
  async previewIntegration(
    @Param('id') _id: number,
    @Body() payload: MiniappYclientsCreateDto,
  ): Promise<MiniappYclientsPreviewDto> {
    if (!payload.company_id) {
      throw new BadRequestException('company_id is required');
    }

    // try {
    //   await this.yclients.recordsByClient({
    //     companyId: payload.company_id,
    //   });
    // } catch (err) {
    //   if (err instanceof UnauthorizedException) {
    //     throw new BadRequestException(
    //       `Ошибка: недостаточно прав. Установите дополнение yclients https://yclients.com/appstore/${payload.company_id}/applications/36041/info`,
    //     );
    //   } else {
    //     throw err;
    //   }
    // }

    const company = await this.yclients.company(payload.company_id);
    const phoneFromList = Array.isArray(company.phones)
      ? company.phones[0]
      : null;

    return {
      integration: {
        company_id: payload.company_id,
        city: company.city || company.title || 'Unknown',
        country: company.country ?? null,
        address_text: company.address ?? null,
        lat: company.coordinate_lat ?? null,
        lng: company.coordinate_lon ?? null,
        phone: company.phone || phoneFromList,
        email: company.email ?? null,
        telegram: company.social?.telegram ?? null,
        whatsapp: company.social?.whatsapp ?? null,
        website: company.site ?? null,
        timezone: company.timezone ?? null,
        timezone_name: company.timezone_name ?? null,
      },
      company: {
        logo_url: company.logo ?? null,
        title: company.title ?? null,
        public_title: company.public_title ?? null,
        short_descr: company.short_descr ?? null,
        description: company.description ?? null,
      },
    };
  }

  @Post(':id/yclients')
  @ApiOperation({summary: 'Create miniapp Yclients integration'})
  async createIntegration(
    @Param('id') id: number,
    @Body() payload: MiniappYclientsCreateDto,
  ) {
    if (!payload.company_id) {
      throw new BadRequestException('company_id is required');
    }

    // try {
    //   await this.yclients.recordsByClient({
    //     companyId: payload.company_id,
    //   });
    // } catch (err) {
    //   if (err instanceof UnauthorizedException) {
    //     throw new BadRequestException(
    //       `Ошибка: недостаточно прав. Установите дополнение yclients https://yclients.com/appstore/${payload.company_id}/applications/36041/info`,
    //     );
    //   } else {
    //     throw new BadRequestException(err.message);
    //   }
    // }

    const integration = await this.ensureIntegration({
      miniappId: id,
      companyId: payload.company_id,
    });

    await this.syncIntegrationData({
      miniappId: id,
      integration,
    });
    return integration;
  }

  @Delete(':id/yclients/:integrationId')
  @ApiOperation({summary: 'Delete miniapp Yclients integration'})
  async deleteIntegration(
    @Param('id') id: number,
    @Param('integrationId') integrationId: number,
  ) {
    const integration = await this.miniappService.deleteIntegration(
      id,
      integrationId,
    );
    if (!integration) {
      throw new NotFoundException(
        `Integration ${integrationId} for miniapp ${id} not found`,
      );
    }
    return {success: true};
  }

  @Patch(':id/yclients/:integrationId/primary')
  @ApiOperation({summary: 'Set miniapp primary Yclients integration'})
  async setPrimaryIntegration(
    @Param('id') id: number,
    @Param('integrationId') integrationId: number,
  ) {
    const integration = await this.miniappService.setPrimaryIntegration(
      id,
      integrationId,
    );
    if (!integration) {
      throw new NotFoundException(
        `Integration ${integrationId} for miniapp ${id} not found`,
      );
    }
    return integration;
  }

  @Post(':id/yclients/:integrationId/refresh')
  @ApiOperation({summary: 'Refresh miniapp Yclients integration'})
  async refreshIntegration(
    @Param('id') id: number,
    @Param('integrationId') integrationId: number,
  ) {
    const integration = await this.miniappService.findIntegration(
      id,
      integrationId,
    );
    if (!integration) {
      throw new NotFoundException(
        `Integration ${integrationId} for miniapp ${id} not found`,
      );
    }
    await this.syncIntegrationData({
      miniappId: id,
      integration,
    });
    return {success: true};
  }

  private async ensureIntegration(params: {
    miniappId: number;
    companyId: number | null;
  }) {
    const {miniappId, companyId} = params;
    if (!companyId) {
      throw new BadRequestException('company_id is required');
    }

    const existingIntegrations =
      await this.miniappService.findIntegrations(miniappId);
    const hasPrimary = existingIntegrations.some(
      integrationItem => integrationItem.is_primary,
    );
    const existing = existingIntegrations.find(
      integrationItem => integrationItem.company_id === companyId,
    );
    if (existing) {
      if (!hasPrimary) {
        await this.miniappService.setPrimaryIntegration(miniappId, existing.id);
        existing.is_primary = true;
      }
      return existing;
    }

    const isPrimary = existingIntegrations.length === 0 || !hasPrimary;

    const integration = await this.miniappService.upsertIntegration(
      miniappId,
      companyId,
      {is_primary: isPrimary},
    );
    if (!integration) {
      throw new NotFoundException(`Miniapp with ID ${miniappId} not found`);
    }
    return integration;
  }

  private async syncIntegrationData(params: {
    miniappId: number;
    integration: {id: number; company_id: number | null; is_primary: boolean};
  }) {
    const {miniappId, integration} = params;
    if (!integration.company_id) {
      throw new BadRequestException('company_id is required');
    }

    const company = await this.yclients.company(integration.company_id);
    const phoneFromList = Array.isArray(company.phones)
      ? company.phones[0]
      : null;

    await this.miniappService.updateIntegration(miniappId, integration.id, {
      city: company.city || company.title || 'Unknown',
      country: company.country ?? null,
      address_text: company.address ?? null,
      lat: company.coordinate_lat ?? null,
      lng: company.coordinate_lon ?? null,
      phone: company.phone || phoneFromList,
      email: company.email ?? null,
      telegram: company.social?.telegram ?? null,
      whatsapp: company.social?.whatsapp ?? null,
      website: company.site ?? null,
      timezone: company.timezone ?? null,
      timezone_name: company.timezone_name ?? null,
    });

    if (integration.is_primary) {
      await this.miniappService.updateCompanyInfo(miniappId, {
        title: company.title ?? null,
        public_title: company.public_title ?? null,
        short_descr: company.short_descr ?? null,
        description: company.description ?? null,
        logo_url: company.logo ?? null,
      });
    }

    const staff = await this.yclients.bookStaff(integration.company_id);
    const specialists = staff.map(member => ({
      name: member.name,
      yclients_id: Number(member.id) || null,
      role: member.specialization || null,
      photo_url: member.avatar || null,
      is_active: true,
    }));
    const savedSpecialists = await this.miniappService.upsertSpecialists(
      miniappId,
      integration.id,
      specialists,
    );
    const specialistsByYclientsId = new Map<number, MiniappSpecialist>();
    savedSpecialists?.forEach(specialist => {
      if (specialist.yclients_id) {
        specialistsByYclientsId.set(specialist.yclients_id, specialist);
      }
    });

    const servicesData = await this.yclients.bookServices(
      integration.company_id,
    );
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
        is_active: true,
      };
    });

    await this.miniappService.upsertServices(
      miniappId,
      integration.id,
      services,
      specialistsByYclientsId,
    );
  }
}
