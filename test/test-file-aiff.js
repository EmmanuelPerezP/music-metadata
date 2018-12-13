"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const metadata_parsers_1 = require("./metadata-parsers");
const chai_1 = require("chai");
const t = chai_1.assert;
describe('Parse AIFF (Audio Interchange File Format)', () => {
    const samplePath = path.join(__dirname, 'samples', 'aiff');
    const ULAW = 'ITU-T G.711 mu-law';
    function checkFormat(format, compressionType, sampleRate, channels, bitsPerSample, samples) {
        const lossless = compressionType === 'PCM';
        const dataFormat = lossless ? 'AIFF' : 'AIFF-C';
        const duration = samples / format.sampleRate;
        t.strictEqual(format.dataformat, dataFormat, `format.dataformat = '${dataFormat}'`);
        t.strictEqual(format.lossless, lossless, `format.lossless = ${lossless}`);
        t.strictEqual(format.sampleRate, sampleRate, `format.sampleRate = ${sampleRate} kHz`);
        t.strictEqual(format.bitsPerSample, bitsPerSample, `format.bitsPerSample = ${bitsPerSample} bit`);
        t.strictEqual(format.numberOfChannels, channels, `format.numberOfChannels = ${channels} channels`);
        t.strictEqual(format.numberOfSamples, samples, `format.numberOfSamples = ${samples} samples`);
        t.strictEqual(format.duration, duration, `format.duration = ${duration} sec.`);
        t.strictEqual(format.encoder, compressionType, `format.encoder = ${compressionType}`);
    }
    describe('Parse AIFF', () => {
        metadata_parsers_1.Parsers.forEach(parser => {
            it(parser.description, () => {
                // AIFF file, AIFF file, stereo 8-bit data
                // Source: http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/Samples.html
                return parser.initParser(path.join(samplePath, 'M1F1-int8-AFsp.aif'), 'audio/aiff', { native: true }).then(metadata => {
                    checkFormat(metadata.format, 'PCM', 8000, 2, 8, 23493);
                });
            });
        });
    });
    describe('Parse AIFF-C', () => {
        metadata_parsers_1.Parsers.forEach(parser => {
            it(parser.description, () => {
                // AIFF-C file, stereo A-law data (compression type: alaw)
                // Source: http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/Samples.html
                return parser.initParser(path.join(samplePath, 'M1F1-AlawC-AFsp.aif'), 'audio/aiff', { native: true }).then(metadata => {
                    checkFormat(metadata.format, 'Alaw 2:1', 8000, 2, 16, 23493);
                });
            });
        });
    });
    describe('Parse perverse Files', () => {
        describe('AIFF-C file (9 samples) with an odd length intermediate chunk', () => {
            metadata_parsers_1.Parsers.forEach(parser => {
                it(parser.description, () => {
                    return parser.initParser(path.join(samplePath, 'Pmiscck.aif'), 'audio/aiff', { native: true }).then(metadata => {
                        checkFormat(metadata.format, ULAW, 8000, 1, 16, 9);
                    });
                });
            });
        });
        describe('AIFF-C file with 0 samples (no SSND chunk)', () => {
            metadata_parsers_1.Parsers.forEach(parser => {
                it(parser.description, () => {
                    return parser.initParser(path.join(samplePath, 'Pnossnd.aif'), 'audio/aiff', { native: true }).then(metadata => {
                        checkFormat(metadata.format, ULAW, 8000, 1, 16, 0);
                    });
                });
            });
        });
        describe('AIFF-C file (9 samples), SSND chunk has a 5 byte offset to the data and trailing junk in the SSND chunk', () => {
            metadata_parsers_1.Parsers.forEach(parser => {
                it(parser.description, () => {
                    return parser.initParser(path.join(samplePath, 'Poffset.aif'), 'audio/aiff', { native: true }).then(metadata => {
                        checkFormat(metadata.format, ULAW, 8000, 1, 16, 9);
                    });
                });
            });
        });
        describe('AIFF-C file (9 samples) with SSND chunk ahead of the COMM chunk', () => {
            metadata_parsers_1.Parsers.forEach(parser => {
                it(parser.description, () => {
                    return parser.initParser(path.join(samplePath, 'Porder.aif'), 'audio/aiff', { native: true }).then(metadata => {
                        checkFormat(metadata.format, ULAW, 8000, 1, 16, 9);
                    });
                });
            });
        });
        describe.skip('AIFF-C file (9 samples) with trailing junk after the FORM chunk', () => {
            metadata_parsers_1.Parsers.forEach(parser => {
                it(parser.description, () => {
                    return parser.initParser(path.join(samplePath, 'Ptjunk.aif'), 'audio/aiff', { native: true }).then(metadata => {
                        checkFormat(metadata.format, ULAW, 8000, 1, 16, 9);
                    });
                });
            });
        });
        describe('AIFF-C file (9 samples) with COMM chunk declaring 92 bytes (1 byte longer than actual file length), SSND with 9 bytes, missing trailing fill byte', () => {
            metadata_parsers_1.Parsers.forEach(parser => {
                it(parser.description, () => {
                    return parser.initParser(path.join(samplePath, 'Fnonull.aif'), 'audio/aiff', { native: true }).then(metadata => {
                        checkFormat(metadata.format, ULAW, 8000, 1, 16, 9);
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=test-file-aiff.js.map