# MediaHub Development & Binary Dependencies Guide

This guide details how to install and configure native binary dependencies (`yt-dlp` and `ffmpeg`) for local development, production servers, and Docker containers.

---

## 🛠️ Binary Dependencies

MediaHub uses **`yt-dlp`** for media metadata extraction and stream downloading, and **`ffmpeg`** for audio extraction and format conversion.

---

## 📥 Installation Instructions

### 1. Windows (winget / scoop / manual)

#### Using Windows Package Manager (`winget`):
```cmd
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
```

#### Using `scoop`:
```cmd
scoop install yt-dlp ffmpeg
```

#### Manual Direct Binary Download:
1. Download `yt-dlp.exe` from [yt-dlp releases](https://github.com/yt-dlp/yt-dlp/releases).
2. Save `yt-dlp.exe` into a folder (e.g. `C:\yt-dlp\yt-dlp.exe`).
3. Add `C:\yt-dlp` to your Windows System `PATH` environment variable, OR set the environment variable:
   ```cmd
   setx YT_DLP_PATH "C:\yt-dlp\yt-dlp.exe"
   ```

---

### 2. macOS (Homebrew)

```bash
brew install yt-dlp ffmpeg
```

---

### 3. Linux (Ubuntu / Debian / Arch)

#### Ubuntu / Debian:
```bash
sudo apt update
sudo apt install -y ffmpeg
sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

---

### 4. Docker (`Dockerfile`)

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    wget \
    python3 \
    && wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && rm -rf /var/lib/apt/lists/*
```

---

## ⚙️ Environment Variables

| Variable | Description | Example |
| :--- | :--- | :--- |
| `YT_DLP_PATH` | Explicit absolute path to `yt-dlp` executable | `C:\yt-dlp\yt-dlp.exe` or `/usr/local/bin/yt-dlp` |
| `FFMPEG_PATH` | Explicit absolute path to `ffmpeg` executable | `C:\ffmpeg\bin\ffmpeg.exe` or `/usr/bin/ffmpeg` |

---

## 🔍 Startup Verification Commands

Verify installed binaries:

```bash
yt-dlp --version
ffmpeg -version
```

During application startup (`apps/api` and `apps/worker`), MediaHub logs detected executable locations:

```text
[MediaHub Downloader] Initializing binary dependency checks...
✓ yt-dlp binary resolved: yt-dlp.exe (Version: 2026.01.15)
✓ ffmpeg binary resolved: ffmpeg.exe (Version: 7.0.2)
[MediaHub Downloader] Dependency validation complete.
```
