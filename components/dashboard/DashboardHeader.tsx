"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState, useAuthActions } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Zap,
  Award,
  Command,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

const fetchProfileAvatar = async (): Promise<{ avatar?: string; username: string; email: string }> => {
  const res = await fetch("/api/users/profile");
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
};

interface DashboardHeaderProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export default function DashboardHeader({
  title,
  description,
  children
}: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const { user } = useAuthState();
  const { signout } = useAuthActions();
  const router = useRouter();

  const handleSignout = async () => {
    await signout();
    router.push("/");
  };

  const getUserInitials = (email: string) =>
    email.split("@")[0].substring(0, 2).toUpperCase();

  /* ---------------- Notifications ---------------- */

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const res = await fetch("/api/notifications", {
        credentials: "include",
      });
      if (!res.ok) return;

      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read", {
        method: "PATCH",
        credentials: "include",
      });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  /* ---------------- Fetch Profile Avatar (TanStack Query) ---------------- */
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["headerProfile"],
    queryFn: fetchProfileAvatar,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const avatarUrl = profileData?.avatar || (profileData?.username ? `https://api.dicebear.com/7.x/initials/svg?seed=${profileData.username}` : "");

  useEffect(() => {
    fetchNotifications();
  }, []);

  /* ---------------- UI ---------------- */

  return (
    <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-emerald-900/20">
      <div className="flex items-center justify-between px-6 py-4">

        {/* LEFT */}
        <div className="flex-1">
          {title ? (
            <>
              <h1 className="text-2xl font-mono font-semibold text-white">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-gray-400 mt-1">
                  {description}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <Command className="w-4 h-4" />
              <span className="text-sm">
                Press{" "}
                <kbd className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-xs">
                  ⌘K
                </kbd>{" "}
                to search
              </span>
            </div>
          )}
        </div>



        {/* RIGHT */}
        <div className="flex items-center gap-4">

          {/* QUICK ACTIONS */}
          <div className="hidden lg:flex gap-2">
            {children ? (
              children
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-emerald-800/30 text-emerald-300 hover:bg-emerald-900/20"
                  onClick={() => router.push("/dashboard/verify")}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Quick Scan
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-emerald-800/30 text-emerald-300 hover:bg-emerald-900/20"
                  onClick={() => router.push("/dashboard/upload")}
                >
                  <Award className="w-3 h-3 mr-1" />
                  New Certificate
                </Button>
              </>
            )}
          </div>

          {/* NOTIFICATIONS */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-gray-400" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center bg-red-600 text-white">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-80 bg-black/90 border border-gray-800 text-gray-200"
            >
              <DropdownMenuLabel className="flex justify-between">
                Notifications
                {unreadCount > 0 && (
                  <Badge className="bg-emerald-900/20 text-emerald-300 text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {loadingNotifications ? (
                <div className="p-3 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="w-2 h-2 rounded-full mt-2 bg-gray-700" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="w-48 h-4 bg-gray-800" />
                        <Skeleton className="w-full h-3 bg-gray-800" />
                        <Skeleton className="w-24 h-3 bg-gray-800" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-gray-500 px-3 py-4">
                  No notifications
                </p>
              ) : (
                notifications.map((n, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 hover:bg-gray-900 rounded-lg cursor-pointer"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${n.read ? "bg-gray-500" : "bg-emerald-500"
                        }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-gray-400">{n.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="justify-center text-emerald-400 cursor-pointer"
                onClick={markAllRead}
              >
                Mark all as read
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* USER MENU */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 rounded-full relative group p-0 overflow-hidden">
                {isLoadingProfile || (!avatarUrl && !user?.email) ? (
                  <div className="relative h-10 w-10">
                    <Skeleton className="h-10 w-10 rounded-full bg-gray-800 animate-pulse border border-gray-700" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-shimmer" />
                  </div>
                ) : (
                  <Avatar className="h-10 w-10 border border-emerald-900/30 group-hover:border-emerald-500/50 transition-colors">
                    <AvatarImage src={avatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-black font-semibold">
                      {user?.email ? getUserInitials(user.email) : "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 bg-black/90 border border-gray-800 text-gray-200"
            >
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard/help")}>
                <HelpCircle className="mr-2 h-4 w-4" /> Help
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleSignout}
                className="text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  );
}
