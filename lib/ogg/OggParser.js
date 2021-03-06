"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token = require("token-types");
const initDebug = require("debug");
const Util_1 = require("../common/Util");
const FourCC_1 = require("../common/FourCC");
const VorbisParser_1 = require("./vorbis/VorbisParser");
const OpusParser_1 = require("./opus/OpusParser");
const SpeexParser_1 = require("./speex/SpeexParser");
const BasicParser_1 = require("../common/BasicParser");
const debug = initDebug('music-metadata:parser:ogg');
class SegmentTable {
    static sum(buf, off, len) {
        let s = 0;
        for (let i = off; i < off + len; ++i) {
            s += buf[i];
        }
        return s;
    }
    constructor(header) {
        this.len = header.page_segments;
    }
    get(buf, off) {
        return {
            totalPageSize: SegmentTable.sum(buf, off, this.len)
        };
    }
}
exports.SegmentTable = SegmentTable;
/**
 * Parser for Ogg logical bitstream framing
 */
class OggParser extends BasicParser_1.BasicParser {
    static getInstance() {
        return new OggParser();
    }
    /**
     * Parse page
     * @returns {Promise<void>}
     */
    parse() {
        debug('pos=%s, parsePage()', this.tokenizer.position);
        return this.tokenizer.readToken(OggParser.Header).then(header => {
            if (header.capturePattern !== 'OggS') { // Capture pattern
                throw new Error('expected ogg header but was not found');
            }
            this.header = header;
            this.pageNumber = header.pageSequenceNo;
            debug('page#=%s, Ogg.id=%s', header.pageSequenceNo, header.capturePattern);
            return this.tokenizer.readToken(new SegmentTable(header)).then(segmentTable => {
                debug('totalPageSize=%s', segmentTable.totalPageSize);
                return this.tokenizer.readToken(new Token.BufferType(segmentTable.totalPageSize)).then(pageData => {
                    debug('firstPage=%s, lastPage=%s, continued=%s', header.headerType.firstPage, header.headerType.lastPage, header.headerType.continued);
                    if (header.headerType.firstPage) {
                        const id = new Token.StringType(7, 'ascii').get(pageData, 0);
                        switch (id) {
                            case 'vorbis': // Ogg/Vorbis
                                debug('Set page consumer to Ogg/Vorbis ');
                                this.pageConsumer = new VorbisParser_1.VorbisParser(this.metadata, this.options);
                                break;
                            case 'OpusHea': // Ogg/Opus
                                debug('Set page consumer to Ogg/Opus');
                                this.pageConsumer = new OpusParser_1.OpusParser(this.metadata, this.options, this.tokenizer);
                                break;
                            case 'Speex  ': // Ogg/Speex
                                debug('Set page consumer to Ogg/Speex');
                                this.pageConsumer = new SpeexParser_1.SpeexParser(this.metadata, this.options, this.tokenizer);
                                break;
                            default:
                                throw new Error('gg audio-codec not recognized (id=' + id + ')');
                        }
                    }
                    this.metadata.setFormat('dataformat', 'Ogg/' + this.pageConsumer.codecName);
                    this.pageConsumer.parsePage(header, pageData);
                    if (!header.headerType.lastPage) {
                        return this.parse(); // Parse next page
                    }
                });
            });
        })
            .catch(err => {
            if (err.message === 'End-Of-File') {
                return; // Ignore this error
            }
            else if (err.message.startsWith('FourCC')) {
                if (this.pageNumber > 0) {
                    // ignore this error: work-around if last OGG-page is not marked with last-page flag
                    this.warnings.push('Invalid FourCC ID, maybe last OGG-page is not marked with last-page flag');
                    return this.pageConsumer.flush();
                }
            }
            throw err;
        });
    }
}
OggParser.Header = {
    len: 27,
    get: (buf, off) => {
        return {
            capturePattern: FourCC_1.FourCcToken.get(buf, off),
            version: buf.readUInt8(off + 4),
            headerType: {
                continued: Util_1.default.strtokBITSET.get(buf, off + 5, 0),
                firstPage: Util_1.default.strtokBITSET.get(buf, off + 5, 1),
                lastPage: Util_1.default.strtokBITSET.get(buf, off + 5, 2)
            },
            // packet_flag: buf.readUInt8(off + 5),
            absoluteGranulePosition: buf.readIntLE(off + 6, 6),
            streamSerialNumber: Token.UINT32_LE.get(buf, off + 14),
            pageSequenceNo: Token.UINT32_LE.get(buf, off + 18),
            pageChecksum: Token.UINT32_LE.get(buf, off + 22),
            page_segments: buf.readUInt8(off + 26)
        };
    }
};
exports.OggParser = OggParser;
