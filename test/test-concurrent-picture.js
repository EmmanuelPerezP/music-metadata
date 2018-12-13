"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mm = require("../src");
const fs = require("graceful-fs");
const path = require("path");
const t = chai_1.assert;
it("should handle concurrent parsing of pictures", () => {
    const files = [path.join(__dirname, 'samples', 'flac.flac'), path.join(__dirname, 'samples', 'flac-bug.flac')];
    return Promise.all(files.map(file => {
        return mm.parseFile(file).then(result => {
            const data = fs.readFileSync(file + '.jpg');
            t.deepEqual(result.common.picture[0].data, data, 'check picture');
        });
    }));
});
//# sourceMappingURL=test-concurrent-picture.js.map