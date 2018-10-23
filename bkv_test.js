const bkv = require("./bkv");

let value = new Uint8Array(2);
value[0] = 2;
value[1] = 3;


let b = new bkv.bkv();
b.addByNumberKey(1, value);
b.addByStringKey("version", value);
b.addByStringKey("test", "hello");

let result = b.pack();
console.log(bkv.bufferToHex(result));

let upr = bkv.bkv.unpack(result);
console.log("unpack kv size:", upr.items().length);
upr.dump();
