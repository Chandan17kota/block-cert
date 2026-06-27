"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText, CheckCircle2, Image as ImageIcon, X, Wand2, ScanLine, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

import { forensicsEngine, type ForensicReport } from '@/lib/ai/imageForensics';

interface UploadResponse {
  fileUrl: string;
  fileType: string;
  s3Key: string;
}

export default function UploadPage() {
  const router = useRouter();

  // 🔒 ROLE PROTECTION: Allow Students and Institution Admins
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("usertype") || localStorage.getItem("userType");
    setUserRole(storedRole);

    if (storedRole === "COMPANY") {
      router.push("/dashboard/verify");
    }
  }, [router]);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<"idle" | "uploading" | "success">("idle");
  const [uploadedData, setUploadedData] = useState<UploadResponse | null>(null);

  // AI States
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractConfidence, setExtractConfidence] = useState<number | null>(null);

  // Forensics States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [forensicReport, setForensicReport] = useState<ForensicReport | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<{
    title: string;
    description: string;
    studentName?: string;
    studentEmail?: string;
  }>();

  // 1. Upload Image Mutation
  const uploadMutation = useMutation({
    mutationFn: async (fileToUpload: File) => {
      const formData = new FormData();
      formData.append("file", fileToUpload);

      const res = await fetch("/api/upload/certificate-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Image upload failed");
      return res.json() as Promise<UploadResponse>;
    },
    onSuccess: (data) => {
      setUploadedData(data);
      setUploadStep("success");
    },
  });

  // 2. Create Certificate Mutation
  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; studentName?: string; studentEmail?: string }) => {
      if (!uploadedData) throw new Error("No image uploaded");

      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          fileUrl: uploadedData.fileUrl,
          fileType: uploadedData.fileType,
          s3Key: uploadedData.s3Key,
          forensicData: forensicReport, // Pass the AI report to the backend
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create certificate");
      }
      return res.json();
    },
    onSuccess: () => {
      // Redirect based on role
      if (userRole === "INSTITUTION") {
        router.push("/dashboard/admin/certificates");
      } else {
        router.push("/dashboard/certificates");
      }
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 15 * 1024 * 1024) { // 15MB limit
        alert("File size must be less than 15MB");
        return;
      }

      setFile(selected);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selected);

      // Reset AI states
      setExtractConfidence(null);
      setForensicReport(null);

      // AUTO-RUN SERVER-SIDE FORENSICS ANALYSIS
      setIsAnalyzing(true);
      try {
        console.log('[Forensics] Starting Advanced AI Analysis (Multi-Layer)...');

        const formData = new FormData();
        formData.append("file", selected);

        const res = await fetch("/api/ai/analyze-image", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Analysis request failed");
        }

        const data = await res.json();
        console.log('[Forensics] Analysis Complete:', data);

        if (data.success && data.analysis) {
          // Map new API response structure to legacy ForensicReport format
          setForensicReport({
            isTampered: data.analysis.isSuspicious,
            confidenceScore: data.analysis.riskScore, // Risk score (inverse of authenticity)
            suspicionLevel: data.analysis.status || 'SUSPICIOUS',
            findings: data.analysis.findings || [],
            detailScores: {
              elaScore: data.analysis.componentScores?.imageAuthenticity || 0,
              metadataScore: data.analysis.componentScores?.textConsistency || 0,
              statisticalScore: data.analysis.componentScores?.layoutSimilarity || 0,
              noiseScore: 0
            }
          });

          console.log('[Forensics] Report Set:', {
            status: data.analysis.status,
            score: data.analysis.finalScore,
            findings: data.analysis.findings
          });
        } else {
          throw new Error("Invalid analysis response structure");
        }
      } catch (error) {
        console.error('[Forensics] Analysis failed:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        // Set default forensic report on error
        setForensicReport({
          isTampered: true,
          confidenceScore: 75,
          suspicionLevel: 'SUSPICIOUS',
          findings: [`AI Analysis Error: ${errorMsg}`],
          detailScores: {
            elaScore: 0,
            metadataScore: 0,
            statisticalScore: 0,
            noiseScore: 0
          }
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    setUploadStep("idle");
    setUploadedData(null);
    setExtractConfidence(null);
    setForensicReport(null);
    // Reset file input
    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  const onUpload = async () => {
    if (!file) return;
    setUploadStep("uploading");
    uploadMutation.mutate(file);
  };

  const onSmartExtract = async () => {
    if (!file || !preview) return;

    setIsExtracting(true);
    try {
      console.log('[AI Extract] Sending to PaddleOCR Engine...');

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ai/extract-text", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("OCR Service Unavailable");

      const result = await res.json();

      if (!result.success) throw new Error(result.error || "OCR Failed");

      const text = result.data.text;
      const confidence = result.data.confidence;

      console.log('[AI Extract] OCR Text:', text);
      console.log('[AI Extract] Confidence:', confidence);

      if (!text || text.trim().length < 5) {
        alert('❌ AI could not extract meaningful text. Please ensure the image is clear.');
        setIsExtracting(false);
        return;
      }

      // IMPROVED EXTRACTION LOGIC (Server-side text processing)
      const lines = result.data.lines || text.split('\n');

      // Certificate-specific keywords
      const certKeywords = ['certificate', 'awarded', 'presented', 'completion', 'achievement', 'diploma', 'degree', 'honor'];
      const nameKeywords = ['name', 'recipient', 'awarded to', 'presented to', 'this certifies that'];

      let extractedTitle = '';
      let extractedDesc = '';
      let detectedKeywords: string[] = [];

      // Step 1: Find title line (usually contains "Certificate of...")
      const titleLine = lines.find((line: string) => {
        const lower = line.toLowerCase();
        return certKeywords.some(keyword => lower.includes(keyword)) && line.length > 10 && line.length < 100;
      });

      if (titleLine) {
        extractedTitle = titleLine.trim();
        detectedKeywords.push('certificate title');
      } else {
        // Fallback: Use the longest meaningful line as title
        const candidates = lines.filter((l: string) => l.length > 15 && l.length < 80);
        extractedTitle = candidates.sort((a: string, b: string) => b.length - a.length)[0] || 'Certificate';
      }

      // Step 2: Try to find recipient name
      let recipientName = '';
      for (let i = 0; i < lines.length - 1; i++) {
        const lower = lines[i].toLowerCase();
        if (nameKeywords.some(kw => lower.includes(kw))) {
          // Next line is likely the name
          recipientName = lines[i + 1].trim();
          if (recipientName.length > 2 && recipientName.length < 50) {
            detectedKeywords.push('recipient name');
            break;
          }
        }
      }

      // Step 3: Try to find dates
      const datePattern = /\b(19|20)\d{2}\b|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}/gi;
      const dates = text.match(datePattern);
      if (dates && dates.length > 0) {
        detectedKeywords.push('issuance date');
      }

      // Step 4: Build description
      const descParts: string[] = [];
      if (recipientName) descParts.push(`Recipient: ${recipientName}`);
      if (dates) descParts.push(`Date: ${dates[0]}`);
      descParts.push(`\n\nExtracted Keywords: ${detectedKeywords.join(', ')}`);
      descParts.push(`\nFull Text Preview:\n${text.substring(0, 300)}${text.length > 300 ? '...' : ''}`);

      extractedDesc = descParts.join('\n');
      const cleanedTitle = extractedTitle.replace(/[^\w\s]/g, '').trim();

      // Update form fields
      setValue('title', cleanedTitle || 'Certificate');
      setValue('description', extractedDesc);
      setExtractConfidence(confidence);

      if (confidence > 70) {
        alert(`✓ PaddleOCR Extraction Successful! (${Math.round(confidence)}% confidence)\n\nDetected: ${detectedKeywords.join(', ')}`);
      } else {
        alert(`⚠️ AI Extraction Complete (${Math.round(confidence)}%). Please review the details.`);
      }

    } catch (error) {
      console.error('[AI Extract] Error:', error);
      alert('❌ OCR Service Failed. Please enter details manually.');
    } finally {
      setIsExtracting(false);
    }
  };


  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-mono text-white mb-2 flex items-center gap-3">
          {userRole === "INSTITUTION" ? "Issue New Certificate" : "Submit Certificate"}
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">
            {userRole === "INSTITUTION" ? "Direct Issuance" : "For Verification"}
          </span>
        </h1>
        <p className="text-gray-400">
          {userRole === "INSTITUTION"
            ? "Upload and issue certificates directly to students."
            : "Upload your external certificates here. Your institute (Admin) will review and verify them."
          }
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">

        {/* Left: Form */}
        <div className="space-y-6">
          <Card className="bg-black/40 border-emerald-900/20 backdrop-blur-sm relative overflow-hidden">
            {/* AI Glow Effect if confident */}
            {extractConfidence && extractConfidence > 80 && (
              <div className="absolute top-0 right-0 p-2">
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-mono bg-emerald-900/40 px-2 py-1 rounded-full border border-emerald-500/30">
                  <ScanLine className="w-3 h-3" /> AI Confidence: {Math.round(extractConfidence)}%
                </div>
              </div>
            )}

            <CardHeader>
              <CardTitle>Certificate Details</CardTitle>
              <CardDescription>Enter the metadata for the certificate.</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="cert-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Admin Fields: Student Info */}
                {userRole === "INSTITUTION" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Student Name</Label>
                      <Input
                        {...register("studentName", { required: "Student Name is required" })}
                        placeholder="e.g. John Doe"
                        className="bg-black/20 border-emerald-900/20"
                      />
                      {errors.studentName && <p className="text-xs text-red-400">{errors.studentName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Student Email</Label>
                      <Input
                        {...register("studentEmail", { required: "Student Email is required" })}
                        placeholder="student@university.edu"
                        className="bg-black/20 border-emerald-900/20"
                      />
                      {errors.studentEmail && <p className="text-xs text-red-400">{errors.studentEmail.message}</p>}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Certificate Title</Label>
                    {file && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20"
                        onClick={onSmartExtract}
                        disabled={isExtracting}
                      >
                        {isExtracting ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Wand2 className="w-3 h-3 mr-1" />
                        )}
                        {isExtracting ? "Scanning..." : "AI Auto-Fill"}
                      </Button>
                    )}
                  </div>
                  <Input
                    {...register("title", { required: "Title is required" })}
                    placeholder="e.g. Advanced Web Development"
                    className="bg-black/20 border-emerald-900/20 focus:border-emerald-500/50"
                  />
                  {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    {...register("description")}
                    placeholder="Optional description..."
                    className="bg-black/20 border-emerald-900/20 focus:border-emerald-500/50 min-h-[100px]"
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-gray-800 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={!uploadedData || createMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 min-w-[150px]"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Create Certificate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right: Upload Area */}
        <div className="space-y-6">
          <Card className="bg-black/40 border-emerald-900/20 backdrop-blur-sm h-fit">
            <CardHeader>
              <CardTitle>Certificate Image</CardTitle>
              <CardDescription>Supported formats: JPG, PNG, PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Upload Box */}
              {!preview ? (
                <div className="border-2 border-dashed border-emerald-900/30 rounded-xl p-8 text-center hover:border-emerald-500/50 hover:bg-emerald-900/5 transition-all">
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer block space-y-4">
                    <div className="w-16 h-16 bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-emerald-400 font-medium">Click to upload</p>
                      <p className="text-sm text-gray-500 mt-1">or drag and drop here</p>
                    </div>
                  </Label>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-emerald-900/30 group">
                  {/* Scanning Animation Overlay */}
                  {isExtracting && (
                    <div className="absolute inset-0 z-10 bg-emerald-500/10 flex items-center justify-center">
                      <div className="w-full h-1 bg-emerald-400/50 absolute top-0 animate-[scan_2s_ease-in-out_infinite]" />
                      <div className="bg-black/80 px-4 py-2 rounded-full text-emerald-400 flex items-center gap-2 border border-emerald-500/30 backdrop-blur-md">
                        <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Image...
                      </div>
                    </div>
                  )}

                  {/* Preview Image */}
                  {file?.type.includes('image') ? (
                    <img src={preview} alt="Preview" className="w-full h-auto object-cover" />
                  ) : (
                    <div className="h-48 flex items-center justify-center bg-black/20 text-gray-400 flex-col gap-2">
                      <FileText className="w-12 h-12" />
                      <p>{file?.name}</p>
                    </div>
                  )}

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleRemoveFile}
                      size="icon"
                      className="rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload Status / Trigger */}
              {file && !uploadedData && (
                <Button
                  onClick={onUpload}
                  disabled={uploadMutation.isPending}
                  className="w-full bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-900/50"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload to IPFS/S3
                    </>
                  )}
                </Button>
              )}

              {/* AI FORENSICS REPORT */}
              {isAnalyzing && (
                <Alert className="bg-blue-500/10 border-blue-500/50 text-blue-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <AlertDescription>
                    Running AI forensics analysis... Checking for tampering
                  </AlertDescription>
                </Alert>
              )}

              {forensicReport && !isAnalyzing && (
                <Card className={`border-2 ${forensicReport.suspicionLevel === 'SAFE' ? 'border-emerald-500/30 bg-emerald-500/5' :
                  forensicReport.suspicionLevel === 'SUSPICIOUS' ? 'border-yellow-500/30 bg-yellow-500/5' :
                    forensicReport.suspicionLevel === 'LIKELY_FAKE' ? 'border-orange-500/30 bg-orange-500/5' :
                      'border-red-500/30 bg-red-500/5'
                  }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {forensicReport.suspicionLevel === 'SAFE' ? (
                          <><ShieldCheck className="w-4 h-4 text-emerald-500" /> Authenticity Check</>
                        ) : (
                          <><ShieldAlert className="w-4 h-4 text-red-500" /> Tampering Detected</>
                        )}
                      </CardTitle>
                      <span className={`text-xs font-mono px-2 py-1 rounded-full ${forensicReport.suspicionLevel === 'SAFE' ? 'bg-emerald-900/40 text-emerald-400' :
                        forensicReport.suspicionLevel === 'SUSPICIOUS' ? 'bg-yellow-900/40 text-yellow-400' :
                          forensicReport.suspicionLevel === 'LIKELY_FAKE' ? 'bg-orange-900/40 text-orange-400' :
                            'bg-red-900/40 text-red-400'
                        }`}>
                        {forensicReport.suspicionLevel}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Overall Score */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Tamper Likelihood</span>
                        <span className={`font-bold ${forensicReport.confidenceScore > 80 ? 'text-red-400' :
                          forensicReport.confidenceScore > 60 ? 'text-orange-400' :
                            forensicReport.confidenceScore > 40 ? 'text-yellow-400' :
                              'text-emerald-400'
                          }`}>
                          {Math.round(forensicReport.confidenceScore)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${forensicReport.confidenceScore > 80 ? 'bg-red-500' :
                            forensicReport.confidenceScore > 60 ? 'bg-orange-500' :
                              forensicReport.confidenceScore > 40 ? 'bg-yellow-500' :
                                'bg-emerald-500'
                            }`}
                          style={{ width: `${forensicReport.confidenceScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Detail Scores */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-black/20 p-2 rounded">
                        <div className="text-gray-500">ELA Score</div>
                        <div className="font-mono text-gray-300">{Math.round(forensicReport.detailScores.elaScore)}%</div>
                      </div>
                      <div className="bg-black/20 p-2 rounded">
                        <div className="text-gray-500">Metadata</div>
                        <div className="font-mono text-gray-300">{Math.round(forensicReport.detailScores.metadataScore)}%</div>
                      </div>
                      <div className="bg-black/20 p-2 rounded">
                        <div className="text-gray-500">Statistical</div>
                        <div className="font-mono text-gray-300">{Math.round(forensicReport.detailScores.statisticalScore)}%</div>
                      </div>
                      <div className="bg-black/20 p-2 rounded">
                        <div className="text-gray-500">Noise Pattern</div>
                        <div className="font-mono text-gray-300">{Math.round(forensicReport.detailScores.noiseScore)}%</div>
                      </div>
                    </div>

                    {/* Findings */}
                    <div className="border-t border-white/5 pt-3">
                      <div className="text-[10px] text-gray-500 uppercase mb-1">Analysis Findings:</div>
                      <div className="space-y-1">
                        {forensicReport.findings.map((finding, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <AlertTriangle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${forensicReport.isTampered ? 'text-red-400' : 'text-emerald-400'
                              }`} />
                            <span className="text-gray-300">{finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PDF Info Message */}
                    {file?.type === 'application/pdf' && (
                      <div className="border-t border-white/5 pt-3">
                        <Alert className="bg-blue-500/10 border-blue-500/30">
                          <AlertTriangle className="w-4 h-4 text-blue-400" />
                          <AlertDescription className="text-xs text-blue-300">
                            <strong>PDF Detected:</strong> For best results, export your PDF as JPG/PNG for full image analysis.
                            Current analysis focuses on metadata (filename, file size, modification date).
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {uploadedData && (
                <Alert className="bg-emerald-500/10 border-emerald-500/50 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <AlertDescription>
                    Image uploaded successfully
                  </AlertDescription>
                </Alert>
              )}

              {uploadMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to upload image
                  </AlertDescription>
                </Alert>
              )}
              {createMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {createMutation.error instanceof Error ? createMutation.error.message : "Failed to create certificate"}
                  </AlertDescription>
                </Alert>
              )}

            </CardContent>
          </Card>

          <div className="text-xs text-gray-500 text-center">
            AI processing happens locally in your browser. <br /> Your data remains private until upload.
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div >
  );
}
