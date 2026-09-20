import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, GuildMember, ChannelType } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from '@discordjs/voice';
import { Command } from '../../types';
import { brandEmbed, titled } from '../../services/embeds';
import * as music from '../../services/music';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const cmd: Command = {
  name: 'music',
  aliases: ['m'],
  description: 'music playback commands',
  cooldown: 3,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('music')
    .setDescription('music playback commands')
    .addSubcommand(sub =>
      sub
        .setName('play')
        .setDescription('play from youtube, spotify, or soundcloud')
        .addStringOption(opt =>
          opt
            .setName('url')
            .setDescription('youtube url or search query')
            .setRequired(false)
        )
        .addAttachmentOption(opt =>
          opt
            .setName('file')
            .setDescription('audio file to play (mp3, wav, etc)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('pause')
        .setDescription('pause the current song')
    )
    .addSubcommand(sub =>
      sub
        .setName('resume')
        .setDescription('resume playback')
    )
    .addSubcommand(sub =>
      sub
        .setName('skip')
        .setDescription('skip to the next song')
    )
    .addSubcommand(sub =>
      sub
        .setName('loop')
        .setDescription('toggle loop mode for current song')
    )
    .addSubcommand(sub =>
      sub
        .setName('queue')
        .setDescription('show the current queue')
    )
    .addSubcommand(sub =>
      sub
        .setName('nowplaying')
        .setDescription('show the currently playing song')
    )
    .addSubcommand(sub =>
      sub
        .setName('stop')
        .setDescription('stop playback and clear the queue')
    )
    .addSubcommand(sub =>
      sub
        .setName('clear')
        .setDescription('clear the queue')
    ),

  async run(i: ChatInputCommandInteraction): Promise<void> {
    if (!i.guildId) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId!, 'error', 'this command can only be used in a server')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const member = i.member as GuildMember;
    const voiceChannel = member.voice.channel;

    const sub = i.options.getSubcommand();

    if (sub === 'queue') {
      const queue = music.getQueue(i.guildId);
      if (!queue || queue.songs.length === 0) {
        return void await i.reply({
          embeds: [brandEmbed(i.guildId, 'info', 'the queue is empty')],
          flags: MessageFlags.Ephemeral,
        });
      }

      const current = queue.currentSong;
      const upcoming = queue.songs.slice(1, 11);

      let description = '';
      if (current) {
        description += `**now playing:**\n${current.title}\n${queue.looping ? '🔁 looping' : ''}\n\n`;
      }

      if (upcoming.length > 0) {
        description += '**up next:**\n';
        upcoming.forEach((song, i) => {
          description += `${i + 1}. ${song.title}\n`;
        });
      }

      if (queue.songs.length > 11) {
        description += `\n*...and ${queue.songs.length - 11} more*`;
      }

      return void await i.reply({
        embeds: [titled(i.guildId, 'info', '🎵 Queue', description)],
      });
    }

    if (sub === 'nowplaying') {
      const current = music.getCurrentSong(i.guildId);
      if (!current) {
        return void await i.reply({
          embeds: [brandEmbed(i.guildId, 'info', 'nothing is playing')],
          flags: MessageFlags.Ephemeral,
        });
      }

      const queue = music.getQueue(i.guildId);
      const status = music.isPlaying(i.guildId) ? '▶️ playing' : '⏸️ paused';
      const looping = queue?.looping ? ' 🔁 looping' : '';

      return void await i.reply({
        embeds: [titled(i.guildId, 'info', `${status} now`, `**${current.title}**\n${current.duration || ''}${looping}`)],
      });
    }

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return void await i.reply({
        embeds: [brandEmbed(i.guildId, 'error', 'you must be in a voice channel')],
        flags: MessageFlags.Ephemeral,
      });
    }

    switch (sub) {
      case 'play': {
        const url = i.options.getString('url');
        const file = i.options.getAttachment('file');

        if (!url && !file) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId, 'error', 'provide a url or search query')],
            flags: MessageFlags.Ephemeral,
          });
        }

        await i.deferReply();

        if (file) {
          try {
            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) {
              fs.mkdirSync(tempDir, { recursive: true });
            }

            const tempFile = path.join(tempDir, `${Date.now()}-${file.name}`);
            const fileStream = fs.createWriteStream(tempFile);

            console.log(`Downloading file: ${file.url} to ${tempFile}`);

            await new Promise<void>((resolve, reject) => {
              https.get(file.url, (response) => {
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                  fileStream.close();
                  resolve();
                });
              }).on('error', (err) => {
                console.error('File download error:', err);
                reject(err);
              });
            });

            console.log('File downloaded, joining voice channel...');

            const connection = joinVoiceChannel({
              channelId: voiceChannel.id,
              guildId: i.guildId,
              adapterCreator: voiceChannel.guild.voiceAdapterCreator as any,
            });

            const player = createAudioPlayer();
            const resource = createAudioResource(tempFile);

            console.log('Playing audio...');

            player.play(resource);
            connection.subscribe(player);

            player.on(AudioPlayerStatus.Idle, () => {
              console.log('Playback finished, cleaning up...');
              try {
                fs.unlinkSync(tempFile);
              } catch (e) {
                console.error('Error deleting temp file:', e);
              }
              connection.destroy();
            });

            player.on('error', (error) => {
              console.error('Audio player error:', error);
            });

            await i.editReply({
              embeds: [titled(i.guildId, 'success', '▶️ now playing', `**${file.name}**`)],
            });
          } catch (error) {
            console.error('File playback error:', error);
            await i.editReply({
              embeds: [brandEmbed(i.guildId, 'error', 'failed to play audio file')],
            });
          }
          return;
        }

        let queue = music.getQueue(i.guildId);
        if (!queue) {
          queue = music.createQueue(voiceChannel);
        }

        try {
          await music.playSong(i.guildId, url!, url!, i.user.tag);
          
          const current = music.getCurrentSong(i.guildId);
          if (current) {
            await i.editReply({
              embeds: [titled(i.guildId, 'success', '▶️ now playing', `**${current.title}**`)],
            });
          } else {
            await i.editReply({
              embeds: [titled(i.guildId, 'success', '➕ added to queue', `**${url}**`)],
            });
          }
        } catch (error: any) {
          await i.editReply({
            embeds: [brandEmbed(i.guildId, 'error', `failed to play: ${error.message}`)],
          });
        }
        break;
      }

      case 'pause': {
        if (!music.isPlaying(i.guildId)) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId, 'error', 'nothing is playing')],
            flags: MessageFlags.Ephemeral,
          });
        }

        music.pauseSong(i.guildId);
        await i.reply({
          embeds: [titled(i.guildId, 'success', '⏸️', 'paused playback')],
        });
        break;
      }

      case 'resume': {
        if (!music.isPaused(i.guildId)) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId, 'error', 'playback is not paused')],
            flags: MessageFlags.Ephemeral,
          });
        }

        music.resumeSong(i.guildId);
        await i.reply({
          embeds: [titled(i.guildId, 'success', '▶️', 'resumed playback')],
        });
        break;
      }

      case 'skip': {
        const skipped = music.skipSong(i.guildId);
        if (!skipped) {
          return void await i.reply({
            embeds: [brandEmbed(i.guildId, 'error', 'nothing to skip')],
            flags: MessageFlags.Ephemeral,
          });
        }

        const next = music.getCurrentSong(i.guildId);
        if (next) {
          await i.reply({
            embeds: [titled(i.guildId, 'success', '⏭️', `skipped **${skipped.title}**\nnow playing **${next.title}**`)],
          });
        } else {
          await i.reply({
            embeds: [titled(i.guildId, 'success', '⏭️', `skipped **${skipped.title}**\nqueue is empty`)],
          });
        }
        break;
      }

      case 'loop': {
        const looping = music.toggleLoop(i.guildId);
        await i.reply({
          embeds: [titled(i.guildId, 'success', '🔁 loop', looping ? 'enabled' : 'disabled')],
        });
        break;
      }

      case 'stop': {
        music.destroyQueue(i.guildId);
        await i.reply({
          embeds: [titled(i.guildId, 'success', '⏹️', 'stopped playback and left voice channel')],
        });
        break;
      }

      case 'clear': {
        const count = music.clearQueue(i.guildId);
        await i.reply({
          embeds: [titled(i.guildId, 'success', '🗑️', `cleared ${count} song${count === 1 ? '' : 's'} from queue`)],
        });
        break;
      }
    }
  },

  async prefix() {
  },
};

export default cmd;
