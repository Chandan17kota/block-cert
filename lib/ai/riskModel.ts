
/**
 * TRUELEDGER AI FORENSIC MODEL v2.0
 * Multi-Layer Certificate Verification System
 * 
 * Architecture:
 * 1. PaddleOCR (Text Extraction)
 * 2. EfficientNet-B3 (Image Authenticity)
 * 3. DistilBERT (Text Consistency)
 * 4. Siamese CNN (Layout Similarity)
 * 5. Weighted Confidence Score
 */

// =============================================================================
// LAYER SCORING INTERFACES
// =============================================================================

export interface OCRData {
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

export interface ImageAuthenticityScore {
    score: number; // 0-1 (1.0 = Most Likely Original)
    percentage: number; // 0-100
    assessment: 'AUTHENTIC' | 'SUSPICIOUS' | 'LIKELY_FAKE';
    details: {
        background_analysis: string;
        logo_detection: string;
        stamp_authenticity: string;
        signature_patterns: string;
    };
}

export interface TextConsistencyScore {
    score: number; // 0-1
    percentage: number; // 0-100
    assessment: 'CONSISTENT' | 'UNCERTAIN' | 'INCONSISTENT';
    details: {
        grammar_validity: boolean;
        semantic_coherence: number;
        organization_credibility: boolean;
        template_match: boolean;
        red_flags_detected: string[];
    };
}

export interface LayoutSimilarityScore {
    score: number; // 0-1
    percentage: number; // 0-100
    assessment: 'MATCHES_TEMPLATE' | 'PARTIALLY_MATCHES' | 'NO_MATCH';
    details: {
        logo_position_match: boolean;
        heading_alignment: number;
        font_spacing_consistency: number;
        seal_placement: boolean;
        edge_density: number;
        circles_detected: number;
    };
}

export interface MultiLayerReport {
    final_score: number; // 0-100
    final_status: 'FAKE' | 'SUSPICIOUS' | 'LIKELY_ORIGINAL';
    confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
    ocr_data: OCRData;
    image_authenticity: ImageAuthenticityScore;
    text_consistency: TextConsistencyScore;
    layout_similarity: LayoutSimilarityScore;
    weights: {
        image_authenticity: number; // 0.45
        text_consistency: number; // 0.35
        layout_similarity: number; // 0.20
    };
    findings: string[];
    recommendation: string;
}

export interface TrainingSample {
    text: string;
    isFraud: boolean;
}

// =============================================================================
// LEGACY RISK MODEL (KEPT FOR BACKWARDS COMPATIBILITY)
// =============================================================================

export class CertificateRiskModel {
    private weights: Map<string, number> = new Map();
    private threshold: number = 0.5;
    private accuracy: number = 0;

    // Expanded Training Data (60+ samples for better accuracy)
    private static TRAINING_DATA: TrainingSample[] = [
        // === LEGITIMATE CERTIFICATES (40 samples) ===
        // Completion Certificates
        { text: "Certificate of Completion", isFraud: false },
        { text: "Course Completion Certificate", isFraud: false },
        { text: "Training Completion Award", isFraud: false },
        { text: "Program Completion Recognition", isFraud: false },
        { text: "Bootcamp Completion Certificate", isFraud: false },

        // Academic Degrees
        { text: "Bachelor of Science Degree", isFraud: false },
        { text: "Master of Arts Certificate", isFraud: false },
        { text: "Doctor of Philosophy Certification", isFraud: false },
        { text: "University Degree Certificate", isFraud: false },
        { text: "Graduate Diploma Award", isFraud: false },
        { text: "Associate Degree Transcript", isFraud: false },

        // Professional Certifications
        { text: "Certified Software Engineer Professional", isFraud: false },
        { text: "Professional Scrum Master Certification", isFraud: false },
        { text: "AWS Certified Solutions Architect", isFraud: false },
        { text: "Google Cloud Professional Certificate", isFraud: false },
        { text: "Microsoft Certified Azure Developer", isFraud: false },
        { text: "Cisco Certified Network Associate", isFraud: false },
        { text: "PMP Project Management Professional", isFraud: false },
        { text: "Certified Public Accountant License", isFraud: false },

        // Academic Achievements
        { text: "Dean's List Honor Roll", isFraud: false },
        { text: "Academic Excellence Award", isFraud: false },
        { text: "Summa Cum Laude Graduation", isFraud: false },
        { text: "Scholarship Achievement Recognition", isFraud: false },
        { text: "Research Achievement Certificate", isFraud: false },

        // Course Certificates
        { text: "Advanced Web Development Course", isFraud: false },
        { text: "Data Science Specialization Track", isFraud: false },
        { text: "Machine Learning Workshop Certificate", isFraud: false },
        { text: "Digital Marketing Certified Course", isFraud: false },
        { text: "Python Programming Fundamentals", isFraud: false },
        { text: "Full Stack Developer Bootcamp", isFraud: false },

        // Official Documents
        { text: "Official University Transcript", isFraud: false },
        { text: "Verified Academic Record", isFraud: false },
        { text: "Authenticated Diploma Original", isFraud: false },
        { text: "Accredited Institution Certificate", isFraud: false },
        { text: "Registered Educational Document", isFraud: false },

        // Miscellaneous Legitimate
        { text: "Employee Training Recognition", isFraud: false },
        { text: "Workshop Participation Award", isFraud: false },
        { text: "Conference Speaker Certificate", isFraud: false },
        { text: "Volunteer Service Recognition", isFraud: false },
        { text: "Leadership Development Program", isFraud: false },

        // === FRAUDULENT CERTIFICATES (25 samples) ===
        // Fake/Buy Keywords
        { text: "Buy Degree Online Instant Approval", isFraud: true },
        { text: "Purchase Certificate Without Exam", isFraud: true },
        { text: "Buy Diploma Fast Delivery", isFraud: true },
        { text: "Get Certificate Without Study", isFraud: true },
        { text: "Buy University Degree Online", isFraud: true },

        // Fake/Counterfeit Keywords
        { text: "Fake University Degree Certificate", isFraud: true },
        { text: "Counterfeit Graduation Diploma", isFraud: true },
        { text: "Replica Official Transcript", isFraud: true },
        { text: "Forged Academic Document", isFraud: true },
        { text: "Fraudulent Certification Papers", isFraud: true },

        // Photoshop/Edit Keywords
        { text: "Photoshop Edited University Diploma", isFraud: true },
        { text: "Customized Fake Certificate Service", isFraud: true },
        { text: "Digital Edit Graduation Papers", isFraud: true },
        { text: "Template Based Fake Degree", isFraud: true },

        // Instant/Guaranteed Keywords
        { text: "Guaranteed Fake Certificate No Exam", isFraud: true },
        { text: "Instant Degree Certificate Generator", isFraud: true },
        { text: "Get Diploma Instantly Online", isFraud: true },
        { text: "Guaranteed Pass Certificate Maker", isFraud: true },
        { text: "Instant Certification Without Test", isFraud: true },

        // Unofficial/Unverified
        { text: "Unofficial Replica Document", isFraud: true },
        { text: "Unverified Certificate Copy", isFraud: true },
        { text: "Non Accredited Diploma Service", isFraud: true },
        { text: "Unregistered University Certificate", isFraud: true },

        // Suspicious Phrases
        { text: "No Questions Asked Certificate", isFraud: true },
        { text: "Backdated Graduation Document", isFraud: true },
        { text: "Novelty Diploma For Display", isFraud: true }
    ];

    private static TEST_DATA: TrainingSample[] = [
        { text: "Advanced React Development Certified", isFraud: false },
        { text: "Certificate of  Completion Software Training", isFraud: false },
        { text: "Harvard MBA Graduate Certificate", isFraud: false },
        { text: "Verified Professional Engineer License", isFraud: false },
        { text: "Fake Diploma From Harvard", isFraud: true },
        { text: "Buy Certificate With No Effort", isFraud: true },
        { text: "Photoshop Degree Service", isFraud: true },
        { text: "Instant University Diploma Generator", isFraud: true }
    ];

    constructor() {
        this.train();
    }

    /**
     * "Train" the model using simplified weighted keyword extraction
     */
    public train() {
        const fraudWords = new Map<string, number>();
        const safeWords = new Map<string, number>();

        CertificateRiskModel.TRAINING_DATA.forEach(sample => {
            const words = this.tokenize(sample.text);
            words.forEach(word => {
                if (sample.isFraud) {
                    fraudWords.set(word, (fraudWords.get(word) || 0) + 1);
                } else {
                    safeWords.set(word, (safeWords.get(word) || 0) + 1);
                }
            });
        });

        // Calculate weights
        const allWords = new Set([...fraudWords.keys(), ...safeWords.keys()]);
        allWords.forEach(word => {
            const fCount = fraudWords.get(word) || 0;
            const sCount = safeWords.get(word) || 0;
            // Higher weight = more risky
            const weight = (fCount + 1) / (fCount + sCount + 2);
            this.weights.set(word, weight);
        });

        this.validate();
    }

    private validate() {
        let correct = 0;
        CertificateRiskModel.TEST_DATA.forEach(test => {
            const score = this.predict(test.text);
            const isPredictedFraud = score > this.threshold;
            if (isPredictedFraud === test.isFraud) {
                correct++;
            }
        });
        this.accuracy = (correct / CertificateRiskModel.TEST_DATA.length) * 100;
        console.log(`[AI Model] Training complete. Accuracy: ${this.accuracy}%`);
    }

    private tokenize(text: string): string[] {
        return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    }

    /**
     * Prediction Engine
     * Returns a score between 0 (Safe) and 1 (High Risk)
     */
    public predict(text: string): number {
        const words = this.tokenize(text);
        if (words.length === 0) return 0;

        let totalWeight = 0;
        let hits = 0;

        words.forEach(word => {
            if (this.weights.has(word)) {
                totalWeight += this.weights.get(word)!;
                hits++;
            }
        });

        // Improved: More lenient for unknown words (default to low risk)
        if (hits === 0) return 0.05; // Very low baseline for unknown words
        if (hits < words.length * 0.3) return 0.1; // Low risk if most words are unknown

        return totalWeight / hits;
    }

    public getAccuracy(): number {
        return this.accuracy;
    }

    public getReport(text: string) {
        const score = this.predict(text);
        return {
            score: Math.round(score * 100),
            status: score > 0.7 ? "CRITICAL" : score > 0.5 ? "WARNING" : "SAFE",
            confidence: this.accuracy
        };
    }
}

// Singleton Instance
export const riskModel = new CertificateRiskModel();




// Singleton Instance

