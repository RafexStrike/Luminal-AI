import { NextResponse } from 'next/server';
import { getUserIfAuthenticated } from '@/lib/SECONDARY_authPlaceholder';
import { getAutoSummarySettings, saveAutoSummarySettings } from '@/lib/SECONDARY_db';

/**
 * GET - Fetch current auto-summary settings for a chat
 * Query: ?chatId=xxx
 */
export async function GET(req) {
    try {
        const user = await getUserIfAuthenticated(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const chatId = searchParams.get('chatId');

        const settings = await getAutoSummarySettings({ userId: user.id, chatId });
        return NextResponse.json(settings);
    } catch (error) {
        console.error('Auto-summary GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST - Update auto-summary settings
 * Request: { chatId, enabled, messageThreshold, mode }
 */
export async function POST(req) {
    try {
        const user = await getUserIfAuthenticated(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { chatId, enabled, messageThreshold, mode } = body;

        const result = await saveAutoSummarySettings({
            userId: user.id,
            chatId,
            enabled,
            messageThreshold,
            mode
        });

        return NextResponse.json({ success: true, settings: result });
    } catch (error) {
        console.error('Auto-summary POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
