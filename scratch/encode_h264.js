/*
  Aerostat Beam Coder - Redis-backed highly-scale-able and cloud-fit media beam engine.
  Copyright (C) 2019  Streampunk Media Ltd.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.

  https://www.streampunk.media/ mailto:furnace@streampunk.media
  14 Ormiscaig, Aultbea, Achnasheen, IV22 2JJ  U.K.
*/

const beamcoder = require('../index.js');
const fs = require('fs');

let endcode = Buffer.from([0, 0, 1, 0xb7]);

async function run() {
  let start = process.hrtime();
  let encParams = {
    name: 'libx264',
    width: 1920,
    height: 1080,
    bit_rate: 2000000,
    time_base: [1, 25],
    framerate: [25, 1],
    gop_size: 10,
    max_b_frames: 1,
    pix_fmt: 'yuv420p',
    priv_data: { preset: 'slow' }
  };

  let encoder = await beamcoder.encoder(encParams);
  console.log(encoder);
  //console.log(encoder.getProperties());

  let outFile = fs.createWriteStream('wibble.h264');

  for ( let i = 0 ; i < 200 ; i++ ) {
    let frame = beamcoder.frame({
      width: encParams.width,
      height: encParams.height,
      format: encParams.pix_fmt
    }).alloc();

    let linesize = frame.linesize;
    let [ ydata, bdata, cdata ] = frame.data;
    frame.pts = i;

    for ( let y = 0 ; y < frame.height ; y++ ) {
      for ( let x = 0 ; x < linesize[0] ; x++ ) {
        ydata[y * linesize[0] + x] =  x + y + i * 3;
      }
    }

    for ( let y = 0 ; y < frame.height / 2 ; y++) {
      for ( let x = 0; x < linesize[1] ; x++) {
        bdata[y * linesize[1] + x] = 128 + y + i * 2;
        cdata[y * linesize[1] + x] = 64 + x + i * 5;
      }
    }

    let packets = await encoder.encode(frame);
    console.log(i, packets.total_time);
    packets.packets.forEach(x => outFile.write(x.data));
  }

  let p2 = await encoder.flush();
  console.log(p2.packets.length, p2.total_time);
  p2.packets.forEach(x => outFile.write(x.data));
  outFile.end(endcode);

  // global.gc();
  console.log('Total time ', process.hrtime(start));
}

run();
