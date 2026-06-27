import { NextRequest, NextResponse } from 'next/server';
import { aiEngine } from '@/lib/ai/pythonBridge';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * POST /api/ai/analyze-image
 * 
 * Multi-Layer Certificate Verification System
 * 
 * Performs comprehensive analysis:
 * 1. PaddleOCR - Text extraction from certificate
 * 2. EfficientNet-B3 - Image authenticity detection
 * 3. DistilBERT - Text consistency validation
 * 4. Siamese CNN - Layout and template similarity
 * 5. Weighted confidence scoring
 * 
 * Returns:
 * - Final originality score (0-100%)
 * - Component scores for each layer
 * - Detailed findings and recommendations
 */
export async function POST(request: NextRequest) {
    let tempPath = '';

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Save file temporarily
        const buffer = Buffer.from(await file.arrayBuffer());
        const tempDir = os.tmpdir();
        const fileName = `forensics_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        tempPath = path.join(tempDir, fileName);

        await writeFile(tempPath, buffer);

        // Run Multi-Layer Analysis via Python Engine
        // Layers: PaddleOCR → EfficientNet-B3 → DistilBERT → Siamese CNN → Weighted Score
        const analysis = await aiEngine.analyzeImage(tempPath);

        // Map Python result to frontend format
        const responseData = {
            // File metadata
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,

            // Overall assessment
            finalScore: analysis.final_score, // 0-100%
            status: analysis.status, // FAKE | SUSPICIOUS | LIKELY_ORIGINAL
            isSuspicious: analysis.final_score < 65,
            riskScore: 100 - analysis.final_score, // Risk inverse of authenticity
            confidenceLevel: analysis.confidence_level,

            // Component scores (each 0-100%)
            componentScores: {
                imageAuthenticity: analysis.details.image_authenticity,
                textConsistency: analysis.details.text_consistency,
                layoutSimilarity: analysis.details.layout_similarity
            },

            // Scoring weights
            weights: analysis.weights,

            // OCR data
            ocrData: analysis.ocr_data,

            // Findings and analysis
            findings: analysis.findings,

            // User-friendly message
            message: getStatusMessage(analysis.status, analysis.final_score),

            // Recommendation
            recommendation: getRecommendation(analysis.status, analysis.final_score, analysis.findings)
        };

        return NextResponse.json({
            success: true,
            analysis: responseData
        });

    } catch (error: any) {
        console.error('[AI Analysis] Error:', error);
        return NextResponse.json(
            {
                error: error.message || 'Analysis failed',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    } finally {
        if (tempPath) {
            try { await unlink(tempPath); } catch (e) { /* ignore cleanup errors */ }
        }
    }
}

/**
 * Generate user-friendly status message
 */
function getStatusMessage(status: string, score: number): string {
    switch (status) {
        case 'LIKELY_ORIGINAL':
            return `✅ Certificate passed advanced authenticity verification (${score}% confidence).`;
        case 'SUSPICIOUS':
            return `⚠️ Certificate flagged with moderate suspicion (${score}% confidence). Manual review recommended.`;
        case 'FAKE':
            return `❌ Certificate flagged as likely fake (${score}% confidence). Institutional verification required.`;
        default:
            return 'Certificate analysis status unknown.';
    }
}

/**
 * Generate actionable recommendation
 */
function getRecommendation(status: string, score: number, findings: string[]): string {
    const recommendations: Record<string, string> = {
        'LIKELY_ORIGINAL': 'Certificate is suitable for processing. Store verification metadata on blockchain.',
        'SUSPICIOUS': 'Contact certificate issuer for verification. Request official documentation as backup.',
        'FAKE': 'REJECT: Contact issuer and student immediately. Document suspicious findings for audit trail.'
    };

    return recommendations[status] || 'Manual review required.';
}

