"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const http = require("http");
const https = require("https");
const mm = require("../lib");
class NodeHttpClient {
    get(url) {
        return new Promise((resolve, reject) => {
            const request = (url.startsWith('https') ? https : http).get(url);
            request.on('response', resp => {
                resolve({
                    headers: resp.headers,
                    stream: resp
                });
            });
            request.on('abort', () => {
                reject(new Error('abort'));
            });
            request.on('error', err => {
                reject(err);
            });
        });
    }
}
const clients = [
    {
        name: 'http',
        client: new NodeHttpClient()
    }
];
// Skipped: https://github.com/Borewit/music-metadata/issues/160
describe.skip('HTTP streaming', function () {
    // Increase time-out to 15 seconds because we retrieve files over HTTP(s)
    this.timeout(15 * 1000);
    this.retries(3); // Workaround for HTTP time-outs on Travis-CI
    describe('Stream HTTP using different clients', () => {
        clients.forEach(test => {
            describe(`HTTP client: ${test.name}`, () => {
                [true, false].forEach(hasContentLength => {
                    it(`Should be able to parse M4A ${hasContentLength ? 'with' : 'without'} content-length specified`, () => {
                        const url = 'https://tunalib.s3.eu-central-1.amazonaws.com/plan.m4a';
                        return test.client.get(url).then(response => {
                            const options = {};
                            if (hasContentLength) {
                                options.fileSize = parseInt(response.headers['content-length'], 10); // Always pass this in production
                            }
                            return mm.parseStream(response.stream, response.headers['content-type'], options)
                                .then(tags => {
                                if (response.stream.destroy) {
                                    response.stream.destroy(); // Node >= v8 only
                                }
                                chai_1.assert.strictEqual(tags.common.title, 'We Made a Plan');
                                chai_1.assert.strictEqual(tags.common.artist, 'Adan Cruz');
                                chai_1.assert.strictEqual(tags.common.album, 'Quiérelo');
                            });
                        });
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=test-http.js.map