"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mm = require("../src");
const path = require("path");
const samplePath = path.join(__dirname, 'samples');
describe("Parse RIFF (Resource Interchange File Format)", () => {
    describe("Parse RIFF/WAVE audio format", () => {
        function checkExifTags(exif) {
            chai_1.assert.deepEqual(exif.IART, ["Beth Hart & Joe Bonamassa"], "exif.IART");
            chai_1.assert.deepEqual(exif.ICRD, ["2011"], "exif.ICRD");
            chai_1.assert.deepEqual(exif.INAM, ["Sinner's Prayer"], "exif.INAM");
            chai_1.assert.deepEqual(exif.IPRD, ["Don't Explain"], "exif.IPRD");
            chai_1.assert.deepEqual(exif.ITRK, ["1/10"], "exif.ITRK");
        }
        /**
         * Looks like RIFF/WAV not fully supported yet in MusicBrainz Picard: https://tickets.metabrainz.org/browse/PICARD-653?jql=text%20~%20%22RIFF%22.
         * This file has been fixed with Mp3Tag to have a valid ID3v2.3 tag
         */
        it("should parse LIST-INFO (EXIF)", () => {
            const filename = "MusicBrainz - Beth Hart - Sinner's Prayer [id3v2.3].wav";
            const filePath = path.join(samplePath, filename);
            function checkFormat(format) {
                chai_1.assert.strictEqual(format.dataformat, "WAVE/PCM", "format.dataformat = WAVE/PCM");
                chai_1.assert.strictEqual(format.lossless, true);
                chai_1.assert.deepEqual(format.tagTypes, ['exif', 'ID3v2.3'], "format.tagTypes = ['exif', 'ID3v2.3']");
                chai_1.assert.strictEqual(format.sampleRate, 44100, 'format.sampleRate = 44.1 kHz');
                chai_1.assert.strictEqual(format.bitsPerSample, 16, 'format.bitsPerSample = 16 bits');
                chai_1.assert.strictEqual(format.numberOfChannels, 2, 'format.numberOfChannels = 2 channels');
                chai_1.assert.strictEqual(format.numberOfSamples, 93624, 'format.numberOfSamples = 93624');
                chai_1.assert.strictEqual(format.duration, 2.1229931972789116, 'format.duration = ~2.123 seconds (checked with Adobe Audition)');
            }
            // Parse wma/asf file
            return mm.parseFile(filePath, { native: true }).then(result => {
                // Check wma format
                checkFormat(result.format);
                // Check native tags
                checkExifTags(mm.orderTags(result.native.exif));
            });
        });
        // Issue https://github.com/Borewit/music-metadata/issues/75
        it("should be able to handle complex nested chunk structures", () => {
            const filePath = path.join(samplePath, "issue_75.wav");
            return mm.parseFile(filePath, { duration: true, native: true }).then(metadata => {
                chai_1.assert.deepEqual(metadata.format.dataformat, "WAVE/PCM");
            });
        });
        it("should map RIFF tags to common", () => {
            // Metadata edited with Adobe Audition CC 2018.1
            const filePath = path.join(__dirname, "samples", "riff_adobe_audition.wav");
            return mm.parseFile(filePath, { duration: true, native: true }).then(metadata => {
                const format = metadata.format;
                chai_1.assert.strictEqual(format.lossless, true);
                chai_1.assert.deepEqual(format.dataformat, "WAVE/PCM");
                chai_1.assert.deepEqual(format.bitsPerSample, 24);
                chai_1.assert.deepEqual(format.sampleRate, 48000);
                chai_1.assert.deepEqual(format.numberOfSamples, 13171);
                chai_1.assert.deepEqual(format.duration, 0.27439583333333334, "~2.274 (checked with Adobe Audition)");
                chai_1.assert.deepEqual(format.tagTypes, ['exif']);
                const exif = mm.orderTags(metadata.native.exif);
                chai_1.assert.deepEqual(exif.IART, ["Wolfgang Amadeus Mozart"], "exif.IART: Original Artist");
                chai_1.assert.deepEqual(exif.ICMS, ["Louis Walker"], "exif.ICMS: Commissioned");
                chai_1.assert.deepEqual(exif.ICMT, ["Comments here!"], "exif.ICMT: Comments");
                chai_1.assert.deepEqual(exif.ICOP, ["Copyright 2018"]);
                chai_1.assert.deepEqual(exif.ICRD, ["2018-04-26T13:26:19-05:00"]);
                chai_1.assert.deepEqual(exif.IENG, ["Engineer"], "exif.IENG: Engineer");
                chai_1.assert.deepEqual(exif.IARL, ["https://github.com/borewit/music-metadata"], "exif.IARL: Archival Location");
                chai_1.assert.deepEqual(exif.IGNR, ["Blues"], "exif.IGNR: Genre");
                chai_1.assert.deepEqual(exif.IKEY, ["neat; cool; riff; tags"], "exif.IKEY: Keywords");
                chai_1.assert.deepEqual(exif.IMED, ["CD"], "exif.IMED: Original Medium");
                chai_1.assert.deepEqual(exif.INAM, ["The Magic Flute"], "exif.INAM: Display Title");
                chai_1.assert.deepEqual(exif.IPRD, ["La clemenzo di Tito"], "exif.IPRD: Product");
                chai_1.assert.deepEqual(exif.ISBJ, ["An opera in two acts"], "exif.ISBJ: Subject");
                chai_1.assert.deepEqual(exif.ISFT, ["Adobe Audition CC 2018.1 (Macintosh)"]);
                chai_1.assert.deepEqual(exif.ISRC, ["Foo Bar"], "exif.ISRC Source Supplier");
                chai_1.assert.deepEqual(exif.ITCH, ["Technician"], "exif.ITCH: Technician");
                const common = metadata.common;
                chai_1.assert.deepEqual(common.artists, ["Wolfgang Amadeus Mozart"]);
                chai_1.assert.deepEqual(common.title, "The Magic Flute");
                chai_1.assert.deepEqual(common.album, "La clemenzo di Tito");
                chai_1.assert.deepEqual(common.date, "2018-04-26T13:26:19-05:00");
                chai_1.assert.deepEqual(common.year, 2018);
                chai_1.assert.deepEqual(common.encodedby, "Adobe Audition CC 2018.1 (Macintosh)");
                chai_1.assert.deepEqual(common.comment, ["Comments here!"]);
                chai_1.assert.deepEqual(common.genre, ["Blues"]);
                chai_1.assert.deepEqual(common.engineer, ["Engineer"]);
                chai_1.assert.deepEqual(common.technician, ["Technician"]);
                chai_1.assert.deepEqual(common.media, "CD");
            });
        });
        it("should handle be able to handle odd chunk & padding", () => {
            const filePath = path.join(samplePath, 'issue-161.wav');
            return mm.parseFile(filePath, { duration: true, native: true }).then(metadata => {
                const format = metadata.format;
                chai_1.assert.strictEqual(format.dataformat, "WAVE/PCM");
                chai_1.assert.strictEqual(format.lossless, true);
                chai_1.assert.strictEqual(format.sampleRate, 48000);
                chai_1.assert.strictEqual(format.bitsPerSample, 24);
                chai_1.assert.strictEqual(format.numberOfSamples, 363448);
                chai_1.assert.strictEqual(metadata.format.duration, format.numberOfSamples / format.sampleRate, "file's duration");
            });
        });
    });
    describe("non-PCM", () => {
        it("should parse Microsoft 4-bit ADPCM encoded", () => {
            const filePath = path.join(samplePath, "issue-92.wav");
            return mm.parseFile(filePath, { duration: true, native: true }).then(metadata => {
                const format = metadata.format;
                chai_1.assert.strictEqual(format.dataformat, "WAVE/ADPCM");
                chai_1.assert.strictEqual(format.lossless, false);
                chai_1.assert.strictEqual(format.sampleRate, 22050);
                chai_1.assert.strictEqual(format.bitsPerSample, 4);
                chai_1.assert.strictEqual(format.numberOfSamples, 4660260);
                chai_1.assert.strictEqual(metadata.format.duration, format.numberOfSamples / format.sampleRate, "file's duration is 3'31\"");
            });
        });
    });
});
//# sourceMappingURL=test-file-riff.js.map