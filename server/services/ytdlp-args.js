const FAST_ARGS = [
  '--no-warnings',
  '--no-call-home',
  '--extractor-args', 'youtube:player_client=android,web',
  '--socket-timeout', '15',
];

export const DOWNLOAD_FAST_ARGS = [
  ...FAST_ARGS,
  ...(process.platform !== 'win32' ? ['--ffmpeg-location', process.env.FFMPEG_PATH || '/usr/bin/ffmpeg'] : []),
  '--concurrent-fragments', '4',
  '--http-chunk-size', '10485760',
  '--socket-timeout', '60',
  '--retries', '5',
  '--fragment-retries', '5',
  '--no-mtime',
  '--no-part',
];

export { FAST_ARGS };