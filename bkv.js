// big endian

/**
 * @param v
 * @returns {boolean}
 */
function isString(v) {
    return typeof v === 'string' || v instanceof String
}

/**
 * @param v
 * @returns {boolean}
 */
function isNumber(v) {
    return Number.isInteger(v)
}

/**
 * @param v
 * @returns {Uint8Array}
 */
function ensureBuffer(v) {
    if (v instanceof ArrayBuffer) {
        return new Uint8Array(v);
    }

    if (v instanceof Uint8Array) {
        return v;
    }

    if (isString(v)) {
        return new TextEncoder().encode(v);
    }

    if (isNumber(v)) {
        return encodeNumber(v);
    }

    throw new Error("invalid value, can not be converted to buffer")
}

/**
 *
 * @param v
 * @returns {Uint8Array}
 */
function encodeNumber(v) {
    let b = new Uint8Array(8);
    let i = 0;
    while (v > 0) {
        b[i] = v & 0xFF;
        v >>= 8;
        i++;
    }

    return b.slice(0, i).reverse();
}

/**
 * @param v {Uint8Array}
 * @returns {number}
 */
function decodeNumber(v) {
    let n = 0;
    if (v.length > 8){
        v = v.slice(0, 8);
    }

    for (let i = 0; i < v.length; i++) {
        let b = v[i];
        n <<= 8;
        n |= b;
    }

    return n;
}

/**
 * @param l {number}
 * @returns {Uint8Array}
 */
function encodeLength(l) {
    let b = new Uint8Array(8);
    let i = 0;
    while (l > 0) {
        b[i] = (l & 0x7F) | 0x80;
        l >>= 7;
        i++;
        if (i > 8) {
            throw new Error("invalid length");
        }
    }
    let la = b.slice(0, i);
    la = la.reverse();
    let lastByte = la[i - 1];
    lastByte &= 0x7F;
    la[i - 1] = lastByte;
    return la;
}

/**
 * @param v {Uint8Array}
 * @returns {number}
 */
function decodeLength(v) {
    if (v.length > 8) {
        throw new Error("length too large");
    }

    let la = new Uint8Array(8);
    let index = 0;
    for (let i = 0; i < v.length; i++) {
        let b = v[i];
        la[i] = b & 0x7F;
        if ((b & 0x80) === 0) {
            index = i + 1;
            break;
        }
    }
    if (index === 0) {
        throw new Error("invalid length buf");
    }

    let length = 0;
    for (let i = 0; i < index; i++) {
        length <<= 7;
        length |= la[i];
    }

    return length;
}

function hexToArrayBuffer(hex) {
    if (typeof hex !== 'string') {
        throw new TypeError('Expected input to be a string')
    }

    if ((hex.length % 2) !== 0) {
        throw new RangeError('Expected string to be an even number of characters')
    }

    let array = new Uint8Array(hex.length / 2);

    for (let i = 0; i < hex.length; i += 2) {
        array[i / 2] = parseInt(hex.substring(i, i + 2), 16)
    }

    return array
}

function arrayBufferToString(buffer) {
    let content = '';
    for (let i = 0; i < buffer.length; i++) {
        content += String.fromCharCode(buffer[i]);
    }
    return content;
}

/**
 * @param buffer {Uint8Array}
 * @returns {string}
 */
function arrayBufferToHex(buffer) {
    let hex = '';
    for (let i = 0; i < buffer.length; i++) {
        let h = '00' + buffer[i].toString(16);
        hex += h.substr(-2);
    }
    return hex
}


class KV {
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.isStringKey = isString(key);
        this._checkKey();
    }

    _checkKey() {
        if (!isString(this.key) && !isNumber(this.key)) {
            throw new Error("key is not string or number")
        }
    }

    pack() {

    }

    key() {

    }

    value() {

    }
}

function unpackKV() {

}

class BKV {
    constructor() {
        this.kvs = [];
    }

    pack() {

    }

    items() {

    }

    add() {

    }

    getStringValue(key) {

    }

    getNumberValue(key) {

    }
}

function unpackBKV() {

}