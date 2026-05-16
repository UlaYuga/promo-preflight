import type { IHandoffAdapter } from '../../application/port/IHandoffAdapter';
import type { PreflightEvent, RunCompleted } from '../../domain/event/PreflightEvent';

export interface TelegramLogger {
  warn(message: string): void;
  info(message: string): void;
}

export interface TelegramAdapterOptions {
  baseUrl?: string;
  publicRunBaseUrl?: string;
  logger?: TelegramLogger;
}

interface RunCompletedWithSummaries extends RunCompleted {
  blockerSummaries?: string[];
}

const DEFAULT_BASE_URL = 'https://api.telegram.org';
const DEFAULT_PUBLIC_RUN_BASE_URL = 'http://localhost:3000';
const MARKDOWN_V2_RESERVED = /([_*\[\]()~`>#+\-=|{}.!\\])/g;

export class TelegramAdapter implements IHandoffAdapter {
  private readonly baseUrl: string;
  private readonly publicRunBaseUrl: string;
  private readonly logger: TelegramLogger;
  private readonly token: string | null;
  private readonly chatId: string | null;
  private hasWarnedMissingConfig = false;

  constructor(
    token?: string,
    chatId?: string,
    options: TelegramAdapterOptions = {}
  ) {
    this.token = normalizeConfigValue(token);
    this.chatId = normalizeConfigValue(chatId);
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
    this.publicRunBaseUrl = normalizeBaseUrl(
      options.publicRunBaseUrl ?? DEFAULT_PUBLIC_RUN_BASE_URL
    );
    this.logger = options.logger ?? console;
  }

  async notify(event: PreflightEvent): Promise<void> {
    if (!this.token || !this.chatId) {
      this.warnMissingConfigOnce();
      return;
    }

    if (event.type !== 'RunCompleted') {
      this.logger.info(`[TelegramAdapter] Ignored event type: ${event.type}`);
      return;
    }

    const text = this.formatRunCompletedMessage(event);
    await this.sendMessage(text);
  }

  private warnMissingConfigOnce(): void {
    if (this.hasWarnedMissingConfig) {
      return;
    }

    this.logger.warn(
      '[TelegramAdapter] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing; adapter is disabled.'
    );
    this.hasWarnedMissingConfig = true;
  }

  private async sendMessage(text: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/bot${this.token}/sendMessage`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: this.chatId,
        parse_mode: 'MarkdownV2',
        text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `[TelegramAdapter] sendMessage failed with status ${response.status}: ${body}`
      );
    }
  }

  private formatRunCompletedMessage(event: RunCompleted): string {
    const runId = escapeMarkdownV2(event.runId);
    const url = escapeMarkdownV2(this.buildRunUrl(event.runId));

    if (event.verdict === 'GO') {
      return `✅ Run *${runId}*: all checks passed`;
    }

    if (event.verdict === 'WARN') {
      return `⚠️ Run *${runId}*: ${event.counts.warnings} warnings, 0 blockers — review before launch.\nView: ${url}`;
    }

    const blockerSummaries = this.resolveBlockerSummaries(event);
    const bulletList = blockerSummaries.map((summary) => `• ${escapeMarkdownV2(summary)}`).join('\n');
    return `🚨 Run *${runId}* BLOCKED (${event.counts.blockers} blockers, ${event.counts.warnings} warnings)\n${bulletList}\nView: ${url}`;
  }

  private buildRunUrl(runId: string): string {
    return `${this.publicRunBaseUrl}/runs/${encodeURIComponent(runId)}`;
  }

  private resolveBlockerSummaries(event: RunCompleted): string[] {
    const candidate = event as RunCompletedWithSummaries;
    if (Array.isArray(candidate.blockerSummaries) && candidate.blockerSummaries.length > 0) {
      return candidate.blockerSummaries.slice(0, 3);
    }

    return [`${event.counts.blockers} blockers require review in the run details`];
  }
}

function escapeMarkdownV2(value: string): string {
  return value.replace(MARKDOWN_V2_RESERVED, '\\$1');
}

function normalizeConfigValue(value?: string): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}
