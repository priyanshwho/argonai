import { AuthSwitch } from "@/components/ui/auth-switch";

interface SignUpPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { callbackUrl } = await searchParams;

  return <AuthSwitch callbackUrl={callbackUrl} />;
}
