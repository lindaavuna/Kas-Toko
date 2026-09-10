import type { Metadata } from "next";
import { FormLogin } from "@/components/auth/form-login";
import { Crown } from "lucide-react";

export const metadata: Metadata = {
  title: "Super Admin Login",
  description: "Login untuk pengelola platform KasToko.",
};

export default function HalamanLoginSuperAdmin() {
  return (
    <div>
      <div className="mb-6 text-center space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center justify-center gap-2">
          <Crown className="size-6 text-primary" /> Super Admin Platform
        </h1>
        <p className="text-sm text-muted-foreground">Silakan masuk untuk mengelola pelanggan SaaS Anda.</p>
      </div>
      <FormLogin />
    </div>
  );
}
