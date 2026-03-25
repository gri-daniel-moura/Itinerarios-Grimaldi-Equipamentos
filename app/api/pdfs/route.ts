import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pdfFiles, auditLogs } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { locations } from '@/lib/schema';

async function getAdminEmail(): Promise<string> {
  const token = cookies().get('admin_token')?.value;
  if (!token) return 'system';
  const decoded = await verifyToken(token);
  return decoded && typeof decoded.email === 'string' ? decoded.email : 'system';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId');
    const includeInactive = searchParams.get('includeInactive') === 'true'; // Admin needs inactive too

    const query = db.select().from(pdfFiles);

    // Apply filters via where clauses (Drizzle builder pattern trick: just build results, or use eq properly)
    let results = await query.orderBy(desc(pdfFiles.createdAt));

    if (locationId) {
      results = results.filter(p => p.locationId === locationId);
    }
    if (!includeInactive) {
      results = results.filter(p => p.isActive === true);
    }

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: 'Falha ao buscar PDFs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { locationId, title, description, fileUrl, fileSize, mimeType } = body;

    const adminEmail = await getAdminEmail();

    const [newPdf] = await db.insert(pdfFiles).values({
      locationId,
      title,
      description,
      fileUrl,
      fileSize,
      mimeType,
      uploadedBy: adminEmail,
    }).returning();

    await db.insert(auditLogs).values({
      action: 'CREATE',
      entity: 'pdf',
      entityId: newPdf.id,
      performedBy: adminEmail,
    });

    revalidatePath('/');
    
    // Get location slug to revalidate that page too
    const [loc] = await db.select().from(locations).where(eq(locations.id, newPdf.locationId)).limit(1);
    if (loc) revalidatePath(`/${loc.slug}`);

    return NextResponse.json(newPdf);
  } catch {
    return NextResponse.json({ error: 'Falha ao salvar o PDF no banco de dados' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, description, isActive, locationId } = body;
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    const [updated] = await db.update(pdfFiles)
      .set({ 
        title, 
        description, 
        isActive, 
        locationId,
        updatedAt: new Date()
      })
      .where(eq(pdfFiles.id, id))
      .returning();

    const adminEmail = await getAdminEmail();
    await db.insert(auditLogs).values({
      action: 'UPDATE',
      entity: 'pdf',
      entityId: updated.id,
      performedBy: adminEmail,
    });

    revalidatePath('/');
    
    const [loc] = await db.select().from(locations).where(eq(locations.id, updated.locationId)).limit(1);
    if (loc) revalidatePath(`/${loc.slug}`);

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Falha ao atualizar o PDF' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    const [deleted] = await db.delete(pdfFiles).where(eq(pdfFiles.id, id)).returning();

    const adminEmail = await getAdminEmail();
    await db.insert(auditLogs).values({
      action: 'DELETE',
      entity: 'pdf',
      entityId: deleted.id,
      performedBy: adminEmail,
    });

    revalidatePath('/');
    
    const [loc] = await db.select().from(locations).where(eq(locations.id, deleted.locationId)).limit(1);
    if (loc) revalidatePath(`/${loc.slug}`);

    return NextResponse.json({ success: true, deleted });
  } catch {
    return NextResponse.json({ error: 'Falha ao excluir o PDF' }, { status: 500 });
  }
}
