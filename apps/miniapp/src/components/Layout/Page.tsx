import {useNavigate} from 'react-router-dom';
import {backButton} from '@telegram-apps/sdk-react';
import React, {FunctionComponent, PropsWithChildren, useEffect} from 'react';
import clsx from 'clsx';
import {useIsMobile} from '@/hooks/useIsMobile';

type PageProps = React.HTMLAttributes<HTMLDivElement> &
  PropsWithChildren<{
    /**
     * True if it is allowed to go back from this page.
     */
    back?: boolean;
    className?: string;
  }>;

interface PageComponent {
  (props: PageProps): React.ReactNode;

  Content: FunctionComponent<
    React.HTMLAttributes<HTMLDivElement> & {fit?: boolean}
  >;

  Title: FunctionComponent<React.HTMLAttributes<HTMLDivElement>>;
}

const hasPreviousRoute = () => {
  const historyState = window.history?.state as {idx?: number} | null;
  const hasPreviousRoute =
    (historyState && typeof historyState.idx === 'number'
      ? historyState.idx > 0
      : false) || window.history.length > 1;

  return hasPreviousRoute;
};

const Page: PageComponent = ({children, className, style, back = false}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (back) {
      if (hasPreviousRoute()) {
        backButton.show();
        return backButton.onClick(() => {
          navigate(-1);
        });
      }
    }
    backButton.hide();
  }, [back, navigate]);

  const isMobile = useIsMobile();

  return (
    <>
      <div
        className={clsx(
          'pt-2 bg-black text-black flex flex-col bg-repeat bg-1/8 overflow-hidden min-w-[360px]',
          className,
        )}
        style={{
          minHeight: 'calc(100dvh + 1px)',
          paddingTop: isMobile ? '4rem' : '1rem',
          ...style,
        }}
      >
        {children}
      </div>
    </>
  );
};

Page.Title = ({children, className, ...props}) => {
  const isMobile = useIsMobile();
  return (
    <div
      {...props}
      className={clsx(
        className,
        'mx-4 pb-2 text-left text-white text-[36px]/[44px] font-semibold',
        isMobile ? 'pt-24' : 'pt-5',
      )}
    >
      {children}
    </div>
  );
};

Page.Title.displayName = 'PageTitle';

Page.Content = ({className, fit, ...props}) => {
  const isMobile = useIsMobile();
  return (
    <div
      {...props}
      className={clsx(
        'bg-white relative rounded-t-[32px] pb-32 min-h-full',
        !fit && 'px-4',
        isMobile ? 'pt-24' : 'pt-5',

        className,
      )}
    />
  );
};

Page.Content.displayName = 'PageContent';

export {Page};
