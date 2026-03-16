const API_BASE = '/api';

export interface UploadResponse {
  success: boolean;
  url?: string;
  objectKey?: string;
  error?: string;
}

export interface GenerateResponse {
  taskId: string;
  status: string;
  code?: string;
  previewUrl?: string;
  analysis?: any;
  error?: string;
}

export async function uploadImage(imageBase64: string): Promise<UploadResponse> {
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageBase64 }),
  });

  return response.json();
}

export async function generateCode(
  imageUrl: string,
  description?: string
): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE}/generate/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl,
      description,
      framework: 'html',
    }),
  });

  return response.json();
}

export async function getGenerateStatus(
  taskId: string
): Promise<GenerateResponse | null> {
  const response = await fetch(`${API_BASE}/generate/status/${taskId}`);

  if (!response.ok) {
    return null;
  }

  return response.json();
}
