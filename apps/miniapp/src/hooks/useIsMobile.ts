import { useLaunchParams } from '@telegram-apps/sdk-react';

export const useIsMobile = () => {
  const { platform } = useLaunchParams();
  return platform.includes('ios') || platform.includes('android');
};
