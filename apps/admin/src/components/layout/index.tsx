import React from 'react';
import {LayoutSidebar} from './Sidebar';
import {Sheet, SheetContent, SheetTrigger} from '../ui/sheet';
import {Button} from '../ui/button';
import {MenuIcon} from 'lucide-react';

export function Layout({children}: {children: React.ReactNode}) {
  return (
    <div className="flex dark:bg-gray-800 bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 sticky top-0 h-full">
        <LayoutSidebar />
      </aside>

      {/* Мобильный бургер */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="shadow-lg">
              <MenuIcon className="h-6 w-6" /> Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <LayoutSidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 pt-12 md:p-6 mt-4 w-[calc(100%-20em)]">
        {children}
      </main>
    </div>
  );
}
