"use client";

import React, { useEffect, useRef, useState } from "react";

import {
  Bell,
  Camera,
  Lock,
  Moon,
  Sun,
  Monitor,
  Save,
  Shield,
  Sparkles,
  User2,
} from "lucide-react";

import { useTheme } from "next-themes";

import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import {
  useConfirmMembershipPayment,
  useMembershipCheckout,
  useMembershipStatus,
} from "@/hooks/membership/useMembership";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Switch } from "@/components/ui/switch";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { Separator } from "@/components/ui/separator";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const { data: user } = useCurrentUser();

  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] =
    useState("");

  const [bio, setBio] = useState("");

  const [emailNotifications, setEmailNotifications] =
    useState(false);

  const [pushNotifications, setPushNotifications] =
    useState(false);

  const [paymentRef, setPaymentRef] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutExpiresAt, setCheckoutExpiresAt] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "membership" | "notifications" | "security">("profile");
  const autoConfirmAttempted = useRef(false);

  const membershipStatusQuery = useMembershipStatus();
  const membershipCheckout = useMembershipCheckout();
  const membershipConfirm = useConfirmMembershipPayment();

  const [selectedTheme, setSelectedTheme] =
    useState<"light" | "dark" | "system">(
      "dark"
    );

  function handleTabChange(value: string) {
    if (value === "profile" || value === "membership" || value === "notifications" || value === "security") {
      setActiveTab(value as "profile" | "membership" | "notifications" | "security");
    }
  }

  useEffect(() => {
    if (!user) return;

    queueMicrotask(() => {
      setDisplayName(
        (user as any)?.display_name ??
        (user as any)?.name ??
        ""
      );

      setBio((user as any)?.bio ?? "");

      setEmailNotifications(
        Boolean(
          (user as any)?.email_notifications
        )
      );

      setPushNotifications(
        Boolean(
          (user as any)?.push_notifications
        )
      );
    });
  }, [user]);

  useEffect(() => {
    if (!theme) return;

    queueMicrotask(() => {
      setSelectedTheme(
        theme as "light" | "dark" | "system"
      );
    });
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (autoConfirmAttempted.current) return;

    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");

      if (tab === "membership" || tab === "notifications" || tab === "security" || tab === "profile") {
        setActiveTab(tab as "profile" | "membership" | "notifications" | "security");
      }

      const paymentRefParam =
        params.get("paymentRef") ??
        params.get("paymentLinkId") ??
        params.get("id") ??
        params.get("orderCode") ??
        params.get("order_code");
      const statusParam = params.get("status")?.toLowerCase();
      const codeParam = params.get("code");

      const isSuccess =
        statusParam === "paid" ||
        statusParam === "success" ||
        statusParam === "00" ||
        codeParam === "00";
      const shouldAutoConfirm =
        Boolean(paymentRefParam) &&
        (isSuccess || tab === "membership");

      if (shouldAutoConfirm && paymentRefParam) {
        autoConfirmAttempted.current = true;
        setPaymentRef(paymentRefParam);
        setCheckoutUrl(null);
        setMessage("Đã phát hiện thanh toán PayOS. Đang xác nhận...");

        membershipConfirm.mutateAsync({ paymentRef: paymentRefParam })
          .then(() => {
            setMessage("Thanh toán đã được xác nhận. Membership được cập nhật.");
          })
          .catch((err: any) => {
            setError(err?.message ?? "Không thể xác nhận giao dịch tự động");
          });
      }
    });
  }, [membershipConfirm]);

  async function handleSave() {
    console.log({
      displayName,
      bio,
      emailNotifications,
      pushNotifications,
      selectedTheme,
    });
  }

  async function handleStartMembership() {
    setMessage(null);
    setError(null);
    setCheckoutUrl(null);

    try {
      const redirectUrl = new URL(window.location.href);
      redirectUrl.searchParams.set("tab", "membership");
      const returnUrl = redirectUrl.toString();

      const session = await membershipCheckout.mutateAsync({ returnUrl });
      setPaymentRef(session.paymentRef);
      setCheckoutUrl(session.checkoutUrl);
      setMessage("Đã tạo link thanh toán PayOS. Vui lòng bấm nút mở để tiếp tục.");
      setCheckoutExpiresAt(session.checkoutExpiresAt);
      setActiveTab("membership");
    } catch (err: any) {
      setError(err?.message ?? "Không thể tạo phiên thanh toán");
    }
  }

  function handleOpenCheckout() {
    if (!checkoutUrl) {
      setError("Không tìm thấy đường dẫn thanh toán. Vui lòng tạo lại phiên thanh toán.");
      return;
    }

    if (checkoutExpiresAt && Date.now() > new Date(checkoutExpiresAt).getTime()) {
      setError("Phiên checkout đã hết hạn sau 10 phút. Vui lòng tạo lại phiên thanh toán.");
      return;
    }

    window.open(checkoutUrl, "_blank");
  }

  async function handleConfirmPayment() {
    setMessage(null);
    setError(null);

    if (!paymentRef.trim()) {
      setError("Vui lòng nhập paymentRef");
      return;
    }

    try {
      await membershipConfirm.mutateAsync({ paymentRef: paymentRef.trim() });
      setMessage("Thanh toán đã được xác nhận. Tình trạng membership được cập nhật.");
      setPaymentRef("");
    } catch (err: any) {
      setError(err?.message ?? "Không thể xác nhận thanh toán");
    }
  }

  return (
    <div
      className="
        min-h-screen
        bg-black
        px-6
        py-8
        text-white
      "
    >
      <div id="payos-checkout" className="hidden" />
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8">
          <h1
            className="
              text-4xl
              font-black
              tracking-wide
            "
          >
            Settings
          </h1>

          <p
            className="
              mt-2
              text-zinc-500
            "
          >
            Manage your account preferences and
            platform experience.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          {/* TABS */}
          <TabsList
            className="
              h-auto
              rounded-2xl
              border
              border-orange-500/20
              bg-zinc-950
              p-2
            "
          >
            <TabsTrigger
              value="profile"
              className="
                rounded-xl
                data-[state=active]:bg-orange-500
                data-[state=active]:text-black
              "
            >
              <User2 className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>

            <TabsTrigger
              value="membership"
              className="
                rounded-xl
                data-[state=active]:bg-orange-500
                data-[state=active]:text-black
              "
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Membership
            </TabsTrigger>

            <TabsTrigger
              value="notifications"
              className="
                rounded-xl
                data-[state=active]:bg-orange-500
                data-[state=active]:text-black
              "
            >
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>

            <TabsTrigger
              value="security"
              className="
                rounded-xl
                data-[state=active]:bg-orange-500
                data-[state=active]:text-black
              "
            >
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* PROFILE CARD */}
              <Card
                className="
                  border-orange-500/20
                  bg-zinc-950
                  shadow-[0_0_40px_rgba(255,115,0,0.06)]
                "
              >
                <CardHeader>
                  <div
                    className="
                      flex
                      flex-col
                      items-center
                      gap-4
                    "
                  >
                    <div className="relative">
                      <Avatar
                        className="
                          h-28
                          w-28
                          border-2
                          border-orange-500/30
                        "
                      >
                        <AvatarImage
                          src={
                            (user as any)
                              ?.avatar_url
                          }
                        />

                        <AvatarFallback>
                          U
                        </AvatarFallback>
                      </Avatar>

                      <button
                        className="
                          absolute
                          bottom-0
                          right-0
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-full
                          border
                          border-orange-500/30
                          bg-orange-500
                          text-black
                          shadow-lg
                        "
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-center">
                      <h2
                        className="
                          text-xl
                          font-bold
                        "
                      >
                        {displayName ||
                          "Unknown User"}
                      </h2>

                      <p
                        className="
                          mt-1
                          text-sm
                          text-zinc-500
                        "
                      >
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <Separator className="bg-orange-500/10" />

                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button
                      className="
                        w-full
                        bg-orange-500
                        text-black
                        hover:bg-orange-400
                      "
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Change Avatar
                    </Button>

                    <Button
                      variant="outline"
                      className="
                        w-full
                        border-orange-500/20
                        bg-transparent
                        text-white
                        hover:bg-orange-500/10
                      "
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* SETTINGS FORM */}
              <div className="lg:col-span-2">
                <Card
                  className="
                    border-orange-500/20
                    bg-zinc-950
                    shadow-[0_0_40px_rgba(255,115,0,0.06)]
                  "
                >
                  <CardHeader>
                    <CardTitle>
                      Profile Information
                    </CardTitle>

                    <CardDescription>
                      Customize your public
                      profile.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>
                        Display Name
                      </Label>

                      <Input
                        value={displayName}
                        onChange={(e) =>
                          setDisplayName(
                            e.target.value
                          )
                        }
                        className="
                          h-12
                          border-orange-500/20
                          bg-black
                          text-white
                          placeholder:text-zinc-600
                          focus-visible:ring-orange-500
                        "
                        placeholder="Enter display name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Bio</Label>

                      <Textarea
                        value={bio}
                        onChange={(e) =>
                          setBio(e.target.value)
                        }
                        rows={6}
                        className="
                          border-orange-500/20
                          bg-black
                          text-white
                          placeholder:text-zinc-600
                          focus-visible:ring-orange-500
                        "
                        placeholder="Tell people about yourself..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Theme</Label>

                      <Select
                        value={selectedTheme}
                        onValueChange={(
                          value
                        ) => {
                          const v =
                            value as
                            | "light"
                            | "dark"
                            | "system";

                          setSelectedTheme(v);

                          setTheme(v);
                        }}
                      >
                        <SelectTrigger
                          className="
                            h-12
                            border-orange-500/20
                            bg-black
                          "
                        >
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent
                          className="
                            border-orange-500/20
                            bg-zinc-950
                            text-white
                          "
                        >
                          <SelectItem value="dark">
                            <div className="flex items-center gap-2">
                              <Moon className="h-4 w-4" />
                              Dark
                            </div>
                          </SelectItem>

                          <SelectItem value="light">
                            <div className="flex items-center gap-2">
                              <Sun className="h-4 w-4" />
                              Light
                            </div>
                          </SelectItem>

                          <SelectItem value="system">
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4" />
                              System
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSave}
                        className="
                          h-12
                          rounded-xl
                          bg-orange-500
                          px-6
                          font-semibold
                          text-black
                          hover:bg-orange-400
                        "
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* MEMBERSHIP */}
          <TabsContent value="membership">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card
                className="
                  border-orange-500/20
                  bg-zinc-950
                  shadow-[0_0_40px_rgba(255,115,0,0.06)]
                "
              >
                <CardHeader>
                  <CardTitle>Membership</CardTitle>
                  <CardDescription>
                    Unlock premium features and earn priority access
                    for 30 days.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Membership Status
                        </h3>
                        <p className="text-sm text-zinc-500">
                          Xem trạng thái đăng ký tại đây.
                        </p>
                      </div>

                      <span
                        className="
                          rounded-full
                          bg-orange-500/10
                          px-3
                          py-1
                          text-sm
                          font-semibold
                          text-orange-300
                        "
                      >
                        {membershipStatusQuery.isLoading
                          ? "Đang tải..."
                          : membershipStatusQuery.data?.isActive
                            ? "Đang hoạt động"
                            : "Chưa active"}
                      </span>
                    </div>

                    <div className="grid gap-2 rounded-3xl bg-black/60 p-4 text-sm text-zinc-300">
                      <div className="flex items-center justify-between">
                        <span>Ngày còn lại</span>
                        <span className="font-semibold text-white">
                          {membershipStatusQuery.isLoading
                            ? "—"
                            : membershipStatusQuery.data?.daysLeft ?? "0"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Hạn hiệu lực</span>
                        <span className="font-semibold text-white">
                          {membershipStatusQuery.isLoading
                            ? "—"
                            : membershipStatusQuery.data?.expiresAt
                              ? new Date(membershipStatusQuery.data.expiresAt).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                              : "Chưa có"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-3xl bg-black/60 p-4 text-sm text-zinc-300">
                      <p className="font-semibold text-white">
                        Benefits
                      </p>
                      <ul className="space-y-2 pl-4 text-sm text-zinc-400">
                        <li>• Truy cập nội dung VIP</li>
                        <li>• Ưu tiên hỗ trợ</li>
                        <li>• Ưu đãi trong marketplace</li>
                      </ul>
                    </div>
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                      {error}
                    </div>
                  ) : null}

                  {message ? (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                      {message}
                    </div>
                  ) : null}

                  <div className="grid gap-3">
                    <Button
                      onClick={handleStartMembership}
                      className="h-14 rounded-xl bg-orange-500 text-black hover:bg-orange-400"
                      disabled={membershipCheckout.isPending}
                    >
                      {membershipCheckout.isPending
                        ? "Đang tạo phiên thanh toán..."
                        : membershipStatusQuery.data?.isActive
                          ? "Tạo lại link gia hạn"
                          : "Tạo link thanh toán"
                      }
                    </Button>

                    {checkoutUrl ? (
                      <Button
                        variant="secondary"
                        onClick={handleOpenCheckout}
                        className="h-14 rounded-xl border border-orange-500/20 bg-white/5 text-white hover:bg-orange-500/10"
                      >
                        Mở PayOS checkout
                      </Button>
                    ) : null}

                    {checkoutExpiresAt ? (
                      <p className="text-sm text-zinc-400">
                        Phiên checkout sẽ hết hạn vào {new Date(checkoutExpiresAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}.
                      </p>
                    ) : null}

                    <Button
                      variant="outline"
                      onClick={handleConfirmPayment}
                      className="h-14 rounded-xl border-orange-500/20 text-white hover:bg-orange-500/10"
                      disabled={membershipConfirm.isPending}
                    >
                      {membershipConfirm.isPending
                        ? "Đang xác nhận..."
                        : "Xác nhận thanh toán"
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="
                  border-orange-500/20
                  bg-zinc-950
                  shadow-[0_0_40px_rgba(255,115,0,0.06)]
                "
              >
                <CardHeader>
                  <CardTitle>Payment Reference</CardTitle>
                  <CardDescription>
                    Dán paymentRef nếu PayOS không tự động xác nhận.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Payment Ref</Label>
                    <Input
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="
                        h-12
                        border-orange-500/20
                        bg-black
                        text-white
                        placeholder:text-zinc-600
                        focus-visible:ring-orange-500
                      "
                      placeholder="Nhập paymentRef"
                    />
                  </div>

                  <p className="text-sm text-zinc-500">
                    Sau khi hoàn tất thanh toán PayOS, nếu membership vẫn chưa cập nhật,
                    bạn có thể dán mã thanh toán và nhấn xác nhận.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* NOTIFICATIONS */}
          <TabsContent value="notifications">
            <Card
              className="
                border-orange-500/20
                bg-zinc-950
              "
            >
              <CardHeader>
                <CardTitle>
                  Notification Preferences
                </CardTitle>

                <CardDescription>
                  Configure how you receive
                  notifications.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >
                  <div>
                    <h3 className="font-medium">
                      Email Notifications
                    </h3>

                    <p
                      className="
                        text-sm
                        text-zinc-500
                      "
                    >
                      Receive updates via email.
                    </p>
                  </div>

                  <Switch
                    checked={
                      emailNotifications
                    }
                    onCheckedChange={
                      setEmailNotifications
                    }
                  />
                </div>

                <Separator className="bg-orange-500/10" />

                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >
                  <div>
                    <h3 className="font-medium">
                      Push Notifications
                    </h3>

                    <p
                      className="
                        text-sm
                        text-zinc-500
                      "
                    >
                      Receive instant alerts.
                    </p>
                  </div>

                  <Switch
                    checked={
                      pushNotifications
                    }
                    onCheckedChange={
                      setPushNotifications
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECURITY */}
          <TabsContent value="security">
            <Card
              className="
                border-orange-500/20
                bg-zinc-950
              "
            >
              <CardHeader>
                <CardTitle>
                  Security Settings
                </CardTitle>

                <CardDescription>
                  Manage your account security.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="
                    border-orange-500/20
                    bg-transparent
                    text-white
                    hover:bg-orange-500/10
                  "
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>

                <Button
                  variant="destructive"
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}