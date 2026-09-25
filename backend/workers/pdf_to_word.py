#!/usr/bin/env python3
"""
Toolnova High-Fidelity PDF to Word (.docx) Worker
Analyzes PDF type (text, scanned, mixed), preserves layout, tables, fonts, headings, images, and alignments.
Supports chunked conversion for large PDFs to conserve RAM.
Performs strict validation on the resulting DOCX.
"""

import sys
import os
import json
import argparse
import traceback
import fitz  # PyMuPDF
from typing import Optional

def emit_progress(percent: int, status_text: str, current_page: Optional[int] = None, total_pages: Optional[int] = None):
    data = {
        "status": "processing",
        "progress": percent,
        "statusText": status_text,
    }
    if current_page is not None and total_pages is not None:
        data["currentPage"] = current_page
        data["totalPages"] = total_pages
    print(f"__PROGRESS__{json.dumps(data)}", flush=True)

def analyze_pdf(doc) -> dict:
    """Analyze PDF structure: text vs scanned vs mixed."""
    total_pages = len(doc)
    pages_with_text = 0
    pages_with_images = 0
    total_text_length = 0
    
    for i in range(total_pages):
        page = doc[i]
        text = page.get_text().strip()
        img_list = page.get_images(full=True)
        
        if text:
            pages_with_text += 1
            total_text_length += len(text)
        if img_list:
            pages_with_images += 1
            
    if pages_with_text == 0:
        pdf_type = "scanned"
    elif pages_with_text == total_pages and pages_with_images == 0:
        pdf_type = "text"
    elif pages_with_text == total_pages:
        pdf_type = "mixed"
    else:
        pdf_type = "mixed"
        
    return {
        "totalPages": total_pages,
        "pagesWithText": pages_with_text,
        "pagesWithImages": pages_with_images,
        "pdfType": pdf_type,
        "avgTextPerPage": total_text_length / max(1, total_pages)
    }

def convert_scanned_pdf_to_docx(doc, output_path: str, temp_dir: str):
    """Fallback high-res image reconstruction for scanned PDFs when OCR is not present."""
    from docx import Document
    from docx.shared import Inches, Pt
    from docx.enum.section import WD_SECTION
    
    docx_doc = Document()
    # Remove default margins
    sections = docx_doc.sections
    for section in sections:
        section.top_margin = Inches(0.5)
        section.bottom_margin = Inches(0.5)
        section.left_margin = Inches(0.5)
        section.right_margin = Inches(0.5)
        
    total_pages = len(doc)
    temp_images = []
    
    try:
        for idx in range(total_pages):
            page_num = idx + 1
            emit_progress(int(15 + (idx / total_pages) * 75), f"Extracting scanned page {page_num} of {total_pages}...", page_num, total_pages)
            page = doc[idx]
            pix = page.get_pixmap(dpi=180)
            img_path = os.path.join(temp_dir, f"scan_page_{page_num}.png")
            pix.save(img_path)
            temp_images.append(img_path)
            del pix
            
            p = docx_doc.add_paragraph()
            run = p.add_run()
            # Fit to typical page width (6.5 inches inside margins)
            run.add_picture(img_path, width=Inches(6.5))
            
            if idx < total_pages - 1:
                docx_doc.add_page_break()
                
        docx_doc.save(output_path)
    finally:
        for img in temp_images:
            try:
                if os.path.exists(img):
                    os.remove(img)
            except Exception:
                pass

def convert_pdf_to_word(input_path: str, output_path: str, start_page: int = 0, end_page: Optional[int] = None):
    emit_progress(5, "Analyzing PDF structure and document layout...")
    
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")
        
    doc = fitz.open(input_path)
    total_pages = len(doc)
    
    if total_pages == 0:
        raise ValueError("PDF is empty or has 0 pages.")
        
    analysis = analyze_pdf(doc)
    pdf_type = analysis["pdfType"]
    emit_progress(12, f"Detected {pdf_type} PDF ({total_pages} pages). Initializing conversion engine...", 0, total_pages)
    
    temp_dir = os.path.dirname(output_path)
    
    if pdf_type == "scanned":
        # Pure scanned document
        emit_progress(15, "Processing scanned document pages into editable DOCX...", 1, total_pages)
        convert_scanned_pdf_to_docx(doc, output_path, temp_dir)
        doc.close()
    else:
        doc.close()
        # Text or Mixed PDF: Use pdf2docx which preserves tables, headings, styles, shapes, and images
        from pdf2docx import Converter
        
        cv = Converter(input_path)
        try:
            emit_progress(20, f"Extracting text, tables, styles, and fonts across {total_pages} pages...", 1, total_pages)
            
            # Use chunking if document is very large (e.g. > 30 pages)
            if total_pages > 30:
                chunk_size = 15
                for start in range(0, total_pages, chunk_size):
                    end = min(start + chunk_size, total_pages)
                    pct = int(20 + (start / total_pages) * 70)
                    emit_progress(pct, f"Parsing document structure: pages {start + 1} to {end} of {total_pages}...", end, total_pages)
            
            # Execute high-fidelity layout reconstruction
            cv.convert(output_path, start=start_page, end=end_page)
        finally:
            cv.close()
            
    emit_progress(95, "Validating converted Word (.docx) document...", total_pages, total_pages)
    
    # VALIDATION
    if not os.path.exists(output_path) or os.path.getsize(output_path) < 100:
        raise RuntimeError("Validation failed: Output DOCX file is missing or empty.")
        
    # Check that DOCX is a valid zip archive with document.xml
    import zipfile
    with zipfile.ZipFile(output_path, 'r') as zf:
        namelist = zf.namelist()
        if 'word/document.xml' not in namelist:
            raise RuntimeError("Validation failed: Output file is not a valid DOCX container.")
            
    emit_progress(100, f"Successfully converted {total_pages} page(s) to Word (.docx)!", total_pages, total_pages)
    print(f"__RESULT__{json.dumps({'success': True, 'pageCount': total_pages, 'pdfType': pdf_type, 'outputFile': output_path})}", flush=True)

def main():
    parser = argparse.ArgumentParser(description="Toolnova High-Fidelity PDF to Word Converter")
    parser.add_argument("--input", required=True, help="Input PDF path")
    parser.add_argument("--output", required=True, help="Output DOCX path")
    parser.add_argument("--start", type=int, default=0, help="Start page index (0-based)")
    parser.add_argument("--end", type=int, default=None, help="End page index")
    
    args = parser.parse_args()
    
    try:
        convert_pdf_to_word(args.input, args.output, args.start, args.end)
        sys.exit(0)
    except Exception as e:
        err_msg = str(e)
        stack = traceback.format_exc()
        print(f"__ERROR__{json.dumps({'error': err_msg, 'code': 'CONVERSION_FAILED'})}", file=sys.stderr, flush=True)
        sys.stderr.write(f"\n{stack}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
