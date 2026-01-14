import {Button} from './ui/button';

type Action = 'refresh' | 'goBack' | 'goHome';

const texts = {
  'not-found': {
    title: '404',
    description: 'Вы попали на страницу, которой нет',
    actions: ['goBack', 'goHome'] as Action[],
  },
  'server-error': {
    title: 'Ой!',
    description: 'Кажется, у нас что-то поломалось',
    actions: ['refresh', 'goBack'] as Action[],
  },
} as const;

export const ErrorView = (props: {
  error?: unknown;
  type?: 'not-found' | 'server-error';
}) => {
  const {type = 'server-error', error} = props;

  return (
    <div className="w-full h-lvh flex flex-col gap-4 justify-center items-center">
      <h1 className="text-4xl font-semibold">{texts[type].title}</h1>
      <p className="font-lg">{texts[type].description}</p>
      {texts[type].actions.includes('goBack') && (
        <Button variant="outline" onClick={() => window.history.back()}>
          Вернуться назад
        </Button>
      )}
      {texts[type].actions.includes('refresh') && (
        <Button variant="outline" onClick={() => window.location.reload()}>
          Перезагрузить страницу
        </Button>
      )}
      {texts[type].actions.includes('goHome') && (
        <Button
          variant="default"
          onClick={() => (window.location.href = '/certiticates')}
        >
          Перейти на главную
        </Button>
      )}
      {!!error && 'message' in (error as Error) && (
        <p className="text-gray-300 mt-10">
          Ошибка 504 {(props.error as Error)?.message}
          <br />
          url: {window.location.href}
        </p>
      )}
    </div>
  );
};
