"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mm = require("../src");
const path = require("path");
const t = chai_1.assert;
describe("Decode replaygain tags", () => {
    const filePath = path.join(__dirname, "samples", "04 Long Drive.flac");
    it("should decode replaygain tags from FLAC/Vorbis", () => {
        return mm.parseFile(filePath, { native: true }).then(metadata => {
            t.strictEqual(metadata.common.replaygain_track_gain, "-7.03 dB", "common.replaygain_track_gain");
            t.strictEqual(metadata.common.replaygain_track_peak, 0.99914551, "common.replaygain_track_peak");
        });
    });
});
//# sourceMappingURL=test-replaygain.js.map