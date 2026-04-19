import { SplitAuthLayout } from "@/components/auth-layout/SplitAuthLayout";

export const metadata = {
  title: "Log in | PayShield",
  description: "Access your PayShield account",
};

export default function LoginPage() {
  return <SplitAuthLayout />;
}
