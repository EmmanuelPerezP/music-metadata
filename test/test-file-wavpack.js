"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path = require("path");
const metadata_parsers_1 = require("./metadata-parsers");
const t = chai_1.assert;
describe("Parse WavPack (audio/x-wavpack)", () => {
    const samplePath = path.join(__dirname, 'samples');
    const wv1 = path.join(samplePath, "MusicBrainz - Beth Hart - Sinner's Prayer.wv");
    function checkFormat(format) {
        t.strictEqual(format.dataformat, 'WavPack', 'format.dataformat');
        t.deepEqual(format.tagTypes, ['APEv2'], 'format.tagTypes');
        t.approximately(format.duration, 2.123, 1 / 1000, "format.duration");
    }
    function checkCommon(common) {
        t.strictEqual(common.title, "Sinner's Prayer", "common.title");
        t.deepEqual(common.artists, ['Beth Hart', 'Joe Bonamassa'], "common.artist");
    }
    metadata_parsers_1.Parsers.forEach(parser => {
        it(parser.description, () => {
            return parser.initParser(wv1, 'audio/x-wavpack', { native: true }).then(metadata => {
                checkFormat(metadata.format);
                checkCommon(metadata.common);
            });
        });
    });
});
//# sourceMappingURL=test-file-wavpack.js.map