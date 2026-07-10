import { AuthForm } from "@/components/auth-form";
import { authenticate } from "../actions";

export const metadata = { title: "Iniciar sesión — giftlist" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return (
    <AuthForm
      title="Iniciar sesión"
      action={authenticate}
      fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        {
          name: "password",
          label: "Contraseña",
          type: "password",
          autoComplete: "current-password",
        },
      ]}
      hiddenFields={{ redirectTo: callbackUrl ?? "/dashboard" }}
      submitLabel="Entrar"
      footer={{
        text: "¿No tienes cuenta?",
        linkLabel: "Regístrate",
        href: "/register",
      }}
    />
  );
}
