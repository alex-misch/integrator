import {Layout} from '@/components/layout';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {useRouter} from 'next/router';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {useMiniappsAdminControllerList} from '@integrator/api-client/admin';
import React from 'react';

const getIntegrationLink = (slug: string, company_id: number) => {
  return `${process.env.NEXT_PUBLIC_MINIAPP_BASEURL}/#/${slug}/${company_id}`;
};

export default function MiniappsListPage() {
  const router = useRouter();
  const {data: items = []} = useMiniappsAdminControllerList();

  return (
    <Layout>
      <div className="h-full relative">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold mb-4">TG Miniapps</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/miniapps/add">Добавить miniapp</Link>
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Линк</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Фото</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/miniapps/${item.id}`)}
                >
                  <TableCell>{item.id}</TableCell>
                  <TableCell>
                    {item.integrations.map(integration => (
                      <React.Fragment key={integration.company_id}>
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={getIntegrationLink(
                            item.slug || '',
                            integration.company_id || NaN,
                          )}
                          className="text-blue-600 underline hover:no-underline"
                        >
                          {integration.address_text}
                        </a>
                        <br />
                      </React.Fragment>
                    ))}
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.slug || '-'}</TableCell>
                  <TableCell>
                    {item.photos?.[0]?.url ? (
                      <img
                        src={item.photos[0].url}
                        alt={item.name}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-gray-200" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm">
                    Нет миниаппов
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
