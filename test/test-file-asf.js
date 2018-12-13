"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mm = require("../src");
const path = require("path");
const GUID_1 = require("../src/asf/GUID");
const AsfUtil_1 = require("../src/asf/AsfUtil");
const AsfObject_1 = require("../src/asf/AsfObject");
const metadata_parsers_1 = require("./metadata-parsers");
const t = chai_1.assert;
describe("Parse ASF", () => {
    describe("GUID", () => {
        it("should construct GUID from string", () => {
            const Header_GUID = Buffer.from([
                0x30, 0x26, 0xB2, 0x75, 0x8E, 0x66, 0xCF, 0x11,
                0xA6, 0xD9, 0x00, 0xAA, 0x00, 0x62, 0xCE, 0x6C
            ]);
            chai_1.assert.deepEqual(GUID_1.default.HeaderObject.toBin(), Header_GUID);
        });
    });
    /**
     * Trying Buffer.readUIntLE(0, 8)
     * Where 8 is 2 bytes longer then maximum allowed of 6
     */
    it("should be able to roughly decode a 64-bit QWord", () => {
        const tests = [
            {
                raw: "\xFF\x00\x00\x00\x00\x00\x00\x00",
                expected: 0xFF,
                description: "8-bit"
            },
            {
                raw: "\xFF\xFF\x00\x00\x00\x00\x00\x00",
                expected: 0xFFFF,
                description: "16-bit"
            },
            {
                raw: "\xFF\xFF\xFF\xFF\x00\x00\x00\x00",
                expected: 0xFFFFFFFF,
                description: "32-bit"
            },
            {
                raw: "\xFF\xFF\xFF\xFF\xFF\x00\x00\x00",
                expected: 0xFFFFFFFFFF,
                description: "40-bit"
            },
            {
                raw: "\xFF\xFF\xFF\xFF\xFF\xFF\x00\x00",
                expected: 0xFFFFFFFFFFFF,
                description: "48-bit"
            },
            {
                raw: "\xFF\xFF\xFF\xFF\xFF\xFF\x0F\x00",
                expected: 0xFFFFFFFFFFFFF,
                description: "52-bit"
            }
        ];
        tests.forEach(test => {
            const buf = Buffer.from(test.raw, "binary");
            t.strictEqual(AsfUtil_1.AsfUtil.getParserForAttr(AsfObject_1.DataType.QWord)(buf), test.expected, test.description);
        });
    });
    describe("parse", () => {
        const asfFilePath = path.join(__dirname, 'samples', 'asf.wma');
        function checkFormat(format) {
            t.strictEqual(format.dataformat, 'ASF/audio', 'format.dataformat');
            t.strictEqual(format.duration, 244.885, 'format.duration');
            t.strictEqual(format.bitrate, 192639, 'format.bitrate');
        }
        function checkCommon(common) {
            t.strictEqual(common.title, "Don't Bring Me Down", 'common.title');
            t.deepEqual(common.artist, 'Electric Light Orchestra', 'common.artist');
            t.deepEqual(common.albumartist, 'Electric Light Orchestra', 'common.albumartist');
            t.strictEqual(common.album, 'Discovery', 'common.album');
            t.strictEqual(common.year, 2001, 'common.year');
            t.deepEqual(common.track, { no: 9, of: null }, 'common.track 9/0');
            t.deepEqual(common.disk, { no: null, of: null }, 'common.disk 0/0');
            t.deepEqual(common.genre, ['Rock'], 'common.genre');
        }
        function checkNative(native) {
            t.deepEqual(native['WM/AlbumTitle'], ['Discovery'], 'native: WM/AlbumTitle');
            t.deepEqual(native['WM/BeatsPerMinute'], [117], 'native: WM/BeatsPerMinute');
            t.deepEqual(native.REPLAYGAIN_TRACK_GAIN, ['-4.7 dB'], 'native: REPLAYGAIN_TRACK_GAIN');
        }
        describe("should decode an ASF audio file (.wma)", () => {
            metadata_parsers_1.Parsers.forEach(parser => {
                it(parser.description, () => {
                    return parser.initParser(asfFilePath, 'audio/x-ms-wma', { native: true }).then(metadata => {
                        checkFormat(metadata.format);
                        checkCommon(metadata.common);
                        t.ok(metadata.native && metadata.native.asf, 'should include native ASF tags');
                        checkNative(mm.orderTags(metadata.native.asf));
                    });
                });
            });
        });
        describe("should decode picture from", () => {
            metadata_parsers_1.Parsers.forEach(parser => {
                it(parser.description, () => {
                    const filePath = path.join(__dirname, 'samples', 'issue_57.wma');
                    return parser.initParser(filePath, 'audio/x-ms-wma', { native: true }).then(metadata => {
                        const asf = mm.orderTags(metadata.native.asf);
                        chai_1.assert.exists(asf['WM/Picture'][0], 'ASF WM/Picture should be set');
                        const nativePicture = asf['WM/Picture'][0];
                        chai_1.assert.exists(nativePicture.data);
                    });
                });
            });
        });
        /**
         * Related issue: https://github.com/Borewit/music-metadata/issues/68
         */
        it("should be able to parse truncated .wma file", () => {
            const filePath = path.join(__dirname, 'samples', '13 Thirty Dirty Birds.wma');
            return mm.parseFile(filePath, { duration: true, native: true }).then(metadata => {
                const asf = mm.orderTags(metadata.native.asf);
                // ToDo: Contains some WM/... tags which could be parsed / mapped better
                chai_1.assert.strictEqual(metadata.common.title, "Thirty Dirty Birds", "metadata.common.title");
                chai_1.assert.strictEqual(metadata.common.artist, "The Red Hot Chili Peppers", "metadata.common.artist");
                chai_1.assert.strictEqual(metadata.common.date, "2003", "metadata.common.date");
                chai_1.assert.deepEqual(metadata.common.label, ["Capitol"], "metadata.common.label");
                chai_1.assert.strictEqual(metadata.common.track.no, 13, "metadata.common.track.no");
                chai_1.assert.exists(asf);
            });
        });
    });
});
//# sourceMappingURL=test-file-asf.js.map