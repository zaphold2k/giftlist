import { AuthForm } from "@/components/auth-form";
import { register } from "../actions";

export const metadata = { title: "Crear cuenta — giftlist" };

export default function RegisterPage() {
  return (
    <AuthForm
      title="Crear cuenta"
      action={register}
      fields={[
        { name: "name", label: "Tu nombre", type: "text", autoComplete: "name" },
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        {
          name: "password",
          label: "Contraseña",
          type: "password",
          autoComplete: "new-password",
          placeholder: "Mínimo 8 caracteres",
        },
      ]}
      submitLabel="Crear cuenta"
      footer={{
        text: "¿Ya tienes cuenta?",
        linkLabel: "Inicia sesión",
        href: "/login",
      }}
    />
  );
}
