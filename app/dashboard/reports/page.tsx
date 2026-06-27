"use client";

import { useEffect, useState } from "react";
import { FileText, Download, Filter, Activity, User, Calendar, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LogEntry {
  id: string;
  action: string;
  date: string;
  performer: string;
  role: string;
  targetCert: string;
  details: any;
}

export default function ReportsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) throw new Error("Failed to fetch reports");
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs);
        } else {
          setError(data.error || "Unknown error");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, []);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const res = await fetch("/api/reports/export-csv");
      if (!res.ok) throw new Error("Failed to export CSV");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert("Failed to export CSV: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h5 className="font-medium mb-1">Error Loading Reports</h5>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-emerald-400" /> Activity Reports
          </h1>
          <p className="text-gray-400">Audit trail of actions performed within your institution.</p>
        </div>
        <div className="flex gap-2">
          {/* <Button variant="outline" className="border-emerald-900/30 text-emerald-400">
            <Filter className="w-4 h-4 mr-2" /> Filter
            </Button> */}
          <Button
            variant="outline"
            className="border-emerald-900/30 text-emerald-400 hover:bg-emerald-900/20"
            onClick={handleExportCSV}
            disabled={isExporting || logs.length === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-xl bg-black/20">
            No activity logs found.
          </div>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="bg-black/40 border-emerald-900/20 backdrop-blur-sm hover:border-emerald-500/20 transition-colors">
              <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getActionColor(log.action)
                    }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-medium text-white">{formatAction(log.action)}</h3>
                      <Badge variant="outline" className="text-xs border-white/10 text-gray-400">{log.role}</Badge>
                    </div>
                    <p className="text-sm text-gray-400">
                      {log.targetCert} • by <span className="text-emerald-300">{log.performer}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {new Date(log.date).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function getActionColor(action: string) {
  const act = action.toUpperCase();
  if (act.includes("REJECT")) return "bg-red-500/10 text-red-500";
  if (act.includes("VERIFY") || act.includes("APPROVE")) return "bg-emerald-500/10 text-emerald-500";
  if (act.includes("CREATE") || act.includes("UPLOAD")) return "bg-blue-500/10 text-blue-500";
  return "bg-gray-500/10 text-gray-500";
}

function formatAction(action: string) {
  return action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
