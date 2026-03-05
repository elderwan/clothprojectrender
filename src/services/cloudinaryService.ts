const DEFAULT_UPLOAD_PRESET = 'maison_product';

type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: { message?: string };
};

function getCloudinaryConfig(): { cloudName: string; uploadPreset: string } {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = (process.env.CLOUDINARY_UPLOAD_PRESET?.trim() || DEFAULT_UPLOAD_PRESET);

  if (!cloudName) {
    throw new Error('CLOUDINARY_CLOUD_NAME is not configured.');
  }

  return { cloudName, uploadPreset };
}

export async function uploadImageToCloudinary(file: string, folder = 'maison/products'): Promise<string> {
  if (!file || typeof file !== 'string') {
    throw new Error('Image file payload is required.');
  }

  const { cloudName, uploadPreset } = getCloudinaryConfig();
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', uploadPreset);
  form.append('folder', folder);

  const resp = await fetch(endpoint, {
    method: 'POST',
    body: form,
  });

  const data = await resp.json() as CloudinaryUploadResponse;
  if (!resp.ok || !data.secure_url) {
    const message = data.error?.message || 'Cloudinary upload failed.';
    throw new Error(message);
  }

  return data.secure_url;
}

export async function normalizeProductImageInputs(rawInput: string, folder = 'maison/products'): Promise<string[]> {
  const items = (rawInput || '')
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);

  if (items.length === 0) return [];

  const output: string[] = [];
  for (const item of items) {
    if (/^https?:\/\//i.test(item)) {
      output.push(item);
      continue;
    }

    if (item.startsWith('data:image/')) {
      const uploaded = await uploadImageToCloudinary(item, folder);
      output.push(uploaded);
      continue;
    }

    throw new Error('Invalid image input. Use image URL or base64 data URI.');
  }

  return output;
}
