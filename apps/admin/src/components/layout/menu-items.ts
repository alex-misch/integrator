import {
  ChartPie,
  LucideIcon,
  PhoneForwardedIcon,
  ShieldUser,
} from 'lucide-react';

export const menuItems: (
  | {label: string; href: string; Icon: LucideIcon}
  | {type: 'separator'}
)[] = [
  {label: 'Dashboard', href: '/dashboard', Icon: ChartPie},
  {label: 'TG Miniapps', href: '/miniapps', Icon: PhoneForwardedIcon},
  {type: 'separator'},
  {label: 'Администраторы', href: '/managers', Icon: ShieldUser},
];
