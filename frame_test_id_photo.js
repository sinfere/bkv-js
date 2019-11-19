const frame = require("./frame");
const bkv = require("./bkv");

let frameId = 0;

function makeFrameId() {
    frameId++;
    if (frameId > 0xFFFF) {
        frameId = 0;
    }
    return frameId & 0xFFFF;
}

function makeS1DeviceReadyFrame() {
    let b = new bkv.BKV();
    b.addByNumberKey(0x1, 1);
    b.addByNumberKey(0x2, 1);
    b.addByNumberKey(0x3, makeFrameId());
    return b
}

function makeS2PositionReadyFrame() {
    let b = new bkv.BKV();
    b.addByNumberKey(0x1, 1);
    b.addByNumberKey(0x2, 0x11);
    b.addByNumberKey(0x3, makeFrameId());
    return b
}

function makeS2LightReadyFrame() {
    let b = new bkv.BKV();
    b.addByNumberKey(0x1, 1);
    b.addByNumberKey(0x2, 0x12);
    b.addByNumberKey(0x3, makeFrameId());
    return b
}

function make31HumanDetectFrame(frameId, result) {
    let b = new bkv.BKV();
    b.addByNumberKey(0x1, 2);
    b.addByNumberKey(0x2, 0x31);
    b.addByNumberKey(0x3, frameId);
    b.addByNumberKey(0x4, 1);
    b.addByNumberKey(0x6, result ? 1 : 0);
    return b
}

function make13FailToAdjustHeightFrame() {
    let b = new bkv.BKV();
    b.addByNumberKey(0x1, 1);
    b.addByNumberKey(0x2, 0x13);
    b.addByNumberKey(0x3, makeFrameId());
    b.addByNumberKey(0x7, 1);
    return b
}

function makeResponseFrame(functionCode, frameId, status) {
    let b = new bkv.BKV();
    b.addByNumberKey(0x01, 0x02);
    b.addByNumberKey(0x02, functionCode);
    b.addByNumberKey(0x03, frameId);
    b.addByNumberKey(0x04, status);
    return b
}

/**
 * @param {BKV} b
 */
function parseOutFrame(b) {
    console.log('parse out');
    console.log("")
}

frame.setParseOutFrameCallback(parseOutFrame);

let s11 = makeS1DeviceReadyFrame();
console.log(`[01]用户就位: ${bkv.bufferToHex(frame.pack(s11)).toUpperCase()}`);
// frame.parse(frame.pack(s11));


let s21 = makeS2PositionReadyFrame();
console.log(`[11]伞高度就位: ${bkv.bufferToHex(frame.pack(s21)).toUpperCase()}`);
// frame.parse(frame.pack(s21));

let s22 = makeS2LightReadyFrame();
console.log(`[12]灯光就位: ${bkv.bufferToHex(frame.pack(s22)).toUpperCase()}`);
// frame.parse(frame.pack(s22));


console.log(`回应[02]: ${bkv.bufferToHex(frame.pack(makeResponseFrame(2, 1, 1))).toUpperCase()}`);
console.log(`回应[21]: ${bkv.bufferToHex(frame.pack(makeResponseFrame(0x21, 0, 1))).toUpperCase()}`);
console.log(`回应[22]: ${bkv.bufferToHex(frame.pack(makeResponseFrame(0x22, 0, 1))).toUpperCase()}`);

console.log(`回应[31]: ${bkv.bufferToHex(frame.pack(make31HumanDetectFrame(1, 1))).toUpperCase()}`);
console.log(`[13]伞高度失败: ${bkv.bufferToHex(frame.pack(make13FailToAdjustHeightFrame())).toUpperCase()}`);