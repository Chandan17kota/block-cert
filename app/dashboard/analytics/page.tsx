"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  ShieldCheck,
  Activity,
  Loader2,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  Search,
  BrainCircuit,
  Cpu,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const AI_COLORS = ['#10b981', '#facc15', '#ef4444'];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStats, setTrainingStats] = useState<any>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        if (!res.ok) throw new Error("Failed to load analytics");
        const json = await res.json();
        if (json.success) {
          setData(json.stats);
        } else {
          setError(json.error || "Unknown error");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h5 className="font-medium mb-1">Error Loading Analytics</h5>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      </div>
    );
  }

  const issueData = data?.issueData || [];
  const fraudData = data?.fraudData || [];
  const neuralStats = data?.neuralStats || { accuracy: "0%", status: "IDLE", isTrained: false };

  return (
    <div className="p-8 space-y-8 pb-32 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono text-white mb-2 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-emerald-400" />
            Forensic Intelligence
          </h1>
          <p className="text-gray-400">Deep neural insights & real-time risk monitoring telemetry.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-900/20 px-3 py-1 rounded-full border border-blue-900/50">
            <BrainCircuit className="w-3 h-3" />
            MODEL: {neuralStats.isTrained ? 'NEURAL_V3_ACTIVE' : 'BAYES_FORENSIC_V1'}
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-900/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            LIVE TELEMETRY
          </div>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Certificates"
          value={data?.totalIssued || 0}
          change="All time"
          icon={Users}
          color="text-blue-400 bg-blue-400/10 border-blue-400/20"
        />
        <StatsCard
          title="Verified Clean"
          value={data?.verified || 0}
          change={`${data?.totalIssued ? ((data.verified / data.totalIssued) * 100).toFixed(0) : 0}% rate`}
          icon={ShieldCheck}
          color="text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
        />
        <StatsCard
          title="Rejected"
          value={data?.rejected || 0}
          change="Not Issued"
          icon={ShieldAlert}
          color="text-red-400 bg-red-400/10 border-red-400/20"
        />
        <StatsCard
          title="Neural Accuracy"
          value={neuralStats.accuracy}
          change={neuralStats.status}
          icon={BrainCircuit}
          color="text-purple-400 bg-purple-400/10 border-purple-400/20"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Growth Chart */}
        <Card className="lg:col-span-2 bg-black/40 border-emerald-900/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-mono flex items-center gap-2 text-gray-300">
              <Activity className="w-4 h-4 text-emerald-400" />
              ISSUANCE VELOCITY & RISK
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={issueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCert" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #1f2937', borderRadius: '8px' }}
                  itemStyle={{ color: '#e5e7eb' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area type="monotone" name="Issued" dataKey="certificates" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCert)" />
                <Area type="monotone" name="Risky" dataKey="risky" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Fraud Distribution */}
        <Card className="bg-black/40 border-emerald-900/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-mono flex items-center gap-2 text-gray-300">
              <ShieldAlert className="w-4 h-4 text-yellow-500" />
              THREAT CLASSIFICATION
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fraudData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {fraudData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={AI_COLORS[index % AI_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#1f2937', borderRadius: '8px' }}
                  itemStyle={{ color: '#e5e7eb' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Text overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-white">{data?.totalIssued || 0}</span>
              <span className="text-xs text-gray-500">TOTAL</span>
            </div>

            <div className="flex justify-center gap-4 text-[10px] uppercase font-mono text-gray-400 w-full mt-2">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> CLEAN</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500" /> SUSPICIOUS</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> FRAUD</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Neural Training Center (Deep Learning) */}
      <Card className="bg-gradient-to-br from-gray-900/90 to-black border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.05)] overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
          <BrainCircuit className="w-32 h-32 text-purple-400 rotate-12" />
        </div>

        <CardHeader>
          <div className="flex justify-between items-start z-10">
            <div>
              <CardTitle className="text-xl flex items-center gap-2 text-purple-400 font-mono">
                <Activity className="w-5 h-5 animate-pulse" />
                NEURAL_ENGINE_V3 (Deep Learning)
              </CardTitle>
              <CardDescription className="text-purple-300/50 mt-1">
                Train proprietary Deep Learning models on your institutional data patterns.
              </CardDescription>
            </div>
            <Badge className={`border-purple-500/50 ${neuralStats.isTrained ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' : 'bg-purple-900/30 text-purple-400'}`}>
              {neuralStats.isTrained ? 'MODEL READY' : 'TRAINING REQUIRED'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="z-10 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="text-xs font-mono text-gray-500 flex justify-between uppercase">
                  <span>Model Confidence (Accuracy)</span>
                  <span className="text-purple-400">{trainingStats?.accuracy || neuralStats.accuracy}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-1000 relative"
                    style={{ width: trainingStats?.accuracy ? (parseFloat(trainingStats.accuracy) + "%") : neuralStats.accuracy }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
              </div>

              <Button
                onClick={async () => {
                  setIsTraining(true);
                  try {
                    const res = await fetch("/api/ai/train", { method: "POST" });
                    const result = await res.json();
                    setTrainingStats(result);
                    // Refresh main data to update status
                    const analyticsRes = await fetch("/api/analytics");
                    const analyticsJson = await analyticsRes.json();
                    if (analyticsJson.success) setData(analyticsJson.stats);
                  } finally {
                    setIsTraining(false);
                  }
                }}
                disabled={isTraining}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold h-14 rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all"
              >
                {isTraining ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    TRAINING NEURAL NETWORK...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-5 h-5 mr-2" />
                    INITIATE RETRAINING SEQUENCE
                  </>
                )}
              </Button>
            </div>

            <div className="bg-black/60 border border-purple-500/20 rounded-xl p-5 font-mono text-xs h-[140px] overflow-hidden relative shadow-inner">
              <div className="text-purple-500/80 mb-3 border-b border-purple-500/10 pb-2">SYSTEM_LOGS:</div>
              <div className="space-y-1.5">
                {isTraining ? (
                  <div className="animate-pulse space-y-1">
                    <div className="text-emerald-500/60 line-clamp-1">[SYNC] Fetching historical dataset from blockchain...</div>
                    <div className="text-blue-400 line-clamp-1">[TENSORFLOW] Initializing density layers...</div>
                    <div className="text-purple-400 font-bold line-clamp-1">[EPOCH] Optimizing weights (Batch 32)...</div>
                    <div className="text-indigo-400 flex items-center gap-2">
                      [DL] Calculating loss gradients... <Loader2 className="w-3 h-3 animate-spin" />
                    </div>
                  </div>
                ) : trainingStats ? (
                  <div className="space-y-1 animate-in fade-in duration-500">
                    <div className="text-emerald-400">✓ [SUCCESS] Model Optimization Complete</div>
                    <div className="text-gray-400">Accuracy: <span className="text-white">{trainingStats.accuracy}</span></div>
                    <div className="text-gray-400">Loss Metric: <span className="text-white">{parseFloat(trainingStats.loss).toFixed(5)}</span></div>
                    <div className="text-purple-400 mt-2">» System ready onto active inference.</div>
                  </div>
                ) : neuralStats.isTrained ? (
                  <div className="space-y-1 text-gray-500">
                    <div className="text-emerald-500/80">System Active. Model V3 Loaded.</div>
                    <div>Last validated accuracy: {neuralStats.accuracy}</div>
                    <div>Awaiting manual retraining trigger...</div>
                  </div>
                ) : (
                  <div className="text-gray-600 italic flex items-center h-full justify-center pb-6">
                    Waiting for operator command...
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Monitoring Table */}
      <Card className="bg-black/40 border-emerald-900/20 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-gray-200">
              <Activity className="w-5 h-5 text-emerald-400" />
              Real-Time Risk Monitoring
            </CardTitle>
            <CardDescription>Live auditing of all certificates through forensic model v1.0</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="bg-black/40 border-emerald-900/30 text-emerald-400 hover:bg-emerald-900/20">
            <Search className="w-4 h-4 mr-2" /> View All Logs
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-800 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-900/50 text-xs text-gray-400 uppercase font-mono">
                <tr>
                  <th className="px-4 py-3 font-medium">Certificate</th>
                  <th className="px-4 py-3 font-medium">Issuer / Owner</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Forensic Score</th>
                  <th className="px-4 py-3 font-medium text-right">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-black/20">
                {data?.highRiskCerts?.length > 0 ? (
                  data.highRiskCerts.map((cert: any) => (
                    <tr key={cert.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-3 font-medium text-gray-200">
                        <div className="flex items-center gap-2">
                          {cert.riskStatus === "CRITICAL" ? (
                            <ShieldAlert className="w-4 h-4 text-red-500" />
                          ) : cert.riskStatus === "WARNING" ? (
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          )}
                          {cert.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        <div className="flex flex-col">
                          <span>{cert.owner?.fullName || "Student"}</span>
                          <span className="text-[10px] text-gray-600">{cert.owner?.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] bg-black/40 border-gray-700 text-gray-300">
                          {cert.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono w-8 text-right">{cert.riskScore}%</span>
                          <div className="flex-1 bg-gray-800 rounded-full h-1.5 max-w-[100px]">
                            <div
                              className={cn(
                                "h-1.5 rounded-full shadow-lg",
                                cert.riskScore > 70 ? "bg-red-500 shadow-red-500/20" : cert.riskScore > 40 ? "bg-yellow-500 shadow-yellow-500/20" : "bg-emerald-500 shadow-emerald-500/20"
                              )}
                              style={{ width: `${cert.riskScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase border",
                          cert.riskStatus === "CRITICAL" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            cert.riskStatus === "WARNING" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                              "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        )}>
                          {cert.riskStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
                        <p>No high-risk anomalies detected in the last 24h.</p>
                        <p className="text-xs text-gray-600">All systems operational.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({ title, value, change, icon: Icon, color }: any) {
  return (
    <Card className="bg-black/40 border-emerald-900/20 backdrop-blur-sm hover:bg-black/60 transition-colors group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">{value}</h3>
          </div>
          <div className={`p-2.5 rounded-xl ${color} shadow-sm group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-[10px] font-mono">
          <span className="text-emerald-400 font-medium bg-emerald-400/10 px-1.5 py-0.5 rounded">{change}</span>
          {title !== "Rejected" && <span className="text-gray-600 ml-2 tracking-tighter uppercase">Last 30 Days</span>}
        </div>
      </CardContent>
    </Card>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
