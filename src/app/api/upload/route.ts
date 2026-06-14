import { createClient } from '@supabase/supabase-js';
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
    const storagePath = `${folder}/${uniqueName}`;

    let url = '';

    // 1. Try Supabase Storage first (if configured)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { persistSession: false } }
        );

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: false
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(storagePath);
          
        url = publicUrl;
      } catch (err: any) {
        console.warn('Supabase upload failed, trying local/base64 fallback:', err);
      }
    }

    // 2. If Supabase is not configured or failed, try local filesystem, then base64 fallback
    if (!url) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const publicDir = join(process.cwd(), 'public', 'uploads', folder);
        await mkdir(publicDir, { recursive: true });

        const filePath = join(publicDir, uniqueName);
        await writeFile(filePath, buffer);

        url = `/uploads/${folder}/${uniqueName}`;
      } catch (localErr: any) {
        console.warn('Local filesystem write failed (serverless environment), converting to base64 data URL:', localErr);
        
        // 3. Convert to base64 data URL as final fallback
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        url = `data:${file.type};base64,${base64}`;
      }
    }

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
  }
}
