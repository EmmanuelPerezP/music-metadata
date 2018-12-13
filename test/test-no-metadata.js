"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mm = require("../src");
const path = require("path");
const t = chai_1.assert;
it("should reject files that can't be parsed", () => {
    const filePath = path.join(__dirname, 'samples', __filename);
    // Run with default options
    return mm.parseFile(filePath).then(result => {
        throw new Error("Should reject a file which cannot be parsed");
    }).catch(err => null);
});
//# sourceMappingURL=test-no-metadata.js.map