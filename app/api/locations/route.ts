import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { locations, auditLogs } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

function slugify(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')      // Replace spaces with -
    .replace(/[^\w\-]+/g, '')  // Remove all non-word chars
    .replace(/\-\-+/g, '-')    // Replace multiple - with single -
    .replace(/^-+/, '')        // Trim - from start of text
    .replace(/-+$/, '');       // Trim - from end of text
}

async function getAdminEmail(): Promise<string> {
  const token = cookies().get('admin_token')?.value;
  if (!token) return 'system';
  const decoded = await verifyToken(token);
  return decoded && typeof decoded.email === 'string' ? decoded.email : 'system';
}

export async function GET() {
  try {
    const data = await db.select().from(locations).orderBy(locations.name);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Falha ao buscar unidades' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;
    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });

    const slug = slugify(name);
    const [newLocation] = await db.insert(locations).values({ name, slug }).returning();

    const adminEmail = await getAdminEmail();
    await db.insert(auditLogs).values({
      action: 'CREATE',
      entity: 'location',
      entityId: newLocation.id,
      performedBy: adminEmail,
    });

    revalidatePath('/');
    return NextResponse.json(newLocation);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: 'Unidade com esse nome já existe' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Falha ao criar unidade' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name } = body;
    if (!id || !name) return NextResponse.json({ error: 'ID e Nome são obrigatórios' }, { status: 400 });

    const slug = slugify(name);
    const [updated] = await db.update(locations).set({ name, slug }).where(eq(locations.id, id)).returning();

    const adminEmail = await getAdminEmail();
    await db.insert(auditLogs).values({
      action: 'UPDATE',
      entity: 'location',
      entityId: updated.id,
      performedBy: adminEmail,
    });

    revalidatePath('/');
    revalidatePath(`/${updated.slug}`);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Falha ao atualizar unidade' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    const [deleted] = await db.delete(locations).where(eq(locations.id, id)).returning();

    const adminEmail = await getAdminEmail();
    await db.insert(auditLogs).values({
      action: 'DELETE',
      entity: 'location',
      entityId: deleted.id,
      performedBy: adminEmail,
    });

    revalidatePath('/');
    revalidatePath(`/${deleted.slug}`);
    return NextResponse.json({ success: true, deleted });
  } catch {
    return NextResponse.json({ error: 'Falha ao excluir a unidade. Ela pode estar em uso.' }, { status: 500 });
  }
}
