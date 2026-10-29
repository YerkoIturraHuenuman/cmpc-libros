'use client';

import { AuthLayout } from '../../_components/AuthLayout';
import { LoginForm } from './_components/LoginForm';
import { useLogin } from './_hooks/useLogin';

export default function LoginPage() {
  const login = useLogin();

  return (
    <AuthLayout
      title="Bienvenido"
      description="Ingresa con tu cuenta para gestionar el inventario"
    >
      <LoginForm {...login} />
    </AuthLayout>
  );
}
