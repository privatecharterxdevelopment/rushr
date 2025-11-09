# Convert iPhone Mockup Animation to Video

The current animation uses 924 PNG frames which causes performance issues (choppy playback, slow loading). Converting to video will make it **much smoother** and **60% smaller** in file size.

## Option 1: Use ffmpeg (Recommended)

Install ffmpeg:
```bash
# macOS
brew install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

Convert PNG frames to MP4 and WebM:

```bash
cd "/Users/macbookair/Downloads/rushr-main 2/rushr/public/iphonemockupgif/iphone-spin-up-export-webm 2"

# Create high-quality MP4 (H.264)
ffmpeg -framerate 30 -i frame_%04d.png -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart ../../iphone-mockup-animation.mp4

# Create WebM version (better quality, smaller size for modern browsers)
ffmpeg -framerate 30 -i frame_%04d.png -c:v libvpx-vp9 -crf 30 -b:v 0 -pix_fmt yuva420p ../../iphone-mockup-animation.webm
```

**What these commands do:**
- `-framerate 30`: Match original 30fps
- `-crf 18` (MP4) / `-crf 30` (WebM): Quality (lower = better quality, 18-30 is good)
- `-preset slow`: Better compression (takes longer but smaller file)
- `-movflags +faststart`: Enables streaming (video starts playing before fully loaded)
- `-pix_fmt yuv420p`: Ensures compatibility with all browsers/devices

**Expected file sizes:**
- 924 PNG frames: ~150-200 MB
- MP4 video: ~5-10 MB (95% smaller!)
- WebM video: ~3-8 MB (even smaller!)

## Option 2: Online Converter (No Installation)

If you can't install ffmpeg:

1. Zip all PNG frames
2. Go to https://cloudconvert.com/png-to-mp4
3. Upload the ZIP or first frame
4. Set framerate to 30fps
5. Download the MP4
6. (Optional) Convert MP4 to WebM at https://cloudconvert.com/mp4-to-webm

## After Conversion

Once you have the video files:

1. Place them in `/public/` directory:
   - `/public/iphone-mockup-animation.mp4`
   - `/public/iphone-mockup-animation.webm`

2. Update Hero.tsx to use video version:

```tsx
// Replace this line:
const AnimatedPhoneMockup = dynamic(() => import('./AnimatedPhoneMockup'), { ssr: false })

// With this:
const AnimatedPhoneMockup = dynamic(() => import('./AnimatedPhoneMockupVideo'), { ssr: false })
```

## Benefits

✅ **95% smaller file size** (150MB → 5-10MB)
✅ **Smooth 30fps playback** (no frame stuttering)
✅ **Faster page load** (video streaming vs loading 924 images)
✅ **Better mobile performance** (hardware-accelerated video decoding)
✅ **Automatic looping** with no gaps

## Troubleshooting

**Video not playing:**
- Check browser console for errors
- Ensure video files are in `/public/` directory
- Try accessing directly: `http://localhost:3000/iphone-mockup-animation.mp4`

**Video quality issues:**
- Lower `-crf` value for better quality (e.g., `-crf 15`)
- Use higher bitrate: add `-b:v 5M` for 5 Mbps

**File size too large:**
- Increase `-crf` value (e.g., `-crf 25`)
- Reduce framerate: `-framerate 24` instead of 30
- Resize video: add `-vf scale=600:-1` to scale width to 600px
