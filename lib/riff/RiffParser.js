"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const type_1 = require("strtok3/lib/type");
const strtok3 = require("strtok3/lib/core");
const Token = require("token-types");
const initDebug = require("debug");
const stream_1 = require("stream");
const RiffChunk = require("./RiffChunk");
const WaveChunk = require("./../wav/WaveChunk");
const ID3v2Parser_1 = require("../id3v2/ID3v2Parser");
const Util_1 = require("../common/Util");
const FourCC_1 = require("../common/FourCC");
const BasicParser_1 = require("../common/BasicParser");
const debug = initDebug('music-metadata:parser:RIFF');
/**
 * Resource Interchange File Format (RIFF) Parser
 *
 * WAVE PCM soundfile format
 *
 * Ref:
 *  http://www.johnloomis.org/cpe102/asgn/asgn1/riff.html
 *  http://soundfile.sapp.org/doc/WaveFormat
 *
 *  ToDo: Split WAVE part from RIFF parser
 */
class WavePcmParser extends BasicParser_1.BasicParser {
    parse() {
        return this.tokenizer.readToken(RiffChunk.Header)
            .then(riffHeader => {
            debug(`pos=${this.tokenizer.position}, parse: chunkID=${riffHeader.chunkID}`);
            if (riffHeader.chunkID !== 'RIFF')
                return null; // Not RIFF format
            return this.parseRiffChunk();
        })
            .catch(err => {
            if (err.message !== type_1.endOfFile) {
                throw err;
            }
        });
    }
    parseRiffChunk() {
        return this.tokenizer.readToken(FourCC_1.FourCcToken).then(type => {
            this.metadata.setFormat('dataformat', type);
            switch (type) {
                case "WAVE":
                    return this.readWaveChunk();
                default:
                    throw new Error(`Unsupported RIFF format: RIFF/${type}`);
            }
        });
    }
    readWaveChunk() {
        return this.tokenizer.readToken(RiffChunk.Header)
            .then(header => {
            this.header = header;
            debug(`pos=${this.tokenizer.position}, readChunk: chunkID=RIFF/WAVE/${header.chunkID}`);
            switch (header.chunkID) {
                case "LIST":
                    return this.parseListTag(header);
                case 'fact': // extended Format chunk,
                    this.metadata.setFormat('lossless', false);
                    return this.tokenizer.readToken(new WaveChunk.FactChunk(header)).then(fact => {
                        this.fact = fact;
                    });
                case "fmt ": // The Util Chunk, non-PCM Formats
                    return this.tokenizer.readToken(new WaveChunk.Format(header))
                        .then(fmt => {
                        let subFormat = WaveChunk.WaveFormat[fmt.wFormatTag];
                        if (!subFormat) {
                            debug("WAVE/non-PCM format=" + fmt.wFormatTag);
                            subFormat = "non-PCM (" + fmt.wFormatTag + ")";
                        }
                        this.metadata.setFormat('dataformat', 'WAVE/' + subFormat);
                        this.metadata.setFormat('bitsPerSample', fmt.wBitsPerSample);
                        this.metadata.setFormat('sampleRate', fmt.nSamplesPerSec);
                        this.metadata.setFormat('numberOfChannels', fmt.nChannels);
                        this.metadata.setFormat('bitrate', fmt.nBlockAlign * fmt.nSamplesPerSec * 8);
                        this.blockAlign = fmt.nBlockAlign;
                    });
                case "id3 ": // The way Picard, FooBar currently stores, ID3 meta-data
                case "ID3 ": // The way Mp3Tags stores ID3 meta-data
                    return this.tokenizer.readToken(new Token.BufferType(header.size))
                        .then(id3_data => {
                        const id3stream = new ID3Stream(id3_data);
                        const rst = strtok3.fromStream(id3stream);
                        return ID3v2Parser_1.ID3v2Parser.getInstance().parse(this.metadata, rst, this.options);
                    });
                case 'data': // PCM-data
                    if (this.metadata.format.lossless !== false) {
                        this.metadata.setFormat('lossless', true);
                    }
                    const numberOfSamples = this.fact ? this.fact.dwSampleLength : (header.size / this.blockAlign);
                    this.metadata.setFormat('numberOfSamples', numberOfSamples);
                    this.metadata.setFormat('duration', numberOfSamples / this.metadata.format.sampleRate);
                    this.metadata.setFormat('bitrate', this.metadata.format.numberOfChannels * this.blockAlign * this.metadata.format.sampleRate); // ToDo: check me
                    return this.tokenizer.ignore(header.size);
                default:
                    debug(`Ignore chunk: RIFF/${header.chunkID} of ${header.size} bytes`);
                    this.warnings.push("Ignore chunk: RIFF/" + header.chunkID);
                    return this.tokenizer.ignore(header.size);
            }
        }).then(() => {
            if (this.header.size % 2 === 1) {
                debug('Read odd padding byte'); // https://wiki.multimedia.cx/index.php/RIFF
                return this.tokenizer.ignore(1).then(() => this.readWaveChunk());
            }
            else {
                return this.readWaveChunk();
            }
        });
    }
    parseListTag(listHeader) {
        return this.tokenizer.readToken(FourCC_1.FourCcToken).then(listType => {
            debug('pos=%s, parseListTag: chunkID=RIFF/WAVE/LIST/%s', this.tokenizer.position, listType);
            switch (listType) {
                case 'INFO':
                    return this.parseRiffInfoTags(listHeader.size - 4);
                default:
                    this.warnings.push("Ignore chunk: RIFF/WAVE/LIST/" + listType);
                    debug("Ignoring chunkID=RIFF/WAVE/LIST/" + listType);
                case 'adtl':
                    return this.tokenizer.ignore(listHeader.size - 4);
            }
        });
    }
    parseRiffInfoTags(chunkSize) {
        if (chunkSize === 0) {
            return Promise.resolve(null);
        }
        return this.tokenizer.readToken(RiffChunk.Header)
            .then(header => {
            const valueToken = new RiffChunk.ListInfoTagValue(header);
            return this.tokenizer.readToken(valueToken).then(value => {
                this.addTag(header.chunkID, Util_1.default.stripNulls(value));
                chunkSize -= (8 + valueToken.len);
                if (chunkSize >= 8) {
                    return this.parseRiffInfoTags(chunkSize);
                }
                else if (chunkSize !== 0) {
                    throw Error("Illegal remaining size: " + chunkSize);
                }
            });
        });
    }
    addTag(id, value) {
        this.metadata.addTag('exif', id, value);
    }
}
exports.WavePcmParser = WavePcmParser;
class ID3Stream extends stream_1.Readable {
    constructor(buf) {
        super();
        this.buf = buf;
    }
    _read() {
        this.push(this.buf);
        this.push(null); // push the EOF-signaling `null` chunk
    }
}
