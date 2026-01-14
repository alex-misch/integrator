import {Page} from '@/components/Layout/Page.tsx';

export function IndexPage() {
  return (
    <Page back={false}>
      <Page.Title />
      <Page.Content>
        <div className="flex gap-4"></div>
      </Page.Content>
    </Page>
  );
}
