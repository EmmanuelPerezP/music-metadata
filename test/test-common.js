"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const GenericTagMapper_1 = require("../src/common/GenericTagMapper");
const GenericTagTypes_1 = require("../src/common/GenericTagTypes");
const path = require("path");
const mm = require("../src");
const MimeType = require("media-typer");
const CombinedTagMapper_1 = require("../src/common/CombinedTagMapper");
const MetadataCollector_1 = require("../src/common/MetadataCollector");
const t = chai_1.assert;
describe("CommonTagMapper.parseGenre", () => {
    it("should be able to parse genres", () => {
        const tests = {
            Electronic: "Electronic",
            "Electronic/Rock": "Electronic/Rock",
            "(0)": "Blues",
            "(0)(1)(2)": "Blues/Classic Rock/Country",
            "(0)(160)(2)": "Blues/Electroclash/Country",
            "(0)(192)(2)": "Blues/Country",
            "(0)(255)(2)": "Blues/Country",
            "(4)Eurodisco": "Disco/Eurodisco",
            "(4)Eurodisco(0)Mopey": "Disco/Eurodisco/Blues/Mopey",
            "(RX)(CR)": "RX/CR",
            "1stuff": "1stuff",
            "RX/CR": "RX/CR"
        };
        for (const test in tests) {
            t.strictEqual(GenericTagMapper_1.CommonTagMapper.parseGenre(test), tests[test], test);
        }
    });
});
describe("GenericTagMap", () => {
    const combinedTagMapper = new CombinedTagMapper_1.CombinedTagMapper();
    it("Check if each native tag, is mapped to a valid common type", () => {
        t.isDefined(GenericTagTypes_1.commonTags);
        // for each tag type
        for (const nativeType in combinedTagMapper.tagMappers) {
            const tagMapper = combinedTagMapper.tagMappers[nativeType];
            for (const nativeTag in tagMapper.tagMap) {
                const commonType = tagMapper.tagMap[nativeTag];
                t.isDefined(GenericTagTypes_1.commonTags[commonType], "Unknown common tagTypes in mapping " + nativeType + "." + nativeTag + " => " + commonType);
            }
        }
    });
    it("should be able to distinct singletons", () => {
        // common tags, singleton
        t.ok(GenericTagTypes_1.isSingleton("title"), "common tag \"title\" is a singleton");
        t.ok(GenericTagTypes_1.isSingleton("artist"), "common tag \"artist\" is a singleton");
        t.ok(!GenericTagTypes_1.isSingleton("artists"), "common tag \"artists\" is not a singleton");
    });
    describe("common.artist / common.artists mapping", () => {
        it("should be able to join artists", () => {
            t.equal(MetadataCollector_1.joinArtists(["David Bowie"]), "David Bowie");
            t.equal(MetadataCollector_1.joinArtists(["David Bowie", "Stevie Ray Vaughan"]), "David Bowie & Stevie Ray Vaughan");
            t.equal(MetadataCollector_1.joinArtists(["David Bowie", "Queen", "Mick Ronson"]), "David Bowie, Queen & Mick Ronson");
        });
        it("parse RIFF tags", () => {
            const filePath = path.join(__dirname, "samples", "issue-89 no-artist.aiff");
            return mm.parseFile(filePath, { duration: true, native: true }).then(metadata => {
                t.deepEqual(metadata.common.artists, ["Beth Hart", "Joe Bonamassa"], "common.artists directly via WM/ARTISTS");
                t.strictEqual(metadata.common.artist, "Beth Hart & Joe Bonamassa", "common.artist derived from common.artists");
            });
        });
    });
});
describe("Convert rating", () => {
    it("should convert rating to stars", () => {
        chai_1.assert.equal(mm.ratingToStars(undefined), 0);
        chai_1.assert.equal(mm.ratingToStars(0), 1);
        chai_1.assert.equal(mm.ratingToStars(0.1), 1);
        chai_1.assert.equal(mm.ratingToStars(0.2), 2);
        chai_1.assert.equal(mm.ratingToStars(0.5), 3);
        chai_1.assert.equal(mm.ratingToStars(0.75), 4);
        chai_1.assert.equal(mm.ratingToStars(1), 5);
    });
});
describe("MimeType", () => {
    it('should be able to decode basic MIME-types', () => {
        const mime = MimeType.parse('audio/mpeg');
        chai_1.assert.equal(mime.type, 'audio');
        chai_1.assert.equal(mime.subtype, 'mpeg');
    });
    it('should be able to decode MIME-type parameters', () => {
        {
            const mime = MimeType.parse('message/external-body; access-type=URL');
            chai_1.assert.equal(mime.type, 'message');
            chai_1.assert.equal(mime.subtype, 'external-body');
            chai_1.assert.deepEqual(mime.parameters, { 'access-type': 'URL' });
        }
        {
            const mime = MimeType.parse('Text/HTML;Charset="utf-8"');
            chai_1.assert.equal(mime.type, 'text');
            chai_1.assert.equal(mime.subtype, 'html');
            chai_1.assert.deepEqual(mime.parameters, { charset: 'utf-8' });
        }
    });
    it('should be able to decode MIME-type suffix', () => {
        const mime = MimeType.parse('application/xhtml+xml');
        chai_1.assert.equal(mime.type, 'application');
        chai_1.assert.equal(mime.subtype, 'xhtml');
        chai_1.assert.equal(mime.suffix, 'xml');
    });
});
//# sourceMappingURL=test-common.js.map