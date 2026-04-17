"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const schema = z
  .object({
    name: z.string().min(2, "Name is too short"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters").max(128),
    confirm: z.string(),
    role: z.enum(["DONOR", "CREATOR"]),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

type RegisterFormProps = {
  showLoginLink?: boolean;
};

function strengthLabel(password: string) {
  if (!password) return { score: 0, label: "", color: "bg-slate-700" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const capped = Math.min(4, score);
  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-red-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];
  return { score: capped, label: labels[capped - 1] ?? "Weak", color: colors[capped - 1] ?? "bg-slate-700" };
}

export function RegisterForm({ showLoginLink = true }: RegisterFormProps) {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm: "",
      role: "DONOR",
    },
  });

  const pwd = watch("password") ?? "";
  const strength = useMemo(() => strengthLabel(pwd), [pwd]);

  const onSubmit = async (values: FormValues) => {
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      });
      toast.success("Account created");
      router.push("/overview");
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg ?? "Registration failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          autoComplete="name"
          className="border-white/10 bg-white/[0.04] transition-all duration-300 focus-visible:scale-[1.02] focus-visible:border-blue-500/50 focus-visible:ring-blue-500/40"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          className="border-white/10 bg-white/[0.04] transition-all duration-300 focus-visible:scale-[1.02] focus-visible:border-blue-500/50 focus-visible:ring-blue-500/40"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={show1 ? "text" : "password"}
            autoComplete="new-password"
            className="border-white/10 bg-white/[0.04] pr-10 transition-all duration-300 focus-visible:scale-[1.02] focus-visible:border-blue-500/50 focus-visible:ring-blue-500/40"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-white"
            onClick={() => setShow1((s) => !s)}
            aria-label={show1 ? "Hide password" : "Show password"}
          >
            {show1 ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {pwd.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= strength.score ? strength.color : "bg-white/10"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Strength: <span className="text-slate-300">{strength.label}</span>
            </p>
          </div>
        )}
        {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <div className="relative">
          <Input
            id="confirm"
            type={show2 ? "text" : "password"}
            autoComplete="new-password"
            className="border-white/10 bg-white/[0.04] pr-10 transition-all duration-300 focus-visible:scale-[1.02] focus-visible:border-blue-500/50 focus-visible:ring-blue-500/40"
            aria-invalid={!!errors.confirm}
            {...register("confirm")}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-white"
            onClick={() => setShow2((s) => !s)}
            aria-label={show2 ? "Hide password" : "Show password"}
          >
            {show2 ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.confirm && <p className="text-xs text-red-400">{errors.confirm.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          className="flex h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none ring-offset-background transition-colors focus-visible:border-blue-500/50 focus-visible:ring-2 focus-visible:ring-blue-500/40"
          {...register("role")}
        >
          <option value="DONOR">Donor</option>
          <option value="CREATOR">Creator</option>
        </select>
        {errors.role && <p className="text-xs text-red-400">{errors.role.message}</p>}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white shadow-[0_0_0_0_rgba(37,99,235,0)] transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:bg-blue-500 hover:shadow-[0_0_28px_-6px_rgba(37,99,235,0.55)]"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
      </Button>
      {showLoginLink ? (
        <p className="text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Log in
          </Link>
        </p>
      ) : null}
    </form>
  );
}
