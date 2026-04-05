# Trailer Asset Pack

Use this pack to turn the current web race into a cinematic trailer sequence.

## Folder Layout

Place files here:

- `public/assets/trailer/video/`
- `public/assets/trailer/audio/`
- `public/assets/trailer/textures/`
- `public/assets/trailer/overlays/`

## Recommended Files

### Video Backplates

- `public/assets/trailer/video/desert-road-sunset.mp4`
  - Wide desert road / sunset plate for the main race background.
- `public/assets/trailer/video/runway-sunset.mp4`
  - Runway plate for staging and launch.
- `public/assets/trailer/video/desert-dust.mp4`
  - Dust / sand atmosphere loop with alpha if available, otherwise dark-background blend.

### Audio

- `public/assets/trailer/audio/cinematic-hit.mp3`
  - Use on countdown punch / GO.
- `public/assets/trailer/audio/cinematic-whoosh.mp3`
  - Use for camera transitions and shift accents.
- `public/assets/trailer/audio/desert-wind-loop.mp3`
  - Low ambience under the race.
- `public/assets/trailer/audio/drag-race-engine-loop.mp3`
  - Main engine loop if we replace the current placeholder engine sound.

### Textures

- `public/assets/trailer/textures/rogland-sunset.jpg`
  - Sunset sky / matte fallback.
- `public/assets/trailer/textures/aerial-asphalt_01_diffuse.jpg`
  - Better runway surface.
- `public/assets/trailer/textures/aerial-sand_diffuse.jpg`
  - Better shoulder / desert surface.

### Overlays

- `public/assets/trailer/overlays/heat-haze.png`
  - Subtle horizontal distortion / shimmer overlay.
- `public/assets/trailer/overlays/dust-foreground.png`
  - Foreground dust layer.
- `public/assets/trailer/overlays/lens-dirt.png`
  - Very subtle bloom dirt for sun highlights.

## Suggested Sources

### Free / CC0 / free-to-use sources

- Poly Haven `Rogland Sunset HDRI`
- Poly Haven `Goegap HDRI`
- Poly Haven `Aerial Asphalt 01`
- Poly Haven `Aerial Sand`
- Pexels runway / desert road sunset clips
- Pixabay cinematic hit / dust loops

## Integration Priority

1. `runway-sunset.mp4`
2. `desert-road-sunset.mp4`
3. `desert-dust.mp4`
4. `cinematic-hit.mp3`
5. `cinematic-whoosh.mp3`
6. `aerial-asphalt_01_diffuse.jpg`
7. `aerial-sand_diffuse.jpg`
8. overlays

## Notes

- Prefer short looping clips, 6-15 seconds.
- Favor 1080p H.264 MP4 for mobile web unless a lighter WebM is available.
- Keep files visually consistent: same sunset palette, same desert mood, no city assets.
