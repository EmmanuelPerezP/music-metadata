"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mm = require("../src");
const path = require("path");
const t = chai_1.assert;
describe("Parse MP3 files", () => {
    const samplePath = path.join(__dirname, 'samples');
    it("should handle audio-frame-header-bug", function () {
        this.timeout(15000); // It takes a long time to parse
        const filePath = path.join(samplePath, 'audio-frame-header-bug.mp3');
        return mm.parseFile(filePath, { duration: true }).then(result => {
            // FooBar: 3:20.556 (8.844.527 samples); 44100 Hz => 200.5561678004535 seconds
            // t.strictEqual(result.format.duration, 200.59591666666665); // previous
            // t.strictEqual(result.format.duration, 200.5561678004535); // FooBar
            // If MPEG Layer II is accepted, it will give back third frame with a different frame length;
            // therefore it start counting actual parsable frames ending up on ~66.86
            t.strictEqual(result.format.duration, 66.8560544217687);
        });
    });
    describe('should be able to parse: Sleep Away.mp3 ', () => {
        const filePath = path.join(samplePath, 'mp3', 'Sleep Away.mp3');
        it(`parse`, () => {
            return mm.parseFile(filePath, { duration: true }).then(metadata => {
                const format = metadata.format;
                chai_1.assert.deepEqual(format.dataformat, 'mp3');
                chai_1.assert.strictEqual(format.sampleRate, 44100);
                chai_1.assert.strictEqual(format.numberOfChannels, 2);
                const common = metadata.common;
                chai_1.assert.strictEqual(common.title, 'Sleep Away');
                chai_1.assert.strictEqual(common.artist, 'Bob Acri');
                chai_1.assert.deepEqual(common.composer, ['Robert R. Acri']);
                chai_1.assert.deepEqual(common.genre, ['Jazz']);
            });
        });
    });
    describe("should handle incomplete MP3 file", () => {
        const filePath = path.join(samplePath, "incomplete.mp3");
        function checkFormat(format) {
            t.deepEqual(format.tagTypes, ['ID3v2.3', 'ID3v1'], 'format.tagTypes');
            t.approximately(format.duration, 61.73, 1 / 100, 'format.duration');
            t.strictEqual(format.dataformat, 'mp3', 'format.dataformat');
            t.strictEqual(format.lossless, false, 'format.lossless');
            t.strictEqual(format.sampleRate, 22050, 'format.sampleRate = 44.1 kHz');
            t.strictEqual(format.bitrate, 64000, 'format.bitrate = 128 kbit/sec');
            t.strictEqual(format.numberOfChannels, 2, 'format.numberOfChannels 2 (stereo)');
        }
        it("should decode from a file", () => {
            return mm.parseFile(filePath).then(metadata => {
                for (const tagType in metadata.native) {
                    throw new Error("Do not expect any native tag type, got: " + tagType);
                }
                checkFormat(metadata.format);
            });
        });
    });
});
//# sourceMappingURL=test-file-mp3.js.map