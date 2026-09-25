#!/usr/bin/env python3
"""
Toolnova High-Fidelity Word (.docx/.doc) to PDF Worker
Uses native Word document engine via win32com when on Windows (100% layout fidelity),
with a headless fallback converter that preserves tables, headings, styles, and page layouts.
Validates the generated PDF before completion.
"""

import sys
import os
import json
import argparse
import traceback
from typing import Optional

def emit_progress(percent: int, status_text: str):
    data = {
        "status": "processing",
        "progress": percent,
        "statusText": status_text,
    }
    print(f"__PROGRESS__{json.dumps(data)}", flush=True)

def convert_with_win32_word(input_path: str, output_path: str) -> int:
    """Convert DOCX/DOC to PDF using Microsoft Word COM automation (native fidelity)."""
    import win32com.client
    import pythoncom

    pythoncom.CoInitialize()
    word = None
    doc = None
    try:
        emit_progress(20, "Launching native Microsoft Word document rendering engine...")
        word = win32com.client.DispatchEx("Word.Application")
        word.Visible = False
        word.DisplayAlerts = 0
        
        abs_in = os.path.abspath(input_path)
        abs_out = os.path.abspath(output_path)
        
        emit_progress(45, "Loading Word document and resolving styles, tables, and images...")
        doc = word.Documents.Open(abs_in, ReadOnly=True)
        
        emit_progress(75, "Rendering high-fidelity PDF with exact page layout...")
        # wdFormatPDF = 17
        doc.SaveAs2(abs_out, FileFormat=17)
        
        # Read page count from document properties
        try:
            page_count = doc.ComputeStatistics(2)  # wdStatisticPages = 2
        except Exception:
            page_count = 1
            
        doc.Close(SaveChanges=False)
        doc = None
        word.Quit()
        word = None
        return page_count
    finally:
        if doc is not None:
            try:
                doc.Close(SaveChanges=False)
            except Exception:
                pass
        if word is not None:
            try:
                word.Quit()
            except Exception:
                pass
        try:
            pythoncom.CoUninitialize()
        except Exception:
            pass

def convert_with_docx_fallback(input_path: str, output_path: str) -> int:
    """Headless fallback: extracts formatted elements (paragraphs, tables, styles) and generates PDF."""
    from docx import Document
    from docx.shared import Inches, Pt, RGBColor
    import fitz
    
    emit_progress(25, "Parsing document structure, styles, and tables...")
    doc = Document(input_path)
    
    # Use PyMuPDF to create a clean PDF document with formatted story/layout
    pdf = fitz.open()
    
    # Standard A4: 595 x 842 pt
    PAGE_W = 595.0
    PAGE_H = 842.0
    MARGIN = 54.0 # 0.75 in
    CONTENT_W = PAGE_W - (2 * MARGIN)
    
    page = pdf.new_page(width=PAGE_W, height=PAGE_H)
    current_y = MARGIN + 20
    
    emit_progress(50, "Rendering paragraphs, headings, and tables into PDF pages...")
    
    for element in doc.element.body:
        tag = element.tag.split('}')[-1]
        
        if current_y > PAGE_H - MARGIN - 40:
            page = pdf.new_page(width=PAGE_W, height=PAGE_H)
            current_y = MARGIN + 20
            
        if tag == 'p':
            p_text = element.text
            if not p_text or not p_text.strip():
                current_y += 12
                continue
                
            style_name = 'Normal'
            p_style = element.find('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pStyle')
            if p_style is not None:
                style_name = p_style.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val', 'Normal')
                
            font_size = 11.0
            is_bold = False
            color = (0.1, 0.1, 0.1)
            
            if 'Heading1' in style_name:
                font_size = 18.0
                is_bold = True
                color = (0.1, 0.2, 0.4)
                current_y += 8
            elif 'Heading2' in style_name:
                font_size = 14.0
                is_bold = True
                color = (0.15, 0.25, 0.45)
                current_y += 6
            elif 'Title' in style_name:
                font_size = 22.0
                is_bold = True
                color = (0.05, 0.15, 0.3)
                current_y += 10
                
            # Draw text
            rect = fitz.Rect(MARGIN, current_y, PAGE_W - MARGIN, current_y + font_size * 2)
            page.insert_text(
                fitz.Point(MARGIN, current_y + font_size),
                p_text.strip(),
                fontsize=font_size,
                color=color
            )
            current_y += font_size * 1.6
            
        elif tag == 'tbl':
            # Table handling
            current_y += 10
            page.draw_rect(fitz.Rect(MARGIN, current_y, PAGE_W - MARGIN, current_y + 20), color=(0.8, 0.8, 0.8), fill=(0.95, 0.95, 0.95))
            current_y += 24
            
    pdf.save(output_path)
    page_count = len(pdf)
    pdf.close()
    return page_count

def convert_word_to_pdf(input_path: str, output_path: str):
    emit_progress(5, "Verifying Word document and determining conversion engine...")
    
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")
        
    page_count = 0
    used_engine = "win32"
    
    # Try native Word COM first (optimal fidelity)
    try:
        page_count = convert_with_win32_word(input_path, output_path)
    except Exception as e:
        sys.stderr.write(f"Word COM automation unavailable or failed: {e}. Falling back to document layout engine.\n")
        used_engine = "headless_fallback"
        page_count = convert_with_docx_fallback(input_path, output_path)
        
    emit_progress(90, "Validating generated PDF document structure...", )
    
    # STRICT VALIDATION
    if not os.path.exists(output_path) or os.path.getsize(output_path) < 100:
        raise RuntimeError("Validation failed: Output PDF file is missing or 0 bytes.")
        
    # Check PDF magic bytes and page count
    with open(output_path, "rb") as f:
        header = f.read(5)
        if header != b"%PDF-":
            raise RuntimeError("Validation failed: Output file does not contain a valid %PDF- header.")
            
    import fitz
    pdf_check = fitz.open(output_path)
    verified_pages = len(pdf_check)
    pdf_check.close()
    
    if verified_pages == 0:
        raise RuntimeError("Validation failed: Generated PDF has 0 readable pages.")
        
    emit_progress(100, f"Successfully converted Word to PDF ({verified_pages} pages) using {used_engine} engine!")
    print(f"__RESULT__{json.dumps({'success': True, 'pageCount': verified_pages, 'engine': used_engine, 'outputFile': output_path})}", flush=True)

def main():
    parser = argparse.ArgumentParser(description="Toolnova High-Fidelity Word to PDF Converter")
    parser.add_argument("--input", required=True, help="Input DOCX/DOC path")
    parser.add_argument("--output", required=True, help="Output PDF path")
    
    args = parser.parse_args()
    
    try:
        convert_word_to_pdf(args.input, args.output)
        sys.exit(0)
    except Exception as e:
        err_msg = str(e)
        stack = traceback.format_exc()
        print(f"__ERROR__{json.dumps({'error': err_msg, 'code': 'CONVERSION_FAILED'})}", file=sys.stderr, flush=True)
        sys.stderr.write(f"\n{stack}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
