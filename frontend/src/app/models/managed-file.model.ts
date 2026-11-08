export type FileCategoryType = 'IMAGE' | 'PDF' | 'DATA' | 'DOCUMENT' | 'ARCHIVE' | 'OTHER';

export type FileOriginType =
  | 'UPLOADED'
  | 'CONVERTED'
  | 'CAMERA_PDF'
  | 'MERGED_PDF'
  | 'SPLIT_PDF'
  | 'COMPRESSED_PDF'
  | 'SIGNED_PDF';

export type FileTagType = 'Trabajo' | 'Estudio' | 'Facturas' | 'Personal' | 'Legal' | 'Urgente';

export const FILE_TAGS: FileTagType[] = [
  'Trabajo',
  'Estudio',
  'Facturas',
  'Personal',
  'Legal',
  'Urgente'
];

export interface ContextualFileAnalysis {
  originalRawName: string;
  suggestedName: string;
  suggestedFullName: string;
  suggestedTag: FileTagType;
  suggestedTargetFormat: string;
  suggestedDescription: string;
  detectedDate: string;
  detectedExtension: string;
  detectedCategory: FileCategoryType;
  confidence: number;
  reasons: string[];
  contentSnippet?: string;
  isLocalPrivacyVerified: boolean;
}

export interface ManagedFile {
  id: number;
  name: string;
  ext: string;
  mimeType: string;
  category: FileCategoryType;
  origin: FileOriginType;
  tag?: FileTagType | string;
  description?: string;
  size: number;
  pageCount?: number | null;
  width?: number | null;
  height?: number | null;
  parentId?: number | null;
  archived?: boolean;
  signed?: boolean;
  compressed?: boolean;
  availableTargets: string[];
  dataUrl?: string;
  viewUrl: string;
  downloadUrl: string;
  createdAt: string;
}

export interface CameraPhotoItem {
  id: string;
  name: string;
  dataUrl: string;
  rotation: number;
}

export interface CameraPdfRequest {
  title: string;
  tag?: FileTagType | string;
  pageSize: 'A4' | 'LETTER' | 'FIT';
  orientation: 'portrait' | 'landscape';
  margin: number;
  photos: { dataUrl: string; rotation: number }[];
  fileIds?: number[];
}

export interface MergePdfRequest {
  fileIds: number[];
  title: string;
  tag?: FileTagType | string;
}

export interface SplitPdfRequest {
  fileId: number;
  ranges: string;
  mode: 'extract-single' | 'split-multiple';
  title: string;
  rotations?: Record<number, number>;
}

export interface CompressPdfRequest {
  fileId: number;
  level: 'low' | 'medium' | 'extreme';
  outputTitle?: string;
}

export interface SignPdfRequest {
  fileId: number;
  signerName: string;
  signatureDataUrl?: string;
  position: 'bottom-right' | 'bottom-left' | 'center';
  outputTitle?: string;
}

export interface SplitPdfResponse {
  files: ManagedFile[];
  zipFile?: ManagedFile | null;
}
