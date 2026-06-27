
import { NextRequest, NextResponse } from 'next/server';
import { aiEngine } from '@/lib/ai/pythonBridge';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * POST /api/ai/extract-text
 * 
 * PaddleOCR Text Extraction
 * 
 * Extracts text from certificate with:
 * - Full text content
 * - Per-word confidence scores
 * - Bounding box coordinates
 * - Layout information for field mapping
 * 
 * Used for:
 * - Certificate auto-fill
 * - Text consistency analysis
 * - Field extraction
 */
export async function POST(request: NextRequest) {
    let tempPath = '';

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Save file temporarily for Python script
        const buffer = Buffer.from(await file.arrayBuffer());
        const tempDir = os.tmpdir();
        const fileName = `ocr_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        tempPath = path.join(tempDir, fileName);

        await writeFile(tempPath, buffer);

        // Run PaddleOCR via Python
        const result = await aiEngine.extractText(tempPath);

        return NextResponse.json({
            success: true,
            data: {
                // Full extracted text
                text: result.text,
                
                // Average OCR confidence (0-100%)
                confidence: (result.confidence * 100),
                
                // Individual lines
                lines: result.lines,
                
                // Per-line confidence scores
                lineConfidences: result.confidences,
                
                // Bounding boxes for each line [[x1,y1,x2,y2,...], ...]
                bboxes: result.bboxes,
                
                // Layout information for intelligent field mapping
                layout: result.layout,
                
                // Total word count
                wordCount: result.total_words,
                
                // Recommendation for field auto-fill
                recommendation: getExtractionRecommendation(result.confidence * 100)
            }
        });

    } catch (error: any) {
        console.error('[OCR API] Error:', error);
        return NextResponse.json(
            {
                error: error.message || 'Extraction failed',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    } finally {
        // Cleanup
        if (tempPath) {
            try { await unlink(tempPath); } catch (e) { console.error('Failed to cleanup temp file:', e); }
        }
    }
}

/**
 * Generate recommendation based on OCR confidence
 */
function getExtractionRecommendation(confidence: number): string {
    if (confidence > 85) {
        return '✅ High confidence - safe to auto-fill form fields';
    } else if (confidence > 70) {
        return '⚠️ Moderate confidence - review extracted data before submitting';
    } else {
        return '⚠️ Low confidence - manually correct extracted fields for accuracy';
    }
}
