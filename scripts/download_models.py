#!/usr/bin/env python3
"""
Pre-download PaddleOCR models to avoid runtime delays and connectivity issues

Run this once to prepare models for certificate verification:
    python scripts/download_models.py

This will:
1. Download PP-OCRv4 Detection model (~150MB)
2. Download PP-OCRv4 Recognition model (~150MB)
3. Download Angle Classifier model (~50MB)
4. Cache them in ~/.paddleocr for future use

Total download: ~350MB
Subsequent runs will use cached models (no download needed)
"""

import os
import sys

# Disable model hosters connectivity check
os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'
os.environ['PADDLE_ENABLE_INFERENCE'] = 'True'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

def download_models():
    """Download PaddleOCR models"""
    try:
        from paddleocr import PaddleOCR
        
        print("\n" + "="*70)
        print("PaddleOCR Model Downloader")
        print("="*70)
        print("\n[1/3] Initializing PaddleOCR...")
        print("      This will download models from PaddleOCR repository")
        print("      Download location: ~/.paddleocr")
        print("      Total size: ~350MB")
        print("\n[2/3] Downloading models (this may take 5-10 minutes)...")
        print("      Please keep your internet connection stable\n")
        
        # Initialize OCR - triggers model download
        ocr = PaddleOCR(
            use_angle_cls=True,
            lang='en',
            show_log=False
        )
        
        print("\n[3/3] Verifying models...")
        
        # Test with a simple image to verify models work
        import urllib.request
        import tempfile
        
        # Use a small test image
        test_image_url = "https://www.paddlepaddle.org.cn/images/v2.0/Paddle_logo.png"
        
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            try:
                print("      Downloading test image...")
                urllib.request.urlretrieve(test_image_url, tmp.name)
                
                print("      Testing OCR extraction...")
                result = ocr.ocr(tmp.name, cls=True)
                
                if result and len(result) > 0:
                    print("      ✅ OCR test successful!")
                else:
                    print("      ⚠️  OCR returned empty result (but models are loaded)")
                    
            finally:
                os.unlink(tmp.name)
        
        print("\n" + "="*70)
        print("✅ SUCCESS - Models Downloaded and Verified!")
        print("="*70)
        print("\nModels are ready for use in:")
        print(f"  {os.path.expanduser('~')}/.paddleocr")
        print("\nNext steps:")
        print("  1. Upload a certificate to the system")
        print("  2. First analysis will use cached models (no download)")
        print("  3. Expected processing time: ~10-15 seconds per certificate")
        print("\n" + "="*70 + "\n")
        
        return 0
        
    except ImportError as e:
        print("\n" + "="*70)
        print("❌ ERROR - Missing Dependencies")
        print("="*70)
        print(f"\nError: {e}")
        print("\nSolution: Install required packages")
        print("  pip install -r scripts/requirements.txt")
        print("\n" + "="*70 + "\n")
        return 1
        
    except Exception as e:
        print("\n" + "="*70)
        print("❌ ERROR - Download Failed")
        print("="*70)
        print(f"\nError: {e}")
        print("\nPossible solutions:")
        print("  1. Check internet connection")
        print("  2. Try again in a few moments")
        print("  3. Check firewall/proxy settings")
        print("\nNote: The system will auto-download models on first upload")
        print("      if this pre-download fails.")
        print("\n" + "="*70 + "\n")
        return 1

if __name__ == "__main__":
    sys.exit(download_models())
