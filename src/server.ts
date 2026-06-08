#!/usr/bin/env node
/**
 * semver MCP server. Four tools: `parse`, `compare`, `satisfies`, `inc`.
 *
 * Backed by the `semver` npm package. Pre-release tags, build metadata,
 * and range syntax (`^1.2.3`, `>=1.0.0 <2.0.0`, `~1.2`, `1.x`) are all
 * supported.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import semver from 'semver';

const VERSION = '0.1.0';

export interface Parsed {
  version: string;
  major: number;
  minor: number;
  patch: number;
  prerelease: (string | number)[];
  build: string[];
}

export function parseVersion(input: string): Parsed {
  const p = semver.parse(input);
  if (!p) throw new Error(`not a valid semver: ${input}`);
  return {
    version: p.version,
    major: p.major,
    minor: p.minor,
    patch: p.patch,
    prerelease: [...p.prerelease],
    build: [...p.build],
  };
}

export function compareVersions(a: string, b: string): number {
  return semver.compare(a, b);
}

export function satisfiesRange(version: string, range: string): boolean {
  // semver.satisfies silently returns false for invalid versions/ranges, which
  // hides typos behind a confident-looking `false`. Validate up front so a bad
  // input surfaces as a clear error instead.
  if (semver.valid(version) === null) throw new Error(`not a valid semver: ${version}`);
  if (semver.validRange(range) === null) throw new Error(`not a valid range: ${range}`);
  return semver.satisfies(version, range);
}

export type ReleaseType = 'major' | 'minor' | 'patch' | 'premajor' | 'preminor' | 'prepatch' | 'prerelease';

export function incVersion(version: string, release: ReleaseType, identifier?: string): string {
  // semver.inc has two overloads; pass identifier only when defined to pick the right one.
  const out = identifier !== undefined
    ? semver.inc(version, release, identifier)
    : semver.inc(version, release);
  if (!out) throw new Error(`failed to increment ${version} as ${release}`);
  return out;
}

const server = new Server({ name: 'semver', version: VERSION }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: 'parse',
    description: 'Parse a SemVer version string into major/minor/patch/prerelease/build.',
    inputSchema: {
      type: 'object',
      properties: { version: { type: 'string' } },
      required: ['version'],
    },
  },
  {
    name: 'compare',
    description: 'Compare two SemVer versions. Returns -1, 0, or 1.',
    inputSchema: {
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'string' } },
      required: ['a', 'b'],
    },
  },
  {
    name: 'satisfies',
    description: 'Check whether a version satisfies a range. Supports ^/~/>=/<=/x/* syntax.',
    inputSchema: {
      type: 'object',
      properties: { version: { type: 'string' }, range: { type: 'string' } },
      required: ['version', 'range'],
    },
  },
  {
    name: 'inc',
    description: 'Increment a version. release: major/minor/patch/premajor/preminor/prepatch/prerelease.',
    inputSchema: {
      type: 'object',
      properties: {
        version: { type: 'string' },
        release: {
          type: 'string',
          enum: ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'],
        },
        identifier: { type: 'string', description: 'Prerelease identifier (e.g. "beta").' },
      },
      required: ['version', 'release'],
    },
  },
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name === 'parse') {
      const a = args as unknown as { version: string };
      return jsonResult(parseVersion(a.version));
    }
    if (name === 'compare') {
      const a = args as unknown as { a: string; b: string };
      return jsonResult({ result: compareVersions(a.a, a.b) });
    }
    if (name === 'satisfies') {
      const a = args as unknown as { version: string; range: string };
      return jsonResult({ satisfies: satisfiesRange(a.version, a.range) });
    }
    if (name === 'inc') {
      const a = args as unknown as { version: string; release: ReleaseType; identifier?: string };
      return jsonResult({ version: incVersion(a.version, a.release, a.identifier) });
    }
    return errorResult('unknown tool: ' + name);
  } catch (err) {
    return errorResult('semver tool failed: ' + (err as Error).message);
  }
});

function jsonResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
function errorResult(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`semver MCP server v${VERSION} ready on stdio\n`);
}
