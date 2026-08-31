"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signupAction, type SignupState } from "@/server/auth-actions";

const initialState: SignupState = {};

export default function SignupPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signupAction, initialState);
  const submittedCredentials = useRef<{ email: string; password: string } | null>(null);

  useEffect(() => {
    const hasErrors = state.error || (state.fieldErrors && Object.keys(state.fieldErrors).length > 0);
    if (!pending && !hasErrors && submittedCredentials.current) {
      const { email, password } = submittedCredentials.current;
      signIn("credentials", { email, password, redirect: false }).then(() => {
        router.push("/dashboard");
        router.refresh();
      });
    }
  }, [state, pending, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Criar conta</CardTitle>
        <CardDescription>Comece a organizar seu pipeline de vendas</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          onSubmit={(event) => {
            const formData = new FormData(event.currentTarget);
            submittedCredentials.current = {
              email: String(formData.get("email") ?? ""),
              password: String(formData.get("password") ?? ""),
            };
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="organizationName">Nome da empresa</Label>
            <Input id="organizationName" name="organizationName" required autoFocus />
            {state.fieldErrors?.organizationName ? (
              <p className="text-sm text-destructive">{state.fieldErrors.organizationName}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Seu nome</Label>
            <Input id="name" name="name" required />
            {state.fieldErrors?.name ? (
              <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required />
            {state.fieldErrors?.email ? (
              <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
            {state.fieldErrors?.password ? (
              <p className="text-sm text-destructive">{state.fieldErrors.password}</p>
            ) : null}
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
