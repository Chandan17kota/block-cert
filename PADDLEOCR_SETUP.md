# PaddleOCR Model Download & Setup Guide

## Problem
PaddleOCR fails with:
```
Checking connectivity to the model hosters, this may take a while.
```

This happens because PaddleOCR tries to download models from the internet on first run.

## Solutions

### Solution 1: Auto-Setup (RECOMMENDED)
The system now automatically:
1. ✅ Disables model source check: `PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True`
2. ✅ Sets download path: `~/.paddleocr`
3. ✅ Increases timeout: 120 seconds (allows model download)
4. ✅ Handles errors gracefully

**No additional setup needed!** Just upload a certificate and the models will download on first run.

---

### Solution 2: Pre-Download Models (Manual Setup)
If you want to pre-download models before deployment:

#### Step 1: Create Python Script
Create `scripts/download_models.py`:

```python
#!/usr/bin/env python3
"""
Pre-download PaddleOCR models to avoid runtime delays
"""
import os
os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'

from paddleocr import PaddleOCR
import sys

print("[Model Download] Starting PaddleOCR model download...")
print("[Model Download] This may take 5-10 minutes on first run...")

try:
    # Initialize OCR - this downloads all needed models
    ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
    print("[Model Download] ✅ Models downloaded successfully!")
    print("[Model Download] Models stored in: ~/.paddleocr")
    sys.exit(0)
except Exception as e:
    print(f"[Model Download] ❌ Failed to download models: {e}")
    sys.exit(1)
```

#### Step 2: Run Pre-Download
```bash
python scripts/download_models.py
```

This will download:
- PP-OCRv4 Detection model (~150MB)
- PP-OCRv4 Recognition model (~150MB)
- Angle Classifier model (~50MB)

**Total:** ~350MB

---

### Solution 3: Using Pre-Downloaded Models
If models are already downloaded to `~/.paddleocr`, they will be used automatically.

To check if models exist:
```bash
ls ~/.paddleocr  # Linux/Mac
dir %USERPROFILE%\.paddleocr  # Windows
```

---

## Environment Variables

The system automatically sets these:

```
PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True
  → Skip model hosters connectivity check

PADDLEOCR_DOWNLOAD_PATH=~/.paddleocr
  → Where to store downloaded models

PADDLE_ENABLE_INFERENCE=True
  → Enable inference mode

TF_CPP_MIN_LOG_LEVEL=2
  → Suppress TensorFlow warnings
```

---

## First-Run Timeline

### Without Pre-Downloaded Models:
1. File Upload: ~1 second
2. Model Download: ~3-5 minutes (first time only)
3. OCR Extraction: ~3 seconds
4. Image Authenticity: ~2 seconds
5. Text Consistency: ~3 seconds
6. Layout Analysis: ~2 seconds
7. **Total First Run:** ~5-6 minutes

### After Models Downloaded:
1. File Upload: ~1 second
2. OCR Extraction: ~3 seconds
3. Image Authenticity: ~2 seconds
4. Text Consistency: ~3 seconds
5. Layout Analysis: ~2 seconds
6. **Total:** ~12 seconds

---

## Troubleshooting

### Issue: Still timing out after 120 seconds
**Solution:** Pre-download models manually
```bash
python scripts/download_models.py
```

### Issue: "Connection refused" for model hosters
**Solution:** Already handled - system disables connectivity check
- Verify: `PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True` in environment
- Check: Models in `~/.paddleocr` directory

### Issue: Models not found after download
**Solution:** Check download path
```bash
# Linux/Mac
ls -la ~/.paddleocr

# Windows PowerShell
Get-ChildItem -Path $env:USERPROFILE\.paddleocr -Recurse
```

### Issue: Disk space
**Needed:** 500MB minimum
- Model files: ~350MB
- Cache/temp: ~150MB

---

## Production Deployment

### For Docker:
```dockerfile
# Pre-download models during build
RUN python scripts/download_models.py

# Models persist in container image
ENV PADDLEOCR_DOWNLOAD_PATH=/root/.paddleocr
```

### For Server:
```bash
# Run once during setup
python scripts/download_models.py

# Subsequent runs use cached models
# No downloads needed!
```

### For Cloud Functions (AWS Lambda, Google Cloud):
1. Package `~/.paddleocr` in deployment
2. Or use increased timeout (120+ seconds)
3. Or download on first deployment

---

## Verification

Test that everything works:

```bash
# Test OCR extraction
python scripts/ai_risk_engine.py extract test_image.jpg

# Test full analysis
python scripts/ai_risk_engine.py analyze test_image.jpg
```

Expected output:
```json
{
  "final_score": 75.5,
  "status": "SUSPICIOUS",
  "details": {...}
}
```

---

## Latest Changes

### ✅ Automatic Error Handling
- Disables model connectivity check
- Sets proper environment variables
- Handles OCR loading failures gracefully
- Increased timeout to 120 seconds
- Detailed progress logging

### ✅ Better Error Messages
- Clear error types: OCR_ERROR, ANALYSIS_ERROR, FATAL_ERROR
- Error details in JSON response
- Stderr logging with [AI Engine] prefix

### ✅ Fallback Configuration
- If angle classification fails, continues without it
- Graceful degradation instead of hard failure

---

**Status:** ✅ Ready for Production  
**Models:** Auto-download on first use  
**Timeout:** 120 seconds (model loading included)
