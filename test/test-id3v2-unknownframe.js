"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mm = require("../src");
const path = require("path");
const t = chai_1.assert;
it('invalid "Date" frame should not cause crash', () => {
    const filename = 'bug-id3v2-unknownframe.mp3';
    const filePath = path.join(__dirname, 'samples', filename);
    function checkCommon(common) {
        t.strictEqual(common.title, 'One', 'common.title');
        t.strictEqual(common.artist, 'Coheed And Cambria', 'common.artist');
        t.strictEqual(common.album, 'Year Of The Black Rainbow', 'common.album');
        t.strictEqual(common.year, 2010, 'common.year');
        t.deepEqual(common.track, { no: 1, of: null }, 'common.track');
        t.deepEqual(common.genre, ['Progressive Rock'], 'common.genre');
    }
    return mm.parseFile(filePath, { duration: true }).then(metadata => {
        checkCommon(metadata.common);
    });
});
//# sourceMappingURL=test-id3v2-unknownframe.js.map