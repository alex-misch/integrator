import {Layout} from '@/components/layout';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {useForm} from 'react-hook-form';
import {useRouter} from 'next/router';
import {
  MiniappDetailDto,
  MiniappYclientsCreateDto,
  useMiniappsAdminControllerById,
  useMiniappsAdminControllerCreateIntegration,
  useMiniappsAdminControllerDeleteIntegration,
  useMiniappsAdminControllerRefreshIntegration,
} from '@integrator/api-client/admin';
import {CreateUpdateMiniappForm} from '@/features/CreateUpdateMiniappForm';

export default function MiniappDetailPage() {
  const {query} = useRouter();
  const id = Number(query.id);
  const {data: miniapp, refetch} =
    useMiniappsAdminControllerById<MiniappDetailDto>(id, {
      query: {enabled: !!id},
    });

  const integrationForm = useForm<MiniappYclientsCreateDto>({});

  const createIntegration = useMiniappsAdminControllerCreateIntegration({
    mutation: {
      onSuccess: () => {
        refetch();
        integrationForm.reset();
      },
    },
  });
  const deleteIntegration = useMiniappsAdminControllerDeleteIntegration({
    mutation: {
      onSuccess: () => {
        refetch();
      },
    },
  });
  const refreshIntegration = useMiniappsAdminControllerRefreshIntegration({
    mutation: {
      onSuccess: () => {
        refetch();
      },
    },
  });
  const [companyId] = integrationForm.watch(['company_id']);
  const canCreateIntegration = !!companyId;

  return (
    <Layout>
      {!miniapp && <div className="text-sm">Загрузка...</div>}
      {miniapp && (
        <div className="space-y-8">
          <div>
            <CreateUpdateMiniappForm
              defaultValues={miniapp}
              onSuccess={() => refetch()}
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold">Интеграции Yclients</h2>
            <div className="mt-4 space-y-4">
              {miniapp.yclientsIntegrations?.map(integration => (
                <div key={integration.id} className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Company #{integration.company_id}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700 border-transparent">
                        Активная
                      </Badge>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          refreshIntegration.mutate({
                            id,
                            integrationId: integration.id,
                          })
                        }
                      >
                        Обновить
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          deleteIntegration.mutate({
                            id,
                            integrationId: integration.id,
                          })
                        }
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Данные интеграции
                      </div>
                      <div className="mt-2 space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Локация:
                          </span>{' '}
                          {integration.city || '-'},{' '}
                          {integration.country || '-'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Адрес:</span>{' '}
                          {integration.address_text || '-'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Коорд.:</span>{' '}
                          {integration.lat && integration.lng
                            ? `${integration.lat}, ${integration.lng}`
                            : '-'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Телефон:
                          </span>{' '}
                          {integration.phone || '-'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>{' '}
                          {integration.email || '-'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Telegram:
                          </span>{' '}
                          {integration.telegram || '-'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Whatsapp:
                          </span>{' '}
                          {integration.whatsapp || '-'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Сайт:</span>{' '}
                          {integration.website || '-'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Часовой пояс:
                          </span>{' '}
                          {integration.timezone_name || '-'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Услуги
                      </div>
                      <ul className="mt-2 space-y-1 text-sm">
                        {miniapp.services?.length ? (
                          miniapp.services.map(service => (
                            <li key={service.id}>{service.title}</li>
                          ))
                        ) : (
                          <li className="text-muted-foreground">Нет услуг</li>
                        )}
                      </ul>
                      <div className="text-sm text-muted-foreground mt-8">
                        Специалисты
                      </div>
                      <ul className="mt-2 space-y-1 text-sm">
                        {miniapp.specialists?.length ? (
                          miniapp.specialists.map(specialist => (
                            <li key={specialist.id}>{specialist.name}</li>
                          ))
                        ) : (
                          <li className="text-muted-foreground">
                            Нет специалистов
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
              {!miniapp.yclientsIntegrations?.length && (
                <div className="text-sm text-muted-foreground">
                  Нет интеграций
                </div>
              )}
            </div>

            <div className="mt-6 rounded-md border p-4">
              <form
                onSubmit={integrationForm.handleSubmit(values => {
                  if (!id) return;
                  createIntegration.mutate({id, data: values});
                })}
              >
                <div className="text-base font-medium">Добавить интеграцию</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Company ID"
                    type="number"
                    {...integrationForm.register('company_id', {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <Button
                  type="submit"
                  className="mt-4"
                  disabled={
                    createIntegration.isPending || !canCreateIntegration
                  }
                >
                  Добавить
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
