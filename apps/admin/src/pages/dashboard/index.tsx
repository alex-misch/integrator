import {Layout} from '@/components/layout';

export default function DashboardPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex gap-4 flex-row items-center justify-start">
          <h2 className="text-xl font-semibold">Поиск по клиентам</h2>
        </div>
      </div>
    </Layout>
  );
}
