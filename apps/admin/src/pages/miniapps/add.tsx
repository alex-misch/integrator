import {Layout} from '@/components/layout';
import {CreateUpdateMiniappForm} from '@/features/CreateUpdateMiniappForm';
import {useRouter} from 'next/router';
import {useState} from 'react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {toast} from 'react-toastify';
import {
  MiniappYclientsCreateDto,
  MiniappYclientsPreviewDto,
  useMiniappsAdminControllerPreviewIntegration,
} from '@integrator/api-client/admin';

export default function MiniappAddPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string>('');
  const [preview, setPreview] = useState<MiniappYclientsPreviewDto | null>(
    null,
  );
  const {mutateAsync: previewIntegration, isPending: isPreviewPending} =
    useMiniappsAdminControllerPreviewIntegration();

  const handlePreview = async () => {
    const id = Number(companyId);
    if (!id) {
      toast('Введите Company ID', {type: 'error'});
      return;
    }
    try {
      const data = await previewIntegration({
        id: 0,
        data: {company_id: id} as MiniappYclientsCreateDto,
      });
      setPreview(data);
    } catch (err) {
      setPreview(null);
    }
  };

  const previewCompany = preview?.company;
  const previewIntegrationData = preview?.integration;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Карточка магазина</h2>
          <div className="mt-4 rounded-md border p-4">
            <div className="flex gap-4">
              {previewCompany?.logo_url ? (
                <img
                  src={previewCompany.logo_url}
                  alt={previewCompany.title || 'logo'}
                  className="h-16 w-16 rounded-md object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  LOGO
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground">Название</div>
                  <div className="text-sm font-medium">
                    {previewCompany?.title || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Публичное название
                  </div>
                  <div className="text-sm">
                    {previewCompany?.public_title || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Описание
                  </div>
                  <div className="text-sm">
                    {previewCompany?.short_descr ||
                      previewCompany?.description ||
                      '—'}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Адрес</div>
                <div>{previewIntegrationData?.address_text || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Телефон</div>
                <div>{previewIntegrationData?.phone || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Telegram</div>
                <div>{previewIntegrationData?.telegram || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">WhatsApp</div>
                <div>{previewIntegrationData?.whatsapp || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Сайт</div>
                <div>{previewIntegrationData?.website || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Часовой пояс</div>
                <div>{previewIntegrationData?.timezone_name || '—'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border p-4">
          <div className="text-base font-medium">Подгрузить из Yclients</div>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Company ID</div>
              <Input
                placeholder="Например, 1714663"
                type="number"
                value={companyId}
                onChange={event => setCompanyId(event.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={handlePreview}
              disabled={isPreviewPending}
            >
              Проверить
            </Button>
          </div>
        </div>

        <CreateUpdateMiniappForm
          submitDisabled={!preview}
          onSuccess={() => router.push('/miniapps')}
        />
      </div>
    </Layout>
  );
}
