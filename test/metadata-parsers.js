"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("graceful-fs");
const mm = require("../src");
/**
 * Helps looping through different input styles
 */
exports.Parsers = [
    {
        description: 'parseFile',
        initParser: (filePath, mimeType, options) => {
            return mm.parseFile(filePath, options);
        }
    }, {
        description: 'parseStream',
        initParser: (filePath, mimeType, options) => {
            const stream = fs.createReadStream(filePath);
            return mm.parseStream(stream, mimeType, options).then(metadata => {
                stream.close();
                return metadata;
            });
        }
    }, {
        description: 'parseBuffer',
        initParser: (filePath, mimeType, options) => {
            const buffer = fs.readFileSync(filePath);
            return mm.parseBuffer(buffer, mimeType, options);
        }
    }
];
//# sourceMappingURL=metadata-parsers.js.map