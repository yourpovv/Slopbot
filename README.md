# Slopbot

custom fun utility bot for the **Napped** discord server (discord.gg/napped) for onsloppy

## setup

**Deploy to Railway:**

```env
TOKEN=Example-Token
PREFIX=.
BRAND_NAME=/napped

# Music (Lavalink)
LAVALINK_HOST=your-lavalink.railway.app
LAVALINK_PORT=443
LAVALINK_PASSWORD=youshallnotpass
```

**brand name**: use `.brand Your Server Name` (owner only) to set the embed footer per server.

## commands

### moderation (staff only)

| command | aliases | description |
|---------|---------|-------------|
| /ban | .b | ban a member |
| /kick | .k | kick a member |
| /mute | .timeout, .stfu | timeout a member |
| /unmute | .untimeout | remove timeout |
| /purge | .clear, .prune | bulk delete messages with filters |
| /nuke | - | delete and recreate channel |
| /warn | .w | warn a member |
| /warnings | .warns, .infractions | view warnings |

### admin (staff only)

| command | aliases | description |
|---------|---------|-------------|
| /setup | - | configure server settings: roles, prefix, tickets, color/gender/age/extra roles (owner only) |
| /verify | .setupverify | set up verification system |
| /rules | .setuprules | send rules embed |
| /roles | .colorroles, .colors | send categorized role picker (3 categories: colors, identity, alerts) |
| /rolepanel | - | manage button-based role selection panels (owner only) |
| /tickets | .ticketpanel | post customizable ticket panel (modal input) |
| /starboard | - | configure starboard system (owner only) |
| /autoresponder | - | manage custom auto-responses (owner only) |
| /levels | - | configure XP leveling system (owner only) |
| /forcenick | .fn | force nickname on someone |
| /impersonate | .fake | webhook impersonation |
| /promo | .ad, .promote | promote the server |
| /giveaway | .gw, .gstart | start a giveaway |
| /fakekick | .fk, .bick | fake kick someone (DMs them then reveals) |
| /fakeban | .fb, .bean | fake ban someone (DMs them then reveals) |
| /fakenuke | .fnuke | fake nuke server (spam empty messages) |
| /mod | .modcmds, .modhelp | post moderation commands menu |

**hidden**: `.brand <text>` - set server brand/footer (owner only, auto-deletes)

### fun

| command | aliases | description |
|---------|---------|-------------|
| /ship | .love, .compat | ship two users |
| /rate | .rating | random rating with personality |
| /8ball | .eightball, .ask | magic 8ball |
| /thisorthat | .choose, .pick, .decide | decision picker |
| /crime | - | random crime roleplay |
| /simp | - | simp meter |
| /touchgrass | .grass, .gooutside | touch grass simulator |
| /punch | - | punch someone (GIF) |
| /slap | - | slap someone (GIF) |
| /rpkick | - | kick roleplay (GIF) |
| /kill | - | elimination roleplay (GIF) |
| /abuse | - | bully roleplay + fake warns (GIF) |
| /uwuify | .uwu, .owo | uwuify text |
| /nerdify | .nerd | nerdify text |
| /poll | .vote | create a poll |
| /block | - | block a user |
| /unblock | - | unblock a user |
| /blocklist | .bl, .blocked | view blocked users |
| /blackjack | .bj, .21 | play blackjack |
| /credits | .about, .info | who made this bot |
| /invite | .inv | bot invite link + server link |
| /lfg | .lookingforgroup, .party | start a looking-for-group party |
| /memberinfo | .mi, .userinfo, .ui, .whois | view info about a member |
| /rep | .+rep | give someone rep or check yours |
| /reptop | .replb, .repleaderboard | rep leaderboard |
| /random | .rand, .randnick, .rn | random nickname |
| /voice | - | manage your voice channel (lock, unlock, limit, rename, kick, claim, permit, reject) |
| /rank | - | view your XP rank and level |
| /leaderboard | .lb, .top | server XP leaderboard |
| /music | .m | play music from YouTube, Spotify, SoundCloud (play, pause, skip, loop, queue, stop) - **requires Lavalink** |

### nickname

| command | aliases | description |
|---------|---------|-------------|
| /nickname | .nick | random suffix |
| /clan | .clantag | add clan tag [TAG] name |
| /nickstyle | .ns | spaced, smallcaps, glitch, mirror |
| /nickcheck | .nickhistory | see past nicknames |

### auto responder

responds to: gm, gn, yo, gg, L, W, bruh, deez, bored, lol (30% chance)

## stack

- discord.js 14
- typescript (strict)
- better-sqlite3
- erela.js (Lavalink client)
- @discordjs/voice
- opusscript (audio encoding)
- dotenv

## required gateway intents

| intent | reason |
|--------|--------|
| Guilds | guild cache, channels, roles |
| GuildMembers | member join/leave events, nickname commands |
| GuildMessages | prefix command handling, auto responder |
| MessageContent | reading prefix command arguments |
| GuildMessageReactions | poll reactions |
| GuildWebhooks | /impersonate webhook creation |
| GuildPresences | /memberinfo online status |
| GuildVoiceStates | music playback (Lavalink) |

**partials:** Message, Reaction

## required bot permissions

| permission | used by |
|------------|---------|
| Send Messages | all commands |
| Embed Links | all embeds |
| Attach Files | credits, verify, rules, lfg, giveaway, invite, promo assets |
| Add Reactions | /poll |
| Use External Emojis | embeds |
| Read Message History | /purge, prefix commands |
| Manage Messages | /purge |
| Manage Nicknames | /nickname, /clan, /nickstyle, /forcenick |
| Change Nickname | self nickname |
| Manage Roles | /verify, /roles color picker |
| Manage Webhooks | /impersonate |
| Kick Members | /kick |
| Ban Members | /ban |
| Moderate Members | /mute, /unmute, /warn |
| Connect | /music (join voice channel) |
| Speak | /music (play audio) |

---

## Support & Contact

[YourPOV](https://yourpov.dev/)

> **Last Updated:** March 4, 2026 - v1.6.0 (Lavalink Integration)