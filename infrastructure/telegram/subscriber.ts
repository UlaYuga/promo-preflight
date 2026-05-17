import type { PreflightEvent } from '../../domain/event/PreflightEvent';
import { TelegramAdapter } from './TelegramAdapter';

// publicRunBaseUrl drives the "View run" link in alerts. Without it the
// adapter defaults to localhost, so production alerts link nowhere usable.
// Undefined in local dev → adapter keeps its localhost default (correct).
const adapter = new TelegramAdapter(
  process.env.TELEGRAM_BOT_TOKEN,
  process.env.TELEGRAM_CHAT_ID,
  { publicRunBaseUrl: process.env.PUBLIC_APP_URL }
);

export const telegramSubscriber = (event: PreflightEvent): Promise<void> => adapter.notify(event);
