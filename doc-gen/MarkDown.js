"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Row {
    constructor(values) {
        this.values = values;
    }
}
exports.Row = Row;
class Table {
    constructor() {
        this.rows = [];
    }
    static padEnd(value, size, pad = " ") {
        while (value.length < size) {
            value += pad;
        }
        return value;
    }
    static writeRow(out, values, colSizes) {
        const colValues = [];
        for (let ci = 0; ci < colSizes.length; ++ci) {
            const cellTxt = values.length > ci ? values[ci] : "";
            colValues.push(Table.padEnd(cellTxt, colSizes[ci]));
        }
        out.write("| " + colValues.join(" | ") + " |\n");
    }
    static lineToString(colSizes) {
        const colValues = colSizes.map(size => Table.padEnd("-", size, "-"));
        return "|-" + colValues.join("-|-") + "-|\n";
    }
    writeTo(out) {
        const colSizes = this.calcColSizes();
        Table.writeRow(out, this.header.values, colSizes);
        out.write(Table.lineToString(colSizes));
        for (const row of this.rows) {
            Table.writeRow(out, row.values, colSizes);
        }
    }
    calcColSizes() {
        const maxColSizes = [];
        for (const row of this.rows.concat([this.header])) {
            for (let ci = 0; ci < row.values.length; ++ci) {
                if (ci < maxColSizes.length) {
                    maxColSizes[ci] = Math.max(maxColSizes[ci], row.values[ci].length);
                }
                else {
                    maxColSizes.push(row.values[ci].length);
                }
            }
        }
        return maxColSizes;
    }
}
exports.Table = Table;
