import {Loader2} from 'lucide-react';

export const LoaderFullscreen = () => {
  return (
    <div className="flex justify-center items-center h-lvh w-full">
      <Loader2 size={40} className="animate-spin" />
    </div>
  );
};
