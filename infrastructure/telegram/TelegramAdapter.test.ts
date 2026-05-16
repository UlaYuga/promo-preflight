import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PreflightEvent, RunCompleted } from '../../domain/event/PreflightEvent';
import { TelegramAdapter, type TelegramLogger } from './TelegramAdapter';

const originalFetch = globalThis.fetch;

function makeFetchOkMock() {
  return vi.fn(async () => new Response('{}', { status: 200 }));
}

function runCompletedEvent(
  verdict: 'GO' | 'WARN' | 'BLOCK',
  runId = 'run-1'
): RunCompleted {
  return {
    id: 'evt-1',
    type: 'RunCompleted',
    occurredAt: '2026-05-16T12:00:00.000Z',
    runId,
    verdict,
    counts: {
      blockers: verdict === 'BLOCK' ? 2 : 0,
      warnings: verdict === 'WARN' ? 3 : verdict === 'BLOCK' ? 1 : 0,
      passed: 8,
    },
  };
}

function parseFetchBody(fetchMock: ReturnType<typeof vi.fn>): {
  url: string;
  chatId: string;
  parseMode: string;
  text: string;
} {
  const call = fetchMock.mock.calls[0];
  const url = String(call[0]);
  const requestInit = call[1] as RequestInit;
  const body = JSON.parse(String(requestInit.body)) as {
    chat_id: string;
    parse_mode: string;
    text: string;
  };

  return {
    url,
    chatId: body.chat_id,
    parseMode: body.parse_mode,
    text: body.text,
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('TelegramAdapter', () => {
  it('is a no-op when token/chatId are missing and warns only once', async () => {
    const fetchMock = makeFetchOkMock();
    globalThis.fetch = fetchMock as typeof fetch;

    const logger: TelegramLogger = {
      warn: vi.fn(),
      info: vi.fn(),
    };

    const adapter = new TelegramAdapter('', undefined, { logger });
    await adapter.notify(runCompletedEvent('GO'));
    await adapter.notify(runCompletedEvent('WARN'));

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('formats GO messages and calls Telegram sendMessage with MarkdownV2', async () => {
    const fetchMock = makeFetchOkMock();
    globalThis.fetch = fetchMock as typeof fetch;

    const adapter = new TelegramAdapter('bot-token', '-100123', {
      baseUrl: 'https://api.telegram.org/',
    });

    await adapter.notify(runCompletedEvent('GO'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = parseFetchBody(fetchMock);
    expect(body.url).toBe('https://api.telegram.org/botbot-token/sendMessage');
    expect(body.chatId).toBe('-100123');
    expect(body.parseMode).toBe('MarkdownV2');
    expect(body.text).toBe('✅ Run *run\\-1*: all checks passed');
  });

  it('formats WARN messages with counts and escaped run url', async () => {
    const fetchMock = makeFetchOkMock();
    globalThis.fetch = fetchMock as typeof fetch;

    const adapter = new TelegramAdapter('bot-token', '-100123', {
      publicRunBaseUrl: 'https://preflight.example.com/a.b',
    });

    await adapter.notify(runCompletedEvent('WARN', 'run.(42)'));

    const body = parseFetchBody(fetchMock);
    expect(body.text).toBe(
      '⚠️ Run *run\\.\\(42\\)*: 3 warnings, 0 blockers — review before launch.\n' +
        'View: https://preflight\\.example\\.com/a\\.b/runs/run\\.\\(42\\)'
    );
  });

  it('formats BLOCK messages using fallback summary when event has counts only', async () => {
    const fetchMock = makeFetchOkMock();
    globalThis.fetch = fetchMock as typeof fetch;

    const adapter = new TelegramAdapter('bot-token', '-100123', {
      publicRunBaseUrl: 'https://preflight.example.com',
    });

    await adapter.notify(runCompletedEvent('BLOCK', 'run-7'));

    const body = parseFetchBody(fetchMock);
    expect(body.text).toBe(
      '🚨 Run *run\\-7* BLOCKED (2 blockers, 1 warnings)\n' +
        '• 2 blockers require review in the run details\n' +
        'View: https://preflight\\.example\\.com/runs/run\\-7'
    );
  });

  it('escapes MarkdownV2 for runId, url, and blocker summary text', async () => {
    const fetchMock = makeFetchOkMock();
    globalThis.fetch = fetchMock as typeof fetch;

    const adapter = new TelegramAdapter('bot-token', '-100123', {
      publicRunBaseUrl: 'https://pf.example.com',
    });

    const eventWithSummaries = {
      ...runCompletedEvent('BLOCK', 'run_*[]()~`>#+-=|{}.!\\'),
      blockerSummaries: ['owner[legal] -> fix_now!'],
    } as RunCompleted & { blockerSummaries: string[] };

    await adapter.notify(eventWithSummaries as unknown as PreflightEvent);

    const body = parseFetchBody(fetchMock);
    expect(body.text).toContain(
      'Run *run\\_\\*\\[\\]\\(\\)\\~\\`\\>\\#\\+\\-\\=\\|\\{\\}\\.\\!\\\\* BLOCKED'
    );
    expect(body.text).toContain('• owner\\[legal\\] \\-\\> fix\\_now\\!');
    expect(body.text).toContain(
      'View: https://pf\\.example\\.com/runs/run\\_\\*%5B%5D\\(\\)\\~%60%3E%23%2B\\-%3D%7C%7B%7D\\.\\!%5C'
    );
  });

  it('logs ignored event types and does not call fetch', async () => {
    const fetchMock = makeFetchOkMock();
    globalThis.fetch = fetchMock as typeof fetch;

    const logger: TelegramLogger = {
      warn: vi.fn(),
      info: vi.fn(),
    };

    const adapter = new TelegramAdapter('bot-token', '-100123', { logger });
    const ignoredEvent: PreflightEvent = {
      id: 'evt-2',
      type: 'RunStarted',
      occurredAt: '2026-05-16T12:00:00.000Z',
      runId: 'run-1',
      campaignId: 'campaign-1',
      versionId: 'v1',
    };

    await adapter.notify(ignoredEvent);

    expect(logger.info).toHaveBeenCalledWith('[TelegramAdapter] Ignored event type: RunStarted');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
