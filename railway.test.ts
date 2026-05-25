import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Railway deploy contract', () => {
  it('executes migrations before starting the web server', () => {
    const config = readFileSync(join(process.cwd(), 'railway.toml'), 'utf8');

    expect(config).toContain('preDeployCommand = "node db/migrate.mjs"');
    expect(config).toContain('startCommand = "node server.js"');
    expect(config).not.toContain(
      'startCommand = "node db/migrate.mjs && node server.js"'
    );
  });
});
