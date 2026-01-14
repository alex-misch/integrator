import React, {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {toast} from 'react-toastify';
import {
  MiniappCreateDto,
  MiniappDetailDto,
  MiniappUpdateDto,
  useMiniappsAdminControllerCreate,
  useMiniappsAdminControllerUpdate,
} from '@integrator/api-client/admin';

type MiniappFormValues = MiniappCreateDto;

type Props = {
  defaultValues?: MiniappDetailDto;
  onSuccess?: () => void;
  submitDisabled?: boolean;
  submitLabel?: string;
};

export function CreateUpdateMiniappForm({
  defaultValues,
  onSuccess,
  submitDisabled,
  submitLabel,
}: Props) {
  const {mutateAsync: create, isPending: isCreating} =
    useMiniappsAdminControllerCreate();
  const {mutateAsync: update, isPending: isUpdating} =
    useMiniappsAdminControllerUpdate();

  const form = useForm<MiniappFormValues>({
    defaultValues: {
      name: defaultValues?.name || '',
      slug: defaultValues?.slug || '',
      telegram_bot_token: defaultValues?.telegram_bot_token || '',
    },
    reValidateMode: 'onSubmit',
  });

  useEffect(() => {
    return () => form.reset();
  }, []);

  const isSubmitting = isCreating || isUpdating;

  const handleSubmit = async (values: MiniappFormValues) => {
    try {
      if (defaultValues?.id) {
        await update({
          id: defaultValues.id,
          data: values as MiniappUpdateDto,
        });
        toast('Миниапп обновлен', {type: 'success'});
      } else {
        await create({data: values as MiniappCreateDto});
        toast('Миниапп создан', {type: 'success'});
      }
      onSuccess?.();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 w-full"
      >
        <FormField
          control={form.control}
          name="name"
          rules={{maxLength: 255, required: true}}
          render={({field}) => (
            <FormItem>
              <FormLabel>Название</FormLabel>
              <FormControl>
                <Input placeholder="Например, ET.Lazer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          rules={{maxLength: 64, required: true}}
          render={({field}) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="etlazer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="telegram_bot_token"
          rules={{maxLength: 255}}
          render={({field}) => (
            <FormItem>
              <FormLabel>Токен Telegram бота</FormLabel>
              <FormControl>
                <Input placeholder="123456:ABC-DEF" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || submitDisabled}>
            {submitLabel ?? (defaultValues?.id ? 'Сохранить' : 'Создать')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
