import { AbstractID3Parser } from '../id3v2/AbstractID3Parser';
export declare class MpegParser extends AbstractID3Parser {
    private frameCount;
    private countSkipFrameData;
    private audioFrameHeader;
    private bitrates;
    private offset;
    private frame_size;
    private crc;
    private unsynced;
    private calculateEofDuration;
    private samplesPerFrame;
    private buf_frame_header;
    /**
     * Number of bytes already parsed since beginning of stream / file
     */
    private mpegOffset;
    private readDuration;
    private syncPeek;
    /**
     * Called after ID3 headers have been parsed
     */
    _parse(): Promise<void>;
    /**
     * Called after file has been fully parsed, this allows, if present, to exclude the ID3v1.1 header length
     * @param metadata
     * @returns {INativeAudioMetadata}
     */
    protected finalize(): void;
    private _peekBuffer;
    private _sync;
    private sync;
    private parseAudioFrameHeader;
    private parseCrc;
    private skipSideInformation;
    private readXtraInfoHeader;
    /**
     * Ref: http://gabriel.mp3-tech.org/mp3infotag.html
     * @returns {Promise<string>}
     */
    private readXingInfoHeader;
    private skipFrameData;
    private areAllSame;
}
