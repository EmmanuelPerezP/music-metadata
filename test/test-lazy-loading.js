"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mm = require("../src");
const path = require("path");
const chai_1 = require("chai");
describe("Lazy loading of format parser (ITokenParser", () => {
    it("be able to override the loading method", () => {
        const filePath = path.join(__dirname, "samples", "1971 - 003 - Sweet - Co-Co - CannaPower.mp2");
        return mm.parseFile(filePath, { duration: true, native: true, loadParser: moduleName => {
                chai_1.assert.strictEqual(moduleName, 'mpeg');
                const parserModule = require('../src/' + moduleName);
                return Promise.resolve(new parserModule.default());
            }
        });
    });
    it("should throw an error if the parser cannot be loaded", () => {
        const filePath = path.join(__dirname, "samples", "1971 - 003 - Sweet - Co-Co - CannaPower.mp2");
        return mm.parseFile(filePath, { duration: true, native: true, loadParser: moduleName => {
                chai_1.assert.strictEqual(moduleName, 'mpeg');
                return Promise.resolve(undefined);
            }
        }).then(() => {
            chai_1.assert.fail('Should throw an error');
        }).catch(err => {
            chai_1.assert.strictEqual(err.message, 'options.loadParser failed to resolve module "mpeg".');
        });
    });
});
//# sourceMappingURL=test-lazy-loading.js.map