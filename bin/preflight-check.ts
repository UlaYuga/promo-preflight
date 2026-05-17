#!/usr/bin/env tsx

import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { CampaignBundleSchema } from '@domain/model/Campaign';
import type { RunChecksCommand } from '@app/command/RunChecksCommand';
import type { Run } from '@domain/model/Run';
import { createBus } from '@infra/registry';
import {
  EXIT_CODE,
  exitCodeForVerdict,
  formatHumanSummary,
  parseCliOptions,
  summarizeRun,
} from './preflight-check.helpers';

void main(process.argv.slice(2))
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error: unknown) => {
    writeStderr(`Internal error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(EXIT_CODE.INTERNAL_ERROR);
  });

async function main(argv: string[]): Promise<number> {
  let values: { file?: string; format?: string };
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        file: { type: 'string', short: 'f' },
        format: { type: 'string', default: 'json' },
      },
      allowPositionals: false,
      strict: true,
    }));
  } catch (error) {
    writeStderr(`Invalid CLI arguments: ${error instanceof Error ? error.message : String(error)}`);
    return EXIT_CODE.INVALID_INPUT;
  }

  let options;
  try {
    options = parseCliOptions({ file: values.file, format: values.format });
  } catch (error) {
    writeStderr(error instanceof Error ? error.message : String(error));
    return EXIT_CODE.INVALID_INPUT;
  }

  let rawCampaignJson = '';
  try {
    if (!options.file && process.stdin.isTTY) {
      writeStderr('No input provided. Pipe campaign JSON to stdin or pass --file <path>.');
      return EXIT_CODE.INVALID_INPUT;
    }
    rawCampaignJson = options.file ? await readFile(options.file, 'utf8') : await readStdin();
  } catch (error) {
    writeStderr(`Failed to read input: ${error instanceof Error ? error.message : String(error)}`);
    return EXIT_CODE.INVALID_INPUT;
  }

  if (rawCampaignJson.trim() === '') {
    writeStderr('No campaign JSON provided. Pipe JSON to stdin or pass --file <path>.');
    return EXIT_CODE.INVALID_INPUT;
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawCampaignJson);
  } catch (error) {
    writeStderr(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return EXIT_CODE.INVALID_INPUT;
  }

  const campaignParse = CampaignBundleSchema.safeParse(parsedJson);
  if (!campaignParse.success) {
    writeStderr(`Invalid campaign schema: ${campaignParse.error.message}`);
    return EXIT_CODE.INVALID_INPUT;
  }

  try {
    const bus = createBus();
    const command: RunChecksCommand = {
      type: 'RunChecks',
      campaign: campaignParse.data,
    };

    const result = await bus.dispatch<Run>(command);
    if (!result.ok) {
      writeStderr(`Check execution failed: [${result.error.code}] ${result.error.message}`);
      return EXIT_CODE.INTERNAL_ERROR;
    }

    const summary = summarizeRun(result.value);
    if (options.format === 'human') {
      process.stdout.write(`${formatHumanSummary(summary)}\n`);
    } else {
      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    }

    return exitCodeForVerdict(summary.verdict);
  } catch (error) {
    writeStderr(`Internal error: ${error instanceof Error ? error.message : String(error)}`);
    return EXIT_CODE.INTERNAL_ERROR;
  }
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

function writeStderr(message: string): void {
  process.stderr.write(`${message}\n`);
}
