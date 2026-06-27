
import { riskModel } from './riskModel';
import { neuralModel } from './neuralModel';
import { multiLayerVerificationEngine } from './multiLayerVerification';
import Groq from 'groq-sdk';

/**
 * TRUELEDGER COGNITIVE ENGINE v6.0 (Groq-Powered + PaddleOCR Integration)
 * This engine uses Groq's LPU inference engine to generate dynamic, data-aware responses.
 * 
 * NEW: PaddleOCR Integration for certificate auto-fill
 * - Extracts text from uploaded certificate
 * - Automatically fills certificate form fields
 * - Uses layout information for intelligent field mapping
 */

interface DataContext {
    stats: {
        total?: number;
        PENDING?: number;
        APPROVED?: number;
        VERIFIED?: number;
        REJECTED?: number;
    };
    recent: any[];
    user: {
        id: string;
        email: string;
        fullName: string;
        institutionname: string | null;
    };
}

interface SynthesisData {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    velocity: string;
    riskAvg: number;
}

export class CognitiveBrain {
    private systemPrompt: string = `
        You are TrueLedger AI, a secure, expert assistant for a Blockchain Certificate Platform.
        Your role is to analyze certificate data, detect fraud risks, and assist users (Admins, Students, Verifiers).
        
        You have access to a "Data Context" containing the user's certificate stats and recent activity.
        You can also extract and analyze certificate text using PaddleOCR for intelligent form auto-filling.
        
        RESPONSE FORMAT:
        You must ALWAYS respond with a valid JSON object. Do not include markdown code blocks.
        The JSON structure must be:
        {
            "response": "Your helpful, natural language answer here.",
            "reasoning_path": "A technical description of your thought process (e.g., INTENT -> DATA_CHECK -> RESPONSE)",
            "suggested_action": "A short, actionable next step for the user.",
             "intent": "The identified intent (e.g., STATISTICAL_ANALYSIS, SECURITY_FORENSICS, CERTIFICATE_AUTOFILL)"
        }
    `;

    /**
     * NEW: Extract certificate data using PaddleOCR for auto-fill
     * 
     * Process:
     * 1. Call PaddleOCR to extract text from certificate image
     * 2. Parse text to identify certificate fields
     * 3. Use layout information for field mapping
     * 4. Return structured certificate data for auto-filling form
     */
    public async autofillCertificateFromImage(file: File): Promise<{
        success: boolean;
        extractedData: {
            certificateTitle?: string;
            holderName?: string;
            organization?: string;
            issueDate?: string;
            certificateId?: string;
            description?: string;
            rawText: string;
            ocrConfidence: number;
        };
        recommendation: string;
        error?: string;
    }> {
        try {
            console.log('[CognitiveBrain] Starting certificate auto-fill extraction');

            // Use multi-layer verification engine to extract text with PaddleOCR
            const ocrData = await multiLayerVerificationEngine.extractText(file);

            // Parse extracted text to identify certificate fields
            const parsedData = this.parseCertificateText(ocrData.text, ocrData.layout);

            return {
                success: true,
                extractedData: {
                    certificateTitle: parsedData.certificateTitle,
                    holderName: parsedData.holderName,
                    organization: parsedData.organization,
                    issueDate: parsedData.issueDate,
                    certificateId: parsedData.certificateId,
                    description: parsedData.description,
                    rawText: ocrData.text,
                    ocrConfidence: ocrData.confidence * 100
                },
                recommendation: this.getExtractionRecommendation(ocrData.confidence)
            };
        } catch (error) {
            console.error('[CognitiveBrain] Auto-fill extraction error:', error);
            return {
                success: false,
                extractedData: {
                    rawText: '',
                    ocrConfidence: 0
                },
                error: error instanceof Error ? error.message : 'Failed to extract certificate data',
                recommendation: 'Please upload a clear image of your certificate and try again.'
            };
        }
    }

    /**
     * Parse certificate text to extract key fields
     * Uses layout information for intelligent field mapping
     */
    private parseCertificateText(
        text: string,
        layout: Array<{ text: string; y_position: number; confidence: number }>
    ): {
        certificateTitle?: string;
        holderName?: string;
        organization?: string;
        issueDate?: string;
        certificateId?: string;
        description?: string;
    } {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        // Field extraction patterns
        const certificateTitlePatterns = [
            /certificate of (completion|achievement|.*)/i,
            /.*certificate/i,
            /diploma|degree/i
        ];

        const datePatterns = [
            /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
            /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})[,\s]+(\d{4})/i
        ];

        const certificateIdPatterns = [
            /certificate\s*(?:id|number|#)?[:\s]+([A-Z0-9\-]+)/i,
            /cert(?:ificate)?\s*(?:no|number)?[:\s]+([A-Z0-9\-]+)/i
        ];

        let extractedData = {
            certificateTitle: undefined as string | undefined,
            holderName: undefined as string | undefined,
            organization: undefined as string | undefined,
            issueDate: undefined as string | undefined,
            certificateId: undefined as string | undefined,
            description: undefined as string | undefined
        };

        // Extract title (usually first significant line)
        for (const pattern of certificateTitlePatterns) {
            for (const line of lines.slice(0, 5)) {
                const match = line.match(pattern);
                if (match) {
                    extractedData.certificateTitle = line;
                    break;
                }
            }
            if (extractedData.certificateTitle) break;
        }

        // Extract holder name (look for "This is to certify that", "Awarded to", etc.)
        const nameIndicators = /(?:certify that|awarded to|presented to|hereby awarded to|is pleased to present)\s+([A-Za-z\s]+)/i;
        for (const line of lines) {
            const match = line.match(nameIndicators);
            if (match) {
                extractedData.holderName = match[1].trim();
                break;
            }
        }

        // Extract organization (look for institution/organization keywords)
        const orgKeywords = ['university', 'institute', 'college', 'academy', 'school', 'organization', 'company'];
        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            if (orgKeywords.some(k => lowerLine.includes(k))) {
                extractedData.organization = line;
                break;
            }
        }

        // Extract date
        for (const line of lines) {
            const match = line.match(datePatterns[0]) || line.match(datePatterns[1]);
            if (match) {
                extractedData.issueDate = line;
                break;
            }
        }

        // Extract certificate ID
        for (const line of lines) {
            for (const pattern of certificateIdPatterns) {
                const match = line.match(pattern);
                if (match) {
                    extractedData.certificateId = match[1];
                    break;
                }
            }
            if (extractedData.certificateId) break;
        }

        // Use last few lines as description
        if (lines.length > 3) {
            extractedData.description = lines.slice(-3).join(' ');
        }

        return extractedData;
    }

    /**
     * Generate extraction quality recommendation
     */
    private getExtractionRecommendation(ocrConfidence: number): string {
        if (ocrConfidence > 0.85) {
            return '✅ High confidence extraction. You can proceed with auto-filled data.';
        } else if (ocrConfidence > 0.70) {
            return '⚠️ Moderate confidence. Please review extracted data and make corrections if needed.';
        } else {
            return '⚠️ Low confidence extraction. Image quality may be poor. Please manually review and correct all fields.';
        }
    }

    public async reason(query: string, dataContext: DataContext) {
        // Initialize Groq inside the method to ensure env vars are loaded and freshest
        const apiKey = process.env.GROQ_API_KEY;
        console.log(`[CognitiveBrain] Reasoning request. Key present: ${!!apiKey}`);

        if (!apiKey || apiKey.includes('missing_key')) {
            console.error("[CognitiveBrain] Missing API Key immediately detected.");
            return this.fallbackReason(query, dataContext);
        }

        const groq = new Groq({ apiKey });

        try {
            // Stage 1: Data Synthesis
            const synthesis = this.synthesizeData(dataContext);
            const contextString = JSON.stringify({
                user: dataContext.user.fullName,
                role: dataContext.user.institutionname ? "INSTITUTION" : "USER",
                stats: synthesis,
                recent_activity_sample: dataContext.recent.slice(0, 3).map(c => `${c.title} (${c.status}, Risk: ${c.riskScore}%)`)
            });

            // Stage 2: Groq Inference
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: this.systemPrompt },
                    { role: "system", content: `CURRENT DATA CONTEXT: ${contextString}` },
                    { role: "user", content: query }
                ],
                model: "llama3-70b-8192", // High performance model
                temperature: 0.5,
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) throw new Error("No content from Groq");

            const parsed = JSON.parse(content);

            return {
                content: parsed.response,
                metadata: {
                    intent: parsed.intent || "GENERAL_AI",
                    confidence: 0.99,
                    reasoning_path: parsed.reasoning_path || "LLM -> INFERENCE",
                    suggested_action: parsed.suggested_action || "Ask anything else.",
                    model_version: "GROQ_LLAMA3_70B"
                }
            };

        } catch (error) {
            console.error("Groq Brain Error:", error);
            // Fallback to simple logic if API fails or key is missing
            return this.fallbackReason(query, dataContext);
        }
    }

    private synthesizeData(ctx: DataContext): SynthesisData {
        const { stats, recent } = ctx;
        const total = stats.total || 0;
        const pending = stats.PENDING || 0;
        const approved = (stats.APPROVED || 0) + (stats.VERIFIED || 0);
        const rejected = stats.REJECTED || 0;

        const riskAvg = recent.length > 0
            ? recent.reduce((acc: number, curr: any) => acc + (curr.riskScore || 0), 0) / recent.length
            : 0;

        return {
            total,
            pending,
            approved,
            rejected,
            velocity: recent.length > 0 ? "STABLE" : "INACTIVE",
            riskAvg
        };
    }

    private fallbackReason(query: string, ctx: DataContext) {
        // Simple fallback to ensure app doesn't crash without API key
        return {
            content: "I am currently running in offline mode. Please check your system configuration (GROQ_API_KEY).",
            metadata: {
                intent: "SYSTEM_OFFLINE",
                confidence: 1.0,
                reasoning_path: "ERROR -> FALLBACK",
                suggested_action: "Configure API Keys",
                model_version: "OFFLINE_FALLBACK"
            }
        };
    }
}

export const brain = new CognitiveBrain();
