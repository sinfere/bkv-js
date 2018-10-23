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
        return new stringToBuffer(v);
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
 *
 * @param {Uint8Array} buffer
 * @return {{length: number, lengthByteSize: number}}
 */
function decodeLength(buffer) {
    let la = new Uint8Array(8);
    let lengthByteSize = 0;
    for (let i = 0; i < buffer.length; i++) {
        let b = buffer[i];
        la[i] = b & 0x7F;
        lengthByteSize++;
        if ((b & 0x80) === 0) {
            break;
        }
    }
    if (lengthByteSize === 0 || lengthByteSize > 4) {
        console.log("lengthByteSize: ", lengthByteSize);
        throw new Error("invalid length buf");
    }

    let length = 0;
    for (let i = 0; i < lengthByteSize; i++) {
        length <<= 7;
        length |= la[i];
    }

    return {
        length: length,
        lengthByteSize: lengthByteSize
    };
}

function hexToBuffer(hex) {
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

function bufferToString(buffer) {
    let content = '';
    for (let i = 0; i < buffer.length; i++) {
        content += String.fromCharCode(buffer[i]);
    }
    return content;
}

/**
 *
 * @param {string} content
 * @return {Uint8Array}
 */
function stringToBuffer(content) {
    let buf = new Uint8Array(content.length);
    for (let i = 0; i < content.length; i++) {
        buf[i] = content.charCodeAt(i);
    }
    return buf;
}

/**
 * @param buffer {Uint8Array}
 * @returns {string}
 */
function bufferToHex(buffer) {
    let hex = '';
    for (let i = 0; i < buffer.length; i++) {
        let h = '00' + buffer[i].toString(16);
        hex += h.substr(-2);
    }
    return hex
}

function concatenate(resultConstructor, ...arrays) {
    let totalLength = 0;
    for (const arr of arrays) {
        totalLength += arr.length;
    }
    const result = new resultConstructor(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

class KV {
    constructor(key, value) {
        this._key = ensureBuffer(key);
        this._value = ensureBuffer(value);
        this._isStringKey = isString(key);
        this._checkKey(key);
    }

    _checkKey(key) {
        if (!isString(key) && !isNumber(key)) {
            throw new Error("key is not string or number")
        }
    }

    /**
     * total length bytes + Key length byte(1 bit number / string flag + 7 bit length) + Key bytes + Value bytes
     * @returns {Uint8Array}
     */
    pack() {
        let keyLength = this._key.length;
        let totalLength = 1 + keyLength + this._value.length;
        let lengthBuffer = encodeLength(totalLength);
        let lengthBufferSize = lengthBuffer.length;
        let finalLength = lengthBufferSize + totalLength;

        let keyLengthByte = keyLength & 0x7F;
        if (this._isStringKey) {
            keyLengthByte |= 0x80;
        }


        let buffer = new Uint8Array(finalLength);
        buffer.set(lengthBuffer, 0);
        buffer[lengthBufferSize] = keyLengthByte;
        buffer.set(this._key, lengthBufferSize + 1);
        buffer.set(this._value, lengthBufferSize + 1 + keyLength);

        return buffer;
    }

    /**
     *
     * @param {Uint8Array} buffer
     * @return {{kv: KV, pendingParseBuffer: Uint8Array}}
     */
    static unpack(buffer) {
        let dlr = decodeLength(buffer);
        let payloadLength = dlr.length;

        let remainingLength = buffer.length - dlr.lengthByteSize - payloadLength;
        if (remainingLength < 0 || (buffer.length - dlr.lengthByteSize) < 0) {
            throw new Error("buffer not enough");
        }

        let payload = buffer.slice(dlr.lengthByteSize, dlr.lengthByteSize + dlr.length);
        if (payload.length === 0) {
            throw new Error("empty payload");
        }
        let isStringKey = false;
        let keySizeByte = payload[0];
        let keyLength = keySizeByte & 0x7F;
        if ((keySizeByte & 0x80) !== 0) {
            isStringKey = true;
        }

        let valueLength = payload.length - 1 - keyLength;
        if (valueLength <= 0) {
            throw new Error("wrong key length")
        }

        let keyBuffer = payload.slice(1, 1 + keyLength);
        let key = isStringKey ? bufferToString(keyBuffer) : decodeNumber(keyBuffer);
        let valueBuffer = payload.slice(1 + keyLength);
        let kv = new KV(key, valueBuffer);

        return {
            kv: kv,
            pendingParseBuffer: buffer.slice(dlr.lengthByteSize + dlr.length)
        }
    }

    /**
     * @return {boolean}
     */
    isStringKey() {
        return this._isStringKey;
    }

    key() {
        return this._isStringKey ? bufferToString(this._key) : decodeNumber(this._key);
    }

    /**
     * @return {Uint8Array}
     */
    value() {
        return this._value;
    }

    /**
     * @return {string}
     */
    stringValue() {
        return bufferToString(this._value);
    }

    /**
     * @return {number}
     */
    numberValue() {
        return decodeNumber(this._value)
    }
}

class BKV {
    constructor() {
        this._kvs = [];

    }

    /**
     * @return {Uint8Array}
     */
    pack() {
        if (this._kvs.length === 0) {
            return new Uint8Array(0);
        }

        let buffer = new Uint8Array(0);
        this._kvs.forEach(kv => {
            buffer = concatenate(Uint8Array, buffer, kv.pack())
        });

        return buffer;
    }

    /**
     * @param {Uint8Array} buffer
     * @return {BKV}
     */
    static unpack(buffer) {
        let bkv = new BKV();
        if (!buffer || buffer.length === 0) {
            return bkv
        }
        while (true) {
            try {
                let pr = KV.unpack(buffer);
                bkv.add(pr.kv);
                buffer = pr.pendingParseBuffer;
                if (buffer.length === 0) {
                    break;
                }
            } catch (e) {
                console.log("parse fail: ", e);
                break;
            }
        }
        return bkv;
    }

    items() {
        return this._kvs;
    }

    /**
     *
     * @param {KV} kv
     */
    add(kv) {
        this._kvs.push(kv)
    }

    /**
     * @param {string} key
     * @param value
     */
    addByStringKey(key, value) {
        this.add(new KV(key, value));
    }

    /**
     * @param {number} key
     * @param value
     */
    addByNumberKey(key, value) {
        this.add(new KV(key, value));
    }

    getStringValue(key) {
        for (let k in this._kvs) {
            let kv = this._kvs[k];
            if (kv.key() === key) {
                return kv.stringValue();
            }
        }
    }

    getNumberValue(key) {
        for (let k in this._kvs) {
            let kv = this._kvs[k];
            if (kv.key() === key) {
                return kv.numberValue();
            }
        }
    }

    dump() {
        for (let i in this._kvs) {
            let kv = this._kvs[i];
            let valueString = bufferToHex(kv.value());
            let valueFirstByte = kv.value()[0];
            if (0x20 <= valueFirstByte && valueFirstByte <= 0x7E) {
                valueString += " (s: " + bufferToString(kv.value()) + ")";
            }

            if (kv.isStringKey()) {
                console.log("kv[%d] key[s]: %s -> value[%d]: %s ", i, kv.key(), kv.value().length, valueString)
            } else {
                console.log("kv[%d] key[n]: %d -> value[%d]: %s ", i, kv.key(), kv.value().length, valueString)
            }
        }
    }
}

module.exports = {
    bkv: BKV,
    kv: KV,
    bufferToHex: bufferToHex,
};