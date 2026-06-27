import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

const PYTHON_SCRIPT_PATH = path.join(process.cwd(), 'scripts', 'ai_risk_engine.py');

/**
 * TRUELEDGER AI Engine v2.0
 * Bridge between TypeScript/Next.js and Python AI Services
 * 
 * Features:
 * - PaddleOCR text extraction
 * - EfficientNet-B3 image authenticity
 * - DistilBERT text consistency
 * - Siamese CNN layout similarity
 * - Weighted confidence scoring
 */

export interface AIAnalysisResult {
    final_score: number;
    status: 'FAKE' | 'SUSPICIOUS' | 'LIKELY_ORIGINAL';
    confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
    ocr_data: {
        extracted_text: string;
        ocr_confidence: number;
        word_count: number;
    };
    details: {
        image_authenticity: number;
        text_consistency: number;
        layout_similarity: number;
    };
    weights: {
        image_authenticity: number;
        text_consistency: number;
        layout_similarity: number;
    };
    findings: string[];
}

export interface OCRExtractionResult {
    text: string;
    confidence: number;
    lines: string[];
    confidences: number[];
    bboxes: number[][][];
    layout: Array<{
        text: string;
        y_position: number;
        confidence: number;
    }>;
    total_words: number;
}

async function runPythonScript(mode: 'extract' | 'analyze', imagePath: string): Promise<any> {
    // Detect local venv for better isolation
    const venvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
    let pythonCommand = process.env.PYTHON_PATH || 'python';

    try {
        await fs.access(venvPython);
        console.log(`[Python Bridge] Using local venv: ${venvPython}`);
        pythonCommand = venvPython;
    } catch {
        console.log(`[Python Bridge] Using system python: ${pythonCommand}`);
    }

    return new Promise((resolve, reject) => {
        // Set environment variables to disable model source checks
        const env = {
            ...process.env,
            PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK: 'True',
            PADDLEOCR_DOWNLOAD_PATH: require('path').join(require('os').homedir(), '.paddleocr'),
            PADDLE_ENABLE_INFERENCE: 'True',
            TF_CPP_MIN_LOG_LEVEL: '2'
        };

        const pythonProcess = spawn(pythonCommand, [PYTHON_SCRIPT_PATH, mode, `"${imagePath}"`], { env });

        let dataString = '';

        console.log(`[Python Bridge] Executing: python ${PYTHON_SCRIPT_PATH} ${mode} ...`);
        console.log(`[Python Bridge] Environment: PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True`);

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });


        pythonProcess.stderr.on('data', (data) => {
            const msg = data.toString();
            // ML frameworks output warnings to stderr - this is normal, not an error
            console.log(`[Python Warning] ${msg.trim()}`);
        });

        pythonProcess.on('error', (err) => {
            console.error(`[Python Bridge] Failed to start python process: ${err.message}`);
            reject(new Error(`Failed to start Python process. Make sure 'python' is installed and in your PATH. Details: ${err.message}`));
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`[Python Bridge] Script exited with code ${code}`);
                reject(new Error(`AI Engine Failed (Exit Code ${code})`));
                return;
            }

            try {
                // Parse the last line primarily (in case of other stdout logs)
                const lines = dataString.trim().split('\n');
                const lastLine = lines[lines.length - 1];
                const result = JSON.parse(lastLine);

                // Check if result contains error
                if (result.error) {
                    reject(new Error(`Python Engine Error: ${result.error}`));
                    return;
                }

                resolve(result);
            } catch (e) {
                reject(new Error(`Failed to parse Python output: ${e}`));
            }
        });

        // Timeout after 120 seconds (increased from 60 for model loading)
        setTimeout(() => {
            pythonProcess.kill();
            reject(new Error('Python script execution timeout (120s) - models may still be downloading'));
        }, 120000);
    });
}

export const aiEngine = {
    /**
     * Extract text from certificate using PaddleOCR
     * Returns text, confidence, and layout information
     */
    extractText: async (tempFilePath: string): Promise<OCRExtractionResult> => {
        return runPythonScript('extract', tempFilePath);
    },

    /**
     * Comprehensive multi-layer certificate analysis
     * 
     * Layers:
     * 1. PaddleOCR - Text extraction
     * 2. EfficientNet-B3 - Image authenticity
     * 3. DistilBERT - Text consistency
     * 4. Siamese CNN - Layout similarity
     * 5. Weighted scoring
     * 
     * Returns combined score (0-100)
     */
    analyzeImage: async (tempFilePath: string): Promise<AIAnalysisResult> => {
        return runPythonScript('analyze', tempFilePath);
    }
};

