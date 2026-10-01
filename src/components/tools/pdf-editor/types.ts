export interface TextElement {
  id: string;
  type: 'text';
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right';
  linkUrl?: string;
}

export interface ImageElement {
  id: string;
  type: 'image';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  alt?: string;
}

export interface HighlightElement {
  id: string;
  type: 'highlight';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}

export interface FormElement {
  id: string;
  type: 'form';
  formType: 'text' | 'checkbox' | 'signature' | 'date';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  value?: string | boolean;
}

export interface DrawingPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  color: string;
  opacity: number;
  fontSize: number;
  rotation: number;
}

export interface HeaderFooterConfig {
  enabled: boolean;
  headerText: string;
  footerText: string;
  includePageNumber: boolean;
  includeDate: boolean;
}

export interface PageNumberConfig {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  format: 'page-x-of-y' | 'x-of-y' | 'x' | 'page-x';
  fontSize: number;
  color: string;
}

export interface PageSetupConfig {
  size: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  margins: 'normal' | 'compact' | 'none';
}

export interface PageTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

export interface EditorPage {
  id: string;
  pageNumber: number;
  rotation: number; // 0, 90, 180, 270
  canvasDataUrl?: string; // Rendered background from uploaded PDF
  sourcePageIndex?: number; // Index in original PDF
  width?: number;
  height?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  textItems?: PageTextItem[];
  elements: (TextElement | ImageElement | HighlightElement | FormElement)[];
  drawings: DrawingPath[];
  title?: string;
  customTemplateType?: 'proposal' | 'summary' | 'metrics' | 'roadmap' | 'thankyou' | 'blank';
}

export type ActiveTool =
  | 'select'
  | 'edit'
  | 'add-text'
  | 'add-image';
