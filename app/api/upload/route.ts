import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Only allow authenticated admins to upload
        const adminToken = cookies().get('admin_token')?.value;
        if (!adminToken) throw new Error('Unauthorized');
        
        const decoded = await verifyToken(adminToken);
        if (!decoded) throw new Error('Unauthorized');

        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 15 * 1024 * 1024, // 15MB max for PDFs
          tokenPayload: JSON.stringify({
            adminId: decoded.email,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Get notified of client upload completion
        // ⚠️ This will not work on localhost unless tunneling like ngrok is deployed and configured with Vercel Webhooks
        console.log('blob upload completed', blob, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } // The webhook will retry 5 times waiting for a 200
    );
  }
}
