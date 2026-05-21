"use client";

import React, { useEffect, useState } from "react";

import {
  Bell,
  Camera,
  Lock,
  Moon,
  Sun,
  Monitor,
  Save,
  Shield,
  User2,
} from "lucide-react";

import { useTheme } from "next-themes";

import { useCurrentUser } from "@/hooks/auth/useCurrentUser";

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

  const [selectedTheme, setSelectedTheme] =
    useState<"light" | "dark" | "system">(
      "dark"
    );

  useEffect(() => {
    if (!user) return;

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
  }, [user]);

  useEffect(() => {
    if (theme) {
      setSelectedTheme(
        theme as "light" | "dark" | "system"
      );
    }
  }, [theme]);

  function handleSave() {
    console.log({
      displayName,
      bio,
      emailNotifications,
      pushNotifications,
      selectedTheme,
    });
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
          defaultValue="profile"
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