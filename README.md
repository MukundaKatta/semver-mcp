# semver-mcp

[![npm](https://img.shields.io/npm/v/@mukundakatta/semver-mcp.svg)](https://www.npmjs.com/package/@mukundakatta/semver-mcp)
[![mcp](https://img.shields.io/badge/protocol-MCP-blue.svg)](https://modelcontextprotocol.io)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

MCP server: parse, compare, increment, and range-test SemVer versions.
Backed by the `semver` npm package. Full range syntax — `^`, `~`, `>=`, `*`,
`x`, hyphen ranges — and prerelease/build metadata.

## Tools

- `parse` — `"1.2.3-beta.1+build.42"` → `{ major:1, minor:2, patch:3, prerelease:["beta",1], build:["build","42"] }`
- `compare` — `compare("1.0.0","1.0.1")` → `-1`
- `satisfies` — `satisfies("1.2.3","^1.0.0")` → `true`
- `inc` — `inc("1.2.3","minor")` → `"1.3.0"`. Supports `premajor`/`preminor`/`prepatch`/`prerelease` with optional `identifier`.

## Configure

```json
{ "mcpServers": { "semver": { "command": "npx", "args": ["-y", "@mukundakatta/semver-mcp"] } } }
```

## License

MIT.
