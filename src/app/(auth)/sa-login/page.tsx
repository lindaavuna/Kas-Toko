import type { Metadata } from "next";
import { FormLogin } from "@/components/auth/form-login";

export const metadata: Metadata = {
  title: "Super Admin Login — KasToko",
  description: "Portal login khusus pengelola platform SaaS KasToko.",
};

export default function HalamanLoginSuperAdmin() {
  return <FormLogin tipe="superadmin" />;
}
