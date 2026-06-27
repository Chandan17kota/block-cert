"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  BarChart3,
  Upload,
  Shield,
  Users,
  Settings,
  FileText,
  Search,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  Database,
  Building,
  CheckCircle2
} from "lucide-react";

interface SidebarProps {
  className?: string;
}


interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: string;
}

const navigationItemsBase: NavItem[] = [
  { title: "Overview", href: "/dashboard", icon: Home },
  { title: "Certificates", href: "/dashboard/certificates", icon: Award },
  { title: "Upload", href: "/dashboard/upload", icon: Upload },
  { title: "Verify", href: "/dashboard/verify", icon: Shield },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Students", href: "/dashboard/students", icon: Users },
  { title: "Reports", href: "/dashboard/reports", icon: FileText },
];

const bottomItems: NavItem[] = [
  { title: "Profile", href: "/dashboard/profile", icon: Users },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
  { title: "Help", href: "/dashboard/help", icon: HelpCircle },
];

export default function DashboardSidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [certificateCount, setCertificateCount] = useState<string | null>(null);
  const [adminStats, setAdminStats] = useState<{ pending: number; studentCount: number } | null>(null);
  const pathname = usePathname();

  // Fetch certificate count (Common)
  useEffect(() => {
    async function fetchCertificateCount() {
      try {
        const res = await fetch("/api/certificates?page=1&limit=1");
        if (res.ok) {
          const data = await res.json();
          setCertificateCount(data.total?.toString() ?? null);
        }
      } catch (e) {
        setCertificateCount(null);
      }
    }
    fetchCertificateCount();
  }, []);

  // Use localStorage for user type and admin status as requested
  const [localUserType, setLocalUserType] = useState<string | null>(null);
  const [localIsAdmin, setLocalIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedType = localStorage.getItem("usertype");
      const storedAdmin = localStorage.getItem("isAdmin") === "true";

      setLocalUserType(storedType);
      setLocalIsAdmin(storedAdmin);

      // If Admin, fetch admin stats
      if (storedType === "INSTITUTION") {
        fetch("/api/admin/dashboard/stats")
          .then(res => res.json())
          .then(data => {
            if (data.totalCertificates !== undefined) {
              setAdminStats({
                pending: data.pending,
                studentCount: data.studentCount
              });
            }
          })
          .catch(err => console.error("Sidebar stats fetch failed", err));
      }
    }
  }, []);

  // ------------------------------------------------------------------
  // DYNAMIC NAVIGATION LOGIC
  // ------------------------------------------------------------------
  // Define visible items based on ROLE
  let finalNavItems = [];

  if (localUserType === "ADMIN" || localUserType === "INSTITUTION") {
    // ADMIN VIEW (Full Access)
    finalNavItems = navigationItemsBase
      .filter(item => ["Overview", "Certificates", "Students", "Analytics", "Reports", "Verify"].includes(item.title))
      .map(item => {
        if (item.title === "Overview") return { ...item, href: "/dashboard/admin" };
        if (item.title === "Certificates") return { ...item, href: "/dashboard/admin/certificates" };
        if (item.title === "Students") {
          return {
            ...item,
            href: "/dashboard/admin/students",
            badge: adminStats?.studentCount ? adminStats.studentCount.toString() : undefined
          };
        }
        return item;
      });

    // Add Approvals
    finalNavItems.splice(1, 0, {
      title: "Approvals",
      href: "/dashboard/admin/approvals",
      icon: CheckCircle2,
      badge: adminStats?.pending && adminStats.pending > 0 ? adminStats.pending.toString() : undefined
    });
  } else if (localUserType === "STUDENT") {
    // STUDENT VIEW
    // Students see their certificates, reports, AND Verify
    finalNavItems = navigationItemsBase.filter(item =>
      ["Overview", "Certificates", "Reports", "Verify"].includes(item.title)
    );
  } else {
    // Default / Fallback - Show basic items + Verify
    finalNavItems = navigationItemsBase.filter(item =>
      ["Overview", "Certificates", "Verify"].includes(item.title)
    );
  }

  // Inject dynamic badge for certificates if applicable
  const navigationItems = finalNavItems.map((item) =>
    item.title === "Certificates" && certificateCount
      ? { ...item, badge: certificateCount }
      : item
  );

  return (
    <aside
      className={cn(
        "flex flex-col bg-black/60 backdrop-blur-xl border-r border-emerald-900/20 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-emerald-900/20">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-black" />
            </div>
            <span className="text-lg font-mono text-white">
              True<span className="text-gradient ml-1">Ledger</span>
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-400 hover:text-white"
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      {/* NAV */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-emerald-900/20 text-emerald-300"
                  : "text-gray-400 hover:bg-gray-900 hover:text-white"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-emerald-400" : "text-gray-500")} />

              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <Badge className="bg-emerald-900/30 text-emerald-300 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}

              {/* Tooltip (collapsed) */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-black border border-gray-800 rounded-md text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none">
                  {item.title}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* STORAGE */}
      {!isCollapsed && (
        <div className="px-4 pb-4">
          <div className="rounded-xl bg-gradient-to-br from-emerald-900/10 to-teal-900/10 border border-emerald-900/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-gray-300 font-medium">Storage Usage</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Used</span>
                <span>2.4 GB / 10 GB</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full">
                <div className="h-2 w-[24%] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
              </div>
              <Button size="sm" variant="outline" className="w-full mt-2 border-emerald-800/30 text-emerald-300">
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="border-t border-emerald-900/20 px-3 py-4 space-y-1">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
                isActive
                  ? "bg-emerald-900/20 text-emerald-300"
                  : "text-gray-400 hover:bg-gray-900 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              {!isCollapsed && <span>{item.title}</span>}

              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-black border border-gray-800 rounded-md text-xs text-white opacity-0 group-hover:opacity-100">
                  {item.title}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
