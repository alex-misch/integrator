import React from 'react';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {Button} from '@/components/ui/button';
import {Layout} from '@/components/layout';
import {PlusIcon} from 'lucide-react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {Badge} from '@/components/ui/badge';
import {
  useManagersAdminControllerList,
  UserResponse,
} from '@integrator/api-client/admin';

export default function AdminsList() {
  const router = useRouter();
  const {data: items = []} =
    useManagersAdminControllerList<UserResponse[]>();

  return (
    <Layout>
      {/* Заголовок таблицы */}
      <div className="h-full relative">
        <div className="flex flex-col h-full">
          <div className="flex">
            <h2 className="text-xl font-semibold mb-4">Админинстраторы</h2>
            <Button variant="outline" className="ml-6" size="sm" asChild>
              <Link href="/managers/add">
                {' '}
                <PlusIcon /> Добавить администратора
              </Link>
            </Button>
          </div>
          {/* Таблица */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Логин</TableHead>
                <TableHead>Почта</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((item: UserResponse) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/managers/${item.id}`)}
                >
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.login}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      className={
                        item.is_active
                          ? 'bg-green-300 text-black'
                          : 'bg-red-300'
                      }
                    >
                      {item.is_active ? 'Активен' : 'Отключён'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
