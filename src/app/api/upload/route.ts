import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'misc';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, JPG, PNG, WebP, GIF are allowed.' }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 });
    }

    // Create unique filename path
    const ext = file.name.split('.').pop() || 'png';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const blobPath = `uploads/${folder}/${uniqueName}`;

    let url = '';

    // If Vercel Blob token is present, try Vercel Blob upload first
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(blobPath, file, {
          access: 'public',
        });
        url = blob.url;
      } catch (err) {
        console.warn('Vercel Blob upload failed, falling back to local storage:', err);
      }
    }

    // If Vercel Blob is not configured or failed, save locally in public/uploads
    if (!url) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const publicDir = join(process.cwd(), 'public', 'uploads', folder);
      await mkdir(publicDir, { recursive: true });

      const filePath = join(publicDir, uniqueName);
      await writeFile(filePath, buffer);

      url = `/uploads/${folder}/${uniqueName}`;
    }

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

