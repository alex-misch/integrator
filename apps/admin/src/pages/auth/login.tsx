import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {Loader2} from 'lucide-react';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {useForm} from 'react-hook-form';
import {
  useAdminAuthControllerLogin,
  type LoginUserDto,
} from '@integrator/api-client/admin';

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<LoginUserDto>({
    defaultValues: {
      login: '',
      password: '',
    },
  });

  const {mutate, isPending} = useAdminAuthControllerLogin({
    mutation: {
      onSuccess: () => window.location.reload(),
    },
  });

  return (
    <div className="flex items-center justify-center min-h-screen  bg-blue-50">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">integrator Admin</CardTitle>
          <CardDescription>Войти в аккаунт</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(data => {
              mutate({data});
            })}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="email" className="block mb-1">
                Логин
              </Label>
              <Input
                id="login"
                type="text"
                placeholder="mylogin"
                {...register('login', {
                  required: 'Логин обязателен',
                })}
              />
              {errors.login && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.login.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="password" className="block mb-1">
                Пароль
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password', {
                  required: 'Пароль обязателен',
                  minLength: {
                    value: 4,
                    message: 'Минимум 4 символа',
                  },
                })}
              />
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Войти'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
