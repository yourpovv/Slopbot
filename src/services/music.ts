import { VoiceBasedChannel } from 'discord.js';
import { getLavalink } from './lavalink';
import { Player } from 'erela.js';

export interface Song {
  url?: string;
  title: string;
  duration?: string;
  requestedBy: string;
  attachment?: string;
}

export interface MusicQueue {
  songs: Song[];
  currentSong: Song | null;
  looping: boolean;
  volume: number;
}

function getPlayer(guildId: string): Player | undefined {
  const manager = getLavalink();
  return manager.players.get(guildId);
}

export function getQueue(guildId: string): MusicQueue | undefined {
  const player = getPlayer(guildId);
  if (!player) return undefined;

  return {
    songs: [
      player.queue.current ? {
        title: player.queue.current.title,
        url: player.queue.current.uri,
        duration: player.queue.current.duration ? formatDuration(player.queue.current.duration) : undefined,
        requestedBy: player.queue.current.requester as string,
      } : {} as Song,
      ...player.queue.map(track => ({
        title: track.title,
        url: track.uri,
        duration: track.duration ? formatDuration(track.duration) : undefined,
        requestedBy: track.requester as string,
      }))
    ].filter(s => s.title),
    currentSong: player.queue.current ? {
      title: player.queue.current.title,
      url: player.queue.current.uri,
      duration: player.queue.current.duration ? formatDuration(player.queue.current.duration) : undefined,
      requestedBy: player.queue.current.requester as string,
    } : null,
    looping: player.queueRepeat || player.trackRepeat,
    volume: player.volume,
  };
}

export function createQueue(channel: VoiceBasedChannel): MusicQueue {
  const manager = getLavalink();
  
  const player = manager.create({
    guild: channel.guild.id,
    voiceChannel: channel.id,
    textChannel: channel.id,
    selfDeafen: true,
  });

  player.connect();
  
  return {
    songs: [],
    currentSong: null,
    looping: false,
    volume: 100,
  };
}

export function addSong(guildId: string, _song: Song): number {
  const player = getPlayer(guildId);
  if (!player) return 0;

  return player.queue.size + 1;
}

export async function playSong(guildId: string, url?: string, _title?: string, requester?: string): Promise<void> {
  const player = getPlayer(guildId);
  if (!player) throw new Error('No player found');

  if (!url) {
    if (!player.playing && player.queue.current) {
      player.play();
    }
    return;
  }

  const manager = getLavalink();
  const res = await manager.search(url, requester);

  if (res.loadType === 'LOAD_FAILED') {
    throw new Error('Failed to load track');
  }

  if (res.loadType === 'NO_MATCHES') {
    throw new Error('No results found');
  }

  if (res.loadType === 'PLAYLIST_LOADED') {
    for (const track of res.tracks) {
      player.queue.add(track);
    }
    if (!player.playing && !player.paused) {
      player.play();
    }
  } else {
    player.queue.add(res.tracks[0]);
    if (!player.playing && !player.paused) {
      player.play();
    }
  }
}

export function getCurrentSong(guildId: string): Song | null {
  const player = getPlayer(guildId);
  if (!player || !player.queue.current) return null;

  return {
    title: player.queue.current.title,
    url: player.queue.current.uri,
    duration: player.queue.current.duration ? formatDuration(player.queue.current.duration) : undefined,
    requestedBy: player.queue.current.requester as string,
  };
}

export function isPlaying(guildId: string): boolean {
  const player = getPlayer(guildId);
  return player?.playing || false;
}

export function isPaused(guildId: string): boolean {
  const player = getPlayer(guildId);
  return player?.paused || false;
}

export function pauseSong(guildId: string): void {
  const player = getPlayer(guildId);
  if (player) player.pause(true);
}

export function resumeSong(guildId: string): void {
  const player = getPlayer(guildId);
  if (player) player.pause(false);
}

export function skipSong(guildId: string): Song | null {
  const player = getPlayer(guildId);
  if (!player || !player.queue.current) return null;

  const skipped = {
    title: player.queue.current.title,
    url: player.queue.current.uri,
    duration: player.queue.current.duration ? formatDuration(player.queue.current.duration) : undefined,
    requestedBy: player.queue.current.requester as string,
  };

  player.stop();
  return skipped;
}

export function toggleLoop(guildId: string): boolean {
  const player = getPlayer(guildId);
  if (!player) return false;

  player.setTrackRepeat(!player.trackRepeat);
  return player.trackRepeat;
}

export function clearQueue(guildId: string): number {
  const player = getPlayer(guildId);
  if (!player) return 0;

  const count = player.queue.size;
  player.queue.clear();
  return count;
}

export function destroyQueue(guildId: string): void {
  const player = getPlayer(guildId);
  if (player) {
    player.destroy();
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
