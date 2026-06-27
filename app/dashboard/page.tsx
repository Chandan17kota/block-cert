"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCards from "@/components/dashboard/StatsCards";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { CertificateTrendsChart, SuccessRateChart } from "@/components/dashboard/DashboardCharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Shield,
  BarChart3,
  FileText,
  Award,
  ArrowRight,
  Plus,
  Download,
  Settings
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DashboardData {
  summary: {
    certificatesProcessed: number;
    successRate: number;
    pendingReviews: number;
    processingQueue: number;
    totalCertificates: number;
  };
  charts: {
    trends: Array<{ name: string; value: number }>;
    success: Array<{ name: string; rate: number }>;
  };
  recentCertificates: Array<{
    id: string;
    title: string;
    status: string;
    timeAgo: string;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔒 STRICT REDIRECT: Ensure this generic dashboard is for Students only
  // Admins & Companies have their own dedicated views
  useEffect(() => {
    const localUserType = localStorage.getItem("usertype"); // Lowercase to match signin/signup

    if (localUserType === "ADMIN" || localUserType === "INSTITUTION") {
      router.replace("/dashboard/admin");
    } else if (localUserType === "COMPANY") {
      router.replace("/dashboard/verify");
    }
  }, [router]);

  // Fetch dashboard data for students
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/student/dashboard");
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        } else {
          const errorText = await response.text();
          console.error("Failed to fetch dashboard data:", response.status, errorText);
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    }

    // Only fetch if user is a student
    const localUserType = localStorage.getItem("usertype");

    if (localUserType === "STUDENT") {
      fetchDashboardData();
    } else {
      // If not a student, stop loading immediately
      setIsLoading(false);
    }
  }, []);

  return (
    <>
      <DashboardHeader
        title="Dashboard Overview"
        description="Welcome back! Here's what's happening with your certificates."
      />

      <main className="flex-1 p-6 space-y-8 overflow-auto">

        {/* Stats */}
        <StatsCards />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/dashboard/upload">
            <Button className="h-16 w-full bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-400 text-black font-medium">
              <Upload className="w-5 h-5 mr-2" />
              Upload Certificate
            </Button>
          </Link>

          <Link href="/dashboard/verify">
            <Button variant="outline" className="h-16 w-full border-emerald-800/30 text-emerald-300 hover:bg-emerald-900/20">
              <Shield className="w-5 h-5 mr-2" />
              Verify Certificate
            </Button>
          </Link>

          <Link href="/dashboard/analytics">
            <Button variant="outline" className="h-16 w-full border-emerald-800/30 text-emerald-300 hover:bg-emerald-900/20">
              <BarChart3 className="w-5 h-5 mr-2" />
              View Analytics
            </Button>
          </Link>

          <Link href="/dashboard/reports">
            <Button variant="outline" className="h-16 w-full border-emerald-800/30 text-emerald-300 hover:bg-emerald-900/20">
              <FileText className="w-5 h-5 mr-2" />
              Generate Report
            </Button>
          </Link>

          {user?.usertype === "INSTITUTION" && (
            <Link href="/dashboard/admin" className="contents">
              <Button className="h-16 bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-purple-900/20 border border-purple-500/30">
                <Settings className="w-5 h-5 mr-2" />
                Admin Dashboard
              </Button>
            </Link>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>

          {/* Side Panels */}
          <div className="space-y-6">

            {/* Today's Summary */}
            <Card className="glass bg-black/40 border border-emerald-900/20">
              <CardHeader>
                <CardTitle className="text-lg font-mono">Today's Summary</CardTitle>
                <CardDescription className="text-gray-400">Key metrics for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="text-center text-gray-400 py-4">Loading...</div>
                ) : dashboardData ? (
                  <>
                    <SummaryRow label="Certificates Processed" value={dashboardData.summary.certificatesProcessed.toString()} />
                    <SummaryRow label="Success Rate" value={`${dashboardData.summary.successRate}%`} success />
                    <SummaryRow label="Pending Reviews" value={dashboardData.summary.pendingReviews.toString()} />

                    <div className="pt-4 border-t border-gray-800">
                      <div className="flex justify-between mb-2 text-sm">
                        <span className="text-gray-400">Processing Queue</span>
                        <span className="text-emerald-300">{dashboardData.summary.processingQueue}%</span>
                      </div>
                      <Progress value={dashboardData.summary.processingQueue} className="h-2 bg-gray-800" />
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400 py-4">No data available</div>
                )}
              </CardContent>
            </Card>

            {/* Recent Certificates */}
            <Card className="glass bg-black/40 border border-emerald-900/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-mono">Recent Certificates</CardTitle>
                  <CardDescription className="text-gray-400">Latest uploads</CardDescription>
                </div>
                <Link href="/dashboard/upload">
                  <Button size="icon" variant="ghost">
                    <Plus className="w-4 h-4 text-emerald-300" />
                  </Button>
                </Link>
              </CardHeader>

              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="text-center text-gray-400 py-4">Loading...</div>
                ) : dashboardData && dashboardData.recentCertificates.length > 0 ? (
                  <>
                    {dashboardData.recentCertificates.map((cert) => (
                      <div key={cert.id} className="flex items-start gap-3 p-3 rounded-xl bg-black/30 border border-gray-800">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                          <Award className="w-5 h-5 text-black" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{cert.title}</p>
                          <p className="text-xs text-gray-400">{user?.fullName || "You"}</p>
                          <div className="flex justify-between mt-1">
                            <Badge className={cert.status === "verified" || cert.status === "approved"
                              ? "bg-emerald-900/20 text-emerald-300"
                              : cert.status === "pending"
                                ? "bg-orange-900/20 text-orange-300"
                                : "bg-red-900/20 text-red-300"}>
                              {cert.status}
                            </Badge>
                            <span className="text-xs text-gray-500">{cert.timeAgo}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Link href="/dashboard/certificates">
                      <Button variant="outline" className="w-full border-emerald-800/30 text-emerald-300">
                        View All
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Award className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="mb-4">No certificates yet</p>
                    <Link href="/dashboard/upload">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Your First Certificate
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="glass bg-black/40 border border-emerald-900/20">
              <CardHeader>
                <CardTitle className="text-lg font-mono">System Status</CardTitle>
                <CardDescription className="text-gray-400">All systems operational</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatusRow label="AI Processing" status="Online" />
                <StatusRow label="Blockchain Network" status="Connected" />
                <StatusRow label="Storage" status="75% Used" warning />

                <Link href="/dashboard/reports">
                  <Button variant="outline" className="w-full border-emerald-800/30 text-emerald-300">
                    <Download className="w-4 h-4 mr-2" />
                    Export Logs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CertificateTrendsChart data={dashboardData?.charts?.trends || []} />
          <SuccessRateChart data={dashboardData?.charts?.success || []} />
        </div>
      </main>
    </>
  );
}

/* ---------- Helpers ---------- */

function SummaryRow({ label, value, success }: any) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <Badge className={success ? "bg-emerald-900/20 text-emerald-300" : "bg-gray-800"}>
        {value}
      </Badge>
    </div>
  );
}

function StatusRow({ label, status, warning }: any) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className={warning ? "text-yellow-400" : "text-emerald-400"}>
        {status}
      </span>
    </div>
  );
}


