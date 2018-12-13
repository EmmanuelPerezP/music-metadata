"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mm = require("../src");
const path = require("path");
const t = chai_1.assert;
it("should decode non-ascii-characters", () => {
    const filename = 'bug-non ascii chars.mp3';
    const filePath = path.join(__dirname, 'samples', filename);
    return mm.parseFile(filePath).then(result => {
        t.deepEqual(result.common.artist, 'Janelle Monáe', 'common.artist');
        t.deepEqual(result.common.artists, ['Janelle Monáe', 'Roman Gianarthur', 'Nate Wonder'], 'common.artists');
    });
});
//# sourceMappingURL=test-nonasciichars.js.map