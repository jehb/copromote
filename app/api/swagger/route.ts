import { NextResponse } from 'next/server';
import { getApiDocs } from '@/lib/swagger';
import { verifySession } from '@/lib/session';

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const spec = await getApiDocs();
    return NextResponse.json(spec);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate OpenAPI spec' }, { status: 500 });
  }
}
