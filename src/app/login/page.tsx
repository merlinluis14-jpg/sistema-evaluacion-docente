import { redirect } from "next/navigation";

// El formulario de inicio de sesión está integrado en la página principal.
export default function LoginPage() {
  redirect("/");
}