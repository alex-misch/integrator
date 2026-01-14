import {Layout} from '@/components/layout';
import {CreateUpdateManagerForm} from '@/features/CreateUpdateManagerForm';
import {useManagersAdminControllerById} from '@integrator/api-client/admin';
import {useRouter} from 'next/router';

export default function UpdateBusinessPage() {
  const {query} = useRouter();
  const id = Number(query.id);
  const {data: business} = useManagersAdminControllerById(id, {
    query: {enabled: !!id},
  });

  return (
    <Layout>
      {business && <CreateUpdateManagerForm defaultValues={business} />}
    </Layout>
  );
}
