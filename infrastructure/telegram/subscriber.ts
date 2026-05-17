import type { PreflightEvent } from '../../domain/event/PreflightEvent';
import { TelegramAdapter } from './TelegramAdapter';

const adapter = new TelegramAdapter(
  process.env.TELEGRAM_BOT_TOKEN,
  process.env.TELEGRAM_CHAT_ID
);

export const telegramSubscriber = (event: PreflightEvent): Promise<void> => adapter.notify(event);
