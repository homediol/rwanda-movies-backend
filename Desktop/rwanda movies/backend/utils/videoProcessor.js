const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class VideoProcessor {
  constructor() {
    this.outputDir = path.join(__dirname, '../uploads/hls');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  // Convert video to HLS with multiple resolutions
  async convertToHLS(inputPath, outputName) {
    const outputPath = path.join(this.outputDir, outputName);
    
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const resolutions = [
      { name: '240p', width: 426, height: 240, bitrate: '400k' },
      { name: '360p', width: 640, height: 360, bitrate: '800k' },
      { name: '480p', width: 854, height: 480, bitrate: '1200k' },
      { name: '720p', width: 1280, height: 720, bitrate: '2500k' },
      { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' }
    ];

    const promises = resolutions.map(res => this.createResolution(inputPath, outputPath, res));
    await Promise.all(promises);

    // Create master playlist
    await this.createMasterPlaylist(outputPath, resolutions);
    
    return `${outputName}/master.m3u8`;
  }

  createResolution(inputPath, outputPath, resolution) {
    return new Promise((resolve, reject) => {
      const outputFile = path.join(outputPath, `${resolution.name}.m3u8`);
      const segmentPattern = path.join(outputPath, `${resolution.name}_%03d.ts`);

      const command = `ffmpeg -i "${inputPath}" \
        -c:v libx264 -preset fast -crf 23 \
        -c:a aac -b:a 128k \
        -vf "scale=${resolution.width}:${resolution.height}" \
        -b:v ${resolution.bitrate} \
        -maxrate ${resolution.bitrate} \
        -bufsize ${parseInt(resolution.bitrate) * 2}k \
        -hls_time 6 \
        -hls_playlist_type vod \
        -hls_segment_filename "${segmentPattern}" \
        "${outputFile}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error creating ${resolution.name}:`, error);
          reject(error);
        } else {
          console.log(`Created ${resolution.name} successfully`);
          resolve();
        }
      });
    });
  }

  async createMasterPlaylist(outputPath, resolutions) {
    let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

    resolutions.forEach(res => {
      const bandwidth = parseInt(res.bitrate) * 1000;
      masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${res.width}x${res.height}\n`;
      masterContent += `${res.name}.m3u8\n`;
    });

    const masterPath = path.join(outputPath, 'master.m3u8');
    fs.writeFileSync(masterPath, masterContent);
    console.log('Master playlist created');
  }
}

module.exports = VideoProcessor;