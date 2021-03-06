"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const type_1 = require("strtok3/lib/type");
const initDebug = require("debug");
const Token = require("token-types");
const AtomToken = require("./AtomToken");
const debug = initDebug("music-metadata:parser:MP4:Atom");
class Atom {
    constructor(header, extended, parent) {
        this.header = header;
        this.extended = extended;
        this.parent = parent;
        this.children = [];
        this.atomPath = (this.parent ? this.parent.atomPath + '/' : '') + this.header.name;
        this.dataLen = this.header.length - (extended ? 16 : 8);
    }
    readAtoms(tokenizer, dataHandler, size) {
        return this.readAtom(tokenizer, dataHandler).then(atomBean => {
            this.children.push(atomBean);
            if (size === undefined) {
                return this.readAtoms(tokenizer, dataHandler, size).catch(err => {
                    if (err.message === type_1.endOfFile) {
                        debug(`Reached end-of-file`);
                    }
                    else {
                        throw err;
                    }
                });
            }
            size -= atomBean.header.length;
            if (size > 0) {
                return this.readAtoms(tokenizer, dataHandler, size);
            }
        });
    }
    readAtom(tokenizer, dataHandler) {
        // Parse atom header
        const offset = tokenizer.position;
        // debug(`Reading next token on offset=${offset}...`); //  buf.toString('ascii')
        return tokenizer.readToken(AtomToken.Header)
            .then(header => {
            const extended = header.length === 1;
            if (extended) {
                return tokenizer.readToken(AtomToken.ExtendedSize).then(extendedSize => {
                    header.length = extendedSize;
                    return new Atom(header, true, this);
                });
            }
            else {
                return Promise.resolve(new Atom(header, false, this));
            }
        }).then(atomBean => {
            debug(`parse atom name=${atomBean.atomPath}, extended=${atomBean.extended}, offset=${offset}, len=${atomBean.header.length}`); //  buf.toString('ascii')
            return atomBean.readData(tokenizer, dataHandler).then(() => {
                return atomBean;
            });
        });
    }
    readData(tokenizer, dataHandler) {
        switch (this.header.name) {
            // "Container" atoms, contains nested atoms
            case "moov": // The Movie Atom: contains other atoms
            case "udta": // User defined atom
            case "trak":
            case "mdia": // Media atom
            case "minf": // Media Information Atom
            case "stbl": // The Sample Table Atom
            case "<id>":
            case "ilst":
                return this.readAtoms(tokenizer, dataHandler, this.dataLen);
            case "meta": // Metadata Atom, ref: https://developer.apple.com/library/content/documentation/QuickTime/QTFF/Metadata/Metadata.html#//apple_ref/doc/uid/TP40000939-CH1-SW8
                // meta has 4 bytes of padding, ignore
                return tokenizer.readToken(new Token.IgnoreType(4))
                    .then(() => {
                    return this.readAtoms(tokenizer, dataHandler, this.dataLen - 4);
                });
            case "mdhd": // Media header atom
            case "mvhd": // 'movie' => 'mvhd': movie header atom; child of Movie Atom
            case "tkhd":
            case "stsz":
            case "mdat":
            default:
                return dataHandler(this);
        }
    }
}
exports.Atom = Atom;
