import {Page} from '@/components/Layout/Page.tsx';
import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

export function IndexPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/atlazer/122686', {replace: true});
  }, [navigate]);

  return (
    <Page back={false}>
      <Page.Title />
      <Page.Content>
        <div className="flex gap-4"></div>
      </Page.Content>
    </Page>
  );
}
