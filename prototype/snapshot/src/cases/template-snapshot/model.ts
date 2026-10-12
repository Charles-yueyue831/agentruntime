import { Build, Snapshot, ToolVersion, ImageRefLike, imageRef } from './types';
import { builds as seedBuilds, toolVersions as seedVersions, digestOf } from './mock';

type LegacyImage = Partial<ImageRefLike> & { image?: string; digest?: string };
const value = (v: unknown): string => typeof v === 'string' && v !== 'undefined' && v !== 'undefined:undefined' ? v.trim() : '';

/** Upgrade old prototype records without overwriting an already resolved image. */
export function resolveImage(row: LegacyImage, fallback?: LegacyImage): ImageRefLike {
  const legacy = value(row.image).split('@');
  const ref = legacy[0];
  const colon = ref.lastIndexOf(':');
  const hasTag = colon > ref.lastIndexOf('/');
  const repo = value(row.imageRepo) || (hasTag ? ref.slice(0, colon) : ref) || value(fallback?.imageRepo);
  const tag = value(row.imageTag) || (hasTag ? ref.slice(colon + 1) : '') || (repo === fallback?.imageRepo ? value(fallback?.imageTag) : '') || (repo ? 'latest' : '');
  const sameImage = repo === fallback?.imageRepo && tag === fallback?.imageTag;
  const digest = value(row.imageDigest) || value(row.digest) || value(legacy[1]) || (sameImage ? value(fallback?.imageDigest) : '') || (repo ? digestOf(repo, tag) : '');
  return { imageRepo: repo, imageTag: tag, imageDigest: digest };
}

export function normalizeVersions(rows: ToolVersion[]): ToolVersion[] {
  return rows.map(row => {
    const seed = seedVersions.find(v => v.id === row.id) || seedVersions.find(v => v.toolId === row.toolId && v.toolTag === row.toolTag);
    return { ...row, toolTag: row.toolTag || 'default', ...resolveImage(row, seed) };
  });
}

export function normalizeBuilds(rows: Build[], versions: ToolVersion[]): Build[] {
  return rows.map(row => {
    // Historical tasks retain their own image; seed task data takes precedence over today's template version.
    const fallback = seedBuilds.find(b => b.id === row.id) || versions.find(v => v.toolId === row.toolId && v.toolTag === row.toolTag);
    const template = versions.find(v => v.toolId === row.toolId);
    return { ...row, tool: template?.tool || row.tool, ...resolveImage(row, fallback) };
  });
}

export function snapshotName(s: Snapshot): string { return s.name || s.id; }

export function matchSnapshot(version: ToolVersion | undefined, snapshots: Snapshot[], image: string, command: string, defaultCommand: string): Snapshot | undefined {
  if (!version || version.imageVolume || !version.imageRepo) return undefined;
  if ((image.trim() && image.trim() !== imageRef(version)) || (command.trim() && command.trim() !== defaultCommand.trim())) return undefined;
  return snapshots.filter(s => s.toolId === version.toolId && s.toolTag === version.toolTag && s.hash === version.hash && s.status === 'Ready')
    .sort((a, b) => b.time.localeCompare(a.time))[0];
}

/** Replace only this template version's usable snapshots, and only after successful completion. */
export function completeBuild(build: Build, snapshots: Snapshot[], id: string, time: string): Snapshot[] {
  const next: Snapshot = { id, name: build.snapshotName || build.versionName || id, versionNames: build.versionNames?.length ? build.versionNames : [build.versionName || 'default'], versionName: build.versionNames?.[0] || build.versionName || 'default', config: build.config, configOverrides: build.configOverrides, tool: build.tool, toolId: build.toolId, toolTag: build.toolTag, build: build.id, hash: build.hash,
    requestTime: build.time, time, lastUseTime: '—', status: 'Ready', uses: 0, autoDelete: !!build.autoDelete, idleTTL: build.idleTTL || '168h' };
  return [next, ...snapshots.map(s => s.toolId === build.toolId && s.toolTag === build.toolTag && s.status === 'Ready'
    ? { ...s, status: 'Deleted' as const, replacedBy: id } : s)];
}

export function versionSnapshot(version: ToolVersion, snapshots: Snapshot[]): Snapshot | undefined {
  return snapshots.find(s => s.id === version.snapshot) || snapshots.filter(s => s.toolId === version.toolId && s.toolTag === version.toolTag).sort((a,b) => b.time.localeCompare(a.time))[0];
}
