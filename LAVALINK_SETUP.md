# Lavalink Setup Guide for Railway

This bot now uses **Lavalink** for music playback, which requires a separate Lavalink server.

## Why Lavalink?

- ✅ Handles YouTube's anti-bot detection automatically
- ✅ Supports YouTube, Spotify, SoundCloud, and more
- ✅ Better performance and reliability
- ✅ No need for cookies or manual downloads
- ✅ Industry standard for Discord music bots

---

## Deployment Architecture

You'll have **2 Railway deployments**:

1. **Railway Project #1**: Your Discord Bot ← (this repo)
2. **Railway Project #2**: Lavalink Server ← (new)

---

## Part 1: Deploy Lavalink Server on Railway

### Step 1: Create New Railway Project

1. Go to [Railway](https://railway.app/)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Fork this repo: [https://github.com/freyacodes/Lavalink](https://github.com/freyacodes/Lavalink)
5. Or use this template: [https://github.com/DarrenOfficial/lavalink-railway](https://github.com/DarrenOfficial/lavalink-railway)

### Step 2: Configure Lavalink

1. In your Lavalink Railway project, go to **Variables**
2. Add these environment variables:

```env
PORT=2333
LAVALINK_SERVER_PASSWORD=youshallnotpass
```

**Optional - Add Spotify Support:**

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

Get Spotify credentials from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

### Step 3: Get Lavalink Connection Details

1. In Railway, click your Lavalink deployment
2. Go to **Settings** → **Public Networking** → **Generate Domain**
3. Copy the generated URL (e.g., `lavalink-production-abcd.up.railway.app`)
4. **Save these details** for Part 2:
   - **Host**: `lavalink-production-abcd.up.railway.app`
   - **Port**: `443` (Railway uses HTTPS)
   - **Password**: `youshallnotpass` (or whatever you set)
   - **SSL**: `true`

---

## Part 2: Connect Your Discord Bot to Lavalink

### Step 1: Update Bot Environment Variables

In your **Discord Bot** Railway project (not Lavalink), add these variables:

```env
LAVALINK_HOST=lavalink-production-abcd.up.railway.app
LAVALINK_PORT=443
LAVALINK_PASSWORD=youshallnotpass
```

**Alternative: Use LAVALINK_NODES for multiple servers**

```env
LAVALINK_NODES=[{"host":"lavalink-production-abcd.up.railway.app","port":443,"password":"youshallnotpass","secure":true}]
```

### Step 2: Deploy Bot

1. Push your code to GitHub
2. Railway will automatically rebuild and Deploy
3. Check logs to confirm Lavalink connection:

```
Lavalink node "Node 1" connected
```

---

## Testing

Try these commands in Discord:

```
/music play never gonna give you up
/music play https://www.youtube.com/watch?v=dQw4w9WgXcQ
/music play https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
/music play https://soundcloud.com/artist/track
/music queue
/music skip
/music stop
```

---

## Troubleshooting

### Bot says "Lavalink manager not initialized"
- Make sure environment variables are set correctly
- Restart the bot deployment

### "Failed to connect to Lavalink node"
- Verify `LAVALINK_HOST` is the Railway domain (without `https://`)
- Check `LAVALINK_PORT` is `443` for Railway
- Ensure `LAVALINK_PASSWORD` matches what you set
- Make sure Lavalink deployment is running

### "Failed to load track"
- YouTube may be rate-limiting
- Try enabling Spotify support in Lavalink
- Check Lavalink logs for errors

### Spotify links don't work
- Add Spotify credentials to **Lavalink** environment variables (not bot)
- Restart Lavalink deployment

---

## Alternative: Use Public Lavalink Nodes (Not Recommended)

If you don't want to host your own Lavalink:

**⚠️ Warning**: Public nodes are unreliable and may go offline

Set this environment variable in your bot:

```env
LAVALINK_NODES=[{"host":"lavalink.devz.cloud","port":443,"password":"mathiscool","secure":true}]
```

Find more public nodes: [lavalink-list](https://lavalink-list.darrennathanael.com/)

---

## Cost

**Free Tier** (Railway):
- Both deployments fit within Railway's free tier
- ~$5/month if you exceed free tier limits

---

## Architecture Benefits

- **Separation of concerns**: Bot handles Discord logic, Lavalink handles audio
- **Better reliability**: If Lavalink goes down, bot stays online
- **Easier updates**: Update Lavalink without touching bot code
- **Multiple bots**: One Lavalink server can serve multiple bot instances

---

## Advanced: Adding More Sources

Lavalink supports plugins for additional sources:

- **Apple Music** (via plugin)
- **Deezer** (via plugin)
- **Bandcamp** (via plugin)

See [Lavalink Plugins](https://github.com/freyacodes/Lavalink#plugins)
