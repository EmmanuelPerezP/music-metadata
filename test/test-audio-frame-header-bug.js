"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mm = require("../src");
const path = require("path");
const t = chai_1.assert;
it("should handle audio-frame-header-bug", function () {
    this.timeout(15000); // It takes a long time to parse
    const filePath = path.join(__dirname, 'samples', 'audio-frame-header-bug.mp3');
    return mm.parseFile(filePath, { duration: true }).then(result => {
        // If MPEG Layer II is accepted, it will give back third frame with a different frame length;
        // therefore it start counting actual parsable frames ending up on ~66.86
        t.strictEqual(result.format.duration, 66.8560544217687);
    });
});
//# sourceMappingURL=test-audio-frame-header-bug.js.map