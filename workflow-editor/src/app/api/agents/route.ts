import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface AgentMeta {
  id: string;
  name: string;
  description: string;
  color: string;
  emoji: string;
  vibe: string;
  division: string;
  systemPrompt: string;
}

export interface Division {
  id: string;
  label: string;
  emoji: string;
  agents: AgentMeta[];
}

const DIVISION_META: Record<string, { label: string; emoji: string }> = {
  engineering: { label: 'Engineering', emoji: '💻' },
  design: { label: 'Design', emoji: '🎨' },
  marketing: { label: 'Marketing', emoji: '📢' },
  'paid-media': { label: 'Paid Media', emoji: '💰' },
  product: { label: 'Product', emoji: '📊' },
  'project-management': { label: 'Project Management', emoji: '🎬' },
  testing: { label: 'Testing', emoji: '🧪' },
  support: { label: 'Support', emoji: '🛟' },
  'spatial-computing': { label: 'Spatial Computing', emoji: '🥽' },
  specialized: { label: 'Specialized', emoji: '🎯' },
  'game-development': { label: 'Game Development', emoji: '🎮' },
  strategy: { label: 'Strategy', emoji: '♟️' },
};

function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    meta[key] = value;
  }

  return { meta, body: match[2].trim() };
}

export async function GET() {
  const repoRoot = path.join(process.cwd(), '..');
  const divisions: Division[] = [];

  for (const [divId, divMeta] of Object.entries(DIVISION_META)) {
    const divPath = path.join(repoRoot, divId);
    if (!fs.existsSync(divPath)) continue;

    const agents: AgentMeta[] = [];
    const entries = fs.readdirSync(divPath, { withFileTypes: true });

    // Also scan subdirectories (e.g. game-development/unity/)
    const mdFiles: string[] = [];
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        mdFiles.push(path.join(divPath, entry.name));
      } else if (entry.isDirectory()) {
        const subDir = path.join(divPath, entry.name);
        const subEntries = fs.readdirSync(subDir, { withFileTypes: true });
        for (const sub of subEntries) {
          if (sub.isFile() && sub.name.endsWith('.md')) {
            mdFiles.push(path.join(subDir, sub.name));
          }
        }
      }
    }

    for (const filePath of mdFiles) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { meta, body } = parseFrontmatter(raw);

      const name = meta.name ?? path.basename(filePath, '.md');
      const id = path.relative(repoRoot, filePath).replace(/\\/g, '/').replace(/\.md$/, '');

      agents.push({
        id,
        name,
        description: meta.description ?? meta.vibe ?? '',
        color: meta.color ?? 'violet',
        emoji: meta.emoji ?? '🤖',
        vibe: meta.vibe ?? '',
        division: divId,
        systemPrompt: body,
      });
    }

    if (agents.length > 0) {
      agents.sort((a, b) => a.name.localeCompare(b.name));
      divisions.push({ id: divId, label: divMeta.label, emoji: divMeta.emoji, agents });
    }
  }

  return NextResponse.json({ divisions });
}
