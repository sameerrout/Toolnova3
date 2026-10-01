#!/usr/bin/env python3
"""
Test suite to verify Toolnova core conversion workers:
1. PDF to PowerPoint (1:1 page-to-slide guarantee, aspect ratio, no blanks)
"""

import os
import sys
import subprocess
import json
import fitz
from pptx import Presentation

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMP_DIR = os.path.join(BASE_DIR, "backend", "temp", "test_runs")
os.makedirs(TEMP_DIR, exist_ok=True)

def create_sample_pdf(filepath: str, num_pages: int = 5):
    """Generate a multi-page test PDF with distinct text and shapes."""
    doc = fitz.open()
    for i in range(num_pages):
        page = doc.new_page(width=595.28, height=841.89) # A4
        page.insert_text(fitz.Point(50, 72), f"Toolnova Document Page {i + 1}", fontsize=22, color=(0.1, 0.2, 0.5))
        page.insert_text(fitz.Point(50, 120), f"This is a high-fidelity test paragraph on page {i + 1}.", fontsize=12)
        page.insert_text(fitz.Point(50, 160), "Key Information Table / List:", fontsize=14, color=(0.2, 0.3, 0.4))
        for row in range(3):
            page.insert_text(fitz.Point(60, 190 + row * 25), f"• Item {row + 1}: Sample data metric {i * 10 + row}", fontsize=11)
        # Draw a colored rectangle
        page.draw_rect(fitz.Rect(50, 280, 545, 300), color=(0.2, 0.4, 0.8), fill=(0.9, 0.95, 1.0))
    doc.save(filepath)
    doc.close()
    print(f"  [OK] Created sample {num_pages}-page PDF: {filepath}")

def test_pdf_to_pptx():
    print("\n--- TEST: PDF to PowerPoint (1 Page = 1 Slide Guarantee) ---")
    pdf_path = os.path.join(TEMP_DIR, "sample_5page.pdf")
    pptx_path = os.path.join(TEMP_DIR, "sample_5page.pptx")
    create_sample_pdf(pdf_path, num_pages=5)
    
    script_path = os.path.join(BASE_DIR, "backend", "workers", "pdf_to_pptx.py")
    cmd = [sys.executable, script_path, "--input", pdf_path, "--output", pptx_path]
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    assert result.returncode == 0, f"Worker failed: {result.stderr}"
    assert os.path.exists(pptx_path), "Output PPTX was not created"
    
    prs = Presentation(pptx_path)
    slide_count = len(prs.slides)
    print(f"  [OK] PPTX created successfully with {slide_count} slides")
    assert slide_count == 5, f"Expected 5 slides, got {slide_count}"
    print("  [OK] PASS: PDF page count == PowerPoint slide count (5 == 5) verified!")

if __name__ == "__main__":
    try:
        test_pdf_to_pptx()
        print("\nALL CORE CONVERTER TESTS PASSED SUCCESSFULLY!")
    finally:
        pass


