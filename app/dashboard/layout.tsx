"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import AIChatbot from "@/components/dashboard/AIChatbot";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-black text-gray-100 flex relative">
                {/* Background effects */}
                <div className="fixed inset-0 grid-pattern pointer-events-none opacity-10" />
                <div className="fixed inset-0 noise-overlay pointer-events-none opacity-5" />

                <DashboardSidebar />

                <div className="flex-1 flex flex-col min-w-0">
                    {children}
                </div>


            </div>
        </ProtectedRoute>
    );
}
