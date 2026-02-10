"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { authService } from "@/services/authService";
import httpService from "@/lib/http";

interface LoginErrors {
  username?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});

  const validate = () => {
    const newErrors: LoginErrors = {};
    if (!username.trim()) {
      newErrors.username = "Vui lòng nhập tài khoản";
    }
    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authService.login({ username, password });
      const responseData = response as {
        data?: { data?: { accessToken?: string; refreshToken?: string } };
      };
      const data = responseData.data?.data;
      if (data?.accessToken && data?.refreshToken) {
        httpService.setTokens(data.accessToken, data.refreshToken);
      }
      router.replace("/workspace");
    } catch {
      // Error toast handled in service layer.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-2xl font-bold">AD</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Đăng nhập Admin</h1>
          <p className="mt-1 text-muted-foreground">Quản trị hệ thống</p>
        </div>

        <Card className="shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Đăng nhập</CardTitle>
            <CardDescription>Nhập thông tin quản trị</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Tài khoản</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="Nhập tài khoản"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) {
                        setErrors((prev) => ({
                          ...prev,
                          username: undefined,
                        }));
                      }
                    }}
                    className={`pl-10 ${errors.username ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.username}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors((prev) => ({
                          ...prev,
                          password: undefined,
                        }));
                      }
                    }}
                    className={`pl-10 pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link href="/forgot-password" className="text-primary hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </Button>

              <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  Admin portal
                </span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
