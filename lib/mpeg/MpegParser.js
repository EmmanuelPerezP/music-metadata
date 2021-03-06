"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const Token = require("token-types");
const type_1 = require("strtok3/lib/type");
const initDebug = require("debug");
const Util_1 = require("../common/Util");
const AbstractID3Parser_1 = require("../id3v2/AbstractID3Parser");
const XingTag_1 = require("./XingTag");
const debug = initDebug('music-metadata:parser:mpeg');
/**
 * Cache buffer size used for searching synchronization preabmle
 */
const maxPeekLen = 1024;
/**
 * MPEG Audio Layer I/II/III frame header
 * Ref: https://www.mp3-tech.org/programmer/frame_header.html
 * Bit layout: AAAAAAAA AAABBCCD EEEEFFGH IIJJKLMM
 */
class MpegFrameHeader {
    constructor(buf, off) {
        // B(20,19): MPEG Audio versionIndex ID
        this.versionIndex = Util_1.default.getBitAllignedNumber(buf, off + 1, 3, 2);
        // C(18,17): Layer description
        this.layer = MpegFrameHeader.LayerDescription[Util_1.default.getBitAllignedNumber(buf, off + 1, 5, 2)];
        if (this.layer === null)
            throw new Error("Invalid MPEG layer");
        // D(16): Protection bit (if true 16-bit CRC follows header)
        this.isProtectedByCRC = !Util_1.default.isBitSet(buf, off + 1, 7);
        // E(15,12): Bitrate index
        this.bitrateIndex = Util_1.default.getBitAllignedNumber(buf, off + 2, 0, 4);
        // F(11,10): Sampling rate frequency index
        this.sampRateFreqIndex = Util_1.default.getBitAllignedNumber(buf, off + 2, 4, 2);
        // G(9): Padding bit
        this.padding = Util_1.default.isBitSet(buf, off + 2, 6);
        // H(8): Private bit
        this.privateBit = Util_1.default.isBitSet(buf, off + 2, 7);
        // I(7,6): Channel Mode
        this.channelModeIndex = Util_1.default.getBitAllignedNumber(buf, off + 3, 0, 2);
        // J(5,4): Mode extension (Only used in Joint stereo)
        this.modeExtension = Util_1.default.getBitAllignedNumber(buf, off + 3, 2, 2);
        // K(3): Copyright
        this.isCopyrighted = Util_1.default.isBitSet(buf, off + 3, 4);
        // L(2): Original
        this.isOriginalMedia = Util_1.default.isBitSet(buf, off + 3, 5);
        // M(3): The original bit indicates, if it is set, that the frame is located on its original media.
        this.emphasis = Util_1.default.getBitAllignedNumber(buf, off + 3, 7, 2);
        this.version = MpegFrameHeader.VersionID[this.versionIndex];
        if (this.version === null)
            throw new Error("Invalid MPEG Audio version");
        this.channelMode = MpegFrameHeader.ChannelMode[this.channelModeIndex];
        // Calculate bitrate
        const bitrateInKbps = this.calcBitrate();
        if (!bitrateInKbps) {
            throw new Error("Cannot determine bit-rate");
        }
        this.bitrate = bitrateInKbps === null ? null : bitrateInKbps * 1000;
        // Calculate sampling rate
        this.samplingRate = this.calcSamplingRate();
        if (this.samplingRate == null) {
            throw new Error("Cannot determine sampling-rate");
        }
    }
    calcDuration(numFrames) {
        return numFrames * this.calcSamplesPerFrame() / this.samplingRate;
    }
    calcSamplesPerFrame() {
        return MpegFrameHeader.samplesInFrameTable[this.version === 1 ? 0 : 1][this.layer];
    }
    calculateSideInfoLength() {
        if (this.layer !== 3)
            return 2;
        if (this.channelModeIndex === 3) {
            // mono
            if (this.version === 1) {
                return 17;
            }
            else if (this.version === 2 || this.version === 2.5) {
                return 9;
            }
        }
        else {
            if (this.version === 1) {
                return 32;
            }
            else if (this.version === 2 || this.version === 2.5) {
                return 17;
            }
        }
    }
    calcSlotSize() {
        return [null, 4, 1, 1][this.layer];
    }
    calcBitrate() {
        if (this.bitrateIndex === 0x00)
            return null; // free
        if (this.bitrateIndex === 0x0F)
            return null; // 'reserved'
        const mpegVersion = this.version.toString() + this.layer;
        return MpegFrameHeader.bitrate_index[this.bitrateIndex][mpegVersion];
    }
    calcSamplingRate() {
        if (this.sampRateFreqIndex === 0x03)
            return null; // 'reserved'
        return MpegFrameHeader.sampling_rate_freq_index[this.version][this.sampRateFreqIndex];
    }
}
MpegFrameHeader.SyncByte1 = 0xFF;
MpegFrameHeader.SyncByte2 = 0xE0;
MpegFrameHeader.VersionID = [2.5, null, 2, 1];
MpegFrameHeader.LayerDescription = [null, 3, 2, 1];
MpegFrameHeader.ChannelMode = ["stereo", "joint_stereo", "dual_channel", "mono"];
MpegFrameHeader.bitrate_index = {
    0x01: { 11: 32, 12: 32, 13: 32, 21: 32, 22: 8, 23: 8 },
    0x02: { 11: 64, 12: 48, 13: 40, 21: 48, 22: 16, 23: 16 },
    0x03: { 11: 96, 12: 56, 13: 48, 21: 56, 22: 24, 23: 24 },
    0x04: { 11: 128, 12: 64, 13: 56, 21: 64, 22: 32, 23: 32 },
    0x05: { 11: 160, 12: 80, 13: 64, 21: 80, 22: 40, 23: 40 },
    0x06: { 11: 192, 12: 96, 13: 80, 21: 96, 22: 48, 23: 48 },
    0x07: { 11: 224, 12: 112, 13: 96, 21: 112, 22: 56, 23: 56 },
    0x08: { 11: 256, 12: 128, 13: 112, 21: 128, 22: 64, 23: 64 },
    0x09: { 11: 288, 12: 160, 13: 128, 21: 144, 22: 80, 23: 80 },
    0x0A: { 11: 320, 12: 192, 13: 160, 21: 160, 22: 96, 23: 96 },
    0x0B: { 11: 352, 12: 224, 13: 192, 21: 176, 22: 112, 23: 112 },
    0x0C: { 11: 384, 12: 256, 13: 224, 21: 192, 22: 128, 23: 128 },
    0x0D: { 11: 416, 12: 320, 13: 256, 21: 224, 22: 144, 23: 144 },
    0x0E: { 11: 448, 12: 384, 13: 320, 21: 256, 22: 160, 23: 160 }
};
MpegFrameHeader.sampling_rate_freq_index = {
    1: { 0x00: 44100, 0x01: 48000, 0x02: 32000 },
    2: { 0x00: 22050, 0x01: 24000, 0x02: 16000 },
    2.5: { 0x00: 11025, 0x01: 12000, 0x02: 8000 }
};
MpegFrameHeader.samplesInFrameTable = [
    /* Layer   I    II   III */
    [0, 384, 1152, 1152],
    [0, 384, 1152, 576] // MPEG-2(.5
];
/**
 * MPEG Audio Layer I/II/III
 */
class MpegAudioLayer {
    static getVbrCodecProfile(vbrScale) {
        return "V" + (100 - vbrScale) / 10;
    }
}
MpegAudioLayer.FrameHeader = {
    len: 4,
    get: (buf, off) => {
        return new MpegFrameHeader(buf, off);
    }
};
class MpegParser extends AbstractID3Parser_1.AbstractID3Parser {
    constructor() {
        super(...arguments);
        this.frameCount = 0;
        this.countSkipFrameData = 0;
        this.bitrates = [];
        this.unsynced = 0;
        this.calculateEofDuration = false;
        this.buf_frame_header = Buffer.alloc(4);
        this.syncPeek = {
            buf: Buffer.alloc(maxPeekLen),
            len: 0
        };
    }
    /**
     * Called after ID3 headers have been parsed
     */
    _parse() {
        this.metadata.setFormat('lossless', false);
        return this.sync().catch(err => {
            if (err.message === type_1.endOfFile) {
                if (this.calculateEofDuration) {
                    const numberOfSamples = this.frameCount * this.samplesPerFrame;
                    this.metadata.setFormat('numberOfSamples', numberOfSamples);
                    const duration = numberOfSamples / this.metadata.format.sampleRate;
                    debug("Calculate duration at EOF: %s", duration);
                    this.metadata.setFormat('duration', duration);
                }
            }
            else {
                throw err;
            }
        });
    }
    /**
     * Called after file has been fully parsed, this allows, if present, to exclude the ID3v1.1 header length
     * @param metadata
     * @returns {INativeAudioMetadata}
     */
    finalize() {
        const format = this.metadata.format;
        if (!format.duration && this.tokenizer.fileSize && format.codecProfile === "CBR") {
            const hasID3v1 = this.metadata.native.hasOwnProperty('ID3v1');
            const mpegSize = this.tokenizer.fileSize - this.mpegOffset - (hasID3v1 ? 128 : 0);
            const numberOfSamples = Math.round(mpegSize / this.frame_size) * this.samplesPerFrame;
            this.metadata.setFormat('numberOfSamples', numberOfSamples);
            const duration = numberOfSamples / format.sampleRate;
            debug("Calculate CBR duration based on file size: %s", duration);
            this.metadata.setFormat('duration', duration);
        }
    }
    _peekBuffer() {
        this.unsynced += this.syncPeek.len;
        return this.tokenizer.ignore(this.syncPeek.len).then(() => {
            return this.tokenizer.peekBuffer(this.syncPeek.buf, 0, maxPeekLen).then(len => {
                this.syncPeek.len = len;
                return len;
            });
        });
    }
    _sync(offset, gotFirstSync) {
        return (offset === 0 ? this._peekBuffer() : Promise.resolve(this.syncPeek.buf.length - offset))
            .then(len => {
            if (gotFirstSync) {
                if (len === 0)
                    throw new Error(type_1.endOfFile);
                if ((this.syncPeek.buf[offset] & 0xE0) === 0xE0) {
                    this.syncPeek.len = 0;
                    this.unsynced += offset - 1;
                    return this.tokenizer.ignore(offset); // Full sync
                }
                else {
                    return this._sync((offset + 1) % this.syncPeek.buf.length, false); // partial sync
                }
            }
            else {
                if (len <= 1)
                    throw new Error(type_1.endOfFile);
                const index = this.syncPeek.buf.indexOf(MpegFrameHeader.SyncByte1, offset);
                if (index >= 0) {
                    return this._sync((index + 1) % this.syncPeek.buf.length, true);
                }
                else {
                    return this._sync(0, false);
                }
            }
        });
    }
    sync() {
        return this._sync(0, false)
            .then(() => {
            if (this.unsynced > 0) {
                this.warnings.push("synchronized, after " + this.unsynced + " bytes of unsynced data");
                // debug("synchronized, after " + this.unsynced + " bytes of unsynced data");
                this.unsynced = 0;
            }
            return this.parseAudioFrameHeader(this.buf_frame_header);
        });
    }
    parseAudioFrameHeader(buf_frame_header) {
        if (this.frameCount === 0) {
            this.mpegOffset = this.tokenizer.position - 1;
        }
        return this.tokenizer.readBuffer(buf_frame_header, 1, 3).then(() => {
            let header;
            try {
                header = MpegAudioLayer.FrameHeader.get(buf_frame_header, 0);
            }
            catch (err) {
                this.warnings.push("Parse error: " + err.message);
                return this.sync();
            }
            const format = this.metadata.format;
            // format.dataformat = "MPEG-" + header.version + " Audio Layer " + Util.romanize(header.layer);
            this.metadata.setFormat('dataformat', 'mp' + header.layer);
            this.metadata.setFormat('lossless', false);
            this.metadata.setFormat('bitrate', header.bitrate);
            this.metadata.setFormat('sampleRate', header.samplingRate);
            this.metadata.setFormat('numberOfChannels', header.channelMode === "mono" ? 1 : 2);
            if (this.frameCount < 20 * 10000) {
                debug('offset=%s MP%s bitrate=%s sample-rate=%s', this.tokenizer.position - 4, header.layer, header.bitrate, header.samplingRate);
            }
            const slot_size = header.calcSlotSize();
            if (slot_size === null) {
                throw new Error("invalid slot_size");
            }
            const samples_per_frame = header.calcSamplesPerFrame();
            const bps = samples_per_frame / 8.0;
            const fsize = (bps * header.bitrate / header.samplingRate) +
                ((header.padding) ? slot_size : 0);
            this.frame_size = Math.floor(fsize);
            this.audioFrameHeader = header;
            this.frameCount++;
            this.bitrates.push(header.bitrate);
            // xtra header only exists in first frame
            if (this.frameCount === 1) {
                this.offset = MpegAudioLayer.FrameHeader.len;
                return this.skipSideInformation();
            }
            if (this.frameCount === 3) {
                // the stream is CBR if the first 3 frame bitrates are the same
                if (this.areAllSame(this.bitrates)) {
                    // Actual calculation will be done in finalize
                    this.samplesPerFrame = samples_per_frame;
                    this.metadata.setFormat('codecProfile', 'CBR');
                    if (this.tokenizer.fileSize)
                        return; // Calculate duration based on file size
                }
                else if (!this.options.duration) {
                    return; // Done
                }
            }
            // once we know the file is VBR attach listener to end of
            // stream so we can do the duration calculation when we
            // have counted all the frames
            if (this.options.duration && this.frameCount === 4) {
                this.samplesPerFrame = samples_per_frame;
                this.calculateEofDuration = true;
            }
            this.offset = 4;
            if (header.isProtectedByCRC) {
                return this.parseCrc();
            }
            else {
                return this.skipSideInformation();
            }
        }).catch(err => {
            throw err; // Workaround for issue #174
        });
    }
    parseCrc() {
        this.tokenizer.readNumber(Token.INT16_BE).then(crc => {
            this.crc = crc;
        });
        this.offset += 2;
        return this.skipSideInformation();
    }
    skipSideInformation() {
        const sideinfo_length = this.audioFrameHeader.calculateSideInfoLength();
        // side information
        return this.tokenizer.readToken(new Token.BufferType(sideinfo_length)).then(() => {
            this.offset += sideinfo_length;
            return this.readXtraInfoHeader();
        });
    }
    readXtraInfoHeader() {
        return this.tokenizer.readToken(XingTag_1.InfoTagHeaderTag).then(headerTag => {
            this.offset += XingTag_1.InfoTagHeaderTag.len; // 12
            switch (headerTag) {
                case "Info":
                    this.metadata.setFormat('codecProfile', 'CBR');
                    return this.readXingInfoHeader();
                case "Xing":
                    return this.readXingInfoHeader().then(infoTag => {
                        const codecProfile = MpegAudioLayer.getVbrCodecProfile(infoTag.vbrScale);
                        this.metadata.setFormat('codecProfile', codecProfile);
                        return null;
                    });
                case "Xtra":
                    // ToDo: ???
                    break;
                case "LAME":
                    return this.tokenizer.readToken(XingTag_1.LameEncoderVersion).then(version => {
                        this.offset += XingTag_1.LameEncoderVersion.len;
                        this.metadata.setFormat('encoder', 'LAME ' + version);
                        return this.skipFrameData(this.frame_size - this.offset);
                    });
                // ToDo: ???
            }
            // ToDo: promise duration???
            const frameDataLeft = this.frame_size - this.offset;
            if (frameDataLeft < 0) {
                this.warnings.push("Frame " + this.frameCount + "corrupt: negative frameDataLeft");
                return this.sync();
            }
            else {
                return this.skipFrameData(frameDataLeft);
            }
        });
    }
    /**
     * Ref: http://gabriel.mp3-tech.org/mp3infotag.html
     * @returns {Promise<string>}
     */
    readXingInfoHeader() {
        return this.tokenizer.readToken(XingTag_1.XingInfoTag).then(infoTag => {
            this.offset += XingTag_1.XingInfoTag.len; // 12
            this.metadata.setFormat('encoder', Util_1.default.stripNulls(infoTag.encoder));
            if ((infoTag.headerFlags[3] & 0x01) === 1) {
                const duration = this.audioFrameHeader.calcDuration(infoTag.numFrames);
                this.metadata.setFormat('duration', duration);
                debug("Get duration from Xing header: %s", this.metadata.format.duration);
                return infoTag;
            }
            // frames field is not present
            const frameDataLeft = this.frame_size - this.offset;
            return this.skipFrameData(frameDataLeft).then(() => {
                return infoTag;
            });
        });
    }
    skipFrameData(frameDataLeft) {
        assert.ok(frameDataLeft >= 0, 'frame-data-left cannot be negative');
        return this.tokenizer.readToken(new Token.IgnoreType(frameDataLeft)).then(() => {
            this.countSkipFrameData += frameDataLeft;
            return this.sync();
        });
    }
    areAllSame(array) {
        const first = array[0];
        return array.every(element => {
            return element === first;
        });
    }
}
exports.MpegParser = MpegParser;
