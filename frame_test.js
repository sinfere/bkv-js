const frame = require("./frame");
const bkv = require("./bkv");

let b = new bkv.BKV();
b.addByStringKey("version", 1);
let buffer = frame.pack(b);
console.log(bkv.bufferToHex(buffer));

/**
 * @param {BKV} b
 */
function parseOutFrame(b) {
}

frame.setParseOutFrameCallback(parseOutFrame);

let b1 = "ff0b97098776657273696f6e01";
let b2 = "ff0b97098776";
let b3 = "657273696f6e01";

frame.parse(bkv.hexToBuffer(b1));
frame.parse(bkv.hexToBuffer(b2));
frame.parse(bkv.hexToBuffer(b3));



