import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { listEmbeddings } from '@/lib/rag/vectorStore.js';

export async function GET(req) {
  try {
    const user = await getUserIfAuthenticated(req);
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sourceTypesParam = searchParams.get('sourceTypes');
    const limit = parseInt(searchParams.get('limit')) || 50;

    const sourceTypes = sourceTypesParam ? sourceTypesParam.split(',') : [];

    const results = await listEmbeddings({ userId: user.id, sourceTypes, limit });

    return Response.json({ count: results.length, results });
  } catch (err) {
    console.error('RAG embeddings list error:', err);
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
}
