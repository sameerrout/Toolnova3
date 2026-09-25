#!/usr/bin/env python3
"""
Toolnova PDF to PowerPoint Worker
Converts a PDF document to a PowerPoint presentation (.pptx)
Guarantee: EXACTLY ONE PDF PAGE = ONE POWERPOINT SLIDE
Visual fidelity: Renders each page to high-res image and embeds it with preserved aspect ratio.
Memory-safe: Processes page-by-page, releasing pixmaps and temp resources immediately.
"""

import sys
import os
import json
import argparse
import traceback
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

def convert_pdf_to_pptx(input_path: str, output_path: str, progress_file: Optional[str] = None, dpi: int = 150):
    emit_progress(5, "Loading presentation engine and analyzing PDF...")
    
    import fitz  # PyMuPDF
    from pptx import Presentation
    from pptx.util import Inches, Pt
    
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")
        
    # Open PDF with PyMuPDF
    pdf_doc = fitz.open(input_path)
    total_pages = len(pdf_doc)
    
    if total_pages == 0:
        raise ValueError("The provided PDF has 0 pages or is corrupted.")
        
    emit_progress(10, f"Found {total_pages} page(s). Preparing PowerPoint slides...", 0, total_pages)
    
    prs = Presentation()
    # Remove default slide layout margins/shapes by using blank layout (layout index 6 is blank)
    blank_slide_layout = prs.slide_layouts[6]
    
    # We will determine the master slide dimension from the first page orientation
    first_page = pdf_doc[0]
    rect = first_page.rect
    first_width, first_height = rect.width, rect.height
    is_portrait = first_height > first_width
    
    if is_portrait:
        # Standard Letter Portrait 8.5 x 11 inches or A4 portrait 8.27 x 11.69 inches
        prs.slide_width = Inches(8.5)
        prs.slide_height = Inches(11.0)
    else:
        # Standard Widescreen 16:9 (13.33 x 7.5 in) or 4:3 (10 x 7.5 in)
        ratio = first_width / first_height
        if ratio >= 1.6:
            prs.slide_width = Inches(13.333)
            prs.slide_height = Inches(7.5)
        else:
            prs.slide_width = Inches(10.0)
            prs.slide_height = Inches(7.5)
            
    slide_w_pt = prs.slide_width.pt
    slide_h_pt = prs.slide_height.pt
    
    temp_dir = os.path.dirname(output_path)
    page_temp_images = []
    
    try:
        for page_idx in range(total_pages):
            current_page_num = page_idx + 1
            progress_pct = int(10 + (page_idx / total_pages) * 80)
            emit_progress(
                progress_pct, 
                f"Processing page {current_page_num} of {total_pages}...",
                current_page_num, 
                total_pages
            )
            
            page = pdf_doc[page_idx]
            page_rect = page.rect
            p_w, p_h = page_rect.width, page_rect.height
            
            # Render page to high-res pixmap
            # matrix for dpi
            zoom = dpi / 72.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, alpha=False)
            
            # Save temporary image file for this page on disk to keep RAM minimal
            img_filename = os.path.join(temp_dir, f"temp_slide_page_{current_page_num}.jpg")
            pix.save(img_filename)
            page_temp_images.append(img_filename)
            
            # Explicitly free pixmap from memory immediately
            del pix
            
            # Add slide
            slide = prs.slides.add_slide(blank_slide_layout)
            
            # Calculate aspect ratio and scaling to fit slide without distortion or stretching
            # Aspect ratio of the PDF page
            page_aspect = p_w / p_h
            slide_aspect = slide_w_pt / slide_h_pt
            
            if page_aspect > slide_aspect:
                # Page is wider than slide: fit to width
                fit_w = slide_w_pt
                fit_h = slide_w_pt / page_aspect
                pos_left = 0
                pos_top = (slide_h_pt - fit_h) / 2.0
            else:
                # Page is taller than slide: fit to height
                fit_h = slide_h_pt
                fit_w = slide_h_pt * page_aspect
                pos_left = (slide_w_pt - fit_w) / 2.0
                pos_top = 0
                
            # Place image onto slide
            slide.shapes.add_picture(
                img_filename, 
                Pt(pos_left), 
                Pt(pos_top), 
                width=Pt(fit_w), 
                height=Pt(fit_h)
            )
            
            # Attempt to extract text for slide speaker notes so searchability is retained
            try:
                text_content = page.get_text()
                if text_content and text_content.strip():
                    notes_slide = slide.notes_slide
                    text_frame = notes_slide.notes_text_frame
                    text_frame.text = text_content.strip()
            except Exception:
                pass
                
        emit_progress(92, "Validating and packaging PowerPoint presentation...", total_pages, total_pages)
        
        # Save presentation
        prs.save(output_path)
        
        # Close PDF document
        pdf_doc.close()
        
        # STRICT VALIDATION
        # 1. Output exists and is non-empty
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise RuntimeError("Validation failed: Output PPTX file was not generated or is 0 bytes.")
            
        # 2. Slide count must exactly match PDF page count!
        # Re-read PPTX to guarantee slide count
        check_prs = Presentation(output_path)
        slide_count = len(check_prs.slides)
        
        if slide_count != total_pages:
            raise RuntimeError(
                f"Validation failed: Slide count mismatch! PDF has {total_pages} page(s) but PPTX has {slide_count} slide(s)."
            )
            
        emit_progress(100, f"Successfully converted {total_pages} page(s) to {slide_count} slide(s)!", total_pages, total_pages)
        print(f"__RESULT__{json.dumps({'success': True, 'slideCount': slide_count, 'pageCount': total_pages, 'outputFile': output_path})}", flush=True)
        return True
        
    finally:
        # Clean up temporary page images
        for tmp_img in page_temp_images:
            try:
                if os.path.exists(tmp_img):
                    os.remove(tmp_img)
            except Exception:
                pass
        try:
            pdf_doc.close()
        except Exception:
            pass

def main():
    parser = argparse.ArgumentParser(description="Toolnova PDF to PowerPoint Converter")
    parser.add_argument("--input", required=True, help="Input PDF path")
    parser.add_argument("--output", required=True, help="Output PPTX path")
    parser.add_argument("--progress", required=False, help="Progress JSON output file")
    parser.add_argument("--dpi", type=int, default=150, help="Rendering DPI (default 150)")
    
    args = parser.parse_args()
    
    try:
        convert_pdf_to_pptx(args.input, args.output, args.progress, args.dpi)
        sys.exit(0)
    except Exception as e:
        err_msg = str(e)
        stack = traceback.format_exc()
        print(f"__ERROR__{json.dumps({'error': err_msg, 'code': 'CONVERSION_FAILED'})}", file=sys.stderr, flush=True)
        sys.stderr.write(f"\n{stack}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
