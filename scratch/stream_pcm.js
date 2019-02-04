/*
  Aerostat Beam Coder - Node.js native bindings for FFmpeg.
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
const createDemuxer = beamcoder.createDemuxer;
const fs = require('fs');
const util = require('util');

async function run() {
  const srcStream = fs.createReadStream('../../media/dpp/AS11_DPP_HD_EXAMPLE_1.mxf');
  let demuxer = await createDemuxer(srcStream);
  console.log(demuxer.streams[1]);

  let decoder = await beamcoder.decoder({ demuxer: demuxer, stream_index : 1 });
  console.log(decoder);

  const audStream = demuxer.streams[1];
  let filterer = await beamcoder.filterer({
    filterType: 'audio',
    inputParams: [
      {
        name: '0:a',
        sampleRate: audStream.codecpar.sample_rate,
        sampleFormat: audStream.codecpar.format,
        channelLayout: 'mono',
        timeBase: audStream.time_base
      }
    ],
    filterSpec: '[0:a] aresample=8000, aformat=sample_fmts=s16:channel_layouts=mono'
  });
  console.log(filterer.graph);
  console.log(util.inspect(filterer.graph.filters[2], {depth: null}));
  console.log(filterer.graph.dump());

  for ( let x = 0 ; x < 10 ; x++ ) {
    let packet = await demuxer.read();
    if (packet.stream_index == 1) {
      // console.log(packet);
      let frames = await decoder.decode(packet);
      console.log(frames);

      let filtFrames = await filterer.filter([
        { name: '0:a', frames: frames }
      ]);
      console.log(filtFrames);
    }
  }
}

run().catch(console.error);
