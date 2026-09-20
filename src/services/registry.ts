import {
  Collection,
  REST,
  Routes,
} from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { Command } from '../types';
import { TOKEN } from '../config';

const commands = new Collection<string, Command>();
const aliases = new Collection<string, string>();

export function all(): Collection<string, Command> {
  return commands;
}

export function get(name: string): Command | undefined {
  return commands.get(name) ?? commands.get(aliases.get(name) ?? '');
}

export function load(dir: string): void {
  const folders = readdirSync(dir, { withFileTypes: true });
  for (const folder of folders) {
    if (!folder.isDirectory()) continue;
    loadFolder(join(dir, folder.name));
  }
}

function isCommand(val: unknown): val is Command {
  return typeof val === 'object' && val !== null && 'name' in val && 'run' in val;
}

function registerExports(mod: Record<string, unknown>): void {
  if (isCommand(mod.default)) register(mod.default);
  for (const [key, val] of Object.entries(mod)) {
    if (key !== 'default' && isCommand(val)) register(val);
  }
}

function loadFolder(path: string): void {
  const files = readdirSync(path).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
  for (const file of files) registerExports(require(join(path, file)));
}

function register(cmd: Command): void {
  commands.set(cmd.name, cmd);
  for (const alias of cmd.aliases) aliases.set(alias, cmd.name);
}

export async function deploy(clientId: string): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const body = commands.map(c => c.slash.toJSON());
  await rest.put(Routes.applicationCommands(clientId), { body });
}
