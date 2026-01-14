import {UserSearch} from 'lucide-react';

export const SpecialistPreview = (props: {
  name: string;
  photo: string | null;
  role: string;
}) => {
  return (
    <div className="flex flex-col items-center gap-3 pt-3">
      {props.photo ? (
        <img
          src={props.photo}
          alt={props.name}
          className="h-24 w-24 rounded-ui-l object-cover"
        />
      ) : (
        <div className="w-16 h-16 rounded-ui-m bg-gray-300 flex items-center justify-center">
          <UserSearch className="text-gray-700 w-10 h-10" />
        </div>
      )}
      <div className="flex flex-col text-center">
        <p className="text-xl/[2.3rem] font-bold text-black">{props.name}</p>
        <p className="text-sm text-black/40">{props.role}</p>
      </div>
    </div>
  );
};
