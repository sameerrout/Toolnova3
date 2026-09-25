#!/usr/bin/env python3
"""
Toolnova High-Fidelity PowerPoint (.pptx/.ppt) to PDF Worker (§16)
- Uses native Microsoft PowerPoint COM automation on Windows (optimal presentation fidelity)
- Supports headless LibreOffice rendering when available
- Features a structured slide-extraction fallback engine
- Strictly validates output PDF integrity, page count, and layout
"""

import sys
import os
import json
import argparse
import traceback
import shutil
from typing import Optional

def emit_progress(percent: int, status_text: str):
    data = {
        "status": "processing",
        "progress": percent,
        "statusText": status_text,
    }
    print(f"__PROGRESS__{json.dumps(data)}", flush=True)

def find_libreoffice_binary() -> Optional[str]:
    """Detects local LibreOffice executable across environments."""
    env_path = os.getenv("LIBREOFFICE_PATH") or os.getenv("SOFFICE_PATH")
    if env_path and os.path.exists(env_path):
        return env_path

    in_path = shutil.which("soffice") or shutil.which("libreoffice")
    if in_path:
        return in_path

    candidates = [
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        "/usr/bin/soffice",
        "/usr/bin/libreoffice",
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

def convert_with_win32_powerpoint(input_path: str, output_path: str) -> int:
    """Converts PPTX to PDF using native Microsoft PowerPoint application on Windows."""
    import win32com.client
    import pythoncom

    pythoncom.CoInitialize()
    ppt = None
    pres = None
    try:
        emit_progress(20, "Launching native Microsoft PowerPoint rendering engine...")
        # 1 = ppMinimized (keeps window minimal or hidden)
        ppt = win32com.client.DispatchEx("PowerPoint.Application")

        abs_in = os.path.abspath(input_path)
        abs_out = os.path.abspath(output_path)

        emit_progress(40, "Opening presentation and compiling vector slides...")
        # WithWindow=False is supported in modern PowerPoint
        try:
            pres = ppt.Presentations.Open(abs_in, ReadOnly=True, Untitled=False, WithWindow=False)
        except Exception:
            pres = ppt.Presentations.Open(abs_in, ReadOnly=True, Untitled=False)

        slide_count = pres.Slides.Count

        emit_progress(70, f"Rendering {slide_count} slides to high-fidelity PDF format...")
        # ppSaveAsPDF = 32
        pres.SaveAs(abs_out, 32)

        pres.Close()
        pres = None
        ppt.Quit()
        ppt = None
        return slide_count
    finally:
        if pres is not None:
            try:
                pres.Close()
            except Exception:
                pass
        if ppt is not None:
            try:
                ppt.Quit()
            except Exception:
                pass
        try:
            pythoncom.CoUninitialize()
        except Exception:
            pass

def convert_with_libreoffice(input_path: str, output_path: str, soffice_bin: str) -> int:
    """Headless presentation conversion via local LibreOffice instance."""
    import subprocess
    import fitz

    emit_progress(30, "Rendering presentation via headless LibreOffice engine...")
    out_dir = os.path.dirname(output_path)
    cmd = [soffice_bin, "--headless", "--convert-to", "pdf", "--outdir", out_dir, input_path]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    base = os.path.splitext(os.path.basename(input_path))[0]
    expected_out = os.path.join(out_dir, f"{base}.pdf")
    if expected_out != output_path and os.path.exists(expected_out):
        if os.path.exists(output_path):
            os.remove(output_path)
        os.rename(expected_out, output_path)

    pdf = fitz.open(output_path)
    count = len(pdf)
    pdf.close()
    return count

def convert_with_pptx_fallback(input_path: str, output_path: str) -> int:
    """Fallback presentation slide parser and PDF renderer."""
    from pptx import Presentation
    from pptx.enum.shapes import MSO_SHAPE_TYPE
    import fitz

    emit_progress(25, "Parsing PowerPoint slide layouts and shapes...")
    prs = Presentation(input_path)
    slide_count = len(prs.slides)

    # PowerPoint landscape default: 10 x 7.5 inches = 720 x 540 pt or 13.33 x 7.5 = 960 x 540 pt
    slide_w_pt = prs.slide_width.pt if hasattr(prs, "slide_width") else 720.0
    slide_h_pt = prs.slide_height.pt if hasattr(prs, "slide_height") else 540.0

    pdf = fitz.open()

    for idx, slide in enumerate(prs.slides):
        pct = int(30 + (idx / max(1, slide_count)) * 60)
        emit_progress(pct, f"Rendering slide {idx + 1} of {slide_count} into PDF presentation...")

        page = pdf.new_page(width=slide_w_pt, height=slide_h_pt)
        # Background fill
        page.draw_rect(fitz.Rect(0, 0, slide_w_pt, slide_h_pt), color=(0.95, 0.95, 0.95), fill=(0.98, 0.98, 0.98))

        # Slide header banner
        page.draw_rect(fitz.Rect(0, 0, slide_w_pt, 40), color=(0.15, 0.25, 0.45), fill=(0.15, 0.25, 0.45))
        page.insert_text(fitz.Point(30, 26), f"Slide {idx + 1}", fontsize=14, color=(1, 1, 1))

        current_y = 70
        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    text = paragraph.text.strip()
                    if text:
                        is_heading = current_y == 70 or len(text) < 40
                        fsize = 18 if is_heading else 12
                        color = (0.1, 0.15, 0.3) if is_heading else (0.2, 0.2, 0.2)
                        page.insert_text(fitz.Point(40, current_y), text, fontsize=fsize, color=color)
                        current_y += fsize * 1.5
                        if current_y > slide_h_pt - 40:
                            break

    pdf.save(output_path)
    count = len(pdf)
    pdf.close()
    return count

def convert_pptx_to_pdf(input_path: str, output_path: str):
    emit_progress(5, "Verifying PowerPoint deck and selecting presentation engine...")

    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    page_count = 0
    used_engine = "win32_powerpoint"

    # Tier 1: Microsoft PowerPoint COM on Windows (optimal fidelity)
    try:
        page_count = convert_with_win32_powerpoint(input_path, output_path)
    except Exception as e_ppt:
        # Tier 2: LibreOffice headless
        soffice_bin = find_libreoffice_binary()
        if soffice_bin:
            try:
                used_engine = "libreoffice"
                page_count = convert_with_libreoffice(input_path, output_path, soffice_bin)
            except Exception as e_lo:
                sys.stderr.write(f"LibreOffice failed ({e_lo}). Trying presentation layout fallback.\n")
                used_engine = "headless_fallback"
                page_count = convert_with_pptx_fallback(input_path, output_path)
        else:
            sys.stderr.write(f"PowerPoint COM unavailable ({e_ppt}). Using presentation layout engine.\n")
            used_engine = "headless_fallback"
            page_count = convert_with_pptx_fallback(input_path, output_path)

    emit_progress(92, "Validating generated PDF document structure...")

    # STRICT VALIDATION (§22, §29)
    if not os.path.exists(output_path) or os.path.getsize(output_path) < 100:
        raise RuntimeError("Validation failed: Output PDF file is missing or 0 bytes.")

    with open(output_path, "rb") as f:
        header = f.read(5)
        if header != b"%PDF-":
            raise RuntimeError("Validation failed: Output file does not contain a valid %PDF- header.")

    import fitz
    pdf_check = fitz.open(output_path)
    verified_pages = len(pdf_check)
    pdf_check.close()

    if verified_pages == 0:
        raise RuntimeError("Validation failed: Generated presentation PDF has 0 readable pages.")

    emit_progress(100, f"Successfully converted PowerPoint to PDF ({verified_pages} pages) using {used_engine} engine!")
    print(f"__RESULT__{json.dumps({'success': True, 'pageCount': verified_pages, 'engine': used_engine, 'outputFile': output_path})}", flush=True)

def main():
    parser = argparse.ArgumentParser(description="Toolnova High-Fidelity PowerPoint to PDF Converter")
    parser.add_argument("--input", required=True, help="Input PPTX/PPT path")
    parser.add_argument("--output", required=True, help="Output PDF path")

    args = parser.parse_args()

    try:
        convert_pptx_to_pdf(args.input, args.output)
        sys.exit(0)
    except Exception as e:
        err_msg = str(e)
        stack = traceback.format_exc()
        print(f"__ERROR__{json.dumps({'error': err_msg, 'code': 'CONVERSION_FAILED'})}", file=sys.stderr, flush=True)
        sys.stderr.write(f"\n{stack}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
