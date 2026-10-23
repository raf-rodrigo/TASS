import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const temporaryRoots = [];
afterEach(() => {
  for (const directory of temporaryRoots.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function runDeploy({ args = [], extraEnv = {}, legacy = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'tass deploy test '));
  temporaryRoots.push(root);
  const bin = join(root, 'bin');
  mkdirSync(bin);
  mkdirSync(join(root, 'scripts'));
  copyFileSync(resolve('deploy.sh'), join(root, 'deploy.sh'));
  copyFileSync(resolve('scripts/publish-tass.sh'), join(root, 'scripts/publish-tass.sh'));
  writeFileSync(join(root, 'fly.toml'), "app = 'test-tass'\n");
  writeFileSync(join(bin, 'fly'), `#!/usr/bin/env bash
set -eu
printf '%s\\n' "fly $*" >> "$DEPLOY_TEST_LOG"
case "$1 $2" in
  'config show') printf '%s' "$FLY_TEST_CONFIG" ;;
  'machine list') printf '%s' "$FLY_TEST_MACHINES" ;;
  'deploy --app') exit "\${FLY_TEST_DEPLOY_EXIT:-0}" ;;
esac
`, { mode: 0o755 });
  writeFileSync(join(bin, 'npm'), `#!/usr/bin/env bash
printf '%s\\n' "npm $*" >> "$DEPLOY_TEST_LOG"
if [[ "$*" == "\${NPM_TEST_FAIL:-}" ]]; then exit 42; fi
`, { mode: 0o755 });
  writeFileSync(join(bin, 'curl'), `#!/usr/bin/env bash
printf '%s\\n' "curl $*" >> "$DEPLOY_TEST_LOG"
exit "\${CURL_TEST_EXIT:-0}"
`, { mode: 0o755 });
  const log = join(root, 'commands.log');
  const result = spawnSync('bash', [join(root, legacy ? 'scripts/publish-tass.sh' : 'deploy.sh'), ...args], {
    cwd: tmpdir(), encoding: 'utf8',
    env: {
      ...process.env, PATH: `${bin}:${process.env.PATH}`, DEPLOY_TEST_LOG: log,
      FLY_TEST_CONFIG: JSON.stringify({ app: 'test-tass', env: { TASS_DB_PATH: '/data/tass-db.json' }, mounts: [{ source: 'tass_data', destination: '/data' }] }),
      FLY_TEST_MACHINES: JSON.stringify([{ config: { mounts: [{ name: 'tass_data', path: '/data' }] } }]),
      ...extraEnv
    }
  });
  let commands = [];
  try { commands = readFileSync(log, 'utf8').trim().split('\n'); } catch { /* No command before argument validation. */ }
  return { ...result, commands };
}

describe('Deploy exclusivo do Fly.io', () => {
  it('valida e publica na ordem correta mesmo fora da raiz e com espaços no caminho', () => {
    const result = runDeploy();
    expect(result.status, result.stderr).toBe(0);
    expect(result.commands.map(command => command.split(' ').slice(0, 2).join(' '))).toEqual([
      'fly config', 'fly config', 'fly machine', 'npm test', 'npm run', 'npm run', 'fly deploy', 'curl --fail', 'fly status'
    ]);
    expect(result.commands).toContain('npm test -- --run');
    expect(result.commands).toContain('npm run lint');
    expect(result.commands).toContain('npm run build');
    expect(result.commands.find(command => command.startsWith('fly deploy'))).toContain('--remote-only --ha=false --yes');
    expect(result.commands.some(command => /fly launch|ssh|scp/.test(command))).toBe(false);
    expect(result.stdout).toContain('TASS publicado e acessível em https://test-tass.fly.dev/');
  });
  it('mostra o plano sem validar remotamente, testar ou publicar no dry-run', () => {
    const result = runDeploy({ args: ['--dry-run'] });
    expect(result.status, result.stderr).toBe(0);
    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]).toContain('config show --local');
  });
  it.each(['test -- --run', 'run lint', 'run build'])('não publica se npm %s falhar', step => {
    const result = runDeploy({ extraEnv: { NPM_TEST_FAIL: step } });
    expect(result.status).toBe(42);
    expect(result.commands.some(command => command.startsWith('fly deploy'))).toBe(false);
  });
  it.each(['[]', '[{},{}]', '[{"config":{"mounts":[]}}]'])('recusa máquinas sem persistência compatível: %s', machines => {
    const result = runDeploy({ extraEnv: { FLY_TEST_MACHINES: machines } });
    expect(result.status).not.toBe(0);
    expect(result.commands.some(command => command.startsWith('npm '))).toBe(false);
    expect(result.commands.some(command => command.startsWith('fly deploy'))).toBe(false);
  });
  it('recusa configuração que perderia o volume persistente', () => {
    const result = runDeploy({ extraEnv: { FLY_TEST_CONFIG: '{"app":"test-tass","mounts":[]}' } });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Preserve TASS_DB_PATH');
  });
  it('interrompe se o Fly.io rejeitar o deploy', () => {
    const result = runDeploy({ extraEnv: { FLY_TEST_DEPLOY_EXIT: '17' } });
    expect(result.status).toBe(17);
    expect(result.commands.some(command => command.startsWith('curl '))).toBe(false);
  });
  it('não anuncia sucesso se a verificação HTTP falhar', () => {
    const result = runDeploy({ extraEnv: { CURL_TEST_EXIT: '22' } });
    expect(result.status).toBe(22);
    expect(result.stdout).not.toContain('TASS publicado e acessível');
  });
  it('encaminha o comando legado ao mesmo deploy no Fly.io', () => {
    const result = runDeploy({ legacy: true, args: ['--dry-run'] });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('test-tass');
    expect(result.commands).toHaveLength(1);
  });
  it('recusa opções antigas de SSH sem executar comandos', () => {
    const result = runDeploy({ args: ['--target', 'user@host'] });
    expect(result.status).not.toBe(0);
    expect(result.commands).toEqual([]);
  });
});
