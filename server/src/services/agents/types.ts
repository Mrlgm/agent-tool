export interface ImageUploadResult {
  url: string;
  cdnUrl: string;
  objectKey: string;
  taskId: string;
}

export interface GenerateInput {
  imageUrl: string;
  description?: string;
  framework?: string;
}

export interface GenerateOutput {
  taskId: string;
  status: TaskStatus;
  code?: string;
  previewUrl?: string;
  analysis?: AnalysisResult;
  error?: string;
}

export type TaskStatus =
  | 'pending'
  | 'analyzing'
  | 'generating'
  | 'completed'
  | 'failed';

export interface AnalysisResult {
  pageType: string;
  layout: {
    type: 'single-column' | 'two-column' | 'grid' | 'hero';
    sections: string[];
  };
  components: ComponentInfo[];
  colors: ColorScheme;
  style: StyleInfo;
}

export interface ComponentInfo {
  name: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent?: string;
}

export interface StyleInfo {
  borderRadius: string;
  shadow: string;
  spacing: string;
  fontFamily?: string;
}

export interface UploadRequest {
  image: string;
}

export interface UploadResponse {
  success: boolean;
  url?: string;
  objectKey?: string;
  error?: string;
}
