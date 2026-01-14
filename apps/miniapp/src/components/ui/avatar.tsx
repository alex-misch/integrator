import {cn} from '@/lib/utils';
import {useCustomerPublicControllerProfile} from '@integrator/api-client/public';

type Props = {
  size?: 'xs' | 'lg';
  active?: boolean;
};

export const Avatar = ({size = 'xs', active}: Props) => {
  const {data: {first_name, last_name, photo_url} = {}} =
    useCustomerPublicControllerProfile();

  const initials = `${first_name?.slice(0, 1)}${last_name?.slice(0, 1)}`;

  return (
    <div
      className={cn('flex justify-center items-center', {
        'w-10 h-8': size === 'xs',
        'w-24 h-24': size === 'lg',
      })}
    >
      <div
        className={cn('border rounded-full p-px', {
          'w-7 h-7': size === 'xs',
          'w-24 h-24': size === 'lg',
          'border-black': active,
        })}
      >
        <div className="relative w-full h-full flex-none flex items-center rounded-full justify-center bg-gray-300">
          {photo_url ? (
            <img
              className="w-full h-full rounded-full object-cover"
              src={photo_url}
              alt={`${first_name} ${last_name}`}
            />
          ) : (
            <p className={cn(size === 'xs' ? 'text-xs' : 'text-3xl', '')}>
              {initials}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
