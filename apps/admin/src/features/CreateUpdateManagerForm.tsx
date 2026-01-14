import React, {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {useRouter} from 'next/router';
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {
  CreateUserDto,
  useManagersAdminControllerCreate,
  useManagersAdminControllerUpdate,
  UserResponse,
} from '@outreach/api-client/admin';
import {Loader2} from 'lucide-react';
import {toast} from 'react-toastify';
import {Checkbox} from '@/components/ui/checkbox';

export function CreateUpdateManagerForm({
  defaultValues,
}: {
  defaultValues?: Partial<UserResponse>;
}) {
  const router = useRouter();
  const onSuccess = () => {
    router.push('/managers');
    toast('Элемент успешно ' + (defaultValues ? 'отредактирован' : 'создан'), {
      type: 'success',
    });
  };

  const isEdit = !!defaultValues;
  const {mutate: update, isPending: isUpdating} =
    useManagersAdminControllerUpdate();
  const {mutate: create, isPending: isCreating} =
    useManagersAdminControllerCreate();

  const form = useForm<CreateUserDto>({
    defaultValues: {
      is_active: defaultValues?.is_active ?? true,
      name: defaultValues?.name ?? '',
      login: defaultValues?.login ?? '',
      email: defaultValues?.email ?? null,
      password: undefined,
    },
  });

  useEffect(() => {
    return () => form.reset();
  }, []);

  const onSubmit = async (values: CreateUserDto) => {
    if (defaultValues?.id) {
      await update({id: defaultValues.id, data: {...values}}, {onSuccess});
    } else {
      await create({data: values}, {onSuccess});
    }
  };

  return (
    <div className="px-6 py-4 bg-white dark:bg-black rounded-md shadow">
      <h1 className="text-2xl font-semibold mb-6">
        {defaultValues ? 'Изменить администратора' : 'Добавить администратора'}
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="is_active"
            render={({field}) => (
              <FormItem className="flex">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={val => field.onChange(val)}
                  />
                </FormControl>
                <FormLabel>Активен</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            rules={{required: {value: true, message: 'Необходимо заполнить'}}}
            name="name"
            render={({field}) => (
              <FormItem>
                <FormLabel>Имя</FormLabel>
                <FormControl>
                  <Input placeholder="Введите имя" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            rules={{required: {value: true, message: 'Необходимо заполнить'}}}
            name="login"
            render={({field}) => (
              <FormItem>
                <FormLabel>Логин</FormLabel>
                <FormControl>
                  <Input placeholder="mylogin" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            rules={{
              required: {value: !isEdit, message: 'Необходимо заполнить'},
            }}
            name="password"
            render={({field}) => (
              <FormItem>
                <FormLabel>Пароль</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Контакты продавца */}
          <FormField
            control={form.control}
            name="email"
            render={({field}) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder=""
                    value={field.value || ''}
                    onChange={ev => field.onChange(ev.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isUpdating || isCreating}>
              {isUpdating || isCreating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Сохранить'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Отмена
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
