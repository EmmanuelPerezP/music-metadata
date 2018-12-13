"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path = require("path");
const metadata_parsers_1 = require("./metadata-parsers");
describe('Parse Musepack (.mpc)', () => {
    const samplePath = path.join(__dirname, 'samples', 'mpc');
    describe('Parse Musepack, SV7 with APEv2 header', () => {
        const filePath = path.join(samplePath, 'apev2.sv7.mpc');
        metadata_parsers_1.Parsers.forEach(parser => {
            it(parser.description, () => {
                return parser.initParser(filePath, 'audio/musepack', { native: true }).then(metadata => {
                    // Check format
                    const format = metadata.format;
                    chai_1.assert.deepEqual(format.dataformat, 'Musepack, SV7');
                    chai_1.assert.strictEqual(format.sampleRate, 44100);
                    chai_1.assert.strictEqual(format.numberOfSamples, 11940);
                    chai_1.assert.approximately(format.bitrate, 269649, 1);
                    chai_1.assert.strictEqual(format.encoder, '1.15');
                    // Check generic metadata
                    const common = metadata.common;
                    chai_1.assert.strictEqual(common.title, 'God Inside');
                    chai_1.assert.strictEqual(common.artist, 'Faze Action');
                    chai_1.assert.strictEqual(common.album, 'Broad Souls');
                    chai_1.assert.strictEqual(common.date, '2004-05-03');
                    chai_1.assert.strictEqual(common.barcode, '802085273528');
                    chai_1.assert.deepEqual(common.catalognumber, ['LUNECD35']);
                    chai_1.assert.strictEqual(common.media, 'CD');
                    chai_1.assert.strictEqual(common.releasecountry, 'GB');
                    chai_1.assert.deepEqual(common.track, { no: 9, of: 10 });
                });
            });
        });
    });
    describe('Handle APEv2 with missing header (only footer)', () => {
        /**
         * In this sample the APEv2 header is not present, only the APEv2 footer
         */
        const filePath = path.join(samplePath, 'apev2-no-header.sv7.mpc');
        metadata_parsers_1.Parsers.forEach(parser => {
            it(parser.description, () => {
                return parser.initParser(filePath, 'audio/musepack', { native: true }).then(metadata => {
                    // Check format
                    chai_1.assert.deepEqual(metadata.format.dataformat, 'Musepack, SV7');
                    chai_1.assert.strictEqual(metadata.format.sampleRate, 44100);
                    chai_1.assert.strictEqual(metadata.format.numberOfSamples, 11940);
                    chai_1.assert.approximately(metadata.format.bitrate, 269649, 1);
                    chai_1.assert.strictEqual(metadata.format.encoder, '1.15');
                    // Check generic metadata
                    chai_1.assert.strictEqual(metadata.common.title, 'God Inside');
                    chai_1.assert.strictEqual(metadata.common.artist, 'Faze Action');
                    chai_1.assert.strictEqual(metadata.common.album, 'Broad Souls');
                    chai_1.assert.strictEqual(metadata.common.date, '2004');
                    chai_1.assert.deepEqual(metadata.common.track, { no: 9, of: null });
                });
            });
        });
    });
    describe('Parse Musepack, SV8 with APEv2 header', () => {
        const filePath = path.join(samplePath, 'bach-goldberg-variatians-05.sv8.mpc');
        metadata_parsers_1.Parsers.forEach(parser => {
            it(parser.description, () => {
                return parser.initParser(filePath, 'audio/musepack', { native: true }).then(metadata => {
                    // Check format
                    chai_1.assert.deepEqual(metadata.format.dataformat, 'Musepack, SV8');
                    chai_1.assert.strictEqual(metadata.format.sampleRate, 48000);
                    chai_1.assert.strictEqual(metadata.format.numberOfSamples, 24000);
                    chai_1.assert.strictEqual(metadata.format.numberOfChannels, 2);
                    chai_1.assert.approximately(metadata.format.duration, 0.5, 1 / 2000);
                    chai_1.assert.approximately(metadata.format.bitrate, 32368, 1);
                    // Check generic metadata
                    chai_1.assert.strictEqual(metadata.common.title, 'Goldberg Variations, BWV 988: Variatio 4 a 1 Clav.');
                    chai_1.assert.strictEqual(metadata.common.artist, 'Johann Sebastian Bach');
                    chai_1.assert.deepEqual(metadata.common.artists, ['Johann Sebastian Bach']);
                    chai_1.assert.deepEqual(metadata.common.isrc, ['QMNYZ1200005']);
                    chai_1.assert.deepEqual(metadata.common.license, 'https://creativecommons.org/publicdomain/zero/1.0/');
                    chai_1.assert.strictEqual(metadata.common.album, 'Open Goldberg Variations');
                    chai_1.assert.strictEqual(metadata.common.date, '2012-05-28');
                    chai_1.assert.deepEqual(metadata.common.track, { no: 5, of: 32 });
                });
            });
        });
    });
});
//# sourceMappingURL=test-file-musepack.js.map