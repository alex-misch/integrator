import {Layout} from '@/components/layout';
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {cn} from '@/lib/utils';
import {dashboardAdminControllerListCounters} from '@integrator/api-client/admin';
import {useQuery} from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CalendarDays,
  CreditCard,
  MousePointer2,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';

type Period = '7d' | '30d' | '3m';

type DashboardData = {
  project: {slug: string; name: string};
  period: Period;
  range: {from: string; to: string};
  totals: {
    unique_customers: number;
    referral_shares: number;
    referral_opens_total: number;
    referral_bookings_total: number;
    miniapp_bookings_total: number;
    miniapp_bookings_completed: number;
    miniapp_bookings_canceled: number;
    referral_payments_amount: number;
  };
  series: Array<{
    date: string;
    visits: number;
    referral_opens: number;
    referral_bookings: number;
    referral_payments: number;
  }>;
  payment_services: Array<{
    id: number;
    service_title: string | null;
    amount: number | null;
    date_created: string;
  }>;
};

const periods: Array<{value: Period; label: string}> = [
  {value: '7d', label: '7 дней'},
  {value: '30d', label: '30 дней'},
  {value: '3m', label: '3 месяца'},
];

const ruble = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat('ru-RU');

async function fetchDashboard(period: Period) {
  return dashboardAdminControllerListCounters({
    period,
  }) as Promise<DashboardData>;
}

export default function DashboardPage() {
  const [period, setPeriod] = React.useState<Period>('7d');
  const {data, isLoading, error} = useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => fetchDashboard(period),
  });

  const series = data?.series ?? [];
  const filteredVisits = sumSeries(series, 'visits');
  const filteredReferrals = series.reduce(
    (sum, item) => sum + item.referral_opens,
    0,
  );
  const filteredBookings = series.reduce(
    (sum, item) => sum + item.referral_bookings,
    0,
  );

  return (
    <Layout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {data?.project.name ?? 'ET Laser'}
            </p>
            <h1 className="text-3xl font-semibold tracking-normal">
              Дашборд аналитики
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Визиты, рефералы, записи и оплаты из мини-приложения.
            </p>
          </div>

          <div className="flex w-full rounded-lg border bg-card p-1 md:w-auto">
            {periods.map(item => (
              <Button
                key={item.value}
                type="button"
                variant={period === item.value ? 'default' : 'ghost'}
                className="h-9 flex-1 rounded-md px-3 md:flex-none"
                onClick={() => setPeriod(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {error ? (
          <Card className="rounded-lg border-red-200 bg-red-50 text-red-900">
            <CardContent className="pt-4">
              {(error as Error).message}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Уникальные клиенты"
            value={formatCount(data?.totals.unique_customers)}
            description="Все время"
            icon={Users}
            tone="sky"
            isLoading={isLoading}
          />
          <MetricCard
            title="Посещения"
            value={formatCount(filteredVisits)}
            description="Сколько раз открыли miniapp"
            icon={MousePointer2}
            tone="violet"
            isLoading={isLoading}
          />
          <MetricCard
            title="Поделились"
            value={formatCount(data?.totals.referral_shares)}
            description="Все время"
            icon={Share2}
            tone="amber"
            isLoading={isLoading}
          />
          <MetricCard
            title="Рефералы"
            value={formatCount(filteredReferrals)}
            description={`${formatCount(data?.totals.referral_opens_total)} за все время`}
            icon={Sparkles}
            tone="teal"
            isLoading={isLoading}
          />
          <MetricCard
            title="Записались"
            value={formatCount(data?.totals.miniapp_bookings_total)}
            description={`Дошли: ${formatCount(data?.totals.miniapp_bookings_completed)} · Отменили: ${formatCount(data?.totals.miniapp_bookings_canceled)}`}
            icon={CalendarDays}
            tone="rose"
            isLoading={isLoading}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-baseline justify-between gap-3">
                <span>Посещения по дням</span>
                <span className="text-2xl font-semibold">
                  {formatCount(filteredVisits)}
                </span>
              </CardTitle>
              <CardDescription>
                Клиент попадает сюда после успешной верификации в miniapp.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="visits" x1="0" x2="0" y1="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#2563eb"
                        stopOpacity={0.28}
                      />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDay}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    labelFormatter={value => formatDate(String(value))}
                    formatter={value => [
                      number.format(Number(value)),
                      'Визиты',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="#2563eb"
                    fill="url(#visits)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-baseline justify-between gap-3">
                <span>Реферальная воронка</span>
                <span className="text-2xl font-semibold">
                  {formatCount(filteredReferrals)} /{' '}
                  {formatCount(filteredBookings)}
                </span>
              </CardTitle>
              <CardDescription>
                Переходы по ссылке / подтвержденные записи.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDay}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    labelFormatter={value => formatDate(String(value))}
                    formatter={(value, name) => [
                      number.format(Number(value)),
                      name === 'referral_opens' ? 'Рефералы' : 'Записи',
                    ]}
                  />
                  <Bar
                    dataKey="referral_opens"
                    fill="#14b8a6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="referral_bookings"
                    fill="#f97316"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  Оплаты рефералов
                </span>
                <span className="ml-auto text-2xl font-semibold">
                  {ruble.format(data?.totals.referral_payments_amount ?? 0)}
                </span>
              </CardTitle>
              <CardDescription>
                {ruble.format(data?.totals.referral_payments_amount ?? 0)} за
                выбранный период.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="payments" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDay}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tickFormatter={value => `${Number(value) / 1000}к`} />
                  <Tooltip
                    labelFormatter={value => formatDate(String(value))}
                    formatter={value => [ruble.format(Number(value)), 'Оплаты']}
                  />
                  <Area
                    type="monotone"
                    dataKey="referral_payments"
                    stroke="#16a34a"
                    fill="url(#payments)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Услуги и суммы</CardTitle>
              <CardDescription>
                Последние отфильтрованные оплаты от рефералов.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Услуга</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.payment_services ?? []).map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-64 truncate font-medium">
                        {item.service_title || 'Услуга из YClients'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(item.date_created)}
                      </TableCell>
                      <TableCell className="text-right">
                        {ruble.format(item.amount ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && !data?.payment_services.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Оплат за период нет
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
  isLoading,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{className?: string}>;
  tone: keyof typeof metricTones;
  isLoading: boolean;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('rounded-md border p-2', metricTones[tone].bg)}>
          <Icon className={cn('h-4 w-4', metricTones[tone].icon)} />
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'text-2xl font-semibold',
            isLoading &&
              'h-8 w-24 animate-pulse rounded-md bg-muted text-muted',
          )}
        >
          {isLoading ? '' : value}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

const metricTones = {
  sky: {
    bg: 'border-sky-200 bg-sky-100',
    icon: 'text-sky-700',
  },
  violet: {
    bg: 'border-violet-200 bg-violet-100',
    icon: 'text-violet-700',
  },
  amber: {
    bg: 'border-amber-200 bg-amber-100',
    icon: 'text-amber-700',
  },
  teal: {
    bg: 'border-teal-200 bg-teal-100',
    icon: 'text-teal-700',
  },
  rose: {
    bg: 'border-rose-200 bg-rose-100',
    icon: 'text-rose-700',
  },
};

function sumSeries(
  series: DashboardData['series'],
  key: keyof DashboardData['series'][number],
) {
  return series.reduce((sum, item) => sum + Number(item[key] ?? 0), 0);
}

function formatCount(value?: number) {
  return number.format(value ?? 0);
}

function formatDay(value: string) {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
