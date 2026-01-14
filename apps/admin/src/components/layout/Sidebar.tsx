import {useRouter} from 'next/router';
import {menuItems} from './menu-items';
import {useLogout} from '@/hooks/auth';
import Link from 'next/link';
import {Button} from '../ui/button';
import {cn} from '@/lib/utils';

export const LayoutSidebar = () => {
  const {pathname} = useRouter();
  const {mutate: logout} = useLogout();

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-600">
      <div>
        <div className="px-6 py-4 border-b dark:border-gray-600">
          <h1 className="text-xl font-semibold">Integrator Admin</h1>
        </div>
        <div className="h-[calc(100vh-64px)] px-2 py-4 flex justify-between flex-col">
          <nav className="space-y-1">
            {menuItems.map(item => {
              if (!('type' in item)) {
                const {Icon, label, href} = item;
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
                      {
                        'bg-blue-100 dark:bg-gray-700 text-blue-900 dark:text-blue-50 font-bold':
                          isActive,
                        'text-gray-700 dark:text-gray-50 hover:bg-gray-50 dark:hover:bg-gray-800':
                          !isActive,
                      },
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                );
              } else {
                return <hr key="hr" />;
              }
            })}
          </nav>
          <Button onClick={() => logout()} className="w-full">
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
};
