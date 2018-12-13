"use strict";
// Utilities for testing
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
/**
 * A mock readable-stream, using string to read from
 */
class SourceStream extends stream_1.Readable {
    constructor(buf) {
        super();
        this.buf = buf;
    }
    _read() {
        this.push(this.buf);
        this.push(null); // push the EOF-signaling `null` chunk
    }
}
exports.SourceStream = SourceStream;
//# sourceMappingURL=util.js.map