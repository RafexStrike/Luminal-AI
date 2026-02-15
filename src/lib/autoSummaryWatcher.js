import {
    getAutoSummarySettings,
    saveSummary,
    updateLastProcessedSequence,
    getMessageHistory
} from './SECONDARY_db';
import { generateNormalSummary } from './generateNormalSummary';
import { generateIncrementalSummary } from './generateIncrementalSummary';

/**
 * checkAndGenerateAutoSummary({ userId, chatId, currentSequenceNumber })
 * 
 * Logic:
 * 1. Fetch settings (chat-specific or global)
 * 2. Check if enabled
 * 3. Compare currentSequenceNumber vs lastProcessedSequence
 * 4. If difference >= threshold, trigger generation
 */
export async function checkAndGenerateAutoSummary({ userId, chatId, currentSequenceNumber }) {
    try {
        const settings = await getAutoSummarySettings({ userId, chatId });

        if (!settings.enabled) return { generated: false };

        const diff = currentSequenceNumber - (settings.lastProcessedSequence || 0);
        if (diff < settings.messageThreshold) {
            return { generated: false, currentDiff: diff };
        }

        // Trigger Generation
        console.log(`Auto-summarizing chat ${chatId} for user ${userId} (seq: ${currentSequenceNumber})`);

        const messages = await getMessageHistory({ userId, chatId });
        // Filter out system messages
        const chatMessages = messages.filter(m => m.role !== 'system');
        const messageIds = chatMessages.map(m => m._id.toString());

        let summaryContent;
        const type = settings.mode === 'incremental' ? 'auto-incremental' : 'auto-normal';

        if (settings.mode === 'incremental') {
            summaryContent = await generateIncrementalSummary(chatMessages);
        } else {
            summaryContent = await generateNormalSummary(chatMessages);
        }

        const savedDoc = await saveSummary({
            userId,
            chatId,
            messageIds,
            content: summaryContent,
            type
        });

        // Update progress tracker
        await updateLastProcessedSequence({
            userId,
            chatId,
            sequenceNumber: currentSequenceNumber
        });

        return {
            generated: true,
            summaryId: savedDoc._id.toString(),
            sequenceNumber: currentSequenceNumber
        };
    } catch (error) {
        console.error('Auto-summary watcher error:', error);
        throw error;
    }
}
