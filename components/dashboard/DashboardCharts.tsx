"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";

export function CertificateTrendsChart({ data }: { data: any[] }) {
    return (
        <Card className="glass bg-black/40 border border-emerald-900/20">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    <CardTitle className="text-lg font-mono">Certificate Trends</CardTitle>
                </div>
                <CardDescription className="text-gray-400">Monthly processing overview</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#000", border: "1px solid #1f2937", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                                itemStyle={{ color: "#10b981" }}
                                formatter={(value: any) => [`${value} Certs`, 'Processed']}
                                labelStyle={{ color: "#9ca3af" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

export function SuccessRateChart({ data }: { data: any[] }) {
    return (
        <Card className="glass bg-black/40 border border-emerald-900/20">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <CardTitle className="text-lg font-mono">Verification Success Rate</CardTitle>
                </div>
                <CardDescription className="text-gray-400">Success trends over time</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                unit="%"
                                domain={[0, 100]}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#000", border: "1px solid #1f2937", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                                itemStyle={{ color: "#34d399" }}
                                formatter={(value: any) => [`${value}%`, 'Success Rate']}
                                labelStyle={{ color: "#9ca3af" }}
                            />
                            <Line
                                type="monotone"
                                dataKey="rate"
                                stroke="#34d399"
                                strokeWidth={2}
                                dot={{ r: 4, fill: "#065f46", strokeWidth: 2, stroke: "#34d399" }}
                                activeDot={{ r: 6, fill: "#fff" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
