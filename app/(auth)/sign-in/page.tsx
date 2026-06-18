import { AuthSwitch } from "@/components/ui/auth-switch";

interface SignInPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl } = await searchParams;

  return <AuthSwitch callbackUrl={callbackUrl} />;
}
