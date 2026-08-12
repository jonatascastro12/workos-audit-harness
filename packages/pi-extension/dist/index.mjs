var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);

// ../../node_modules/eventemitter3/index.js
var require_eventemitter3 = __commonJS((exports, module) => {
  var has = Object.prototype.hasOwnProperty;
  var prefix = "~";
  function Events() {}
  if (Object.create) {
    Events.prototype = Object.create(null);
    if (!new Events().__proto__)
      prefix = false;
  }
  function EE(fn, context, once) {
    this.fn = fn;
    this.context = context;
    this.once = once || false;
  }
  function addListener(emitter, event, fn, context, once) {
    if (typeof fn !== "function") {
      throw new TypeError("The listener must be a function");
    }
    var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
    if (!emitter._events[evt])
      emitter._events[evt] = listener, emitter._eventsCount++;
    else if (!emitter._events[evt].fn)
      emitter._events[evt].push(listener);
    else
      emitter._events[evt] = [emitter._events[evt], listener];
    return emitter;
  }
  function clearEvent(emitter, evt) {
    if (--emitter._eventsCount === 0)
      emitter._events = new Events;
    else
      delete emitter._events[evt];
  }
  function EventEmitter() {
    this._events = new Events;
    this._eventsCount = 0;
  }
  EventEmitter.prototype.eventNames = function eventNames() {
    var names = [], events, name;
    if (this._eventsCount === 0)
      return names;
    for (name in events = this._events) {
      if (has.call(events, name))
        names.push(prefix ? name.slice(1) : name);
    }
    if (Object.getOwnPropertySymbols) {
      return names.concat(Object.getOwnPropertySymbols(events));
    }
    return names;
  };
  EventEmitter.prototype.listeners = function listeners(event) {
    var evt = prefix ? prefix + event : event, handlers = this._events[evt];
    if (!handlers)
      return [];
    if (handlers.fn)
      return [handlers.fn];
    for (var i = 0, l = handlers.length, ee = new Array(l);i < l; i++) {
      ee[i] = handlers[i].fn;
    }
    return ee;
  };
  EventEmitter.prototype.listenerCount = function listenerCount(event) {
    var evt = prefix ? prefix + event : event, listeners = this._events[evt];
    if (!listeners)
      return 0;
    if (listeners.fn)
      return 1;
    return listeners.length;
  };
  EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
    var evt = prefix ? prefix + event : event;
    if (!this._events[evt])
      return false;
    var listeners = this._events[evt], len = arguments.length, args, i;
    if (listeners.fn) {
      if (listeners.once)
        this.removeListener(event, listeners.fn, undefined, true);
      switch (len) {
        case 1:
          return listeners.fn.call(listeners.context), true;
        case 2:
          return listeners.fn.call(listeners.context, a1), true;
        case 3:
          return listeners.fn.call(listeners.context, a1, a2), true;
        case 4:
          return listeners.fn.call(listeners.context, a1, a2, a3), true;
        case 5:
          return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
        case 6:
          return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
      }
      for (i = 1, args = new Array(len - 1);i < len; i++) {
        args[i - 1] = arguments[i];
      }
      listeners.fn.apply(listeners.context, args);
    } else {
      var length = listeners.length, j;
      for (i = 0;i < length; i++) {
        if (listeners[i].once)
          this.removeListener(event, listeners[i].fn, undefined, true);
        switch (len) {
          case 1:
            listeners[i].fn.call(listeners[i].context);
            break;
          case 2:
            listeners[i].fn.call(listeners[i].context, a1);
            break;
          case 3:
            listeners[i].fn.call(listeners[i].context, a1, a2);
            break;
          case 4:
            listeners[i].fn.call(listeners[i].context, a1, a2, a3);
            break;
          default:
            if (!args)
              for (j = 1, args = new Array(len - 1);j < len; j++) {
                args[j - 1] = arguments[j];
              }
            listeners[i].fn.apply(listeners[i].context, args);
        }
      }
    }
    return true;
  };
  EventEmitter.prototype.on = function on(event, fn, context) {
    return addListener(this, event, fn, context, false);
  };
  EventEmitter.prototype.once = function once(event, fn, context) {
    return addListener(this, event, fn, context, true);
  };
  EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
    var evt = prefix ? prefix + event : event;
    if (!this._events[evt])
      return this;
    if (!fn) {
      clearEvent(this, evt);
      return this;
    }
    var listeners = this._events[evt];
    if (listeners.fn) {
      if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
        clearEvent(this, evt);
      }
    } else {
      for (var i = 0, events = [], length = listeners.length;i < length; i++) {
        if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
          events.push(listeners[i]);
        }
      }
      if (events.length)
        this._events[evt] = events.length === 1 ? events[0] : events;
      else
        clearEvent(this, evt);
    }
    return this;
  };
  EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
    var evt;
    if (event) {
      evt = prefix ? prefix + event : event;
      if (this._events[evt])
        clearEvent(this, evt);
    } else {
      this._events = new Events;
      this._eventsCount = 0;
    }
    return this;
  };
  EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
  EventEmitter.prototype.addListener = EventEmitter.prototype.on;
  EventEmitter.prefixed = prefix;
  EventEmitter.EventEmitter = EventEmitter;
  if (typeof module !== "undefined") {
    module.exports = EventEmitter;
  }
});

// ../../node_modules/@workos-inc/node/lib/webapi-CxKOxXjo.mjs
var exports_webapi_CxKOxXjo = {};
__export(exports_webapi_CxKOxXjo, {
  jwtVerify: () => jwtVerify,
  jwtDecrypt: () => jwtDecrypt,
  jwksCache: () => jwksCache,
  importX509: () => importX509,
  importSPKI: () => importSPKI,
  importPKCS8: () => importPKCS8,
  importJWK: () => importJWK,
  generateSecret: () => generateSecret,
  generateKeyPair: () => generateKeyPair,
  generalVerify: () => generalVerify,
  generalDecrypt: () => generalDecrypt,
  flattenedVerify: () => flattenedVerify,
  flattenedDecrypt: () => flattenedDecrypt,
  exportSPKI: () => exportSPKI,
  exportPKCS8: () => exportPKCS8,
  exportJWK: () => exportJWK,
  errors: () => errors_exports,
  decodeProtectedHeader: () => decodeProtectedHeader,
  decodeJwt: () => decodeJwt,
  customFetch: () => customFetch,
  cryptoRuntime: () => cryptoRuntime,
  createRemoteJWKSet: () => createRemoteJWKSet,
  createLocalJWKSet: () => createLocalJWKSet,
  compactVerify: () => compactVerify,
  compactDecrypt: () => compactDecrypt,
  calculateJwkThumbprintUri: () => calculateJwkThumbprintUri,
  calculateJwkThumbprint: () => calculateJwkThumbprint,
  base64url: () => base64url_exports,
  UnsecuredJWT: () => UnsecuredJWT,
  SignJWT: () => SignJWT,
  GeneralSign: () => GeneralSign,
  GeneralEncrypt: () => GeneralEncrypt,
  FlattenedSign: () => FlattenedSign,
  FlattenedEncrypt: () => FlattenedEncrypt,
  EncryptJWT: () => EncryptJWT,
  EmbeddedJWK: () => EmbeddedJWK,
  CompactSign: () => CompactSign,
  CompactEncrypt: () => CompactEncrypt
});
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
function writeUInt32BE(buf, value, offset) {
  if (value < 0 || value >= MAX_INT32)
    throw new RangeError(`value must be >= 0 and <= ${MAX_INT32 - 1}. Received ${value}`);
  buf.set([
    value >>> 24,
    value >>> 16,
    value >>> 8,
    value & 255
  ], offset);
}
function uint64be(value) {
  const high = Math.floor(value / MAX_INT32);
  const low = value % MAX_INT32;
  const buf = new Uint8Array(8);
  writeUInt32BE(buf, high, 0);
  writeUInt32BE(buf, low, 4);
  return buf;
}
function uint32be(value) {
  const buf = new Uint8Array(4);
  writeUInt32BE(buf, value);
  return buf;
}
function encode$1(string) {
  const bytes = new Uint8Array(string.length);
  for (let i = 0;i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127)
      throw new TypeError("non-ASCII string encountered in encode()");
    bytes[i] = code;
  }
  return bytes;
}
function encodeBase64(input) {
  if (Uint8Array.prototype.toBase64)
    return input.toBase64();
  const CHUNK_SIZE = 32768;
  const arr = [];
  for (let i = 0;i < input.length; i += CHUNK_SIZE)
    arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)));
  return btoa(arr.join(""));
}
function decodeBase64(encoded) {
  if (Uint8Array.fromBase64)
    return Uint8Array.fromBase64(encoded);
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0;i < binary.length; i++)
    bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function decode(input) {
  if (Uint8Array.fromBase64)
    return Uint8Array.fromBase64(typeof input === "string" ? input : decoder.decode(input), { alphabet: "base64url" });
  let encoded = input;
  if (encoded instanceof Uint8Array)
    encoded = decoder.decode(encoded);
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}
function encode(input) {
  let unencoded = input;
  if (typeof unencoded === "string")
    unencoded = encoder.encode(unencoded);
  if (Uint8Array.prototype.toBase64)
    return unencoded.toBase64({
      alphabet: "base64url",
      omitPadding: true
    });
  return encodeBase64(unencoded).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function getHashLength(hash) {
  return parseInt(hash.name.slice(4), 10);
}
function checkHashLength(algorithm, expected) {
  if (getHashLength(algorithm.hash) !== expected)
    throw unusable(`SHA-${expected}`, "algorithm.hash");
}
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage))
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
}
function checkSigCryptoKey(key, alg, usage) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    case "RS256":
    case "RS384":
    case "RS512":
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    case "PS256":
    case "PS384":
    case "PS512":
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    case "Ed25519":
    case "EdDSA":
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      if (!isAlgorithm(key.algorithm, alg))
        throw unusable(alg);
      break;
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      if (key.algorithm.namedCurve !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usage);
}
function checkEncCryptoKey(key, alg, usage) {
  switch (alg) {
    case "A128GCM":
    case "A192GCM":
    case "A256GCM": {
      if (!isAlgorithm(key.algorithm, "AES-GCM"))
        throw unusable("AES-GCM");
      const expected = parseInt(alg.slice(1, 4), 10);
      if (key.algorithm.length !== expected)
        throw unusable(expected, "algorithm.length");
      break;
    }
    case "A128KW":
    case "A192KW":
    case "A256KW": {
      if (!isAlgorithm(key.algorithm, "AES-KW"))
        throw unusable("AES-KW");
      const expected = parseInt(alg.slice(1, 4), 10);
      if (key.algorithm.length !== expected)
        throw unusable(expected, "algorithm.length");
      break;
    }
    case "ECDH":
      switch (key.algorithm.name) {
        case "ECDH":
        case "X25519":
          break;
        default:
          throw unusable("ECDH or X25519");
      }
      break;
    case "PBES2-HS256+A128KW":
    case "PBES2-HS384+A192KW":
    case "PBES2-HS512+A256KW":
      if (!isAlgorithm(key.algorithm, "PBKDF2"))
        throw unusable("PBKDF2");
      break;
    case "RSA-OAEP":
    case "RSA-OAEP-256":
    case "RSA-OAEP-384":
    case "RSA-OAEP-512":
      if (!isAlgorithm(key.algorithm, "RSA-OAEP"))
        throw unusable("RSA-OAEP");
      checkHashLength(key.algorithm, parseInt(alg.slice(9), 10) || 1);
      break;
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usage);
}
function message(msg, actual, ...types) {
  types = types.filter(Boolean);
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else if (types.length === 2)
    msg += `one of type ${types[0]} or ${types[1]}.`;
  else
    msg += `of type ${types[0]}.`;
  if (actual == null)
    msg += ` Received ${actual}`;
  else if (typeof actual === "function" && actual.name)
    msg += ` Received function ${actual.name}`;
  else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name)
      msg += ` Received an instance of ${actual.constructor.name}`;
  }
  return msg;
}
function assertCryptoKey(key) {
  if (!isCryptoKey(key))
    throw new Error("CryptoKey instance expected");
}
function cekLength(alg) {
  switch (alg) {
    case "A128GCM":
      return 128;
    case "A192GCM":
      return 192;
    case "A256GCM":
    case "A128CBC-HS256":
      return 256;
    case "A192CBC-HS384":
      return 384;
    case "A256CBC-HS512":
      return 512;
    default:
      throw new JOSENotSupported(`Unsupported JWE Algorithm: ${alg}`);
  }
}
function checkCekLength(cek, expected) {
  const actual = cek.byteLength << 3;
  if (actual !== expected)
    throw new JWEInvalid(`Invalid Content Encryption Key length. Expected ${expected} bits, got ${actual} bits`);
}
function ivBitLength(alg) {
  switch (alg) {
    case "A128GCM":
    case "A128GCMKW":
    case "A192GCM":
    case "A192GCMKW":
    case "A256GCM":
    case "A256GCMKW":
      return 96;
    case "A128CBC-HS256":
    case "A192CBC-HS384":
    case "A256CBC-HS512":
      return 128;
    default:
      throw new JOSENotSupported(`Unsupported JWE Algorithm: ${alg}`);
  }
}
function checkIvLength(enc, iv) {
  if (iv.length << 3 !== ivBitLength(enc))
    throw new JWEInvalid("Invalid Initialization Vector length");
}
async function cbcKeySetup(enc, cek, usage) {
  if (!(cek instanceof Uint8Array))
    throw new TypeError(invalidKeyInput(cek, "Uint8Array"));
  const keySize = parseInt(enc.slice(1, 4), 10);
  return {
    encKey: await crypto.subtle.importKey("raw", cek.subarray(keySize >> 3), "AES-CBC", false, [usage]),
    macKey: await crypto.subtle.importKey("raw", cek.subarray(0, keySize >> 3), {
      hash: `SHA-${keySize << 1}`,
      name: "HMAC"
    }, false, ["sign"]),
    keySize
  };
}
async function cbcHmacTag(macKey, macData, keySize) {
  return new Uint8Array((await crypto.subtle.sign("HMAC", macKey, macData)).slice(0, keySize >> 3));
}
async function cbcEncrypt(enc, plaintext, cek, iv, aad) {
  const { encKey, macKey, keySize } = await cbcKeySetup(enc, cek, "encrypt");
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({
    iv,
    name: "AES-CBC"
  }, encKey, plaintext));
  return {
    ciphertext,
    tag: await cbcHmacTag(macKey, concat(aad, iv, ciphertext, uint64be(aad.length << 3)), keySize),
    iv
  };
}
async function timingSafeEqual(a, b) {
  if (!(a instanceof Uint8Array))
    throw new TypeError("First argument must be a buffer");
  if (!(b instanceof Uint8Array))
    throw new TypeError("Second argument must be a buffer");
  const algorithm = {
    name: "HMAC",
    hash: "SHA-256"
  };
  const key = await crypto.subtle.generateKey(algorithm, false, ["sign"]);
  const aHmac = new Uint8Array(await crypto.subtle.sign(algorithm, key, a));
  const bHmac = new Uint8Array(await crypto.subtle.sign(algorithm, key, b));
  let out = 0;
  let i = -1;
  while (++i < 32)
    out |= aHmac[i] ^ bHmac[i];
  return out === 0;
}
async function cbcDecrypt(enc, cek, ciphertext, iv, tag, aad) {
  const { encKey, macKey, keySize } = await cbcKeySetup(enc, cek, "decrypt");
  const expectedTag = await cbcHmacTag(macKey, concat(aad, iv, ciphertext, uint64be(aad.length << 3)), keySize);
  let macCheckPassed;
  try {
    macCheckPassed = await timingSafeEqual(tag, expectedTag);
  } catch {}
  if (!macCheckPassed)
    throw new JWEDecryptionFailed;
  let plaintext;
  try {
    plaintext = new Uint8Array(await crypto.subtle.decrypt({
      iv,
      name: "AES-CBC"
    }, encKey, ciphertext));
  } catch {}
  if (!plaintext)
    throw new JWEDecryptionFailed;
  return plaintext;
}
async function gcmEncrypt(enc, plaintext, cek, iv, aad) {
  let encKey;
  if (cek instanceof Uint8Array)
    encKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  else {
    checkEncCryptoKey(cek, enc, "encrypt");
    encKey = cek;
  }
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({
    additionalData: aad,
    iv,
    name: "AES-GCM",
    tagLength: 128
  }, encKey, plaintext));
  const tag = encrypted.slice(-16);
  return {
    ciphertext: encrypted.slice(0, -16),
    tag,
    iv
  };
}
async function gcmDecrypt(enc, cek, ciphertext, iv, tag, aad) {
  let encKey;
  if (cek instanceof Uint8Array)
    encKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]);
  else {
    checkEncCryptoKey(cek, enc, "decrypt");
    encKey = cek;
  }
  try {
    return new Uint8Array(await crypto.subtle.decrypt({
      additionalData: aad,
      iv,
      name: "AES-GCM",
      tagLength: 128
    }, encKey, concat(ciphertext, tag)));
  } catch {
    throw new JWEDecryptionFailed;
  }
}
async function encrypt$1(enc, plaintext, cek, iv, aad) {
  if (!isCryptoKey(cek) && !(cek instanceof Uint8Array))
    throw new TypeError(invalidKeyInput(cek, "CryptoKey", "KeyObject", "Uint8Array", "JSON Web Key"));
  if (iv)
    checkIvLength(enc, iv);
  else
    iv = generateIv(enc);
  switch (enc) {
    case "A128CBC-HS256":
    case "A192CBC-HS384":
    case "A256CBC-HS512":
      if (cek instanceof Uint8Array)
        checkCekLength(cek, parseInt(enc.slice(-3), 10));
      return cbcEncrypt(enc, plaintext, cek, iv, aad);
    case "A128GCM":
    case "A192GCM":
    case "A256GCM":
      if (cek instanceof Uint8Array)
        checkCekLength(cek, parseInt(enc.slice(1, 4), 10));
      return gcmEncrypt(enc, plaintext, cek, iv, aad);
    default:
      throw new JOSENotSupported(unsupportedEnc);
  }
}
async function decrypt$1(enc, cek, ciphertext, iv, tag, aad) {
  if (!isCryptoKey(cek) && !(cek instanceof Uint8Array))
    throw new TypeError(invalidKeyInput(cek, "CryptoKey", "KeyObject", "Uint8Array", "JSON Web Key"));
  if (!iv)
    throw new JWEInvalid("JWE Initialization Vector missing");
  if (!tag)
    throw new JWEInvalid("JWE Authentication Tag missing");
  checkIvLength(enc, iv);
  switch (enc) {
    case "A128CBC-HS256":
    case "A192CBC-HS384":
    case "A256CBC-HS512":
      if (cek instanceof Uint8Array)
        checkCekLength(cek, parseInt(enc.slice(-3), 10));
      return cbcDecrypt(enc, cek, ciphertext, iv, tag, aad);
    case "A128GCM":
    case "A192GCM":
    case "A256GCM":
      if (cek instanceof Uint8Array)
        checkCekLength(cek, parseInt(enc.slice(1, 4), 10));
      return gcmDecrypt(enc, cek, ciphertext, iv, tag, aad);
    default:
      throw new JOSENotSupported(unsupportedEnc);
  }
}
function assertNotSet(value, name) {
  if (value)
    throw new TypeError(`${name} can only be called once`);
}
function decodeBase64url(value, label, ErrorClass) {
  try {
    return decode(value);
  } catch {
    throw new ErrorClass(`Failed to base64url decode the ${label}`);
  }
}
async function digest(algorithm, data) {
  const subtleDigest = `SHA-${algorithm.slice(-3)}`;
  return new Uint8Array(await crypto.subtle.digest(subtleDigest, data));
}
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]")
    return false;
  if (Object.getPrototypeOf(input) === null)
    return true;
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null)
    proto = Object.getPrototypeOf(proto);
  return Object.getPrototypeOf(input) === proto;
}
function isDisjoint(...headers) {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1)
    return true;
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter))
        return false;
      acc.add(parameter);
    }
  }
  return true;
}
function checkKeySize(key, alg) {
  if (key.algorithm.length !== parseInt(alg.slice(1, 4), 10))
    throw new TypeError(`Invalid key size for alg: ${alg}`);
}
function getCryptoKey$1(key, alg, usage) {
  if (key instanceof Uint8Array)
    return crypto.subtle.importKey("raw", key, "AES-KW", true, [usage]);
  checkEncCryptoKey(key, alg, usage);
  return key;
}
async function wrap$2(alg, key, cek) {
  const cryptoKey = await getCryptoKey$1(key, alg, "wrapKey");
  checkKeySize(cryptoKey, alg);
  const cryptoKeyCek = await crypto.subtle.importKey("raw", cek, {
    hash: "SHA-256",
    name: "HMAC"
  }, true, ["sign"]);
  return new Uint8Array(await crypto.subtle.wrapKey("raw", cryptoKeyCek, cryptoKey, "AES-KW"));
}
async function unwrap$2(alg, key, encryptedKey) {
  const cryptoKey = await getCryptoKey$1(key, alg, "unwrapKey");
  checkKeySize(cryptoKey, alg);
  const cryptoKeyCek = await crypto.subtle.unwrapKey("raw", encryptedKey, cryptoKey, "AES-KW", {
    hash: "SHA-256",
    name: "HMAC"
  }, true, ["sign"]);
  return new Uint8Array(await crypto.subtle.exportKey("raw", cryptoKeyCek));
}
function lengthAndInput(input) {
  return concat(uint32be(input.length), input);
}
async function concatKdf(Z, L, OtherInfo) {
  const dkLen = L >> 3;
  const hashLen = 32;
  const reps = Math.ceil(dkLen / hashLen);
  const dk = new Uint8Array(reps * hashLen);
  for (let i = 1;i <= reps; i++) {
    const hashInput = new Uint8Array(4 + Z.length + OtherInfo.length);
    hashInput.set(uint32be(i), 0);
    hashInput.set(Z, 4);
    hashInput.set(OtherInfo, 4 + Z.length);
    const hashResult = await digest("sha256", hashInput);
    dk.set(hashResult, (i - 1) * hashLen);
  }
  return dk.slice(0, dkLen);
}
async function deriveKey$1(publicKey, privateKey, algorithm, keyLength, apu = new Uint8Array, apv = new Uint8Array) {
  checkEncCryptoKey(publicKey, "ECDH");
  checkEncCryptoKey(privateKey, "ECDH", "deriveBits");
  const otherInfo = concat(lengthAndInput(encode$1(algorithm)), lengthAndInput(apu), lengthAndInput(apv), uint32be(keyLength), new Uint8Array);
  return concatKdf(new Uint8Array(await crypto.subtle.deriveBits({
    name: publicKey.algorithm.name,
    public: publicKey
  }, privateKey, getEcdhBitLength(publicKey))), keyLength, otherInfo);
}
function getEcdhBitLength(publicKey) {
  if (publicKey.algorithm.name === "X25519")
    return 256;
  return Math.ceil(parseInt(publicKey.algorithm.namedCurve.slice(-3), 10) / 8) << 3;
}
function allowed(key) {
  switch (key.algorithm.namedCurve) {
    case "P-256":
    case "P-384":
    case "P-521":
      return true;
    default:
      return key.algorithm.name === "X25519";
  }
}
function getCryptoKey(key, alg) {
  if (key instanceof Uint8Array)
    return crypto.subtle.importKey("raw", key, "PBKDF2", false, ["deriveBits"]);
  checkEncCryptoKey(key, alg, "deriveBits");
  return key;
}
async function deriveKey(p2s, alg, p2c, key) {
  if (!(p2s instanceof Uint8Array) || p2s.length < 8)
    throw new JWEInvalid("PBES2 Salt Input must be 8 or more octets");
  const salt = concatSalt(alg, p2s);
  const keylen = parseInt(alg.slice(13, 16), 10);
  const subtleAlg = {
    hash: `SHA-${alg.slice(8, 11)}`,
    iterations: p2c,
    name: "PBKDF2",
    salt
  };
  const cryptoKey = await getCryptoKey(key, alg);
  return new Uint8Array(await crypto.subtle.deriveBits(subtleAlg, cryptoKey, keylen));
}
async function wrap$1(alg, key, cek, p2c = 2048, p2s = crypto.getRandomValues(new Uint8Array(16))) {
  const derived = await deriveKey(p2s, alg, p2c, key);
  return {
    encryptedKey: await wrap$2(alg.slice(-6), derived, cek),
    p2c,
    p2s: encode(p2s)
  };
}
async function unwrap$1(alg, key, encryptedKey, p2c, p2s) {
  const derived = await deriveKey(p2s, alg, p2c, key);
  return unwrap$2(alg.slice(-6), derived, encryptedKey);
}
function checkKeyLength(alg, key) {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048)
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
  }
}
function subtleAlgorithm$1(alg, algorithm) {
  const hash = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return {
        hash,
        name: "HMAC"
      };
    case "PS256":
    case "PS384":
    case "PS512":
      return {
        hash,
        name: "RSA-PSS",
        saltLength: parseInt(alg.slice(-3), 10) >> 3
      };
    case "RS256":
    case "RS384":
    case "RS512":
      return {
        hash,
        name: "RSASSA-PKCS1-v1_5"
      };
    case "ES256":
    case "ES384":
    case "ES512":
      return {
        hash,
        name: "ECDSA",
        namedCurve: algorithm.namedCurve
      };
    case "Ed25519":
    case "EdDSA":
      return { name: "Ed25519" };
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      return { name: alg };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}
async function getSigKey(alg, key, usage) {
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS"))
      throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "JSON Web Key"));
    return crypto.subtle.importKey("raw", key, {
      hash: `SHA-${alg.slice(-3)}`,
      name: "HMAC"
    }, false, [usage]);
  }
  checkSigCryptoKey(key, alg, usage);
  return key;
}
async function sign(alg, key, data) {
  const cryptoKey = await getSigKey(alg, key, "sign");
  checkKeyLength(alg, cryptoKey);
  const signature = await crypto.subtle.sign(subtleAlgorithm$1(alg, cryptoKey.algorithm), cryptoKey, data);
  return new Uint8Array(signature);
}
async function verify(alg, key, signature, data) {
  const cryptoKey = await getSigKey(alg, key, "verify");
  checkKeyLength(alg, cryptoKey);
  const algorithm = subtleAlgorithm$1(alg, cryptoKey.algorithm);
  try {
    return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
  } catch {
    return false;
  }
}
async function encrypt(alg, key, cek) {
  checkEncCryptoKey(key, alg, "encrypt");
  checkKeyLength(alg, key);
  return new Uint8Array(await crypto.subtle.encrypt(subtleAlgorithm(alg), key, cek));
}
async function decrypt(alg, key, encryptedKey) {
  checkEncCryptoKey(key, alg, "decrypt");
  checkKeyLength(alg, key);
  return new Uint8Array(await crypto.subtle.decrypt(subtleAlgorithm(alg), key, encryptedKey));
}
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "AKP":
      switch (jwk.alg) {
        case "ML-DSA-44":
        case "ML-DSA-65":
        case "ML-DSA-87":
          algorithm = { name: jwk.alg };
          keyUsages = jwk.priv ? ["sign"] : ["verify"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    case "RSA":
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = {
            name: "RSA-PSS",
            hash: `SHA-${jwk.alg.slice(-3)}`
          };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = {
            name: "RSASSA-PKCS1-v1_5",
            hash: `SHA-${jwk.alg.slice(-3)}`
          };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    case "EC":
      switch (jwk.alg) {
        case "ES256":
        case "ES384":
        case "ES512":
          algorithm = {
            name: "ECDSA",
            namedCurve: {
              ES256: "P-256",
              ES384: "P-384",
              ES512: "P-521"
            }[jwk.alg]
          };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = {
            name: "ECDH",
            namedCurve: jwk.crv
          };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    case "OKP":
      switch (jwk.alg) {
        case "Ed25519":
        case "EdDSA":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return {
    algorithm,
    keyUsages
  };
}
async function jwkToKey(jwk) {
  if (!jwk.alg)
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const keyData = { ...jwk };
  if (keyData.kty !== "AKP")
    delete keyData.alg;
  delete keyData.use;
  return crypto.subtle.importKey("jwk", keyData, algorithm, jwk.ext ?? (jwk.d || jwk.priv ? false : true), jwk.key_ops ?? keyUsages);
}
async function normalizeKey(key, alg) {
  if (key instanceof Uint8Array)
    return key;
  if (isCryptoKey(key))
    return key;
  if (isKeyObject(key)) {
    if (key.type === "secret")
      return key.export();
    if ("toCryptoKey" in key && typeof key.toCryptoKey === "function")
      try {
        return handleKeyObject(key, alg);
      } catch (err) {
        if (err instanceof TypeError)
          throw err;
      }
    return handleJWK(key, key.export({ format: "jwk" }), alg);
  }
  if (isJWK(key)) {
    if (key.k)
      return decode(key.k);
    return handleJWK(key, key, alg, true);
  }
  throw new Error("unreachable");
}
function parsePKCS8Header(state) {
  expectTag(state, 48, "Invalid PKCS#8 structure");
  parseLength(state);
  expectTag(state, 2, "Expected version field");
  const verLen = parseLength(state);
  state.pos += verLen;
  expectTag(state, 48, "Expected algorithm identifier");
  const algIdLen = parseLength(state);
  return {
    algIdStart: state.pos,
    algIdLength: algIdLen
  };
}
function parseSPKIHeader(state) {
  expectTag(state, 48, "Invalid SPKI structure");
  parseLength(state);
  expectTag(state, 48, "Expected algorithm identifier");
  const algIdLen = parseLength(state);
  return {
    algIdStart: state.pos,
    algIdLength: algIdLen
  };
}
function spkiFromX509(buf) {
  const state = createASN1State(buf);
  expectTag(state, 48, "Invalid certificate structure");
  parseLength(state);
  expectTag(state, 48, "Invalid tbsCertificate structure");
  parseLength(state);
  if (buf[state.pos] === 160)
    skipElement(state, 6);
  else
    skipElement(state, 5);
  const spkiStart = state.pos;
  expectTag(state, 48, "Invalid SPKI structure");
  const spkiContentLen = parseLength(state);
  return buf.subarray(spkiStart, spkiStart + spkiContentLen + (state.pos - spkiStart));
}
function extractX509SPKI(x509) {
  return spkiFromX509(processPEMData(x509, /(?:-----(?:BEGIN|END) CERTIFICATE-----|\s)/g));
}
async function importSPKI(spki, alg, options) {
  if (typeof spki !== "string" || spki.indexOf("-----BEGIN PUBLIC KEY-----") !== 0)
    throw new TypeError('"spki" must be SPKI formatted string');
  return fromSPKI(spki, alg, options);
}
async function importX509(x509, alg, options) {
  if (typeof x509 !== "string" || x509.indexOf("-----BEGIN CERTIFICATE-----") !== 0)
    throw new TypeError('"x509" must be X.509 formatted string');
  return fromX509(x509, alg, options);
}
async function importPKCS8(pkcs8, alg, options) {
  if (typeof pkcs8 !== "string" || pkcs8.indexOf("-----BEGIN PRIVATE KEY-----") !== 0)
    throw new TypeError('"pkcs8" must be PKCS#8 formatted string');
  return fromPKCS8(pkcs8, alg, options);
}
async function importJWK(jwk, alg, options) {
  if (!isObject(jwk))
    throw new TypeError("JWK must be an object");
  let ext;
  alg ??= jwk.alg;
  ext ??= options?.extractable ?? jwk.ext;
  switch (jwk.kty) {
    case "oct":
      if (typeof jwk.k !== "string" || !jwk.k)
        throw new TypeError('missing "k" (Key Value) Parameter value');
      return decode(jwk.k);
    case "RSA":
      if ("oth" in jwk && jwk.oth !== undefined)
        throw new JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');
      return jwkToKey({
        ...jwk,
        alg,
        ext
      });
    case "AKP":
      if (typeof jwk.alg !== "string" || !jwk.alg)
        throw new TypeError('missing "alg" (Algorithm) Parameter value');
      if (alg !== undefined && alg !== jwk.alg)
        throw new TypeError("JWK alg and alg option value mismatch");
      return jwkToKey({
        ...jwk,
        ext
      });
    case "EC":
    case "OKP":
      return jwkToKey({
        ...jwk,
        alg,
        ext
      });
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
  }
}
async function keyToJWK(key) {
  if (isKeyObject(key))
    if (key.type === "secret")
      key = key.export();
    else
      return key.export({ format: "jwk" });
  if (key instanceof Uint8Array)
    return {
      kty: "oct",
      k: encode(key)
    };
  if (!isCryptoKey(key))
    throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "Uint8Array"));
  if (!key.extractable)
    throw new TypeError("non-extractable CryptoKey cannot be exported as a JWK");
  const { ext, key_ops, alg, use, ...jwk } = await crypto.subtle.exportKey("jwk", key);
  if (jwk.kty === "AKP")
    jwk.alg = alg;
  return jwk;
}
async function exportSPKI(key) {
  return toSPKI(key);
}
async function exportPKCS8(key) {
  return toPKCS8(key);
}
async function exportJWK(key) {
  return keyToJWK(key);
}
async function wrap(alg, key, cek, iv) {
  const wrapped = await encrypt$1(alg.slice(0, 7), cek, key, iv, new Uint8Array);
  return {
    encryptedKey: wrapped.ciphertext,
    iv: encode(wrapped.iv),
    tag: encode(wrapped.tag)
  };
}
async function unwrap(alg, key, encryptedKey, iv, tag) {
  return decrypt$1(alg.slice(0, 7), key, encryptedKey, iv, tag, new Uint8Array);
}
function assertEncryptedKey(encryptedKey) {
  if (encryptedKey === undefined)
    throw new JWEInvalid("JWE Encrypted Key missing");
}
async function decryptKeyManagement(alg, key, encryptedKey, joseHeader, options) {
  switch (alg) {
    case "dir":
      if (encryptedKey !== undefined)
        throw new JWEInvalid("Encountered unexpected JWE Encrypted Key");
      return key;
    case "ECDH-ES":
      if (encryptedKey !== undefined)
        throw new JWEInvalid("Encountered unexpected JWE Encrypted Key");
    case "ECDH-ES+A128KW":
    case "ECDH-ES+A192KW":
    case "ECDH-ES+A256KW": {
      if (!isObject(joseHeader.epk))
        throw new JWEInvalid(`JOSE Header "epk" (Ephemeral Public Key) missing or invalid`);
      assertCryptoKey(key);
      if (!allowed(key))
        throw new JOSENotSupported("ECDH with the provided key is not allowed or not supported by your javascript runtime");
      const epk = await importJWK(joseHeader.epk, alg);
      assertCryptoKey(epk);
      let partyUInfo;
      let partyVInfo;
      if (joseHeader.apu !== undefined) {
        if (typeof joseHeader.apu !== "string")
          throw new JWEInvalid(`JOSE Header "apu" (Agreement PartyUInfo) invalid`);
        partyUInfo = decodeBase64url(joseHeader.apu, "apu", JWEInvalid);
      }
      if (joseHeader.apv !== undefined) {
        if (typeof joseHeader.apv !== "string")
          throw new JWEInvalid(`JOSE Header "apv" (Agreement PartyVInfo) invalid`);
        partyVInfo = decodeBase64url(joseHeader.apv, "apv", JWEInvalid);
      }
      const sharedSecret = await deriveKey$1(epk, key, alg === "ECDH-ES" ? joseHeader.enc : alg, alg === "ECDH-ES" ? cekLength(joseHeader.enc) : parseInt(alg.slice(-5, -2), 10), partyUInfo, partyVInfo);
      if (alg === "ECDH-ES")
        return sharedSecret;
      assertEncryptedKey(encryptedKey);
      return unwrap$2(alg.slice(-6), sharedSecret, encryptedKey);
    }
    case "RSA-OAEP":
    case "RSA-OAEP-256":
    case "RSA-OAEP-384":
    case "RSA-OAEP-512":
      assertEncryptedKey(encryptedKey);
      assertCryptoKey(key);
      return decrypt(alg, key, encryptedKey);
    case "PBES2-HS256+A128KW":
    case "PBES2-HS384+A192KW":
    case "PBES2-HS512+A256KW": {
      assertEncryptedKey(encryptedKey);
      if (typeof joseHeader.p2c !== "number")
        throw new JWEInvalid(`JOSE Header "p2c" (PBES2 Count) missing or invalid`);
      const p2cLimit = options?.maxPBES2Count || 1e4;
      if (joseHeader.p2c > p2cLimit)
        throw new JWEInvalid(`JOSE Header "p2c" (PBES2 Count) out is of acceptable bounds`);
      if (typeof joseHeader.p2s !== "string")
        throw new JWEInvalid(`JOSE Header "p2s" (PBES2 Salt) missing or invalid`);
      let p2s;
      p2s = decodeBase64url(joseHeader.p2s, "p2s", JWEInvalid);
      return unwrap$1(alg, key, encryptedKey, joseHeader.p2c, p2s);
    }
    case "A128KW":
    case "A192KW":
    case "A256KW":
      assertEncryptedKey(encryptedKey);
      return unwrap$2(alg, key, encryptedKey);
    case "A128GCMKW":
    case "A192GCMKW":
    case "A256GCMKW": {
      assertEncryptedKey(encryptedKey);
      if (typeof joseHeader.iv !== "string")
        throw new JWEInvalid(`JOSE Header "iv" (Initialization Vector) missing or invalid`);
      if (typeof joseHeader.tag !== "string")
        throw new JWEInvalid(`JOSE Header "tag" (Authentication Tag) missing or invalid`);
      let iv;
      iv = decodeBase64url(joseHeader.iv, "iv", JWEInvalid);
      let tag;
      tag = decodeBase64url(joseHeader.tag, "tag", JWEInvalid);
      return unwrap(alg, key, encryptedKey, iv, tag);
    }
    default:
      throw new JOSENotSupported(unsupportedAlgHeader);
  }
}
async function encryptKeyManagement(alg, enc, key, providedCek, providedParameters = {}) {
  let encryptedKey;
  let parameters;
  let cek;
  switch (alg) {
    case "dir":
      cek = key;
      break;
    case "ECDH-ES":
    case "ECDH-ES+A128KW":
    case "ECDH-ES+A192KW":
    case "ECDH-ES+A256KW": {
      assertCryptoKey(key);
      if (!allowed(key))
        throw new JOSENotSupported("ECDH with the provided key is not allowed or not supported by your javascript runtime");
      const { apu, apv } = providedParameters;
      let ephemeralKey;
      if (providedParameters.epk)
        ephemeralKey = await normalizeKey(providedParameters.epk, alg);
      else
        ephemeralKey = (await crypto.subtle.generateKey(key.algorithm, true, ["deriveBits"])).privateKey;
      const { x, y, crv, kty } = await exportJWK(ephemeralKey);
      const sharedSecret = await deriveKey$1(key, ephemeralKey, alg === "ECDH-ES" ? enc : alg, alg === "ECDH-ES" ? cekLength(enc) : parseInt(alg.slice(-5, -2), 10), apu, apv);
      parameters = { epk: {
        x,
        crv,
        kty
      } };
      if (kty === "EC")
        parameters.epk.y = y;
      if (apu)
        parameters.apu = encode(apu);
      if (apv)
        parameters.apv = encode(apv);
      if (alg === "ECDH-ES") {
        cek = sharedSecret;
        break;
      }
      cek = providedCek || generateCek(enc);
      encryptedKey = await wrap$2(alg.slice(-6), sharedSecret, cek);
      break;
    }
    case "RSA-OAEP":
    case "RSA-OAEP-256":
    case "RSA-OAEP-384":
    case "RSA-OAEP-512":
      cek = providedCek || generateCek(enc);
      assertCryptoKey(key);
      encryptedKey = await encrypt(alg, key, cek);
      break;
    case "PBES2-HS256+A128KW":
    case "PBES2-HS384+A192KW":
    case "PBES2-HS512+A256KW": {
      cek = providedCek || generateCek(enc);
      const { p2c, p2s } = providedParameters;
      ({ encryptedKey, ...parameters } = await wrap$1(alg, key, cek, p2c, p2s));
      break;
    }
    case "A128KW":
    case "A192KW":
    case "A256KW":
      cek = providedCek || generateCek(enc);
      encryptedKey = await wrap$2(alg, key, cek);
      break;
    case "A128GCMKW":
    case "A192GCMKW":
    case "A256GCMKW": {
      cek = providedCek || generateCek(enc);
      const { iv } = providedParameters;
      ({ encryptedKey, ...parameters } = await wrap(alg, key, cek, iv));
      break;
    }
    default:
      throw new JOSENotSupported(unsupportedAlgHeader);
  }
  return {
    cek,
    encryptedKey,
    parameters
  };
}
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== undefined && protectedHeader?.crit === undefined)
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  if (!protectedHeader || protectedHeader.crit === undefined)
    return /* @__PURE__ */ new Set;
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0))
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  let recognized;
  if (recognizedOption !== undefined)
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  else
    recognized = recognizedDefault;
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter))
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    if (joseHeader[parameter] === undefined)
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    if (recognized.get(parameter) && protectedHeader[parameter] === undefined)
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
  }
  return new Set(protectedHeader.crit);
}
function validateAlgorithms(option, algorithms) {
  if (algorithms !== undefined && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string")))
    throw new TypeError(`"${option}" option must be an array of strings`);
  if (!algorithms)
    return;
  return new Set(algorithms);
}
function checkKeyType(alg, key, usage) {
  switch (alg.substring(0, 2)) {
    case "A1":
    case "A2":
    case "di":
    case "HS":
    case "PB":
      symmetricTypeCheck(alg, key, usage);
      break;
    default:
      asymmetricTypeCheck(alg, key, usage);
  }
}
function supported(name) {
  if (typeof globalThis[name] === "undefined")
    throw new JOSENotSupported(`JWE "zip" (Compression Algorithm) Header Parameter requires the ${name} API.`);
}
async function compress(input) {
  supported("CompressionStream");
  const cs = new CompressionStream("deflate-raw");
  const writer = cs.writable.getWriter();
  writer.write(input).catch(() => {});
  writer.close().catch(() => {});
  const chunks = [];
  const reader = cs.readable.getReader();
  for (;; ) {
    const { value, done } = await reader.read();
    if (done)
      break;
    chunks.push(value);
  }
  return concat(...chunks);
}
async function decompress(input, maxLength) {
  supported("DecompressionStream");
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  writer.write(input).catch(() => {});
  writer.close().catch(() => {});
  const chunks = [];
  let length = 0;
  const reader = ds.readable.getReader();
  for (;; ) {
    const { value, done } = await reader.read();
    if (done)
      break;
    chunks.push(value);
    length += value.byteLength;
    if (maxLength !== Infinity && length > maxLength)
      throw new JWEInvalid("Decompressed plaintext exceeded the configured limit");
  }
  return concat(...chunks);
}
async function flattenedDecrypt(jwe, key, options) {
  if (!isObject(jwe))
    throw new JWEInvalid("Flattened JWE must be an object");
  if (jwe.protected === undefined && jwe.header === undefined && jwe.unprotected === undefined)
    throw new JWEInvalid("JOSE Header missing");
  if (jwe.iv !== undefined && typeof jwe.iv !== "string")
    throw new JWEInvalid("JWE Initialization Vector incorrect type");
  if (typeof jwe.ciphertext !== "string")
    throw new JWEInvalid("JWE Ciphertext missing or incorrect type");
  if (jwe.tag !== undefined && typeof jwe.tag !== "string")
    throw new JWEInvalid("JWE Authentication Tag incorrect type");
  if (jwe.protected !== undefined && typeof jwe.protected !== "string")
    throw new JWEInvalid("JWE Protected Header incorrect type");
  if (jwe.encrypted_key !== undefined && typeof jwe.encrypted_key !== "string")
    throw new JWEInvalid("JWE Encrypted Key incorrect type");
  if (jwe.aad !== undefined && typeof jwe.aad !== "string")
    throw new JWEInvalid("JWE AAD incorrect type");
  if (jwe.header !== undefined && !isObject(jwe.header))
    throw new JWEInvalid("JWE Shared Unprotected Header incorrect type");
  if (jwe.unprotected !== undefined && !isObject(jwe.unprotected))
    throw new JWEInvalid("JWE Per-Recipient Unprotected Header incorrect type");
  let parsedProt;
  if (jwe.protected)
    try {
      const protectedHeader2 = decode(jwe.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader2));
    } catch {
      throw new JWEInvalid("JWE Protected Header is invalid");
    }
  if (!isDisjoint(parsedProt, jwe.header, jwe.unprotected))
    throw new JWEInvalid("JWE Protected, JWE Unprotected Header, and JWE Per-Recipient Unprotected Header Parameter names must be disjoint");
  const joseHeader = {
    ...parsedProt,
    ...jwe.header,
    ...jwe.unprotected
  };
  validateCrit(JWEInvalid, /* @__PURE__ */ new Map, options?.crit, parsedProt, joseHeader);
  if (joseHeader.zip !== undefined && joseHeader.zip !== "DEF")
    throw new JOSENotSupported('Unsupported JWE "zip" (Compression Algorithm) Header Parameter value.');
  if (joseHeader.zip !== undefined && !parsedProt?.zip)
    throw new JWEInvalid('JWE "zip" (Compression Algorithm) Header Parameter MUST be in a protected header.');
  const { alg, enc } = joseHeader;
  if (typeof alg !== "string" || !alg)
    throw new JWEInvalid("missing JWE Algorithm (alg) in JWE Header");
  if (typeof enc !== "string" || !enc)
    throw new JWEInvalid("missing JWE Encryption Algorithm (enc) in JWE Header");
  const keyManagementAlgorithms = options && validateAlgorithms("keyManagementAlgorithms", options.keyManagementAlgorithms);
  const contentEncryptionAlgorithms = options && validateAlgorithms("contentEncryptionAlgorithms", options.contentEncryptionAlgorithms);
  if (keyManagementAlgorithms && !keyManagementAlgorithms.has(alg) || !keyManagementAlgorithms && alg.startsWith("PBES2"))
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  if (contentEncryptionAlgorithms && !contentEncryptionAlgorithms.has(enc))
    throw new JOSEAlgNotAllowed('"enc" (Encryption Algorithm) Header Parameter value not allowed');
  let encryptedKey;
  if (jwe.encrypted_key !== undefined)
    encryptedKey = decodeBase64url(jwe.encrypted_key, "encrypted_key", JWEInvalid);
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jwe);
    resolvedKey = true;
  }
  checkKeyType(alg === "dir" ? enc : alg, key, "decrypt");
  const k = await normalizeKey(key, alg);
  let cek;
  try {
    cek = await decryptKeyManagement(alg, k, encryptedKey, joseHeader, options);
  } catch (err) {
    if (err instanceof TypeError || err instanceof JWEInvalid || err instanceof JOSENotSupported)
      throw err;
    cek = generateCek(enc);
  }
  let iv;
  let tag2;
  if (jwe.iv !== undefined)
    iv = decodeBase64url(jwe.iv, "iv", JWEInvalid);
  if (jwe.tag !== undefined)
    tag2 = decodeBase64url(jwe.tag, "tag", JWEInvalid);
  const protectedHeader = jwe.protected !== undefined ? encode$1(jwe.protected) : new Uint8Array;
  let additionalData;
  if (jwe.aad !== undefined)
    additionalData = concat(protectedHeader, encode$1("."), encode$1(jwe.aad));
  else
    additionalData = protectedHeader;
  const ciphertext = decodeBase64url(jwe.ciphertext, "ciphertext", JWEInvalid);
  const plaintext = await decrypt$1(enc, cek, ciphertext, iv, tag2, additionalData);
  const result = { plaintext };
  if (joseHeader.zip === "DEF") {
    const maxDecompressedLength = options?.maxDecompressedLength ?? 250000;
    if (maxDecompressedLength === 0)
      throw new JOSENotSupported('JWE "zip" (Compression Algorithm) Header Parameter is not supported.');
    if (maxDecompressedLength !== Infinity && (!Number.isSafeInteger(maxDecompressedLength) || maxDecompressedLength < 1))
      throw new TypeError("maxDecompressedLength must be 0, a positive safe integer, or Infinity");
    result.plaintext = await decompress(plaintext, maxDecompressedLength).catch((cause) => {
      if (cause instanceof JWEInvalid)
        throw cause;
      throw new JWEInvalid("Failed to decompress plaintext", { cause });
    });
  }
  if (jwe.protected !== undefined)
    result.protectedHeader = parsedProt;
  if (jwe.aad !== undefined)
    result.additionalAuthenticatedData = decodeBase64url(jwe.aad, "aad", JWEInvalid);
  if (jwe.unprotected !== undefined)
    result.sharedUnprotectedHeader = jwe.unprotected;
  if (jwe.header !== undefined)
    result.unprotectedHeader = jwe.header;
  if (resolvedKey)
    return {
      ...result,
      key: k
    };
  return result;
}
async function compactDecrypt(jwe, key, options) {
  if (jwe instanceof Uint8Array)
    jwe = decoder.decode(jwe);
  if (typeof jwe !== "string")
    throw new JWEInvalid("Compact JWE must be a string or Uint8Array");
  const { 0: protectedHeader, 1: encryptedKey, 2: iv, 3: ciphertext, 4: tag2, length } = jwe.split(".");
  if (length !== 5)
    throw new JWEInvalid("Invalid Compact JWE");
  const decrypted = await flattenedDecrypt({
    ciphertext,
    iv: iv || undefined,
    protected: protectedHeader,
    tag: tag2 || undefined,
    encrypted_key: encryptedKey || undefined
  }, key, options);
  const result = {
    plaintext: decrypted.plaintext,
    protectedHeader: decrypted.protectedHeader
  };
  if (typeof key === "function")
    return {
      ...result,
      key: decrypted.key
    };
  return result;
}
async function generalDecrypt(jwe, key, options) {
  if (!isObject(jwe))
    throw new JWEInvalid("General JWE must be an object");
  if (!Array.isArray(jwe.recipients) || !jwe.recipients.every(isObject))
    throw new JWEInvalid("JWE Recipients missing or incorrect type");
  if (!jwe.recipients.length)
    throw new JWEInvalid("JWE Recipients has no members");
  for (const recipient of jwe.recipients)
    try {
      return await flattenedDecrypt({
        aad: jwe.aad,
        ciphertext: jwe.ciphertext,
        encrypted_key: recipient.encrypted_key,
        header: recipient.header,
        iv: jwe.iv,
        protected: jwe.protected,
        tag: jwe.tag,
        unprotected: jwe.unprotected
      }, key, options);
    } catch {}
  throw new JWEDecryptionFailed;
}
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws))
    throw new JWSInvalid("Flattened JWS must be an object");
  if (jws.protected === undefined && jws.header === undefined)
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  if (jws.protected !== undefined && typeof jws.protected !== "string")
    throw new JWSInvalid("JWS Protected Header incorrect type");
  if (jws.payload === undefined)
    throw new JWSInvalid("JWS Payload missing");
  if (typeof jws.signature !== "string")
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  if (jws.header !== undefined && !isObject(jws.header))
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  let parsedProt = {};
  if (jws.protected)
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  if (!isDisjoint(parsedProt, jws.header))
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validateCrit(JWSInvalid, new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean")
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg)
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  const algorithms = options && validateAlgorithms("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg))
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  if (b64) {
    if (typeof jws.payload !== "string")
      throw new JWSInvalid("JWS Payload must be a string");
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array))
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
  }
  checkKeyType(alg, key, "verify");
  const data = concat(jws.protected !== undefined ? encode$1(jws.protected) : new Uint8Array, encode$1("."), typeof jws.payload === "string" ? b64 ? encode$1(jws.payload) : encoder.encode(jws.payload) : jws.payload);
  const signature = decodeBase64url(jws.signature, "signature", JWSInvalid);
  const k = await normalizeKey(key, alg);
  if (!await verify(alg, k, signature, data))
    throw new JWSSignatureVerificationFailed;
  let payload;
  if (b64)
    payload = decodeBase64url(jws.payload, "payload", JWSInvalid);
  else if (typeof jws.payload === "string")
    payload = encoder.encode(jws.payload);
  else
    payload = jws.payload;
  const result = { payload };
  if (jws.protected !== undefined)
    result.protectedHeader = parsedProt;
  if (jws.header !== undefined)
    result.unprotectedHeader = jws.header;
  if (resolvedKey)
    return {
      ...result,
      key: k
    };
  return result;
}
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array)
    jws = decoder.decode(jws);
  if (typeof jws !== "string")
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3)
    throw new JWSInvalid("Invalid Compact JWS");
  const verified = await flattenedVerify({
    payload,
    protected: protectedHeader,
    signature
  }, key, options);
  const result = {
    payload: verified.payload,
    protectedHeader: verified.protectedHeader
  };
  if (typeof key === "function")
    return {
      ...result,
      key: verified.key
    };
  return result;
}
async function generalVerify(jws, key, options) {
  if (!isObject(jws))
    throw new JWSInvalid("General JWS must be an object");
  if (!Array.isArray(jws.signatures) || !jws.signatures.every(isObject))
    throw new JWSInvalid("JWS Signatures missing or incorrect type");
  for (const signature of jws.signatures)
    try {
      return await flattenedVerify({
        header: signature.header,
        payload: jws.payload,
        protected: signature.protected,
        signature: signature.signature
      }, key, options);
    } catch {}
  throw new JWSSignatureVerificationFailed;
}
function secs(str) {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1])
    throw new TypeError("Invalid time period format");
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago")
    return -numericDate;
  return numericDate;
}
function validateInput(label, input) {
  if (!Number.isFinite(input))
    throw new TypeError(`Invalid ${label} input`);
  return input;
}
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {}
  if (!isObject(payload))
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ)))
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== undefined)
    presenceCheck.push("iat");
  if (audience !== undefined)
    presenceCheck.push("aud");
  if (subject !== undefined)
    presenceCheck.push("sub");
  if (issuer !== undefined)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse()))
    if (!(claim in payload))
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss))
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  if (subject && payload.sub !== subject)
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience))
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch(currentDate || /* @__PURE__ */ new Date);
  if ((payload.iat !== undefined || maxTokenAge) && typeof payload.iat !== "number")
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  if (payload.nbf !== undefined) {
    if (typeof payload.nbf !== "number")
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    if (payload.nbf > now + tolerance)
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
  }
  if (payload.exp !== undefined) {
    if (typeof payload.exp !== "number")
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    if (payload.exp <= now - tolerance)
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs(maxTokenAge);
    if (age - tolerance > max)
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    if (age < 0 - tolerance)
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
  }
  return payload;
}
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false)
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  const result = {
    payload: validateClaimsSet(verified.protectedHeader, verified.payload, options),
    protectedHeader: verified.protectedHeader
  };
  if (typeof key === "function")
    return {
      ...result,
      key: verified.key
    };
  return result;
}
async function jwtDecrypt(jwt, key, options) {
  const decrypted = await compactDecrypt(jwt, key, options);
  const payload = validateClaimsSet(decrypted.protectedHeader, decrypted.plaintext, options);
  const { protectedHeader } = decrypted;
  if (protectedHeader.iss !== undefined && protectedHeader.iss !== payload.iss)
    throw new JWTClaimValidationFailed('replicated "iss" claim header parameter mismatch', payload, "iss", "mismatch");
  if (protectedHeader.sub !== undefined && protectedHeader.sub !== payload.sub)
    throw new JWTClaimValidationFailed('replicated "sub" claim header parameter mismatch', payload, "sub", "mismatch");
  if (protectedHeader.aud !== undefined && JSON.stringify(protectedHeader.aud) !== JSON.stringify(payload.aud))
    throw new JWTClaimValidationFailed('replicated "aud" claim header parameter mismatch', payload, "aud", "mismatch");
  const result = {
    payload,
    protectedHeader
  };
  if (typeof key === "function")
    return {
      ...result,
      key: decrypted.key
    };
  return result;
}
async function calculateJwkThumbprint(key, digestAlgorithm) {
  let jwk;
  if (isJWK(key))
    jwk = key;
  else if (isKeyLike(key))
    jwk = await exportJWK(key);
  else
    throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "JSON Web Key"));
  digestAlgorithm ??= "sha256";
  if (digestAlgorithm !== "sha256" && digestAlgorithm !== "sha384" && digestAlgorithm !== "sha512")
    throw new TypeError('digestAlgorithm must one of "sha256", "sha384", or "sha512"');
  let components;
  switch (jwk.kty) {
    case "AKP":
      check(jwk.alg, '"alg" (Algorithm) Parameter');
      check(jwk.pub, '"pub" (Public key) Parameter');
      components = {
        alg: jwk.alg,
        kty: jwk.kty,
        pub: jwk.pub
      };
      break;
    case "EC":
      check(jwk.crv, '"crv" (Curve) Parameter');
      check(jwk.x, '"x" (X Coordinate) Parameter');
      check(jwk.y, '"y" (Y Coordinate) Parameter');
      components = {
        crv: jwk.crv,
        kty: jwk.kty,
        x: jwk.x,
        y: jwk.y
      };
      break;
    case "OKP":
      check(jwk.crv, '"crv" (Subtype of Key Pair) Parameter');
      check(jwk.x, '"x" (Public Key) Parameter');
      components = {
        crv: jwk.crv,
        kty: jwk.kty,
        x: jwk.x
      };
      break;
    case "RSA":
      check(jwk.e, '"e" (Exponent) Parameter');
      check(jwk.n, '"n" (Modulus) Parameter');
      components = {
        e: jwk.e,
        kty: jwk.kty,
        n: jwk.n
      };
      break;
    case "oct":
      check(jwk.k, '"k" (Key Value) Parameter');
      components = {
        k: jwk.k,
        kty: jwk.kty
      };
      break;
    default:
      throw new JOSENotSupported('"kty" (Key Type) Parameter missing or unsupported');
  }
  const data = encode$1(JSON.stringify(components));
  return encode(await digest(digestAlgorithm, data));
}
async function calculateJwkThumbprintUri(key, digestAlgorithm) {
  digestAlgorithm ??= "sha256";
  const thumbprint = await calculateJwkThumbprint(key, digestAlgorithm);
  return `urn:ietf:params:oauth:jwk-thumbprint:sha-${digestAlgorithm.slice(-3)}:${thumbprint}`;
}
async function EmbeddedJWK(protectedHeader, token) {
  const joseHeader = {
    ...protectedHeader,
    ...token?.header
  };
  if (!isObject(joseHeader.jwk))
    throw new JWSInvalid('"jwk" (JSON Web Key) Header Parameter must be a JSON object');
  const key = await importJWK({
    ...joseHeader.jwk,
    ext: true
  }, joseHeader.alg);
  if (key instanceof Uint8Array || key.type !== "public")
    throw new JWSInvalid('"jwk" (JSON Web Key) Header Parameter must be a public key');
  return key;
}
function getKtyFromAlg(alg) {
  switch (typeof alg === "string" && alg.slice(0, 2)) {
    case "RS":
    case "PS":
      return "RSA";
    case "ES":
      return "EC";
    case "Ed":
      return "OKP";
    case "ML":
      return "AKP";
    default:
      throw new JOSENotSupported('Unsupported "alg" value for a JSON Web Key Set');
  }
}
function isJWKSLike(jwks) {
  return jwks && typeof jwks === "object" && Array.isArray(jwks.keys) && jwks.keys.every(isJWKLike);
}
function isJWKLike(key) {
  return isObject(key);
}
async function importWithAlgCache(cache2, jwk, alg) {
  const cached = cache2.get(jwk) || cache2.set(jwk, {}).get(jwk);
  if (cached[alg] === undefined) {
    const key = await importJWK({
      ...jwk,
      ext: true
    }, alg);
    if (key instanceof Uint8Array || key.type !== "public")
      throw new JWKSInvalid("JSON Web Key Set members must be public keys");
    cached[alg] = key;
  }
  return cached[alg];
}
function createLocalJWKSet(jwks) {
  const set = new LocalJWKSet(jwks);
  const localJWKSet = async (protectedHeader, token) => set.getKey(protectedHeader, token);
  Object.defineProperties(localJWKSet, { jwks: {
    value: () => structuredClone(set.jwks()),
    enumerable: false,
    configurable: false,
    writable: false
  } });
  return localJWKSet;
}
function isCloudflareWorkers() {
  return typeof WebSocketPair !== "undefined" || typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers" || typeof EdgeRuntime !== "undefined" && EdgeRuntime === "vercel";
}
async function fetchJwks(url, headers, signal, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    method: "GET",
    signal,
    redirect: "manual",
    headers
  }).catch((err) => {
    if (err.name === "TimeoutError")
      throw new JWKSTimeout;
    throw err;
  });
  if (response.status !== 200)
    throw new JOSEError("Expected 200 OK from the JSON Web Key Set HTTP response");
  try {
    return await response.json();
  } catch {
    throw new JOSEError("Failed to parse the JSON Web Key Set HTTP response as JSON");
  }
}
function isFreshJwksCache(input, cacheMaxAge) {
  if (typeof input !== "object" || input === null)
    return false;
  if (!("uat" in input) || typeof input.uat !== "number" || Date.now() - input.uat >= cacheMaxAge)
    return false;
  if (!("jwks" in input) || !isObject(input.jwks) || !Array.isArray(input.jwks.keys) || !Array.prototype.every.call(input.jwks.keys, isObject))
    return false;
  return true;
}
function createRemoteJWKSet(url, options) {
  const set = new RemoteJWKSet(url, options);
  const remoteJWKSet = async (protectedHeader, token) => set.getKey(protectedHeader, token);
  Object.defineProperties(remoteJWKSet, {
    coolingDown: {
      get: () => set.coolingDown(),
      enumerable: true,
      configurable: false
    },
    fresh: {
      get: () => set.fresh(),
      enumerable: true,
      configurable: false
    },
    reload: {
      value: () => set.reload(),
      enumerable: true,
      configurable: false,
      writable: false
    },
    reloading: {
      get: () => set.pendingFetch(),
      enumerable: true,
      configurable: false
    },
    jwks: {
      value: () => set.jwks(),
      enumerable: true,
      configurable: false,
      writable: false
    }
  });
  return remoteJWKSet;
}
function decodeProtectedHeader(token) {
  let protectedB64u;
  if (typeof token === "string") {
    const parts = token.split(".");
    if (parts.length === 3 || parts.length === 5)
      [protectedB64u] = parts;
  } else if (typeof token === "object" && token)
    if ("protected" in token)
      protectedB64u = token.protected;
    else
      throw new TypeError("Token does not contain a Protected Header");
  try {
    if (typeof protectedB64u !== "string" || !protectedB64u)
      throw new Error;
    const result = JSON.parse(decoder.decode(decode(protectedB64u)));
    if (!isObject(result))
      throw new Error;
    return result;
  } catch {
    throw new TypeError("Invalid Token or Protected Header formatting");
  }
}
function decodeJwt(jwt) {
  if (typeof jwt !== "string")
    throw new JWTInvalid("JWTs must use Compact JWS serialization, JWT must be a string");
  const { 1: payload, length } = jwt.split(".");
  if (length === 5)
    throw new JWTInvalid("Only JWTs using Compact JWS serialization can be decoded");
  if (length !== 3)
    throw new JWTInvalid("Invalid JWT");
  if (!payload)
    throw new JWTInvalid("JWTs must contain a payload");
  let decoded;
  try {
    decoded = decode(payload);
  } catch {
    throw new JWTInvalid("Failed to base64url decode the payload");
  }
  let result;
  try {
    result = JSON.parse(decoder.decode(decoded));
  } catch {
    throw new JWTInvalid("Failed to parse the decoded payload as JSON");
  }
  if (!isObject(result))
    throw new JWTInvalid("Invalid JWT Claims Set");
  return result;
}
function getModulusLengthOption(options) {
  const modulusLength = options?.modulusLength ?? 2048;
  if (typeof modulusLength !== "number" || modulusLength < 2048)
    throw new JOSENotSupported("Invalid or unsupported modulusLength option provided, 2048 bits or larger keys must be used");
  return modulusLength;
}
async function generateKeyPair(alg, options) {
  let algorithm;
  let keyUsages;
  switch (alg) {
    case "PS256":
    case "PS384":
    case "PS512":
      algorithm = {
        name: "RSA-PSS",
        hash: `SHA-${alg.slice(-3)}`,
        publicExponent: Uint8Array.of(1, 0, 1),
        modulusLength: getModulusLengthOption(options)
      };
      keyUsages = ["sign", "verify"];
      break;
    case "RS256":
    case "RS384":
    case "RS512":
      algorithm = {
        name: "RSASSA-PKCS1-v1_5",
        hash: `SHA-${alg.slice(-3)}`,
        publicExponent: Uint8Array.of(1, 0, 1),
        modulusLength: getModulusLengthOption(options)
      };
      keyUsages = ["sign", "verify"];
      break;
    case "RSA-OAEP":
    case "RSA-OAEP-256":
    case "RSA-OAEP-384":
    case "RSA-OAEP-512":
      algorithm = {
        name: "RSA-OAEP",
        hash: `SHA-${parseInt(alg.slice(-3), 10) || 1}`,
        publicExponent: Uint8Array.of(1, 0, 1),
        modulusLength: getModulusLengthOption(options)
      };
      keyUsages = [
        "decrypt",
        "unwrapKey",
        "encrypt",
        "wrapKey"
      ];
      break;
    case "ES256":
      algorithm = {
        name: "ECDSA",
        namedCurve: "P-256"
      };
      keyUsages = ["sign", "verify"];
      break;
    case "ES384":
      algorithm = {
        name: "ECDSA",
        namedCurve: "P-384"
      };
      keyUsages = ["sign", "verify"];
      break;
    case "ES512":
      algorithm = {
        name: "ECDSA",
        namedCurve: "P-521"
      };
      keyUsages = ["sign", "verify"];
      break;
    case "Ed25519":
    case "EdDSA":
      keyUsages = ["sign", "verify"];
      algorithm = { name: "Ed25519" };
      break;
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      keyUsages = ["sign", "verify"];
      algorithm = { name: alg };
      break;
    case "ECDH-ES":
    case "ECDH-ES+A128KW":
    case "ECDH-ES+A192KW":
    case "ECDH-ES+A256KW": {
      keyUsages = ["deriveBits"];
      const crv = options?.crv ?? "P-256";
      switch (crv) {
        case "P-256":
        case "P-384":
        case "P-521":
          algorithm = {
            name: "ECDH",
            namedCurve: crv
          };
          break;
        case "X25519":
          algorithm = { name: "X25519" };
          break;
        default:
          throw new JOSENotSupported("Invalid or unsupported crv option provided, supported values are P-256, P-384, P-521, and X25519");
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
  }
  return crypto.subtle.generateKey(algorithm, options?.extractable ?? false, keyUsages);
}
async function generateSecret(alg, options) {
  let length;
  let algorithm;
  let keyUsages;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      length = parseInt(alg.slice(-3), 10);
      algorithm = {
        name: "HMAC",
        hash: `SHA-${length}`,
        length
      };
      keyUsages = ["sign", "verify"];
      break;
    case "A128CBC-HS256":
    case "A192CBC-HS384":
    case "A256CBC-HS512":
      length = parseInt(alg.slice(-3), 10);
      return crypto.getRandomValues(new Uint8Array(length >> 3));
    case "A128KW":
    case "A192KW":
    case "A256KW":
      length = parseInt(alg.slice(1, 4), 10);
      algorithm = {
        name: "AES-KW",
        length
      };
      keyUsages = ["wrapKey", "unwrapKey"];
      break;
    case "A128GCMKW":
    case "A192GCMKW":
    case "A256GCMKW":
    case "A128GCM":
    case "A192GCM":
    case "A256GCM":
      length = parseInt(alg.slice(1, 4), 10);
      algorithm = {
        name: "AES-GCM",
        length
      };
      keyUsages = ["encrypt", "decrypt"];
      break;
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
  }
  return crypto.subtle.generateKey(algorithm, options?.extractable ?? false, keyUsages);
}
var __defProp2, __exportAll = (all, no_symbols) => {
  let target = {};
  for (var name in all)
    __defProp2(target, name, {
      get: all[name],
      enumerable: true
    });
  if (!no_symbols)
    __defProp2(target, Symbol.toStringTag, { value: "Module" });
  return target;
}, encoder, decoder, MAX_INT32, base64url_exports, unusable = (name, prop = "algorithm.name") => /* @__PURE__ */ new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`), isAlgorithm = (algorithm, name) => algorithm.name === name, invalidKeyInput = (actual, ...types) => message("Key must be ", actual, ...types), withAlg = (alg, actual, ...types) => message(`Key for the ${alg} algorithm must be `, actual, ...types), errors_exports, JOSEError, JWTClaimValidationFailed, JWTExpired, JOSEAlgNotAllowed, JOSENotSupported, JWEDecryptionFailed, JWEInvalid, JWSInvalid, JWTInvalid, JWKInvalid, JWKSInvalid, JWKSNoMatchingKey, JWKSMultipleMatchingKeys, JWKSTimeout, JWSSignatureVerificationFailed, isCryptoKey = (key) => {
  if (key?.[Symbol.toStringTag] === "CryptoKey")
    return true;
  try {
    return key instanceof CryptoKey;
  } catch {
    return false;
  }
}, isKeyObject = (key) => key?.[Symbol.toStringTag] === "KeyObject", isKeyLike = (key) => isCryptoKey(key) || isKeyObject(key), generateCek = (alg) => crypto.getRandomValues(new Uint8Array(cekLength(alg) >> 3)), generateIv = (alg) => crypto.getRandomValues(new Uint8Array(ivBitLength(alg) >> 3)), unsupportedEnc = "Unsupported JWE Content Encryption Algorithm", unprotected, isObjectLike = (value) => typeof value === "object" && value !== null, isJWK = (key) => isObject(key) && typeof key.kty === "string", isPrivateJWK = (key) => key.kty !== "oct" && (key.kty === "AKP" && typeof key.priv === "string" || typeof key.d === "string"), isPublicJWK = (key) => key.kty !== "oct" && key.d === undefined && key.priv === undefined, isSecretJWK = (key) => key.kty === "oct" && typeof key.k === "string", concatSalt = (alg, p2sInput) => concat(encode$1(alg), Uint8Array.of(0), p2sInput), subtleAlgorithm = (alg) => {
  switch (alg) {
    case "RSA-OAEP":
    case "RSA-OAEP-256":
    case "RSA-OAEP-384":
    case "RSA-OAEP-512":
      return "RSA-OAEP";
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}, unsupportedAlg = 'Invalid or unsupported JWK "alg" (Algorithm) Parameter value', unusableForAlg = "given KeyObject instance cannot be used for this algorithm", cache, handleJWK = async (key, jwk, alg, freeze = false) => {
  cache ||= /* @__PURE__ */ new WeakMap;
  let cached = cache.get(key);
  if (cached?.[alg])
    return cached[alg];
  const cryptoKey = await jwkToKey({
    ...jwk,
    alg
  });
  if (freeze)
    Object.freeze(key);
  if (!cached)
    cache.set(key, { [alg]: cryptoKey });
  else
    cached[alg] = cryptoKey;
  return cryptoKey;
}, handleKeyObject = (keyObject, alg) => {
  cache ||= /* @__PURE__ */ new WeakMap;
  let cached = cache.get(keyObject);
  if (cached?.[alg])
    return cached[alg];
  const isPublic = keyObject.type === "public";
  const extractable = isPublic ? true : false;
  let cryptoKey;
  if (keyObject.asymmetricKeyType === "x25519") {
    switch (alg) {
      case "ECDH-ES":
      case "ECDH-ES+A128KW":
      case "ECDH-ES+A192KW":
      case "ECDH-ES+A256KW":
        break;
      default:
        throw new TypeError(unusableForAlg);
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, isPublic ? [] : ["deriveBits"]);
  }
  if (keyObject.asymmetricKeyType === "ed25519") {
    if (alg !== "EdDSA" && alg !== "Ed25519")
      throw new TypeError(unusableForAlg);
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [isPublic ? "verify" : "sign"]);
  }
  switch (keyObject.asymmetricKeyType) {
    case "ml-dsa-44":
    case "ml-dsa-65":
    case "ml-dsa-87":
      if (alg !== keyObject.asymmetricKeyType.toUpperCase())
        throw new TypeError(unusableForAlg);
      cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [isPublic ? "verify" : "sign"]);
  }
  if (keyObject.asymmetricKeyType === "rsa") {
    let hash;
    switch (alg) {
      case "RSA-OAEP":
        hash = "SHA-1";
        break;
      case "RS256":
      case "PS256":
      case "RSA-OAEP-256":
        hash = "SHA-256";
        break;
      case "RS384":
      case "PS384":
      case "RSA-OAEP-384":
        hash = "SHA-384";
        break;
      case "RS512":
      case "PS512":
      case "RSA-OAEP-512":
        hash = "SHA-512";
        break;
      default:
        throw new TypeError(unusableForAlg);
    }
    if (alg.startsWith("RSA-OAEP"))
      return keyObject.toCryptoKey({
        name: "RSA-OAEP",
        hash
      }, extractable, isPublic ? ["encrypt"] : ["decrypt"]);
    cryptoKey = keyObject.toCryptoKey({
      name: alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5",
      hash
    }, extractable, [isPublic ? "verify" : "sign"]);
  }
  if (keyObject.asymmetricKeyType === "ec") {
    const namedCurve = new Map([
      ["prime256v1", "P-256"],
      ["secp384r1", "P-384"],
      ["secp521r1", "P-521"]
    ]).get(keyObject.asymmetricKeyDetails?.namedCurve);
    if (!namedCurve)
      throw new TypeError(unusableForAlg);
    const expectedCurve = {
      ES256: "P-256",
      ES384: "P-384",
      ES512: "P-521"
    };
    if (expectedCurve[alg] && namedCurve === expectedCurve[alg])
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    if (alg.startsWith("ECDH-ES"))
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDH",
        namedCurve
      }, extractable, isPublic ? [] : ["deriveBits"]);
  }
  if (!cryptoKey)
    throw new TypeError(unusableForAlg);
  if (!cached)
    cache.set(keyObject, { [alg]: cryptoKey });
  else
    cached[alg] = cryptoKey;
  return cryptoKey;
}, formatPEM = (b64, descriptor) => {
  return `-----BEGIN ${descriptor}-----
${(b64.match(/.{1,64}/g) || []).join(`
`)}
-----END ${descriptor}-----`;
}, genericExport = async (keyType, keyFormat, key) => {
  if (isKeyObject(key)) {
    if (key.type !== keyType)
      throw new TypeError(`key is not a ${keyType} key`);
    return key.export({
      format: "pem",
      type: keyFormat
    });
  }
  if (!isCryptoKey(key))
    throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject"));
  if (!key.extractable)
    throw new TypeError("CryptoKey is not extractable");
  if (key.type !== keyType)
    throw new TypeError(`key is not a ${keyType} key`);
  return formatPEM(encodeBase64(new Uint8Array(await crypto.subtle.exportKey(keyFormat, key))), `${keyType.toUpperCase()} KEY`);
}, toSPKI = (key) => genericExport("public", "spki", key), toPKCS8 = (key) => genericExport("private", "pkcs8", key), bytesEqual = (a, b) => {
  if (a.byteLength !== b.length)
    return false;
  for (let i = 0;i < a.byteLength; i++)
    if (a[i] !== b[i])
      return false;
  return true;
}, createASN1State = (data) => ({
  data,
  pos: 0
}), parseLength = (state) => {
  const first = state.data[state.pos++];
  if (first & 128) {
    const lengthOfLen = first & 127;
    let length = 0;
    for (let i = 0;i < lengthOfLen; i++)
      length = length << 8 | state.data[state.pos++];
    return length;
  }
  return first;
}, skipElement = (state, count = 1) => {
  if (count <= 0)
    return;
  state.pos++;
  const length = parseLength(state);
  state.pos += length;
  if (count > 1)
    skipElement(state, count - 1);
}, expectTag = (state, expectedTag, errorMessage) => {
  if (state.data[state.pos++] !== expectedTag)
    throw new Error(errorMessage);
}, getSubarray = (state, length) => {
  const result = state.data.subarray(state.pos, state.pos + length);
  state.pos += length;
  return result;
}, parseAlgorithmOID = (state) => {
  expectTag(state, 6, "Expected algorithm OID");
  return getSubarray(state, parseLength(state));
}, parseECAlgorithmIdentifier = (state) => {
  const algOid = parseAlgorithmOID(state);
  if (bytesEqual(algOid, [
    43,
    101,
    110
  ]))
    return "X25519";
  if (!bytesEqual(algOid, [
    42,
    134,
    72,
    206,
    61,
    2,
    1
  ]))
    throw new Error("Unsupported key algorithm");
  expectTag(state, 6, "Expected curve OID");
  const curveOid = getSubarray(state, parseLength(state));
  for (const { name, oid } of [
    {
      name: "P-256",
      oid: [
        42,
        134,
        72,
        206,
        61,
        3,
        1,
        7
      ]
    },
    {
      name: "P-384",
      oid: [
        43,
        129,
        4,
        0,
        34
      ]
    },
    {
      name: "P-521",
      oid: [
        43,
        129,
        4,
        0,
        35
      ]
    }
  ])
    if (bytesEqual(curveOid, oid))
      return name;
  throw new Error("Unsupported named curve");
}, genericImport = async (keyFormat, keyData, alg, options) => {
  let algorithm;
  let keyUsages;
  const isPublic = keyFormat === "spki";
  const getSigUsages = () => isPublic ? ["verify"] : ["sign"];
  const getEncUsages = () => isPublic ? ["encrypt", "wrapKey"] : ["decrypt", "unwrapKey"];
  switch (alg) {
    case "PS256":
    case "PS384":
    case "PS512":
      algorithm = {
        name: "RSA-PSS",
        hash: `SHA-${alg.slice(-3)}`
      };
      keyUsages = getSigUsages();
      break;
    case "RS256":
    case "RS384":
    case "RS512":
      algorithm = {
        name: "RSASSA-PKCS1-v1_5",
        hash: `SHA-${alg.slice(-3)}`
      };
      keyUsages = getSigUsages();
      break;
    case "RSA-OAEP":
    case "RSA-OAEP-256":
    case "RSA-OAEP-384":
    case "RSA-OAEP-512":
      algorithm = {
        name: "RSA-OAEP",
        hash: `SHA-${parseInt(alg.slice(-3), 10) || 1}`
      };
      keyUsages = getEncUsages();
      break;
    case "ES256":
    case "ES384":
    case "ES512":
      algorithm = {
        name: "ECDSA",
        namedCurve: {
          ES256: "P-256",
          ES384: "P-384",
          ES512: "P-521"
        }[alg]
      };
      keyUsages = getSigUsages();
      break;
    case "ECDH-ES":
    case "ECDH-ES+A128KW":
    case "ECDH-ES+A192KW":
    case "ECDH-ES+A256KW":
      try {
        const namedCurve = options.getNamedCurve(keyData);
        algorithm = namedCurve === "X25519" ? { name: "X25519" } : {
          name: "ECDH",
          namedCurve
        };
      } catch (cause) {
        throw new JOSENotSupported("Invalid or unsupported key format");
      }
      keyUsages = isPublic ? [] : ["deriveBits"];
      break;
    case "Ed25519":
    case "EdDSA":
      algorithm = { name: "Ed25519" };
      keyUsages = getSigUsages();
      break;
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      algorithm = { name: alg };
      keyUsages = getSigUsages();
      break;
    default:
      throw new JOSENotSupported('Invalid or unsupported "alg" (Algorithm) value');
  }
  return crypto.subtle.importKey(keyFormat, keyData, algorithm, options?.extractable ?? (isPublic ? true : false), keyUsages);
}, processPEMData = (pem, pattern) => {
  return decodeBase64(pem.replace(pattern, ""));
}, fromPKCS8 = (pem, alg, options) => {
  const keyData = processPEMData(pem, /(?:-----(?:BEGIN|END) PRIVATE KEY-----|\s)/g);
  let opts = options;
  if (alg?.startsWith?.("ECDH-ES")) {
    opts ||= {};
    opts.getNamedCurve = (keyData2) => {
      const state = createASN1State(keyData2);
      parsePKCS8Header(state);
      return parseECAlgorithmIdentifier(state);
    };
  }
  return genericImport("pkcs8", keyData, alg, opts);
}, fromSPKI = (pem, alg, options) => {
  const keyData = processPEMData(pem, /(?:-----(?:BEGIN|END) PUBLIC KEY-----|\s)/g);
  let opts = options;
  if (alg?.startsWith?.("ECDH-ES")) {
    opts ||= {};
    opts.getNamedCurve = (keyData2) => {
      const state = createASN1State(keyData2);
      parseSPKIHeader(state);
      return parseECAlgorithmIdentifier(state);
    };
  }
  return genericImport("spki", keyData, alg, opts);
}, fromX509 = (pem, alg, options) => {
  let spki;
  try {
    spki = extractX509SPKI(pem);
  } catch (cause) {
    throw new TypeError("Failed to parse the X.509 certificate", { cause });
  }
  return fromSPKI(formatPEM(encodeBase64(spki), "PUBLIC KEY"), alg, options);
}, unsupportedAlgHeader = 'Invalid or unsupported "alg" (JWE Algorithm) header value', tag = (key) => key?.[Symbol.toStringTag], jwkMatchesOp = (alg, key, usage) => {
  if (key.use !== undefined) {
    let expected;
    switch (usage) {
      case "sign":
      case "verify":
        expected = "sig";
        break;
      case "encrypt":
      case "decrypt":
        expected = "enc";
        break;
    }
    if (key.use !== expected)
      throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
  }
  if (key.alg !== undefined && key.alg !== alg)
    throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
  if (Array.isArray(key.key_ops)) {
    let expectedKeyOp;
    switch (true) {
      case (usage === "sign" || usage === "verify"):
      case alg === "dir":
      case alg.includes("CBC-HS"):
        expectedKeyOp = usage;
        break;
      case alg.startsWith("PBES2"):
        expectedKeyOp = "deriveBits";
        break;
      case /^A\d{3}(?:GCM)?(?:KW)?$/.test(alg):
        if (!alg.includes("GCM") && alg.endsWith("KW"))
          expectedKeyOp = usage === "encrypt" ? "wrapKey" : "unwrapKey";
        else
          expectedKeyOp = usage;
        break;
      case (usage === "encrypt" && alg.startsWith("RSA")):
        expectedKeyOp = "wrapKey";
        break;
      case usage === "decrypt":
        expectedKeyOp = alg.startsWith("RSA") ? "unwrapKey" : "deriveBits";
        break;
    }
    if (expectedKeyOp && key.key_ops?.includes?.(expectedKeyOp) === false)
      throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
  }
  return true;
}, symmetricTypeCheck = (alg, key, usage) => {
  if (key instanceof Uint8Array)
    return;
  if (isJWK(key)) {
    if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
      return;
    throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
  }
  if (!isKeyLike(key))
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key", "Uint8Array"));
  if (key.type !== "secret")
    throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
}, asymmetricTypeCheck = (alg, key, usage) => {
  if (isJWK(key))
    switch (usage) {
      case "decrypt":
      case "sign":
        if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a private JWK`);
      case "encrypt":
      case "verify":
        if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a public JWK`);
    }
  if (!isKeyLike(key))
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key"));
  if (key.type === "secret")
    throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
  if (key.type === "public")
    switch (usage) {
      case "sign":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
      case "decrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
    }
  if (key.type === "private")
    switch (usage) {
      case "verify":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
      case "encrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
    }
}, FlattenedEncrypt = class {
  #plaintext;
  #protectedHeader;
  #sharedUnprotectedHeader;
  #unprotectedHeader;
  #aad;
  #cek;
  #iv;
  #keyManagementParameters;
  constructor(plaintext) {
    if (!(plaintext instanceof Uint8Array))
      throw new TypeError("plaintext must be an instance of Uint8Array");
    this.#plaintext = plaintext;
  }
  setKeyManagementParameters(parameters) {
    assertNotSet(this.#keyManagementParameters, "setKeyManagementParameters");
    this.#keyManagementParameters = parameters;
    return this;
  }
  setProtectedHeader(protectedHeader) {
    assertNotSet(this.#protectedHeader, "setProtectedHeader");
    this.#protectedHeader = protectedHeader;
    return this;
  }
  setSharedUnprotectedHeader(sharedUnprotectedHeader) {
    assertNotSet(this.#sharedUnprotectedHeader, "setSharedUnprotectedHeader");
    this.#sharedUnprotectedHeader = sharedUnprotectedHeader;
    return this;
  }
  setUnprotectedHeader(unprotectedHeader) {
    assertNotSet(this.#unprotectedHeader, "setUnprotectedHeader");
    this.#unprotectedHeader = unprotectedHeader;
    return this;
  }
  setAdditionalAuthenticatedData(aad) {
    this.#aad = aad;
    return this;
  }
  setContentEncryptionKey(cek) {
    assertNotSet(this.#cek, "setContentEncryptionKey");
    this.#cek = cek;
    return this;
  }
  setInitializationVector(iv) {
    assertNotSet(this.#iv, "setInitializationVector");
    this.#iv = iv;
    return this;
  }
  async encrypt(key, options) {
    if (!this.#protectedHeader && !this.#unprotectedHeader && !this.#sharedUnprotectedHeader)
      throw new JWEInvalid("either setProtectedHeader, setUnprotectedHeader, or sharedUnprotectedHeader must be called before #encrypt()");
    if (!isDisjoint(this.#protectedHeader, this.#unprotectedHeader, this.#sharedUnprotectedHeader))
      throw new JWEInvalid("JWE Protected, JWE Shared Unprotected and JWE Per-Recipient Header Parameter names must be disjoint");
    const joseHeader = {
      ...this.#protectedHeader,
      ...this.#unprotectedHeader,
      ...this.#sharedUnprotectedHeader
    };
    validateCrit(JWEInvalid, /* @__PURE__ */ new Map, options?.crit, this.#protectedHeader, joseHeader);
    if (joseHeader.zip !== undefined && joseHeader.zip !== "DEF")
      throw new JOSENotSupported('Unsupported JWE "zip" (Compression Algorithm) Header Parameter value.');
    if (joseHeader.zip !== undefined && !this.#protectedHeader?.zip)
      throw new JWEInvalid('JWE "zip" (Compression Algorithm) Header Parameter MUST be in a protected header.');
    const { alg, enc } = joseHeader;
    if (typeof alg !== "string" || !alg)
      throw new JWEInvalid('JWE "alg" (Algorithm) Header Parameter missing or invalid');
    if (typeof enc !== "string" || !enc)
      throw new JWEInvalid('JWE "enc" (Encryption Algorithm) Header Parameter missing or invalid');
    let encryptedKey;
    if (this.#cek && (alg === "dir" || alg === "ECDH-ES"))
      throw new TypeError(`setContentEncryptionKey cannot be called with JWE "alg" (Algorithm) Header ${alg}`);
    checkKeyType(alg === "dir" ? enc : alg, key, "encrypt");
    let cek;
    {
      let parameters;
      const k = await normalizeKey(key, alg);
      ({ cek, encryptedKey, parameters } = await encryptKeyManagement(alg, enc, k, this.#cek, this.#keyManagementParameters));
      if (parameters)
        if (options && unprotected in options)
          if (!this.#unprotectedHeader)
            this.setUnprotectedHeader(parameters);
          else
            this.#unprotectedHeader = {
              ...this.#unprotectedHeader,
              ...parameters
            };
        else if (!this.#protectedHeader)
          this.setProtectedHeader(parameters);
        else
          this.#protectedHeader = {
            ...this.#protectedHeader,
            ...parameters
          };
    }
    let additionalData;
    let protectedHeaderS;
    let protectedHeaderB;
    let aadMember;
    if (this.#protectedHeader) {
      protectedHeaderS = encode(JSON.stringify(this.#protectedHeader));
      protectedHeaderB = encode$1(protectedHeaderS);
    } else {
      protectedHeaderS = "";
      protectedHeaderB = new Uint8Array;
    }
    if (this.#aad) {
      aadMember = encode(this.#aad);
      const aadMemberBytes = encode$1(aadMember);
      additionalData = concat(protectedHeaderB, encode$1("."), aadMemberBytes);
    } else
      additionalData = protectedHeaderB;
    let plaintext = this.#plaintext;
    if (joseHeader.zip === "DEF")
      plaintext = await compress(plaintext).catch((cause) => {
        throw new JWEInvalid("Failed to compress plaintext", { cause });
      });
    const { ciphertext, tag: tag2, iv } = await encrypt$1(enc, plaintext, cek, this.#iv, additionalData);
    const jwe = { ciphertext: encode(ciphertext) };
    if (iv)
      jwe.iv = encode(iv);
    if (tag2)
      jwe.tag = encode(tag2);
    if (encryptedKey)
      jwe.encrypted_key = encode(encryptedKey);
    if (aadMember)
      jwe.aad = aadMember;
    if (this.#protectedHeader)
      jwe.protected = protectedHeaderS;
    if (this.#sharedUnprotectedHeader)
      jwe.unprotected = this.#sharedUnprotectedHeader;
    if (this.#unprotectedHeader)
      jwe.header = this.#unprotectedHeader;
    return jwe;
  }
}, IndividualRecipient = class {
  #parent;
  unprotectedHeader;
  keyManagementParameters;
  key;
  options;
  constructor(enc, key, options) {
    this.#parent = enc;
    this.key = key;
    this.options = options;
  }
  setUnprotectedHeader(unprotectedHeader) {
    assertNotSet(this.unprotectedHeader, "setUnprotectedHeader");
    this.unprotectedHeader = unprotectedHeader;
    return this;
  }
  setKeyManagementParameters(parameters) {
    assertNotSet(this.keyManagementParameters, "setKeyManagementParameters");
    this.keyManagementParameters = parameters;
    return this;
  }
  addRecipient(...args) {
    return this.#parent.addRecipient(...args);
  }
  encrypt(...args) {
    return this.#parent.encrypt(...args);
  }
  done() {
    return this.#parent;
  }
}, GeneralEncrypt = class {
  #plaintext;
  #recipients = [];
  #protectedHeader;
  #unprotectedHeader;
  #aad;
  constructor(plaintext) {
    this.#plaintext = plaintext;
  }
  addRecipient(key, options) {
    const recipient = new IndividualRecipient(this, key, { crit: options?.crit });
    this.#recipients.push(recipient);
    return recipient;
  }
  setProtectedHeader(protectedHeader) {
    assertNotSet(this.#protectedHeader, "setProtectedHeader");
    this.#protectedHeader = protectedHeader;
    return this;
  }
  setSharedUnprotectedHeader(sharedUnprotectedHeader) {
    assertNotSet(this.#unprotectedHeader, "setSharedUnprotectedHeader");
    this.#unprotectedHeader = sharedUnprotectedHeader;
    return this;
  }
  setAdditionalAuthenticatedData(aad) {
    this.#aad = aad;
    return this;
  }
  async encrypt() {
    if (!this.#recipients.length)
      throw new JWEInvalid("at least one recipient must be added");
    if (this.#recipients.length === 1) {
      const [recipient] = this.#recipients;
      const flattened = await new FlattenedEncrypt(this.#plaintext).setAdditionalAuthenticatedData(this.#aad).setProtectedHeader(this.#protectedHeader).setSharedUnprotectedHeader(this.#unprotectedHeader).setUnprotectedHeader(recipient.unprotectedHeader).encrypt(recipient.key, { ...recipient.options });
      const jwe2 = {
        ciphertext: flattened.ciphertext,
        iv: flattened.iv,
        recipients: [{}],
        tag: flattened.tag
      };
      if (flattened.aad)
        jwe2.aad = flattened.aad;
      if (flattened.protected)
        jwe2.protected = flattened.protected;
      if (flattened.unprotected)
        jwe2.unprotected = flattened.unprotected;
      if (flattened.encrypted_key)
        jwe2.recipients[0].encrypted_key = flattened.encrypted_key;
      if (flattened.header)
        jwe2.recipients[0].header = flattened.header;
      return jwe2;
    }
    let enc;
    for (let i = 0;i < this.#recipients.length; i++) {
      const recipient = this.#recipients[i];
      if (!isDisjoint(this.#protectedHeader, this.#unprotectedHeader, recipient.unprotectedHeader))
        throw new JWEInvalid("JWE Protected, JWE Shared Unprotected and JWE Per-Recipient Header Parameter names must be disjoint");
      const joseHeader = {
        ...this.#protectedHeader,
        ...this.#unprotectedHeader,
        ...recipient.unprotectedHeader
      };
      const { alg } = joseHeader;
      if (typeof alg !== "string" || !alg)
        throw new JWEInvalid('JWE "alg" (Algorithm) Header Parameter missing or invalid');
      if (alg === "dir" || alg === "ECDH-ES")
        throw new JWEInvalid('"dir" and "ECDH-ES" alg may only be used with a single recipient');
      if (typeof joseHeader.enc !== "string" || !joseHeader.enc)
        throw new JWEInvalid('JWE "enc" (Encryption Algorithm) Header Parameter missing or invalid');
      if (!enc)
        enc = joseHeader.enc;
      else if (enc !== joseHeader.enc)
        throw new JWEInvalid('JWE "enc" (Encryption Algorithm) Header Parameter must be the same for all recipients');
      validateCrit(JWEInvalid, /* @__PURE__ */ new Map, recipient.options.crit, this.#protectedHeader, joseHeader);
      if (joseHeader.zip !== undefined && joseHeader.zip !== "DEF")
        throw new JOSENotSupported('Unsupported JWE "zip" (Compression Algorithm) Header Parameter value.');
      if (joseHeader.zip !== undefined && !this.#protectedHeader?.zip)
        throw new JWEInvalid('JWE "zip" (Compression Algorithm) Header Parameter MUST be in a protected header.');
    }
    const cek = generateCek(enc);
    const jwe = {
      ciphertext: "",
      recipients: []
    };
    for (let i = 0;i < this.#recipients.length; i++) {
      const recipient = this.#recipients[i];
      const target = {};
      jwe.recipients.push(target);
      if (i === 0) {
        const flattened = await new FlattenedEncrypt(this.#plaintext).setAdditionalAuthenticatedData(this.#aad).setContentEncryptionKey(cek).setProtectedHeader(this.#protectedHeader).setSharedUnprotectedHeader(this.#unprotectedHeader).setUnprotectedHeader(recipient.unprotectedHeader).setKeyManagementParameters(recipient.keyManagementParameters).encrypt(recipient.key, {
          ...recipient.options,
          [unprotected]: true
        });
        jwe.ciphertext = flattened.ciphertext;
        jwe.iv = flattened.iv;
        jwe.tag = flattened.tag;
        if (flattened.aad)
          jwe.aad = flattened.aad;
        if (flattened.protected)
          jwe.protected = flattened.protected;
        if (flattened.unprotected)
          jwe.unprotected = flattened.unprotected;
        target.encrypted_key = flattened.encrypted_key;
        if (flattened.header)
          target.header = flattened.header;
        continue;
      }
      const alg = recipient.unprotectedHeader?.alg || this.#protectedHeader?.alg || this.#unprotectedHeader?.alg;
      checkKeyType(alg === "dir" ? enc : alg, recipient.key, "encrypt");
      const k = await normalizeKey(recipient.key, alg);
      const { encryptedKey, parameters } = await encryptKeyManagement(alg, enc, k, cek, recipient.keyManagementParameters);
      target.encrypted_key = encode(encryptedKey);
      if (recipient.unprotectedHeader || parameters)
        target.header = {
          ...recipient.unprotectedHeader,
          ...parameters
        };
    }
    return jwe;
  }
}, epoch = (date) => Math.floor(date.getTime() / 1000), minute = 60, hour, day, week, year, REGEX, normalizeTyp = (value) => {
  if (value.includes("/"))
    return value.toLowerCase();
  return `application/${value.toLowerCase()}`;
}, checkAudiencePresence = (audPayload, audOption) => {
  if (typeof audPayload === "string")
    return audOption.includes(audPayload);
  if (Array.isArray(audPayload))
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
  return false;
}, JWTClaimsBuilder = class {
  #payload;
  constructor(payload) {
    if (!isObject(payload))
      throw new TypeError("JWT Claims Set MUST be an object");
    this.#payload = structuredClone(payload);
  }
  data() {
    return encoder.encode(JSON.stringify(this.#payload));
  }
  get iss() {
    return this.#payload.iss;
  }
  set iss(value) {
    this.#payload.iss = value;
  }
  get sub() {
    return this.#payload.sub;
  }
  set sub(value) {
    this.#payload.sub = value;
  }
  get aud() {
    return this.#payload.aud;
  }
  set aud(value) {
    this.#payload.aud = value;
  }
  set jti(value) {
    this.#payload.jti = value;
  }
  set nbf(value) {
    if (typeof value === "number")
      this.#payload.nbf = validateInput("setNotBefore", value);
    else if (value instanceof Date)
      this.#payload.nbf = validateInput("setNotBefore", epoch(value));
    else
      this.#payload.nbf = epoch(/* @__PURE__ */ new Date) + secs(value);
  }
  set exp(value) {
    if (typeof value === "number")
      this.#payload.exp = validateInput("setExpirationTime", value);
    else if (value instanceof Date)
      this.#payload.exp = validateInput("setExpirationTime", epoch(value));
    else
      this.#payload.exp = epoch(/* @__PURE__ */ new Date) + secs(value);
  }
  set iat(value) {
    if (value === undefined)
      this.#payload.iat = epoch(/* @__PURE__ */ new Date);
    else if (value instanceof Date)
      this.#payload.iat = validateInput("setIssuedAt", epoch(value));
    else if (typeof value === "string")
      this.#payload.iat = validateInput("setIssuedAt", epoch(/* @__PURE__ */ new Date) + secs(value));
    else
      this.#payload.iat = validateInput("setIssuedAt", value);
  }
}, CompactEncrypt = class {
  #flattened;
  constructor(plaintext) {
    this.#flattened = new FlattenedEncrypt(plaintext);
  }
  setContentEncryptionKey(cek) {
    this.#flattened.setContentEncryptionKey(cek);
    return this;
  }
  setInitializationVector(iv) {
    this.#flattened.setInitializationVector(iv);
    return this;
  }
  setProtectedHeader(protectedHeader) {
    this.#flattened.setProtectedHeader(protectedHeader);
    return this;
  }
  setKeyManagementParameters(parameters) {
    this.#flattened.setKeyManagementParameters(parameters);
    return this;
  }
  async encrypt(key, options) {
    const jwe = await this.#flattened.encrypt(key, options);
    return [
      jwe.protected,
      jwe.encrypted_key,
      jwe.iv,
      jwe.ciphertext,
      jwe.tag
    ].join(".");
  }
}, FlattenedSign = class {
  #payload;
  #protectedHeader;
  #unprotectedHeader;
  constructor(payload) {
    if (!(payload instanceof Uint8Array))
      throw new TypeError("payload must be an instance of Uint8Array");
    this.#payload = payload;
  }
  setProtectedHeader(protectedHeader) {
    assertNotSet(this.#protectedHeader, "setProtectedHeader");
    this.#protectedHeader = protectedHeader;
    return this;
  }
  setUnprotectedHeader(unprotectedHeader) {
    assertNotSet(this.#unprotectedHeader, "setUnprotectedHeader");
    this.#unprotectedHeader = unprotectedHeader;
    return this;
  }
  async sign(key, options) {
    if (!this.#protectedHeader && !this.#unprotectedHeader)
      throw new JWSInvalid("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
    if (!isDisjoint(this.#protectedHeader, this.#unprotectedHeader))
      throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
    const joseHeader = {
      ...this.#protectedHeader,
      ...this.#unprotectedHeader
    };
    const extensions = validateCrit(JWSInvalid, new Map([["b64", true]]), options?.crit, this.#protectedHeader, joseHeader);
    let b64 = true;
    if (extensions.has("b64")) {
      b64 = this.#protectedHeader.b64;
      if (typeof b64 !== "boolean")
        throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
    const { alg } = joseHeader;
    if (typeof alg !== "string" || !alg)
      throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
    checkKeyType(alg, key, "sign");
    let payloadS;
    let payloadB;
    if (b64) {
      payloadS = encode(this.#payload);
      payloadB = encode$1(payloadS);
    } else {
      payloadB = this.#payload;
      payloadS = "";
    }
    let protectedHeaderString;
    let protectedHeaderBytes;
    if (this.#protectedHeader) {
      protectedHeaderString = encode(JSON.stringify(this.#protectedHeader));
      protectedHeaderBytes = encode$1(protectedHeaderString);
    } else {
      protectedHeaderString = "";
      protectedHeaderBytes = new Uint8Array;
    }
    const data = concat(protectedHeaderBytes, encode$1("."), payloadB);
    const jws = {
      signature: encode(await sign(alg, await normalizeKey(key, alg), data)),
      payload: payloadS
    };
    if (this.#unprotectedHeader)
      jws.header = this.#unprotectedHeader;
    if (this.#protectedHeader)
      jws.protected = protectedHeaderString;
    return jws;
  }
}, CompactSign = class {
  #flattened;
  constructor(payload) {
    this.#flattened = new FlattenedSign(payload);
  }
  setProtectedHeader(protectedHeader) {
    this.#flattened.setProtectedHeader(protectedHeader);
    return this;
  }
  async sign(key, options) {
    const jws = await this.#flattened.sign(key, options);
    if (jws.payload === undefined)
      throw new TypeError("use the flattened module for creating JWS with b64: false");
    return `${jws.protected}.${jws.payload}.${jws.signature}`;
  }
}, IndividualSignature = class {
  #parent;
  protectedHeader;
  unprotectedHeader;
  options;
  key;
  constructor(sig, key, options) {
    this.#parent = sig;
    this.key = key;
    this.options = options;
  }
  setProtectedHeader(protectedHeader) {
    assertNotSet(this.protectedHeader, "setProtectedHeader");
    this.protectedHeader = protectedHeader;
    return this;
  }
  setUnprotectedHeader(unprotectedHeader) {
    assertNotSet(this.unprotectedHeader, "setUnprotectedHeader");
    this.unprotectedHeader = unprotectedHeader;
    return this;
  }
  addSignature(...args) {
    return this.#parent.addSignature(...args);
  }
  sign(...args) {
    return this.#parent.sign(...args);
  }
  done() {
    return this.#parent;
  }
}, GeneralSign = class {
  #payload;
  #signatures = [];
  constructor(payload) {
    this.#payload = payload;
  }
  addSignature(key, options) {
    const signature = new IndividualSignature(this, key, options);
    this.#signatures.push(signature);
    return signature;
  }
  async sign() {
    if (!this.#signatures.length)
      throw new JWSInvalid("at least one signature must be added");
    const jws = {
      signatures: [],
      payload: ""
    };
    for (let i = 0;i < this.#signatures.length; i++) {
      const signature = this.#signatures[i];
      const flattened = new FlattenedSign(this.#payload);
      flattened.setProtectedHeader(signature.protectedHeader);
      flattened.setUnprotectedHeader(signature.unprotectedHeader);
      const { payload, ...rest } = await flattened.sign(signature.key, signature.options);
      if (i === 0)
        jws.payload = payload;
      else if (jws.payload !== payload)
        throw new JWSInvalid("inconsistent use of JWS Unencoded Payload (RFC7797)");
      jws.signatures.push(rest);
    }
    return jws;
  }
}, SignJWT = class {
  #protectedHeader;
  #jwt;
  constructor(payload = {}) {
    this.#jwt = new JWTClaimsBuilder(payload);
  }
  setIssuer(issuer) {
    this.#jwt.iss = issuer;
    return this;
  }
  setSubject(subject) {
    this.#jwt.sub = subject;
    return this;
  }
  setAudience(audience) {
    this.#jwt.aud = audience;
    return this;
  }
  setJti(jwtId) {
    this.#jwt.jti = jwtId;
    return this;
  }
  setNotBefore(input) {
    this.#jwt.nbf = input;
    return this;
  }
  setExpirationTime(input) {
    this.#jwt.exp = input;
    return this;
  }
  setIssuedAt(input) {
    this.#jwt.iat = input;
    return this;
  }
  setProtectedHeader(protectedHeader) {
    this.#protectedHeader = protectedHeader;
    return this;
  }
  async sign(key, options) {
    const sig = new CompactSign(this.#jwt.data());
    sig.setProtectedHeader(this.#protectedHeader);
    if (Array.isArray(this.#protectedHeader?.crit) && this.#protectedHeader.crit.includes("b64") && this.#protectedHeader.b64 === false)
      throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
    return sig.sign(key, options);
  }
}, EncryptJWT = class {
  #cek;
  #iv;
  #keyManagementParameters;
  #protectedHeader;
  #replicateIssuerAsHeader;
  #replicateSubjectAsHeader;
  #replicateAudienceAsHeader;
  #jwt;
  constructor(payload = {}) {
    this.#jwt = new JWTClaimsBuilder(payload);
  }
  setIssuer(issuer) {
    this.#jwt.iss = issuer;
    return this;
  }
  setSubject(subject) {
    this.#jwt.sub = subject;
    return this;
  }
  setAudience(audience) {
    this.#jwt.aud = audience;
    return this;
  }
  setJti(jwtId) {
    this.#jwt.jti = jwtId;
    return this;
  }
  setNotBefore(input) {
    this.#jwt.nbf = input;
    return this;
  }
  setExpirationTime(input) {
    this.#jwt.exp = input;
    return this;
  }
  setIssuedAt(input) {
    this.#jwt.iat = input;
    return this;
  }
  setProtectedHeader(protectedHeader) {
    assertNotSet(this.#protectedHeader, "setProtectedHeader");
    this.#protectedHeader = protectedHeader;
    return this;
  }
  setKeyManagementParameters(parameters) {
    assertNotSet(this.#keyManagementParameters, "setKeyManagementParameters");
    this.#keyManagementParameters = parameters;
    return this;
  }
  setContentEncryptionKey(cek) {
    assertNotSet(this.#cek, "setContentEncryptionKey");
    this.#cek = cek;
    return this;
  }
  setInitializationVector(iv) {
    assertNotSet(this.#iv, "setInitializationVector");
    this.#iv = iv;
    return this;
  }
  replicateIssuerAsHeader() {
    this.#replicateIssuerAsHeader = true;
    return this;
  }
  replicateSubjectAsHeader() {
    this.#replicateSubjectAsHeader = true;
    return this;
  }
  replicateAudienceAsHeader() {
    this.#replicateAudienceAsHeader = true;
    return this;
  }
  async encrypt(key, options) {
    const enc = new CompactEncrypt(this.#jwt.data());
    if (this.#protectedHeader && (this.#replicateIssuerAsHeader || this.#replicateSubjectAsHeader || this.#replicateAudienceAsHeader))
      this.#protectedHeader = {
        ...this.#protectedHeader,
        iss: this.#replicateIssuerAsHeader ? this.#jwt.iss : undefined,
        sub: this.#replicateSubjectAsHeader ? this.#jwt.sub : undefined,
        aud: this.#replicateAudienceAsHeader ? this.#jwt.aud : undefined
      };
    enc.setProtectedHeader(this.#protectedHeader);
    if (this.#iv)
      enc.setInitializationVector(this.#iv);
    if (this.#cek)
      enc.setContentEncryptionKey(this.#cek);
    if (this.#keyManagementParameters)
      enc.setKeyManagementParameters(this.#keyManagementParameters);
    return enc.encrypt(key, options);
  }
}, check = (value, description) => {
  if (typeof value !== "string" || !value)
    throw new JWKInvalid(`${description} missing or invalid`);
}, LocalJWKSet = class {
  #jwks;
  #cached = /* @__PURE__ */ new WeakMap;
  constructor(jwks) {
    if (!isJWKSLike(jwks))
      throw new JWKSInvalid("JSON Web Key Set malformed");
    this.#jwks = structuredClone(jwks);
  }
  jwks() {
    return this.#jwks;
  }
  async getKey(protectedHeader, token) {
    const { alg, kid } = {
      ...protectedHeader,
      ...token?.header
    };
    const kty = getKtyFromAlg(alg);
    const candidates = this.#jwks.keys.filter((jwk2) => {
      let candidate = kty === jwk2.kty;
      if (candidate && typeof kid === "string")
        candidate = kid === jwk2.kid;
      if (candidate && (typeof jwk2.alg === "string" || kty === "AKP"))
        candidate = alg === jwk2.alg;
      if (candidate && typeof jwk2.use === "string")
        candidate = jwk2.use === "sig";
      if (candidate && Array.isArray(jwk2.key_ops))
        candidate = jwk2.key_ops.includes("verify");
      if (candidate)
        switch (alg) {
          case "ES256":
            candidate = jwk2.crv === "P-256";
            break;
          case "ES384":
            candidate = jwk2.crv === "P-384";
            break;
          case "ES512":
            candidate = jwk2.crv === "P-521";
            break;
          case "Ed25519":
          case "EdDSA":
            candidate = jwk2.crv === "Ed25519";
            break;
        }
      return candidate;
    });
    const { 0: jwk, length } = candidates;
    if (length === 0)
      throw new JWKSNoMatchingKey;
    if (length !== 1) {
      const error = new JWKSMultipleMatchingKeys;
      const _cached = this.#cached;
      error[Symbol.asyncIterator] = async function* () {
        for (const jwk2 of candidates)
          try {
            yield await importWithAlgCache(_cached, jwk2, alg);
          } catch {}
      };
      throw error;
    }
    return importWithAlgCache(this.#cached, jwk, alg);
  }
}, USER_AGENT, customFetch, jwksCache, RemoteJWKSet = class {
  #url;
  #timeoutDuration;
  #cooldownDuration;
  #cacheMaxAge;
  #jwksTimestamp;
  #pendingFetch;
  #headers;
  #customFetch;
  #local;
  #cache;
  constructor(url, options) {
    if (!(url instanceof URL))
      throw new TypeError("url must be an instance of URL");
    this.#url = new URL(url.href);
    this.#timeoutDuration = typeof options?.timeoutDuration === "number" ? options?.timeoutDuration : 5000;
    this.#cooldownDuration = typeof options?.cooldownDuration === "number" ? options?.cooldownDuration : 30000;
    this.#cacheMaxAge = typeof options?.cacheMaxAge === "number" ? options?.cacheMaxAge : 600000;
    this.#headers = new Headers(options?.headers);
    if (USER_AGENT && !this.#headers.has("User-Agent"))
      this.#headers.set("User-Agent", USER_AGENT);
    if (!this.#headers.has("accept")) {
      this.#headers.set("accept", "application/json");
      this.#headers.append("accept", "application/jwk-set+json");
    }
    this.#customFetch = options?.[customFetch];
    if (options?.[jwksCache] !== undefined) {
      this.#cache = options?.[jwksCache];
      if (isFreshJwksCache(options?.[jwksCache], this.#cacheMaxAge)) {
        this.#jwksTimestamp = this.#cache.uat;
        this.#local = createLocalJWKSet(this.#cache.jwks);
      }
    }
  }
  pendingFetch() {
    return !!this.#pendingFetch;
  }
  coolingDown() {
    return typeof this.#jwksTimestamp === "number" ? Date.now() < this.#jwksTimestamp + this.#cooldownDuration : false;
  }
  fresh() {
    return typeof this.#jwksTimestamp === "number" ? Date.now() < this.#jwksTimestamp + this.#cacheMaxAge : false;
  }
  jwks() {
    return this.#local?.jwks();
  }
  async getKey(protectedHeader, token) {
    if (!this.#local || !this.fresh())
      await this.reload();
    try {
      return await this.#local(protectedHeader, token);
    } catch (err) {
      if (err instanceof JWKSNoMatchingKey) {
        if (this.coolingDown() === false) {
          await this.reload();
          return this.#local(protectedHeader, token);
        }
      }
      throw err;
    }
  }
  async reload() {
    if (this.#pendingFetch && isCloudflareWorkers())
      this.#pendingFetch = undefined;
    this.#pendingFetch ||= fetchJwks(this.#url.href, this.#headers, AbortSignal.timeout(this.#timeoutDuration), this.#customFetch).then((json) => {
      this.#local = createLocalJWKSet(json);
      if (this.#cache) {
        this.#cache.uat = Date.now();
        this.#cache.jwks = json;
      }
      this.#jwksTimestamp = Date.now();
      this.#pendingFetch = undefined;
    }).catch((err) => {
      this.#pendingFetch = undefined;
      throw err;
    });
    await this.#pendingFetch;
  }
}, UnsecuredJWT = class {
  #jwt;
  constructor(payload = {}) {
    this.#jwt = new JWTClaimsBuilder(payload);
  }
  encode() {
    return `${encode(JSON.stringify({ alg: "none" }))}.${encode(this.#jwt.data())}.`;
  }
  setIssuer(issuer) {
    this.#jwt.iss = issuer;
    return this;
  }
  setSubject(subject) {
    this.#jwt.sub = subject;
    return this;
  }
  setAudience(audience) {
    this.#jwt.aud = audience;
    return this;
  }
  setJti(jwtId) {
    this.#jwt.jti = jwtId;
    return this;
  }
  setNotBefore(input) {
    this.#jwt.nbf = input;
    return this;
  }
  setExpirationTime(input) {
    this.#jwt.exp = input;
    return this;
  }
  setIssuedAt(input) {
    this.#jwt.iat = input;
    return this;
  }
  static decode(jwt, options) {
    if (typeof jwt !== "string")
      throw new JWTInvalid("Unsecured JWT must be a string");
    const { 0: encodedHeader, 1: encodedPayload, 2: signature, length } = jwt.split(".");
    if (length !== 3 || signature !== "")
      throw new JWTInvalid("Invalid Unsecured JWT");
    let header;
    try {
      header = JSON.parse(decoder.decode(decode(encodedHeader)));
      if (header.alg !== "none")
        throw new Error;
    } catch {
      throw new JWTInvalid("Invalid Unsecured JWT");
    }
    return {
      payload: validateClaimsSet(header, decode(encodedPayload), options),
      header
    };
  }
}, cryptoRuntime = "WebCryptoAPI";
var init_webapi_CxKOxXjo = __esm(() => {
  __defProp2 = Object.defineProperty;
  encoder = new TextEncoder;
  decoder = new TextDecoder;
  MAX_INT32 = 2 ** 32;
  base64url_exports = /* @__PURE__ */ __exportAll({
    decode: () => decode,
    encode: () => encode
  });
  errors_exports = /* @__PURE__ */ __exportAll({
    JOSEAlgNotAllowed: () => JOSEAlgNotAllowed,
    JOSEError: () => JOSEError,
    JOSENotSupported: () => JOSENotSupported,
    JWEDecryptionFailed: () => JWEDecryptionFailed,
    JWEInvalid: () => JWEInvalid,
    JWKInvalid: () => JWKInvalid,
    JWKSInvalid: () => JWKSInvalid,
    JWKSMultipleMatchingKeys: () => JWKSMultipleMatchingKeys,
    JWKSNoMatchingKey: () => JWKSNoMatchingKey,
    JWKSTimeout: () => JWKSTimeout,
    JWSInvalid: () => JWSInvalid,
    JWSSignatureVerificationFailed: () => JWSSignatureVerificationFailed,
    JWTClaimValidationFailed: () => JWTClaimValidationFailed,
    JWTExpired: () => JWTExpired,
    JWTInvalid: () => JWTInvalid
  });
  JOSEError = class extends Error {
    static code = "ERR_JOSE_GENERIC";
    code = "ERR_JOSE_GENERIC";
    constructor(message2, options) {
      super(message2, options);
      this.name = this.constructor.name;
      Error.captureStackTrace?.(this, this.constructor);
    }
  };
  JWTClaimValidationFailed = class extends JOSEError {
    static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
    code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
    claim;
    reason;
    payload;
    constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
      super(message2, { cause: {
        claim,
        reason,
        payload
      } });
      this.claim = claim;
      this.reason = reason;
      this.payload = payload;
    }
  };
  JWTExpired = class extends JOSEError {
    static code = "ERR_JWT_EXPIRED";
    code = "ERR_JWT_EXPIRED";
    claim;
    reason;
    payload;
    constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
      super(message2, { cause: {
        claim,
        reason,
        payload
      } });
      this.claim = claim;
      this.reason = reason;
      this.payload = payload;
    }
  };
  JOSEAlgNotAllowed = class extends JOSEError {
    static code = "ERR_JOSE_ALG_NOT_ALLOWED";
    code = "ERR_JOSE_ALG_NOT_ALLOWED";
  };
  JOSENotSupported = class extends JOSEError {
    static code = "ERR_JOSE_NOT_SUPPORTED";
    code = "ERR_JOSE_NOT_SUPPORTED";
  };
  JWEDecryptionFailed = class extends JOSEError {
    static code = "ERR_JWE_DECRYPTION_FAILED";
    code = "ERR_JWE_DECRYPTION_FAILED";
    constructor(message2 = "decryption operation failed", options) {
      super(message2, options);
    }
  };
  JWEInvalid = class extends JOSEError {
    static code = "ERR_JWE_INVALID";
    code = "ERR_JWE_INVALID";
  };
  JWSInvalid = class extends JOSEError {
    static code = "ERR_JWS_INVALID";
    code = "ERR_JWS_INVALID";
  };
  JWTInvalid = class extends JOSEError {
    static code = "ERR_JWT_INVALID";
    code = "ERR_JWT_INVALID";
  };
  JWKInvalid = class extends JOSEError {
    static code = "ERR_JWK_INVALID";
    code = "ERR_JWK_INVALID";
  };
  JWKSInvalid = class extends JOSEError {
    static code = "ERR_JWKS_INVALID";
    code = "ERR_JWKS_INVALID";
  };
  JWKSNoMatchingKey = class extends JOSEError {
    static code = "ERR_JWKS_NO_MATCHING_KEY";
    code = "ERR_JWKS_NO_MATCHING_KEY";
    constructor(message2 = "no applicable key found in the JSON Web Key Set", options) {
      super(message2, options);
    }
  };
  JWKSMultipleMatchingKeys = class extends JOSEError {
    [Symbol.asyncIterator];
    static code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
    code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
    constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options) {
      super(message2, options);
    }
  };
  JWKSTimeout = class extends JOSEError {
    static code = "ERR_JWKS_TIMEOUT";
    code = "ERR_JWKS_TIMEOUT";
    constructor(message2 = "request timed out", options) {
      super(message2, options);
    }
  };
  JWSSignatureVerificationFailed = class extends JOSEError {
    static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
    code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
    constructor(message2 = "signature verification failed", options) {
      super(message2, options);
    }
  };
  unprotected = Symbol();
  hour = minute * 60;
  day = hour * 24;
  week = day * 7;
  year = day * 365.25;
  REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
  if (typeof navigator === "undefined" || !navigator.userAgent?.startsWith?.("Mozilla/5.0 "))
    USER_AGENT = `jose/v6.2.2`;
  customFetch = Symbol();
  jwksCache = Symbol();
});

// index.ts
import os4 from "node:os";
import path5 from "node:path";
import { execFileSync as execFileSync3 } from "node:child_process";
import { chmodSync as chmodSync2, existsSync as existsSync3, mkdirSync as mkdirSync2, readFileSync as readFileSync3, rmSync as rmSync3, writeFileSync as writeFileSync4 } from "node:fs";
import { createHash } from "node:crypto";

// ../../node_modules/eventemitter3/index.mjs
var import__ = __toESM(require_eventemitter3(), 1);

// ../../node_modules/@workos-inc/node/lib/factory-HM2NchXm.mjs
var CryptoProvider = class {
  encoder = new TextEncoder;
};
var SubtleCryptoProvider = class extends CryptoProvider {
  subtleCrypto;
  constructor(subtleCrypto) {
    super();
    this.subtleCrypto = subtleCrypto || crypto.subtle;
  }
  computeHMACSignature(_payload, _secret) {
    throw new Error("SubleCryptoProvider cannot be used in a synchronous context.");
  }
  async computeHMACSignatureAsync(payload, secret) {
    const encoder2 = new TextEncoder;
    const key = await this.subtleCrypto.importKey("raw", encoder2.encode(secret), {
      name: "HMAC",
      hash: { name: "SHA-256" }
    }, false, ["sign"]);
    const signatureBuffer = await this.subtleCrypto.sign("hmac", key, encoder2.encode(payload));
    const signatureBytes = new Uint8Array(signatureBuffer);
    const signatureHexCodes = new Array(signatureBytes.length);
    for (let i = 0;i < signatureBytes.length; i++)
      signatureHexCodes[i] = byteHexMapping[signatureBytes[i]];
    return signatureHexCodes.join("");
  }
  async secureCompare(stringA, stringB) {
    const bufferA = this.encoder.encode(stringA);
    const bufferB = this.encoder.encode(stringB);
    if (bufferA.length !== bufferB.length)
      return false;
    const algorithm = {
      name: "HMAC",
      hash: "SHA-256"
    };
    const key = await crypto.subtle.generateKey(algorithm, false, ["sign", "verify"]);
    const hmac = await crypto.subtle.sign(algorithm, key, bufferA);
    return await crypto.subtle.verify(algorithm, key, hmac, bufferB);
  }
  async encrypt(plaintext, key, iv, aad) {
    const actualIv = iv || crypto.getRandomValues(new Uint8Array(32));
    const cryptoKey = await this.subtleCrypto.importKey("raw", key, { name: "AES-GCM" }, false, ["encrypt"]);
    const encryptParams = {
      name: "AES-GCM",
      iv: actualIv
    };
    if (aad)
      encryptParams.additionalData = aad;
    const encryptedData = await this.subtleCrypto.encrypt(encryptParams, cryptoKey, plaintext);
    const encryptedBytes = new Uint8Array(encryptedData);
    const tagStart = encryptedBytes.length - 16;
    const tag2 = encryptedBytes.slice(tagStart);
    return {
      ciphertext: encryptedBytes.slice(0, tagStart),
      iv: actualIv,
      tag: tag2
    };
  }
  async decrypt(ciphertext, key, iv, tag2, aad) {
    const combinedData = new Uint8Array(ciphertext.length + tag2.length);
    combinedData.set(ciphertext, 0);
    combinedData.set(tag2, ciphertext.length);
    const cryptoKey = await this.subtleCrypto.importKey("raw", key, { name: "AES-GCM" }, false, ["decrypt"]);
    const decryptParams = {
      name: "AES-GCM",
      iv
    };
    if (aad)
      decryptParams.additionalData = aad;
    const decryptedData = await this.subtleCrypto.decrypt(decryptParams, cryptoKey, combinedData);
    return new Uint8Array(decryptedData);
  }
  randomBytes(length) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  }
  randomUUID() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
      return crypto.randomUUID();
    const bytes = this.randomBytes(16);
    bytes[6] = bytes[6] & 15 | 64;
    bytes[8] = bytes[8] & 63 | 128;
    const hex = Array.from(bytes, (b) => byteHexMapping[b]).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
};
var byteHexMapping = new Array(256);
for (let i = 0;i < byteHexMapping.length; i++)
  byteHexMapping[i] = i.toString(16).padStart(2, "0");
var HttpClient = class HttpClient2 {
  MAX_RETRY_ATTEMPTS = 3;
  BACKOFF_MULTIPLIER = 1.5;
  MINIMUM_SLEEP_TIME_IN_MILLISECONDS = 500;
  RETRY_STATUS_CODES = [
    408,
    500,
    502,
    504
  ];
  constructor(baseURL, options) {
    this.baseURL = baseURL;
    this.options = options;
  }
  getClientName() {
    throw new Error("getClientName not implemented");
  }
  addClientToUserAgent(userAgent) {
    if (userAgent.indexOf(" ") > -1)
      return userAgent.replace(/\b\s/, `/${this.getClientName()} `);
    else
      return `${userAgent}/${this.getClientName()}`;
  }
  static getResourceURL(baseURL, path, params) {
    const queryString = HttpClient2.getQueryString(params);
    return new URL([path, queryString].filter(Boolean).join("?"), baseURL).toString();
  }
  static getQueryString(queryObj) {
    if (!queryObj)
      return;
    const sanitizedQueryObj = {};
    Object.entries(queryObj).forEach(([param, value]) => {
      if (value !== null && value !== undefined && value !== "")
        sanitizedQueryObj[param] = value;
    });
    return new URLSearchParams(sanitizedQueryObj).toString();
  }
  static getContentTypeHeader(entity) {
    if (entity instanceof URLSearchParams)
      return { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" };
  }
  static getBody(entity) {
    if (entity === null || entity instanceof URLSearchParams)
      return entity;
    return JSON.stringify(entity);
  }
  static isPathRetryable(path) {
    return path.startsWith("/fga/") || path.startsWith("/vault/") || path.startsWith("/audit_logs/events");
  }
  getSleepTimeInMilliseconds(retryAttempt) {
    return this.MINIMUM_SLEEP_TIME_IN_MILLISECONDS * Math.pow(this.BACKOFF_MULTIPLIER, retryAttempt) * (Math.random() + 0.5);
  }
  sleep = (retryAttempt) => new Promise((resolve) => setTimeout(resolve, this.getSleepTimeInMilliseconds(retryAttempt)));
};
var HttpClientResponse = class {
  _statusCode;
  _headers;
  constructor(statusCode, headers) {
    this._statusCode = statusCode;
    this._headers = headers;
  }
  getStatusCode() {
    return this._statusCode;
  }
  getHeaders() {
    return this._headers;
  }
};
var HttpClientError = class extends Error {
  name = "HttpClientError";
  message = "The request could not be completed.";
  response;
  constructor({ message: message2, response }) {
    super(message2);
    this.message = message2;
    this.response = response;
  }
};
var ParseError = class extends Error {
  name = "ParseError";
  status = 500;
  rawBody;
  rawStatus;
  requestID;
  constructor({ message: message2, rawBody, rawStatus, requestID }) {
    super(message2);
    this.rawBody = rawBody;
    this.rawStatus = rawStatus;
    this.requestID = requestID;
  }
};
var DEFAULT_FETCH_TIMEOUT = 60000;
var FetchHttpClient = class extends HttpClient {
  _fetchFn;
  constructor(baseURL, options, fetchFn) {
    super(baseURL, options);
    this.baseURL = baseURL;
    this.options = options;
    if (!fetchFn) {
      if (!globalThis.fetch)
        throw new Error("Fetch function not defined in the global scope and no replacement was provided.");
      fetchFn = globalThis.fetch;
    }
    this._fetchFn = fetchFn.bind(globalThis);
  }
  getClientName() {
    return "fetch";
  }
  async get(path, options) {
    const resourceURL = HttpClient.getResourceURL(this.baseURL, path, options.params);
    if (HttpClient.isPathRetryable(path))
      return await this.fetchRequestWithRetry(resourceURL, "GET", null, options.headers);
    else
      return await this.fetchRequest(resourceURL, "GET", null, options.headers);
  }
  async post(path, entity, options) {
    const resourceURL = HttpClient.getResourceURL(this.baseURL, path, options.params);
    if (HttpClient.isPathRetryable(path))
      return await this.fetchRequestWithRetry(resourceURL, "POST", HttpClient.getBody(entity), {
        ...HttpClient.getContentTypeHeader(entity),
        ...options.headers
      });
    else
      return await this.fetchRequest(resourceURL, "POST", HttpClient.getBody(entity), {
        ...HttpClient.getContentTypeHeader(entity),
        ...options.headers
      });
  }
  async put(path, entity, options) {
    const resourceURL = HttpClient.getResourceURL(this.baseURL, path, options.params);
    if (HttpClient.isPathRetryable(path))
      return await this.fetchRequestWithRetry(resourceURL, "PUT", HttpClient.getBody(entity), {
        ...HttpClient.getContentTypeHeader(entity),
        ...options.headers
      });
    else
      return await this.fetchRequest(resourceURL, "PUT", HttpClient.getBody(entity), {
        ...HttpClient.getContentTypeHeader(entity),
        ...options.headers
      });
  }
  async patch(path, entity, options) {
    const resourceURL = HttpClient.getResourceURL(this.baseURL, path, options.params);
    if (HttpClient.isPathRetryable(path))
      return await this.fetchRequestWithRetry(resourceURL, "PATCH", HttpClient.getBody(entity), {
        ...HttpClient.getContentTypeHeader(entity),
        ...options.headers
      });
    else
      return await this.fetchRequest(resourceURL, "PATCH", HttpClient.getBody(entity), {
        ...HttpClient.getContentTypeHeader(entity),
        ...options.headers
      });
  }
  async delete(path, options) {
    const resourceURL = HttpClient.getResourceURL(this.baseURL, path, options.params);
    if (HttpClient.isPathRetryable(path))
      return await this.fetchRequestWithRetry(resourceURL, "DELETE", null, options.headers);
    else
      return await this.fetchRequest(resourceURL, "DELETE", null, options.headers);
  }
  async deleteWithBody(path, entity, options) {
    const resourceURL = HttpClient.getResourceURL(this.baseURL, path, options.params);
    if (HttpClient.isPathRetryable(path))
      return await this.fetchRequestWithRetry(resourceURL, "DELETE", HttpClient.getBody(entity), {
        ...HttpClient.getContentTypeHeader(entity),
        ...options.headers
      });
    else
      return await this.fetchRequest(resourceURL, "DELETE", HttpClient.getBody(entity), {
        ...HttpClient.getContentTypeHeader(entity),
        ...options.headers
      });
  }
  async fetchRequest(url, method, body, headers) {
    const requestBody = body || (method === "POST" || method === "PUT" || method === "PATCH" ? "" : undefined);
    const { "User-Agent": userAgent } = this.options?.headers || {};
    const timeout = this.options?.timeout ?? DEFAULT_FETCH_TIMEOUT;
    const abortController = new AbortController;
    const timeoutId = setTimeout(() => {
      abortController?.abort();
    }, timeout);
    try {
      const res = await this._fetchFn(url, {
        method,
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
          ...this.options?.headers,
          ...headers,
          "User-Agent": this.addClientToUserAgent((userAgent || "workos-node").toString())
        },
        body: requestBody,
        signal: abortController?.signal
      });
      if (timeoutId)
        clearTimeout(timeoutId);
      if (!res.ok) {
        const requestID = res.headers.get("X-Request-ID") ?? "";
        const rawBody = await res.text();
        let responseJson;
        try {
          responseJson = JSON.parse(rawBody);
        } catch (error) {
          if (error instanceof SyntaxError)
            throw new ParseError({
              message: error.message,
              rawBody,
              requestID,
              rawStatus: res.status
            });
          throw error;
        }
        throw new HttpClientError({
          message: res.statusText,
          response: {
            status: res.status,
            headers: res.headers,
            data: responseJson
          }
        });
      }
      return new FetchHttpClientResponse(res);
    } catch (error) {
      if (timeoutId)
        clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError")
        throw new HttpClientError({
          message: `Request timeout after ${timeout}ms`,
          response: {
            status: 408,
            headers: {},
            data: { error: "Request timeout" }
          }
        });
      throw error;
    }
  }
  async fetchRequestWithRetry(url, method, body, headers) {
    let response;
    let retryAttempts = 1;
    const makeRequest = async () => {
      let requestError = null;
      try {
        response = await this.fetchRequest(url, method, body, headers);
      } catch (e) {
        requestError = e;
      }
      if (this.shouldRetryRequest(requestError, retryAttempts)) {
        retryAttempts++;
        await this.sleep(retryAttempts);
        return makeRequest();
      }
      if (requestError != null)
        throw requestError;
      return response;
    };
    return makeRequest();
  }
  shouldRetryRequest(requestError, retryAttempt) {
    if (retryAttempt > this.MAX_RETRY_ATTEMPTS)
      return false;
    if (requestError != null) {
      if (requestError instanceof TypeError)
        return true;
      if (requestError instanceof HttpClientError && this.RETRY_STATUS_CODES.includes(requestError.response.status))
        return true;
    }
    return false;
  }
};
var FetchHttpClientResponse = class FetchHttpClientResponse2 extends HttpClientResponse {
  _res;
  constructor(res) {
    super(res.status, FetchHttpClientResponse2._transformHeadersToObject(res.headers));
    this._res = res;
  }
  getRawResponse() {
    return this._res;
  }
  toJSON() {
    return this._res.headers.get("content-type")?.includes("application/json") ? this._res.json() : null;
  }
  static _transformHeadersToObject(headers) {
    const headersObj = {};
    for (const entry of Object.entries(headers)) {
      if (!Array.isArray(entry) || entry.length !== 2)
        throw new Error("Response objects produced by the fetch function given to FetchHttpClient do not have an iterable headers map. Response#headers should be an iterable object.");
      headersObj[entry[0]] = entry[1];
    }
    return headersObj;
  }
};
var ApiKeyRequiredException = class extends Error {
  status = 403;
  name = "ApiKeyRequiredException";
  path;
  constructor(path) {
    super(`API key required for "${path}". For server-side apps, initialize with: new WorkOS("sk_..."). For browser/mobile/CLI apps, use authenticateWithCodeAndVerifier() and authenticateWithRefreshToken() which work without an API key.`);
    this.path = path;
  }
};
var GenericServerException = class extends Error {
  name = "GenericServerException";
  message = "The request could not be completed.";
  constructor(status, message2, rawData, requestID) {
    super();
    this.status = status;
    this.rawData = rawData;
    this.requestID = requestID;
    if (message2)
      this.message = message2;
  }
};
var BadRequestException = class extends Error {
  status = 400;
  name = "BadRequestException";
  message = "Bad request";
  code;
  errors;
  requestID;
  constructor({ code, errors, message: message2, requestID }) {
    super();
    this.requestID = requestID;
    if (message2)
      this.message = message2;
    if (code)
      this.code = code;
    if (errors)
      this.errors = errors;
  }
};
var NotFoundException = class extends Error {
  status = 404;
  name = "NotFoundException";
  message;
  code;
  requestID;
  constructor({ code, message: message2, path, requestID }) {
    super();
    this.code = code;
    this.message = message2 ?? `The requested path '${path}' could not be found.`;
    this.requestID = requestID;
  }
};
var OauthException = class extends Error {
  name = "OauthException";
  constructor(status, requestID, error, errorDescription, rawData) {
    super();
    this.status = status;
    this.requestID = requestID;
    this.error = error;
    this.errorDescription = errorDescription;
    this.rawData = rawData;
    if (error && errorDescription)
      this.message = `Error: ${error}
Error Description: ${errorDescription}`;
    else if (error)
      this.message = `Error: ${error}`;
    else
      this.message = `An error has occurred.`;
  }
};
var RateLimitExceededException = class extends GenericServerException {
  name = "RateLimitExceededException";
  constructor(message2, requestID, retryAfter) {
    super(429, message2, {}, requestID);
    this.retryAfter = retryAfter;
  }
};
var SignatureVerificationException = class extends Error {
  name = "SignatureVerificationException";
  constructor(message2) {
    super(message2 || "Signature verification failed.");
  }
};
var UnauthorizedException = class extends Error {
  status = 401;
  name = "UnauthorizedException";
  message;
  constructor(requestID) {
    super();
    this.requestID = requestID;
    this.message = `Could not authorize the request. Maybe your API key is invalid?`;
  }
};
var UnprocessableEntityException = class extends Error {
  status = 422;
  name = "UnprocessableEntityException";
  message = "Unprocessable entity";
  code;
  requestID;
  constructor({ code, errors, message: message2, requestID }) {
    super();
    this.requestID = requestID;
    if (message2)
      this.message = message2;
    if (code)
      this.code = code;
    if (errors) {
      this.message = `The following ${errors.length === 1 ? "requirement" : "requirements"} must be met:
`;
      for (const { code: code2 } of errors)
        this.message = this.message.concat(`	${code2}
`);
    }
  }
};
var SignatureProvider = class {
  cryptoProvider;
  constructor(cryptoProvider) {
    this.cryptoProvider = cryptoProvider;
  }
  async verifyHeader({ payload, sigHeader, secret, tolerance = 180000 }) {
    const [timestamp, signatureHash] = this.getTimestampAndSignatureHash(sigHeader);
    if (!signatureHash || Object.keys(signatureHash).length === 0)
      throw new SignatureVerificationException("No signature hash found with expected scheme v1");
    if (parseInt(timestamp, 10) < Date.now() - tolerance)
      throw new SignatureVerificationException("Timestamp outside the tolerance zone");
    const expectedSig = await this.computeSignature(timestamp, payload, secret);
    if (await this.cryptoProvider.secureCompare(expectedSig, signatureHash) === false)
      throw new SignatureVerificationException("Signature hash does not match the expected signature hash for payload");
    return true;
  }
  getTimestampAndSignatureHash(sigHeader) {
    const [t, v1] = sigHeader.split(",");
    if (typeof t === "undefined" || typeof v1 === "undefined")
      throw new SignatureVerificationException("Signature or timestamp missing");
    const { 1: timestamp } = t.split("=");
    const { 1: signatureHash } = v1.split("=");
    return [timestamp, signatureHash];
  }
  async computeSignature(timestamp, payload, secret) {
    payload = JSON.stringify(payload);
    const signedPayload = `${timestamp}.${payload}`;
    return await this.cryptoProvider.computeHMACSignatureAsync(signedPayload, secret);
  }
};
var unreachable = (condition, message2 = `Entered unreachable code. Received '${condition}'.`) => {
  throw new TypeError(message2);
};
var deserializeOrganizationDomain = (organizationDomain) => ({
  object: organizationDomain.object,
  id: organizationDomain.id,
  domain: organizationDomain.domain,
  organizationId: organizationDomain.organization_id,
  state: organizationDomain.state,
  ...organizationDomain.verification_token !== undefined && { verificationToken: organizationDomain.verification_token },
  verificationStrategy: organizationDomain.verification_strategy,
  ...organizationDomain.verification_prefix !== undefined && { verificationPrefix: organizationDomain.verification_prefix },
  createdAt: organizationDomain.created_at,
  updatedAt: organizationDomain.updated_at
});
var deserializeOrganization = (organization) => ({
  object: organization.object,
  id: organization.id,
  name: organization.name,
  allowProfilesOutsideOrganization: organization.allow_profiles_outside_organization,
  domains: organization.domains.map(deserializeOrganizationDomain),
  ...typeof organization.stripe_customer_id === "undefined" ? undefined : { stripeCustomerId: organization.stripe_customer_id },
  createdAt: organization.created_at,
  updatedAt: organization.updated_at,
  externalId: organization.external_id ?? null,
  metadata: organization.metadata ?? {}
});
var serializeAuthenticateWithCodeOptions = (options) => ({
  grant_type: "authorization_code",
  client_id: options.clientId,
  client_secret: options.clientSecret,
  code: options.code,
  code_verifier: options.codeVerifier,
  invitation_token: options.invitationToken,
  ip_address: options.ipAddress,
  user_agent: options.userAgent
});
var serializeAuthenticateWithCodeAndVerifierOptions = (options) => ({
  grant_type: "authorization_code",
  client_id: options.clientId,
  code: options.code,
  code_verifier: options.codeVerifier,
  invitation_token: options.invitationToken,
  ip_address: options.ipAddress,
  user_agent: options.userAgent
});
var serializeAuthenticateWithMagicAuthOptions = (options) => ({
  grant_type: "urn:workos:oauth:grant-type:magic-auth:code",
  client_id: options.clientId,
  client_secret: options.clientSecret,
  code: options.code,
  email: options.email,
  invitation_token: options.invitationToken,
  link_authorization_code: options.linkAuthorizationCode,
  ip_address: options.ipAddress,
  user_agent: options.userAgent
});
var serializeAuthenticateWithPasswordOptions = (options) => ({
  grant_type: "password",
  client_id: options.clientId,
  client_secret: options.clientSecret,
  email: options.email,
  password: options.password,
  invitation_token: options.invitationToken,
  ip_address: options.ipAddress,
  user_agent: options.userAgent
});
var serializeAuthenticateWithRefreshTokenOptions = (options) => ({
  grant_type: "refresh_token",
  client_id: options.clientId,
  client_secret: options.clientSecret,
  refresh_token: options.refreshToken,
  organization_id: options.organizationId,
  ip_address: options.ipAddress,
  user_agent: options.userAgent
});
var serializeAuthenticateWithRefreshTokenPublicClientOptions = (options) => ({
  grant_type: "refresh_token",
  client_id: options.clientId,
  refresh_token: options.refreshToken,
  organization_id: options.organizationId,
  ip_address: options.ipAddress,
  user_agent: options.userAgent
});
var serializeAuthenticateWithTotpOptions = (options) => ({
  grant_type: "urn:workos:oauth:grant-type:mfa-totp",
  client_id: options.clientId,
  client_secret: options.clientSecret,
  code: options.code,
  authentication_challenge_id: options.authenticationChallengeId,
  pending_authentication_token: options.pendingAuthenticationToken,
  ip_address: options.ipAddress,
  user_agent: options.userAgent
});
var deserializeAuthenticationEventSso = (sso) => ({
  connectionId: sso.connection_id,
  organizationId: sso.organization_id,
  ...sso.session_id !== undefined && { sessionId: sso.session_id }
});
var deserializeAuthenticationEvent = (authenticationEvent) => ({
  email: authenticationEvent.email,
  ...authenticationEvent.error !== undefined && { error: authenticationEvent.error },
  ipAddress: authenticationEvent.ip_address,
  ...authenticationEvent.sso !== undefined && { sso: deserializeAuthenticationEventSso(authenticationEvent.sso) },
  status: authenticationEvent.status,
  type: authenticationEvent.type,
  userAgent: authenticationEvent.user_agent,
  userId: authenticationEvent.user_id
});
var deserializeOauthTokens = (oauthTokens) => oauthTokens ? {
  accessToken: oauthTokens.access_token,
  refreshToken: oauthTokens.refresh_token,
  expiresAt: oauthTokens.expires_at,
  scopes: oauthTokens.scopes
} : undefined;
var deserializeUser = (user) => ({
  object: user.object,
  id: user.id,
  email: user.email,
  emailVerified: user.email_verified,
  firstName: user.first_name,
  profilePictureUrl: user.profile_picture_url,
  lastName: user.last_name,
  lastSignInAt: user.last_sign_in_at,
  locale: user.locale,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
  externalId: user.external_id ?? null,
  metadata: user.metadata ?? {}
});
var deserializeAuthenticationResponse = (authenticationResponse) => {
  const { user, organization_id, access_token, refresh_token, authentication_method, impersonator, oauth_tokens, ...rest } = authenticationResponse;
  return {
    user: deserializeUser(user),
    organizationId: organization_id,
    accessToken: access_token,
    refreshToken: refresh_token,
    impersonator,
    authenticationMethod: authentication_method,
    oauthTokens: deserializeOauthTokens(oauth_tokens),
    ...rest
  };
};
var serializeCreateMagicAuthOptions = (options) => ({
  email: options.email,
  invitation_token: options.invitationToken
});
var serializeCreatePasswordResetOptions = (options) => ({ email: options.email });
var deserializeEmailVerification = (emailVerification) => ({
  object: emailVerification.object,
  id: emailVerification.id,
  userId: emailVerification.user_id,
  email: emailVerification.email,
  expiresAt: emailVerification.expires_at,
  code: emailVerification.code,
  createdAt: emailVerification.created_at,
  updatedAt: emailVerification.updated_at
});
var deserializeEmailVerificationEvent = (emailVerification) => ({
  object: emailVerification.object,
  id: emailVerification.id,
  userId: emailVerification.user_id,
  email: emailVerification.email,
  expiresAt: emailVerification.expires_at,
  createdAt: emailVerification.created_at,
  updatedAt: emailVerification.updated_at
});
var serializeEnrollAuthFactorOptions = (options) => ({
  type: options.type,
  totp_issuer: options.totpIssuer,
  totp_user: options.totpUser,
  totp_secret: options.totpSecret
});
var deserializeTotp = (totp) => {
  return {
    issuer: totp.issuer,
    user: totp.user
  };
};
var deserializeTotpWithSecrets = (totp) => {
  return {
    issuer: totp.issuer,
    user: totp.user,
    qrCode: totp.qr_code,
    secret: totp.secret,
    uri: totp.uri
  };
};
var deserializeFactor$1 = (factor) => ({
  object: factor.object,
  id: factor.id,
  createdAt: factor.created_at,
  updatedAt: factor.updated_at,
  type: factor.type,
  totp: deserializeTotp(factor.totp),
  userId: factor.user_id
});
var deserializeFactorWithSecrets$1 = (factor) => ({
  object: factor.object,
  id: factor.id,
  createdAt: factor.created_at,
  updatedAt: factor.updated_at,
  type: factor.type,
  totp: deserializeTotpWithSecrets(factor.totp),
  userId: factor.user_id
});
var deserializeInvitation = (invitation) => ({
  object: invitation.object,
  id: invitation.id,
  email: invitation.email,
  state: invitation.state,
  acceptedAt: invitation.accepted_at,
  revokedAt: invitation.revoked_at,
  expiresAt: invitation.expires_at,
  organizationId: invitation.organization_id,
  inviterUserId: invitation.inviter_user_id,
  acceptedUserId: invitation.accepted_user_id,
  token: invitation.token,
  acceptInvitationUrl: invitation.accept_invitation_url,
  createdAt: invitation.created_at,
  updatedAt: invitation.updated_at
});
var deserializeInvitationEvent = (invitation) => ({
  object: invitation.object,
  id: invitation.id,
  email: invitation.email,
  state: invitation.state,
  acceptedAt: invitation.accepted_at,
  revokedAt: invitation.revoked_at,
  expiresAt: invitation.expires_at,
  organizationId: invitation.organization_id,
  inviterUserId: invitation.inviter_user_id,
  acceptedUserId: invitation.accepted_user_id,
  createdAt: invitation.created_at,
  updatedAt: invitation.updated_at
});
var serializeListSessionsOptions = (options) => ({ ...options });
var deserializeMagicAuth = (magicAuth) => ({
  object: magicAuth.object,
  id: magicAuth.id,
  userId: magicAuth.user_id,
  email: magicAuth.email,
  expiresAt: magicAuth.expires_at,
  code: magicAuth.code,
  createdAt: magicAuth.created_at,
  updatedAt: magicAuth.updated_at
});
var deserializeMagicAuthEvent = (magicAuth) => ({
  object: magicAuth.object,
  id: magicAuth.id,
  userId: magicAuth.user_id,
  email: magicAuth.email,
  expiresAt: magicAuth.expires_at,
  createdAt: magicAuth.created_at,
  updatedAt: magicAuth.updated_at
});
var deserializePasswordReset = (passwordReset) => ({
  object: passwordReset.object,
  id: passwordReset.id,
  userId: passwordReset.user_id,
  email: passwordReset.email,
  passwordResetToken: passwordReset.password_reset_token,
  passwordResetUrl: passwordReset.password_reset_url,
  expiresAt: passwordReset.expires_at,
  createdAt: passwordReset.created_at
});
var deserializePasswordResetEvent = (passwordReset) => ({
  object: passwordReset.object,
  id: passwordReset.id,
  userId: passwordReset.user_id,
  email: passwordReset.email,
  expiresAt: passwordReset.expires_at,
  createdAt: passwordReset.created_at
});
var serializeResetPasswordOptions = (options) => ({
  token: options.token,
  new_password: options.newPassword
});
var deserializeSession = (session) => ({
  object: "session",
  id: session.id,
  userId: session.user_id,
  ipAddress: session.ip_address,
  userAgent: session.user_agent,
  ...session.organization_id !== undefined && { organizationId: session.organization_id },
  ...session.impersonator !== undefined && { impersonator: session.impersonator },
  authMethod: session.auth_method,
  status: session.status,
  expiresAt: session.expires_at,
  endedAt: session.ended_at,
  createdAt: session.created_at,
  updatedAt: session.updated_at
});
var serializeCreateUserOptions = (options) => ({
  email: options.email,
  password: options.password,
  password_hash: options.passwordHash,
  password_hash_type: options.passwordHashType,
  first_name: options.firstName,
  last_name: options.lastName,
  email_verified: options.emailVerified,
  external_id: options.externalId,
  metadata: options.metadata
});
var serializeUpdateUserOptions = (options) => ({
  email: options.email,
  email_verified: options.emailVerified,
  first_name: options.firstName,
  last_name: options.lastName,
  password: options.password,
  password_hash: options.passwordHash,
  password_hash_type: options.passwordHashType,
  external_id: options.externalId,
  locale: options.locale,
  metadata: options.metadata
});
var deserializeOrganizationMembership = (organizationMembership) => ({
  object: organizationMembership.object,
  id: organizationMembership.id,
  userId: organizationMembership.user_id,
  organizationId: organizationMembership.organization_id,
  organizationName: organizationMembership.organization_name,
  status: organizationMembership.status,
  directoryManaged: organizationMembership.directory_managed ?? false,
  createdAt: organizationMembership.created_at,
  updatedAt: organizationMembership.updated_at,
  role: organizationMembership.role,
  ...organizationMembership.roles && { roles: organizationMembership.roles },
  customAttributes: organizationMembership.custom_attributes ?? {}
});
var deserializeAuthorizationOrganizationMembership = (organizationMembership) => ({
  object: organizationMembership.object,
  id: organizationMembership.id,
  userId: organizationMembership.user_id,
  organizationId: organizationMembership.organization_id,
  status: organizationMembership.status,
  directoryManaged: organizationMembership.directory_managed ?? false,
  createdAt: organizationMembership.created_at,
  updatedAt: organizationMembership.updated_at,
  customAttributes: organizationMembership.custom_attributes ?? {}
});
var deserializeUserData = (userData) => {
  return {
    object: userData.object,
    email: userData.email,
    firstName: userData.first_name,
    lastName: userData.last_name
  };
};
var deserializeAction = (actionPayload) => {
  switch (actionPayload.object) {
    case "user_registration_action_context":
      return {
        id: actionPayload.id,
        object: actionPayload.object,
        userData: deserializeUserData(actionPayload.user_data),
        invitation: actionPayload.invitation ? deserializeInvitation(actionPayload.invitation) : undefined,
        ipAddress: actionPayload.ip_address,
        userAgent: actionPayload.user_agent,
        deviceFingerprint: actionPayload.device_fingerprint
      };
    case "authentication_action_context":
      return {
        id: actionPayload.id,
        object: actionPayload.object,
        user: deserializeUser(actionPayload.user),
        organization: actionPayload.organization ? deserializeOrganization(actionPayload.organization) : undefined,
        organizationMembership: actionPayload.organization_membership ? deserializeOrganizationMembership(actionPayload.organization_membership) : undefined,
        ipAddress: actionPayload.ip_address,
        userAgent: actionPayload.user_agent,
        deviceFingerprint: actionPayload.device_fingerprint,
        issuer: actionPayload.issuer
      };
  }
};
var Actions = class {
  signatureProvider;
  constructor(cryptoProvider) {
    this.signatureProvider = new SignatureProvider(cryptoProvider);
  }
  get computeSignature() {
    return this.signatureProvider.computeSignature.bind(this.signatureProvider);
  }
  get verifyHeader() {
    return this.signatureProvider.verifyHeader.bind(this.signatureProvider);
  }
  serializeType(type) {
    switch (type) {
      case "authentication":
        return "authentication_action_response";
      case "user_registration":
        return "user_registration_action_response";
      default:
        return unreachable(type);
    }
  }
  async signResponse(data, secret) {
    let errorMessage;
    const { verdict, type } = data;
    if (verdict === "Deny" && data.errorMessage)
      errorMessage = data.errorMessage;
    const responsePayload = {
      timestamp: Date.now(),
      verdict,
      ...verdict === "Deny" && data.errorMessage && { error_message: errorMessage }
    };
    return {
      object: this.serializeType(type),
      payload: responsePayload,
      signature: await this.computeSignature(responsePayload.timestamp, responsePayload, secret)
    };
  }
  async constructAction({ payload, sigHeader, secret, tolerance = 30000 }) {
    const options = {
      payload,
      sigHeader,
      secret,
      tolerance
    };
    await this.verifyHeader(options);
    return deserializeAction(payload);
  }
};
var deserializeDirectoryGroup = (directoryGroup) => ({
  id: directoryGroup.id,
  idpId: directoryGroup.idp_id,
  directoryId: directoryGroup.directory_id,
  organizationId: directoryGroup.organization_id,
  name: directoryGroup.name,
  createdAt: directoryGroup.created_at,
  updatedAt: directoryGroup.updated_at,
  rawAttributes: directoryGroup.raw_attributes
});
var deserializeUpdatedEventDirectoryGroup = (directoryGroup) => ({
  id: directoryGroup.id,
  idpId: directoryGroup.idp_id,
  directoryId: directoryGroup.directory_id,
  organizationId: directoryGroup.organization_id,
  name: directoryGroup.name,
  createdAt: directoryGroup.created_at,
  updatedAt: directoryGroup.updated_at,
  rawAttributes: directoryGroup.raw_attributes,
  previousAttributes: directoryGroup.previous_attributes
});
var deserializeDirectoryUser = (directoryUser) => ({
  object: directoryUser.object,
  id: directoryUser.id,
  directoryId: directoryUser.directory_id,
  organizationId: directoryUser.organization_id,
  rawAttributes: directoryUser.raw_attributes,
  customAttributes: directoryUser.custom_attributes,
  idpId: directoryUser.idp_id,
  firstName: directoryUser.first_name,
  email: directoryUser.email,
  lastName: directoryUser.last_name,
  state: directoryUser.state,
  ...directoryUser.role !== undefined && { role: directoryUser.role },
  ...directoryUser.roles !== undefined && { roles: directoryUser.roles },
  createdAt: directoryUser.created_at,
  updatedAt: directoryUser.updated_at
});
var deserializeDirectoryUserWithGroups = (directoryUserWithGroups) => ({
  ...deserializeDirectoryUser(directoryUserWithGroups),
  groups: directoryUserWithGroups.groups.map(deserializeDirectoryGroup)
});
var deserializeUpdatedEventDirectoryUser = (directoryUser) => ({
  object: "directory_user",
  id: directoryUser.id,
  directoryId: directoryUser.directory_id,
  organizationId: directoryUser.organization_id,
  rawAttributes: directoryUser.raw_attributes,
  customAttributes: directoryUser.custom_attributes,
  idpId: directoryUser.idp_id,
  firstName: directoryUser.first_name,
  email: directoryUser.email,
  lastName: directoryUser.last_name,
  state: directoryUser.state,
  ...directoryUser.role !== undefined && { role: directoryUser.role },
  ...directoryUser.roles !== undefined && { roles: directoryUser.roles },
  createdAt: directoryUser.created_at,
  updatedAt: directoryUser.updated_at,
  previousAttributes: directoryUser.previous_attributes
});
var deserializeDirectory = (directory) => ({
  object: directory.object,
  id: directory.id,
  domain: directory.domain,
  externalKey: directory.external_key,
  name: directory.name,
  organizationId: directory.organization_id,
  state: deserializeDirectoryState(directory.state),
  type: directory.type,
  createdAt: directory.created_at,
  updatedAt: directory.updated_at
});
var deserializeDirectoryState = (state) => {
  if (state === "linked")
    return "active";
  if (state === "unlinked")
    return "inactive";
  return state;
};
var deserializeEventDirectory = (directory) => ({
  object: directory.object,
  id: directory.id,
  externalKey: directory.external_key,
  type: directory.type,
  state: directory.state,
  name: directory.name,
  organizationId: directory.organization_id,
  domains: directory.domains,
  createdAt: directory.created_at,
  updatedAt: directory.updated_at
});
var deserializeDeletedEventDirectory = (directory) => ({
  object: directory.object,
  id: directory.id,
  type: directory.type,
  state: directory.state,
  name: directory.name,
  organizationId: directory.organization_id,
  createdAt: directory.created_at,
  updatedAt: directory.updated_at
});
var serializeListDirectoriesOptions = (options) => ({
  organization_id: options.organizationId,
  search: options.search,
  limit: options.limit,
  before: options.before,
  after: options.after,
  order: options.order
});
var serializeCreateOrganizationOptions = (options) => ({
  name: options.name,
  domain_data: options.domainData,
  external_id: options.externalId,
  metadata: options.metadata
});
var serializeUpdateOrganizationOptions = (options) => ({
  name: options.name,
  domain_data: options.domainData,
  stripe_customer_id: options.stripeCustomerId,
  external_id: options.externalId,
  metadata: options.metadata
});
var deserializeConnection = (connection) => ({
  object: connection.object,
  id: connection.id,
  ...connection.organization_id !== undefined && { organizationId: connection.organization_id },
  name: connection.name,
  type: connection.connection_type,
  state: connection.state,
  domains: connection.domains,
  createdAt: connection.created_at,
  updatedAt: connection.updated_at
});
var serializeListConnectionsOptions = (options) => ({
  connection_type: options.connectionType,
  domain: options.domain,
  organization_id: options.organizationId,
  limit: options.limit,
  before: options.before,
  after: options.after,
  order: options.order
});
var deserializeProfile = (profile) => ({
  id: profile.id,
  idpId: profile.idp_id,
  ...profile.organization_id !== undefined && { organizationId: profile.organization_id },
  connectionId: profile.connection_id,
  connectionType: profile.connection_type,
  email: profile.email,
  ...profile.first_name !== undefined && { firstName: profile.first_name },
  ...profile.last_name !== undefined && { lastName: profile.last_name },
  ...profile.role !== undefined && { role: profile.role },
  ...profile.roles !== undefined && { roles: profile.roles },
  ...profile.groups !== undefined && { groups: profile.groups },
  ...profile.custom_attributes !== undefined && { customAttributes: profile.custom_attributes },
  ...profile.raw_attributes !== undefined && { rawAttributes: profile.raw_attributes }
});
var deserializeProfileAndToken = (profileAndToken) => ({
  accessToken: profileAndToken.access_token,
  profile: deserializeProfile(profileAndToken.profile),
  oauthTokens: deserializeOauthTokens(profileAndToken.oauth_tokens)
});
var deserializeRoleEvent = (role) => ({
  object: "role",
  slug: role.slug,
  permissions: role.permissions,
  createdAt: role.created_at,
  updatedAt: role.updated_at
});
var deserializeAuthenticationRadarRiskDetectedEvent = (authenticationRadarRiskDetectedEvent) => ({
  authMethod: authenticationRadarRiskDetectedEvent.auth_method,
  action: authenticationRadarRiskDetectedEvent.action,
  control: authenticationRadarRiskDetectedEvent.control,
  blocklistType: authenticationRadarRiskDetectedEvent.blocklist_type,
  ipAddress: authenticationRadarRiskDetectedEvent.ip_address,
  userAgent: authenticationRadarRiskDetectedEvent.user_agent,
  userId: authenticationRadarRiskDetectedEvent.user_id,
  email: authenticationRadarRiskDetectedEvent.email
});
function deserializeApiKey(apiKey) {
  return {
    object: apiKey.object,
    id: apiKey.id,
    owner: apiKey.owner,
    name: apiKey.name,
    obfuscatedValue: apiKey.obfuscated_value,
    lastUsedAt: apiKey.last_used_at,
    permissions: apiKey.permissions,
    createdAt: apiKey.created_at,
    updatedAt: apiKey.updated_at
  };
}
var deserializeRole$1 = (role) => ({
  object: role.object,
  id: role.id,
  name: role.name,
  slug: role.slug,
  description: role.description,
  permissions: role.permissions,
  resourceTypeSlug: role.resource_type_slug,
  type: role.type,
  createdAt: role.created_at,
  updatedAt: role.updated_at
});
var deserializeOrganizationRole = (role) => ({
  object: role.object,
  id: role.id,
  name: role.name,
  slug: role.slug,
  description: role.description,
  permissions: role.permissions,
  resourceTypeSlug: role.resource_type_slug,
  type: "OrganizationRole",
  createdAt: role.created_at,
  updatedAt: role.updated_at
});
var deserializeOrganizationRoleEvent = (event) => ({
  object: event.object,
  organizationId: event.organization_id,
  slug: event.slug,
  name: event.name,
  description: event.description,
  resourceTypeSlug: event.resource_type_slug,
  permissions: event.permissions,
  createdAt: event.created_at,
  updatedAt: event.updated_at
});
var deserializePermission = (permission) => ({
  object: permission.object,
  id: permission.id,
  slug: permission.slug,
  name: permission.name,
  description: permission.description,
  resourceTypeSlug: permission.resource_type_slug,
  system: permission.system,
  createdAt: permission.created_at,
  updatedAt: permission.updated_at
});
var deserializeFeatureFlag = (featureFlag) => ({
  object: featureFlag.object,
  id: featureFlag.id,
  name: featureFlag.name,
  slug: featureFlag.slug,
  description: featureFlag.description,
  tags: featureFlag.tags,
  enabled: featureFlag.enabled,
  defaultValue: featureFlag.default_value,
  createdAt: featureFlag.created_at,
  updatedAt: featureFlag.updated_at
});
var deserializeVaultActor = (actor) => ({
  actorId: actor.actor_id,
  actorSource: actor.actor_source,
  actorName: actor.actor_name
});
var deserializeVaultDataCreatedEvent = (data) => ({
  ...deserializeVaultActor(data),
  kvName: data.kv_name,
  keyId: data.key_id,
  keyContext: data.key_context
});
var deserializeVaultDataUpdatedEvent = (data) => ({
  ...deserializeVaultActor(data),
  kvName: data.kv_name,
  keyId: data.key_id,
  keyContext: data.key_context
});
var deserializeVaultDataReadEvent = (data) => ({
  ...deserializeVaultActor(data),
  kvName: data.kv_name,
  keyId: data.key_id
});
var deserializeVaultDataDeletedEvent = (data) => ({
  ...deserializeVaultActor(data),
  kvName: data.kv_name
});
var deserializeVaultMetadataReadEvent = (data) => ({
  ...deserializeVaultActor(data),
  kvName: data.kv_name
});
var deserializeVaultNamesListedEvent = (data) => deserializeVaultActor(data);
var deserializeVaultKekCreatedEvent = (data) => ({
  ...deserializeVaultActor(data),
  keyName: data.key_name,
  keyId: data.key_id
});
var deserializeVaultDekReadEvent = (data) => ({
  ...deserializeVaultActor(data),
  keyIds: data.key_ids,
  keyContext: data.key_context
});
var deserializeVaultDekDecryptedEvent = (data) => ({
  ...deserializeVaultActor(data),
  keyId: data.key_id
});
var deserializeVaultByokKeyVerificationCompletedEvent = (data) => ({
  organizationId: data.organization_id,
  keyProvider: data.key_provider,
  verified: data.verified
});
var deserializeOrganizationDomainVerificationFailed = (organizationDomainVerificationFailed) => ({
  reason: organizationDomainVerificationFailed.reason,
  organizationDomain: deserializeOrganizationDomain(organizationDomainVerificationFailed.organization_domain)
});
var deserializeEvent = (event) => {
  const eventBase = {
    id: event.id,
    createdAt: event.created_at,
    context: event.context
  };
  switch (event.event) {
    case "authentication.email_verification_succeeded":
    case "authentication.magic_auth_failed":
    case "authentication.magic_auth_succeeded":
    case "authentication.mfa_succeeded":
    case "authentication.oauth_failed":
    case "authentication.oauth_succeeded":
    case "authentication.passkey_failed":
    case "authentication.passkey_succeeded":
    case "authentication.password_failed":
    case "authentication.password_succeeded":
    case "authentication.sso_failed":
    case "authentication.sso_succeeded":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeAuthenticationEvent(event.data)
      };
    case "authentication.radar_risk_detected":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeAuthenticationRadarRiskDetectedEvent(event.data)
      };
    case "connection.activated":
    case "connection.deactivated":
    case "connection.deleted":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeConnection(event.data)
      };
    case "dsync.activated":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeEventDirectory(event.data)
      };
    case "dsync.deleted":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeDeletedEventDirectory(event.data)
      };
    case "dsync.group.created":
    case "dsync.group.deleted":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeDirectoryGroup(event.data)
      };
    case "dsync.group.updated":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeUpdatedEventDirectoryGroup(event.data)
      };
    case "dsync.group.user_added":
    case "dsync.group.user_removed":
      return {
        ...eventBase,
        event: event.event,
        data: {
          directoryId: event.data.directory_id,
          user: deserializeDirectoryUser(event.data.user),
          group: deserializeDirectoryGroup(event.data.group)
        }
      };
    case "dsync.user.created":
    case "dsync.user.deleted":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeDirectoryUser(event.data)
      };
    case "dsync.user.updated":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeUpdatedEventDirectoryUser(event.data)
      };
    case "email_verification.created":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeEmailVerificationEvent(event.data)
      };
    case "invitation.accepted":
    case "invitation.created":
    case "invitation.revoked":
    case "invitation.resent":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeInvitationEvent(event.data)
      };
    case "magic_auth.created":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeMagicAuthEvent(event.data)
      };
    case "password_reset.created":
    case "password_reset.succeeded":
      return {
        ...eventBase,
        event: event.event,
        data: deserializePasswordResetEvent(event.data)
      };
    case "user.created":
    case "user.updated":
    case "user.deleted":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeUser(event.data)
      };
    case "organization_membership.created":
    case "organization_membership.deleted":
    case "organization_membership.updated":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeOrganizationMembership(event.data)
      };
    case "role.created":
    case "role.deleted":
    case "role.updated":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeRoleEvent(event.data)
      };
    case "organization_role.created":
    case "organization_role.updated":
    case "organization_role.deleted":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeOrganizationRoleEvent(event.data)
      };
    case "permission.created":
    case "permission.updated":
    case "permission.deleted":
      return {
        ...eventBase,
        event: event.event,
        data: deserializePermission(event.data)
      };
    case "session.created":
    case "session.revoked":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeSession(event.data)
      };
    case "organization.created":
    case "organization.updated":
    case "organization.deleted":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeOrganization(event.data)
      };
    case "organization_domain.verification_failed":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeOrganizationDomainVerificationFailed(event.data)
      };
    case "organization_domain.verified":
    case "organization_domain.created":
    case "organization_domain.updated":
    case "organization_domain.deleted":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeOrganizationDomain(event.data)
      };
    case "api_key.created":
    case "api_key.revoked":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeApiKey(event.data)
      };
    case "flag.created":
    case "flag.updated":
    case "flag.deleted":
    case "flag.rule_updated":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeFeatureFlag(event.data)
      };
    case "vault.data.created":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeVaultDataCreatedEvent(event.data)
      };
    case "vault.data.updated":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeVaultDataUpdatedEvent(event.data)
      };
    case "vault.data.read":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeVaultDataReadEvent(event.data)
      };
    case "vault.data.deleted":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeVaultDataDeletedEvent(event.data)
      };
    case "vault.names.listed":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeVaultNamesListedEvent(event.data)
      };
    case "vault.metadata.read":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeVaultMetadataReadEvent(event.data)
      };
    case "vault.kek.created":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeVaultKekCreatedEvent(event.data)
      };
    case "vault.dek.read":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeVaultDekReadEvent(event.data)
      };
    case "vault.dek.decrypted":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeVaultDekDecryptedEvent(event.data)
      };
    case "vault.byok_key.verification_completed":
      return {
        ...eventBase,
        event: event.event,
        data: deserializeVaultByokKeyVerificationCompletedEvent(event.data)
      };
  }
};
var deserializeList = (list, deserializer) => ({
  object: "list",
  data: list.data.map(deserializer),
  listMetadata: list.list_metadata
});
var serializePaginationOptions = (options) => ({
  ...options.limit !== undefined && { limit: options.limit },
  ...options.after && { after: options.after },
  ...options.before && { before: options.before },
  ...options.order && { order: options.order }
});
var Webhooks = class {
  signatureProvider;
  constructor(cryptoProvider) {
    this.signatureProvider = new SignatureProvider(cryptoProvider);
  }
  get verifyHeader() {
    return this.signatureProvider.verifyHeader.bind(this.signatureProvider);
  }
  get computeSignature() {
    return this.signatureProvider.computeSignature.bind(this.signatureProvider);
  }
  get getTimestampAndSignatureHash() {
    return this.signatureProvider.getTimestampAndSignatureHash.bind(this.signatureProvider);
  }
  async constructEvent({ payload, sigHeader, secret, tolerance = 180000 }) {
    const options = {
      payload,
      sigHeader,
      secret,
      tolerance
    };
    await this.verifyHeader(options);
    return deserializeEvent(payload);
  }
};
var PKCE = class {
  generateCodeVerifier(length = 43) {
    if (length < 43 || length > 128)
      throw new RangeError(`Code verifier length must be between 43 and 128, got ${length}`);
    const byteLength = Math.ceil(length * 3 / 4);
    const randomBytes = new Uint8Array(byteLength);
    crypto.getRandomValues(randomBytes);
    return this.base64UrlEncode(randomBytes).slice(0, length);
  }
  async generateCodeChallenge(verifier) {
    const data = new TextEncoder().encode(verifier);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return this.base64UrlEncode(new Uint8Array(hash));
  }
  async generate() {
    const codeVerifier = this.generateCodeVerifier();
    return {
      codeVerifier,
      codeChallenge: await this.generateCodeChallenge(codeVerifier),
      codeChallengeMethod: "S256"
    };
  }
  base64UrlEncode(buffer) {
    return btoa(String.fromCharCode(...buffer)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
};
function deserializeValidateApiKeyResponse(response) {
  return { apiKey: response.api_key ? deserializeApiKey(response.api_key) : null };
}
var ApiKeys = class {
  constructor(workos) {
    this.workos = workos;
  }
  async validateApiKey(payload) {
    const { data } = await this.workos.post("/api_keys/validations", payload);
    return deserializeValidateApiKeyResponse(data);
  }
  async deleteApiKey(id) {
    await this.workos.delete(`/api_keys/${id}`);
  }
};
var AutoPaginatable = class {
  object = "list";
  options;
  constructor(list, apiCall, options) {
    this.list = list;
    this.apiCall = apiCall;
    this.options = options ?? {};
  }
  get data() {
    return this.list.data;
  }
  get listMetadata() {
    return this.list.listMetadata;
  }
  async* generatePages(params) {
    const result = await this.apiCall({
      ...this.options,
      limit: 100,
      after: params.after
    });
    yield result.data;
    if (result.listMetadata.after) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      yield* this.generatePages({ after: result.listMetadata.after });
    }
  }
  async autoPagination() {
    if (this.options.limit)
      return this.data;
    const results = [];
    for await (const page of this.generatePages({ after: this.options.after }))
      results.push(...page);
    return results;
  }
};
var setDefaultOptions = (options) => {
  return {
    ...options,
    order: options?.order || "desc"
  };
};
var fetchAndDeserialize = async (workos, endpoint, deserializeFn, options, requestOptions) => {
  const { data } = await workos.get(endpoint, {
    query: setDefaultOptions(options),
    ...requestOptions
  });
  return deserializeList(data, deserializeFn);
};
var DirectorySync = class {
  constructor(workos) {
    this.workos = workos;
  }
  async listDirectories(options) {
    return new AutoPaginatable(await fetchAndDeserialize(this.workos, "/directories", deserializeDirectory, options ? serializeListDirectoriesOptions(options) : undefined), (params) => fetchAndDeserialize(this.workos, "/directories", deserializeDirectory, params), options ? serializeListDirectoriesOptions(options) : undefined);
  }
  async getDirectory(id) {
    const { data } = await this.workos.get(`/directories/${id}`);
    return deserializeDirectory(data);
  }
  async deleteDirectory(id) {
    await this.workos.delete(`/directories/${id}`);
  }
  async listGroups(options) {
    return new AutoPaginatable(await fetchAndDeserialize(this.workos, "/directory_groups", deserializeDirectoryGroup, options), (params) => fetchAndDeserialize(this.workos, "/directory_groups", deserializeDirectoryGroup, params), options);
  }
  async listUsers(options) {
    return new AutoPaginatable(await fetchAndDeserialize(this.workos, "/directory_users", deserializeDirectoryUserWithGroups, options), (params) => fetchAndDeserialize(this.workos, "/directory_users", deserializeDirectoryUserWithGroups, params), options);
  }
  async getUser(user) {
    const { data } = await this.workos.get(`/directory_users/${user}`);
    return deserializeDirectoryUserWithGroups(data);
  }
  async getGroup(group) {
    const { data } = await this.workos.get(`/directory_groups/${group}`);
    return deserializeDirectoryGroup(data);
  }
};
var serializeListEventOptions = (options) => ({
  events: options.events,
  organization_id: options.organizationId,
  range_start: options.rangeStart,
  range_end: options.rangeEnd,
  limit: options.limit,
  after: options.after,
  order: options.order
});
var Events = class {
  constructor(workos) {
    this.workos = workos;
  }
  async listEvents(options) {
    const { data } = await this.workos.get(`/events`, { query: options ? serializeListEventOptions(options) : undefined });
    return deserializeList(data, deserializeEvent);
  }
};
var deserializeRole = (role) => ({
  object: role.object,
  id: role.id,
  name: role.name,
  slug: role.slug,
  description: role.description,
  permissions: role.permissions,
  resourceTypeSlug: role.resource_type_slug,
  type: role.type,
  createdAt: role.created_at,
  updatedAt: role.updated_at
});
function serializeCreateOrganizationApiKeyOptions(options) {
  return {
    name: options.name,
    permissions: options.permissions
  };
}
function deserializeCreatedApiKey(apiKey) {
  return {
    object: apiKey.object,
    id: apiKey.id,
    owner: apiKey.owner,
    name: apiKey.name,
    obfuscatedValue: apiKey.obfuscated_value,
    value: apiKey.value,
    lastUsedAt: apiKey.last_used_at,
    permissions: apiKey.permissions,
    createdAt: apiKey.created_at,
    updatedAt: apiKey.updated_at
  };
}
var Organizations = class {
  constructor(workos) {
    this.workos = workos;
  }
  async listOrganizations(options) {
    return new AutoPaginatable(await fetchAndDeserialize(this.workos, "/organizations", deserializeOrganization, options), (params) => fetchAndDeserialize(this.workos, "/organizations", deserializeOrganization, params), options);
  }
  async createOrganization(payload, requestOptions = {}) {
    const { data } = await this.workos.post("/organizations", serializeCreateOrganizationOptions(payload), requestOptions);
    return deserializeOrganization(data);
  }
  async deleteOrganization(id) {
    await this.workos.delete(`/organizations/${id}`);
  }
  async getOrganization(id) {
    const { data } = await this.workos.get(`/organizations/${id}`);
    return deserializeOrganization(data);
  }
  async getOrganizationByExternalId(externalId) {
    const { data } = await this.workos.get(`/organizations/external_id/${externalId}`);
    return deserializeOrganization(data);
  }
  async updateOrganization(options) {
    const { organization: organizationId, ...payload } = options;
    const { data } = await this.workos.put(`/organizations/${organizationId}`, serializeUpdateOrganizationOptions(payload));
    return deserializeOrganization(data);
  }
  async listOrganizationRoles(options) {
    const { organizationId } = options;
    const { data: response } = await this.workos.get(`/organizations/${organizationId}/roles`);
    return {
      object: "list",
      data: response.data.map((role) => deserializeRole(role))
    };
  }
  async listOrganizationFeatureFlags(options) {
    const { organizationId, ...paginationOptions } = options;
    return new AutoPaginatable(await fetchAndDeserialize(this.workos, `/organizations/${organizationId}/feature-flags`, deserializeFeatureFlag, paginationOptions), (params) => fetchAndDeserialize(this.workos, `/organizations/${organizationId}/feature-flags`, deserializeFeatureFlag, params), paginationOptions);
  }
  async listOrganizationApiKeys(options) {
    const { organizationId, ...paginationOptions } = options;
    return new AutoPaginatable(await fetchAndDeserialize(this.workos, `/organizations/${organizationId}/api_keys`, deserializeApiKey, paginationOptions), (params) => fetchAndDeserialize(this.workos, `/organizations/${organizationId}/api_keys`, deserializeApiKey, params), paginationOptions);
  }
  async createOrganizationApiKey(options, requestOptions = {}) {
    const { organizationId } = options;
    const { data } = await this.workos.post(`/organizations/${organizationId}/api_keys`, serializeCreateOrganizationApiKeyOptions(options), requestOptions);
    return deserializeCreatedApiKey(data);
  }
};
var serializeCreateOrganizationDomainOptions = (options) => ({
  domain: options.domain,
  organization_id: options.organizationId
});
var OrganizationDomains = class {
  constructor(workos) {
    this.workos = workos;
  }
  async get(id) {
    const { data } = await this.workos.get(`/organization_domains/${id}`);
    return deserializeOrganizationDomain(data);
  }
  async verify(id) {
    const { data } = await this.workos.post(`/organization_domains/${id}/verify`, {});
    return deserializeOrganizationDomain(data);
  }
  async create(payload) {
    const { data } = await this.workos.post(`/organization_domains`, serializeCreateOrganizationDomainOptions(payload));
    return deserializeOrganizationDomain(data);
  }
  async delete(id) {
    await this.workos.delete(`/organization_domains/${id}`);
  }
};
var deserializePasswordlessSession = (passwordlessSession) => ({
  id: passwordlessSession.id,
  email: passwordlessSession.email,
  expiresAt: passwordlessSession.expires_at,
  link: passwordlessSession.link,
  object: passwordlessSession.object
});
var Passwordless = class {
  constructor(workos) {
    this.workos = workos;
  }
  async createSession({ redirectURI, expiresIn, ...options }) {
    const { data } = await this.workos.post("/passwordless/sessions", {
      ...options,
      redirect_uri: redirectURI,
      expires_in: expiresIn
    });
    return deserializePasswordlessSession(data);
  }
  async sendSession(sessionId) {
    const { data } = await this.workos.post(`/passwordless/sessions/${sessionId}/send`, {});
    return data;
  }
};
function deserializeAccessToken(serialized) {
  return {
    object: "access_token",
    accessToken: serialized.access_token,
    expiresAt: serialized.expires_at ? new Date(Date.parse(serialized.expires_at)) : null,
    scopes: serialized.scopes,
    missingScopes: serialized.missing_scopes
  };
}
function serializeGetAccessTokenOptions(options) {
  return {
    user_id: options.userId,
    organization_id: options.organizationId
  };
}
function deserializeGetAccessTokenResponse(response) {
  if (response.active)
    return {
      active: true,
      accessToken: deserializeAccessToken(response.access_token)
    };
  return {
    active: false,
    error: response.error
  };
}
var Pipes = class {
  constructor(workos) {
    this.workos = workos;
  }
  async getAccessToken({ provider, ...options }) {
    const { data } = await this.workos.post(`data-integrations/${provider}/token`, serializeGetAccessTokenOptions(options));
    return deserializeGetAccessTokenResponse(data);
  }
};
var Portal = class {
  constructor(workos) {
    this.workos = workos;
  }
  async generateLink({ intent, organization, returnUrl, successUrl }) {
    const { data } = await this.workos.post("/portal/generate_link", {
      intent,
      organization,
      return_url: returnUrl,
      success_url: successUrl
    });
    return data;
  }
};
function toQueryString(options) {
  const params = [];
  const sortedKeys = Object.keys(options).sort((a, b) => a.localeCompare(b));
  for (const key of sortedKeys) {
    const value = options[key];
    if (value === undefined)
      continue;
    if (Array.isArray(value))
      for (const item of value)
        params.push([key, String(item)]);
    else if (typeof value === "object" && value !== null) {
      const sortedSubKeys = Object.keys(value).sort((a, b) => a.localeCompare(b));
      for (const subKey of sortedSubKeys) {
        const subValue = value[subKey];
        if (subValue !== undefined)
          params.push([`${key}[${subKey}]`, String(subValue)]);
      }
    } else
      params.push([key, String(value)]);
  }
  return params.map(([key, value]) => {
    return `${encodeRFC1738(key)}=${encodeRFC1738(value)}`;
  }).join("&");
}
function encodeRFC1738(str) {
  return encodeURIComponent(str).replace(/%20/g, "+").replace(/[!'*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}
var SSO = class {
  constructor(workos) {
    this.workos = workos;
  }
  async listConnections(options) {
    return new AutoPaginatable(await fetchAndDeserialize(this.workos, "/connections", deserializeConnection, options ? serializeListConnectionsOptions(options) : undefined), (params) => fetchAndDeserialize(this.workos, "/connections", deserializeConnection, params), options ? serializeListConnectionsOptions(options) : undefined);
  }
  async deleteConnection(id) {
    await this.workos.delete(`/connections/${id}`);
  }
  getAuthorizationUrl(options) {
    const { codeChallenge, codeChallengeMethod, connection, clientId, domainHint, loginHint, organization, provider, providerQueryParams, providerScopes, redirectUri, state } = options;
    if (!provider && !connection && !organization)
      throw new TypeError(`Incomplete arguments. Need to specify either a 'connection', 'organization', or 'provider'.`);
    const query = toQueryString({
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
      connection,
      organization,
      domain_hint: domainHint,
      login_hint: loginHint,
      provider,
      provider_query_params: providerQueryParams,
      provider_scopes: providerScopes,
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      state
    });
    return `${this.workos.baseURL}/sso/authorize?${query}`;
  }
  async getAuthorizationUrlWithPKCE(options) {
    const { connection, clientId, domainHint, loginHint, organization, provider, providerQueryParams, providerScopes, redirectUri } = options;
    if (!provider && !connection && !organization)
      throw new TypeError(`Incomplete arguments. Need to specify either a 'connection', 'organization', or 'provider'.`);
    const pkce = await this.workos.pkce.generate();
    const state = this.workos.pkce.generateCodeVerifier(43);
    const query = toQueryString({
      code_challenge: pkce.codeChallenge,
      code_challenge_method: "S256",
      connection,
      organization,
      domain_hint: domainHint,
      login_hint: loginHint,
      provider,
      provider_query_params: providerQueryParams,
      provider_scopes: providerScopes,
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      state
    });
    return {
      url: `${this.workos.baseURL}/sso/authorize?${query}`,
      state,
      codeVerifier: pkce.codeVerifier
    };
  }
  async getConnection(id) {
    const { data } = await this.workos.get(`/connections/${id}`);
    return deserializeConnection(data);
  }
  async getProfileAndToken({ code, clientId, codeVerifier }) {
    if (codeVerifier !== undefined && codeVerifier.trim() === "")
      throw new TypeError("codeVerifier cannot be an empty string. Generate a valid PKCE pair using workos.pkce.generate().");
    const hasApiKey = !!this.workos.key;
    const hasPKCE = !!codeVerifier;
    if (!hasPKCE && !hasApiKey)
      throw new TypeError("getProfileAndToken requires either a codeVerifier (for public clients) or an API key configured on the WorkOS instance (for confidential clients).");
    const form = new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code
    });
    if (hasPKCE)
      form.set("code_verifier", codeVerifier);
    if (hasApiKey)
      form.set("client_secret", this.workos.key);
    const { data } = await this.workos.post("/sso/token", form, { skipApiKeyCheck: !hasApiKey });
    return deserializeProfileAndToken(data);
  }
  async getProfile({ accessToken }) {
    const { data } = await this.workos.get("/sso/profile", { accessToken });
    return deserializeProfile(data);
  }
};
var deserializeChallenge = (challenge) => ({
  object: challenge.object,
  id: challenge.id,
  createdAt: challenge.created_at,
  updatedAt: challenge.updated_at,
  expiresAt: challenge.expires_at,
  code: challenge.code,
  authenticationFactorId: challenge.authentication_factor_id
});
var deserializeSms = (sms) => ({ phoneNumber: sms.phone_number });
var deserializeFactor = (factor) => ({
  object: factor.object,
  id: factor.id,
  createdAt: factor.created_at,
  updatedAt: factor.updated_at,
  type: factor.type,
  ...factor.sms ? { sms: deserializeSms(factor.sms) } : {},
  ...factor.totp ? { totp: deserializeTotp(factor.totp) } : {}
});
var deserializeFactorWithSecrets = (factor) => ({
  object: factor.object,
  id: factor.id,
  createdAt: factor.created_at,
  updatedAt: factor.updated_at,
  type: factor.type,
  ...factor.sms ? { sms: deserializeSms(factor.sms) } : {},
  ...factor.totp ? { totp: deserializeTotpWithSecrets(factor.totp) } : {}
});
var deserializeVerifyResponse = (verifyResponse) => ({
  challenge: deserializeChallenge(verifyResponse.challenge),
  valid: verifyResponse.valid
});
var Mfa = class {
  constructor(workos) {
    this.workos = workos;
  }
  async deleteFactor(id) {
    await this.workos.delete(`/auth/factors/${id}`);
  }
  async getFactor(id) {
    const { data } = await this.workos.get(`/auth/factors/${id}`);
    return deserializeFactor(data);
  }
  async enrollFactor(options) {
    const { data } = await this.workos.post("/auth/factors/enroll", {
      type: options.type,
      ...(() => {
        switch (options.type) {
          case "sms":
            return { phone_number: options.phoneNumber };
          case "totp":
            return {
              totp_issuer: options.issuer,
              totp_user: options.user
            };
          default:
            return {};
        }
      })()
    });
    return deserializeFactorWithSecrets(data);
  }
  async challengeFactor(options) {
    const { data } = await this.workos.post(`/auth/factors/${options.authenticationFactorId}/challenge`, { sms_template: "smsTemplate" in options ? options.smsTemplate : undefined });
    return deserializeChallenge(data);
  }
  async verifyChallenge(options) {
    const { data } = await this.workos.post(`/auth/challenges/${options.authenticationChallengeId}/verify`, { code: options.code });
    return deserializeVerifyResponse(data);
  }
};
var deserializeAuditLogExport = (auditLogExport) => ({
  object: auditLogExport.object,
  id: auditLogExport.id,
  state: auditLogExport.state,
  url: auditLogExport.url,
  createdAt: auditLogExport.created_at,
  updatedAt: auditLogExport.updated_at
});
var serializeAuditLogExportOptions = (options) => ({
  actions: options.actions,
  actor_names: options.actorNames,
  actor_ids: options.actorIds,
  organization_id: options.organizationId,
  range_end: options.rangeEnd.toISOString(),
  range_start: options.rangeStart.toISOString(),
  targets: options.targets
});
var serializeCreateAuditLogEventOptions = (event) => ({
  action: event.action,
  version: event.version,
  occurred_at: event.occurredAt.toISOString(),
  actor: event.actor,
  targets: event.targets,
  context: {
    location: event.context.location,
    user_agent: event.context.userAgent
  },
  metadata: event.metadata
});
function serializeMetadata(metadata) {
  if (!metadata)
    return {};
  const serializedMetadata = {};
  Object.keys(metadata).forEach((key) => {
    serializedMetadata[key] = { type: metadata[key] };
  });
  return serializedMetadata;
}
var serializeCreateAuditLogSchemaOptions = (schema) => ({
  actor: { metadata: {
    type: "object",
    properties: serializeMetadata(schema.actor?.metadata)
  } },
  targets: schema.targets.map((target) => {
    return {
      type: target.type,
      metadata: target.metadata ? {
        type: "object",
        properties: serializeMetadata(target.metadata)
      } : undefined
    };
  }),
  metadata: schema.metadata ? {
    type: "object",
    properties: serializeMetadata(schema.metadata)
  } : undefined
});
function deserializeMetadata(metadata) {
  if (!metadata || !metadata.properties)
    return {};
  const deserializedMetadata = {};
  Object.keys(metadata.properties).forEach((key) => {
    if (metadata.properties)
      deserializedMetadata[key] = metadata.properties[key].type;
  });
  return deserializedMetadata;
}
var deserializeAuditLogSchema = (auditLogSchema) => ({
  object: auditLogSchema.object,
  version: auditLogSchema.version,
  targets: auditLogSchema.targets.map((target) => {
    return {
      type: target.type,
      metadata: target.metadata ? deserializeMetadata(target.metadata) : undefined
    };
  }),
  actor: { metadata: deserializeMetadata(auditLogSchema.actor?.metadata) },
  metadata: auditLogSchema.metadata ? deserializeMetadata(auditLogSchema.metadata) : undefined,
  createdAt: auditLogSchema.created_at
});
var AuditLogs = class {
  constructor(workos) {
    this.workos = workos;
  }
  async createEvent(organization, event, options = {}) {
    const optionsWithIdempotency = {
      ...options,
      idempotencyKey: options.idempotencyKey || `workos-node-${globalThis.crypto.randomUUID()}`
    };
    await this.workos.post("/audit_logs/events", {
      event: serializeCreateAuditLogEventOptions(event),
      organization_id: organization
    }, optionsWithIdempotency);
  }
  async createExport(options) {
    const { data } = await this.workos.post("/audit_logs/exports", serializeAuditLogExportOptions(options));
    return deserializeAuditLogExport(data);
  }
  async getExport(auditLogExportId) {
    const { data } = await this.workos.get(`/audit_logs/exports/${auditLogExportId}`);
    return deserializeAuditLogExport(data);
  }
  async createSchema(schema, options = {}) {
    const { data } = await this.workos.post(`/audit_logs/actions/${schema.action}/schemas`, serializeCreateAuditLogSchemaOptions(schema), options);
    return deserializeAuditLogSchema(data);
  }
};
var objectToString = Object.prototype.toString;
var uint8ArrayStringified = "[object Uint8Array]";
function isType(value, typeConstructor, typeStringified) {
  if (!value)
    return false;
  if (value.constructor === typeConstructor)
    return true;
  return objectToString.call(value) === typeStringified;
}
function isUint8Array(value) {
  return isType(value, Uint8Array, uint8ArrayStringified);
}
function assertUint8Array(value) {
  if (!isUint8Array(value))
    throw new TypeError(`Expected \`Uint8Array\`, got \`${typeof value}\``);
}
new globalThis.TextDecoder("utf8");
function assertString(value) {
  if (typeof value !== "string")
    throw new TypeError(`Expected \`string\`, got \`${typeof value}\``);
}
new globalThis.TextEncoder;
function base64ToBase64Url(base64) {
  return base64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
function base64UrlToBase64(base64url) {
  const base64 = base64url.replaceAll("-", "+").replaceAll("_", "/");
  const padding = (4 - base64.length % 4) % 4;
  return base64 + "=".repeat(padding);
}
var MAX_BLOCK_SIZE = 65535;
function uint8ArrayToBase64$1(array, { urlSafe = false } = {}) {
  assertUint8Array(array);
  let base64 = "";
  for (let index = 0;index < array.length; index += MAX_BLOCK_SIZE) {
    const chunk = array.subarray(index, index + MAX_BLOCK_SIZE);
    base64 += globalThis.btoa(String.fromCodePoint.apply(undefined, chunk));
  }
  return urlSafe ? base64ToBase64Url(base64) : base64;
}
function base64ToUint8Array$1(base64String) {
  assertString(base64String);
  return Uint8Array.from(globalThis.atob(base64UrlToBase64(base64String)), (x) => x.codePointAt(0));
}
var byteToHexLookupTable = Array.from({ length: 256 }, (_, index) => index.toString(16).padStart(2, "0"));
function uint8ArrayToHex(array) {
  assertUint8Array(array);
  let hexString = "";
  for (let index = 0;index < array.length; index++)
    hexString += byteToHexLookupTable[array[index]];
  return hexString;
}
function losslessJsonStringify(data) {
  try {
    if (isJson(data)) {
      let stringified = JSON.stringify(data);
      if (stringified)
        return stringified;
    }
  } catch {}
  throw Error("Data is not JSON serializable");
}
function jsonParse(string) {
  try {
    return JSON.parse(string);
  } catch (err) {
    throw Error("Failed parsing sealed object JSON: " + err.message);
  }
}
function isJson(val) {
  let stack = [], seen = /* @__PURE__ */ new WeakSet, check2 = (val$1) => val$1 === null || typeof val$1 == "string" || typeof val$1 == "boolean" ? true : typeof val$1 == "number" ? Number.isFinite(val$1) : typeof val$1 == "object" ? seen.has(val$1) ? true : (seen.add(val$1), stack.push(val$1), true) : false;
  if (!check2(val))
    return false;
  for (;stack.length; ) {
    let obj = stack.pop();
    if (Array.isArray(obj)) {
      let i$1 = obj.length;
      for (;i$1--; )
        if (!check2(obj[i$1]))
          return false;
      continue;
    }
    let proto = Reflect.getPrototypeOf(obj);
    if (proto !== null && proto !== Object.prototype)
      return false;
    let keys = Reflect.ownKeys(obj), i = keys.length;
    for (;i--; ) {
      let key = keys[i];
      if (typeof key != "string" || Reflect.getOwnPropertyDescriptor(obj, key)?.enumerable === false)
        return false;
      let val$1 = obj[key];
      if (val$1 !== undefined && !check2(val$1))
        return false;
    }
  }
  return true;
}
var enc = /* @__PURE__ */ new TextEncoder;
var dec = /* @__PURE__ */ new TextDecoder;
var jsBase64Enabled = typeof Uint8Array.fromBase64 == "function" && typeof Uint8Array.prototype.toBase64 == "function" && typeof Uint8Array.prototype.toHex == "function";
function b64ToU8(str) {
  return jsBase64Enabled ? Uint8Array.fromBase64(str, { alphabet: "base64url" }) : base64ToUint8Array$1(str);
}
function u8ToB64(arr) {
  return arr = arr instanceof ArrayBuffer ? new Uint8Array(arr) : arr, jsBase64Enabled ? arr.toBase64({
    alphabet: "base64url",
    omitPadding: true
  }) : uint8ArrayToBase64$1(arr, { urlSafe: true });
}
function u8ToHex(arr) {
  return arr = arr instanceof ArrayBuffer ? new Uint8Array(arr) : arr, jsBase64Enabled ? arr.toHex() : uint8ArrayToHex(arr);
}
var defaults = /* @__PURE__ */ Object.freeze({
  encryption: /* @__PURE__ */ Object.freeze({
    algorithm: "aes-256-cbc",
    saltBits: 256,
    iterations: 1,
    minPasswordlength: 32
  }),
  integrity: /* @__PURE__ */ Object.freeze({
    algorithm: "sha256",
    saltBits: 256,
    iterations: 1,
    minPasswordlength: 32
  }),
  ttl: 0,
  timestampSkewSec: 60,
  localtimeOffsetMsec: 0
});
var algorithms = /* @__PURE__ */ Object.freeze({
  "aes-128-ctr": /* @__PURE__ */ Object.freeze({
    keyBits: 128,
    ivBits: 128,
    name: "AES-CTR"
  }),
  "aes-256-cbc": /* @__PURE__ */ Object.freeze({
    keyBits: 256,
    ivBits: 128,
    name: "AES-CBC"
  }),
  sha256: /* @__PURE__ */ Object.freeze({
    keyBits: 256,
    ivBits: undefined,
    name: "SHA-256"
  })
});
var macPrefix = "Fe26.2";
function randomBits(bits) {
  return crypto.getRandomValues(new Uint8Array(bits / 8));
}
async function generateKey(password, options) {
  if (!password || !password.length)
    throw Error("Empty password");
  if (!options || typeof options != "object")
    throw Error("Bad options");
  let algorithm = algorithms[options.algorithm];
  if (!algorithm)
    throw Error("Unknown algorithm: " + options.algorithm);
  let isHmac = algorithm.name === "SHA-256", id = isHmac ? {
    name: "HMAC",
    hash: algorithm.name,
    length: algorithm.keyBits
  } : {
    name: algorithm.name,
    length: algorithm.keyBits
  }, usages = isHmac ? ["sign", "verify"] : ["encrypt", "decrypt"], iv = options.iv || (algorithm.ivBits ? randomBits(algorithm.ivBits) : undefined);
  if (typeof password == "string") {
    if (password.length < options.minPasswordlength)
      throw Error("Password string too short (min " + options.minPasswordlength + " characters required)");
    let salt = options.salt;
    if (!salt) {
      if (!options.saltBits)
        throw Error("Missing salt and saltBits options");
      salt = u8ToHex(randomBits(options.saltBits));
    }
    let baseKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]), algorithm$1 = {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: options.iterations,
      hash: "SHA-1"
    };
    return {
      key: await crypto.subtle.deriveKey(algorithm$1, baseKey, id, false, usages),
      iv,
      salt
    };
  }
  if (password.length < algorithm.keyBits / 8)
    throw Error("Key buffer (password) too small");
  return {
    key: await crypto.subtle.importKey("raw", password.slice(), id, false, usages),
    iv,
    salt: ""
  };
}
function getEncryptParams(algorithm, key, data) {
  return [
    algorithm === "aes-128-ctr" ? {
      name: "AES-CTR",
      counter: key.iv,
      length: 128
    } : {
      name: "AES-CBC",
      iv: key.iv
    },
    key.key,
    typeof data == "string" ? enc.encode(data) : data.slice()
  ];
}
async function encrypt2(password, options, data) {
  let key = await generateKey(password, options), encrypted = await crypto.subtle.encrypt(...getEncryptParams(options.algorithm, key, data));
  return {
    encrypted: new Uint8Array(encrypted),
    key
  };
}
async function decrypt2(password, options, data) {
  let key = await generateKey(password, options), decrypted = await crypto.subtle.decrypt(...getEncryptParams(options.algorithm, key, data));
  return dec.decode(decrypted);
}
async function hmacWithPassword(password, options, data) {
  let key = await generateKey(password, options);
  return {
    digest: u8ToB64(await crypto.subtle.sign("HMAC", key.key, enc.encode(data))),
    salt: key.salt
  };
}
function normalizePassword(password) {
  let normalized = typeof password == "string" || password instanceof Uint8Array ? {
    encryption: password,
    integrity: password
  } : password && typeof password == "object" ? "secret" in password ? {
    id: password.id,
    encryption: password.secret,
    integrity: password.secret
  } : {
    id: password.id,
    encryption: password.encryption,
    integrity: password.integrity
  } : undefined;
  if (!normalized || !normalized.encryption || normalized.encryption.length === 0 || !normalized.integrity || normalized.integrity.length === 0)
    throw Error("Empty password");
  return normalized;
}
async function seal(object, password, options) {
  let now = Date.now() + (options.localtimeOffsetMsec || 0), { id = "", encryption, integrity } = normalizePassword(password);
  if (id && !/^\w+$/.test(id))
    throw Error("Invalid password id");
  let { encrypted, key } = await encrypt2(encryption, options.encryption, (options.encode || losslessJsonStringify)(object)), expiration = options.ttl ? now + options.ttl : "", macBaseString = macPrefix + "*" + id + "*" + key.salt + "*" + u8ToB64(key.iv) + "*" + u8ToB64(encrypted) + "*" + expiration, mac = await hmacWithPassword(integrity, options.integrity, macBaseString);
  return macBaseString + "*" + mac.salt + "*" + mac.digest;
}
async function unseal(sealed, password, options) {
  let now = Date.now() + (options.localtimeOffsetMsec || 0), parts = sealed.split("*");
  if (parts.length !== 8)
    throw Error("Incorrect number of sealed components");
  let [prefix, passwordId, encryptionSalt, ivB64, encryptedB64, expiration, hmacSalt, hmacDigestB64] = parts;
  if (prefix !== "Fe26.2")
    throw Error("Wrong mac prefix");
  if (expiration) {
    if (!/^[1-9]\d*$/.test(expiration))
      throw Error("Invalid expiration");
    if (Number.parseInt(expiration, 10) <= now - options.timestampSkewSec * 1000)
      throw Error("Expired seal");
  }
  let pass;
  if (typeof password == "string" || password instanceof Uint8Array)
    pass = password;
  else if (typeof password == "object" && password) {
    let passwordIdKey = passwordId || "default";
    if (pass = password[passwordIdKey], !pass)
      throw Error("Cannot find password: " + passwordIdKey);
  }
  pass = normalizePassword(pass);
  let key = await generateKey(pass.integrity, {
    ...options.integrity,
    salt: hmacSalt
  }), macBaseString = prefix + "*" + passwordId + "*" + encryptionSalt + "*" + ivB64 + "*" + encryptedB64 + "*" + expiration;
  if (!await crypto.subtle.verify("HMAC", key.key, b64ToU8(hmacDigestB64), enc.encode(macBaseString)))
    throw Error("Bad hmac value");
  let decryptedString = await decrypt2(pass.encryption, {
    ...options.encryption,
    salt: encryptionSalt,
    iv: b64ToU8(ivB64)
  }, b64ToU8(encryptedB64));
  return (options.decode || jsonParse)(decryptedString);
}
var VERSION_DELIMITER = "~";
var CURRENT_MAJOR_VERSION = 2;
function parseSeal(seal2) {
  const [sealWithoutVersion = "", tokenVersionAsString] = seal2.split(VERSION_DELIMITER);
  return {
    sealWithoutVersion,
    tokenVersion: tokenVersionAsString == null ? null : parseInt(tokenVersionAsString, 10)
  };
}
async function sealData(data, { password }) {
  return `${await seal(data, {
    id: "1",
    secret: password
  }, {
    ...defaults,
    ttl: 0,
    encode: JSON.stringify
  })}${VERSION_DELIMITER}${CURRENT_MAJOR_VERSION}`;
}
async function unsealData(encryptedData, { password }) {
  const { sealWithoutVersion, tokenVersion } = parseSeal(encryptedData);
  const passwordMap = { 1: password };
  let data;
  try {
    data = await unseal(sealWithoutVersion, passwordMap, {
      ...defaults,
      ttl: 0
    }) ?? {};
  } catch (error) {
    if (error instanceof Error && /^(Expired seal|Bad hmac value|Cannot find password|Incorrect number of sealed components|Wrong mac prefix)/.test(error.message))
      return {};
    throw error;
  }
  if (tokenVersion === 2)
    return data;
  else if (tokenVersion !== null)
    return data.persistent ?? data;
  return data;
}
var detectedRuntime = null;
function detectRuntime() {
  if (detectedRuntime)
    return detectedRuntime;
  const global = globalThis;
  if (typeof process !== "undefined" && process.release?.name === "node")
    detectedRuntime = "node";
  else if (typeof global.Deno !== "undefined")
    detectedRuntime = "deno";
  else if (typeof navigator !== "undefined" && navigator.userAgent?.includes("Bun"))
    detectedRuntime = "bun";
  else if (typeof navigator !== "undefined" && navigator.userAgent?.includes("Cloudflare"))
    detectedRuntime = "cloudflare";
  else if (typeof global !== "undefined" && "fastly" in global)
    detectedRuntime = "fastly";
  else if (typeof global !== "undefined" && "EdgeRuntime" in global)
    detectedRuntime = "edge-light";
  else
    detectedRuntime = "other";
  return detectedRuntime;
}
function getEnvironmentVariable(key) {
  const runtime = detectRuntime();
  const global = globalThis;
  try {
    switch (runtime) {
      case "node":
      case "bun":
      case "edge-light":
        return process.env[key];
      case "deno":
        return global.Deno.env.get(key);
      case "cloudflare":
        return global.env?.[key] ?? global[key];
      case "fastly":
        return global[key];
      default:
        return process?.env?.[key] ?? global.env?.[key] ?? global[key];
    }
  } catch {
    return;
  }
}
function getEnv(key, defaultValue) {
  return getEnvironmentVariable(key) ?? defaultValue;
}
var AuthenticateWithSessionCookieFailureReason = /* @__PURE__ */ function(AuthenticateWithSessionCookieFailureReason2) {
  AuthenticateWithSessionCookieFailureReason2["INVALID_JWT"] = "invalid_jwt";
  AuthenticateWithSessionCookieFailureReason2["INVALID_SESSION_COOKIE"] = "invalid_session_cookie";
  AuthenticateWithSessionCookieFailureReason2["NO_SESSION_COOKIE_PROVIDED"] = "no_session_cookie_provided";
  return AuthenticateWithSessionCookieFailureReason2;
}({});
var serializeRevokeSessionOptions = (options) => ({ session_id: options.sessionId });
var serializeAuthenticateWithEmailVerificationOptions = (options) => ({
  grant_type: "urn:workos:oauth:grant-type:email-verification:code",
  client_id: options.clientId,
  client_secret: options.clientSecret,
  pending_authentication_token: options.pendingAuthenticationToken,
  code: options.code,
  ip_address: options.ipAddress,
  user_agent: options.userAgent
});
var serializeAuthenticateWithOrganizationSelectionOptions = (options) => ({
  grant_type: "urn:workos:oauth:grant-type:organization-selection",
  client_id: options.clientId,
  client_secret: options.clientSecret,
  pending_authentication_token: options.pendingAuthenticationToken,
  organization_id: options.organizationId,
  ip_address: options.ipAddress,
  user_agent: options.userAgent
});
var serializeCreateOrganizationMembershipOptions = (options) => ({
  organization_id: options.organizationId,
  user_id: options.userId,
  role_slug: options.roleSlug,
  role_slugs: options.roleSlugs
});
var deserializeIdentities = (identities) => {
  return identities.map((identity) => {
    return {
      idpId: identity.idp_id,
      type: identity.type,
      provider: identity.provider
    };
  });
};
var serializeListInvitationsOptions = (options) => ({
  email: options.email,
  organization_id: options.organizationId,
  limit: options.limit,
  before: options.before,
  after: options.after,
  order: options.order
});
var serializeListOrganizationMembershipsOptions = (options) => ({
  user_id: options.userId,
  organization_id: options.organizationId,
  statuses: options.statuses?.join(","),
  limit: options.limit,
  before: options.before,
  after: options.after,
  order: options.order
});
var serializeListUsersOptions = (options) => ({
  email: options.email,
  organization_id: options.organizationId,
  limit: options.limit,
  before: options.before,
  after: options.after,
  order: options.order
});
var serializeResendInvitationOptions = (options) => ({ locale: options.locale });
var RefreshSessionFailureReason = /* @__PURE__ */ function(RefreshSessionFailureReason2) {
  RefreshSessionFailureReason2["INVALID_SESSION_COOKIE"] = "invalid_session_cookie";
  RefreshSessionFailureReason2["NO_SESSION_COOKIE_PROVIDED"] = "no_session_cookie_provided";
  RefreshSessionFailureReason2["INVALID_GRANT"] = "invalid_grant";
  RefreshSessionFailureReason2["MFA_ENROLLMENT"] = "mfa_enrollment";
  RefreshSessionFailureReason2["SSO_REQUIRED"] = "sso_required";
  return RefreshSessionFailureReason2;
}({});
var serializeSendInvitationOptions = (options) => ({
  email: options.email,
  organization_id: options.organizationId,
  expires_in_days: options.expiresInDays,
  inviter_user_id: options.inviterUserId,
  role_slug: options.roleSlug,
  locale: options.locale
});
var serializeUpdateOrganizationMembershipOptions = (options) => ({
  role_slug: options.roleSlug,
  role_slugs: options.roleSlugs
});
var _josePromise;
function getJose() {
  return _josePromise ??= Promise.resolve().then(() => (init_webapi_CxKOxXjo(), exports_webapi_CxKOxXjo));
}
var CookieSession = class {
  userManagement;
  cookiePassword;
  sessionData;
  constructor(userManagement, sessionData, cookiePassword) {
    if (!cookiePassword)
      throw new Error("cookiePassword is required");
    this.userManagement = userManagement;
    this.cookiePassword = cookiePassword;
    this.sessionData = sessionData;
  }
  async authenticate() {
    if (!this.sessionData)
      return {
        authenticated: false,
        reason: AuthenticateWithSessionCookieFailureReason.NO_SESSION_COOKIE_PROVIDED
      };
    const session = await unsealData(this.sessionData, { password: this.cookiePassword });
    if (!session.accessToken)
      return {
        authenticated: false,
        reason: AuthenticateWithSessionCookieFailureReason.INVALID_SESSION_COOKIE
      };
    if (!await this.isValidJwt(session.accessToken))
      return {
        authenticated: false,
        reason: AuthenticateWithSessionCookieFailureReason.INVALID_JWT
      };
    const { decodeJwt: decodeJwt2 } = await getJose();
    const { sid: sessionId, org_id: organizationId, role, roles, permissions, entitlements, feature_flags: featureFlags } = decodeJwt2(session.accessToken);
    return {
      authenticated: true,
      sessionId,
      organizationId,
      role,
      roles,
      permissions,
      entitlements,
      featureFlags,
      user: session.user,
      authenticationMethod: session.authenticationMethod,
      impersonator: session.impersonator,
      accessToken: session.accessToken
    };
  }
  async refresh(options = {}) {
    const { decodeJwt: decodeJwt2 } = await getJose();
    const session = await unsealData(this.sessionData, { password: this.cookiePassword });
    if (!session.refreshToken || !session.user)
      return {
        authenticated: false,
        reason: RefreshSessionFailureReason.INVALID_SESSION_COOKIE
      };
    const { org_id: organizationIdFromAccessToken } = decodeJwt2(session.accessToken);
    try {
      const cookiePassword = options.cookiePassword ?? this.cookiePassword;
      const authenticationResponse = await this.userManagement.authenticateWithRefreshToken({
        clientId: this.userManagement.clientId,
        refreshToken: session.refreshToken,
        organizationId: options.organizationId ?? organizationIdFromAccessToken,
        session: {
          sealSession: true,
          cookiePassword
        }
      });
      if (options.cookiePassword)
        this.cookiePassword = options.cookiePassword;
      this.sessionData = authenticationResponse.sealedSession;
      const { sid: sessionId, org_id: organizationId, role, roles, permissions, entitlements, feature_flags: featureFlags } = decodeJwt2(authenticationResponse.accessToken);
      return {
        authenticated: true,
        sealedSession: authenticationResponse.sealedSession,
        session: authenticationResponse,
        authenticationMethod: authenticationResponse.authenticationMethod,
        sessionId,
        organizationId,
        role,
        roles,
        permissions,
        entitlements,
        featureFlags,
        user: session.user,
        impersonator: session.impersonator
      };
    } catch (error) {
      if (error instanceof OauthException && (error.error === RefreshSessionFailureReason.INVALID_GRANT || error.error === RefreshSessionFailureReason.MFA_ENROLLMENT || error.error === RefreshSessionFailureReason.SSO_REQUIRED))
        return {
          authenticated: false,
          reason: error.error
        };
      throw error;
    }
  }
  async getLogoutUrl({ returnTo } = {}) {
    const authenticationResponse = await this.authenticate();
    if (!authenticationResponse.authenticated) {
      const { reason } = authenticationResponse;
      throw new Error(`Failed to extract session ID for logout URL: ${reason}`);
    }
    return this.userManagement.getLogoutUrl({
      sessionId: authenticationResponse.sessionId,
      returnTo
    });
  }
  async isValidJwt(accessToken) {
    const { jwtVerify: jwtVerify2 } = await getJose();
    const jwks = await this.userManagement.getJWKS();
    if (!jwks)
      throw new Error("Missing client ID. Did you provide it when initializing WorkOS?");
    try {
      await jwtVerify2(accessToken, jwks);
      return true;
    } catch (e) {
      if (e instanceof Error && "code" in e && typeof e.code === "string" && (e.code.startsWith("ERR_JWT_") || e.code.startsWith("ERR_JWS_")))
        return false;
      throw e;
    }
  }
};
var UserManagement = class {
  _jwks;
  clientId;
  constructor(workos) {
    this.workos = workos;
    const { clientId } = workos.options;
    this.clientId = clientId;
  }
  resolveClientId(clientId) {
    const resolved = clientId ?? this.clientId;
    if (!resolved)
      throw new TypeError("clientId is required. Provide it in method options or when initializing WorkOS.");
    return resolved;
  }
  async getJWKS() {
    const { createRemoteJWKSet: createRemoteJWKSet2 } = await getJose();
    if (!this.clientId)
      return;
    this._jwks ??= createRemoteJWKSet2(new URL(this.getJwksUrl(this.clientId)), { cooldownDuration: 300000 });
    return this._jwks;
  }
  loadSealedSession(options) {
    return new CookieSession(this, options.sessionData, options.cookiePassword);
  }
  async getUser(userId) {
    const { data } = await this.workos.get(`/user_management/users/${userId}`);
    return deserializeUser(data);
  }
  async getUserByExternalId(externalId) {
    const { data } = await this.workos.get(`/user_management/users/external_id/${externalId}`);
    return deserializeUser(data);
  }
  async listUsers(options) {
    return new AutoPaginatable(await fetchAndDeserialize(this.workos, "/user_management/users", deserializeUser, options ? serializeListUsersOptions(options) : undefined), (params) => fetchAndDeserialize(this.workos, "/user_management/users", deserializeUser, params), options ? serializeListUsersOptions(options) : undefined);
  }
  async createUser(payload) {
    const { data } = await this.workos.post("/user_management/users", serializeCreateUserOptions(payload));
    return deserializeUser(data);
  }
  async authenticateWithMagicAuth(payload) {
    const { session, clientId, ...remainingPayload } = payload;
    const resolvedClientId = this.resolveClientId(clientId);
    const { data } = await this.workos.post("/user_management/authenticate", serializeAuthenticateWithMagicAuthOptions({
      ...remainingPayload,
      clientId: resolvedClientId,
      clientSecret: this.workos.key
    }));
    return this.prepareAuthenticationResponse({
      authenticationResponse: deserializeAuthenticationResponse(data),
      session
    });
  }
  async authenticateWithPassword(payload) {
    const { session, clientId, ...remainingPayload } = payload;
    const resolvedClientId = this.resolveClientId(clientId);
    const { data } = await this.workos.post("/user_management/authenticate", serializeAuthenticateWithPasswordOptions({
      ...remainingPayload,
      clientId: resolvedClientId,
      clientSecret: this.workos.key
    }));
    return this.prepareAuthenticationResponse({
      authenticationResponse: deserializeAuthenticationResponse(data),
      session
    });
  }
  async authenticateWithCode(payload) {
    const { session, clientId, codeVerifier, ...remainingPayload } = payload;
    const resolvedClientId = this.resolveClientId(clientId);
    if (codeVerifier !== undefined && codeVerifier.trim() === "")
      throw new TypeError("codeVerifier cannot be an empty string. Generate a valid PKCE pair using workos.pkce.generate().");
    const hasApiKey = !!this.workos.key;
    if (!!!codeVerifier && !hasApiKey)
      throw new TypeError("authenticateWithCode requires either a codeVerifier (for public clients) or an API key configured on the WorkOS instance (for confidential clients).");
    const { data } = await this.workos.post("/user_management/authenticate", serializeAuthenticateWithCodeOptions({
      ...remainingPayload,
      clientId: resolvedClientId,
      codeVerifier,
      clientSecret: hasApiKey ? this.workos.key : undefined
    }), { skipApiKeyCheck: !hasApiKey });
    return this.prepareAuthenticationResponse({
      authenticationResponse: deserializeAuthenticationResponse(data),
      session
    });
  }
  async authenticateWithCodeAndVerifier(payload) {
    const { session, clientId, ...remainingPayload } = payload;
    const resolvedClientId = this.resolveClientId(clientId);
    const { data } = await this.workos.post("/user_management/authenticate", serializeAuthenticateWithCodeAndVerifierOptions({
      ...remainingPayload,
      clientId: resolvedClientId
    }), { skipApiKeyCheck: true });
    return this.prepareAuthenticationResponse({
      authenticationResponse: deserializeAuthenticationResponse(data),
      session
    });
  }
  async authenticateWithRefreshToken(payload) {
    const { session, clientId, ...remainingPayload } = payload;
    const resolvedClientId = this.resolveClientId(clientId);
    const isPublicClient = !this.workos.key;
    const body = isPublicClient ? serializeAuthenticateWithRefreshTokenPublicClientOptions({
      ...remainingPayload,
      clientId: resolvedClientId
    }) : serializeAuthenticateWithRefreshTokenOptions({
      ...remainingPayload,
      clientId: resolvedClientId,
      clientSecret: this.workos.key
    });
    const { data } = await this.workos.post("/user_management/authenticate", body, { skipApiKeyCheck: isPublicClient });
    return this.prepareAuthenticationResponse({
      authenticationResponse: deserializeAuthenticationResponse(data),
      session
    });
  }
  async authenticateWithTotp(payload) {
    const { session, clientId, ...remainingPayload } = payload;
    const resolvedClientId = this.resolveClientId(clientId);
    const { data } = await this.workos.post("/user_management/authenticate", serializeAuthenticateWithTotpOptions({
      ...remainingPayload,
      clientId: resolvedClientId,
      clientSecret: this.workos.key
    }));
    return this.prepareAuthenticationResponse({
      authenticationResponse: deserializeAuthenticationResponse(data),
      session
    });
  }
  async authenticateWithEmailVerification(payload) {
    const { session, clientId, ...remainingPayload } = payload;
    const resolvedClientId = this.resolveClientId(clientId);
    const { data } = await this.workos.post("/user_management/authenticate", serializeAuthenticateWithEmailVerificationOptions({
      ...remainingPayload,
      clientId: resolvedClientId,
      clientSecret: this.workos.key
    }));
    return this.prepareAuthenticationResponse({
      authenticationResponse: deserializeAuthenticationResponse(data),
      session
    });
  }
  async authenticateWithOrganizationSelection(payload) {
    const { session, clientId, ...remainingPayload } = payload;
    const resolvedClientId = this.resolveClientId(clientId);
    const { data } = await this.workos.post("/user_management/authenticate", serializeAuthenticateWithOrganizationSelectionOptions({
      ...remainingPayload,
      clientId: resolvedClientId,
      clientSecret: this.workos.key
    }));
    return this.prepareAuthenticationResponse({
      authenticationResponse: deserializeAuthenticationResponse(data),
      session
    });
  }
  async authenticateWithSessionCookie({ sessionData, cookiePassword = getEnv("WORKOS_COOKIE_PASSWORD") }) {
    if (!cookiePassword)
      throw new Error("Cookie password is required");
    if (!await this.getJWKS())
      throw new Error("Must provide clientId to initialize JWKS");
    const { decodeJwt: decodeJwt2 } = await getJose();
    if (!sessionData)
      return {
        authenticated: false,
        reason: AuthenticateWithSessionCookieFailureReason.NO_SESSION_COOKIE_PROVIDED
      };
    const session = await unsealData(sessionData, { password: cookiePassword });
    if (!session.accessToken)
      return {
        authenticated: false,
        reason: AuthenticateWithSessionCookieFailureReason.INVALID_SESSION_COOKIE
      };
    if (!await this.isValidJwt(session.accessToken))
      return {
        authenticated: false,
        reason: AuthenticateWithSessionCookieFailureReason.INVALID_JWT
      };
    const { sid: sessionId, org_id: organizationId, role, roles, permissions, entitlements, feature_flags: featureFlags } = decodeJwt2(session.accessToken);
    return {
      authenticated: true,
      sessionId,
      organizationId,
      role,
      roles,
      user: session.user,
      permissions,
      entitlements,
      featureFlags,
      accessToken: session.accessToken,
      authenticationMethod: session.authenticationMethod
    };
  }
  async isValidJwt(accessToken) {
    const jwks = await this.getJWKS();
    const { jwtVerify: jwtVerify2 } = await getJose();
    if (!jwks)
      throw new Error("Must provide clientId to initialize JWKS");
    try {
      await jwtVerify2(accessToken, jwks);
      return true;
    } catch (e) {
      if (e instanceof Error && "code" in e && typeof e.code === "string" && (e.code.startsWith("ERR_JWT_") || e.code.startsWith("ERR_JWS_")))
        return false;
      throw e;
    }
  }
  async prepareAuthenticationResponse({ authenticationResponse, session }) {
    if (session?.sealSession) {
      if (!this.workos.key)
        throw new Error("Session sealing requires server-side usage with an API key. Public clients should store tokens directly (e.g., secure storage on mobile, keychain on desktop).");
      return {
        ...authenticationResponse,
        sealedSession: await this.sealSessionDataFromAuthenticationResponse({
          authenticationResponse,
          cookiePassword: session.cookiePassword
        })
      };
    }
    return authenticationResponse;
  }
  async sealSessionDataFromAuthenticationResponse({ authenticationResponse, cookiePassword }) {
    if (!cookiePassword)
      throw new Error("Cookie password is required");
    const { decodeJwt: decodeJwt2 } = await getJose();
    const { org_id: organizationIdFromAccessToken } = decodeJwt2(authenticationResponse.accessToken);
    return sealData({
      organizationId: organizationIdFromAccessToken,
      user: authenticationResponse.user,
      accessToken: authenticationResponse.accessToken,
      refreshToken: authenticationResponse.refreshToken,
      authenticationMethod: authenticationResponse.authenticationMethod,
      impersonator: authenticationResponse.impersonator
    }, { password: cookiePassword });
  }
  async getSessionFromCookie({ sessionData, cookiePassword = getEnv("WORKOS_COOKIE_PASSWORD") }) {
    if (!cookiePassword)
      throw new Error("Cookie password is required");
    if (sessionData)
      return unsealData(sessionData, { password: cookiePassword });
  }
  async getEmailVerification(emailVerificationId) {
    const { data } = await this.workos.get(`/user_management/email_verification/${emailVerificationId}`);
    return deserializeEmailVerification(data);
  }
  async sendVerificationEmail({ userId }) {
    const { data } = await this.workos.post(`/user_management/users/${userId}/email_verification/send`, {});
    return { user: deserializeUser(data.user) };
  }
  async getMagicAuth(magicAuthId) {
    const { data } = await this.workos.get(`/user_management/magic_auth/${magicAuthId}`);
    return deserializeMagicAuth(data);
  }
  async createMagicAuth(options) {
    const { data } = await this.workos.post("/user_management/magic_auth", serializeCreateMagicAuthOptions({ ...options }));
    return deserializeMagicAuth(data);
  }
  async verifyEmail({ code, userId }) {
    const { data } = await this.workos.post(`/user_management/users/${userId}/email_verification/confirm`, { code });
    return { user: deserializeUser(data.user) };
  }
  async getPasswordReset(passwordResetId) {
    const { data } = await this.workos.get(`/user_management/password_reset/${passwordResetId}`);
    return deserializePasswordReset(data);
  }
  async createPasswordReset(options) {
    const { data } = await this.workos.post("/user_management/password_reset", serializeCreatePasswordResetOptions({ ...options }));
    return deserializePasswordReset(data);
  }
  async resetPassword(payload) {
    const { data } = await this.workos.post("/user_management/password_reset/confirm", serializeResetPasswordOptions(payload));
    return { user: deserializeUser(data.user) };
  }
  async updateUser(payload) {
    const { data } = await this.workos.put(`/user_management/users/${payload.userId}`, serializeUpdateUserOptions(payload));
    return deserializeUser(data);
  }
  async enrollAuthFactor(payload) {
    const { data } = await this.workos.post(`/user_management/users/${payload.userId}/auth_factors`, serializeEnrollAuthFactorOptions(payload));
    return {
      authenticationFactor: deserializeFactorWithSecrets$1(data.authentication_factor),
      authenticationChallenge: deserializeChallenge(data.authentication_challenge)
    };
  }
  async listAuthFactors(options) {
    const { userId, ...restOfOptions } = options;
    return new AutoPaginatable(await fetchAndDeserialize(this.workos, `/user_management/users/${userId}/auth_factors`, deserializeFactor$1, restOfOptions), (params) => fetchAndDeserialize(this.workos, `/user_management/users/${userId}/auth_factors`, deserializeFactor$1, params), restOfOptions);
  }
  async listUserFeatureFlags(options) {
    const { userId, ...paginationOptions } = options;
    return new AutoPaginatable(await fetchAndDeserialize(this.workos, `/user_management/users/${userId}/feature-flags`, deserializeFeatureFlag, paginationOptions), (params) => fetchAndDeserialize(this.workos, `/user_management/users/${userId}/feature-flags`, deserializeFeatureFlag, params), paginationOptions);
  }
  async listSessions(userId, options) {
    return new AutoPaginatable(await fetchAndDeserialize(this.workos, `/user_management/users/${userId}/sessions`, deserializeSession, options ? serializeListSessionsOptions(options) : undefined), (params) => fetchAndDeserialize(this.workos, `/user_management/users/${userId}/sessions`, deserializeSession, params), options ? serializeListSessionsOptions(options) : undefined);
  }
  async deleteUser(userId) {
    await this.workos.delete(`/user_management/users/${userId}`);
  }
  async getUserIdentities(userId) {
    if (!userId)
      throw new TypeError(`Incomplete arguments. Need to specify 'userId'.`);
    const { data } = await this.workos.get(`/user_management/users/${userId}/identities`);
    return deserializeIdentities(data);
  }
  async getOrganizationMembership(organizationMembershipId) {
    const { data } = await this.workos.get(`/user_management/organization_memberships/${organizationMembershipId}`);
    return deserializeOrganizationMembership(data);
  }
  async listOrganizationMemberships(options) {
    const serializedOptions = serializeListOrganizationMembershipsOptions(options);
    return new AutoPaginatable(await fetchAndDeserialize(this.workos, "/user_management/organization_memberships", deserializeOrganizationMembership, serializedOptions), (params) => fetchAndDeserialize(this.workos, "/user_management/organization_memberships", deserializeOrganizationMembership, params), serializedOptions);
  }
  async createOrganizationMembership(options) {
    const { data } = await this.workos.post("/user_management/organization_memberships", serializeCreateOrganizationMembershipOptions(options));
    return deserializeOrganizationMembership(data);
  }
  async updateOrganizationMembership(organizationMembershipId, options) {
    const { data } = await this.workos.put(`/user_management/organization_memberships/${organizationMembershipId}`, serializeUpdateOrganizationMembershipOptions(options));
    return deserializeOrganizationMembership(data);
  }
  async deleteOrganizationMembership(organizationMembershipId) {
    await this.workos.delete(`/user_management/organization_memberships/${organizationMembershipId}`);
  }
  async deactivateOrganizationMembership(organizationMembershipId) {
    const { data } = await this.workos.put(`/user_management/organization_memberships/${organizationMembershipId}/deactivate`, {});
    return deserializeOrganizationMembership(data);
  }
  async reactivateOrganizationMembership(organizationMembershipId) {
    const { data } = await this.workos.put(`/user_management/organization_memberships/${organizationMembershipId}/reactivate`, {});
    return deserializeOrganizationMembership(data);
  }
  async getInvitation(invitationId) {
    const { data } = await this.workos.get(`/user_management/invitations/${invitationId}`);
    return deserializeInvitation(data);
  }
  async findInvitationByToken(invitationToken) {
    const { data } = await this.workos.get(`/user_management/invitations/by_token/${invitationToken}`);
    return deserializeInvitation(data);
  }
  async listInvitations(options) {
    return new AutoPaginatable(await fetchAndDeserialize(this.workos, "/user_management/invitations", deserializeInvitation, options ? serializeListInvitationsOptions(options) : undefined), (params) => fetchAndDeserialize(this.workos, "/user_management/invitations", deserializeInvitation, params), options ? serializeListInvitationsOptions(options) : undefined);
  }
  async sendInvitation(payload) {
    const { data } = await this.workos.post("/user_management/invitations", serializeSendInvitationOptions({ ...payload }));
    return deserializeInvitation(data);
  }
  async acceptInvitation(invitationId) {
    const { data } = await this.workos.post(`/user_management/invitations/${invitationId}/accept`, null);
    return deserializeInvitation(data);
  }
  async revokeInvitation(invitationId) {
    const { data } = await this.workos.post(`/user_management/invitations/${invitationId}/revoke`, null);
    return deserializeInvitation(data);
  }
  async resendInvitation(invitationId, options) {
    const { data } = await this.workos.post(`/user_management/invitations/${invitationId}/resend`, options ? serializeResendInvitationOptions(options) : {});
    return deserializeInvitation(data);
  }
  async revokeSession(payload) {
    await this.workos.post("/user_management/sessions/revoke", serializeRevokeSessionOptions(payload));
  }
  getAuthorizationUrl(options) {
    const { claimNonce, connectionId, codeChallenge, codeChallengeMethod, clientId, domainHint, loginHint, organizationId, provider, providerQueryParams, providerScopes, prompt, redirectUri, state, screenHint } = options;
    const resolvedClientId = this.resolveClientId(clientId);
    if (!provider && !connectionId && !organizationId)
      throw new TypeError(`Incomplete arguments. Need to specify either a 'connectionId', 'organizationId', or 'provider'.`);
    if (provider !== "authkit" && screenHint)
      throw new TypeError(`'screenHint' is only supported for 'authkit' provider`);
    const query = toQueryString({
      claim_nonce: claimNonce,
      connection_id: connectionId,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
      organization_id: organizationId,
      domain_hint: domainHint,
      login_hint: loginHint,
      provider,
      provider_query_params: providerQueryParams,
      provider_scopes: providerScopes,
      prompt,
      client_id: resolvedClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      state,
      screen_hint: screenHint
    });
    return `${this.workos.baseURL}/user_management/authorize?${query}`;
  }
  async getAuthorizationUrlWithPKCE(options) {
    const { clientId, connectionId, domainHint, loginHint, organizationId, provider, providerQueryParams, providerScopes, prompt, redirectUri, screenHint } = options;
    const resolvedClientId = this.resolveClientId(clientId);
    if (!provider && !connectionId && !organizationId)
      throw new TypeError(`Incomplete arguments. Need to specify either a 'connectionId', 'organizationId', or 'provider'.`);
    if (provider !== "authkit" && screenHint)
      throw new TypeError(`'screenHint' is only supported for 'authkit' provider`);
    const pkce = await this.workos.pkce.generate();
    const state = this.workos.pkce.generateCodeVerifier(43);
    const query = toQueryString({
      connection_id: connectionId,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: "S256",
      organization_id: organizationId,
      domain_hint: domainHint,
      login_hint: loginHint,
      provider,
      provider_query_params: providerQueryParams,
      provider_scopes: providerScopes,
      prompt,
      client_id: resolvedClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      state,
      screen_hint: screenHint
    });
    return {
      url: `${this.workos.baseURL}/user_management/authorize?${query}`,
      state,
      codeVerifier: pkce.codeVerifier
    };
  }
  getLogoutUrl(options) {
    const { sessionId, returnTo } = options;
    if (!sessionId)
      throw new TypeError(`Incomplete arguments. Need to specify 'sessionId'.`);
    const url = new URL("/user_management/sessions/logout", this.workos.baseURL);
    url.searchParams.set("session_id", sessionId);
    if (returnTo)
      url.searchParams.set("return_to", returnTo);
    return url.toString();
  }
  getJwksUrl(clientId) {
    if (!clientId)
      throw new TypeError("clientId must be a valid clientId");
    return `${this.workos.baseURL}/sso/jwks/${clientId}`;
  }
};
function isSubject(resource) {
  return Object.prototype.hasOwnProperty.call(resource, "resourceType") && Object.prototype.hasOwnProperty.call(resource, "resourceId");
}
function isResourceInterface(resource) {
  return !!resource && typeof resource === "object" && "getResouceType" in resource && "getResourceId" in resource;
}
var serializeCheckOptions = (options) => ({
  op: options.op,
  checks: options.checks.map(serializeCheckWarrantOptions),
  debug: options.debug
});
var serializeCheckBatchOptions = (options) => ({
  op: "batch",
  checks: options.checks.map(serializeCheckWarrantOptions),
  debug: options.debug
});
var serializeCheckWarrantOptions = (warrant) => {
  return {
    resource_type: isResourceInterface(warrant.resource) ? warrant.resource.getResourceType() : warrant.resource.resourceType,
    resource_id: isResourceInterface(warrant.resource) ? warrant.resource.getResourceId() : warrant.resource.resourceId ? warrant.resource.resourceId : "",
    relation: warrant.relation,
    subject: isSubject(warrant.subject) ? {
      resource_type: warrant.subject.resourceType,
      resource_id: warrant.subject.resourceId
    } : {
      resource_type: warrant.subject.getResourceType(),
      resource_id: warrant.subject.getResourceId()
    },
    context: warrant.context ?? {}
  };
};
var deserializeDecisionTreeNode = (response) => {
  return {
    check: {
      resource: {
        resourceType: response.check.resource_type,
        resourceId: response.check.resource_id
      },
      relation: response.check.relation,
      subject: {
        resourceType: response.check.subject.resource_type,
        resourceId: response.check.subject.resource_id
      },
      context: response.check.context
    },
    policy: response.policy,
    decision: response.decision,
    processingTime: response.processing_time,
    children: response.children.map(deserializeDecisionTreeNode)
  };
};
var CHECK_RESULT_AUTHORIZED = "authorized";
var CheckResult = class {
  result;
  isImplicit;
  warrantToken;
  debugInfo;
  warnings;
  constructor(json) {
    this.result = json.result;
    this.isImplicit = json.is_implicit;
    this.warrantToken = json.warrant_token;
    this.debugInfo = json.debug_info ? {
      processingTime: json.debug_info.processing_time,
      decisionTree: deserializeDecisionTreeNode(json.debug_info.decision_tree)
    } : undefined;
    this.warnings = json.warnings;
  }
  isAuthorized() {
    return this.result === CHECK_RESULT_AUTHORIZED;
  }
};
var ResourceOp = /* @__PURE__ */ function(ResourceOp2) {
  ResourceOp2["Create"] = "create";
  ResourceOp2["Delete"] = "delete";
  return ResourceOp2;
}({});
var serializeCreateResourceOptions$1 = (options) => ({
  resource_type: isResourceInterface(options.resource) ? options.resource.getResourceType() : options.resource.resourceType,
  resource_id: isResourceInterface(options.resource) ? options.resource.getResourceId() : options.resource.resourceId ? options.resource.resourceId : "",
  meta: options.meta
});
var serializeDeleteResourceOptions = (options) => ({
  resource_type: isResourceInterface(options) ? options.getResourceType() : options.resourceType,
  resource_id: isResourceInterface(options) ? options.getResourceId() : options.resourceId ? options.resourceId : ""
});
var serializeBatchWriteResourcesOptions = (options) => {
  let serializedResources = [];
  if (options.op === ResourceOp.Create)
    serializedResources = options.resources.map((options2) => serializeCreateResourceOptions$1(options2));
  else if (options.op === ResourceOp.Delete)
    serializedResources = options.resources.map((options2) => serializeDeleteResourceOptions(options2));
  return {
    op: options.op,
    resources: serializedResources
  };
};
var serializeListResourceOptions = (options) => ({
  resource_type: options.resourceType,
  search: options.search,
  limit: options.limit,
  before: options.before,
  after: options.after,
  order: options.order
});
var serializeListWarrantsOptions = (options) => ({
  resource_type: options.resourceType,
  resource_id: options.resourceId,
  relation: options.relation,
  subject_type: options.subjectType,
  subject_id: options.subjectId,
  subject_relation: options.subjectRelation,
  limit: options.limit,
  after: options.after
});
var serializeQueryOptions = (options) => ({
  q: options.q,
  context: JSON.stringify(options.context),
  limit: options.limit,
  before: options.before,
  after: options.after,
  order: options.order
});
var deserializeQueryResult = (queryResult) => ({
  resourceType: queryResult.resource_type,
  resourceId: queryResult.resource_id,
  relation: queryResult.relation,
  warrant: {
    resourceType: queryResult.warrant.resource_type,
    resourceId: queryResult.warrant.resource_id,
    relation: queryResult.warrant.relation,
    subject: {
      resourceType: queryResult.warrant.subject.resource_type,
      resourceId: queryResult.warrant.subject.resource_id,
      relation: queryResult.warrant.subject.relation
    }
  },
  isImplicit: queryResult.is_implicit,
  meta: queryResult.meta
});
var deserializeResource = (response) => ({
  resourceType: response.resource_type,
  resourceId: response.resource_id,
  meta: response.meta
});
var deserializeBatchWriteResourcesResponse = (response) => {
  return response.data.map((resource) => deserializeResource(resource));
};
var deserializeWarrantToken = (warrantToken) => ({ warrantToken: warrantToken.warrant_token });
var deserializeWarrant = (warrant) => ({
  resourceType: warrant.resource_type,
  resourceId: warrant.resource_id,
  relation: warrant.relation,
  subject: {
    resourceType: warrant.subject.resource_type,
    resourceId: warrant.subject.resource_id,
    relation: warrant.subject.relation
  },
  policy: warrant.policy
});
var serializeWriteWarrantOptions = (warrant) => ({
  op: warrant.op,
  resource_type: isResourceInterface(warrant.resource) ? warrant.resource.getResourceType() : warrant.resource.resourceType,
  resource_id: isResourceInterface(warrant.resource) ? warrant.resource.getResourceId() : warrant.resource.resourceId ? warrant.resource.resourceId : "",
  relation: warrant.relation,
  subject: isSubject(warrant.subject) ? {
    resource_type: warrant.subject.resourceType,
    resource_id: warrant.subject.resourceId
  } : {
    resource_type: warrant.subject.getResourceType(),
    resource_id: warrant.subject.getResourceId()
  },
  policy: warrant.policy
});
var deserializeFGAList = (response, deserializeFn) => ({
  object: "list",
  data: response.data.map(deserializeFn),
  listMetadata: response.list_metadata,
  warnings: response.warnings
});
var FgaPaginatable = class extends AutoPaginatable {
  list;
  constructor(list, apiCall, options) {
    super(list, apiCall, options);
    this.list = list;
  }
  get warnings() {
    return this.list.warnings;
  }
};
var fetchAndDeserializeFGAList = async (workos, endpoint, deserializeFn, options, requestOptions) => {
  const { data: response } = await workos.get(endpoint, {
    query: options,
    ...requestOptions
  });
  return deserializeFGAList(response, deserializeFn);
};
var FGA = class {
  constructor(workos) {
    this.workos = workos;
  }
  async check(checkOptions, options = {}) {
    const { data } = await this.workos.post(`/fga/v1/check`, serializeCheckOptions(checkOptions), options);
    return new CheckResult(data);
  }
  async checkBatch(checkOptions, options = {}) {
    const { data } = await this.workos.post(`/fga/v1/check`, serializeCheckBatchOptions(checkOptions), options);
    return data.map((checkResult) => new CheckResult(checkResult));
  }
  async createResource(resource) {
    const { data } = await this.workos.post("/fga/v1/resources", serializeCreateResourceOptions$1(resource));
    return deserializeResource(data);
  }
  async getResource(resource) {
    const resourceType = isResourceInterface(resource) ? resource.getResourceType() : resource.resourceType;
    const resourceId = isResourceInterface(resource) ? resource.getResourceId() : resource.resourceId;
    const { data } = await this.workos.get(`/fga/v1/resources/${resourceType}/${resourceId}`);
    return deserializeResource(data);
  }
  async listResources(options) {
    return new AutoPaginatable(await fetchAndDeserialize(this.workos, "/fga/v1/resources", deserializeResource, options ? serializeListResourceOptions(options) : undefined), (params) => fetchAndDeserialize(this.workos, "/fga/v1/resources", deserializeResource, params), options ? serializeListResourceOptions(options) : undefined);
  }
  async updateResource(options) {
    const resourceType = isResourceInterface(options.resource) ? options.resource.getResourceType() : options.resource.resourceType;
    const resourceId = isResourceInterface(options.resource) ? options.resource.getResourceId() : options.resource.resourceId;
    const { data } = await this.workos.put(`/fga/v1/resources/${resourceType}/${resourceId}`, { meta: options.meta });
    return deserializeResource(data);
  }
  async deleteResource(resource) {
    const resourceType = isResourceInterface(resource) ? resource.getResourceType() : resource.resourceType;
    const resourceId = isResourceInterface(resource) ? resource.getResourceId() : resource.resourceId;
    await this.workos.delete(`/fga/v1/resources/${resourceType}/${resourceId}`);
  }
  async batchWriteResources(options) {
    const { data } = await this.workos.post("/fga/v1/resources/batch", serializeBatchWriteResourcesOptions(options));
    return deserializeBatchWriteResourcesResponse(data);
  }
  async writeWarrant(options) {
    const { data } = await this.workos.post("/fga/v1/warrants", serializeWriteWarrantOptions(options));
    return deserializeWarrantToken(data);
  }
  async batchWriteWarrants(options) {
    const { data: warrantToken } = await this.workos.post("/fga/v1/warrants", options.map(serializeWriteWarrantOptions));
    return deserializeWarrantToken(warrantToken);
  }
  async listWarrants(options, requestOptions) {
    return new AutoPaginatable(await fetchAndDeserialize(this.workos, "/fga/v1/warrants", deserializeWarrant, options ? serializeListWarrantsOptions(options) : undefined, requestOptions), (params) => fetchAndDeserialize(this.workos, "/fga/v1/warrants", deserializeWarrant, params, requestOptions), options ? serializeListWarrantsOptions(options) : undefined);
  }
  async query(options, requestOptions = {}) {
    return new FgaPaginatable(await fetchAndDeserializeFGAList(this.workos, "/fga/v1/query", deserializeQueryResult, serializeQueryOptions(options), requestOptions), (params) => fetchAndDeserializeFGAList(this.workos, "/fga/v1/query", deserializeQueryResult, params, requestOptions), serializeQueryOptions(options));
  }
};
var InMemoryStore = class {
  flags = {};
  swap(newFlags) {
    this.flags = { ...newFlags };
  }
  get(slug) {
    return this.flags[slug];
  }
  getAll() {
    return { ...this.flags };
  }
  get size() {
    return Object.keys(this.flags).length;
  }
};
var Evaluator = class {
  constructor(store) {
    this.store = store;
  }
  isEnabled(flagKey, context = {}, defaultValue = false) {
    const entry = this.store.get(flagKey);
    if (!entry)
      return defaultValue;
    if (!entry.enabled)
      return false;
    if (context.userId) {
      const userTarget = entry.targets.users.find((t) => t.id === context.userId);
      if (userTarget)
        return userTarget.enabled;
    }
    if (context.organizationId) {
      const orgTarget = entry.targets.organizations.find((t) => t.id === context.organizationId);
      if (orgTarget)
        return orgTarget.enabled;
    }
    return entry.default_value;
  }
  getAllFlags(context = {}) {
    const flags = this.store.getAll();
    const result = {};
    for (const slug of Object.keys(flags))
      result[slug] = this.isEnabled(slug, context);
    return result;
  }
};
var DEFAULT_POLLING_INTERVAL_MS = 30000;
var MIN_POLLING_INTERVAL_MS = 5000;
var MIN_DELAY_MS = 1000;
var DEFAULT_REQUEST_TIMEOUT_MS = 1e4;
var JITTER_FACTOR = 0.1;
var INITIAL_RETRY_MS = 1000;
var MAX_RETRY_MS = 60000;
var BACKOFF_MULTIPLIER = 2;
var FeatureFlagsRuntimeClient = class extends import__.default {
  store;
  evaluator;
  pollingIntervalMs;
  requestTimeoutMs;
  logger;
  closed = false;
  initialized = false;
  consecutiveErrors = 0;
  pollTimer = null;
  pollAbortController = null;
  readyResolve = null;
  readyReject = null;
  readyPromise;
  stats = {
    pollCount: 0,
    pollErrorCount: 0,
    lastPollAt: null,
    lastSuccessfulPollAt: null,
    cacheAge: null,
    flagCount: 0
  };
  constructor(workos, options = {}) {
    super();
    this.workos = workos;
    this.pollingIntervalMs = Math.max(MIN_POLLING_INTERVAL_MS, options.pollingIntervalMs ?? DEFAULT_POLLING_INTERVAL_MS);
    this.requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    this.logger = options.logger;
    this.store = new InMemoryStore;
    this.evaluator = new Evaluator(this.store);
    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
    this.readyPromise.catch(() => {});
    if (options.bootstrapFlags) {
      this.store.swap(options.bootstrapFlags);
      this.stats.flagCount = this.store.size;
      this.resolveReady();
    }
    setTimeout(() => this.poll(), 0);
  }
  async waitUntilReady(options) {
    if (!options?.timeoutMs)
      return this.readyPromise;
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(/* @__PURE__ */ new Error("waitUntilReady timed out")), options.timeoutMs);
    });
    timeoutPromise.catch(() => {});
    return Promise.race([this.readyPromise, timeoutPromise]).finally(() => {
      clearTimeout(timeoutId);
    });
  }
  emit(event, ...args) {
    if (event === "error" && this.listenerCount(event) === 0)
      throw args[0] instanceof Error ? args[0] : new Error(String(args[0]));
    return super.emit(event, ...args);
  }
  close() {
    this.closed = true;
    this.pollAbortController?.abort();
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    this.removeAllListeners();
  }
  isEnabled(flagKey, context, defaultValue) {
    return this.evaluator.isEnabled(flagKey, context, defaultValue);
  }
  getAllFlags(context) {
    return this.evaluator.getAllFlags(context);
  }
  getFlag(flagKey) {
    return this.store.get(flagKey);
  }
  getStats() {
    return {
      ...this.stats,
      cacheAge: this.stats.lastSuccessfulPollAt ? Date.now() - this.stats.lastSuccessfulPollAt.getTime() : null
    };
  }
  resolveReady() {
    if (this.readyResolve) {
      this.readyResolve();
      this.readyResolve = null;
    }
  }
  async poll() {
    if (this.closed)
      return;
    const previousFlags = this.store.getAll();
    try {
      this.stats.pollCount++;
      this.stats.lastPollAt = /* @__PURE__ */ new Date;
      const data = await this.fetchWithTimeout();
      this.store.swap(data);
      this.stats.lastSuccessfulPollAt = /* @__PURE__ */ new Date;
      this.stats.flagCount = this.store.size;
      this.consecutiveErrors = 0;
      if (this.initialized)
        this.emitChanges(previousFlags, data);
      this.initialized = true;
      this.resolveReady();
      this.logger?.debug("Poll successful", { flagCount: this.store.size });
    } catch (error) {
      if (this.closed)
        return;
      this.consecutiveErrors++;
      this.stats.pollErrorCount++;
      this.emit("error", error);
      this.logger?.error("Poll failed", error);
      if (error instanceof UnauthorizedException) {
        this.emit("failed", error);
        if (!this.initialized && this.readyReject) {
          this.readyReject(error);
          this.readyReject = null;
        }
        return;
      }
    }
    this.scheduleNextPoll();
  }
  async fetchWithTimeout() {
    this.pollAbortController = new AbortController;
    const { signal } = this.pollAbortController;
    let timeoutId;
    const fetchPromise = this.workos.get("/sdk/feature-flags").then(({ data }) => data);
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        this.pollAbortController?.abort();
        reject(/* @__PURE__ */ new Error("Request timed out"));
      }, this.requestTimeoutMs);
    });
    const abortPromise = new Promise((_, reject) => {
      if (signal.aborted) {
        reject(/* @__PURE__ */ new Error("Poll aborted"));
        return;
      }
      signal.addEventListener("abort", () => reject(/* @__PURE__ */ new Error("Poll aborted")), { once: true });
    });
    return Promise.race([
      fetchPromise,
      timeoutPromise,
      abortPromise
    ]).finally(() => {
      clearTimeout(timeoutId);
    });
  }
  scheduleNextPoll() {
    if (this.closed)
      return;
    let baseDelay = this.pollingIntervalMs;
    if (this.consecutiveErrors > 0) {
      const backoff = Math.min(INITIAL_RETRY_MS * Math.pow(BACKOFF_MULTIPLIER, this.consecutiveErrors - 1), MAX_RETRY_MS);
      baseDelay = Math.max(baseDelay, backoff);
    }
    const jitter = 1 + (Math.random() * 2 - 1) * JITTER_FACTOR;
    const delay = Math.max(MIN_DELAY_MS, baseDelay * jitter);
    this.pollTimer = setTimeout(() => this.poll(), delay);
  }
  emitChanges(previous, current) {
    if (!previous || !current)
      return;
    const allKeys = new Set([...Object.keys(previous), ...Object.keys(current)]);
    for (const key of allKeys) {
      const prev = previous[key];
      const curr = current[key];
      if (this.hasEntryChanged(prev, curr))
        this.emit("change", {
          key,
          previous: prev ?? null,
          current: curr ?? null
        });
    }
  }
  hasEntryChanged(a, b) {
    if (!a || !b)
      return a !== b;
    if (a.enabled !== b.enabled || a.default_value !== b.default_value)
      return true;
    const targetsChanged = (xs, ys) => {
      if (xs.length !== ys.length)
        return true;
      const map = new Map(ys.map((t) => [t.id, t.enabled]));
      return xs.some((t) => map.get(t.id) !== t.enabled);
    };
    return targetsChanged(a.targets.users, b.targets.users) || targetsChanged(a.targets.organizations, b.targets.organizations);
  }
};
var FeatureFlags = class {
  constructor(workos) {
    this.workos = workos;
  }
  async listFeatureFlags(options) {
    return new AutoPaginatable(await fetchAndDeserialize(this.workos, "/feature-flags", deserializeFeatureFlag, options), (params) => fetchAndDeserialize(this.workos, "/feature-flags", deserializeFeatureFlag, params), options);
  }
  async getFeatureFlag(slug) {
    const { data } = await this.workos.get(`/feature-flags/${slug}`);
    return deserializeFeatureFlag(data);
  }
  async enableFeatureFlag(slug) {
    const { data } = await this.workos.put(`/feature-flags/${slug}/enable`, {});
    return deserializeFeatureFlag(data);
  }
  async disableFeatureFlag(slug) {
    const { data } = await this.workos.put(`/feature-flags/${slug}/disable`, {});
    return deserializeFeatureFlag(data);
  }
  async addFlagTarget(options) {
    const { slug, targetId } = options;
    await this.workos.post(`/feature-flags/${slug}/targets/${targetId}`, {});
  }
  async removeFlagTarget(options) {
    const { slug, targetId } = options;
    await this.workos.delete(`/feature-flags/${slug}/targets/${targetId}`);
  }
  createRuntimeClient(options) {
    return new FeatureFlagsRuntimeClient(this.workos, options);
  }
};
var serializeGetTokenOptions = (options) => ({
  organization_id: options.organizationId,
  user_id: options.userId,
  scopes: options.scopes
});
var deserializeGetTokenResponse = (data) => ({ token: data.token });
var Widgets = class {
  constructor(workos) {
    this.workos = workos;
  }
  async getToken(payload) {
    const { data } = await this.workos.post("/widgets/token", serializeGetTokenOptions(payload));
    return deserializeGetTokenResponse(data).token;
  }
};
var deserializeEnvironmentRole = (role) => ({
  object: role.object,
  id: role.id,
  name: role.name,
  slug: role.slug,
  description: role.description,
  permissions: role.permissions,
  resourceTypeSlug: role.resource_type_slug,
  type: role.type,
  createdAt: role.created_at,
  updatedAt: role.updated_at
});
var serializeCreateEnvironmentRoleOptions = (options) => ({
  slug: options.slug,
  name: options.name,
  description: options.description,
  resource_type_slug: options.resourceTypeSlug
});
var serializeUpdateEnvironmentRoleOptions = (options) => ({
  name: options.name,
  description: options.description
});
var serializeCreateOrganizationRoleOptions = (options) => ({
  slug: options.slug,
  name: options.name,
  description: options.description,
  resource_type_slug: options.resourceTypeSlug
});
var serializeUpdateOrganizationRoleOptions = (options) => ({
  name: options.name,
  description: options.description
});
var serializeCreatePermissionOptions = (options) => ({
  slug: options.slug,
  name: options.name,
  description: options.description,
  resource_type_slug: options.resourceTypeSlug
});
var serializeUpdatePermissionOptions = (options) => ({
  name: options.name,
  description: options.description
});
var deserializeAuthorizationResource = (resource) => ({
  object: resource.object,
  id: resource.id,
  externalId: resource.external_id,
  name: resource.name,
  description: resource.description,
  resourceTypeSlug: resource.resource_type_slug,
  organizationId: resource.organization_id,
  parentResourceId: resource.parent_resource_id,
  createdAt: resource.created_at,
  updatedAt: resource.updated_at
});
var serializeCreateResourceOptions = (options) => ({
  organization_id: options.organizationId,
  resource_type_slug: options.resourceTypeSlug,
  external_id: options.externalId,
  name: options.name,
  ...options.description !== undefined && { description: options.description },
  ..."parentResourceId" in options && { parent_resource_id: options.parentResourceId },
  ..."parentResourceExternalId" in options && {
    parent_resource_external_id: options.parentResourceExternalId,
    parent_resource_type_slug: options.parentResourceTypeSlug
  }
});
var serializeUpdateResourceOptions = (options) => ({
  ...options.name !== undefined && { name: options.name },
  ...options.description !== undefined && { description: options.description }
});
var serializeUpdateResourceByExternalIdOptions = (options) => ({
  ...options.name !== undefined && { name: options.name },
  ...options.description !== undefined && { description: options.description }
});
var serializeListAuthorizationResourcesOptions = (options) => ({
  ...options.organizationId && { organization_id: options.organizationId },
  ...options.resourceTypeSlug && { resource_type_slug: options.resourceTypeSlug },
  ...options.parentResourceId && { parent_resource_id: options.parentResourceId },
  ...options.parentResourceTypeSlug && { parent_resource_type_slug: options.parentResourceTypeSlug },
  ...options.parentExternalId && { parent_external_id: options.parentExternalId },
  ...options.search && { search: options.search },
  ...serializePaginationOptions(options)
});
var serializeAuthorizationCheckOptions = (options) => ({
  permission_slug: options.permissionSlug,
  ..."resourceId" in options && { resource_id: options.resourceId },
  ..."resourceExternalId" in options && {
    resource_external_id: options.resourceExternalId,
    resource_type_slug: options.resourceTypeSlug
  }
});
var serializeListResourcesForMembershipOptions = (options) => ({
  permission_slug: options.permissionSlug,
  ...serializePaginationOptions(options),
  ..."parentResourceId" in options && { parent_resource_id: options.parentResourceId },
  ..."parentResourceExternalId" in options && {
    parent_resource_type_slug: options.parentResourceTypeSlug,
    parent_resource_external_id: options.parentResourceExternalId
  }
});
var serializeListMembershipsForResourceOptions = (options) => ({
  permission_slug: options.permissionSlug,
  ...options.assignment && { assignment: options.assignment },
  ...serializePaginationOptions(options)
});
var deserializeRoleAssignment = (response) => ({
  object: response.object,
  id: response.id,
  role: response.role,
  resource: {
    id: response.resource.id,
    externalId: response.resource.external_id,
    resourceTypeSlug: response.resource.resource_type_slug
  },
  createdAt: response.created_at,
  updatedAt: response.updated_at
});
var serializeAssignRoleOptions = (options) => ({
  role_slug: options.roleSlug,
  ..."resourceId" in options && { resource_id: options.resourceId },
  ..."resourceExternalId" in options && {
    resource_external_id: options.resourceExternalId,
    resource_type_slug: options.resourceTypeSlug
  }
});
var serializeRemoveRoleOptions = (options) => ({
  role_slug: options.roleSlug,
  ..."resourceId" in options && { resource_id: options.resourceId },
  ..."resourceExternalId" in options && {
    resource_external_id: options.resourceExternalId,
    resource_type_slug: options.resourceTypeSlug
  }
});
var Authorization = class {
  constructor(workos) {
    this.workos = workos;
  }
  async createEnvironmentRole(options) {
    const { data } = await this.workos.post("/authorization/roles", serializeCreateEnvironmentRoleOptions(options));
    return deserializeEnvironmentRole(data);
  }
  async listEnvironmentRoles() {
    const { data } = await this.workos.get("/authorization/roles");
    return {
      object: "list",
      data: data.data.map(deserializeEnvironmentRole)
    };
  }
  async getEnvironmentRole(slug) {
    const { data } = await this.workos.get(`/authorization/roles/${slug}`);
    return deserializeEnvironmentRole(data);
  }
  async updateEnvironmentRole(slug, options) {
    const { data } = await this.workos.patch(`/authorization/roles/${slug}`, serializeUpdateEnvironmentRoleOptions(options));
    return deserializeEnvironmentRole(data);
  }
  async setEnvironmentRolePermissions(slug, options) {
    const { data } = await this.workos.put(`/authorization/roles/${slug}/permissions`, { permissions: options.permissions });
    return deserializeEnvironmentRole(data);
  }
  async addEnvironmentRolePermission(slug, options) {
    const { data } = await this.workos.post(`/authorization/roles/${slug}/permissions`, { slug: options.permissionSlug });
    return deserializeEnvironmentRole(data);
  }
  async createOrganizationRole(organizationId, options) {
    const { data } = await this.workos.post(`/authorization/organizations/${organizationId}/roles`, serializeCreateOrganizationRoleOptions(options));
    return deserializeOrganizationRole(data);
  }
  async listOrganizationRoles(organizationId) {
    const { data } = await this.workos.get(`/authorization/organizations/${organizationId}/roles`);
    return {
      object: "list",
      data: data.data.map(deserializeRole$1)
    };
  }
  async getOrganizationRole(organizationId, slug) {
    const { data } = await this.workos.get(`/authorization/organizations/${organizationId}/roles/${slug}`);
    return deserializeRole$1(data);
  }
  async updateOrganizationRole(organizationId, slug, options) {
    const { data } = await this.workos.patch(`/authorization/organizations/${organizationId}/roles/${slug}`, serializeUpdateOrganizationRoleOptions(options));
    return deserializeOrganizationRole(data);
  }
  async deleteOrganizationRole(organizationId, slug) {
    await this.workos.delete(`/authorization/organizations/${organizationId}/roles/${slug}`);
  }
  async setOrganizationRolePermissions(organizationId, slug, options) {
    const { data } = await this.workos.put(`/authorization/organizations/${organizationId}/roles/${slug}/permissions`, { permissions: options.permissions });
    return deserializeOrganizationRole(data);
  }
  async addOrganizationRolePermission(organizationId, slug, options) {
    const { data } = await this.workos.post(`/authorization/organizations/${organizationId}/roles/${slug}/permissions`, { slug: options.permissionSlug });
    return deserializeOrganizationRole(data);
  }
  async removeOrganizationRolePermission(organizationId, slug, options) {
    await this.workos.delete(`/authorization/organizations/${organizationId}/roles/${slug}/permissions/${options.permissionSlug}`);
  }
  async createPermission(options) {
    const { data } = await this.workos.post("/authorization/permissions", serializeCreatePermissionOptions(options));
    return deserializePermission(data);
  }
  async listPermissions(options) {
    const { data } = await this.workos.get("/authorization/permissions", { query: options });
    return {
      object: "list",
      data: data.data.map(deserializePermission),
      listMetadata: {
        before: data.list_metadata.before,
        after: data.list_metadata.after
      }
    };
  }
  async getPermission(slug) {
    const { data } = await this.workos.get(`/authorization/permissions/${slug}`);
    return deserializePermission(data);
  }
  async updatePermission(slug, options) {
    const { data } = await this.workos.patch(`/authorization/permissions/${slug}`, serializeUpdatePermissionOptions(options));
    return deserializePermission(data);
  }
  async deletePermission(slug) {
    await this.workos.delete(`/authorization/permissions/${slug}`);
  }
  async getResource(resourceId) {
    const { data } = await this.workos.get(`/authorization/resources/${resourceId}`);
    return deserializeAuthorizationResource(data);
  }
  async createResource(options) {
    const { data } = await this.workos.post("/authorization/resources", serializeCreateResourceOptions(options));
    return deserializeAuthorizationResource(data);
  }
  async updateResource(options) {
    const { data } = await this.workos.patch(`/authorization/resources/${options.resourceId}`, serializeUpdateResourceOptions(options));
    return deserializeAuthorizationResource(data);
  }
  async deleteResource(options) {
    const { resourceId, cascadeDelete } = options;
    const query = cascadeDelete !== undefined ? { cascade_delete: cascadeDelete.toString() } : undefined;
    await this.workos.delete(`/authorization/resources/${resourceId}`, query);
  }
  async listResources(options = {}) {
    const { data } = await this.workos.get("/authorization/resources", { query: serializeListAuthorizationResourcesOptions(options) });
    return {
      object: "list",
      data: data.data.map(deserializeAuthorizationResource),
      listMetadata: {
        before: data.list_metadata.before,
        after: data.list_metadata.after
      }
    };
  }
  async getResourceByExternalId(options) {
    const { organizationId, resourceTypeSlug, externalId } = options;
    const { data } = await this.workos.get(`/authorization/organizations/${organizationId}/resources/${resourceTypeSlug}/${externalId}`);
    return deserializeAuthorizationResource(data);
  }
  async updateResourceByExternalId(options) {
    const { organizationId, resourceTypeSlug, externalId } = options;
    const { data } = await this.workos.patch(`/authorization/organizations/${organizationId}/resources/${resourceTypeSlug}/${externalId}`, serializeUpdateResourceByExternalIdOptions(options));
    return deserializeAuthorizationResource(data);
  }
  async deleteResourceByExternalId(options) {
    const { organizationId, resourceTypeSlug, externalId, cascadeDelete } = options;
    const query = cascadeDelete !== undefined ? { cascade_delete: cascadeDelete.toString() } : undefined;
    await this.workos.delete(`/authorization/organizations/${organizationId}/resources/${resourceTypeSlug}/${externalId}`, query);
  }
  async check(options) {
    const { data } = await this.workos.post(`/authorization/organization_memberships/${options.organizationMembershipId}/check`, serializeAuthorizationCheckOptions(options));
    return data;
  }
  async listRoleAssignments(options) {
    const { organizationMembershipId, ...queryOptions } = options;
    const { data } = await this.workos.get(`/authorization/organization_memberships/${organizationMembershipId}/role_assignments`, { query: queryOptions });
    return {
      object: "list",
      data: data.data.map(deserializeRoleAssignment),
      listMetadata: {
        before: data.list_metadata.before,
        after: data.list_metadata.after
      }
    };
  }
  async assignRole(options) {
    const { data } = await this.workos.post(`/authorization/organization_memberships/${options.organizationMembershipId}/role_assignments`, serializeAssignRoleOptions(options));
    return deserializeRoleAssignment(data);
  }
  async removeRole(options) {
    await this.workos.deleteWithBody(`/authorization/organization_memberships/${options.organizationMembershipId}/role_assignments`, serializeRemoveRoleOptions(options));
  }
  async removeRoleAssignment(options) {
    await this.workos.delete(`/authorization/organization_memberships/${options.organizationMembershipId}/role_assignments/${options.roleAssignmentId}`);
  }
  async listResourcesForMembership(options) {
    const { organizationMembershipId } = options;
    const { data } = await this.workos.get(`/authorization/organization_memberships/${organizationMembershipId}/resources`, { query: serializeListResourcesForMembershipOptions(options) });
    return {
      object: "list",
      data: data.data.map(deserializeAuthorizationResource),
      listMetadata: {
        before: data.list_metadata.before,
        after: data.list_metadata.after
      }
    };
  }
  async listMembershipsForResource(options) {
    const { resourceId } = options;
    const { data } = await this.workos.get(`/authorization/resources/${resourceId}/organization_memberships`, { query: serializeListMembershipsForResourceOptions(options) });
    return {
      object: "list",
      data: data.data.map(deserializeAuthorizationOrganizationMembership),
      listMetadata: {
        before: data.list_metadata.before,
        after: data.list_metadata.after
      }
    };
  }
  async listMembershipsForResourceByExternalId(options) {
    const { organizationId, resourceTypeSlug, externalId } = options;
    const { data } = await this.workos.get(`/authorization/organizations/${organizationId}/resources/${resourceTypeSlug}/${externalId}/organization_memberships`, { query: serializeListMembershipsForResourceOptions(options) });
    return {
      object: "list",
      data: data.data.map(deserializeAuthorizationOrganizationMembership),
      listMetadata: {
        before: data.list_metadata.before,
        after: data.list_metadata.after
      }
    };
  }
};
var MAX_UINT32 = 4294967295;
var CONTINUATION_BIT = 128;
var DATA_BITS_MASK = 127;
var DATA_BITS_PER_BYTE = 7;
var MAX_BYTES_FOR_UINT32 = 5;
function encodeUInt32(value) {
  validateUInt32(value);
  if (value === 0)
    return new Uint8Array([0]);
  const bytes = [];
  do {
    let byte = value & DATA_BITS_MASK;
    value >>>= DATA_BITS_PER_BYTE;
    if (value !== 0)
      byte |= CONTINUATION_BIT;
    bytes.push(byte);
  } while (value !== 0);
  return new Uint8Array(bytes);
}
function decodeUInt32(data, offset = 0) {
  validateOffset(data, offset);
  let result = 0;
  let shift = 0;
  let index = offset;
  let bytesRead = 0;
  while (index < data.length) {
    const byte = data[index++];
    bytesRead++;
    if (bytesRead > MAX_BYTES_FOR_UINT32)
      throw new Error("LEB128 sequence exceeds maximum length for uint32");
    result |= (byte & DATA_BITS_MASK) << shift;
    if (!hasContinuationBit(byte))
      return {
        value: result >>> 0,
        nextIndex: index
      };
    shift += DATA_BITS_PER_BYTE;
  }
  throw new Error("Truncated LEB128 encoding");
}
function validateUInt32(value) {
  if (!Number.isFinite(value))
    throw new Error("Value must be a finite number");
  if (!Number.isInteger(value))
    throw new Error("Value must be an integer");
  if (value < 0)
    throw new Error("Value must be non-negative");
  if (value > MAX_UINT32)
    throw new Error(`Value must not exceed ${MAX_UINT32} (MAX_UINT32)`);
}
function validateOffset(data, offset) {
  if (offset < 0 || offset >= data.length)
    throw new Error(`Offset ${offset} is out of bounds (buffer length: ${data.length})`);
}
function hasContinuationBit(byte) {
  return (byte & CONTINUATION_BIT) !== 0;
}
function base64ToUint8Array(base64) {
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0;i < binary.length; i++)
      bytes[i] = binary.charCodeAt(i);
    return bytes;
  } else if (typeof Buffer !== "undefined")
    return new Uint8Array(Buffer.from(base64, "base64"));
  else
    throw new Error("No base64 decoding implementation available");
}
function uint8ArrayToBase64(bytes) {
  if (typeof btoa === "function") {
    let binary = "";
    for (let i = 0;i < bytes.byteLength; i++)
      binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } else if (typeof Buffer !== "undefined")
    return Buffer.from(bytes).toString("base64");
  else
    throw new Error("No base64 encoding implementation available");
}
var deserializeCreateDataKeyResponse = (key) => ({
  context: key.context,
  dataKey: {
    key: key.data_key,
    id: key.id
  },
  encryptedKeys: key.encrypted_keys
});
var deserializeDecryptDataKeyResponse = (key) => ({
  key: key.data_key,
  id: key.id
});
var deserializeObjectMetadata = (metadata) => ({
  context: metadata.context,
  environmentId: metadata.environment_id,
  id: metadata.id,
  keyId: metadata.key_id,
  updatedAt: new Date(Date.parse(metadata.updated_at)),
  updatedBy: metadata.updated_by,
  versionId: metadata.version_id
});
var deserializeObject = (object) => ({
  id: object.id,
  name: object.name,
  ...object.value !== undefined && { value: object.value },
  metadata: deserializeObjectMetadata(object.metadata)
});
var deserializeObjectDigest = (digest2) => ({
  id: digest2.id,
  name: digest2.name,
  updatedAt: new Date(Date.parse(digest2.updated_at))
});
var deserializeListObjects = (list) => ({
  object: "list",
  data: list.data.map(deserializeObjectDigest),
  listMetadata: {
    ...list.list_metadata.after !== undefined && { after: list.list_metadata.after },
    ...list.list_metadata.before !== undefined && { before: list.list_metadata.before }
  }
});
var desrializeListObjectVersions = (list) => list.data.map(deserializeObjectVersion);
var deserializeObjectVersion = (version) => ({
  createdAt: new Date(Date.parse(version.created_at)),
  currentVersion: version.current_version,
  id: version.id
});
var serializeCreateObjectEntity = (options) => ({
  name: options.name,
  value: options.value,
  key_context: options.context
});
var serializeUpdateObjectEntity = (options) => ({
  value: options.value,
  version_check: options.versionCheck
});
var Vault = class {
  cryptoProvider;
  constructor(workos) {
    this.workos = workos;
    this.cryptoProvider = workos.getCryptoProvider();
  }
  decode(payload) {
    const inputData = base64ToUint8Array(payload);
    const iv = new Uint8Array(inputData.subarray(0, 12));
    const tag2 = new Uint8Array(inputData.subarray(12, 28));
    const { value: keyLen, nextIndex } = decodeUInt32(inputData, 28);
    return {
      iv,
      tag: tag2,
      keys: uint8ArrayToBase64(inputData.subarray(nextIndex, nextIndex + keyLen)),
      ciphertext: new Uint8Array(inputData.subarray(nextIndex + keyLen))
    };
  }
  async createObject(options) {
    const { data } = await this.workos.post(`/vault/v1/kv`, serializeCreateObjectEntity(options));
    return deserializeObjectMetadata(data);
  }
  async listObjects(options) {
    const url = new URL("/vault/v1/kv", this.workos.baseURL);
    if (options?.after)
      url.searchParams.set("after", options.after);
    if (options?.before)
      url.searchParams.set("before", options.before);
    if (options?.limit)
      url.searchParams.set("limit", options.limit.toString());
    if (options?.order)
      url.searchParams.set("order", options.order);
    const { data } = await this.workos.get(url.toString());
    return deserializeListObjects(data);
  }
  async listObjectVersions(options) {
    const { data } = await this.workos.get(`/vault/v1/kv/${encodeURIComponent(options.id)}/versions`);
    return desrializeListObjectVersions(data);
  }
  async readObject(options) {
    const { data } = await this.workos.get(`/vault/v1/kv/${encodeURIComponent(options.id)}`);
    return deserializeObject(data);
  }
  async readObjectByName(name) {
    const { data } = await this.workos.get(`/vault/v1/kv/name/${encodeURIComponent(name)}`);
    return deserializeObject(data);
  }
  async describeObject(options) {
    const { data } = await this.workos.get(`/vault/v1/kv/${encodeURIComponent(options.id)}/metadata`);
    return deserializeObject(data);
  }
  async updateObject(options) {
    const { data } = await this.workos.put(`/vault/v1/kv/${encodeURIComponent(options.id)}`, serializeUpdateObjectEntity(options));
    return deserializeObject(data);
  }
  async deleteObject(options) {
    return this.workos.delete(`/vault/v1/kv/${encodeURIComponent(options.id)}`);
  }
  async createDataKey(options) {
    const { data } = await this.workos.post(`/vault/v1/keys/data-key`, options);
    return deserializeCreateDataKeyResponse(data);
  }
  async decryptDataKey(options) {
    const { data } = await this.workos.post(`/vault/v1/keys/decrypt`, options);
    return deserializeDecryptDataKeyResponse(data);
  }
  async encrypt(data, context, associatedData) {
    const keyPair = await this.createDataKey({ context });
    const encoder2 = new TextEncoder;
    const key = base64ToUint8Array(keyPair.dataKey.key);
    const keyBlob = base64ToUint8Array(keyPair.encryptedKeys);
    const prefixLenBuffer = encodeUInt32(keyBlob.length);
    const aadBuffer = associatedData ? encoder2.encode(associatedData) : undefined;
    const iv = this.cryptoProvider.randomBytes(12);
    const { ciphertext, iv: resultIv, tag: tag2 } = await this.cryptoProvider.encrypt(encoder2.encode(data), key, iv, aadBuffer);
    const resultArray = new Uint8Array(resultIv.length + tag2.length + prefixLenBuffer.length + keyBlob.length + ciphertext.length);
    let offset = 0;
    resultArray.set(resultIv, offset);
    offset += resultIv.length;
    resultArray.set(tag2, offset);
    offset += tag2.length;
    resultArray.set(new Uint8Array(prefixLenBuffer), offset);
    offset += prefixLenBuffer.length;
    resultArray.set(keyBlob, offset);
    offset += keyBlob.length;
    resultArray.set(ciphertext, offset);
    return uint8ArrayToBase64(resultArray);
  }
  async decrypt(encryptedData, associatedData) {
    const decoded = this.decode(encryptedData);
    const key = base64ToUint8Array((await this.decryptDataKey({ keys: decoded.keys })).key);
    const encoder2 = new TextEncoder;
    const aadBuffer = associatedData ? encoder2.encode(associatedData) : undefined;
    const decrypted = await this.cryptoProvider.decrypt(decoded.ciphertext, key, decoded.iv, decoded.tag, aadBuffer);
    return new TextDecoder().decode(decrypted);
  }
};
var ConflictException = class extends Error {
  status = 409;
  name = "ConflictException";
  requestID;
  constructor({ error, message: message2, requestID }) {
    super();
    this.requestID = requestID;
    if (message2)
      this.message = message2;
    else if (error)
      this.message = `Error: ${error}`;
    else
      this.message = `An conflict has occurred on the server.`;
  }
};
function getRuntimeInfo() {
  const name = detectRuntime();
  let version;
  try {
    switch (name) {
      case "node":
        version = typeof process !== "undefined" ? process.version : undefined;
        break;
      case "deno":
        version = globalThis.Deno?.version?.deno;
        break;
      case "bun":
        version = globalThis.Bun?.version || extractBunVersionFromUserAgent();
        break;
      default:
        version = undefined;
        break;
    }
  } catch {
    version = undefined;
  }
  return {
    name,
    version
  };
}
function extractBunVersionFromUserAgent() {
  try {
    if (typeof navigator !== "undefined" && navigator.userAgent)
      return navigator.userAgent.match(/Bun\/(\d+\.\d+\.\d+)/)?.[1];
  } catch {}
}
var version = "8.13.0";
var DEFAULT_HOSTNAME = "api.workos.com";
var HEADER_AUTHORIZATION = "Authorization";
var HEADER_IDEMPOTENCY_KEY = "Idempotency-Key";
var HEADER_WARRANT_TOKEN = "Warrant-Token";
var WorkOS = class {
  baseURL;
  client;
  clientId;
  key;
  options;
  pkce;
  hasApiKey;
  actions;
  apiKeys = new ApiKeys(this);
  auditLogs = new AuditLogs(this);
  authorization = new Authorization(this);
  directorySync = new DirectorySync(this);
  events = new Events(this);
  featureFlags = new FeatureFlags(this);
  fga = new FGA(this);
  mfa = new Mfa(this);
  organizations = new Organizations(this);
  organizationDomains = new OrganizationDomains(this);
  passwordless = new Passwordless(this);
  pipes = new Pipes(this);
  portal = new Portal(this);
  sso = new SSO(this);
  userManagement;
  vault = new Vault(this);
  webhooks;
  widgets = new Widgets(this);
  constructor(keyOrOptions, maybeOptions) {
    if (typeof keyOrOptions === "object") {
      this.key = keyOrOptions.apiKey;
      this.options = keyOrOptions;
    } else {
      this.key = keyOrOptions;
      this.options = maybeOptions ?? {};
    }
    if (!this.key)
      this.key = getEnv("WORKOS_API_KEY");
    this.hasApiKey = !!this.key;
    if (this.options.https === undefined)
      this.options.https = true;
    this.clientId = this.options.clientId;
    if (!this.clientId)
      this.clientId = getEnv("WORKOS_CLIENT_ID");
    if (!this.hasApiKey && !this.clientId)
      throw new Error('WorkOS requires either an API key or a clientId. For server-side: new WorkOS("sk_...") or new WorkOS({ apiKey: "sk_..." }). For PKCE/public clients: new WorkOS({ clientId: "client_..." })');
    const protocol = this.options.https ? "https" : "http";
    const apiHostname = this.options.apiHostname || DEFAULT_HOSTNAME;
    const port = this.options.port;
    this.baseURL = `${protocol}://${apiHostname}`;
    if (port)
      this.baseURL = this.baseURL + `:${port}`;
    this.pkce = new PKCE;
    this.webhooks = this.createWebhookClient();
    this.actions = this.createActionsClient();
    this.userManagement = new UserManagement(this);
    const userAgent = this.createUserAgent(this.options);
    this.client = this.createHttpClient(this.options, userAgent);
  }
  createUserAgent(options) {
    let userAgent = `workos-node/${version}`;
    const { name: runtimeName, version: runtimeVersion } = getRuntimeInfo();
    userAgent += ` (${runtimeName}${runtimeVersion ? `/${runtimeVersion}` : ""})`;
    if (options.appInfo) {
      const { name, version: version2 } = options.appInfo;
      userAgent += ` ${name}: ${version2}`;
    }
    return userAgent;
  }
  createWebhookClient() {
    return new Webhooks(this.getCryptoProvider());
  }
  createActionsClient() {
    return new Actions(this.getCryptoProvider());
  }
  getCryptoProvider() {
    return new SubtleCryptoProvider;
  }
  createHttpClient(options, userAgent) {
    const headers = { "User-Agent": userAgent };
    const configHeaders = options.config?.headers;
    if (configHeaders && typeof configHeaders === "object" && !Array.isArray(configHeaders) && !(configHeaders instanceof Headers))
      Object.assign(headers, configHeaders);
    if (this.key)
      headers["Authorization"] = `Bearer ${this.key}`;
    return new FetchHttpClient(this.baseURL, {
      ...options.config,
      timeout: options.timeout,
      headers
    });
  }
  get version() {
    return version;
  }
  requireApiKey(methodName) {
    if (!this.hasApiKey)
      throw new ApiKeyRequiredException(methodName);
  }
  async post(path, entity, options = {}) {
    if (!options.skipApiKeyCheck)
      this.requireApiKey(path);
    const requestHeaders = {};
    if (options.idempotencyKey)
      requestHeaders[HEADER_IDEMPOTENCY_KEY] = options.idempotencyKey;
    if (options.warrantToken)
      requestHeaders[HEADER_WARRANT_TOKEN] = options.warrantToken;
    let res;
    try {
      res = await this.client.post(path, entity, {
        params: options.query,
        headers: requestHeaders
      });
    } catch (error) {
      this.handleHttpError({
        path,
        error
      });
      throw error;
    }
    try {
      return { data: await res.toJSON() };
    } catch (error) {
      await this.handleParseError(error, res);
      throw error;
    }
  }
  async get(path, options = {}) {
    if (!options.skipApiKeyCheck)
      this.requireApiKey(path);
    const requestHeaders = {};
    if (options.accessToken)
      requestHeaders[HEADER_AUTHORIZATION] = `Bearer ${options.accessToken}`;
    if (options.warrantToken)
      requestHeaders[HEADER_WARRANT_TOKEN] = options.warrantToken;
    let res;
    try {
      res = await this.client.get(path, {
        params: options.query,
        headers: requestHeaders
      });
    } catch (error) {
      this.handleHttpError({
        path,
        error
      });
      throw error;
    }
    try {
      return { data: await res.toJSON() };
    } catch (error) {
      await this.handleParseError(error, res);
      throw error;
    }
  }
  async put(path, entity, options = {}) {
    if (!options.skipApiKeyCheck)
      this.requireApiKey(path);
    const requestHeaders = {};
    if (options.idempotencyKey)
      requestHeaders[HEADER_IDEMPOTENCY_KEY] = options.idempotencyKey;
    let res;
    try {
      res = await this.client.put(path, entity, {
        params: options.query,
        headers: requestHeaders
      });
    } catch (error) {
      this.handleHttpError({
        path,
        error
      });
      throw error;
    }
    try {
      return { data: await res.toJSON() };
    } catch (error) {
      await this.handleParseError(error, res);
      throw error;
    }
  }
  async patch(path, entity, options = {}) {
    if (!options.skipApiKeyCheck)
      this.requireApiKey(path);
    const requestHeaders = {};
    if (options.idempotencyKey)
      requestHeaders[HEADER_IDEMPOTENCY_KEY] = options.idempotencyKey;
    let res;
    try {
      res = await this.client.patch(path, entity, {
        params: options.query,
        headers: requestHeaders
      });
    } catch (error) {
      this.handleHttpError({
        path,
        error
      });
      throw error;
    }
    try {
      return { data: await res.toJSON() };
    } catch (error) {
      await this.handleParseError(error, res);
      throw error;
    }
  }
  async delete(path, query) {
    this.requireApiKey(path);
    try {
      await this.client.delete(path, { params: query });
    } catch (error) {
      this.handleHttpError({
        path,
        error
      });
      throw error;
    }
  }
  async deleteWithBody(path, entity) {
    this.requireApiKey(path);
    try {
      await this.client.deleteWithBody(path, entity, {});
    } catch (error) {
      this.handleHttpError({
        path,
        error
      });
      throw error;
    }
  }
  emitWarning(warning) {
    console.warn(`WorkOS: ${warning}`);
  }
  async handleParseError(error, res) {
    if (error instanceof SyntaxError) {
      const rawResponse = res.getRawResponse();
      const requestID = rawResponse.headers.get("X-Request-ID") ?? "";
      const rawStatus = rawResponse.status;
      const rawBody = await rawResponse.text();
      throw new ParseError({
        message: error.message,
        rawBody,
        rawStatus,
        requestID
      });
    }
  }
  handleHttpError({ path, error }) {
    if (!(error instanceof HttpClientError))
      throw new Error(`Unexpected error: ${error}`, { cause: error });
    const { response } = error;
    if (response) {
      const { status, data, headers } = response;
      const requestID = headers["X-Request-ID"] ?? "";
      const { code, error_description: errorDescription, error: error2, errors, message: message2 } = data;
      switch (status) {
        case 401:
          throw new UnauthorizedException(requestID);
        case 409:
          throw new ConflictException({
            requestID,
            message: message2,
            error: error2
          });
        case 422:
          throw new UnprocessableEntityException({
            code,
            errors,
            message: message2,
            requestID
          });
        case 404:
          throw new NotFoundException({
            code,
            message: message2,
            path,
            requestID
          });
        case 429: {
          const retryAfter = headers.get("Retry-After");
          throw new RateLimitExceededException(data.message, requestID, retryAfter ? Number(retryAfter) : null);
        }
        default:
          if (error2 || errorDescription)
            throw new OauthException(status, requestID, error2, errorDescription, data);
          else if (code && errors)
            throw new BadRequestException({
              code,
              errors,
              message: message2,
              requestID
            });
          else
            throw new GenericServerException(status, data.message, data, requestID);
      }
    }
  }
};

// ../../node_modules/@workos-inc/node/lib/index.mjs
var WorkOSNode = class extends WorkOS {
  createHttpClient(options, userAgent) {
    const headers = {};
    const configHeaders = options.config?.headers;
    if (configHeaders)
      if (configHeaders instanceof Headers)
        configHeaders.forEach((v, k) => headers[k] = v);
      else if (Array.isArray(configHeaders))
        configHeaders.forEach(([k, v]) => headers[k] = v);
      else
        Object.assign(headers, configHeaders);
    headers["User-Agent"] = userAgent;
    if (this.key)
      headers["Authorization"] = `Bearer ${this.key}`;
    const opts = {
      ...options.config,
      timeout: options.timeout,
      headers
    };
    return new FetchHttpClient(this.baseURL, opts, options.fetchFn);
  }
  createWebhookClient() {
    return new Webhooks(this.getCryptoProvider());
  }
  getCryptoProvider() {
    return new SubtleCryptoProvider;
  }
  createActionsClient() {
    return new Actions(this.getCryptoProvider());
  }
  emitWarning(warning) {
    return process.emitWarning(warning, "WorkOS");
  }
};

// ../../node_modules/typebox/build/system/memory/memory.mjs
var exports_memory = {};
__export(exports_memory, {
  Update: () => Update,
  Metrics: () => Metrics,
  Discard: () => Discard,
  Create: () => Create,
  Clone: () => Clone,
  Assign: () => Assign
});

// ../../node_modules/typebox/build/system/memory/metrics.mjs
var Metrics = {
  assign: 0,
  create: 0,
  clone: 0,
  discard: 0,
  update: 0
};

// ../../node_modules/typebox/build/system/memory/assign.mjs
function Assign(left, right) {
  Metrics.assign += 1;
  return { ...left, ...right };
}
// ../../node_modules/typebox/build/guard/guard.mjs
var exports_guard = {};
__export(exports_guard, {
  Values: () => Values,
  Symbols: () => Symbols,
  SomeAll: () => SomeAll,
  Some: () => Some,
  ShiftLeft: () => ShiftLeft,
  Keys: () => Keys,
  IsValueLike: () => IsValueLike,
  IsUnsafePropertyKey: () => IsUnsafePropertyKey,
  IsUndefined: () => IsUndefined,
  IsSymbol: () => IsSymbol,
  IsString: () => IsString,
  IsObjectNotArray: () => IsObjectNotArray,
  IsObject: () => IsObject,
  IsNumber: () => IsNumber,
  IsNull: () => IsNull,
  IsMultipleOf: () => IsMultipleOf,
  IsMinLength: () => IsMinLength2,
  IsMaxLength: () => IsMaxLength2,
  IsLessThan: () => IsLessThan,
  IsLessEqualThan: () => IsLessEqualThan,
  IsInteger: () => IsInteger,
  IsGreaterThan: () => IsGreaterThan,
  IsGreaterEqualThan: () => IsGreaterEqualThan,
  IsFunction: () => IsFunction,
  IsEqual: () => IsEqual,
  IsDeepEqual: () => IsDeepEqual,
  IsConstructor: () => IsConstructor,
  IsClassInstance: () => IsClassInstance,
  IsBoolean: () => IsBoolean,
  IsBigInt: () => IsBigInt,
  IsArray: () => IsArray,
  HasPropertyKey: () => HasPropertyKey,
  GraphemeCount: () => GraphemeCount2,
  EveryAll: () => EveryAll,
  Every: () => Every,
  EntriesRegExp: () => EntriesRegExp,
  Entries: () => Entries,
  Counted: () => Counted
});

// ../../node_modules/typebox/build/guard/string.mjs
function IsBetween(value, min, max) {
  return value >= min && value <= max;
}
function IsZeroWidthJoiner(value) {
  return value === 8205;
}
function IsHighSurrogate(value) {
  return IsBetween(value, 55296, 56319);
}
function IsRegionalIndicator(value) {
  return IsBetween(value, 127462, 127487);
}
function IsVariationSelector(value) {
  return IsBetween(value, 65024, 65039);
}
function IsCombiningMark(value) {
  return IsBetween(value, 768, 879) || IsBetween(value, 6832, 6911) || IsBetween(value, 7616, 7679) || IsBetween(value, 65056, 65071);
}
function CodePointLength(value) {
  return value > 65535 ? 2 : 1;
}
function ConsumeModifiers(value, index) {
  while (index < value.length) {
    const point = value.codePointAt(index);
    if (IsCombiningMark(point) || IsVariationSelector(point)) {
      index += CodePointLength(point);
    } else {
      break;
    }
  }
  return index;
}
function NextGraphemeClusterIndex(value, clusterStart) {
  const startCP = value.codePointAt(clusterStart);
  let clusterEnd = clusterStart + CodePointLength(startCP);
  clusterEnd = ConsumeModifiers(value, clusterEnd);
  while (clusterEnd < value.length - 1 && value[clusterEnd] === "‍") {
    const nextCP = value.codePointAt(clusterEnd + 1);
    clusterEnd += 1 + CodePointLength(nextCP);
    clusterEnd = ConsumeModifiers(value, clusterEnd);
  }
  if (IsRegionalIndicator(startCP) && clusterEnd < value.length && IsRegionalIndicator(value.codePointAt(clusterEnd))) {
    clusterEnd += CodePointLength(value.codePointAt(clusterEnd));
  }
  return clusterEnd;
}
function IsGraphemeCodePoint(value) {
  return IsHighSurrogate(value) || IsCombiningMark(value) || IsVariationSelector(value) || IsZeroWidthJoiner(value);
}
function GraphemeCount(value) {
  let count = 0;
  let index = 0;
  while (index < value.length) {
    index = NextGraphemeClusterIndex(value, index);
    count++;
  }
  return count;
}
function IsMinLength(value, minLength) {
  if (minLength === 0)
    return true;
  let count = 0;
  let index = 0;
  while (index < value.length) {
    index = NextGraphemeClusterIndex(value, index);
    count++;
    if (count >= minLength)
      return true;
  }
  return false;
}
function IsMaxLength(value, maxLength) {
  let count = 0;
  let index = 0;
  while (index < value.length) {
    index = NextGraphemeClusterIndex(value, index);
    count++;
    if (count > maxLength)
      return false;
  }
  return true;
}
function IsMinLengthFast(value, minLength) {
  if (minLength === 0)
    return true;
  let index = 0;
  while (index < value.length) {
    if (IsGraphemeCodePoint(value.charCodeAt(index))) {
      return IsMinLength(value, minLength);
    }
    index++;
    if (index >= minLength)
      return true;
  }
  return false;
}
function IsMaxLengthFast(value, maxLength) {
  let index = 0;
  while (index < value.length) {
    if (IsGraphemeCodePoint(value.charCodeAt(index))) {
      return IsMaxLength(value, maxLength);
    }
    index++;
    if (index > maxLength)
      return false;
  }
  return true;
}

// ../../node_modules/typebox/build/guard/guard.mjs
function IsArray(value) {
  return Array.isArray(value);
}
function IsBigInt(value) {
  return IsEqual(typeof value, "bigint");
}
function IsBoolean(value) {
  return IsEqual(typeof value, "boolean");
}
function IsConstructor(value) {
  if (IsUndefined(value) || !IsFunction(value))
    return false;
  const result = Function.prototype.toString.call(value);
  if (/^class\s/.test(result))
    return true;
  if (/\[native code\]/.test(result))
    return true;
  return false;
}
function IsFunction(value) {
  return IsEqual(typeof value, "function");
}
function IsInteger(value) {
  return Number.isInteger(value);
}
function IsNull(value) {
  return IsEqual(value, null);
}
function IsNumber(value) {
  return Number.isFinite(value);
}
function IsObjectNotArray(value) {
  return IsObject(value) && !IsArray(value);
}
function IsObject(value) {
  return IsEqual(typeof value, "object") && !IsNull(value);
}
function IsString(value) {
  return IsEqual(typeof value, "string");
}
function IsSymbol(value) {
  return IsEqual(typeof value, "symbol");
}
function IsUndefined(value) {
  return IsEqual(value, undefined);
}
function IsEqual(left, right) {
  return left === right;
}
function IsGreaterThan(left, right) {
  return left > right;
}
function IsLessThan(left, right) {
  return left < right;
}
function IsLessEqualThan(left, right) {
  return left <= right;
}
function IsGreaterEqualThan(left, right) {
  return left >= right;
}
function IsMultipleOf(dividend, divisor) {
  if (IsBigInt(dividend) || IsBigInt(divisor)) {
    return BigInt(dividend) % BigInt(divisor) === 0n;
  }
  const tolerance = 0.0000000001;
  if (!IsNumber(dividend))
    return true;
  if (IsInteger(dividend) && 1 / divisor % 1 === 0)
    return true;
  const mod = dividend % divisor;
  return Math.min(Math.abs(mod), Math.abs(mod - divisor), Math.abs(mod + divisor)) < tolerance;
}
function IsClassInstance(value) {
  if (!IsObject(value))
    return false;
  const proto = globalThis.Object.getPrototypeOf(value);
  if (IsNull(proto))
    return false;
  return IsEqual(typeof proto.constructor, "function") && !(IsEqual(proto.constructor, globalThis.Object) || IsEqual(proto.constructor.name, "Object"));
}
function IsValueLike(value) {
  return IsBigInt(value) || IsBoolean(value) || IsNull(value) || IsNumber(value) || IsString(value) || IsUndefined(value);
}
function GraphemeCount2(value) {
  return GraphemeCount(value);
}
function IsMaxLength2(value, length) {
  return IsMaxLengthFast(value, length);
}
function IsMinLength2(value, length) {
  return IsMinLengthFast(value, length);
}
function Every(value, offset, callback) {
  for (let index = offset;index < value.length; index++) {
    if (!callback(value[index], index))
      return false;
  }
  return true;
}
function EveryAll(value, offset, callback) {
  let result = true;
  for (let index = offset;index < value.length; index++) {
    if (!callback(value[index], index))
      result = false;
  }
  return result;
}
function Some(value, callback) {
  for (let index = 0;index < value.length; index++) {
    if (callback(value[index], index))
      return true;
  }
  return false;
}
function SomeAll(value, callback) {
  let result = false;
  for (let index = 0;index < value.length; index++) {
    if (callback(value[index], index))
      result = true;
  }
  return result;
}
function Counted(value, callback) {
  return value.reduce((result, value2, index) => callback(value2, index) ? ++result : result, 0);
}
function ShiftLeft(array, true_, false_) {
  return IsEqual(array.length, 0) ? false_() : true_(array[0], array.slice(1));
}
function IsUnsafePropertyKey(key) {
  return IsEqual(key, "__proto__") || IsEqual(key, "constructor") || IsEqual(key, "prototype");
}
function HasPropertyKey(value, key) {
  return IsUnsafePropertyKey(key) ? Object.prototype.hasOwnProperty.call(value, key) : (key in value);
}
function EntriesRegExp(value) {
  return Keys(value).map((key) => [new RegExp(`^${key}$`), value[key]]);
}
function Entries(value) {
  return Object.entries(value);
}
function Keys(value) {
  return Object.getOwnPropertyNames(value);
}
function Symbols(value) {
  return Object.getOwnPropertySymbols(value);
}
function Values(value) {
  return Object.values(value);
}
function DeepEqualObject(left, right) {
  if (!IsObject(right))
    return false;
  const keys = Keys(left);
  return IsEqual(keys.length, Keys(right).length) && keys.every((key) => IsDeepEqual(left[key], right[key]));
}
function DeepEqualArray(left, right) {
  return IsArray(right) && IsEqual(left.length, right.length) && left.every((_, index) => IsDeepEqual(left[index], right[index]));
}
function IsDeepEqual(left, right) {
  return IsArray(left) ? DeepEqualArray(left, right) : IsObject(left) ? DeepEqualObject(left, right) : IsEqual(left, right);
}
// ../../node_modules/typebox/build/guard/globals.mjs
var exports_globals = {};
__export(exports_globals, {
  IsUint8ClampedArray: () => IsUint8ClampedArray,
  IsUint8Array: () => IsUint8Array,
  IsUint32Array: () => IsUint32Array,
  IsUint16Array: () => IsUint16Array,
  IsTypeArray: () => IsTypeArray,
  IsString: () => IsString2,
  IsSet: () => IsSet,
  IsRegExp: () => IsRegExp,
  IsNumber: () => IsNumber2,
  IsMap: () => IsMap,
  IsInt8Array: () => IsInt8Array,
  IsInt32Array: () => IsInt32Array,
  IsInt16Array: () => IsInt16Array,
  IsFloat64Array: () => IsFloat64Array,
  IsFloat32Array: () => IsFloat32Array,
  IsDate: () => IsDate,
  IsBoolean: () => IsBoolean2,
  IsBigUint64Array: () => IsBigUint64Array,
  IsBigInt64Array: () => IsBigInt64Array
});
function IsBoolean2(value) {
  return value instanceof Boolean;
}
function IsNumber2(value) {
  return value instanceof Number;
}
function IsString2(value) {
  return value instanceof String;
}
function IsTypeArray(value) {
  return globalThis.ArrayBuffer.isView(value);
}
function IsInt8Array(value) {
  return value instanceof globalThis.Int8Array;
}
function IsUint8Array(value) {
  return value instanceof globalThis.Uint8Array;
}
function IsUint8ClampedArray(value) {
  return value instanceof globalThis.Uint8ClampedArray;
}
function IsInt16Array(value) {
  return value instanceof globalThis.Int16Array;
}
function IsUint16Array(value) {
  return value instanceof globalThis.Uint16Array;
}
function IsInt32Array(value) {
  return value instanceof globalThis.Int32Array;
}
function IsUint32Array(value) {
  return value instanceof globalThis.Uint32Array;
}
function IsFloat32Array(value) {
  return value instanceof globalThis.Float32Array;
}
function IsFloat64Array(value) {
  return value instanceof globalThis.Float64Array;
}
function IsBigInt64Array(value) {
  return value instanceof globalThis.BigInt64Array;
}
function IsBigUint64Array(value) {
  return value instanceof globalThis.BigUint64Array;
}
function IsRegExp(value) {
  return value instanceof globalThis.RegExp;
}
function IsDate(value) {
  return value instanceof globalThis.Date;
}
function IsSet(value) {
  return value instanceof globalThis.Set;
}
function IsMap(value) {
  return value instanceof globalThis.Map;
}
// ../../node_modules/typebox/build/system/memory/clone.mjs
function FromClassInstance(value) {
  return value;
}
function IsTypeObject(value) {
  return exports_guard.HasPropertyKey(value, "~kind") || exports_guard.HasPropertyKey(value, "~unsafe");
}
function FromTypeObject(value) {
  const result = {};
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of Object.keys(descriptors)) {
    if (exports_guard.IsUnsafePropertyKey(key))
      continue;
    const descriptor = descriptors[key];
    if (exports_guard.HasPropertyKey(descriptor, "value")) {
      Object.defineProperty(result, key, { ...descriptor, value: FromValue(descriptor.value) });
    }
  }
  return result;
}
function FromPlainObject(value) {
  const result = {};
  for (const key of exports_guard.Keys(value)) {
    if (exports_guard.IsUnsafePropertyKey(key))
      continue;
    result[key] = FromValue(value[key]);
  }
  for (const key of exports_guard.Symbols(value)) {
    result[key] = FromValue(value[key]);
  }
  return result;
}
function FromObject(value) {
  return exports_guard.IsClassInstance(value) ? FromClassInstance(value) : IsTypeObject(value) ? FromTypeObject(value) : FromPlainObject(value);
}
function FromArray(value) {
  return value.map((element) => FromValue(element));
}
function FromTypedArray(value) {
  return value.slice();
}
function FromRegExp(value) {
  return new RegExp(value.source, value.flags);
}
function FromMap(value) {
  return new Map(FromValue([...value.entries()]));
}
function FromSet(value) {
  return new Set(FromValue([...value.values()]));
}
function FromValue(value) {
  return exports_globals.IsTypeArray(value) ? FromTypedArray(value) : exports_globals.IsRegExp(value) ? FromRegExp(value) : exports_globals.IsMap(value) ? FromMap(value) : exports_globals.IsSet(value) ? FromSet(value) : exports_guard.IsArray(value) ? FromArray(value) : exports_guard.IsObject(value) ? FromObject(value) : value;
}
function Clone(value) {
  Metrics.clone += 1;
  return FromValue(value);
}
// ../../node_modules/typebox/build/system/settings/settings.mjs
var exports_settings = {};
__export(exports_settings, {
  Set: () => Set2,
  Reset: () => Reset,
  Get: () => Get
});
var settings = {
  immutableTypes: false,
  maxErrors: 8,
  maxInstantiationCount: 128,
  useAcceleration: true,
  exactOptionalPropertyTypes: false,
  enumerableKind: false,
  correctiveParse: false,
  unionPrioritySort: true
};
function Reset() {
  settings.immutableTypes = false;
  settings.maxErrors = 8;
  settings.maxInstantiationCount = 128;
  settings.useAcceleration = true;
  settings.exactOptionalPropertyTypes = false;
  settings.enumerableKind = false;
  settings.correctiveParse = false;
  settings.unionPrioritySort = true;
}
function Set2(options) {
  for (const key of exports_guard.Keys(options)) {
    const value = options[key];
    if (value !== undefined) {
      Object.defineProperty(settings, key, { value });
    }
  }
}
function Get() {
  return settings;
}
// ../../node_modules/typebox/build/system/memory/create.mjs
function MergeHidden(left, right) {
  for (const key of Object.keys(right)) {
    Object.defineProperty(left, key, {
      configurable: true,
      writable: true,
      enumerable: false,
      value: right[key]
    });
  }
  return left;
}
function Merge(left, right) {
  return { ...left, ...right };
}
function Create(hidden, enumerable, options = {}) {
  Metrics.create += 1;
  const settings2 = exports_settings.Get();
  const withOptions = Merge(enumerable, options);
  const withHidden = settings2.enumerableKind ? Merge(withOptions, hidden) : MergeHidden(withOptions, hidden);
  return settings2.immutableTypes ? Object.freeze(withHidden) : withHidden;
}
// ../../node_modules/typebox/build/system/memory/discard.mjs
function Discard(value, propertyKeys) {
  Metrics.discard += 1;
  const result = {};
  const descriptors = Object.getOwnPropertyDescriptors(Clone(value));
  const keysToDiscard = new Set(propertyKeys);
  for (const key of Object.keys(descriptors)) {
    if (keysToDiscard.has(key))
      continue;
    Object.defineProperty(result, key, descriptors[key]);
  }
  return result;
}
// ../../node_modules/typebox/build/system/memory/update.mjs
function Update(current, hidden, enumerable) {
  Metrics.update += 1;
  const settings2 = exports_settings.Get();
  const result = Clone(current);
  for (const key of Object.keys(hidden)) {
    Object.defineProperty(result, key, {
      configurable: true,
      writable: true,
      enumerable: settings2.enumerableKind,
      value: hidden[key]
    });
  }
  for (const key of Object.keys(enumerable)) {
    Object.defineProperty(result, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: enumerable[key]
    });
  }
  return result;
}
// ../../node_modules/typebox/build/type/types/schema.mjs
function IsKind(value, kind) {
  return exports_guard.IsObject(value) && exports_guard.HasPropertyKey(value, "~kind") && exports_guard.IsEqual(value["~kind"], kind);
}
function IsSchema(value) {
  return exports_guard.IsObject(value);
}

// ../../node_modules/typebox/build/type/types/deferred.mjs
function Deferred(action, parameters, options) {
  return exports_memory.Create({ "~kind": "Deferred" }, { type: "deferred", action, parameters, options }, {});
}
function IsDeferred(value) {
  return IsKind(value, "Deferred");
}

// ../../node_modules/typebox/build/type/engine/readonly/instantiate_add.mjs
function AddReadonlyOperation(type) {
  return exports_memory.Update(type, { "~readonly": true }, {});
}
function AddReadonlyAction(type, options) {
  const result = exports_memory.Update(AddReadonlyOperation(type), {}, options);
  return result;
}
function AddReadonlyInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return AddReadonlyAction(instantiatedType, options);
}

// ../../node_modules/typebox/build/type/engine/optional/instantiate_add.mjs
function AddOptionalOperation(type) {
  return exports_memory.Update(type, { "~optional": true }, {});
}
function AddOptionalAction(type, options) {
  const result = exports_memory.Update(AddOptionalOperation(type), {}, options);
  return result;
}
function AddOptionalInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return AddOptionalAction(instantiatedType, options);
}

// ../../node_modules/typebox/build/type/types/array.mjs
function _Array_(items, options) {
  return exports_memory.Create({ "~kind": "Array" }, { type: "array", items }, options);
}
function IsArray2(value) {
  return IsKind(value, "Array");
}
function ArrayOptions(type) {
  return exports_memory.Discard(type, ["~kind", "type", "items"]);
}

// ../../node_modules/typebox/build/type/types/constructor.mjs
function Constructor(parameters, instanceType, options = {}) {
  return exports_memory.Create({ "~kind": "Constructor" }, { type: "constructor", parameters, instanceType }, options);
}
function IsConstructor2(value) {
  return IsKind(value, "Constructor");
}
function ConstructorOptions(type) {
  return exports_memory.Discard(type, ["~kind", "type", "parameters", "instanceType"]);
}

// ../../node_modules/typebox/build/type/types/function.mjs
function _Function_(parameters, returnType, options = {}) {
  return exports_memory.Create({ ["~kind"]: "Function" }, { type: "function", parameters, returnType }, options);
}
function IsFunction2(value) {
  return IsKind(value, "Function");
}
function FunctionOptions(type) {
  return exports_memory.Discard(type, ["~kind", "type", "parameters", "returnType"]);
}

// ../../node_modules/typebox/build/type/types/ref.mjs
function Ref(ref, options) {
  return exports_memory.Create({ ["~kind"]: "Ref" }, { $ref: ref }, options);
}
function IsRef(value) {
  return IsKind(value, "Ref");
}

// ../../node_modules/typebox/build/type/types/generic.mjs
function Generic(parameters, expression) {
  return exports_memory.Create({ "~kind": "Generic" }, { type: "generic", parameters, expression });
}
function IsGeneric(value) {
  return IsKind(value, "Generic");
}

// ../../node_modules/typebox/build/type/types/any.mjs
function Any(options) {
  return exports_memory.Create({ ["~kind"]: "Any" }, {}, options);
}
function IsAny(value) {
  return IsKind(value, "Any");
}

// ../../node_modules/typebox/build/type/types/never.mjs
var NeverPattern = "(?!)";
function Never(options) {
  return exports_memory.Create({ "~kind": "Never" }, { not: {} }, options);
}
function IsNever(value) {
  return IsKind(value, "Never");
}

// ../../node_modules/typebox/build/type/action/_add_optional.mjs
function AddOptionalDeferred(type, options = {}) {
  return Deferred("AddOptional", [type], options);
}
function AddOptional(type, options = {}) {
  return AddOptionalAction(type, options);
}

// ../../node_modules/typebox/build/type/types/_optional.mjs
function Optional(type) {
  return AddOptional(type);
}
function IsOptional(value) {
  return IsSchema(value) && exports_guard.HasPropertyKey(value, "~optional");
}

// ../../node_modules/typebox/build/type/types/properties.mjs
function RequiredArray(properties) {
  return exports_guard.Keys(properties).filter((key) => !IsOptional(properties[key]));
}
function PropertyKeys(properties) {
  return exports_guard.Keys(properties);
}
function PropertyValues(properties) {
  return exports_guard.Values(properties);
}

// ../../node_modules/typebox/build/type/types/object.mjs
function _Object_(properties, options = {}) {
  const requiredKeys = RequiredArray(properties);
  const required = requiredKeys.length > 0 ? { required: requiredKeys } : {};
  return exports_memory.Create({ "~kind": "Object" }, { type: "object", ...required, properties }, options);
}
function IsObject2(value) {
  return IsKind(value, "Object");
}
function ObjectOptions(type) {
  return exports_memory.Discard(type, ["~kind", "type", "properties", "required"]);
}

// ../../node_modules/typebox/build/type/types/unknown.mjs
function Unknown(options) {
  return exports_memory.Create({ ["~kind"]: "Unknown" }, {}, options);
}
function IsUnknown(value) {
  return IsKind(value, "Unknown");
}

// ../../node_modules/typebox/build/type/types/cyclic.mjs
function Cyclic($defs, $ref, options) {
  const defs = exports_guard.Keys($defs).reduce((result, key) => {
    return { ...result, [key]: exports_memory.Update($defs[key], {}, { $id: key }) };
  }, {});
  return exports_memory.Create({ ["~kind"]: "Cyclic" }, { $defs: defs, $ref }, options);
}
function IsCyclic(value) {
  return IsKind(value, "Cyclic");
}

// ../../node_modules/typebox/build/type/types/unsafe.mjs
function Unsafe(schema) {
  return exports_memory.Update(schema, { ["~unsafe"]: null }, {});
}
function IsUnsafe(value) {
  return exports_guard.IsObjectNotArray(value) && exports_guard.HasPropertyKey(value, "~unsafe") && exports_guard.IsNull(value["~unsafe"]);
}

// ../../node_modules/typebox/build/system/arguments/arguments.mjs
var exports_arguments = {};
__export(exports_arguments, {
  Match: () => Match
});
function Match(args, match) {
  return match[args.length]?.(...args) ?? (() => {
    throw Error("Invalid Arguments");
  })();
}
// ../../node_modules/typebox/build/type/types/infer.mjs
function Infer(...args) {
  const [name, extends_] = exports_arguments.Match(args, {
    2: (name2, extends_2) => [name2, extends_2, extends_2],
    1: (name2) => [name2, Unknown(), Unknown()]
  });
  return exports_memory.Create({ ["~kind"]: "Infer" }, { type: "infer", name, extends: extends_ }, {});
}
function IsInfer(value) {
  return IsKind(value, "Infer");
}

// ../../node_modules/typebox/build/type/types/dependent.mjs
function Dependent(if_, then_, else_, options = {}) {
  return exports_memory.Create({ "~kind": "Dependent" }, { if: if_, then: then_, else: else_ }, options);
}
function IsDependent(value) {
  return IsKind(value, "Dependent");
}
function DependentOptions(type) {
  return exports_memory.Discard(type, ["~kind", "if", "then", "else"]);
}

// ../../node_modules/typebox/build/type/engine/enum/typescript_enum_to_enum_values.mjs
function IsTypeScriptEnumLike(value) {
  return exports_guard.IsObjectNotArray(value);
}
function TypeScriptEnumToEnumValues(type) {
  const keys = exports_guard.Keys(type).filter((key) => isNaN(key));
  return keys.reduce((result, key) => [...result, type[key]], []);
}

// ../../node_modules/typebox/build/type/types/enum.mjs
function IsEnumValue(value) {
  return exports_guard.IsString(value) || exports_guard.IsNumber(value);
}
function Enum(value, options) {
  const values = IsTypeScriptEnumLike(value) ? TypeScriptEnumToEnumValues(value) : value;
  return exports_memory.Create({ "~kind": "Enum" }, { enum: values }, options);
}
function IsEnum(value) {
  return IsKind(value, "Enum");
}

// ../../node_modules/typebox/build/type/types/intersect.mjs
function Intersect(types, options = {}) {
  return exports_memory.Create({ "~kind": "Intersect" }, { allOf: types }, options);
}
function IsIntersect(value) {
  return IsKind(value, "Intersect");
}
function IntersectOptions(type) {
  return exports_memory.Discard(type, ["~kind", "allOf"]);
}
// ../../node_modules/typebox/build/system/unreachable/unreachable.mjs
function Unreachable() {
  throw new Error("Unreachable");
}
// ../../node_modules/typebox/build/system/hashing/hash.mjs
var ByteMarker;
(function(ByteMarker2) {
  ByteMarker2[ByteMarker2["Array"] = 0] = "Array";
  ByteMarker2[ByteMarker2["BigInt"] = 1] = "BigInt";
  ByteMarker2[ByteMarker2["Boolean"] = 2] = "Boolean";
  ByteMarker2[ByteMarker2["Date"] = 3] = "Date";
  ByteMarker2[ByteMarker2["Constructor"] = 4] = "Constructor";
  ByteMarker2[ByteMarker2["Function"] = 5] = "Function";
  ByteMarker2[ByteMarker2["Null"] = 6] = "Null";
  ByteMarker2[ByteMarker2["Number"] = 7] = "Number";
  ByteMarker2[ByteMarker2["Object"] = 8] = "Object";
  ByteMarker2[ByteMarker2["RegExp"] = 9] = "RegExp";
  ByteMarker2[ByteMarker2["String"] = 10] = "String";
  ByteMarker2[ByteMarker2["Symbol"] = 11] = "Symbol";
  ByteMarker2[ByteMarker2["TypeArray"] = 12] = "TypeArray";
  ByteMarker2[ByteMarker2["Undefined"] = 13] = "Undefined";
})(ByteMarker || (ByteMarker = {}));
var Accumulator = BigInt("14695981039346656037");
var [Prime, Size] = [BigInt("1099511628211"), BigInt("18446744073709551616")];
var Bytes = Array.from({ length: 256 }).map((_, i) => BigInt(i));
var F64 = new Float64Array(1);
var F64In = new DataView(F64.buffer);
var F64Out = new Uint8Array(F64.buffer);
var encoder2 = new TextEncoder;
// ../../node_modules/typebox/build/type/types/_codec.mjs
class EncodeBuilder {
  constructor(type, decode2) {
    this.type = type;
    this.decode = decode2;
  }
  Encode(callback) {
    const type = this.type;
    const decode2 = IsCodec(type) ? (value) => this.decode(type["~codec"].decode(value)) : this.decode;
    const encode2 = IsCodec(type) ? (value) => type["~codec"].encode(callback(value)) : callback;
    const codec = { decode: decode2, encode: encode2 };
    return exports_memory.Update(this.type, { "~codec": codec }, {});
  }
}

class DecodeBuilder {
  constructor(type) {
    this.type = type;
  }
  Decode(callback) {
    return new EncodeBuilder(this.type, callback);
  }
}
function Codec(type) {
  return new DecodeBuilder(type);
}
function Decode(type, callback) {
  return Codec(type).Decode(callback).Encode(() => {
    throw Error("Encode not implemented");
  });
}
function Encode(type, callback) {
  return Codec(type).Decode(() => {
    throw Error("Decode not implemented");
  }).Encode(callback);
}
function IsCodec(value) {
  return IsSchema(value) && exports_guard.HasPropertyKey(value, "~codec") && exports_guard.IsObject(value["~codec"]) && exports_guard.HasPropertyKey(value["~codec"], "encode") && exports_guard.HasPropertyKey(value["~codec"], "decode");
}
// ../../node_modules/typebox/build/type/types/_immutable.mjs
function Immutable(type) {
  return AddImmutable(type);
}
function IsImmutable(value) {
  return IsSchema(value) && exports_guard.HasPropertyKey(value, "~immutable");
}
// ../../node_modules/typebox/build/type/action/_add_readonly.mjs
function AddReadonlyDeferred(type, options = {}) {
  return Deferred("AddReadonly", [type], options);
}
function AddReadonly(type, options = {}) {
  return AddReadonlyAction(type, options);
}

// ../../node_modules/typebox/build/type/types/_readonly.mjs
function Readonly(type) {
  return AddReadonly(type);
}
function IsReadonly(value) {
  return IsSchema(value) && exports_guard.HasPropertyKey(value, "~readonly");
}
// ../../node_modules/typebox/build/type/types/_refine.mjs
function RefineAdd(type, refinement) {
  const refinements = IsRefine(type) ? [...type["~refine"], refinement] : [refinement];
  return exports_memory.Update(type, { "~refine": refinements }, {});
}
function Refine(...args) {
  const [type, check2, error] = exports_arguments.Match(args, {
    3: (type2, check3, error2) => [type2, check3, error2],
    2: (type2, check3) => [type2, check3, () => "Refine Error"]
  });
  return RefineAdd(type, { check: check2, error });
}
function IsRefinement(value) {
  return exports_guard.IsObjectNotArray(value) && exports_guard.HasPropertyKey(value, "check") && exports_guard.HasPropertyKey(value, "error") && exports_guard.IsFunction(value.check) && exports_guard.IsFunction(value.error);
}
function IsRefine(value) {
  return IsSchema(value) && exports_guard.HasPropertyKey(value, "~refine") && exports_guard.IsArray(value["~refine"]) && exports_guard.Every(value["~refine"], 0, (value2) => IsRefinement(value2));
}
// ../../node_modules/typebox/build/type/types/bigint.mjs
var BigIntPattern = "-?(?:0|[1-9][0-9]*)n";
function BigInt2(options) {
  return exports_memory.Create({ "~kind": "BigInt" }, { type: "bigint" }, options);
}
function IsBigInt2(value) {
  return IsKind(value, "BigInt");
}
// ../../node_modules/typebox/build/type/types/boolean.mjs
function Boolean2(options) {
  return exports_memory.Create({ "~kind": "Boolean" }, { type: "boolean" }, options);
}
function IsBoolean3(value) {
  return IsKind(value, "Boolean");
}
// ../../node_modules/typebox/build/type/types/identifier.mjs
function Identifier(name) {
  return exports_memory.Create({ "~kind": "Identifier" }, { name });
}
function IsIdentifier(value) {
  return IsKind(value, "Identifier");
}
// ../../node_modules/typebox/build/type/types/integer.mjs
var IntegerPattern = "-?(?:0|[1-9][0-9]*)";
function Integer(options) {
  return exports_memory.Create({ "~kind": "Integer" }, { type: "integer" }, options);
}
function IsInteger2(value) {
  return IsKind(value, "Integer");
}
// ../../node_modules/typebox/build/type/types/literal.mjs
class InvalidLiteralValue extends Error {
  constructor(value) {
    super(`Invalid Literal value`);
    Object.defineProperty(this, "cause", {
      value: { value },
      writable: false,
      configurable: false,
      enumerable: false
    });
  }
}
function LiteralTypeName(value) {
  return exports_guard.IsBigInt(value) ? "bigint" : exports_guard.IsBoolean(value) ? "boolean" : exports_guard.IsNumber(value) ? "number" : exports_guard.IsString(value) ? "string" : (() => {
    throw new InvalidLiteralValue(value);
  })();
}
function Literal(value, options) {
  return exports_memory.Create({ "~kind": "Literal" }, { type: LiteralTypeName(value), const: value }, options);
}
function IsLiteralValue(value) {
  return exports_guard.IsBigInt(value) || exports_guard.IsBoolean(value) || exports_guard.IsNumber(value) || exports_guard.IsString(value);
}
function IsLiteralNumber(value) {
  return IsLiteral(value) && exports_guard.IsNumber(value.const);
}
function IsLiteralString(value) {
  return IsLiteral(value) && exports_guard.IsString(value.const);
}
function IsLiteral(value) {
  return IsKind(value, "Literal");
}
// ../../node_modules/typebox/build/type/types/null.mjs
function Null(options) {
  return exports_memory.Create({ "~kind": "Null" }, { type: "null" }, options);
}
function IsNull2(value) {
  return IsKind(value, "Null");
}
// ../../node_modules/typebox/build/type/types/number.mjs
var NumberPattern = "-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?";
function Number2(options) {
  return exports_memory.Create({ "~kind": "Number" }, { type: "number" }, options);
}
function IsNumber3(value) {
  return IsKind(value, "Number");
}
// ../../node_modules/typebox/build/type/types/symbol.mjs
function Symbol2(options) {
  return exports_memory.Create({ "~kind": "Symbol" }, { type: "symbol" }, options);
}
function IsSymbol2(value) {
  return IsKind(value, "Symbol");
}
// ../../node_modules/typebox/build/type/types/parameter.mjs
function Parameter(...args) {
  const [name, extends_, equals] = exports_arguments.Match(args, {
    3: (name2, extends_2, equals2) => [name2, extends_2, equals2],
    2: (name2, extends_2) => [name2, extends_2, extends_2],
    1: (name2) => [name2, Unknown(), Unknown()]
  });
  return exports_memory.Create({ "~kind": "Parameter" }, { name, extends: extends_, equals }, {});
}
function IsParameter(value) {
  return IsKind(value, "Parameter");
}
// ../../node_modules/typebox/build/type/types/string.mjs
var StringPattern = ".*";
function String2(options) {
  return exports_memory.Create({ "~kind": "String" }, { type: "string" }, options);
}
function IsString3(value) {
  return IsKind(value, "String");
}

// ../../node_modules/typebox/build/type/types/union.mjs
function Union(anyOf, options = {}) {
  return exports_memory.Create({ "~kind": "Union" }, { anyOf }, options);
}
function IsUnion(value) {
  return IsKind(value, "Union");
}
function UnionOptions(type) {
  return exports_memory.Discard(type, ["~kind", "anyOf"]);
}

// ../../node_modules/typebox/build/type/engine/patterns/pattern.mjs
function ParsePatternIntoTypes(pattern) {
  const parsed = Pattern(pattern);
  const result = exports_guard.IsEqual(parsed.length, 2) ? parsed[0] : [];
  return result;
}

// ../../node_modules/typebox/build/type/engine/template_literal/is_finite.mjs
function FromLiteral(_value) {
  return true;
}
function FromTypesReduce(types) {
  return exports_guard.ShiftLeft(types, (left, right) => FromType(left) ? FromTypesReduce(right) : false, () => true);
}
function FromTypes(types) {
  const result = exports_guard.IsEqual(types.length, 0) ? false : FromTypesReduce(types);
  return result;
}
function FromType(type) {
  return IsUnion(type) ? FromTypes(type.anyOf) : IsLiteral(type) ? FromLiteral(type.const) : false;
}
function IsTemplateLiteralFinite(types) {
  const result = FromTypes(types);
  return result;
}

// ../../node_modules/typebox/build/type/engine/template_literal/create.mjs
function TemplateLiteralCreate(pattern) {
  return exports_memory.Create({ ["~kind"]: "TemplateLiteral" }, { type: "string", pattern }, {});
}

// ../../node_modules/typebox/build/type/engine/template_literal/decode.mjs
function FromLiteralPush(variants, value, result = []) {
  return exports_guard.ShiftLeft(variants, (left, right) => FromLiteralPush(right, value, [...result, `${left}${value}`]), () => result);
}
function FromLiteral2(variants, value) {
  return exports_guard.IsEqual(variants.length, 0) ? [`${value}`] : FromLiteralPush(variants, value);
}
function FromUnion(variants, types, result = []) {
  return exports_guard.ShiftLeft(types, (left, right) => FromUnion(variants, right, [...result, ...FromType2(variants, left)]), () => result);
}
function FromType2(variants, type) {
  const result = IsUnion(type) ? FromUnion(variants, type.anyOf) : IsLiteral(type) ? FromLiteral2(variants, type.const) : Unreachable();
  return result;
}
function DecodeFromSpan(variants, types) {
  return exports_guard.ShiftLeft(types, (left, right) => DecodeFromSpan(FromType2(variants, left), right), () => variants);
}
function VariantsToLiterals(variants) {
  return variants.map((variant) => Literal(variant));
}
function DecodeTypesAsUnion(types) {
  const variants = DecodeFromSpan([], types);
  const literals = VariantsToLiterals(variants);
  const result = Union(literals);
  return result;
}
function DecodeTypes(types) {
  return exports_guard.IsEqual(types.length, 0) ? Unreachable() : exports_guard.IsEqual(types.length, 1) && IsLiteral(types[0]) ? types[0] : DecodeTypesAsUnion(types);
}
function TemplateLiteralDecodeUnsafe(pattern) {
  const types = ParsePatternIntoTypes(pattern);
  const result = exports_guard.IsEqual(types.length, 0) ? String2() : IsTemplateLiteralFinite(types) ? DecodeTypes(types) : TemplateLiteralCreate(pattern);
  return result;
}
function TemplateLiteralDecode(pattern) {
  const decoded = TemplateLiteralDecodeUnsafe(pattern);
  const result = IsTemplateLiteral(decoded) ? String2() : decoded;
  return result;
}

// ../../node_modules/typebox/build/type/engine/record/record_create.mjs
function CreateRecord(key, value) {
  const type = "object";
  const patternProperties = { [key]: value };
  return exports_memory.Create({ ["~kind"]: "Record" }, { type, patternProperties });
}

// ../../node_modules/typebox/build/type/engine/record/from_key_any.mjs
function FromAnyKey(value) {
  return CreateRecord(StringKey, value);
}

// ../../node_modules/typebox/build/type/engine/record/from_key_boolean.mjs
function FromBooleanKey(value) {
  return _Object_({ true: value, false: value });
}

// ../../node_modules/typebox/build/type/types/tuple.mjs
function Tuple(types, options = {}) {
  const [items, minItems, additionalItems] = [types, types.length, false];
  return exports_memory.Create({ ["~kind"]: "Tuple" }, { type: "array", additionalItems, items, minItems }, options);
}
function IsTuple(value) {
  return IsKind(value, "Tuple");
}
function TupleOptions(type) {
  return exports_memory.Discard(type, ["~kind", "type", "items", "minItems", "additionalItems"]);
}

// ../../node_modules/typebox/build/type/engine/readonly/instantiate_remove.mjs
function RemoveReadonlyOperation(type) {
  return exports_memory.Discard(type, ["~readonly"]);
}
function RemoveReadonlyAction(type, options) {
  const result = exports_memory.Update(RemoveReadonlyOperation(type), {}, options);
  return result;
}
function RemoveReadonlyInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return RemoveReadonlyAction(instantiatedType, options);
}

// ../../node_modules/typebox/build/type/action/_remove_readonly.mjs
function RemoveReadonlyDeferred(type, options = {}) {
  return Deferred("RemoveReadonly", [type], options);
}
function RemoveReadonly(type, options = {}) {
  return RemoveReadonlyAction(type, options);
}

// ../../node_modules/typebox/build/type/engine/optional/instantiate_remove.mjs
function RemoveOptionalOperation(type) {
  return exports_memory.Discard(type, ["~optional"]);
}
function RemoveOptionalAction(type, options) {
  const result = exports_memory.Update(RemoveOptionalOperation(type), {}, options);
  return result;
}
function RemoveOptionalInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return RemoveOptionalAction(instantiatedType, options);
}

// ../../node_modules/typebox/build/type/action/_remove_optional.mjs
function RemoveOptionalDeferred(type, options = {}) {
  return Deferred("RemoveOptional", [type], options);
}
function RemoveOptional(type, options = {}) {
  return RemoveOptionalAction(type, options);
}

// ../../node_modules/typebox/build/type/engine/tuple/to_object.mjs
function TupleElementsToProperties(types) {
  const result = types.reduceRight((result2, right, index) => {
    return { [index]: right, ...result2 };
  }, {});
  return result;
}
function TupleToObject(type) {
  const properties = TupleElementsToProperties(type.items);
  const result = _Object_(properties);
  return result;
}

// ../../node_modules/typebox/build/type/engine/evaluate/composite.mjs
function IsReadonlyProperty(left, right) {
  return IsReadonly(left) ? IsReadonly(right) ? true : false : false;
}
function IsOptionalProperty(left, right) {
  return IsOptional(left) ? IsOptional(right) ? true : false : false;
}
function CompositeProperty(left, right) {
  const isReadonly = IsReadonlyProperty(left, right);
  const isOptional = IsOptionalProperty(left, right);
  const evaluated = EvaluateIntersect([left, right]);
  const property = RemoveReadonly(RemoveOptional(evaluated));
  return isReadonly && isOptional ? AddReadonly(AddOptional(property)) : isReadonly && !isOptional ? AddReadonly(property) : !isReadonly && isOptional ? AddOptional(property) : property;
}
function CompositePropertyKey(left, right, key) {
  return key in left ? key in right ? CompositeProperty(left[key], right[key]) : left[key] : (key in right) ? right[key] : Never();
}
function CompositeProperties(left, right) {
  const keys = new Set([...exports_guard.Keys(right), ...exports_guard.Keys(left)]);
  return [...keys].reduce((result, key) => {
    return { ...result, [key]: CompositePropertyKey(left, right, key) };
  }, {});
}
function GetProperties(type) {
  const result = IsObject2(type) ? type.properties : IsTuple(type) ? TupleElementsToProperties(type.items) : Unreachable();
  return result;
}
function Composite(left, right) {
  const leftProperties = GetProperties(left);
  const rightProperties = GetProperties(right);
  const properties = CompositeProperties(leftProperties, rightProperties);
  return _Object_(properties);
}

// ../../node_modules/typebox/build/type/engine/evaluate/narrow.mjs
function Narrow(left, right) {
  const result = Compare(left, right);
  return exports_guard.IsEqual(result, ResultLeftInside) ? left : exports_guard.IsEqual(result, ResultRightInside) ? right : exports_guard.IsEqual(result, ResultEqual) ? right : Never();
}

// ../../node_modules/typebox/build/type/engine/evaluate/distribute.mjs
function IsObjectLike(type) {
  return IsObject2(type) || IsTuple(type);
}
function IsUnionOperand(left, right) {
  const isUnionLeft = IsUnion(left);
  const isUnionRight = IsUnion(right);
  const result = isUnionLeft || isUnionRight;
  return result;
}
function DistributeOperation(left, right) {
  const evaluatedLeft = EvaluateType(left);
  const evaluatedRight = EvaluateType(right);
  const isUnionOperand = IsUnionOperand(evaluatedLeft, evaluatedRight);
  const isObjectLeft = IsObjectLike(evaluatedLeft);
  const IsObjectRight = IsObjectLike(evaluatedRight);
  const result = isUnionOperand ? EvaluateIntersect([evaluatedLeft, evaluatedRight]) : isObjectLeft && IsObjectRight ? Composite(evaluatedLeft, evaluatedRight) : isObjectLeft && !IsObjectRight ? evaluatedLeft : !isObjectLeft && IsObjectRight ? evaluatedRight : Narrow(evaluatedLeft, evaluatedRight);
  return result;
}
function DistributeType(type, types, result = []) {
  return exports_guard.ShiftLeft(types, (left, right) => DistributeType(type, right, [...result, DistributeOperation(type, left)]), () => exports_guard.IsEqual(result.length, 0) ? [type] : result);
}
function DistributeUnion(types, distribution, result = []) {
  return exports_guard.ShiftLeft(types, (left, right) => DistributeUnion(right, distribution, [...result, ...Distribute([left], distribution)]), () => result);
}
function Distribute(types, result = []) {
  return exports_guard.ShiftLeft(types, (left, right) => IsUnion(left) ? Distribute(right, DistributeUnion(left.anyOf, result)) : Distribute(right, DistributeType(left, result)), () => result);
}

// ../../node_modules/typebox/build/type/engine/exclude/operation.mjs
function ExcludeType(left, right) {
  const check2 = Extends({}, left, right);
  const result = exports_result.IsExtendsTrueLike(check2) ? [] : [left];
  return result;
}
function ExcludeUnion(types, right) {
  return types.reduce((result, head) => {
    return [...result, ...ExcludeType(head, right)];
  }, []);
}
function ExcludeOperation(left, right) {
  const evaluated = EvaluateType(left);
  const canonical = IsUnion(evaluated) ? evaluated.anyOf : [evaluated];
  const remaining = ExcludeUnion(canonical, right);
  const result = EvaluateUnion(remaining);
  return result;
}

// ../../node_modules/typebox/build/type/engine/evaluate/evaluate.mjs
function EvaluateDependent(if_, then_, else_) {
  const intersect = Intersect([if_, then_]);
  const excluded = ExcludeOperation(else_, if_);
  const result = EvaluateUnion([intersect, excluded]);
  return result;
}
function EvaluateEnum(values) {
  const result = values.map((value) => Literal(value));
  return EvaluateUnion(result);
}
function EvaluateIntersect(types) {
  const distribution = Distribute(types);
  const broadend = Broaden(distribution);
  const result = EvaluateUnionFast(broadend);
  return result;
}
function EvaluateTemplateLiteral(pattern) {
  const evaluated = TemplateLiteralDecode(pattern);
  const result = EvaluateType(evaluated);
  return result;
}
function EvaluateUnion(types) {
  const broadend = Broaden(types);
  const result = EvaluateUnionFast(broadend);
  return result;
}
function EvaluateType(type) {
  return IsDependent(type) ? EvaluateDependent(type.if, type.then, type.else) : IsEnum(type) ? EvaluateEnum(type.enum) : IsIntersect(type) ? EvaluateIntersect(type.allOf) : IsTemplateLiteral(type) ? EvaluateTemplateLiteral(type.pattern) : IsUnion(type) ? EvaluateUnion(type.anyOf) : type;
}
function EvaluateUnionFast(types) {
  const result = exports_guard.IsEqual(types.length, 1) ? types[0] : exports_guard.IsEqual(types.length, 0) ? Never() : Union(types);
  return result;
}

// ../../node_modules/typebox/build/type/engine/record/from_key_enum.mjs
function FromEnumKey(values, value) {
  const unionKey = EvaluateEnum(values);
  const result = FromKey(unionKey, value);
  return result;
}

// ../../node_modules/typebox/build/type/engine/record/from_key_integer.mjs
function FromIntegerKey(_key, value) {
  const result = CreateRecord(IntegerKey, value);
  return result;
}

// ../../node_modules/typebox/build/type/engine/record/from_key_intersect.mjs
function FromIntersectKey(types, value) {
  const evaluatedKey = EvaluateIntersect(types);
  const result = FromKey(evaluatedKey, value);
  return result;
}

// ../../node_modules/typebox/build/type/engine/record/from_key_literal.mjs
function FromLiteralKey(key, value) {
  return exports_guard.IsString(key) || exports_guard.IsNumber(key) ? _Object_({ [key]: value }) : exports_guard.IsEqual(key, false) ? _Object_({ false: value }) : exports_guard.IsEqual(key, true) ? _Object_({ true: value }) : _Object_({});
}

// ../../node_modules/typebox/build/type/engine/record/from_key_number.mjs
function FromNumberKey(_key, value) {
  const result = CreateRecord(NumberKey, value);
  return result;
}

// ../../node_modules/typebox/build/type/engine/record/from_key_string.mjs
function FromStringKey(key, value) {
  return exports_guard.HasPropertyKey(key, "pattern") && (exports_guard.IsString(key.pattern) || key.pattern instanceof RegExp) ? CreateRecord(key.pattern.toString(), value) : CreateRecord(StringKey, value);
}

// ../../node_modules/typebox/build/type/engine/record/from_key_template_literal.mjs
function FromTemplateKey(pattern, value) {
  const types = ParsePatternIntoTypes(pattern);
  const finite = IsTemplateLiteralFinite(types);
  const result = finite ? FromKey(EvaluateTemplateLiteral(pattern), value) : CreateRecord(pattern, value);
  return result;
}

// ../../node_modules/typebox/build/type/engine/evaluate/flatten.mjs
function FlattenType(type) {
  const result = IsUnion(type) ? Flatten(type.anyOf) : [type];
  return result;
}
function Flatten(types) {
  return types.reduce((result, type) => {
    return [...result, ...FlattenType(type)];
  }, []);
}

// ../../node_modules/typebox/build/type/engine/record/from_key_union.mjs
function StringOrNumberCheck(types) {
  return types.some((type) => IsString3(type) || IsNumber3(type) || IsInteger2(type));
}
function TryBuildRecord(types, value) {
  return exports_guard.IsEqual(StringOrNumberCheck(types), true) ? CreateRecord(StringKey, value) : undefined;
}
function CreateProperties(types, value) {
  return types.reduce((result, left) => {
    return IsLiteral(left) && (exports_guard.IsString(left.const) || exports_guard.IsNumber(left.const)) ? { ...result, [left.const]: value } : result;
  }, {});
}
function CreateObject(types, value) {
  const properties = CreateProperties(types, value);
  const result = _Object_(properties);
  return result;
}
function FromUnionKey(types, value) {
  const flattened = Flatten(types);
  const record = TryBuildRecord(flattened, value);
  return IsSchema(record) ? record : CreateObject(flattened, value);
}

// ../../node_modules/typebox/build/type/engine/record/from_key.mjs
function FromKey(key, value) {
  const result = IsAny(key) ? FromAnyKey(value) : IsBoolean3(key) ? FromBooleanKey(value) : IsEnum(key) ? FromEnumKey(key.enum, value) : IsInteger2(key) ? FromIntegerKey(key, value) : IsIntersect(key) ? FromIntersectKey(key.allOf, value) : IsLiteral(key) ? FromLiteralKey(key.const, value) : IsNumber3(key) ? FromNumberKey(key, value) : IsUnion(key) ? FromUnionKey(key.anyOf, value) : IsString3(key) ? FromStringKey(key, value) : IsTemplateLiteral(key) ? FromTemplateKey(key.pattern, value) : _Object_({});
  return result;
}

// ../../node_modules/typebox/build/type/engine/record/instantiate.mjs
function RecordAction(key, value, options) {
  const result = CanInstantiate([key]) ? exports_memory.Update(FromKey(key, value), {}, options) : RecordDeferred(key, value, options);
  return result;
}
function RecordInstantiate(context, state, key, value, options) {
  const instantiatedKey = InstantiateType(context, state, key);
  const instantiatedValue = InstantiateType(context, state, value);
  return RecordAction(instantiatedKey, instantiatedValue, options);
}

// ../../node_modules/typebox/build/type/types/record.mjs
var IntegerKey = `^${IntegerPattern}$`;
var NumberKey = `^${NumberPattern}$`;
var StringKey = `^${StringPattern}$`;
function RecordDeferred(key, value, options = {}) {
  return Deferred("Record", [key, value], options);
}
function Record(key, value, options = {}) {
  return RecordAction(key, value, options);
}
function RecordFromPattern(pattern, value) {
  return CreateRecord(pattern, value);
}
function RecordPatternToType(pattern) {
  const result = exports_guard.IsEqual(pattern, StringKey) ? String2() : exports_guard.IsEqual(pattern, IntegerKey) ? Integer() : exports_guard.IsEqual(pattern, NumberKey) ? Number2() : TemplateLiteralDecodeUnsafe(pattern);
  return result;
}
function RecordPattern(type) {
  return exports_guard.Keys(type.patternProperties)[0];
}
function RecordKey(type) {
  const pattern = RecordPattern(type);
  const result = RecordPatternToType(pattern);
  return result;
}
function RecordValue(type) {
  return type.patternProperties[RecordPattern(type)];
}
function IsRecord(value) {
  return IsKind(value, "Record");
}
// ../../node_modules/typebox/build/type/types/rest.mjs
function Rest(type) {
  return exports_memory.Create({ "~kind": "Rest" }, { type: "rest", items: type }, {});
}
function IsRest(value) {
  return IsKind(value, "Rest");
}
// ../../node_modules/typebox/build/type/types/this.mjs
function This(options) {
  return exports_memory.Create({ ["~kind"]: "This" }, { $ref: "#" }, options);
}
function IsThis(value) {
  return IsKind(value, "This");
}
// ../../node_modules/typebox/build/type/types/undefined.mjs
function Undefined(options) {
  return exports_memory.Create({ "~kind": "Undefined" }, { type: "undefined" }, options);
}
function IsUndefined2(value) {
  return IsKind(value, "Undefined");
}
// ../../node_modules/typebox/build/type/types/void.mjs
function Void(options) {
  return exports_memory.Create({ "~kind": "Void" }, { type: "void" }, options);
}
function IsVoid(value) {
  return IsKind(value, "Void");
}
// ../../node_modules/typebox/build/type/script/mapping.mjs
function IntrinsicOrCall(ref2, parameters) {
  return exports_guard.IsEqual(ref2, "Array") ? _Array_(parameters[0]) : exports_guard.IsEqual(ref2, "Capitalize") ? CapitalizeDeferred(parameters[0]) : exports_guard.IsEqual(ref2, "ConstructorParameters") ? ConstructorParametersDeferred(parameters[0]) : exports_guard.IsEqual(ref2, "Evaluate") ? EvaluateDeferred(parameters[0]) : exports_guard.IsEqual(ref2, "Exclude") ? ExcludeDeferred(parameters[0], parameters[1]) : exports_guard.IsEqual(ref2, "Extract") ? ExtractDeferred(parameters[0], parameters[1]) : exports_guard.IsEqual(ref2, "Index") ? IndexDeferred(parameters[0], parameters[1]) : exports_guard.IsEqual(ref2, "InstanceType") ? InstanceTypeDeferred(parameters[0]) : exports_guard.IsEqual(ref2, "Lowercase") ? LowercaseDeferred(parameters[0]) : exports_guard.IsEqual(ref2, "NonNullable") ? NonNullableDeferred(parameters[0]) : exports_guard.IsEqual(ref2, "Omit") ? OmitDeferred(parameters[0], parameters[1]) : exports_guard.IsEqual(ref2, "Parameters") ? ParametersDeferred(parameters[0]) : exports_guard.IsEqual(ref2, "Partial") ? PartialDeferred(parameters[0]) : exports_guard.IsEqual(ref2, "Pick") ? PickDeferred(parameters[0], parameters[1]) : exports_guard.IsEqual(ref2, "Readonly") ? ReadonlyObjectDeferred(parameters[0]) : exports_guard.IsEqual(ref2, "KeyOf") ? KeyOfDeferred(parameters[0]) : exports_guard.IsEqual(ref2, "Record") ? RecordDeferred(parameters[0], parameters[1]) : exports_guard.IsEqual(ref2, "Required") ? RequiredDeferred(parameters[0]) : exports_guard.IsEqual(ref2, "ReturnType") ? ReturnTypeDeferred(parameters[0]) : exports_guard.IsEqual(ref2, "Uncapitalize") ? UncapitalizeDeferred(parameters[0]) : exports_guard.IsEqual(ref2, "Uppercase") ? UppercaseDeferred(parameters[0]) : CallConstruct(Ref(ref2), parameters);
}
function Unreachable2() {
  throw Error("Unreachable");
}
function DelimitedDecode(input, result = []) {
  return exports_guard.ShiftLeft(input, (left, right) => DelimitedDecode(right, [...result, left[1]]), () => result);
}
function Delimited(input) {
  return exports_guard.IsEqual(input.length, 3) ? [input[0], ...DelimitedDecode(input[1])] : [];
}
function GenericParameterExtendsEqualsMapping(input) {
  return Parameter(input[0], input[2], input[4]);
}
function GenericParameterExtendsMapping(input) {
  return Parameter(input[0], input[2], input[2]);
}
function GenericParameterEqualsMapping(input) {
  return Parameter(input[0], Unknown(), input[2]);
}
function GenericParameterIdentifierMapping(input) {
  return Parameter(input, Unknown(), Unknown());
}
function GenericParameterMapping(input) {
  return input;
}
function GenericParameterListMapping(input) {
  return Delimited(input);
}
function GenericParametersMapping(input) {
  return input[1];
}
function GenericCallArgumentListMapping(input) {
  return Delimited(input);
}
function GenericCallArgumentsMapping(input) {
  return input[1];
}
function GenericCallMapping(input) {
  return IntrinsicOrCall(input[0], input[1]);
}
function OptionalSemiColonMapping(input) {
  return null;
}
function KeywordStringMapping(input) {
  return String2();
}
function KeywordNumberMapping(input) {
  return Number2();
}
function KeywordBooleanMapping(input) {
  return Boolean2();
}
function KeywordUndefinedMapping(input) {
  return Undefined();
}
function KeywordNullMapping(input) {
  return Null();
}
function KeywordIntegerMapping(input) {
  return Integer();
}
function KeywordBigIntMapping(input) {
  return BigInt2();
}
function KeywordUnknownMapping(input) {
  return Unknown();
}
function KeywordAnyMapping(input) {
  return Any();
}
function KeywordObjectMapping(input) {
  return _Object_({});
}
function KeywordNeverMapping(input) {
  return Never();
}
function KeywordSymbolMapping(input) {
  return Symbol2();
}
function KeywordVoidMapping(input) {
  return Void();
}
function KeywordThisMapping(input) {
  return This();
}
function LiteralBigIntMapping(input) {
  return Literal(BigInt(input));
}
function LiteralBooleanMapping(input) {
  return Literal(exports_guard.IsEqual(input, "true"));
}
function LiteralNumberMapping(input) {
  return Literal(parseFloat(input));
}
function LiteralStringMapping(input) {
  return Literal(input);
}
function TemplateInterpolateMapping(input) {
  return input[1];
}
function TemplateSpanMapping(input) {
  return Literal(input);
}
function TemplateBodyMapping(input) {
  return exports_guard.IsEqual(input.length, 3) ? [input[0], input[1], ...input[2]] : [input[0]];
}
function TemplateLiteralTypesMapping(input) {
  return input[1];
}
function TemplateLiteralMapping(input) {
  return TemplateLiteralDeferred(input);
}
function DependentMapping(input) {
  return exports_guard.IsEqual(input.length, 6) ? Dependent(input[1], input[3], input[5]) : Dependent(input[1], input[3], Unknown());
}
function KeyOfMapping(input) {
  return input.length > 0;
}
function IndexArrayMapping(input) {
  return input.reduce((result, current) => {
    return exports_guard.IsEqual(current.length, 3) ? [...result, [current[1]]] : [...result, []];
  }, []);
}
function ExtendsMapping(input) {
  return exports_guard.IsEqual(input.length, 6) ? [input[1], input[3], input[5]] : [];
}
function BaseMapping(input) {
  return exports_guard.IsArray(input) && exports_guard.IsEqual(input.length, 3) ? input[1] : input;
}
function WithMapping(input) {
  return exports_guard.IsEqual(input.length, 2) ? input[1] : [];
}
function FactorIndexArray(Type, indexArray) {
  return indexArray.reduce((result, left) => {
    const _left = left;
    return exports_guard.IsEqual(_left.length, 1) ? IndexDeferred(result, _left[0]) : exports_guard.IsEqual(_left.length, 0) ? _Array_(result) : Unreachable2();
  }, Type);
}
function FactorExtends(type, extend) {
  return exports_guard.IsEqual(extend.length, 3) ? ConditionalDeferred(type, extend[0], extend[1], extend[2]) : type;
}
function FactorWith(type, withClause) {
  return exports_guard.IsArray(withClause) && exports_guard.IsEqual(withClause.length, 0) ? type : WithDeferred(type, withClause);
}
function FactorMapping(input) {
  const [keyOf, type, indexArray, extend, withClause] = input;
  return FactorWith(keyOf ? FactorExtends(KeyOfDeferred(FactorIndexArray(type, indexArray)), extend) : FactorExtends(FactorIndexArray(type, indexArray), extend), withClause);
}
function ExprBinaryMapping(left, rest2) {
  return exports_guard.IsEqual(rest2.length, 3) ? (() => {
    const [operator, right, next] = rest2;
    const Schema = ExprBinaryMapping(right, next);
    if (exports_guard.IsEqual(operator, "&")) {
      return IsIntersect(Schema) ? Intersect([left, ...Schema.allOf]) : Intersect([left, Schema]);
    }
    if (exports_guard.IsEqual(operator, "|")) {
      return IsUnion(Schema) ? Union([left, ...Schema.anyOf]) : Union([left, Schema]);
    }
    Unreachable2();
  })() : left;
}
function ExprTermTailMapping(input) {
  return input;
}
function ExprTermMapping(input) {
  const [left, rest2] = input;
  return ExprBinaryMapping(left, rest2);
}
function ExprTailMapping(input) {
  return input;
}
function ExprMapping(input) {
  const [left, rest2] = input;
  return ExprBinaryMapping(left, rest2);
}
function ExprReadonlyMapping(input) {
  return AddImmutableDeferred(input[1]);
}
function ExprPipeMapping(input) {
  return input[1];
}
function GenericTypeMapping(input) {
  return Generic(input[0], input[2]);
}
function InferTypeMapping(input) {
  return exports_guard.IsEqual(input.length, 4) ? Infer(input[1], input[3]) : exports_guard.IsEqual(input.length, 2) ? Infer(input[1], Unknown()) : Unreachable2();
}
function TypeMapping(input) {
  return input;
}
function PropertyKeyNumberMapping(input) {
  return `${input}`;
}
function PropertyKeyIdentMapping(input) {
  return input;
}
function PropertyKeyQuotedMapping(input) {
  return input;
}
function PropertyKeyIndexMapping(input) {
  return IsInteger2(input[3]) ? IntegerKey : IsNumber3(input[3]) ? NumberKey : IsSymbol2(input[3]) ? StringKey : IsString3(input[3]) ? StringKey : Unreachable2();
}
function PropertyKeyMapping(input) {
  return input;
}
function ReadonlyMapping(input) {
  return input.length > 0;
}
function OptionalMapping(input) {
  return input.length > 0;
}
function PropertyMapping(input) {
  const [isReadonly, key, isOptional, _colon, type] = input;
  return {
    [key]: isReadonly && isOptional ? AddReadonlyDeferred(AddOptionalDeferred(type)) : isReadonly && !isOptional ? AddReadonlyDeferred(type) : !isReadonly && isOptional ? AddOptionalDeferred(type) : type
  };
}
function PropertyDelimiterMapping(input) {
  return input;
}
function PropertyListMapping(input) {
  return Delimited(input);
}
function PropertiesReduce(propertyList) {
  return propertyList.reduce((result, left) => {
    const isPatternProperties = exports_guard.HasPropertyKey(left, IntegerKey) || exports_guard.HasPropertyKey(left, NumberKey) || exports_guard.HasPropertyKey(left, StringKey);
    return isPatternProperties ? [result[0], exports_memory.Assign(result[1], left)] : [exports_memory.Assign(result[0], left), result[1]];
  }, [{}, {}]);
}
function PropertiesMapping(input) {
  return PropertiesReduce(input[1]);
}
function _Object_Mapping(input) {
  const [properties2, patternProperties] = input;
  const options = exports_guard.IsEqual(exports_guard.Keys(patternProperties).length, 0) ? {} : { patternProperties };
  return _Object_(properties2, options);
}
function ElementNamedMapping(input) {
  return exports_guard.IsEqual(input.length, 5) ? AddReadonlyDeferred(AddOptionalDeferred(input[4])) : exports_guard.IsEqual(input.length, 3) ? input[2] : exports_guard.IsEqual(input.length, 4) ? exports_guard.IsEqual(input[2], "readonly") ? AddReadonlyDeferred(input[3]) : AddOptionalDeferred(input[3]) : Unreachable2();
}
function ElementBaseMapping(input) {
  if (!exports_guard.IsArray(input) || !exports_guard.IsEqual(input.length, 3))
    return input;
  const [isReadonly, type, isOptional] = input;
  return isReadonly && isOptional ? AddReadonlyDeferred(AddOptionalDeferred(type)) : isReadonly && !isOptional ? AddReadonlyDeferred(type) : !isReadonly && isOptional ? AddOptionalDeferred(type) : type;
}
function ElementMapping(input) {
  return exports_guard.IsEqual(input.length, 2) ? Rest(input[1]) : exports_guard.IsEqual(input.length, 1) ? input[0] : Unreachable2();
}
function ElementListMapping(input) {
  return Delimited(input);
}
function _Tuple_Mapping(input) {
  return Tuple(input[1]);
}
function ParameterReadonlyOptionalMapping(input) {
  return AddReadonlyDeferred(AddOptionalDeferred(input[4]));
}
function ParameterReadonlyMapping(input) {
  return AddReadonlyDeferred(input[3]);
}
function ParameterOptionalMapping(input) {
  return AddOptionalDeferred(input[3]);
}
function ParameterTypeMapping(input) {
  return input[2];
}
function ParameterBaseMapping(input) {
  return input;
}
function ParameterMapping(input) {
  return exports_guard.IsEqual(input.length, 2) ? Rest(input[1]) : exports_guard.IsEqual(input.length, 1) ? input[0] : Unreachable2();
}
function ParameterListMapping(input) {
  return Delimited(input);
}
function _Function_Mapping(input) {
  return _Function_(input[1], input[4]);
}
function _Constructor_Mapping(input) {
  return Constructor(input[2], input[5]);
}
function ApplyReadonly(state, type) {
  return exports_guard.IsEqual(state, "remove") ? RemoveReadonlyDeferred(type) : exports_guard.IsEqual(state, "add") ? AddReadonlyDeferred(type) : type;
}
function MappedReadonlyMapping(input) {
  return exports_guard.IsEqual(input.length, 2) && exports_guard.IsEqual(input[0], "-") ? "remove" : exports_guard.IsEqual(input.length, 2) && exports_guard.IsEqual(input[0], "+") ? "add" : exports_guard.IsEqual(input.length, 1) ? "add" : "none";
}
function ApplyOptional(state, type) {
  return exports_guard.IsEqual(state, "remove") ? RemoveOptionalDeferred(type) : exports_guard.IsEqual(state, "add") ? AddOptionalDeferred(type) : type;
}
function MappedOptionalMapping(input) {
  return exports_guard.IsEqual(input.length, 2) && exports_guard.IsEqual(input[0], "-") ? "remove" : exports_guard.IsEqual(input.length, 2) && exports_guard.IsEqual(input[0], "+") ? "add" : exports_guard.IsEqual(input.length, 1) ? "add" : "none";
}
function MappedAsMapping(input) {
  return exports_guard.IsEqual(input.length, 2) ? [input[1]] : [];
}
function _Mapped_Mapping(input) {
  return exports_guard.IsArray(input[6]) && exports_guard.IsEqual(input[6].length, 1) ? MappedDeferred(Identifier(input[3]), input[5], input[6][0], ApplyReadonly(input[1], ApplyOptional(input[8], input[10]))) : MappedDeferred(Identifier(input[3]), input[5], Ref(input[3]), ApplyReadonly(input[1], ApplyOptional(input[8], input[10])));
}
function ReferenceMapping(input) {
  return Ref(input);
}
function WithBigIntMapping(input) {
  return BigInt(input);
}
function WithNumberMapping(input) {
  return parseFloat(input);
}
function WithBooleanMapping(input) {
  return exports_guard.IsEqual(input, "true");
}
function WithStringMapping(input) {
  return input;
}
function WithNullMapping(input) {
  return null;
}
function WithUndefinedMapping(input) {
  return;
}
function WithPropertyMapping(input) {
  return { [input[0]]: input[2] };
}
function WithPropertyListMapping(input) {
  return Delimited(input);
}
function WithObjectMappingReduce(propertyList) {
  return propertyList.reduce((result, left) => {
    return exports_memory.Assign(result, left);
  }, {});
}
function WithObjectMapping(input) {
  return WithObjectMappingReduce(input[1]);
}
function WithElementListMapping(input) {
  return Delimited(input);
}
function WithArrayMapping(input) {
  return input[1];
}
function WithValueMapping(input) {
  return input;
}
function PatternBigIntMapping(input) {
  return BigInt2();
}
function PatternStringMapping(input) {
  return String2();
}
function PatternNumberMapping(input) {
  return Number2();
}
function PatternIntegerMapping(input) {
  return Integer();
}
function PatternNeverMapping(input) {
  return Never();
}
function PatternTextMapping(input) {
  return Literal(input);
}
function PatternBaseMapping(input) {
  return input;
}
function PatternGroupMapping(input) {
  return Union(input[1]);
}
function PatternUnionMapping(input) {
  return input.length === 3 ? [...input[0], ...input[2]] : input.length === 1 ? [...input[0]] : [];
}
function PatternTermMapping(input) {
  return [input[0], ...input[1]];
}
function PatternBodyMapping(input) {
  return input;
}
function PatternMapping(input) {
  return input[1];
}
function InterfaceDeclarationHeritageListMapping(input) {
  return Delimited(input);
}
function InterfaceDeclarationHeritageMapping(input) {
  return exports_guard.IsEqual(input.length, 2) ? input[1] : [];
}
function InterfaceDeclarationGenericMapping(input) {
  const parameters = input[2];
  const heritage = input[3];
  const [properties2, patternProperties] = input[4];
  const options = exports_guard.IsEqual(exports_guard.Keys(patternProperties).length, 0) ? {} : { patternProperties };
  return { [input[1]]: Generic(parameters, InterfaceDeferred(heritage, properties2, options)) };
}
function InterfaceDeclarationMapping(input) {
  const heritage = input[2];
  const [properties2, patternProperties] = input[3];
  const options = exports_guard.IsEqual(exports_guard.Keys(patternProperties).length, 0) ? {} : { patternProperties };
  return { [input[1]]: InterfaceDeferred(heritage, properties2, options) };
}
function TypeAliasDeclarationGenericMapping(input) {
  return { [input[1]]: Generic(input[2], input[4]) };
}
function TypeAliasDeclarationMapping(input) {
  return { [input[1]]: input[3] };
}
function ExportKeywordMapping(input) {
  return null;
}
function ModuleDeclarationDelimiterMapping(input) {
  return input;
}
function ModuleDeclarationListMapping(input) {
  return Delimited(input);
}
function ModuleDeclarationMapping(input) {
  return input[1];
}
function ModuleMapping(input) {
  const [moduleDeclaration, moduleDeclarationList] = [input[0], input[1]];
  return ModuleDeferred(exports_memory.Assign(moduleDeclaration, PropertiesReduce(moduleDeclarationList)[0]));
}
function ScriptMapping(input) {
  return input;
}
// ../../node_modules/typebox/build/type/script/token/internal/match.mjs
function IsMatch(value) {
  return IsEqual(value.length, 2);
}
function Match2(input, ok, fail) {
  return IsMatch(input) ? ok(input[0], input[1]) : fail();
}

// ../../node_modules/typebox/build/type/script/token/internal/take.mjs
function TakeVariant(variant, input) {
  return IsEqual(input.indexOf(variant), 0) ? [variant, input.slice(variant.length)] : [];
}
function Take(variants, input) {
  for (let i = 0;i < variants.length; i++) {
    const result = TakeVariant(variants[i], input);
    if (IsMatch(result))
      return result;
  }
  return [];
}

// ../../node_modules/typebox/build/type/script/token/internal/char.mjs
function Range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => String.fromCharCode(start + i));
}
var Alpha = [
  ...Range(97, 122),
  ...Range(65, 90)
];
var Zero = "0";
var NonZero = Range(49, 57);
var Digit = [Zero, ...NonZero];
var WhiteSpace = " ";
var NewLine = `
`;
var UnderScore = "_";
var Dot = ".";
var DollarSign = "$";
var Hyphen = "-";

// ../../node_modules/typebox/build/type/script/token/internal/trim.mjs
var LineComment = "//";
var OpenComment = "/*";
var CloseComment = "*/";
function DiscardMultilineComment(input) {
  const index = input.indexOf(CloseComment);
  const result = IsEqual(index, -1) ? "" : input.slice(index + 2);
  return result;
}
function DiscardLineComment(input) {
  const index = input.indexOf(NewLine);
  const result = IsEqual(index, -1) ? "" : input.slice(index);
  return result;
}
function TrimStartUntilNewline(input) {
  return input.replace(/^[ \t\r\f\v]+/, "");
}
function TrimWhitespace(input) {
  const trimmed = TrimStartUntilNewline(input);
  return trimmed.startsWith(OpenComment) ? TrimWhitespace(DiscardMultilineComment(trimmed.slice(2))) : trimmed.startsWith(LineComment) ? TrimWhitespace(DiscardLineComment(trimmed.slice(2))) : trimmed;
}
function Trim(input) {
  const trimmed = input.trimStart();
  return trimmed.startsWith(OpenComment) ? Trim(DiscardMultilineComment(trimmed.slice(2))) : trimmed.startsWith(LineComment) ? Trim(DiscardLineComment(trimmed.slice(2))) : trimmed;
}

// ../../node_modules/typebox/build/type/script/token/internal/optional.mjs
function Optional2(value, input) {
  return Match2(Take([value], input), (Optional3, Rest2) => [Optional3, Rest2], () => ["", input]);
}

// ../../node_modules/typebox/build/type/script/token/internal/many.mjs
function IsDiscard(discard2, input) {
  return discard2.includes(input);
}
function Many(allowed2, discard2, input, result = "") {
  return Match2(Take(allowed2, input), (Char, Rest2) => IsDiscard(discard2, Char) ? Many(allowed2, discard2, Rest2, result) : Many(allowed2, discard2, Rest2, `${result}${Char}`), () => [result, input]);
}

// ../../node_modules/typebox/build/type/script/token/unsigned_integer.mjs
function TakeNonZero(input) {
  return Take(NonZero, input);
}
var AllowedDigits = [...Digit, UnderScore];
function TakeDigits(input) {
  return Many(AllowedDigits, [UnderScore], input);
}
function TakeUnsignedInteger(input) {
  return Match2(Take([Zero], input), (Zero2, ZeroRest) => [Zero2, ZeroRest], () => Match2(TakeNonZero(input), (NonZero2, NonZeroRest) => Match2(TakeDigits(NonZeroRest), (Digits, DigitsRest) => [`${NonZero2}${Digits}`, DigitsRest], () => []), () => []));
}
function UnsignedInteger(input) {
  return TakeUnsignedInteger(Trim(input));
}

// ../../node_modules/typebox/build/type/script/token/integer.mjs
function TakeSign(input) {
  return Optional2(Hyphen, input);
}
function TakeSignedInteger(input) {
  return Match2(TakeSign(input), (Sign, SignRest) => Match2(UnsignedInteger(SignRest), (UnsignedInteger2, UnsignedIntegerRest) => [`${Sign}${UnsignedInteger2}`, UnsignedIntegerRest], () => []), () => []);
}
function Integer2(input) {
  return TakeSignedInteger(Trim(input));
}

// ../../node_modules/typebox/build/type/script/token/bigint.mjs
function TakeBigInt(input) {
  return Match2(Integer2(input), (Integer3, IntegerRest) => Match2(Take(["n"], IntegerRest), (_N, NRest) => [`${Integer3}`, NRest], () => []), () => []);
}
function BigInt3(input) {
  return TakeBigInt(input);
}
// ../../node_modules/typebox/build/type/script/token/const.mjs
function TakeConst(const_, input) {
  return Take([const_], input);
}
function Const(const_, input) {
  return IsEqual(const_, "") ? ["", input] : const_.startsWith(NewLine) ? TakeConst(const_, TrimWhitespace(input)) : const_.startsWith(WhiteSpace) ? TakeConst(const_, input) : TakeConst(const_, Trim(input));
}
// ../../node_modules/typebox/build/type/script/token/ident.mjs
var Initial = [...Alpha, UnderScore, DollarSign];
function TakeInitial(input) {
  return Take(Initial, input);
}
var Remaining = [...Initial, ...Digit];
function TakeRemaining(input, result = "") {
  return Match2(Take(Remaining, input), (Remaining2, RemainingRest) => TakeRemaining(RemainingRest, `${result}${Remaining2}`), () => [result, input]);
}
function TakeIdent(input) {
  return Match2(TakeInitial(input), (Initial2, InitialRest) => Match2(TakeRemaining(InitialRest), (Remaining2, RemainingRest) => [`${Initial2}${Remaining2}`, RemainingRest], () => []), () => []);
}
function Ident(input) {
  return TakeIdent(Trim(input));
}
// ../../node_modules/typebox/build/type/script/token/unsigned_number.mjs
var AllowedDigits2 = [...Digit, UnderScore];
function IsLeadingDot(input) {
  return IsMatch(Take([Dot], input));
}
function TakeFractional(input) {
  return Match2(Many(AllowedDigits2, [UnderScore], input), (Digits, DigitsRest) => IsEqual(Digits, "") ? [] : [Digits, DigitsRest], () => []);
}
function LeadingDot(input) {
  return Match2(Take([Dot], input), (Dot2, DotRest) => Match2(TakeFractional(DotRest), (Fractional, FractionalRest) => [`0${Dot2}${Fractional}`, FractionalRest], () => []), () => []);
}
function LeadingInteger(input) {
  return Match2(UnsignedInteger(input), (Integer3, IntegerRest) => Match2(Take([Dot], IntegerRest), (Dot2, DotRest) => Match2(TakeFractional(DotRest), (Fractional, FractionalRest) => [`${Integer3}${Dot2}${Fractional}`, FractionalRest], () => [`${Integer3}`, DotRest]), () => [`${Integer3}`, IntegerRest]), () => []);
}
function TakeUnsignedNumber(input) {
  return IsLeadingDot(input) ? LeadingDot(input) : LeadingInteger(input);
}
function UnsignedNumber(input) {
  return TakeUnsignedNumber(Trim(input));
}

// ../../node_modules/typebox/build/type/script/token/number.mjs
function TakeSign2(input) {
  return Optional2(Hyphen, input);
}
function TakeSignedNumber(input) {
  return Match2(TakeSign2(input), (Sign, SignRest) => Match2(UnsignedNumber(SignRest), (UnsignedInteger2, UnsignedIntegerRest) => [`${Sign}${UnsignedInteger2}`, UnsignedIntegerRest], () => []), () => []);
}
function Number3(input) {
  return TakeSignedNumber(Trim(input));
}
// ../../node_modules/typebox/build/type/script/token/until.mjs
function TakeOne(input) {
  const result = IsEqual(input, "") ? [] : [input.slice(0, 1), input.slice(1)];
  return result;
}
function IsInputMatchSentinal(end, input) {
  return ShiftLeft(end, (left, right) => input.startsWith(left) ? true : IsInputMatchSentinal(right, input), () => false);
}
function Until(end, input, result = "") {
  return Match2(TakeOne(input), (One, Rest2) => IsInputMatchSentinal(end, input) ? [result, input] : Until(end, Rest2, `${result}${One}`), () => []);
}

// ../../node_modules/typebox/build/type/script/token/span.mjs
function MultiLine(start, end, input) {
  return Match2(Take([start], input), (_, Rest2) => Match2(Until([end], Rest2), (Until2, UntilRest) => Match2(Take([end], UntilRest), (_2, Rest3) => [`${Until2}`, Rest3], () => []), () => []), () => []);
}
function SingleLine(start, end, input) {
  return Match2(Take([start], input), (_, Rest2) => Match2(Until([NewLine, end], Rest2), (Until2, UntilRest) => Match2(Take([end], UntilRest), (_2, EndRest) => [`${Until2}`, EndRest], () => []), () => []), () => []);
}
function Span(start, end, multiLine, input) {
  return multiLine ? MultiLine(start, end, Trim(input)) : SingleLine(start, end, Trim(input));
}
// ../../node_modules/typebox/build/type/script/token/string.mjs
function TakeInitial2(quotes, input) {
  return Take(quotes, input);
}
function TakeSpan(quote, input) {
  return Span(quote, quote, false, input);
}
function TakeString(quotes, input) {
  return Match2(TakeInitial2(quotes, input), (Initial2, InitialRest) => TakeSpan(Initial2, `${Initial2}${InitialRest}`), () => []);
}
function String3(quotes, input) {
  return TakeString(quotes, Trim(input));
}
// ../../node_modules/typebox/build/type/script/token/until_1.mjs
function Until_1(end, input) {
  return Match2(Until(end, input), (Until2, UntilRest) => IsEqual(Until2, "") ? [] : [Until2, UntilRest], () => []);
}
// ../../node_modules/typebox/build/type/script/parser.mjs
var If = (result, left, right = () => []) => result.length === 2 ? left(result) : right();
var GenericParameterExtendsEquals = (input) => If(If(Ident(input), ([_0, input2]) => If(Const("extends", input2), ([_1, input3]) => If(Type(input3), ([_2, input4]) => If(Const("=", input4), ([_3, input5]) => If(Type(input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [GenericParameterExtendsEqualsMapping(_0), input2]);
var GenericParameterExtends = (input) => If(If(Ident(input), ([_0, input2]) => If(Const("extends", input2), ([_1, input3]) => If(Type(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [GenericParameterExtendsMapping(_0), input2]);
var GenericParameterEquals = (input) => If(If(Ident(input), ([_0, input2]) => If(Const("=", input2), ([_1, input3]) => If(Type(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [GenericParameterEqualsMapping(_0), input2]);
var GenericParameterIdentifier = (input) => If(Ident(input), ([_0, input2]) => [GenericParameterIdentifierMapping(_0), input2]);
var GenericParameter = (input) => If(If(GenericParameterExtendsEquals(input), ([_0, input2]) => [_0, input2], () => If(GenericParameterExtends(input), ([_0, input2]) => [_0, input2], () => If(GenericParameterEquals(input), ([_0, input2]) => [_0, input2], () => If(GenericParameterIdentifier(input), ([_0, input2]) => [_0, input2], () => [])))), ([_0, input2]) => [GenericParameterMapping(_0), input2]);
var GenericParameterList_0 = (input, result = []) => If(If(Const(",", input), ([_0, input2]) => If(GenericParameter(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => GenericParameterList_0(input2, [...result, _0]), () => [result, input]);
var GenericParameterList = (input) => If(If(If(GenericParameter(input), ([_0, input2]) => If(GenericParameterList_0(input2), ([_1, input3]) => If(If(Const(",", input3), ([_02, input4]) => [[_02], input4], () => [[], input3]), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [GenericParameterListMapping(_0), input2]);
var GenericParameters = (input) => If(If(Const("<", input), ([_0, input2]) => If(GenericParameterList(input2), ([_1, input3]) => If(Const(">", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [GenericParametersMapping(_0), input2]);
var GenericCallArgumentList_0 = (input, result = []) => If(If(Const(",", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => GenericCallArgumentList_0(input2, [...result, _0]), () => [result, input]);
var GenericCallArgumentList = (input) => If(If(If(Type(input), ([_0, input2]) => If(GenericCallArgumentList_0(input2), ([_1, input3]) => If(If(Const(",", input3), ([_02, input4]) => [[_02], input4], () => [[], input3]), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [GenericCallArgumentListMapping(_0), input2]);
var GenericCallArguments = (input) => If(If(Const("<", input), ([_0, input2]) => If(GenericCallArgumentList(input2), ([_1, input3]) => If(Const(">", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [GenericCallArgumentsMapping(_0), input2]);
var GenericCall = (input) => If(If(Ident(input), ([_0, input2]) => If(GenericCallArguments(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [GenericCallMapping(_0), input2]);
var OptionalSemiColon = (input) => If(If(If(Const(";", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [OptionalSemiColonMapping(_0), input2]);
var KeywordString = (input) => If(Const("string", input), ([_0, input2]) => [KeywordStringMapping(_0), input2]);
var KeywordNumber = (input) => If(Const("number", input), ([_0, input2]) => [KeywordNumberMapping(_0), input2]);
var KeywordBoolean = (input) => If(Const("boolean", input), ([_0, input2]) => [KeywordBooleanMapping(_0), input2]);
var KeywordUndefined = (input) => If(Const("undefined", input), ([_0, input2]) => [KeywordUndefinedMapping(_0), input2]);
var KeywordNull = (input) => If(Const("null", input), ([_0, input2]) => [KeywordNullMapping(_0), input2]);
var KeywordInteger = (input) => If(Const("integer", input), ([_0, input2]) => [KeywordIntegerMapping(_0), input2]);
var KeywordBigInt = (input) => If(Const("bigint", input), ([_0, input2]) => [KeywordBigIntMapping(_0), input2]);
var KeywordUnknown = (input) => If(Const("unknown", input), ([_0, input2]) => [KeywordUnknownMapping(_0), input2]);
var KeywordAny = (input) => If(Const("any", input), ([_0, input2]) => [KeywordAnyMapping(_0), input2]);
var KeywordObject = (input) => If(Const("object", input), ([_0, input2]) => [KeywordObjectMapping(_0), input2]);
var KeywordNever = (input) => If(Const("never", input), ([_0, input2]) => [KeywordNeverMapping(_0), input2]);
var KeywordSymbol = (input) => If(Const("symbol", input), ([_0, input2]) => [KeywordSymbolMapping(_0), input2]);
var KeywordVoid = (input) => If(Const("void", input), ([_0, input2]) => [KeywordVoidMapping(_0), input2]);
var KeywordThis = (input) => If(Const("this", input), ([_0, input2]) => [KeywordThisMapping(_0), input2]);
var TemplateInterpolate = (input) => If(If(Const("${", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => If(Const("}", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [TemplateInterpolateMapping(_0), input2]);
var TemplateSpan = (input) => If(Until(["${", "`"], input), ([_0, input2]) => [TemplateSpanMapping(_0), input2]);
var TemplateBody = (input) => If(If(If(TemplateSpan(input), ([_0, input2]) => If(TemplateInterpolate(input2), ([_1, input3]) => If(TemplateBody(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If(If(TemplateSpan(input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If(If(TemplateSpan(input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => []))), ([_0, input2]) => [TemplateBodyMapping(_0), input2]);
var TemplateLiteralTypes = (input) => If(If(Const("`", input), ([_0, input2]) => If(TemplateBody(input2), ([_1, input3]) => If(Const("`", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [TemplateLiteralTypesMapping(_0), input2]);
var TemplateLiteral = (input) => If(TemplateLiteralTypes(input), ([_0, input2]) => [TemplateLiteralMapping(_0), input2]);
var Dependent2 = (input) => If(If(If(Const("if", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => If(Const("then", input3), ([_2, input4]) => If(Type(input4), ([_3, input5]) => If(Const("else", input5), ([_4, input6]) => If(Type(input6), ([_5, input7]) => [[_0, _1, _2, _3, _4, _5], input7])))))), ([_0, input2]) => [_0, input2], () => If(If(Const("if", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => If(Const("then", input3), ([_2, input4]) => If(Type(input4), ([_3, input5]) => [[_0, _1, _2, _3], input5])))), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [DependentMapping(_0), input2]);
var LiteralBigInt = (input) => If(BigInt3(input), ([_0, input2]) => [LiteralBigIntMapping(_0), input2]);
var LiteralBoolean = (input) => If(If(Const("true", input), ([_0, input2]) => [_0, input2], () => If(Const("false", input), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [LiteralBooleanMapping(_0), input2]);
var LiteralNumber = (input) => If(Number3(input), ([_0, input2]) => [LiteralNumberMapping(_0), input2]);
var LiteralString = (input) => If(String3(["'", '"'], input), ([_0, input2]) => [LiteralStringMapping(_0), input2]);
var KeyOf = (input) => If(If(If(Const("keyof", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [KeyOfMapping(_0), input2]);
var IndexArray_0 = (input, result = []) => If(If(If(Const("[", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => If(Const("]", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If(If(Const("[", input), ([_0, input2]) => If(Const("]", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => IndexArray_0(input2, [...result, _0]), () => [result, input]);
var IndexArray = (input) => If(IndexArray_0(input), ([_0, input2]) => [IndexArrayMapping(_0), input2]);
var Extends2 = (input) => If(If(If(Const("extends", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => If(Const("?", input3), ([_2, input4]) => If(Type(input4), ([_3, input5]) => If(Const(":", input5), ([_4, input6]) => If(Type(input6), ([_5, input7]) => [[_0, _1, _2, _3, _4, _5], input7])))))), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ExtendsMapping(_0), input2]);
var Base = (input) => If(If(If(Const("(", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => If(Const(")", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If(KeywordString(input), ([_0, input2]) => [_0, input2], () => If(KeywordNumber(input), ([_0, input2]) => [_0, input2], () => If(KeywordBoolean(input), ([_0, input2]) => [_0, input2], () => If(KeywordUndefined(input), ([_0, input2]) => [_0, input2], () => If(KeywordNull(input), ([_0, input2]) => [_0, input2], () => If(KeywordInteger(input), ([_0, input2]) => [_0, input2], () => If(KeywordBigInt(input), ([_0, input2]) => [_0, input2], () => If(KeywordUnknown(input), ([_0, input2]) => [_0, input2], () => If(KeywordAny(input), ([_0, input2]) => [_0, input2], () => If(KeywordObject(input), ([_0, input2]) => [_0, input2], () => If(KeywordNever(input), ([_0, input2]) => [_0, input2], () => If(KeywordSymbol(input), ([_0, input2]) => [_0, input2], () => If(KeywordVoid(input), ([_0, input2]) => [_0, input2], () => If(KeywordThis(input), ([_0, input2]) => [_0, input2], () => If(LiteralBigInt(input), ([_0, input2]) => [_0, input2], () => If(LiteralBoolean(input), ([_0, input2]) => [_0, input2], () => If(LiteralNumber(input), ([_0, input2]) => [_0, input2], () => If(LiteralString(input), ([_0, input2]) => [_0, input2], () => If(TemplateLiteral(input), ([_0, input2]) => [_0, input2], () => If(Dependent2(input), ([_0, input2]) => [_0, input2], () => If(_Object_2(input), ([_0, input2]) => [_0, input2], () => If(_Tuple_(input), ([_0, input2]) => [_0, input2], () => If(_Constructor_(input), ([_0, input2]) => [_0, input2], () => If(_Function_2(input), ([_0, input2]) => [_0, input2], () => If(_Mapped_(input), ([_0, input2]) => [_0, input2], () => If(GenericCall(input), ([_0, input2]) => [_0, input2], () => If(Reference(input), ([_0, input2]) => [_0, input2], () => [])))))))))))))))))))))))))))), ([_0, input2]) => [BaseMapping(_0), input2]);
var With = (input) => If(If(If(Const("with", input), ([_0, input2]) => If(WithObject(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [WithMapping(_0), input2]);
var Factor = (input) => If(If(KeyOf(input), ([_0, input2]) => If(Base(input2), ([_1, input3]) => If(IndexArray(input3), ([_2, input4]) => If(Extends2(input4), ([_3, input5]) => If(With(input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [FactorMapping(_0), input2]);
var ExprTermTail = (input) => If(If(If(Const("&", input), ([_0, input2]) => If(Factor(input2), ([_1, input3]) => If(ExprTermTail(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ExprTermTailMapping(_0), input2]);
var ExprTerm = (input) => If(If(Factor(input), ([_0, input2]) => If(ExprTermTail(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [ExprTermMapping(_0), input2]);
var ExprTail = (input) => If(If(If(Const("|", input), ([_0, input2]) => If(ExprTerm(input2), ([_1, input3]) => If(ExprTail(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ExprTailMapping(_0), input2]);
var Expr = (input) => If(If(ExprTerm(input), ([_0, input2]) => If(ExprTail(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [ExprMapping(_0), input2]);
var ExprReadonly = (input) => If(If(Const("readonly", input), ([_0, input2]) => If(Expr(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [ExprReadonlyMapping(_0), input2]);
var ExprPipe = (input) => If(If(Const("|", input), ([_0, input2]) => If(Expr(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [ExprPipeMapping(_0), input2]);
var GenericType = (input) => If(If(GenericParameters(input), ([_0, input2]) => If(Const("=", input2), ([_1, input3]) => If(Type(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [GenericTypeMapping(_0), input2]);
var InferType = (input) => If(If(If(Const("infer", input), ([_0, input2]) => If(Ident(input2), ([_1, input3]) => If(Const("extends", input3), ([_2, input4]) => If(Expr(input4), ([_3, input5]) => [[_0, _1, _2, _3], input5])))), ([_0, input2]) => [_0, input2], () => If(If(Const("infer", input), ([_0, input2]) => If(Ident(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [InferTypeMapping(_0), input2]);
var Type = (input) => If(If(InferType(input), ([_0, input2]) => [_0, input2], () => If(ExprPipe(input), ([_0, input2]) => [_0, input2], () => If(ExprReadonly(input), ([_0, input2]) => [_0, input2], () => If(Expr(input), ([_0, input2]) => [_0, input2], () => [])))), ([_0, input2]) => [TypeMapping(_0), input2]);
var PropertyKeyNumber = (input) => If(Number3(input), ([_0, input2]) => [PropertyKeyNumberMapping(_0), input2]);
var PropertyKeyIdent = (input) => If(Ident(input), ([_0, input2]) => [PropertyKeyIdentMapping(_0), input2]);
var PropertyKeyQuoted = (input) => If(String3(["'", '"'], input), ([_0, input2]) => [PropertyKeyQuotedMapping(_0), input2]);
var PropertyKeyIndex = (input) => If(If(Const("[", input), ([_0, input2]) => If(Ident(input2), ([_1, input3]) => If(Const(":", input3), ([_2, input4]) => If(If(KeywordInteger(input4), ([_02, input5]) => [_02, input5], () => If(KeywordNumber(input4), ([_02, input5]) => [_02, input5], () => If(KeywordString(input4), ([_02, input5]) => [_02, input5], () => If(KeywordSymbol(input4), ([_02, input5]) => [_02, input5], () => [])))), ([_3, input5]) => If(Const("]", input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [PropertyKeyIndexMapping(_0), input2]);
var PropertyKey = (input) => If(If(PropertyKeyNumber(input), ([_0, input2]) => [_0, input2], () => If(PropertyKeyIdent(input), ([_0, input2]) => [_0, input2], () => If(PropertyKeyQuoted(input), ([_0, input2]) => [_0, input2], () => If(PropertyKeyIndex(input), ([_0, input2]) => [_0, input2], () => [])))), ([_0, input2]) => [PropertyKeyMapping(_0), input2]);
var Readonly2 = (input) => If(If(If(Const("readonly", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ReadonlyMapping(_0), input2]);
var Optional3 = (input) => If(If(If(Const("?", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [OptionalMapping(_0), input2]);
var Property = (input) => If(If(Readonly2(input), ([_0, input2]) => If(PropertyKey(input2), ([_1, input3]) => If(Optional3(input3), ([_2, input4]) => If(Const(":", input4), ([_3, input5]) => If(Type(input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [PropertyMapping(_0), input2]);
var PropertyDelimiter = (input) => If(If(If(Const(",", input), ([_0, input2]) => If(Const(`
`, input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(Const(";", input), ([_0, input2]) => If(Const(`
`, input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(Const(",", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If(If(Const(";", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If(If(Const(`
`, input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => []))))), ([_0, input2]) => [PropertyDelimiterMapping(_0), input2]);
var PropertyList_0 = (input, result = []) => If(If(PropertyDelimiter(input), ([_0, input2]) => If(Property(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => PropertyList_0(input2, [...result, _0]), () => [result, input]);
var PropertyList = (input) => If(If(If(Property(input), ([_0, input2]) => If(PropertyList_0(input2), ([_1, input3]) => If(If(PropertyDelimiter(input3), ([_02, input4]) => [[_02], input4], () => [[], input3]), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [PropertyListMapping(_0), input2]);
var Properties = (input) => If(If(Const("{", input), ([_0, input2]) => If(PropertyList(input2), ([_1, input3]) => If(Const("}", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [PropertiesMapping(_0), input2]);
var _Object_2 = (input) => If(Properties(input), ([_0, input2]) => [_Object_Mapping(_0), input2]);
var ElementNamed = (input) => If(If(If(Ident(input), ([_0, input2]) => If(Const("?", input2), ([_1, input3]) => If(Const(":", input3), ([_2, input4]) => If(Const("readonly", input4), ([_3, input5]) => If(Type(input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [_0, input2], () => If(If(Ident(input), ([_0, input2]) => If(Const(":", input2), ([_1, input3]) => If(Const("readonly", input3), ([_2, input4]) => If(Type(input4), ([_3, input5]) => [[_0, _1, _2, _3], input5])))), ([_0, input2]) => [_0, input2], () => If(If(Ident(input), ([_0, input2]) => If(Const("?", input2), ([_1, input3]) => If(Const(":", input3), ([_2, input4]) => If(Type(input4), ([_3, input5]) => [[_0, _1, _2, _3], input5])))), ([_0, input2]) => [_0, input2], () => If(If(Ident(input), ([_0, input2]) => If(Const(":", input2), ([_1, input3]) => If(Type(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => [])))), ([_0, input2]) => [ElementNamedMapping(_0), input2]);
var ElementBase = (input) => If(If(ElementNamed(input), ([_0, input2]) => [_0, input2], () => If(If(Readonly2(input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => If(Optional3(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ElementBaseMapping(_0), input2]);
var Element = (input) => If(If(If(Const("...", input), ([_0, input2]) => If(ElementBase(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(ElementBase(input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ElementMapping(_0), input2]);
var ElementList_0 = (input, result = []) => If(If(Const(",", input), ([_0, input2]) => If(Element(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => ElementList_0(input2, [...result, _0]), () => [result, input]);
var ElementList = (input) => If(If(If(Element(input), ([_0, input2]) => If(ElementList_0(input2), ([_1, input3]) => If(If(Const(",", input3), ([_02, input4]) => [[_02], input4], () => [[], input3]), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ElementListMapping(_0), input2]);
var _Tuple_ = (input) => If(If(Const("[", input), ([_0, input2]) => If(ElementList(input2), ([_1, input3]) => If(Const("]", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_Tuple_Mapping(_0), input2]);
var ParameterReadonlyOptional = (input) => If(If(Ident(input), ([_0, input2]) => If(Const("?", input2), ([_1, input3]) => If(Const(":", input3), ([_2, input4]) => If(Const("readonly", input4), ([_3, input5]) => If(Type(input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [ParameterReadonlyOptionalMapping(_0), input2]);
var ParameterReadonly = (input) => If(If(Ident(input), ([_0, input2]) => If(Const(":", input2), ([_1, input3]) => If(Const("readonly", input3), ([_2, input4]) => If(Type(input4), ([_3, input5]) => [[_0, _1, _2, _3], input5])))), ([_0, input2]) => [ParameterReadonlyMapping(_0), input2]);
var ParameterOptional = (input) => If(If(Ident(input), ([_0, input2]) => If(Const("?", input2), ([_1, input3]) => If(Const(":", input3), ([_2, input4]) => If(Type(input4), ([_3, input5]) => [[_0, _1, _2, _3], input5])))), ([_0, input2]) => [ParameterOptionalMapping(_0), input2]);
var ParameterType = (input) => If(If(Ident(input), ([_0, input2]) => If(Const(":", input2), ([_1, input3]) => If(Type(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [ParameterTypeMapping(_0), input2]);
var ParameterBase = (input) => If(If(ParameterReadonlyOptional(input), ([_0, input2]) => [_0, input2], () => If(ParameterReadonly(input), ([_0, input2]) => [_0, input2], () => If(ParameterOptional(input), ([_0, input2]) => [_0, input2], () => If(ParameterType(input), ([_0, input2]) => [_0, input2], () => [])))), ([_0, input2]) => [ParameterBaseMapping(_0), input2]);
var Parameter2 = (input) => If(If(If(Const("...", input), ([_0, input2]) => If(ParameterBase(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(ParameterBase(input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ParameterMapping(_0), input2]);
var ParameterList_0 = (input, result = []) => If(If(Const(",", input), ([_0, input2]) => If(Parameter2(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => ParameterList_0(input2, [...result, _0]), () => [result, input]);
var ParameterList = (input) => If(If(If(Parameter2(input), ([_0, input2]) => If(ParameterList_0(input2), ([_1, input3]) => If(If(Const(",", input3), ([_02, input4]) => [[_02], input4], () => [[], input3]), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ParameterListMapping(_0), input2]);
var _Function_2 = (input) => If(If(Const("(", input), ([_0, input2]) => If(ParameterList(input2), ([_1, input3]) => If(Const(")", input3), ([_2, input4]) => If(Const("=>", input4), ([_3, input5]) => If(Type(input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [_Function_Mapping(_0), input2]);
var _Constructor_ = (input) => If(If(Const("new", input), ([_0, input2]) => If(Const("(", input2), ([_1, input3]) => If(ParameterList(input3), ([_2, input4]) => If(Const(")", input4), ([_3, input5]) => If(Const("=>", input5), ([_4, input6]) => If(Type(input6), ([_5, input7]) => [[_0, _1, _2, _3, _4, _5], input7])))))), ([_0, input2]) => [_Constructor_Mapping(_0), input2]);
var MappedReadonly = (input) => If(If(If(Const("+", input), ([_0, input2]) => If(Const("readonly", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(Const("-", input), ([_0, input2]) => If(Const("readonly", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(Const("readonly", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])))), ([_0, input2]) => [MappedReadonlyMapping(_0), input2]);
var MappedOptional = (input) => If(If(If(Const("+", input), ([_0, input2]) => If(Const("?", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(Const("-", input), ([_0, input2]) => If(Const("?", input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(Const("?", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])))), ([_0, input2]) => [MappedOptionalMapping(_0), input2]);
var MappedAs = (input) => If(If(If(Const("as", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [MappedAsMapping(_0), input2]);
var _Mapped_ = (input) => If(If(Const("{", input), ([_0, input2]) => If(MappedReadonly(input2), ([_1, input3]) => If(Const("[", input3), ([_2, input4]) => If(Ident(input4), ([_3, input5]) => If(Const("in", input5), ([_4, input6]) => If(Type(input6), ([_5, input7]) => If(MappedAs(input7), ([_6, input8]) => If(Const("]", input8), ([_7, input9]) => If(MappedOptional(input9), ([_8, input10]) => If(Const(":", input10), ([_9, input11]) => If(Type(input11), ([_10, input12]) => If(OptionalSemiColon(input12), ([_11, input13]) => If(Const("}", input13), ([_12, input14]) => [[_0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12], input14]))))))))))))), ([_0, input2]) => [_Mapped_Mapping(_0), input2]);
var Reference = (input) => If(Ident(input), ([_0, input2]) => [ReferenceMapping(_0), input2]);
var WithBigInt = (input) => If(BigInt3(input), ([_0, input2]) => [WithBigIntMapping(_0), input2]);
var WithNumber = (input) => If(Number3(input), ([_0, input2]) => [WithNumberMapping(_0), input2]);
var WithBoolean = (input) => If(If(Const("true", input), ([_0, input2]) => [_0, input2], () => If(Const("false", input), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [WithBooleanMapping(_0), input2]);
var WithString = (input) => If(String3(['"', "'"], input), ([_0, input2]) => [WithStringMapping(_0), input2]);
var WithNull = (input) => If(Const("null", input), ([_0, input2]) => [WithNullMapping(_0), input2]);
var WithUndefined = (input) => If(Const("undefined", input), ([_0, input2]) => [WithUndefinedMapping(_0), input2]);
var WithProperty = (input) => If(If(PropertyKey(input), ([_0, input2]) => If(Const(":", input2), ([_1, input3]) => If(WithValue(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [WithPropertyMapping(_0), input2]);
var WithPropertyList_0 = (input, result = []) => If(If(PropertyDelimiter(input), ([_0, input2]) => If(WithProperty(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => WithPropertyList_0(input2, [...result, _0]), () => [result, input]);
var WithPropertyList = (input) => If(If(If(WithProperty(input), ([_0, input2]) => If(WithPropertyList_0(input2), ([_1, input3]) => If(If(PropertyDelimiter(input3), ([_02, input4]) => [[_02], input4], () => [[], input3]), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [WithPropertyListMapping(_0), input2]);
var WithObject = (input) => If(If(Const("{", input), ([_0, input2]) => If(WithPropertyList(input2), ([_1, input3]) => If(Const("}", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [WithObjectMapping(_0), input2]);
var WithElementList_0 = (input, result = []) => If(If(Const(",", input), ([_0, input2]) => If(WithValue(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => WithElementList_0(input2, [...result, _0]), () => [result, input]);
var WithElementList = (input) => If(If(If(WithValue(input), ([_0, input2]) => If(WithElementList_0(input2), ([_1, input3]) => If(If(Const(",", input3), ([_02, input4]) => [[_02], input4], () => [[], input3]), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [WithElementListMapping(_0), input2]);
var WithArray = (input) => If(If(Const("[", input), ([_0, input2]) => If(WithElementList(input2), ([_1, input3]) => If(Const("]", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [WithArrayMapping(_0), input2]);
var WithValue = (input) => If(If(WithBigInt(input), ([_0, input2]) => [_0, input2], () => If(WithNumber(input), ([_0, input2]) => [_0, input2], () => If(WithBoolean(input), ([_0, input2]) => [_0, input2], () => If(WithString(input), ([_0, input2]) => [_0, input2], () => If(WithNull(input), ([_0, input2]) => [_0, input2], () => If(WithUndefined(input), ([_0, input2]) => [_0, input2], () => If(WithObject(input), ([_0, input2]) => [_0, input2], () => If(WithArray(input), ([_0, input2]) => [_0, input2], () => [])))))))), ([_0, input2]) => [WithValueMapping(_0), input2]);
var PatternBigInt = (input) => If(Const("-?(?:0|[1-9][0-9]*)n", input), ([_0, input2]) => [PatternBigIntMapping(_0), input2]);
var PatternString = (input) => If(Const(".*", input), ([_0, input2]) => [PatternStringMapping(_0), input2]);
var PatternNumber = (input) => If(Const("-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?", input), ([_0, input2]) => [PatternNumberMapping(_0), input2]);
var PatternInteger = (input) => If(Const("-?(?:0|[1-9][0-9]*)", input), ([_0, input2]) => [PatternIntegerMapping(_0), input2]);
var PatternNever = (input) => If(Const("(?!)", input), ([_0, input2]) => [PatternNeverMapping(_0), input2]);
var PatternText = (input) => If(Until_1(["-?(?:0|[1-9][0-9]*)n", ".*", "-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?", "-?(?:0|[1-9][0-9]*)", "(?!)", "(", ")", "$", "|"], input), ([_0, input2]) => [PatternTextMapping(_0), input2]);
var PatternBase = (input) => If(If(PatternBigInt(input), ([_0, input2]) => [_0, input2], () => If(PatternString(input), ([_0, input2]) => [_0, input2], () => If(PatternNumber(input), ([_0, input2]) => [_0, input2], () => If(PatternInteger(input), ([_0, input2]) => [_0, input2], () => If(PatternNever(input), ([_0, input2]) => [_0, input2], () => If(PatternGroup(input), ([_0, input2]) => [_0, input2], () => If(PatternText(input), ([_0, input2]) => [_0, input2], () => []))))))), ([_0, input2]) => [PatternBaseMapping(_0), input2]);
var PatternGroup = (input) => If(If(Const("(", input), ([_0, input2]) => If(PatternBody(input2), ([_1, input3]) => If(Const(")", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [PatternGroupMapping(_0), input2]);
var PatternUnion = (input) => If(If(If(PatternTerm(input), ([_0, input2]) => If(Const("|", input2), ([_1, input3]) => If(PatternUnion(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If(If(PatternTerm(input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => []))), ([_0, input2]) => [PatternUnionMapping(_0), input2]);
var PatternTerm = (input) => If(If(PatternBase(input), ([_0, input2]) => If(PatternBody(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [PatternTermMapping(_0), input2]);
var PatternBody = (input) => If(If(PatternUnion(input), ([_0, input2]) => [_0, input2], () => If(PatternTerm(input), ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [PatternBodyMapping(_0), input2]);
var Pattern = (input) => If(If(Const("^", input), ([_0, input2]) => If(PatternBody(input2), ([_1, input3]) => If(Const("$", input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [PatternMapping(_0), input2]);
var InterfaceDeclarationHeritageList_0 = (input, result = []) => If(If(Const(",", input), ([_0, input2]) => If(Type(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => InterfaceDeclarationHeritageList_0(input2, [...result, _0]), () => [result, input]);
var InterfaceDeclarationHeritageList = (input) => If(If(If(Type(input), ([_0, input2]) => If(InterfaceDeclarationHeritageList_0(input2), ([_1, input3]) => If(If(Const(",", input3), ([_02, input4]) => [[_02], input4], () => [[], input3]), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [InterfaceDeclarationHeritageListMapping(_0), input2]);
var InterfaceDeclarationHeritage = (input) => If(If(If(Const("extends", input), ([_0, input2]) => If(InterfaceDeclarationHeritageList(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [InterfaceDeclarationHeritageMapping(_0), input2]);
var InterfaceDeclarationGeneric = (input) => If(If(Const("interface", input), ([_0, input2]) => If(Ident(input2), ([_1, input3]) => If(GenericParameters(input3), ([_2, input4]) => If(InterfaceDeclarationHeritage(input4), ([_3, input5]) => If(Properties(input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [InterfaceDeclarationGenericMapping(_0), input2]);
var InterfaceDeclaration = (input) => If(If(Const("interface", input), ([_0, input2]) => If(Ident(input2), ([_1, input3]) => If(InterfaceDeclarationHeritage(input3), ([_2, input4]) => If(Properties(input4), ([_3, input5]) => [[_0, _1, _2, _3], input5])))), ([_0, input2]) => [InterfaceDeclarationMapping(_0), input2]);
var TypeAliasDeclarationGeneric = (input) => If(If(Const("type", input), ([_0, input2]) => If(Ident(input2), ([_1, input3]) => If(GenericParameters(input3), ([_2, input4]) => If(Const("=", input4), ([_3, input5]) => If(Type(input5), ([_4, input6]) => [[_0, _1, _2, _3, _4], input6]))))), ([_0, input2]) => [TypeAliasDeclarationGenericMapping(_0), input2]);
var TypeAliasDeclaration = (input) => If(If(Const("type", input), ([_0, input2]) => If(Ident(input2), ([_1, input3]) => If(Const("=", input3), ([_2, input4]) => If(Type(input4), ([_3, input5]) => [[_0, _1, _2, _3], input5])))), ([_0, input2]) => [TypeAliasDeclarationMapping(_0), input2]);
var ExportKeyword = (input) => If(If(If(Const("export", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ExportKeywordMapping(_0), input2]);
var ModuleDeclarationDelimiter = (input) => If(If(If(Const(";", input), ([_0, input2]) => If(Const(`
`, input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [_0, input2], () => If(If(Const(";", input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => If(If(Const(`
`, input), ([_0, input2]) => [[_0], input2]), ([_0, input2]) => [_0, input2], () => []))), ([_0, input2]) => [ModuleDeclarationDelimiterMapping(_0), input2]);
var ModuleDeclarationList_0 = (input, result = []) => If(If(ModuleDeclarationDelimiter(input), ([_0, input2]) => If(ModuleDeclaration(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => ModuleDeclarationList_0(input2, [...result, _0]), () => [result, input]);
var ModuleDeclarationList = (input) => If(If(If(ModuleDeclaration(input), ([_0, input2]) => If(ModuleDeclarationList_0(input2), ([_1, input3]) => If(If(ModuleDeclarationDelimiter(input3), ([_02, input4]) => [[_02], input4], () => [[], input3]), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [_0, input2], () => If([[], input], ([_0, input2]) => [_0, input2], () => [])), ([_0, input2]) => [ModuleDeclarationListMapping(_0), input2]);
var ModuleDeclaration = (input) => If(If(ExportKeyword(input), ([_0, input2]) => If(If(InterfaceDeclarationGeneric(input2), ([_02, input3]) => [_02, input3], () => If(InterfaceDeclaration(input2), ([_02, input3]) => [_02, input3], () => If(TypeAliasDeclarationGeneric(input2), ([_02, input3]) => [_02, input3], () => If(TypeAliasDeclaration(input2), ([_02, input3]) => [_02, input3], () => [])))), ([_1, input3]) => If(OptionalSemiColon(input3), ([_2, input4]) => [[_0, _1, _2], input4]))), ([_0, input2]) => [ModuleDeclarationMapping(_0), input2]);
var Module = (input) => If(If(ModuleDeclaration(input), ([_0, input2]) => If(ModuleDeclarationList(input2), ([_1, input3]) => [[_0, _1], input3])), ([_0, input2]) => [ModuleMapping(_0), input2]);
var Script = (input) => If(If(Module(input), ([_0, input2]) => [_0, input2], () => If(GenericType(input), ([_0, input2]) => [_0, input2], () => If(Type(input), ([_0, input2]) => [_0, input2], () => []))), ([_0, input2]) => [ScriptMapping(_0), input2]);

// ../../node_modules/typebox/build/type/engine/patterns/template.mjs
function ParseTemplateIntoTypes(template) {
  const parsed = TemplateLiteralTypes(`\`${template}\``);
  const result = exports_guard.IsEqual(parsed.length, 2) ? parsed[0] : Unreachable();
  return result;
}

// ../../node_modules/typebox/build/type/engine/template_literal/encode.mjs
function JoinString(input) {
  return input.join("|");
}
function UnwrapTemplateLiteralPattern(pattern) {
  return pattern.slice(1, pattern.length - 1);
}
function EncodeLiteral(value, right, pattern) {
  return EncodeTypes(right, `${pattern}${value}`);
}
function EncodeBigInt(right, pattern) {
  return EncodeTypes(right, `${pattern}${BigIntPattern}`);
}
function EncodeInteger(right, pattern) {
  return EncodeTypes(right, `${pattern}${IntegerPattern}`);
}
function EncodeNumber(right, pattern) {
  return EncodeTypes(right, `${pattern}${NumberPattern}`);
}
function EncodeBoolean(right, pattern) {
  return EncodeType(Union([Literal("false"), Literal("true")]), right, pattern);
}
function EncodeString(right, pattern) {
  return EncodeTypes(right, `${pattern}${StringPattern}`);
}
function EncodeTemplateLiteral(templatePattern, right, pattern) {
  return EncodeTypes(right, `${pattern}${UnwrapTemplateLiteralPattern(templatePattern)}`);
}
function EncodeTemplateLiteralDeferred(types, right, pattern) {
  const templateLiteral = TemplateLiteralAction(types, {});
  const result = EncodeType(templateLiteral, right, pattern);
  return result;
}
function EncodeEnum(values, right, pattern) {
  const evaluated = EvaluateEnum(values);
  return EncodeType(evaluated, right, pattern);
}
function EncodeUnion(types, right, pattern, result = []) {
  return exports_guard.ShiftLeft(types, (head, tail) => EncodeUnion(tail, right, pattern, [...result, EncodeType(head, [], "")]), () => EncodeTypes(right, `${pattern}(${JoinString(result)})`));
}
function EncodeType(type, right, pattern) {
  return IsEnum(type) ? EncodeEnum(type.enum, right, pattern) : IsInteger2(type) ? EncodeInteger(right, pattern) : IsLiteral(type) ? EncodeLiteral(type.const, right, pattern) : IsBigInt2(type) ? EncodeBigInt(right, pattern) : IsBoolean3(type) ? EncodeBoolean(right, pattern) : IsNumber3(type) ? EncodeNumber(right, pattern) : IsString3(type) ? EncodeString(right, pattern) : IsTemplateLiteral(type) ? EncodeTemplateLiteral(type.pattern, right, pattern) : IsTemplateLiteralDeferred(type) ? EncodeTemplateLiteralDeferred(type.parameters[0], right, pattern) : IsUnion(type) ? EncodeUnion(type.anyOf, right, pattern) : NeverPattern;
}
function EncodeTypes(types, pattern) {
  return exports_guard.ShiftLeft(types, (left, right) => EncodeType(left, right, pattern), () => pattern);
}
function EncodePattern(types) {
  const encoded = EncodeTypes(types, "");
  const result = `^${encoded}$`;
  return result;
}
function TemplateLiteralEncode(types) {
  const pattern = EncodePattern(types);
  const result = TemplateLiteralCreate(pattern);
  return result;
}

// ../../node_modules/typebox/build/type/engine/template_literal/instantiate.mjs
function TemplateLiteralAction(types, options) {
  const result = CanInstantiate(types) ? exports_memory.Update(TemplateLiteralEncode(types), {}, options) : TemplateLiteralDeferred(types, options);
  return result;
}
function TemplateLiteralInstantiate(context, state, types, options) {
  const instantiatedTypes = InstantiateTypes(context, state, types);
  return TemplateLiteralAction(instantiatedTypes, options);
}

// ../../node_modules/typebox/build/type/types/template_literal.mjs
function TemplateLiteralDeferred(types, options = {}) {
  return Deferred("TemplateLiteral", [types], options);
}
function IsTemplateLiteralDeferred(value) {
  return IsSchema(value) && exports_guard.HasPropertyKey(value, "action") && exports_guard.IsEqual(value.action, "TemplateLiteral");
}
function TemplateLiteralFromTypes(types) {
  return TemplateLiteralAction(types, {});
}
function TemplateLiteralFromString(template) {
  const types = ParseTemplateIntoTypes(template);
  return TemplateLiteralFromTypes(types);
}
function TemplateLiteral2(input, options = {}) {
  const type = exports_guard.IsString(input) ? TemplateLiteralFromString(input) : TemplateLiteralFromTypes(input);
  return exports_memory.Update(type, {}, options);
}
function IsTemplateLiteral(value) {
  return IsKind(value, "TemplateLiteral");
}

// ../../node_modules/typebox/build/type/extends/result.mjs
var exports_result = {};
__export(exports_result, {
  Match: () => Match3,
  IsExtendsUnion: () => IsExtendsUnion,
  IsExtendsTrueLike: () => IsExtendsTrueLike,
  IsExtendsTrue: () => IsExtendsTrue,
  IsExtendsFalse: () => IsExtendsFalse,
  ExtendsUnion: () => ExtendsUnion,
  ExtendsTrue: () => ExtendsTrue,
  ExtendsFalse: () => ExtendsFalse
});
function ExtendsUnion(inferred) {
  return exports_memory.Create({ ["~kind"]: "ExtendsUnion" }, { inferred });
}
function IsExtendsUnion(value) {
  return exports_guard.IsObject(value) && exports_guard.HasPropertyKey(value, "~kind") && exports_guard.HasPropertyKey(value, "inferred") && exports_guard.IsEqual(value["~kind"], "ExtendsUnion") && exports_guard.IsObject(value.inferred);
}
function ExtendsTrue(inferred) {
  return exports_memory.Create({ ["~kind"]: "ExtendsTrue" }, { inferred });
}
function IsExtendsTrue(value) {
  return exports_guard.IsObject(value) && exports_guard.HasPropertyKey(value, "~kind") && exports_guard.HasPropertyKey(value, "inferred") && exports_guard.IsEqual(value["~kind"], "ExtendsTrue") && exports_guard.IsObject(value.inferred);
}
function ExtendsFalse() {
  return exports_memory.Create({ ["~kind"]: "ExtendsFalse" }, {});
}
function IsExtendsFalse(value) {
  return exports_guard.IsObject(value) && exports_guard.HasPropertyKey(value, "~kind") && exports_guard.IsEqual(value["~kind"], "ExtendsFalse");
}
function IsExtendsTrueLike(value) {
  return IsExtendsUnion(value) || IsExtendsTrue(value);
}
function Match3(result, true_, false_) {
  return IsExtendsTrueLike(result) ? true_(result.inferred) : false_();
}

// ../../node_modules/typebox/build/type/extends/extends_right.mjs
function ExtendsRightInfer(inferred, name, left, right) {
  return Match3(ExtendsLeft(inferred, left, right), (checkInferred) => ExtendsTrue(exports_memory.Assign(exports_memory.Assign(inferred, checkInferred), { [name]: left })), () => ExtendsFalse());
}
function ExtendsRightAny(inferred, _left) {
  return ExtendsTrue(inferred);
}
function ExtendsRightDependent(inferred, left, if_, then_, else_) {
  return Match3(ExtendsLeft(inferred, left, if_), (inferred2) => Match3(ExtendsLeft(inferred2, left, then_), (inferred3) => ExtendsTrue(inferred3), () => ExtendsFalse()), () => Match3(ExtendsLeft(inferred, left, else_), (inferred2) => ExtendsTrue(inferred2), () => ExtendsFalse()));
}
function ExtendsRightEnum(inferred, left, right) {
  const evaluated = EvaluateEnum(right);
  return ExtendsLeft(inferred, left, evaluated);
}
function ExtendsRightIntersect(inferred, left, right) {
  return exports_guard.ShiftLeft(right, (head, tail) => Match3(ExtendsLeft(inferred, left, head), (inferred2) => ExtendsRightIntersect(inferred2, left, tail), () => ExtendsFalse()), () => ExtendsTrue(inferred));
}
function ExtendsRightTemplateLiteral(inferred, left, right) {
  const evaluated = EvaluateTemplateLiteral(right);
  return ExtendsLeft(inferred, left, evaluated);
}
function ExtendsRightUnion(inferred, left, right) {
  return exports_guard.ShiftLeft(right, (head, tail) => Match3(ExtendsLeft(inferred, left, head), (inferred2) => ExtendsTrue(inferred2), () => ExtendsRightUnion(inferred, left, tail)), () => ExtendsFalse());
}
function ExtendsRight(inferred, left, right) {
  return IsAny(right) ? ExtendsRightAny(inferred, left) : IsDependent(right) ? ExtendsRightDependent(inferred, left, right.if, right.then, right.else) : IsEnum(right) ? ExtendsRightEnum(inferred, left, right.enum) : IsInfer(right) ? ExtendsRightInfer(inferred, right.name, left, right.extends) : IsIntersect(right) ? ExtendsRightIntersect(inferred, left, right.allOf) : IsTemplateLiteral(right) ? ExtendsRightTemplateLiteral(inferred, left, right.pattern) : IsUnion(right) ? ExtendsRightUnion(inferred, left, right.anyOf) : IsUnknown(right) ? ExtendsTrue(inferred) : ExtendsFalse();
}

// ../../node_modules/typebox/build/type/extends/any.mjs
function ExtendsAny(inferred, left, right) {
  return IsInfer(right) ? ExtendsRight(inferred, left, right) : IsAny(right) ? ExtendsTrue(inferred) : IsUnknown(right) ? ExtendsTrue(inferred) : ExtendsUnion(inferred);
}

// ../../node_modules/typebox/build/type/extends/array.mjs
function ExtendsImmutable(left, right) {
  const isImmutableLeft = IsImmutable(left);
  const isImmutableRight = IsImmutable(right);
  return isImmutableLeft && isImmutableRight ? true : !isImmutableLeft && isImmutableRight ? true : isImmutableLeft && !isImmutableRight ? false : true;
}
function ExtendsArray(inferred, arrayLeft, left, right) {
  return IsArray2(right) ? ExtendsImmutable(arrayLeft, right) ? ExtendsLeft(inferred, left, right.items) : ExtendsFalse() : ExtendsRight(inferred, arrayLeft, right);
}

// ../../node_modules/typebox/build/type/extends/bigint.mjs
function ExtendsBigInt(inferred, left, right) {
  return IsBigInt2(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../../node_modules/typebox/build/type/extends/boolean.mjs
function ExtendsBoolean(inferred, left, right) {
  return IsBoolean3(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../../node_modules/typebox/build/type/extends/parameters.mjs
function ParameterCompare(inferred, left, leftRest, right, rightRest) {
  const checkLeft = IsInfer(right) ? left : right;
  const checkRight = IsInfer(right) ? right : left;
  const isLeftOptional = IsOptional(left);
  const isRightOptional = IsOptional(right);
  return !isLeftOptional && isRightOptional ? ExtendsFalse() : Match3(ExtendsLeft(inferred, checkLeft, checkRight), (inferred2) => ExtendsParameters(inferred2, leftRest, rightRest), () => ExtendsFalse());
}
function ParameterRight(inferred, left, leftRest, rightRest) {
  return exports_guard.ShiftLeft(rightRest, (head, tail) => ParameterCompare(inferred, left, leftRest, head, tail), () => IsOptional(left) ? ExtendsTrue(inferred) : ExtendsFalse());
}
function ParametersLeft(inferred, left, rightRest) {
  return exports_guard.ShiftLeft(left, (head, tail) => ParameterRight(inferred, head, tail, rightRest), () => ExtendsTrue(inferred));
}
function ExtendsParameters(inferred, left, right) {
  return ParametersLeft(inferred, left, right);
}

// ../../node_modules/typebox/build/type/extends/return_type.mjs
function ExtendsReturnType(inferred, left, right) {
  return IsVoid(right) ? ExtendsTrue(inferred) : ExtendsLeft(inferred, left, right);
}

// ../../node_modules/typebox/build/type/extends/constructor.mjs
function ExtendsConstructor(inferred, parameters, returnType, right) {
  return IsAny(right) ? ExtendsTrue(inferred) : IsUnknown(right) ? ExtendsTrue(inferred) : IsConstructor2(right) ? Match3(ExtendsParameters(inferred, parameters, right["parameters"]), (inferred2) => ExtendsReturnType(inferred2, returnType, right["instanceType"]), () => ExtendsFalse()) : ExtendsFalse();
}

// ../../node_modules/typebox/build/type/extends/dependent.mjs
function ExtendsDependent(inferred, if_, then_, else_, right) {
  return Match3(ExtendsLeft(inferred, if_, right), () => ExtendsLeft(inferred, then_, right), () => ExtendsLeft(inferred, else_, right));
}

// ../../node_modules/typebox/build/type/extends/enum.mjs
function ExtendsEnum(inferred, left, right) {
  const evaluated = EvaluateEnum(left);
  return ExtendsLeft(inferred, evaluated, right);
}

// ../../node_modules/typebox/build/type/extends/function.mjs
function ExtendsFunction(inferred, parameters, returnType, right) {
  return IsAny(right) ? ExtendsTrue(inferred) : IsUnknown(right) ? ExtendsTrue(inferred) : IsFunction2(right) ? Match3(ExtendsParameters(inferred, parameters, right["parameters"]), (inferred2) => ExtendsReturnType(inferred2, returnType, right["returnType"]), () => ExtendsFalse()) : ExtendsFalse();
}

// ../../node_modules/typebox/build/type/extends/integer.mjs
function ExtendsInteger(inferred, left, right) {
  return IsInteger2(right) ? ExtendsTrue(inferred) : IsNumber3(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../../node_modules/typebox/build/type/extends/intersect.mjs
function ExtendsIntersect(inferred, left, right) {
  const evaluated = EvaluateIntersect(left);
  return ExtendsLeft(inferred, evaluated, right);
}

// ../../node_modules/typebox/build/type/extends/literal.mjs
function ExtendsLiteralValue(inferred, left, right) {
  return left === right ? ExtendsTrue(inferred) : ExtendsFalse();
}
function ExtendsLiteralBigInt(inferred, left, right) {
  return IsLiteral(right) ? ExtendsLiteralValue(inferred, left, right.const) : IsBigInt2(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, Literal(left), right);
}
function ExtendsLiteralBoolean(inferred, left, right) {
  return IsLiteral(right) ? ExtendsLiteralValue(inferred, left, right.const) : IsBoolean3(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, Literal(left), right);
}
function ExtendsLiteralNumber(inferred, left, right) {
  return IsLiteral(right) ? ExtendsLiteralValue(inferred, left, right.const) : IsNumber3(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, Literal(left), right);
}
function ExtendsLiteralString(inferred, left, right) {
  return IsLiteral(right) ? ExtendsLiteralValue(inferred, left, right.const) : IsString3(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, Literal(left), right);
}
function ExtendsLiteral(inferred, left, right) {
  return exports_guard.IsBigInt(left.const) ? ExtendsLiteralBigInt(inferred, left.const, right) : exports_guard.IsBoolean(left.const) ? ExtendsLiteralBoolean(inferred, left.const, right) : exports_guard.IsNumber(left.const) ? ExtendsLiteralNumber(inferred, left.const, right) : exports_guard.IsString(left.const) ? ExtendsLiteralString(inferred, left.const, right) : Unreachable();
}

// ../../node_modules/typebox/build/type/extends/never.mjs
function ExtendsNever(inferred, left, right) {
  return IsInfer(right) ? ExtendsRight(inferred, left, right) : ExtendsTrue(inferred);
}

// ../../node_modules/typebox/build/type/extends/null.mjs
function ExtendsNull(inferred, left, right) {
  return IsNull2(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../../node_modules/typebox/build/type/extends/number.mjs
function ExtendsNumber(inferred, left, right) {
  return IsNumber3(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../../node_modules/typebox/build/type/extends/object.mjs
function ExtendsPropertyOptional(inferred, left, right) {
  return IsOptional(left) ? IsOptional(right) ? ExtendsTrue(inferred) : ExtendsFalse() : ExtendsTrue(inferred);
}
function ExtendsProperty(inferred, left, right) {
  return IsInfer(right) && IsNever(right.extends) ? ExtendsFalse() : Match3(ExtendsLeft(inferred, left, right), (inferred2) => ExtendsPropertyOptional(inferred2, left, right), () => ExtendsFalse());
}
function ExtractInferredProperties(keys, properties2) {
  return keys.reduce((result, key) => {
    return key in properties2 ? IsExtendsTrueLike(properties2[key]) ? { ...result, ...properties2[key].inferred } : Unreachable() : Unreachable();
  }, {});
}
function ExtendsPropertiesComparer(inferred, left, right) {
  const properties2 = {};
  for (const rightKey of exports_guard.Keys(right)) {
    properties2[rightKey] = rightKey in left ? ExtendsProperty({}, left[rightKey], right[rightKey]) : IsOptional(right[rightKey]) ? IsInfer(right[rightKey]) ? ExtendsTrue(exports_memory.Assign(inferred, { [right[rightKey].name]: right[rightKey].extends })) : ExtendsTrue(inferred) : ExtendsFalse();
  }
  const checked = exports_guard.Values(properties2).every((result) => IsExtendsTrueLike(result));
  const extracted = checked ? ExtractInferredProperties(exports_guard.Keys(properties2), properties2) : {};
  return checked ? ExtendsTrue(extracted) : ExtendsFalse();
}
function ExtendsProperties(inferred, left, right) {
  const compared = ExtendsPropertiesComparer(inferred, left, right);
  return IsExtendsTrueLike(compared) ? ExtendsTrue(exports_memory.Assign(inferred, compared.inferred)) : ExtendsFalse();
}
function ExtendsObjectToObject(inferred, left, right) {
  return ExtendsProperties(inferred, left, right);
}
function RecordMergeInferred(left, right) {
  return exports_guard.Keys(right).reduce((result, key) => {
    return {
      ...result,
      [key]: exports_guard.HasPropertyKey(left, key) ? IsUnion(result[key]) ? Union([...result[key].anyOf, right[key]]) : Union([left[key], right[key]]) : right[key]
    };
  }, left);
}
function ExtendsRecordComparer(properties2, keys, type, result) {
  return exports_guard.ShiftLeft(keys, (left, right) => Match3(ExtendsLeft({}, properties2[left], type), (inferred) => ExtendsRecordComparer(properties2, right, type, RecordMergeInferred(result, inferred)), () => ExtendsFalse()), () => ExtendsTrue(result));
}
function ExtendsObjectToRecord(inferred, properties2, _pattern, value) {
  const keys = exports_guard.Keys(properties2);
  const result = ExtendsRecordComparer(properties2, keys, value, inferred);
  return result;
}
function ExtendsObject(inferred, left, right) {
  return IsRecord(right) ? ExtendsObjectToRecord(inferred, left, RecordPattern(right), RecordValue(right)) : IsObject2(right) ? ExtendsObjectToObject(inferred, left, right.properties) : ExtendsRight(inferred, _Object_(left), right);
}

// ../../node_modules/typebox/build/type/extends/record.mjs
function FromObject2(inferred, properties2) {
  return exports_guard.IsEqual(exports_guard.Keys(properties2).length, 0) ? ExtendsTrue(inferred) : ExtendsFalse();
}
function FromRecord(inferred, _leftKey, leftValue, _rightKey, rightValue) {
  return ExtendsLeft(inferred, leftValue, rightValue);
}
function ExtendsRecord(inferred, leftPattern, leftValue, right) {
  return IsRecord(right) ? FromRecord(inferred, RecordPatternToType(leftPattern), leftValue, RecordPatternToType(RecordPattern(right)), RecordValue(right)) : IsObject2(right) ? FromObject2(inferred, right.properties) : IsAny(right) ? ExtendsTrue(inferred) : IsUnknown(right) ? ExtendsTrue(inferred) : ExtendsFalse();
}

// ../../node_modules/typebox/build/type/extends/string.mjs
function ExtendsString(inferred, left, right) {
  return IsString3(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../../node_modules/typebox/build/type/extends/symbol.mjs
function ExtendsSymbol(inferred, left, right) {
  return IsSymbol2(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../../node_modules/typebox/build/type/extends/template_literal.mjs
function ExtendsTemplateLiteral(inferred, left, right) {
  const evaluated = EvaluateTemplateLiteral(left);
  return ExtendsLeft(inferred, evaluated, right);
}

// ../../node_modules/typebox/build/type/extends/inference.mjs
function Inferrable(name, type) {
  return exports_memory.Create({ "~kind": "Inferrable" }, { name, type }, {});
}
function IsInferable(value) {
  return exports_guard.IsObject(value) && exports_guard.HasPropertyKey(value, "~kind") && exports_guard.HasPropertyKey(value, "name") && exports_guard.HasPropertyKey(value, "type") && exports_guard.IsEqual(value["~kind"], "Inferrable") && exports_guard.IsString(value.name) && exports_guard.IsObject(value.type);
}
function TryRestInferable(type) {
  return IsRest(type) ? IsInfer(type.items) ? IsArray2(type.items.extends) ? Inferrable(type.items.name, type.items.extends.items) : IsUnknown(type.items.extends) ? Inferrable(type.items.name, type.items.extends) : undefined : Unreachable() : undefined;
}
function TryInferable(type) {
  return IsInfer(type) ? Inferrable(type.name, type.extends) : undefined;
}
function TryInferResults(rest3, right, result = []) {
  return exports_guard.ShiftLeft(rest3, (head, tail) => Match3(ExtendsLeft({}, head, right), () => TryInferResults(tail, right, [...result, head]), () => {
    return;
  }), () => result);
}
function InferTupleResult(inferred, name, left, right) {
  const results = TryInferResults(left, right);
  return exports_guard.IsArray(results) ? ExtendsTrue(exports_memory.Assign(inferred, { [name]: Tuple(results) })) : ExtendsFalse();
}
function InferUnionResult(inferred, name, left, right) {
  const results = TryInferResults(left, right);
  return exports_guard.IsArray(results) ? ExtendsTrue(exports_memory.Assign(inferred, { [name]: Union(results) })) : ExtendsFalse();
}

// ../../node_modules/typebox/build/type/extends/tuple.mjs
function Reverse(types) {
  return [...types].reverse();
}
function ApplyReverse(types, reversed) {
  return reversed ? Reverse(types) : types;
}
function Reversed(types) {
  const first = types.length > 0 ? types[0] : undefined;
  const inferrable = IsSchema(first) ? TryRestInferable(first) : undefined;
  return IsSchema(inferrable);
}
function ElementsCompare(inferred, reversed, left, leftRest, right, rightRest) {
  return Match3(ExtendsLeft(inferred, left, right), (checkInferred) => Elements(checkInferred, reversed, leftRest, rightRest), () => ExtendsFalse());
}
function ElementsLeft(inferred, reversed, leftRest, right, rightRest) {
  const inferable = TryRestInferable(right);
  return IsInferable(inferable) ? InferTupleResult(inferred, inferable["name"], ApplyReverse(leftRest, reversed), inferable["type"]) : exports_guard.ShiftLeft(leftRest, (head, tail) => ElementsCompare(inferred, reversed, head, tail, right, rightRest), () => ExtendsFalse());
}
function ElementsRight(inferred, reversed, leftRest, rightRest) {
  return exports_guard.ShiftLeft(rightRest, (head, tail) => ElementsLeft(inferred, reversed, leftRest, head, tail), () => exports_guard.IsEqual(leftRest.length, 0) ? ExtendsTrue(inferred) : ExtendsFalse());
}
function Elements(inferred, reversed, leftRest, rightRest) {
  return ElementsRight(inferred, reversed, leftRest, rightRest);
}
function ExtendsTupleToTuple(inferred, left, right) {
  const instantiatedRight = InstantiateElements(inferred, State([], []), right);
  const reversed = Reversed(instantiatedRight);
  return Elements(inferred, reversed, ApplyReverse(left, reversed), ApplyReverse(instantiatedRight, reversed));
}
function ExtendsTupleToArray(inferred, left, right) {
  const inferrable = TryInferable(right);
  return IsInferable(inferrable) ? InferUnionResult(inferred, inferrable["name"], left, inferrable["type"]) : exports_guard.ShiftLeft(left, (head, tail) => Match3(ExtendsLeft(inferred, head, right), (inferred2) => ExtendsTupleToArray(inferred2, tail, right), () => ExtendsFalse()), () => ExtendsTrue(inferred));
}
function ExtendsTuple(inferred, left, right) {
  const instantiatedLeft = InstantiateElements(inferred, State([], []), left);
  return IsTuple(right) ? ExtendsTupleToTuple(inferred, instantiatedLeft, right.items) : IsArray2(right) ? ExtendsTupleToArray(inferred, instantiatedLeft, right.items) : ExtendsRight(inferred, Tuple(instantiatedLeft), right);
}

// ../../node_modules/typebox/build/type/extends/undefined.mjs
function ExtendsUndefined(inferred, left, right) {
  return IsVoid(right) ? ExtendsTrue(inferred) : IsUndefined2(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../../node_modules/typebox/build/type/extends/union.mjs
function ExtendsUnionSome(inferred, type, unionTypes) {
  return exports_guard.ShiftLeft(unionTypes, (head, tail) => Match3(ExtendsLeft(inferred, type, head), (inferred2) => ExtendsTrue(inferred2), () => ExtendsUnionSome(inferred, type, tail)), () => ExtendsFalse());
}
function ExtendsUnionLeft(inferred, left, right) {
  return exports_guard.ShiftLeft(left, (head, tail) => Match3(ExtendsUnionSome(inferred, head, right), (inferred2) => ExtendsUnionLeft(inferred2, tail, right), () => ExtendsFalse()), () => ExtendsTrue(inferred));
}
function ExtendsUnion2(inferred, left, right) {
  const inferrable = TryInferable(right);
  return IsInferable(inferrable) ? InferUnionResult(inferred, inferrable.name, left, inferrable.type) : IsUnion(right) ? ExtendsUnionLeft(inferred, left, right.anyOf) : ExtendsUnionLeft(inferred, left, [right]);
}

// ../../node_modules/typebox/build/type/extends/unknown.mjs
function ExtendsUnknown(inferred, left, right) {
  return IsInfer(right) ? ExtendsRight(inferred, left, right) : IsAny(right) ? ExtendsTrue(inferred) : IsUnknown(right) ? ExtendsTrue(inferred) : ExtendsFalse();
}

// ../../node_modules/typebox/build/type/extends/void.mjs
function ExtendsVoid(inferred, left, right) {
  return IsVoid(right) ? ExtendsTrue(inferred) : ExtendsRight(inferred, left, right);
}

// ../../node_modules/typebox/build/type/extends/extends_left.mjs
function ExtendsLeft(inferred, left, right) {
  return IsAny(left) ? ExtendsAny(inferred, left, right) : IsArray2(left) ? ExtendsArray(inferred, left, left.items, right) : IsBigInt2(left) ? ExtendsBigInt(inferred, left, right) : IsBoolean3(left) ? ExtendsBoolean(inferred, left, right) : IsConstructor2(left) ? ExtendsConstructor(inferred, left.parameters, left.instanceType, right) : IsDependent(left) ? ExtendsDependent(inferred, left.if, left.then, left.else, right) : IsEnum(left) ? ExtendsEnum(inferred, left.enum, right) : IsFunction2(left) ? ExtendsFunction(inferred, left.parameters, left.returnType, right) : IsInteger2(left) ? ExtendsInteger(inferred, left, right) : IsIntersect(left) ? ExtendsIntersect(inferred, left.allOf, right) : IsLiteral(left) ? ExtendsLiteral(inferred, left, right) : IsNever(left) ? ExtendsNever(inferred, left, right) : IsNull2(left) ? ExtendsNull(inferred, left, right) : IsNumber3(left) ? ExtendsNumber(inferred, left, right) : IsObject2(left) ? ExtendsObject(inferred, left.properties, right) : IsRecord(left) ? ExtendsRecord(inferred, RecordPattern(left), RecordValue(left), right) : IsString3(left) ? ExtendsString(inferred, left, right) : IsSymbol2(left) ? ExtendsSymbol(inferred, left, right) : IsTemplateLiteral(left) ? ExtendsTemplateLiteral(inferred, left.pattern, right) : IsTuple(left) ? ExtendsTuple(inferred, left.items, right) : IsUndefined2(left) ? ExtendsUndefined(inferred, left, right) : IsUnion(left) ? ExtendsUnion2(inferred, left.anyOf, right) : IsUnknown(left) ? ExtendsUnknown(inferred, left, right) : IsVoid(left) ? ExtendsVoid(inferred, left, right) : ExtendsFalse();
}

// ../../node_modules/typebox/build/type/engine/interface/instantiate.mjs
function InterfaceOperation(heritage, properties2) {
  const result = EvaluateIntersect([...heritage, _Object_(properties2)]);
  return result;
}
function InterfaceAction(heritage, properties2, options) {
  const result = CanInstantiate(heritage) ? exports_memory.Update(InterfaceOperation(heritage, properties2), {}, options) : InterfaceDeferred(heritage, properties2, options);
  return result;
}
function InterfaceInstantiate(context, state, heritage, properties2, options) {
  const instantiatedHeritage = InstantiateTypes(context, state, heritage);
  const instantiatedProperties = InstantiateProperties(context, state, properties2);
  return InterfaceAction(instantiatedHeritage, instantiatedProperties, options);
}

// ../../node_modules/typebox/build/type/action/interface.mjs
function InterfaceDeferred(heritage, properties2, options = {}) {
  return Deferred("Interface", [heritage, properties2], options);
}
function IsInterfaceDeferred(value) {
  return IsSchema(value) && exports_guard.HasPropertyKey(value, "action") && exports_guard.IsEqual(value.action, "Interface");
}
function Interface(heritage, properties2, options = {}) {
  return InterfaceAction(heritage, properties2, options);
}

// ../../node_modules/typebox/build/type/engine/cyclic/check.mjs
function FromRef(stack, context, ref2) {
  return stack.includes(ref2) ? true : FromType3([...stack, ref2], context, context[ref2]);
}
function FromProperties(stack, context, properties2) {
  const types = PropertyValues(properties2);
  return FromTypes2(stack, context, types);
}
function FromTypes2(stack, context, types) {
  return exports_guard.ShiftLeft(types, (left, right) => FromType3(stack, context, left) ? true : FromTypes2(stack, context, right), () => false);
}
function FromType3(stack, context, type) {
  return IsRef(type) ? FromRef(stack, context, type.$ref) : IsArray2(type) ? FromType3(stack, context, type.items) : IsConstructor2(type) ? FromTypes2(stack, context, [...type.parameters, type.instanceType]) : IsFunction2(type) ? FromTypes2(stack, context, [...type.parameters, type.returnType]) : IsInterfaceDeferred(type) ? FromProperties(stack, context, type.parameters[1]) : IsIntersect(type) ? FromTypes2(stack, context, type.allOf) : IsObject2(type) ? FromProperties(stack, context, type.properties) : IsUnion(type) ? FromTypes2(stack, context, type.anyOf) : IsTuple(type) ? FromTypes2(stack, context, type.items) : IsRecord(type) ? FromType3(stack, context, RecordValue(type)) : false;
}
function CyclicCheck(stack, context, type) {
  const result = FromType3(stack, context, type);
  return result;
}

// ../../node_modules/typebox/build/type/engine/cyclic/candidates.mjs
function ResolveCandidateKeys(context, keys) {
  return keys.reduce((result, left) => {
    return CyclicCheck([left], context, context[left]) ? [...result, left] : result;
  }, []);
}
function CyclicCandidates(context) {
  const keys = PropertyKeys(context);
  const result = ResolveCandidateKeys(context, keys);
  return result;
}
// ../../node_modules/typebox/build/type/engine/cyclic/dependencies.mjs
function FromRef2(context, ref2, result) {
  return result.includes(ref2) ? result : (ref2 in context) ? FromType4(context, context[ref2], [...result, ref2]) : Unreachable();
}
function FromProperties2(context, properties2, result) {
  const types = PropertyValues(properties2);
  return FromTypes3(context, types, result);
}
function FromTypes3(context, types, result) {
  return types.reduce((result2, left) => {
    return FromType4(context, left, result2);
  }, result);
}
function FromType4(context, type, result) {
  return IsRef(type) ? FromRef2(context, type.$ref, result) : IsArray2(type) ? FromType4(context, type.items, result) : IsConstructor2(type) ? FromTypes3(context, [...type.parameters, type.instanceType], result) : IsFunction2(type) ? FromTypes3(context, [...type.parameters, type.returnType], result) : IsInterfaceDeferred(type) ? FromProperties2(context, type.parameters[1], result) : IsIntersect(type) ? FromTypes3(context, type.allOf, result) : IsObject2(type) ? FromProperties2(context, type.properties, result) : IsUnion(type) ? FromTypes3(context, type.anyOf, result) : IsTuple(type) ? FromTypes3(context, type.items, result) : IsRecord(type) ? FromType4(context, RecordValue(type), result) : result;
}
function CyclicDependencies(context, key, type) {
  const result = FromType4(context, type, [key]);
  return result;
}
// ../../node_modules/typebox/build/type/engine/cyclic/extends.mjs
function FromRef3(_ref) {
  return Any();
}
function FromProperties3(properties2) {
  return exports_guard.Keys(properties2).reduce((result, key) => {
    return { ...result, [key]: FromType5(properties2[key]) };
  }, {});
}
function FromTypes4(types) {
  return types.reduce((result, left) => {
    return [...result, FromType5(left)];
  }, []);
}
function FromType5(type) {
  return IsRef(type) ? FromRef3(type.$ref) : IsArray2(type) ? _Array_(FromType5(type.items), ArrayOptions(type)) : IsConstructor2(type) ? Constructor(FromTypes4(type.parameters), FromType5(type.instanceType)) : IsFunction2(type) ? _Function_(FromTypes4(type.parameters), FromType5(type.returnType)) : IsIntersect(type) ? Intersect(FromTypes4(type.allOf)) : IsObject2(type) ? _Object_(FromProperties3(type.properties)) : IsRecord(type) ? Record(RecordKey(type), FromType5(RecordValue(type))) : IsUnion(type) ? Union(FromTypes4(type.anyOf)) : IsTuple(type) ? Tuple(FromTypes4(type.items)) : type;
}
function CyclicAnyFromParameters(defs, ref2) {
  return ref2 in defs ? FromType5(defs[ref2]) : Unknown();
}
function CyclicExtends(type) {
  return CyclicAnyFromParameters(type.$defs, type.$ref);
}
// ../../node_modules/typebox/build/type/engine/cyclic/instantiate.mjs
function CyclicInterface(context, heritage, properties2) {
  const instantiatedHeritage = InstantiateTypes(context, State([], []), heritage);
  const instantiatedProperties = InstantiateProperties({}, State([], []), properties2);
  const evaluatedInterface = EvaluateIntersect([...instantiatedHeritage, _Object_(instantiatedProperties)]);
  return evaluatedInterface;
}
function CyclicDefinitions(context, dependencies) {
  const keys = exports_guard.Keys(context).filter((key) => dependencies.includes(key));
  return keys.reduce((result, key) => {
    const type = context[key];
    const instantiatedType = IsInterfaceDeferred(type) ? CyclicInterface(context, type.parameters[0], type.parameters[1]) : type;
    return { ...result, [key]: instantiatedType };
  }, {});
}
function InstantiateCyclic(context, ref2, type) {
  const dependencies = CyclicDependencies(context, ref2, type);
  const definitions = CyclicDefinitions(context, dependencies);
  const result = Cyclic(definitions, ref2);
  return result;
}
// ../../node_modules/typebox/build/type/engine/cyclic/target.mjs
function Resolve(defs, ref2) {
  return ref2 in defs ? IsRef(defs[ref2]) ? Resolve(defs, defs[ref2].$ref) : defs[ref2] : Never();
}
function CyclicTarget(defs, ref2) {
  const result = Resolve(defs, ref2);
  return result;
}
// ../../node_modules/typebox/build/type/extends/extends.mjs
function Canonical(type) {
  return IsCyclic(type) ? CyclicExtends(type) : IsUnsafe(type) ? Unknown() : type;
}
function Extends(inferred, left, right) {
  const canonicalLeft = Canonical(left);
  const canonicalRight = Canonical(right);
  return ExtendsLeft(inferred, canonicalLeft, canonicalRight);
}
// ../../node_modules/typebox/build/type/engine/evaluate/compare.mjs
var ResultEqual = "equal";
var ResultDisjoint = "disjoint";
var ResultLeftInside = "left-inside";
var ResultRightInside = "right-inside";
function Compare(left, right) {
  const extendsCheck = [
    IsUnknown(left) ? exports_result.ExtendsFalse() : Extends({}, left, right),
    IsUnknown(left) ? exports_result.ExtendsTrue({}) : Extends({}, right, left)
  ];
  return exports_result.IsExtendsTrueLike(extendsCheck[0]) && exports_result.IsExtendsTrueLike(extendsCheck[1]) ? ResultEqual : exports_result.IsExtendsTrueLike(extendsCheck[0]) && exports_result.IsExtendsFalse(extendsCheck[1]) ? ResultLeftInside : exports_result.IsExtendsFalse(extendsCheck[0]) && exports_result.IsExtendsTrueLike(extendsCheck[1]) ? ResultRightInside : ResultDisjoint;
}

// ../../node_modules/typebox/build/type/engine/evaluate/broaden.mjs
function BroadFilter(type, types) {
  return types.filter((left) => {
    return Compare(type, left) === ResultRightInside ? false : true;
  });
}
function IsBroadestType(type, types) {
  const result = types.some((left) => {
    const result2 = Compare(type, left);
    return exports_guard.IsEqual(result2, ResultLeftInside) || exports_guard.IsEqual(result2, ResultEqual);
  });
  return exports_guard.IsEqual(result, false);
}
function BroadenType(type, types) {
  const evaluated = EvaluateType(type);
  return IsAny(evaluated) ? [evaluated] : IsBroadestType(evaluated, types) ? [...BroadFilter(evaluated, types), evaluated] : types;
}
function BroadenTypes(types) {
  return types.reduce((result, left) => {
    return IsObject2(left) ? [...result, left] : IsNever(left) ? result : BroadenType(left, result);
  }, []);
}
function Broaden(types) {
  const broadened = BroadenTypes(types);
  const flattened = Flatten(broadened);
  return flattened;
}
// ../../node_modules/typebox/build/type/engine/evaluate/instantiate.mjs
function EvaluateAction(type, options) {
  const result = exports_memory.Update(EvaluateType(type), {}, options);
  return result;
}
function EvaluateInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return EvaluateAction(instantiatedType, options);
}
// ../../node_modules/typebox/build/type/engine/call/distribute_arguments.mjs
function CollectDistributionNames(expression, result = []) {
  return IsDeferred(expression) && exports_guard.IsEqual(expression.action, "Conditional") ? IsRef(expression.parameters[0]) ? CollectDistributionNames(expression.parameters[2], CollectDistributionNames(expression.parameters[3], [...result, expression.parameters[0]["$ref"]])) : CollectDistributionNames(expression.parameters[2], CollectDistributionNames(expression.parameters[3], result)) : IsDeferred(expression) && exports_guard.IsEqual(expression.action, "Mapped") ? IsDeferred(expression.parameters[1]) && exports_guard.IsEqual(expression.parameters[1].action, "KeyOf") && IsRef(expression.parameters[1].parameters[0]) ? [...result, expression.parameters[1].parameters[0]["$ref"]] : result : result;
}
function BuildDistributionArray(parameters, names) {
  return parameters.reduce((result, left) => [...result, names.includes(left.name)], []);
}
function ZipDistributionArray(arguments_, distributionArray, result = []) {
  return exports_guard.ShiftLeft(arguments_, (argumentLeft, argumentRight) => exports_guard.ShiftLeft(distributionArray, (booleanLeft, booleanRight) => ZipDistributionArray(argumentRight, booleanRight, [...result, [booleanLeft, argumentLeft]]), () => result), () => result);
}
function CanonicalArgument(type) {
  return IsTemplateLiteral(type) ? EvaluateTemplateLiteral(type.pattern) : IsEnum(type) ? EvaluateEnum(type.enum) : type;
}
function Expand(type) {
  const canonicalArgument = CanonicalArgument(type);
  return IsUnion(canonicalArgument) ? [...canonicalArgument.anyOf] : [canonicalArgument];
}
function Append(current, type) {
  return current.reduce((result, left) => [...result, [...left, type]], []);
}
function Cross(current, variants) {
  return variants.reduce((result, left) => {
    return [...result, ...Append(current, left)];
  }, []);
}
function Distribute2(zipped) {
  return zipped.reduce((result, left) => {
    return exports_guard.IsEqual(left[0], true) ? Cross(result, Expand(left[1])) : Cross(result, [left[1]]);
  }, [[]]);
}
function DistributeArguments(parameters, arguments_, expression) {
  const distributionNames = CollectDistributionNames(expression);
  const distributionArray = BuildDistributionArray(parameters, distributionNames);
  const zippedArguments = ZipDistributionArray(arguments_, distributionArray);
  return IsDeferred(expression) && exports_guard.IsEqual(expression.action, "Conditional") ? Distribute2(zippedArguments) : IsDeferred(expression) && exports_guard.IsEqual(expression.action, "Mapped") ? Distribute2(zippedArguments) : [arguments_];
}

// ../../node_modules/typebox/build/type/engine/call/resolve_target.mjs
function FromNotResolvable() {
  return ["(not-resolvable)", Never()];
}
function FromNotGeneric() {
  return ["(not-generic)", Never()];
}
function FromGeneric(name, parameters, expression) {
  return [name, Generic(parameters, expression)];
}
function FromRef4(context, ref2, arguments_) {
  return ref2 in context ? FromType6(context, ref2, context[ref2], arguments_) : FromNotResolvable();
}
function FromType6(context, name, target2, arguments_) {
  return IsGeneric(target2) ? FromGeneric(name, target2.parameters, target2.expression) : IsRef(target2) ? FromRef4(context, target2.$ref, arguments_) : FromNotGeneric();
}
function ResolveTarget(context, target2, arguments_) {
  return FromType6(context, "(anonymous)", target2, arguments_);
}

// ../../node_modules/typebox/build/type/engine/call/resolve_arguments.mjs
function AssertArgumentExtends(name, type, extends_) {
  if (IsInfer(type) || IsCall(type) || exports_result.IsExtendsTrueLike(Extends({}, type, extends_)))
    return;
  const cause = { parameter: name, expect: extends_, actual: type };
  throw new Error(`Argument for parameter ${name} does not satisfy constraint`, { cause });
}
function BindArgument(context, state, name, extends_, type) {
  const instantiatedArgument = InstantiateType(context, state, type);
  AssertArgumentExtends(name, instantiatedArgument, extends_);
  return exports_memory.Assign(context, { [name]: instantiatedArgument });
}
function BindArguments(context, state, parameterLeft, parameterRight, arguments_) {
  const instantiatedExtends = InstantiateType(context, state, parameterLeft.extends);
  const instantiatedEquals = InstantiateType(context, state, parameterLeft.equals);
  return exports_guard.ShiftLeft(arguments_, (left, right) => BindParameters(BindArgument(context, state, parameterLeft["name"], instantiatedExtends, left), state, parameterRight, right), () => BindParameters(BindArgument(context, state, parameterLeft["name"], instantiatedExtends, instantiatedEquals), state, parameterRight, []));
}
function BindParameters(context, state, parameters, arguments_) {
  return exports_guard.ShiftLeft(parameters, (left, right) => BindArguments(context, state, left, right, arguments_), () => context);
}
function ResolveArgumentsContext(context, state, parameters, arguments_) {
  return BindParameters(context, state, parameters, arguments_);
}

// ../../node_modules/typebox/build/type/engine/call/instantiate.mjs
var instantiationDepth = 0;
var instantiationCount = 0;
function InstantiationAssert() {
  if (exports_guard.IsLessThan(instantiationCount, exports_settings.Get().maxInstantiationCount))
    return;
  throw Error("Type instantiation is excessively deep and possibly infinite");
}
function InstantiationIncrement() {
  InstantiationAssert();
  instantiationCount++;
  instantiationDepth++;
}
function InstantiationDecrement() {
  instantiationDepth--;
  if (exports_guard.IsEqual(instantiationDepth, 0))
    instantiationCount = 0;
}
function Peek(state) {
  const result = exports_guard.IsGreaterThan(state.callstack.length, 0) ? state.callstack[state.callstack.length - 1] : "";
  return result;
}
function IsTailCall(state, name) {
  const result = exports_guard.IsEqual(Peek(state), name);
  return result;
}
function CallDispatch(context, state, target2, parameters, expression, arguments_) {
  InstantiationIncrement();
  try {
    const argumentsContext = ResolveArgumentsContext(context, state, parameters, arguments_);
    const returnType = InstantiateType(argumentsContext, State([...state["callstack"], target2["$ref"]], state["visited"]), expression);
    return InstantiateType(argumentsContext, State([], []), returnType);
  } finally {
    InstantiationDecrement();
  }
}
function CallDistributed(context, state, target2, parameters, expression, distributedArguments) {
  return distributedArguments.reduce((result, arguments_) => {
    const returnType = CallDispatch(context, state, target2, parameters, expression, arguments_);
    return [...result, returnType];
  }, []);
}
function CallImmediate(context, state, target2, parameters, expression, arguments_) {
  const distributedArguments = DistributeArguments(parameters, arguments_, expression);
  const returnTypes = CallDistributed(context, state, target2, parameters, expression, distributedArguments);
  const result = exports_guard.IsEqual(returnTypes.length, 1) ? returnTypes[0] : EvaluateUnion(returnTypes);
  return result;
}
function CallInstantiate(context, state, target2, arguments_) {
  const instantiatedArguments = InstantiateTypes(context, state, arguments_);
  const resolved = ResolveTarget(context, target2, arguments_);
  const name = resolved[0];
  const type = resolved[1];
  const result = IsGeneric(type) ? IsTailCall(state, name) ? CallConstruct(Ref(name), instantiatedArguments) : CallImmediate(context, state, Ref(name), type.parameters, type.expression, instantiatedArguments) : CallConstruct(target2, instantiatedArguments);
  return result;
}

// ../../node_modules/typebox/build/type/types/call.mjs
function CallConstruct(target2, arguments_) {
  return exports_memory.Create({ ["~kind"]: "Call" }, { type: "call", target: target2, arguments: arguments_ }, {});
}
function Call(target2, arguments_) {
  return CallInstantiate({}, State([], []), target2, arguments_);
}
function IsCall(value) {
  return IsKind(value, "Call");
}

// ../../node_modules/typebox/build/type/engine/immutable/instantiate_remove.mjs
function RemoveImmutableOperation(type) {
  return exports_memory.Discard(type, ["~immutable"]);
}
function RemoveImmutableAction(type, options) {
  const result = exports_memory.Update(RemoveImmutableOperation(type), {}, options);
  return result;
}
function RemoveImmutableInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return RemoveImmutableAction(instantiatedType, options);
}

// ../../node_modules/typebox/build/type/engine/intrinsics/mapping.mjs
function ApplyMapping(mapping, value) {
  return mapping(value);
}

// ../../node_modules/typebox/build/type/engine/intrinsics/from_literal.mjs
function FromLiteral3(mapping, value) {
  return exports_guard.IsString(value) ? Literal(ApplyMapping(mapping, value)) : Literal(value);
}

// ../../node_modules/typebox/build/type/engine/intrinsics/from_template_literal.mjs
function FromTemplateLiteral(mapping, pattern) {
  const evaluated = EvaluateTemplateLiteral(pattern);
  const result = FromType7(mapping, evaluated);
  return result;
}

// ../../node_modules/typebox/build/type/engine/intrinsics/from_union.mjs
function FromUnion2(mapping, types) {
  const result = types.map((type) => FromType7(mapping, type));
  return Union(result);
}

// ../../node_modules/typebox/build/type/engine/intrinsics/from_type.mjs
function FromType7(mapping, type) {
  return IsLiteral(type) ? FromLiteral3(mapping, type.const) : IsTemplateLiteral(type) ? FromTemplateLiteral(mapping, type.pattern) : IsUnion(type) ? FromUnion2(mapping, type.anyOf) : type;
}

// ../../node_modules/typebox/build/type/action/capitalize.mjs
function CapitalizeDeferred(type, options = {}) {
  return Deferred("Capitalize", [type], options);
}
function Capitalize(type, options = {}) {
  return CapitalizeAction(type, options);
}

// ../../node_modules/typebox/build/type/action/lowercase.mjs
function LowercaseDeferred(type, options = {}) {
  return Deferred("Lowercase", [type], options);
}
function Lowercase(type, options = {}) {
  return LowercaseAction(type, options);
}

// ../../node_modules/typebox/build/type/action/uncapitalize.mjs
function UncapitalizeDeferred(type, options = {}) {
  return Deferred("Uncapitalize", [type], options);
}
function Uncapitalize(type, options = {}) {
  return UncapitalizeAction(type, options);
}

// ../../node_modules/typebox/build/type/action/uppercase.mjs
function UppercaseDeferred(type, options = {}) {
  return Deferred("Uppercase", [type], options);
}
function Uppercase(type, options = {}) {
  return UppercaseAction(type, options);
}

// ../../node_modules/typebox/build/type/engine/intrinsics/instantiate.mjs
var CapitalizeMapping = (input) => input[0].toUpperCase() + input.slice(1);
var LowercaseMapping = (input) => input.toLowerCase();
var UncapitalizeMapping = (input) => input[0].toLowerCase() + input.slice(1);
var UppercaseMapping = (input) => input.toUpperCase();
function CapitalizeAction(type, options) {
  const result = CanInstantiate([type]) ? exports_memory.Update(FromType7(CapitalizeMapping, type), {}, options) : CapitalizeDeferred(type, options);
  return result;
}
function LowercaseAction(type, options) {
  const result = CanInstantiate([type]) ? exports_memory.Update(FromType7(LowercaseMapping, type), {}, options) : LowercaseDeferred(type, options);
  return result;
}
function UncapitalizeAction(type, options) {
  const result = CanInstantiate([type]) ? exports_memory.Update(FromType7(UncapitalizeMapping, type), {}, options) : UncapitalizeDeferred(type, options);
  return result;
}
function UppercaseAction(type, options) {
  const result = CanInstantiate([type]) ? exports_memory.Update(FromType7(UppercaseMapping, type), {}, options) : UppercaseDeferred(type, options);
  return result;
}
function CapitalizeInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return CapitalizeAction(instantiatedType, options);
}
function LowercaseInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return LowercaseAction(instantiatedType, options);
}
function UncapitalizeInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return UncapitalizeAction(instantiatedType, options);
}
function UppercaseInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return UppercaseAction(instantiatedType, options);
}

// ../../node_modules/typebox/build/type/action/conditional.mjs
function ConditionalDeferred(left, right, true_, false_, options = {}) {
  return Deferred("Conditional", [left, right, true_, false_], options);
}
function Conditional(left, right, true_, false_, options = {}) {
  return ConditionalAction({}, State([], []), left, right, true_, false_, options);
}

// ../../node_modules/typebox/build/type/engine/conditional/instantiate.mjs
function ConditionalOperation(context, state, left, right, true_, false_) {
  const extendsResult = Extends(context, left, right);
  return exports_result.IsExtendsUnion(extendsResult) ? Union([InstantiateType(extendsResult.inferred, state, true_), InstantiateType(context, state, false_)]) : exports_result.IsExtendsTrue(extendsResult) ? InstantiateType(extendsResult.inferred, state, true_) : InstantiateType(context, state, false_);
}
function ConditionalAction(context, state, left, right, true_, false_, options) {
  const result = CanInstantiate([left, right]) ? exports_memory.Update(ConditionalOperation(context, state, left, right, true_, false_), {}, options) : ConditionalDeferred(left, right, true_, false_, options);
  return result;
}
function ConditionalInstantiate(context, state, left, right, true_, false_, options) {
  const instantiatedLeft = InstantiateType(context, state, left);
  const instantiatedRight = InstantiateType(context, state, right);
  return ConditionalAction(context, state, instantiatedLeft, instantiatedRight, true_, false_, options);
}
// ../../node_modules/typebox/build/type/action/constructor_parameters.mjs
function ConstructorParametersDeferred(type, options = {}) {
  return Deferred("ConstructorParameters", [type], options);
}
function ConstructorParameters(type, options = {}) {
  return ConstructorParametersAction(type, options);
}

// ../../node_modules/typebox/build/type/engine/constructor_parameters/instantiate.mjs
function ConstructorParametersOperation(type) {
  const parameters = IsConstructor2(type) ? type["parameters"] : [];
  const instantiatedParameters = InstantiateElements({}, State([], []), parameters);
  const result = Tuple(instantiatedParameters);
  return result;
}
function ConstructorParametersAction(type, options) {
  const result = CanInstantiate([type]) ? exports_memory.Update(ConstructorParametersOperation(type), {}, options) : ConstructorParametersDeferred(type, options);
  return result;
}
function ConstructorParametersInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return ConstructorParametersAction(instantiatedType, options);
}

// ../../node_modules/typebox/build/type/action/exclude.mjs
function ExcludeDeferred(left, right, options = {}) {
  return Deferred("Exclude", [left, right], options);
}
function Exclude(left, right, options = {}) {
  return ExcludeAction(left, right, options);
}

// ../../node_modules/typebox/build/type/engine/exclude/instantiate.mjs
function ExcludeAction(left, right, options) {
  const result = CanInstantiate([left, right]) ? exports_memory.Update(ExcludeOperation(left, right), {}, options) : ExcludeDeferred(left, right, options);
  return result;
}
function ExcludeInstantiate(context, state, left, right, options) {
  const instantiatedLeft = InstantiateType(context, state, left);
  const instantiatedRight = InstantiateType(context, state, right);
  return ExcludeAction(instantiatedLeft, instantiatedRight, options);
}

// ../../node_modules/typebox/build/type/action/extract.mjs
function ExtractDeferred(left, right, options = {}) {
  return Deferred("Extract", [left, right], options);
}
function Extract(left, right, options = {}) {
  return ExtractAction(left, right, options);
}

// ../../node_modules/typebox/build/type/engine/extract/operation.mjs
function ExtractType(left, right) {
  const check3 = Extends({}, left, right);
  const result = exports_result.IsExtendsTrueLike(check3) ? [left] : [];
  return result;
}
function ExtractUnion(types, right) {
  return types.reduce((result, head) => {
    return [...result, ...ExtractType(head, right)];
  }, []);
}
function ExtractOperation(left, right) {
  const evaluated = EvaluateType(left);
  const canonical = IsUnion(evaluated) ? evaluated.anyOf : [evaluated];
  const remaining = ExtractUnion(canonical, right);
  const result = EvaluateUnion(remaining);
  return result;
}

// ../../node_modules/typebox/build/type/engine/extract/instantiate.mjs
function ExtractAction(left, right, options) {
  const result = CanInstantiate([left, right]) ? exports_memory.Update(ExtractOperation(left, right), {}, options) : ExtractDeferred(left, right, options);
  return result;
}
function ExtractInstantiate(context, state, left, right, options) {
  const instantiatedLeft = InstantiateType(context, state, left);
  const instantiatedRight = InstantiateType(context, state, right);
  return ExtractAction(instantiatedLeft, instantiatedRight, options);
}

// ../../node_modules/typebox/build/type/engine/helpers/keys_to_indexer.mjs
function KeysToLiterals(keys) {
  return keys.reduce((result, left) => {
    return IsLiteralValue(left) ? [...result, Literal(left)] : result;
  }, []);
}
function KeysToIndexer(keys) {
  const literals = KeysToLiterals(keys);
  const result = Union(literals);
  return result;
}

// ../../node_modules/typebox/build/type/action/indexed.mjs
function IndexDeferred(type, indexer, options = {}) {
  return Deferred("Index", [type, indexer], options);
}
function Index(type, indexer_or_keys, options = {}) {
  const indexer = exports_guard.IsArray(indexer_or_keys) ? KeysToIndexer(indexer_or_keys) : indexer_or_keys;
  return IndexAction(type, indexer, options);
}

// ../../node_modules/typebox/build/type/engine/object/from_cyclic.mjs
function FromCyclic(defs, ref2) {
  const target2 = CyclicTarget(defs, ref2);
  const result = FromType8(target2);
  return result;
}

// ../../node_modules/typebox/build/type/engine/object/from_dependent.mjs
function FromDependent(if_, then_, else_) {
  const evaluated = EvaluateDependent(if_, then_, else_);
  const result = FromType8(evaluated);
  return result;
}

// ../../node_modules/typebox/build/type/engine/object/from_intersect.mjs
function CollapseIntersectProperties(left, right) {
  const leftKeys = exports_guard.Keys(left).filter((key) => !exports_guard.HasPropertyKey(right, key));
  const rightKeys = exports_guard.Keys(right).filter((key) => !exports_guard.HasPropertyKey(left, key));
  const sharedKeys = exports_guard.Keys(left).filter((key) => exports_guard.HasPropertyKey(right, key));
  const leftProperties = leftKeys.reduce((result, key) => ({ ...result, [key]: left[key] }), {});
  const rightProperties = rightKeys.reduce((result, key) => ({ ...result, [key]: right[key] }), {});
  const sharedProperties = sharedKeys.reduce((result, key) => ({ ...result, [key]: EvaluateIntersect([left[key], right[key]]) }), {});
  const unique = exports_memory.Assign(leftProperties, rightProperties);
  const shared = exports_memory.Assign(unique, sharedProperties);
  return shared;
}
function FromIntersect(types) {
  return types.reduce((result, left) => {
    return CollapseIntersectProperties(result, FromType8(left));
  }, {});
}

// ../../node_modules/typebox/build/type/engine/object/from_object.mjs
function FromObject3(properties2) {
  return properties2;
}

// ../../node_modules/typebox/build/type/engine/object/from_tuple.mjs
function FromTuple(types) {
  const object2 = TupleToObject(Tuple(types));
  const result = FromType8(object2);
  return result;
}

// ../../node_modules/typebox/build/type/engine/object/from_union.mjs
function CollapseUnionProperties(left, right) {
  const sharedKeys = exports_guard.Keys(left).filter((key) => (key in right));
  const result = sharedKeys.reduce((result2, key) => {
    return { ...result2, [key]: EvaluateUnion([left[key], right[key]]) };
  }, {});
  return result;
}
function ReduceVariants(types, result) {
  return exports_guard.ShiftLeft(types, (left, right) => ReduceVariants(right, CollapseUnionProperties(result, FromType8(left))), () => result);
}
function FromUnion3(types) {
  return exports_guard.ShiftLeft(types, (left, right) => ReduceVariants(right, FromType8(left)), () => Unreachable());
}

// ../../node_modules/typebox/build/type/engine/object/from_type.mjs
function FromType8(type) {
  return IsCyclic(type) ? FromCyclic(type.$defs, type.$ref) : IsDependent(type) ? FromDependent(type.if, type.then, type.else) : IsIntersect(type) ? FromIntersect(type.allOf) : IsUnion(type) ? FromUnion3(type.anyOf) : IsTuple(type) ? FromTuple(type.items) : IsObject2(type) ? FromObject3(type.properties) : {};
}

// ../../node_modules/typebox/build/type/engine/object/collapse.mjs
function CollapseToObject(type) {
  const properties2 = FromType8(type);
  const result = _Object_(properties2);
  return result;
}
// ../../node_modules/typebox/build/type/engine/helpers/keys.mjs
var integerKeyPattern = new RegExp("^(?:0|[1-9][0-9]*)$");
function ConvertToIntegerKey(value) {
  const normal = `${value}`;
  return integerKeyPattern.test(normal) ? parseInt(normal) : value;
}

// ../../node_modules/typebox/build/type/engine/indexed/from_array.mjs
function NormalizeLiteral(value) {
  return Literal(ConvertToIntegerKey(value));
}
function NormalizeIndexerTypes(types) {
  return types.map((type) => NormalizeIndexer(type));
}
function NormalizeIndexer(type) {
  return IsIntersect(type) ? Intersect(NormalizeIndexerTypes(type.allOf)) : IsUnion(type) ? Union(NormalizeIndexerTypes(type.anyOf)) : IsLiteral(type) ? NormalizeLiteral(type.const) : type;
}
function FromArray2(type, indexer) {
  const normalizedIndexer = NormalizeIndexer(indexer);
  const check3 = Extends({}, normalizedIndexer, Number2());
  const result = exports_result.IsExtendsTrueLike(check3) ? type : IsLiteral(indexer) && exports_guard.IsEqual(indexer.const, "length") ? Number2() : Never();
  return result;
}

// ../../node_modules/typebox/build/type/engine/indexable/from_cyclic.mjs
function FromCyclic2(defs, ref2) {
  const target2 = CyclicTarget(defs, ref2);
  const result = FromType9(target2);
  return result;
}

// ../../node_modules/typebox/build/type/engine/indexable/from_dependent.mjs
function FromDependent2(if_, then_, else_) {
  const evaluated = EvaluateDependent(if_, then_, else_);
  const result = FromType9(evaluated);
  return result;
}

// ../../node_modules/typebox/build/type/engine/indexable/from_enum.mjs
function FromEnum(values) {
  const evaluated = EvaluateEnum(values);
  const result = FromType9(evaluated);
  return result;
}

// ../../node_modules/typebox/build/type/engine/indexable/from_intersect.mjs
function FromIntersect2(types) {
  const evaluated = EvaluateIntersect(types);
  const result = FromType9(evaluated);
  return result;
}

// ../../node_modules/typebox/build/type/engine/indexable/from_literal.mjs
function FromLiteral4(value) {
  const result = [`${value}`];
  return result;
}

// ../../node_modules/typebox/build/type/engine/indexable/from_template_literal.mjs
function FromTemplateLiteral2(pattern) {
  const evaluated = EvaluateTemplateLiteral(pattern);
  const result = FromType9(evaluated);
  return result;
}

// ../../node_modules/typebox/build/type/engine/indexable/from_union.mjs
function FromUnion4(types) {
  return types.reduce((result, left) => {
    return [...result, ...FromType9(left)];
  }, []);
}

// ../../node_modules/typebox/build/type/engine/indexable/from_type.mjs
function FromType9(type) {
  return IsCyclic(type) ? FromCyclic2(type.$defs, type.$ref) : IsDependent(type) ? FromDependent2(type.if, type.then, type.else) : IsEnum(type) ? FromEnum(type.enum) : IsIntersect(type) ? FromIntersect2(type.allOf) : IsLiteral(type) ? FromLiteral4(type.const) : IsTemplateLiteral(type) ? FromTemplateLiteral2(type.pattern) : IsUnion(type) ? FromUnion4(type.anyOf) : [];
}

// ../../node_modules/typebox/build/type/engine/indexable/to_indexable_keys.mjs
function ToIndexableKeys(type) {
  const result = FromType9(type);
  return result;
}

// ../../node_modules/typebox/build/type/engine/this/expand_this.mjs
function FromTypes5(properties2, types) {
  return types.map((type) => FromType10(properties2, type));
}
function FromType10(properties2, type) {
  return IsArray2(type) ? _Array_(FromType10(properties2, type.items)) : IsConstructor2(type) ? Constructor(FromTypes5(properties2, type.parameters), FromType10(properties2, type.instanceType)) : IsFunction2(type) ? _Function_(FromTypes5(properties2, type.parameters), FromType10(properties2, type.returnType)) : IsTuple(type) ? Tuple(FromTypes5(properties2, type.items)) : IsUnion(type) ? Union(FromTypes5(properties2, type.anyOf)) : IsIntersect(type) ? Intersect(FromTypes5(properties2, type.allOf)) : IsThis(type) ? _Object_(properties2) : type;
}
function ExpandThis(properties2, type) {
  const result = FromType10(properties2, type);
  return result;
}

// ../../node_modules/typebox/build/type/engine/indexed/from_object.mjs
function IndexProperty(properties2, key) {
  const selectedType = key in properties2 ? properties2[key] : Never();
  const result = ExpandThis(properties2, selectedType);
  return result;
}
function IndexProperties(properties2, keys) {
  return keys.reduce((result, left) => {
    return [...result, IndexProperty(properties2, left)];
  }, []);
}
function FromIndexer(properties2, indexer) {
  const keys = ToIndexableKeys(indexer);
  const variants = IndexProperties(properties2, keys);
  const result = EvaluateUnion(variants);
  return result;
}
var NumericKeyPattern = new RegExp(IntegerKey);
function NumericKeys(keys) {
  const result = keys.filter((key) => NumericKeyPattern.test(key));
  return result;
}
function FromIndexerNumber(properties2) {
  const keys = PropertyKeys(properties2);
  const numericKeys = NumericKeys(keys);
  const variants = IndexProperties(properties2, numericKeys);
  const result = EvaluateUnion(variants);
  return result;
}
function FromObject4(properties2, indexer) {
  const result = IsNumber3(indexer) ? FromIndexerNumber(properties2) : FromIndexer(properties2, indexer);
  return result;
}

// ../../node_modules/typebox/build/type/engine/indexed/array_indexer.mjs
function ConvertLiteral(value) {
  return Literal(ConvertToIntegerKey(value));
}
function ArrayIndexerTypes(types) {
  return types.map((type) => FormatArrayIndexer(type));
}
function FormatArrayIndexer(type) {
  return IsIntersect(type) ? Intersect(ArrayIndexerTypes(type.allOf)) : IsUnion(type) ? Union(ArrayIndexerTypes(type.anyOf)) : IsLiteral(type) ? ConvertLiteral(type.const) : type;
}

// ../../node_modules/typebox/build/type/engine/indexed/from_tuple.mjs
function IndexElementsWithIndexer(types, indexer) {
  return types.reduceRight((result, right, index) => {
    const check3 = Extends({}, Literal(index), indexer);
    return exports_result.IsExtendsTrueLike(check3) ? [right, ...result] : result;
  }, []);
}
function FromTupleWithIndexer(types, indexer) {
  const formattedArrayIndexer = FormatArrayIndexer(indexer);
  const elements = IndexElementsWithIndexer(types, formattedArrayIndexer);
  return EvaluateUnionFast(elements);
}
function FromTupleWithoutIndexer(types) {
  return EvaluateUnionFast(types);
}
function FromTuple2(types, indexer) {
  return IsLiteral(indexer) && exports_guard.IsEqual(indexer.const, "length") ? Literal(types.length) : IsNumber3(indexer) || IsInteger2(indexer) ? FromTupleWithoutIndexer(types) : FromTupleWithIndexer(types, indexer);
}

// ../../node_modules/typebox/build/type/engine/indexed/from_type.mjs
function FromType11(type, indexer) {
  return IsArray2(type) ? FromArray2(type.items, indexer) : IsObject2(type) ? FromObject4(type.properties, indexer) : IsTuple(type) ? FromTuple2(type.items, indexer) : Never();
}

// ../../node_modules/typebox/build/type/engine/indexed/instantiate.mjs
function NormalizeType(type) {
  const result = IsCyclic(type) || IsDependent(type) || IsIntersect(type) || IsUnion(type) ? CollapseToObject(type) : type;
  return result;
}
function IndexAction(type, indexer, options) {
  const result = CanInstantiate([type, indexer]) ? exports_memory.Update(FromType11(NormalizeType(type), indexer), {}, options) : IndexDeferred(type, indexer, options);
  return result;
}
function IndexInstantiate(context, state, type, indexer, options) {
  const instantiatedType = InstantiateType(context, state, type);
  const instantiatedIndexer = InstantiateType(context, state, indexer);
  return IndexAction(instantiatedType, instantiatedIndexer, options);
}

// ../../node_modules/typebox/build/type/action/instance_type.mjs
function InstanceTypeDeferred(type, options = {}) {
  return Deferred("InstanceType", [type], options);
}
function InstanceType(type, options = {}) {
  return InstanceTypeAction(type, options);
}

// ../../node_modules/typebox/build/type/engine/instance_type/instantiate.mjs
function InstanceTypeOperation(type) {
  return IsConstructor2(type) ? type["instanceType"] : Never();
}
function InstanceTypeAction(type, options) {
  const result = CanInstantiate([type]) ? exports_memory.Update(InstanceTypeOperation(type), {}, options) : InstanceTypeDeferred(type, options);
  return result;
}
function InstanceTypeInstantiate(context, state, type, options = {}) {
  const instantiatedType = InstantiateType(context, state, type);
  return InstanceTypeAction(instantiatedType, options);
}

// ../../node_modules/typebox/build/type/action/keyof.mjs
function KeyOfDeferred(type, options = {}) {
  return Deferred("KeyOf", [type], options);
}
function KeyOf2(type, options = {}) {
  return KeyOfAction(type, options);
}

// ../../node_modules/typebox/build/type/engine/keyof/from_any.mjs
function FromAny() {
  return Union([Number2(), String2(), Symbol2()]);
}

// ../../node_modules/typebox/build/type/engine/keyof/from_array.mjs
function FromArray3(_type) {
  return Number2();
}

// ../../node_modules/typebox/build/type/engine/keyof/from_object.mjs
function FromPropertyKeys(keys) {
  const result = keys.reduce((result2, left) => {
    return IsLiteralValue(left) ? [...result2, Literal(ConvertToIntegerKey(left))] : Unreachable();
  }, []);
  return result;
}
function FromObject5(properties2) {
  const propertyKeys = exports_guard.Keys(properties2);
  const variants = FromPropertyKeys(propertyKeys);
  const result = EvaluateUnionFast(variants);
  return result;
}

// ../../node_modules/typebox/build/type/engine/keyof/from_record.mjs
function FromRecord2(type) {
  return RecordKey(type);
}

// ../../node_modules/typebox/build/type/engine/keyof/from_tuple.mjs
function FromTuple3(types) {
  const result = types.map((_, index) => Literal(index));
  return EvaluateUnionFast(result);
}

// ../../node_modules/typebox/build/type/engine/keyof/from_type.mjs
function FromType12(type) {
  return IsAny(type) ? FromAny() : IsArray2(type) ? FromArray3(type.items) : IsObject2(type) ? FromObject5(type.properties) : IsRecord(type) ? FromRecord2(type) : IsTuple(type) ? FromTuple3(type.items) : Never();
}

// ../../node_modules/typebox/build/type/engine/keyof/instantiate.mjs
function NormalizeType2(type) {
  const result = IsCyclic(type) || IsDependent(type) || IsIntersect(type) || IsUnion(type) ? CollapseToObject(type) : type;
  return result;
}
function KeyOfAction(type, options) {
  return CanInstantiate([type]) ? exports_memory.Update(FromType12(NormalizeType2(type)), {}, options) : KeyOfDeferred(type, options);
}
function KeyOfInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return KeyOfAction(instantiatedType, options);
}

// ../../node_modules/typebox/build/type/action/mapped.mjs
function MappedDeferred(identifier2, type, as, property, options = {}) {
  return Deferred("Mapped", [identifier2, type, as, property], options);
}
function Mapped(identifier2, type, as, property, options = {}) {
  return MappedAction({}, State([], []), identifier2, type, as, property, options);
}

// ../../node_modules/typebox/build/type/engine/mapped/mapped_variants.mjs
function FromTemplateLiteral3(pattern) {
  const evaluated = EvaluateTemplateLiteral(pattern);
  const result = FromType13(evaluated);
  return result;
}
function FromUnion5(types) {
  return types.reduce((result, left) => {
    return [...result, ...FromType13(left)];
  }, []);
}
function FromEnum2(values) {
  const evaluated = EvaluateEnum(values);
  const result = FromType13(evaluated);
  return result;
}
function FromLiteral5(value) {
  const result = exports_guard.IsNumber(value) ? [Literal(`${value}`)] : [Literal(value)];
  return result;
}
function FromType13(type) {
  const result = IsEnum(type) ? FromEnum2(type.enum) : IsLiteral(type) ? FromLiteral5(type.const) : IsTemplateLiteral(type) ? FromTemplateLiteral3(type.pattern) : IsUnion(type) ? FromUnion5(type.anyOf) : [type];
  return result;
}
function MappedVariants(type) {
  const result = FromType13(type);
  return result;
}

// ../../node_modules/typebox/build/type/engine/mapped/mapped_operation.mjs
function CanonicalAs(instantiatedAs) {
  const result = IsTemplateLiteral(instantiatedAs) ? EvaluateTemplateLiteral(instantiatedAs.pattern) : instantiatedAs;
  return result;
}
function MappedVariant(context, state, identifier2, variant, as, property) {
  const variantContext = exports_memory.Assign(context, { [identifier2["name"]]: variant });
  const instantiatedAs = InstantiateType(variantContext, state, as);
  const canonicalAs = CanonicalAs(instantiatedAs);
  const instantiatedProperty = InstantiateType(variantContext, state, property);
  return IsLiteralNumber(canonicalAs) || IsLiteralString(canonicalAs) ? { [canonicalAs.const]: instantiatedProperty } : {};
}
function MappedProperties(context, state, identifier2, variants, as, property) {
  return variants.reduce((result, left) => {
    return [...result, MappedVariant(context, state, identifier2, left, as, property)];
  }, []);
}
function MappedObjects(properties2) {
  return properties2.reduce((result, left) => {
    return [...result, _Object_(left)];
  }, []);
}
function MappedOperation(context, state, identifier2, type, as, property) {
  const variants = MappedVariants(type);
  const mappedProperties = MappedProperties(context, state, identifier2, variants, as, property);
  const mappedObjects = MappedObjects(mappedProperties);
  const result = EvaluateIntersect(mappedObjects);
  return result;
}

// ../../node_modules/typebox/build/type/engine/mapped/instantiate.mjs
function MappedAction(context, state, identifier2, type, as, property, options) {
  const result = CanInstantiate([type]) ? exports_memory.Update(MappedOperation(context, state, identifier2, type, as, property), {}, options) : MappedDeferred(identifier2, type, as, property, options);
  return result;
}
function MappedInstantiate(context, state, identifier2, type, as, property, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return MappedAction(context, state, identifier2, instantiatedType, as, property, options);
}

// ../../node_modules/typebox/build/type/engine/module/instantiate.mjs
function InstantiateCyclics(context, declarations, cyclicKeys) {
  const declarationContext = exports_memory.Assign(context, declarations);
  const declarationKeys = exports_guard.Keys(declarations).filter((key) => cyclicKeys.includes(key));
  return declarationKeys.reduce((result, key) => {
    return { ...result, [key]: InstantiateCyclic(declarationContext, key, declarations[key]) };
  }, {});
}
function InstantiateNonCyclics(context, declarations, cyclicKeys) {
  const declarationContext = exports_memory.Assign(context, declarations);
  const declarationKeys = exports_guard.Keys(declarations).filter((key) => !cyclicKeys.includes(key));
  return declarationKeys.reduce((result, key) => {
    return { ...result, [key]: InstantiateType(declarationContext, State([], []), declarations[key]) };
  }, {});
}
function InstantiateModule(context, declarations, options) {
  const cyclicCandidates = CyclicCandidates(declarations);
  const instantiatedCyclics = InstantiateCyclics(context, declarations, cyclicCandidates);
  const instantiatedNonCyclics = InstantiateNonCyclics(context, declarations, cyclicCandidates);
  const instantiatedModule = { ...instantiatedCyclics, ...instantiatedNonCyclics };
  return exports_memory.Update(instantiatedModule, {}, options);
}
function ModuleInstantiate(context, _state, declarations, options) {
  const instantiatedModule = InstantiateModule(context, declarations, options);
  return instantiatedModule;
}

// ../../node_modules/typebox/build/type/action/non_nullable.mjs
function NonNullableDeferred(type, options = {}) {
  return Deferred("NonNullable", [type], options);
}
function NonNullable(type, options = {}) {
  return NonNullableAction(type, options);
}

// ../../node_modules/typebox/build/type/engine/non_nullable/instantiate.mjs
function NonNullableOperation(type) {
  const excluded = Union([Null(), Undefined()]);
  return ExcludeAction(type, excluded, {});
}
function NonNullableAction(type, options) {
  const result = CanInstantiate([type]) ? exports_memory.Update(NonNullableOperation(type), {}, options) : NonNullableDeferred(type, options);
  return result;
}
function NonNullableInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return NonNullableAction(instantiatedType, options);
}

// ../../node_modules/typebox/build/type/action/omit.mjs
function OmitDeferred(type, indexer, options = {}) {
  return Deferred("Omit", [type, indexer], options);
}
function Omit(type, indexer_or_keys, options = {}) {
  const indexer = exports_guard.IsArray(indexer_or_keys) ? KeysToIndexer(indexer_or_keys) : indexer_or_keys;
  return OmitAction(type, indexer, options);
}

// ../../node_modules/typebox/build/type/engine/indexable/to_indexable.mjs
function ToIndexable(type) {
  const collapsed = CollapseToObject(type);
  const result = IsObject2(collapsed) ? collapsed.properties : Unreachable();
  return result;
}

// ../../node_modules/typebox/build/type/engine/omit/from_type.mjs
function FromKeys(properties2, keys) {
  const result = exports_guard.Keys(properties2).reduce((result2, key) => {
    return keys.includes(key) ? result2 : { ...result2, [key]: properties2[key] };
  }, {});
  return result;
}
function FromType14(type, indexer) {
  const indexable = ToIndexable(type);
  const indexableKeys = ToIndexableKeys(indexer);
  const omitted = FromKeys(indexable, indexableKeys);
  const result = _Object_(omitted);
  return result;
}

// ../../node_modules/typebox/build/type/engine/omit/instantiate.mjs
function OmitAction(type, indexer, options) {
  const result = CanInstantiate([type, indexer]) ? exports_memory.Update(FromType14(type, indexer), {}, options) : OmitDeferred(type, indexer, options);
  return result;
}
function OmitInstantiate(context, state, type, indexer, options) {
  const instantiatedType = InstantiateType(context, state, type);
  const instantiatedIndexer = InstantiateType(context, state, indexer);
  return OmitAction(instantiatedType, instantiatedIndexer, options);
}

// ../../node_modules/typebox/build/type/action/parameters.mjs
function ParametersDeferred(type, options = {}) {
  return Deferred("Parameters", [type], options);
}
function Parameters(type, options = {}) {
  return ParametersAction(type, options);
}

// ../../node_modules/typebox/build/type/engine/parameters/instantiate.mjs
function ParametersOperation(type) {
  const parameters = IsFunction2(type) ? type["parameters"] : [];
  const instantiatedParameters = InstantiateElements({}, State([], []), parameters);
  const result = Tuple(instantiatedParameters);
  return result;
}
function ParametersAction(type, options) {
  const result = CanInstantiate([type]) ? exports_memory.Update(ParametersOperation(type), {}, options) : ParametersDeferred(type, options);
  return result;
}
function ParametersInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return ParametersAction(instantiatedType, options);
}

// ../../node_modules/typebox/build/type/action/partial.mjs
function PartialDeferred(type, options = {}) {
  return Deferred("Partial", [type], options);
}
function Partial(type, options = {}) {
  return PartialAction(type, options);
}

// ../../node_modules/typebox/build/type/engine/partial/from_cyclic.mjs
function FromCyclic3(defs, ref2) {
  const target2 = CyclicTarget(defs, ref2);
  const partial = FromType15(target2);
  const result = Cyclic(exports_memory.Assign(defs, { [ref2]: partial }), ref2);
  return result;
}

// ../../node_modules/typebox/build/type/engine/partial/from_dependent.mjs
function FromDependent3(if_, then_, else_) {
  const evaluated = EvaluateDependent(if_, then_, else_);
  const result = FromType15(evaluated);
  return result;
}

// ../../node_modules/typebox/build/type/engine/partial/from_intersect.mjs
function FromIntersect3(types) {
  const evaluated = EvaluateIntersect(types);
  const result = FromType15(evaluated);
  return result;
}

// ../../node_modules/typebox/build/type/engine/partial/from_union.mjs
function FromUnion6(types) {
  const result = types.map((type) => FromType15(type));
  return Union(result);
}

// ../../node_modules/typebox/build/type/engine/partial/from_object.mjs
function FromObject6(properties2) {
  const mapped = exports_guard.Keys(properties2).reduce((result2, left) => {
    return { ...result2, [left]: AddOptional(properties2[left]) };
  }, {});
  const result = _Object_(mapped);
  return result;
}

// ../../node_modules/typebox/build/type/engine/partial/from_type.mjs
function FromType15(type) {
  return IsCyclic(type) ? FromCyclic3(type.$defs, type.$ref) : IsDependent(type) ? FromDependent3(type.if, type.then, type.else) : IsIntersect(type) ? FromIntersect3(type.allOf) : IsUnion(type) ? FromUnion6(type.anyOf) : IsObject2(type) ? FromObject6(type.properties) : _Object_({});
}

// ../../node_modules/typebox/build/type/engine/partial/instantiate.mjs
function PartialAction(type, options) {
  const result = CanInstantiate([type]) ? exports_memory.Update(FromType15(type), {}, options) : PartialDeferred(type, options);
  return result;
}
function PartialInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return PartialAction(instantiatedType, options);
}

// ../../node_modules/typebox/build/type/action/pick.mjs
function PickDeferred(type, indexer, options = {}) {
  return Deferred("Pick", [type, indexer], options);
}
function Pick(type, indexer_or_keys, options = {}) {
  const indexer = exports_guard.IsArray(indexer_or_keys) ? KeysToIndexer(indexer_or_keys) : indexer_or_keys;
  return PickAction(type, indexer, options);
}

// ../../node_modules/typebox/build/type/engine/pick/from_type.mjs
function FromKeys2(properties2, keys) {
  const result = exports_guard.Keys(properties2).reduce((result2, key) => {
    return keys.includes(key) ? exports_memory.Assign(result2, { [key]: properties2[key] }) : result2;
  }, {});
  return result;
}
function FromType16(type, indexer) {
  const indexable = ToIndexable(type);
  const keys = ToIndexableKeys(indexer);
  const applied = FromKeys2(indexable, keys);
  const result = _Object_(applied);
  return result;
}

// ../../node_modules/typebox/build/type/engine/pick/instantiate.mjs
function PickAction(type, indexer, options) {
  const result = CanInstantiate([type, indexer]) ? exports_memory.Update(FromType16(type, indexer), {}, options) : PickDeferred(type, indexer, options);
  return result;
}
function PickInstantiate(context, state, type, indexer, options) {
  const instantiatedType = InstantiateType(context, state, type);
  const instantiatedIndexer = InstantiateType(context, state, indexer);
  return PickAction(instantiatedType, instantiatedIndexer, options);
}

// ../../node_modules/typebox/build/type/action/readonly_object.mjs
function ReadonlyObjectDeferred(type, options = {}) {
  return Deferred("ReadonlyObject", [type], options);
}
function ReadonlyObject(type, options = {}) {
  return ReadonlyObjectAction(type, options);
}
var ReadonlyType = ReadonlyObject;

// ../../node_modules/typebox/build/type/engine/readonly_object/from_array.mjs
function FromArray4(type) {
  const result = AddImmutable(_Array_(type));
  return result;
}

// ../../node_modules/typebox/build/type/engine/readonly_object/from_cyclic.mjs
function FromCyclic4(defs, ref2) {
  const target2 = CyclicTarget(defs, ref2);
  const partial = FromType17(target2);
  const result = Cyclic(exports_memory.Assign(defs, { [ref2]: partial }), ref2);
  return result;
}

// ../../node_modules/typebox/build/type/engine/readonly_object/from_dependent.mjs
function FromDependent4(if_, then_, else_) {
  const evaluated = EvaluateDependent(if_, then_, else_);
  const result = FromType17(evaluated);
  return result;
}

// ../../node_modules/typebox/build/type/engine/readonly_object/from_intersect.mjs
function FromIntersect4(types) {
  const evaluated = EvaluateIntersect(types);
  const result = FromType17(evaluated);
  return result;
}

// ../../node_modules/typebox/build/type/engine/readonly_object/from_object.mjs
function FromObject7(properties2) {
  const mapped = exports_guard.Keys(properties2).reduce((result2, left) => {
    return { ...result2, [left]: AddReadonly(properties2[left]) };
  }, {});
  const result = _Object_(mapped);
  return result;
}

// ../../node_modules/typebox/build/type/engine/readonly_object/from_tuple.mjs
function FromTuple4(types) {
  const result = AddImmutable(Tuple(types));
  return result;
}

// ../../node_modules/typebox/build/type/engine/readonly_object/from_union.mjs
function FromUnion7(types) {
  const result = types.map((type) => FromType17(type));
  return Union(result);
}

// ../../node_modules/typebox/build/type/engine/readonly_object/from_type.mjs
function FromType17(type) {
  return IsArray2(type) ? FromArray4(type.items) : IsCyclic(type) ? FromCyclic4(type.$defs, type.$ref) : IsDependent(type) ? FromDependent4(type.if, type.then, type.else) : IsIntersect(type) ? FromIntersect4(type.allOf) : IsObject2(type) ? FromObject7(type.properties) : IsTuple(type) ? FromTuple4(type.items) : IsUnion(type) ? FromUnion7(type.anyOf) : type;
}

// ../../node_modules/typebox/build/type/engine/readonly_object/instantiate.mjs
function ReadonlyObjectAction(type, options) {
  const result = CanInstantiate([type]) ? exports_memory.Update(FromType17(type), {}, options) : ReadonlyObjectDeferred(type);
  return result;
}
function ReadonlyObjectInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return ReadonlyObjectAction(instantiatedType, options);
}

// ../../node_modules/typebox/build/type/engine/ref/instantiate.mjs
function RefInstantiate(context, state, type, ref2) {
  return state.visited.includes(ref2) ? type : (ref2 in context) ? InstantiateType(context, State(state["callstack"], [...state["visited"], ref2]), context[ref2]) : type;
}

// ../../node_modules/typebox/build/type/engine/required/from_cyclic.mjs
function FromCyclic5(defs, ref2) {
  const target2 = CyclicTarget(defs, ref2);
  const partial = FromType18(target2);
  const result = Cyclic(exports_memory.Assign(defs, { [ref2]: partial }), ref2);
  return result;
}

// ../../node_modules/typebox/build/type/engine/required/from_dependent.mjs
function FromDependent5(if_, then_, else_) {
  const evaluated = EvaluateDependent(if_, then_, else_);
  const result = FromType18(evaluated);
  return result;
}

// ../../node_modules/typebox/build/type/engine/required/from_intersect.mjs
function FromIntersect5(types) {
  const evaluated = EvaluateIntersect(types);
  const result = FromType18(evaluated);
  return result;
}

// ../../node_modules/typebox/build/type/engine/required/from_union.mjs
function FromUnion8(types) {
  const result = types.map((type) => FromType18(type));
  return Union(result);
}

// ../../node_modules/typebox/build/type/engine/required/from_object.mjs
function FromObject8(properties2) {
  const mapped = exports_guard.Keys(properties2).reduce((result2, left) => {
    return { ...result2, [left]: RemoveOptional(properties2[left]) };
  }, {});
  const result = _Object_(mapped);
  return result;
}

// ../../node_modules/typebox/build/type/engine/required/from_type.mjs
function FromType18(type) {
  return IsCyclic(type) ? FromCyclic5(type.$defs, type.$ref) : IsDependent(type) ? FromDependent5(type.if, type.then, type.else) : IsIntersect(type) ? FromIntersect5(type.allOf) : IsUnion(type) ? FromUnion8(type.anyOf) : IsObject2(type) ? FromObject8(type.properties) : _Object_({});
}

// ../../node_modules/typebox/build/type/action/required.mjs
function RequiredDeferred(type, options = {}) {
  return Deferred("Required", [type], options);
}
function Required(type, options = {}) {
  return RequiredAction(type, options);
}

// ../../node_modules/typebox/build/type/engine/required/instantiate.mjs
function RequiredAction(type, options) {
  const result = CanInstantiate([type]) ? exports_memory.Update(FromType18(type), {}, options) : RequiredDeferred(type, options);
  return result;
}
function RequiredInstantiate(context, state, type, options) {
  const instaniatedType = InstantiateType(context, state, type);
  return RequiredAction(instaniatedType, options);
}

// ../../node_modules/typebox/build/type/action/return_type.mjs
function ReturnTypeDeferred(type, options = {}) {
  return Deferred("ReturnType", [type], options);
}
function ReturnType(type, options = {}) {
  return ReturnTypeAction(type, options);
}

// ../../node_modules/typebox/build/type/engine/return_type/instantiate.mjs
function ReturnTypeOperation(type) {
  return IsFunction2(type) ? type["returnType"] : Never();
}
function ReturnTypeAction(type, options) {
  const result = CanInstantiate([type]) ? exports_memory.Update(ReturnTypeOperation(type), {}, options) : ReturnTypeDeferred(type, options);
  return result;
}
function ReturnTypeInstantiate(context, state, type, options = {}) {
  const instantiatedType = InstantiateType(context, state, type);
  return ReturnTypeAction(instantiatedType, options);
}

// ../../node_modules/typebox/build/type/action/with.mjs
function WithDeferred(type, options) {
  return Deferred("With", [type, options], {});
}
function With2(type, options) {
  return WithAction(type, options);
}

// ../../node_modules/typebox/build/type/engine/with/instantiate.mjs
function WithAction(type, options) {
  const result = CanInstantiate([type]) ? exports_memory.Update(type, {}, options) : WithDeferred(type, options);
  return result;
}
function WithInstantiate(context, state, type, options) {
  const instaniatedType = InstantiateType(context, state, type);
  return WithAction(instaniatedType, options);
}

// ../../node_modules/typebox/build/type/engine/rest/spread.mjs
function SpreadElement(type) {
  const result = IsRest(type) ? IsTuple(type.items) ? RestSpread(type.items.items) : IsInfer(type.items) ? [type] : IsRef(type.items) ? [type] : [Never()] : [type];
  return result;
}
function RestSpread(types) {
  const result = types.reduce((result2, left) => {
    return [...result2, ...SpreadElement(left)];
  }, []);
  return result;
}
// ../../node_modules/typebox/build/type/engine/instantiate.mjs
function State(callstack, visited) {
  return { callstack, visited };
}
function CanInstantiate(types) {
  return exports_guard.ShiftLeft(types, (left, right) => IsRef(left) ? false : CanInstantiate(right), () => true);
}
function InstantiateProperties(context, state, properties2) {
  return exports_guard.Keys(properties2).reduce((result, key) => {
    return { ...result, [key]: InstantiateType(context, state, properties2[key]) };
  }, {});
}
function InstantiateElements(context, state, types) {
  const elements = InstantiateTypes(context, state, types);
  const result = RestSpread(elements);
  return result;
}
function InstantiateTypes(context, state, types) {
  return types.map((type) => InstantiateType(context, state, type));
}
function WithModifiers(type, instantiatedType) {
  const withOptional = IsOptional(type) ? AddOptionalAction(instantiatedType, {}) : instantiatedType;
  const withReadonly = IsReadonly(type) ? AddReadonlyAction(withOptional, {}) : withOptional;
  const withImmutable = IsImmutable(type) ? AddImmutableAction(withReadonly, {}) : withReadonly;
  return withImmutable;
}
function InstantiateDeferred(context, state, action, parameters, options) {
  return exports_guard.IsEqual(action, "AddImmutable") ? AddImmutableInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "RemoveImmutable") ? RemoveImmutableInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "AddReadonly") ? AddReadonlyInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "RemoveReadonly") ? RemoveReadonlyInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "AddOptional") ? AddOptionalInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "RemoveOptional") ? RemoveOptionalInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "Capitalize") ? CapitalizeInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "Conditional") ? ConditionalInstantiate(context, state, parameters[0], parameters[1], parameters[2], parameters[3], options) : exports_guard.IsEqual(action, "ConstructorParameters") ? ConstructorParametersInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "Evaluate") ? EvaluateInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "Exclude") ? ExcludeInstantiate(context, state, parameters[0], parameters[1], options) : exports_guard.IsEqual(action, "Extract") ? ExtractInstantiate(context, state, parameters[0], parameters[1], options) : exports_guard.IsEqual(action, "Index") ? IndexInstantiate(context, state, parameters[0], parameters[1], options) : exports_guard.IsEqual(action, "InstanceType") ? InstanceTypeInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "Interface") ? InterfaceInstantiate(context, state, parameters[0], parameters[1], options) : exports_guard.IsEqual(action, "KeyOf") ? KeyOfInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "Lowercase") ? LowercaseInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "Mapped") ? MappedInstantiate(context, state, parameters[0], parameters[1], parameters[2], parameters[3], options) : exports_guard.IsEqual(action, "Module") ? ModuleInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "NonNullable") ? NonNullableInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "Pick") ? PickInstantiate(context, state, parameters[0], parameters[1], options) : exports_guard.IsEqual(action, "Parameters") ? ParametersInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "Partial") ? PartialInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "Omit") ? OmitInstantiate(context, state, parameters[0], parameters[1], options) : exports_guard.IsEqual(action, "ReadonlyObject") ? ReadonlyObjectInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "Record") ? RecordInstantiate(context, state, parameters[0], parameters[1], options) : exports_guard.IsEqual(action, "Required") ? RequiredInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "ReturnType") ? ReturnTypeInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "TemplateLiteral") ? TemplateLiteralInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "Uncapitalize") ? UncapitalizeInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "Uppercase") ? UppercaseInstantiate(context, state, parameters[0], options) : exports_guard.IsEqual(action, "With") ? WithInstantiate(context, state, parameters[0], parameters[1]) : Deferred(action, parameters, options);
}
function InstantiateImmediate(context, state, type) {
  const instantiatedType = IsRef(type) ? RefInstantiate(context, state, type, type.$ref) : IsArray2(type) ? _Array_(InstantiateType(context, state, type.items), ArrayOptions(type)) : IsCall(type) ? CallInstantiate(context, state, type.target, type.arguments) : IsConstructor2(type) ? Constructor(InstantiateTypes(context, state, type.parameters), InstantiateType(context, state, type.instanceType), ConstructorOptions(type)) : IsFunction2(type) ? _Function_(InstantiateTypes(context, state, type.parameters), InstantiateType(context, state, type.returnType), FunctionOptions(type)) : IsDependent(type) ? Dependent(InstantiateType(context, state, type.if), InstantiateType(context, state, type.then), InstantiateType(context, state, type.else), DependentOptions(type)) : IsIntersect(type) ? Intersect(InstantiateTypes(context, state, type.allOf), IntersectOptions(type)) : IsObject2(type) ? _Object_(InstantiateProperties(context, state, type.properties), ObjectOptions(type)) : IsRecord(type) ? RecordFromPattern(RecordPattern(type), InstantiateType(context, state, RecordValue(type))) : IsRest(type) ? Rest(InstantiateType(context, state, type.items)) : IsTuple(type) ? Tuple(InstantiateElements(context, state, type.items), TupleOptions(type)) : IsUnion(type) ? Union(InstantiateTypes(context, state, type.anyOf), UnionOptions(type)) : type;
  const withModifiers = WithModifiers(type, instantiatedType);
  return withModifiers;
}
function InstantiateType(context, state, type) {
  const result = IsDeferred(type) ? InstantiateDeferred(context, state, type.action, type.parameters, type.options) : InstantiateImmediate(context, state, type);
  return result;
}
function Instantiate(context, type) {
  return InstantiateType(context, State([], []), type);
}

// ../../node_modules/typebox/build/type/engine/immutable/instantiate_add.mjs
function AddImmutableOperation(type) {
  return exports_memory.Update(type, { "~immutable": true }, {});
}
function AddImmutableAction(type, options) {
  const result = exports_memory.Update(AddImmutableOperation(type), {}, options);
  return result;
}
function AddImmutableInstantiate(context, state, type, options) {
  const instantiatedType = InstantiateType(context, state, type);
  return AddImmutableAction(instantiatedType, options);
}

// ../../node_modules/typebox/build/type/action/_add_immutable.mjs
function AddImmutableDeferred(type, options = {}) {
  return Deferred("AddImmutable", [type], options);
}
function AddImmutable(type, options = {}) {
  return AddImmutableAction(type, options);
}
// ../../node_modules/typebox/build/type/action/evaluate.mjs
function EvaluateDeferred(type, options = {}) {
  return Deferred("Evaluate", [type], options);
}
function Evaluate(type, options = {}) {
  return EvaluateAction(type, options);
}
// ../../node_modules/typebox/build/type/action/module.mjs
function ModuleDeferred(declarations, options = {}) {
  return Deferred("Module", [declarations], options);
}
function Module2(declarations, options = {}) {
  return ModuleInstantiate({}, State([], []), declarations, options);
}
// ../../node_modules/typebox/build/type/script/script.mjs
function Script2(...args) {
  const [context, input, options] = exports_arguments.Match(args, {
    2: (script, options2) => exports_guard.IsString(script) ? [{}, script, options2] : [script, options2, {}],
    3: (context2, script, options2) => [context2, script, options2],
    1: (script) => [{}, script, {}]
  });
  const result = Script(input);
  const parsed = exports_guard.IsArray(result) && exports_guard.IsEqual(result.length, 2) ? InstantiateType(context, State([], []), result[0]) : Never();
  return exports_memory.Update(parsed, {}, options);
}
// ../../node_modules/typebox/build/typebox.mjs
var exports_typebox = {};
__export(exports_typebox, {
  With: () => With2,
  Void: () => Void,
  Uppercase: () => Uppercase,
  Unsafe: () => Unsafe,
  Unknown: () => Unknown,
  Union: () => Union,
  Undefined: () => Undefined,
  Uncapitalize: () => Uncapitalize,
  Tuple: () => Tuple,
  This: () => This,
  TemplateLiteral: () => TemplateLiteral2,
  Symbol: () => Symbol2,
  String: () => String2,
  Script: () => Script2,
  ReturnType: () => ReturnType,
  Rest: () => Rest,
  Required: () => Required,
  Refine: () => Refine,
  Ref: () => Ref,
  RecordValue: () => RecordValue,
  RecordPattern: () => RecordPattern,
  RecordKey: () => RecordKey,
  Record: () => Record,
  ReadonlyType: () => ReadonlyType,
  ReadonlyObject: () => ReadonlyObject,
  Readonly: () => Readonly,
  Pick: () => Pick,
  Partial: () => Partial,
  Parameters: () => Parameters,
  Parameter: () => Parameter,
  Optional: () => Optional,
  Omit: () => Omit,
  Object: () => _Object_,
  Number: () => Number2,
  Null: () => Null,
  NonNullable: () => NonNullable,
  Never: () => Never,
  Module: () => Module2,
  Mapped: () => Mapped,
  Lowercase: () => Lowercase,
  Literal: () => Literal,
  KeyOf: () => KeyOf2,
  IsVoid: () => IsVoid,
  IsUnsafe: () => IsUnsafe,
  IsUnknown: () => IsUnknown,
  IsUnion: () => IsUnion,
  IsUndefined: () => IsUndefined2,
  IsTuple: () => IsTuple,
  IsThis: () => IsThis,
  IsTemplateLiteral: () => IsTemplateLiteral,
  IsSymbol: () => IsSymbol2,
  IsString: () => IsString3,
  IsSchema: () => IsSchema,
  IsRest: () => IsRest,
  IsRefine: () => IsRefine,
  IsRef: () => IsRef,
  IsRecord: () => IsRecord,
  IsReadonly: () => IsReadonly,
  IsParameter: () => IsParameter,
  IsOptional: () => IsOptional,
  IsObject: () => IsObject2,
  IsNumber: () => IsNumber3,
  IsNull: () => IsNull2,
  IsNever: () => IsNever,
  IsLiteral: () => IsLiteral,
  IsKind: () => IsKind,
  IsIntersect: () => IsIntersect,
  IsInteger: () => IsInteger2,
  IsInfer: () => IsInfer,
  IsImmutable: () => IsImmutable,
  IsIdentifier: () => IsIdentifier,
  IsGeneric: () => IsGeneric,
  IsFunction: () => IsFunction2,
  IsEnumValue: () => IsEnumValue,
  IsEnum: () => IsEnum,
  IsDependent: () => IsDependent,
  IsCyclic: () => IsCyclic,
  IsConstructor: () => IsConstructor2,
  IsCodec: () => IsCodec,
  IsCall: () => IsCall,
  IsBoolean: () => IsBoolean3,
  IsBigInt: () => IsBigInt2,
  IsArray: () => IsArray2,
  IsAny: () => IsAny,
  Intersect: () => Intersect,
  Interface: () => Interface,
  Integer: () => Integer,
  Instantiate: () => Instantiate,
  InstanceType: () => InstanceType,
  Infer: () => Infer,
  Index: () => Index,
  Immutable: () => Immutable,
  Identifier: () => Identifier,
  Generic: () => Generic,
  Function: () => _Function_,
  Extract: () => Extract,
  ExtendsResult: () => exports_result,
  Extends: () => Extends,
  Exclude: () => Exclude,
  Evaluate: () => Evaluate,
  Enum: () => Enum,
  EncodeBuilder: () => EncodeBuilder,
  Encode: () => Encode,
  Dependent: () => Dependent,
  DecodeBuilder: () => DecodeBuilder,
  Decode: () => Decode,
  Cyclic: () => Cyclic,
  ConstructorParameters: () => ConstructorParameters,
  Constructor: () => Constructor,
  Conditional: () => Conditional,
  Codec: () => Codec,
  Capitalize: () => Capitalize,
  Call: () => Call,
  Boolean: () => Boolean2,
  BigInt: () => BigInt2,
  Array: () => _Array_,
  Any: () => Any
});
// ../audit-core/src/cli/emit-event.mjs
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";

// ../audit-core/src/workos-client.mjs
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

// ../audit-core/src/util.mjs
function trimToUndefined(value) {
  if (typeof value !== "string")
    return;
  const trimmed = value.trim();
  return trimmed || undefined;
}
function stableSerialize(value) {
  if (value === null || value === undefined)
    return "null";
  if (typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean")
    return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map(stableSerialize).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize(nested)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(String(value));
}

// ../audit-core/src/workos-client.mjs
var requireFromHere = createRequire(import.meta.url);
var cachedKeyringEntry = null;
function loadKeyringEntry() {
  if (cachedKeyringEntry !== null)
    return cachedKeyringEntry;
  try {
    cachedKeyringEntry = requireFromHere("@napi-rs/keyring").Entry;
  } catch {
    cachedKeyringEntry = undefined;
  }
  return cachedKeyringEntry;
}
var DEFAULT_API_BASE_URL = "https://api.workos.com";
var DEFAULT_ORGANIZATION_NAME = "Audit Log Harness";
var USER_AGENT2 = "workos-audit-harness/1";
var WORKOS_CLI_VERSION = "0.21.0";
function getWorkosCliSpec() {
  const override = trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_WORKOS_VERSION);
  return `workos@${override || WORKOS_CLI_VERSION}`;
}
function parseJson(text, fallback = {}) {
  if (!text || !text.trim())
    return fallback;
  return JSON.parse(text);
}
function getWorkosCommandPrefix() {
  const configured = trimToUndefined(process.env.WORKOS_AUDIT_HARNESS_WORKOS_BIN);
  if (configured)
    return [configured];
  try {
    const found = execFileSync("bash", ["-lc", "command -v workos"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (found)
      return [found];
  } catch {}
  return ["npx", "--yes", getWorkosCliSpec()];
}
function runWorkos(args, options = {}) {
  const [bin, ...prefixArgs] = getWorkosCommandPrefix();
  return execFileSync(bin, [...prefixArgs, ...args], {
    encoding: "utf8",
    stdio: options.stdio || ["ignore", "pipe", "pipe"],
    input: options.input,
    env: { ...process.env, NO_COLOR: "1" }
  });
}
function readWorkosCliConfig() {
  const Entry = loadKeyringEntry();
  if (Entry) {
    try {
      const raw = new Entry("workos-cli", "config").getPassword();
      if (raw)
        return JSON.parse(raw);
    } catch {}
  }
  try {
    const filePath = path.join(os.homedir(), ".workos", "config.json");
    if (existsSync(filePath))
      return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {}
  return null;
}
function getWorkosCliActiveEnvironment() {
  const cliConfig = readWorkosCliConfig();
  if (!cliConfig)
    return;
  if (cliConfig.activeEnvironment && cliConfig.environments?.[cliConfig.activeEnvironment]) {
    return cliConfig.environments[cliConfig.activeEnvironment];
  }
  if (cliConfig.workosApiKey)
    return { apiKey: cliConfig.workosApiKey };
  return;
}
function getEffectiveApiKey(config) {
  return config.apiKey || getWorkosCliActiveEnvironment()?.apiKey;
}
function createSdk(config) {
  const apiKey = getEffectiveApiKey(config);
  if (!apiKey)
    return;
  const url = new URL(config.apiBaseUrl || DEFAULT_API_BASE_URL);
  return new WorkOSNode(apiKey, {
    apiHostname: url.hostname,
    ...url.port ? { port: Number(url.port) } : {},
    ...url.protocol === "http:" ? { https: false } : {}
  });
}
function apiUrl(config, pathname) {
  return new URL(pathname, config.apiBaseUrl || DEFAULT_API_BASE_URL).toString();
}
function pickOrganizationId(value) {
  return value?.id || value?.data?.id || value?.organization?.id;
}
async function retry(operation, label, attempts = 3) {
  let lastError;
  for (let attempt = 1;attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts)
        break;
      const message2 = error.stderr?.toString?.().trim() || error.message || String(error);
      process.stderr.write(`Retrying ${label} after failure (${attempt}/${attempts}): ${message2}
`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw lastError;
}
async function ensureOrganization(config) {
  if (config.organizationId)
    return config.organizationId;
  const name = config.organizationName || DEFAULT_ORGANIZATION_NAME;
  const workos = createSdk(config);
  if (workos) {
    const page = await retry(() => workos.organizations.listOrganizations({ limit: 100 }), "organization list");
    const existing2 = page.data?.find((organization) => organization.name === name);
    if (existing2?.id)
      return existing2.id;
    const created2 = await retry(() => workos.organizations.createOrganization({ name }), `organization create ${name}`);
    return created2.id;
  }
  const list = await retry(() => parseJson(runWorkos(["organization", "list", "--json", "--mode", "agent"])), "organization list");
  const existing = list.data?.find((organization) => organization.name === name);
  if (existing?.id)
    return existing.id;
  const created = await retry(() => parseJson(runWorkos(["organization", "create", name, "--json", "--mode", "agent"])), `organization create ${name}`);
  const id = pickOrganizationId(created);
  if (!id)
    throw new Error(`Created organization ${name}, but could not find its id in WorkOS CLI output.`);
  return id;
}

// ../audit-core/src/device-cert.mjs
import { execFileSync as execFileSync2 } from "node:child_process";
var LABEL_RE = /"(OktaManagementAttestation for [^"]+)"/;
var cached;
function getDeviceCertLabel() {
  if (cached !== undefined)
    return cached;
  try {
    const out = execFileSync2("security", ["find-identity"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    cached = LABEL_RE.exec(out)?.[1] ?? null;
  } catch {
    cached = null;
  }
  return cached;
}

// ../audit-core/src/cli/emit-event.mjs
var CONNECT_TIMEOUT_SECONDS = 5;
var MAX_TIME_SECONDS = 10;
var PROXY_MAX_BATCH_EVENTS = 25;
function runCurl(args, input) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn("/usr/bin/curl", args, {
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env, CURL_SSL_BACKEND: "secure-transport" }
      });
    } catch (error) {
      resolve({ code: null, stdout: "", stderr: String(error?.message || error) });
      return;
    }
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      resolve({ code: null, stdout, stderr: stderr || String(error?.message || error) });
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}
function toRestEvent(event) {
  const { occurredAt, occurred_at, context, actor, targets, ...rest3 } = event;
  const normalizedContext = context ? {
    location: context.location,
    user_agent: context.user_agent || context.userAgent
  } : undefined;
  return {
    ...rest3,
    actor: actor ? { ...actor, metadata: actor.metadata || {} } : actor,
    targets: (targets || []).map((target2) => ({ ...target2, metadata: target2.metadata || {} })),
    occurred_at: occurred_at || occurredAt || new Date().toISOString(),
    ...normalizedContext ? { context: normalizedContext } : {}
  };
}
async function postToProxy(requestBody, label, config) {
  const { code, stdout, stderr } = await runCurl([
    "-sS",
    "--fail-with-body",
    "--connect-timeout",
    String(CONNECT_TIMEOUT_SECONDS),
    "--max-time",
    String(MAX_TIME_SECONDS),
    "-w",
    `
%{http_code}`,
    "-X",
    "POST",
    "--cert",
    label,
    "-H",
    "Content-Type: application/json",
    "--data-binary",
    "@-",
    config.proxyUrl
  ], JSON.stringify(requestBody));
  const { status, body } = splitCurlOutput(stdout);
  if (code !== 0) {
    const reason = stderr.trim() || `curl exited with code ${code === null ? "unknown" : code}`;
    return { error: body ? `${reason} :: ${body}` : reason, status };
  }
  if (status === null)
    return { error: "could not read proxy response status", status: null };
  if (status < 200 || status > 299) {
    return {
      error: body ? `proxy returned HTTP ${status} :: ${body}` : `proxy returned HTTP ${status}`,
      status
    };
  }
  return { status, body };
}
function warn(detail) {
  process.stderr.write(`workos-audit: proxy emit failed (${detail})
`);
}
function proxyPayload(event) {
  const payload = toRestEvent(event);
  delete payload.actor;
  return payload;
}
async function emitViaProxy(event, config) {
  const label = getDeviceCertLabel();
  if (!label) {
    return { ok: false, transport: "proxy", skipped: true, reason: "no-device-certificate" };
  }
  const { error, status } = await postToProxy(proxyPayload(event), label, config);
  if (error) {
    warn(error);
    return { ok: false, transport: "proxy", error, ...status ? { status } : {}, action: event.action };
  }
  return { ok: true, transport: "proxy", status, action: event.action };
}
async function emitBatchViaProxy(events, config) {
  const label = getDeviceCertLabel();
  if (!label) {
    return { ok: false, transport: "proxy", skipped: true, reason: "no-device-certificate", accepted: 0 };
  }
  let accepted = 0;
  const errors = [];
  for (let i = 0;i < events.length; i += PROXY_MAX_BATCH_EVENTS) {
    const chunk = events.slice(i, i + PROXY_MAX_BATCH_EVENTS);
    const { error, status, body } = await postToProxy({ events: chunk.map(proxyPayload) }, label, config);
    if (error) {
      if (status === 422 || status === 413) {
        const single = await Promise.all(chunk.map((event) => emitViaProxy(event, config)));
        accepted += single.filter((r) => r.ok).length;
        const failed = single.filter((r) => !r.ok);
        if (failed.length > 0)
          errors.push(`${failed.length}/${chunk.length} failed after per-event retry`);
        continue;
      }
      warn(error);
      errors.push(error);
      continue;
    }
    let report;
    try {
      report = JSON.parse(body);
    } catch {
      report = null;
    }
    accepted += typeof report?.accepted === "number" ? report.accepted : chunk.length;
    const rejected = Array.isArray(report?.rejected) ? report.rejected : [];
    if (rejected.length > 0) {
      const detail = rejected.map((r) => `#${i + (r?.index ?? 0)} ${r?.reason ?? "unknown"}`).join(", ");
      warn(`proxy rejected ${rejected.length}/${chunk.length} event(s) (HTTP ${status}): ${detail}`);
      errors.push(detail);
    }
  }
  return {
    ok: errors.length === 0,
    transport: "proxy",
    accepted,
    total: events.length,
    ...errors.length > 0 ? { error: errors.join("; ") } : {}
  };
}
async function emitEvents(events, config) {
  const list = Array.isArray(events) ? events.filter(Boolean) : [];
  if (list.length === 0)
    return { ok: true, accepted: 0, total: 0 };
  if (list.length === 1) {
    const result = await emitEvent(list[0], config);
    return { ...result, accepted: result.ok ? 1 : 0, total: 1 };
  }
  if (config.proxyUrl)
    return emitBatchViaProxy(list, config);
  let accepted = 0;
  const errors = [];
  for (const event of list) {
    try {
      await emitEvent(event, config);
      accepted += 1;
    } catch (error) {
      errors.push(String(error?.message || error));
    }
  }
  return {
    ok: errors.length === 0,
    accepted,
    total: list.length,
    ...errors.length > 0 ? { error: errors.join("; ") } : {}
  };
}
function splitCurlOutput(raw) {
  const text = String(raw ?? "");
  const cut = text.lastIndexOf(`
`);
  const parsed = Number.parseInt(cut === -1 ? text : text.slice(cut + 1), 10);
  const body = (cut === -1 ? "" : text.slice(0, cut)).replace(/\s+/g, " ").trim();
  return {
    status: Number.isInteger(parsed) ? parsed : null,
    body: body.length > 200 ? `${body.slice(0, 200)}…` : body
  };
}
async function emitEvent(event, config) {
  if (config.proxyUrl) {
    return emitViaProxy(event, config);
  }
  const orgId = await ensureOrganization(config);
  const effectiveApiKey = getEffectiveApiKey(config);
  if (effectiveApiKey) {
    const response = await fetch(apiUrl(config, "/audit_logs/events"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${effectiveApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
        "User-Agent": USER_AGENT2
      },
      body: JSON.stringify({ organization_id: orgId, event: toRestEvent(event) })
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`WorkOS audit event failed: ${response.status} ${response.statusText}${body ? ` :: ${body}` : ""}`);
    }
    return { ok: true, transport: "api-key", organizationId: orgId, action: event.action };
  }
  const occurredAt = event.occurredAt || event.occurred_at || new Date().toISOString();
  const context = event.context ? { location: event.context.location, user_agent: event.context.user_agent || event.context.userAgent } : { location: "unknown" };
  const args = [
    "audit-log",
    "create-event",
    orgId,
    "--action",
    event.action,
    "--actor-type",
    event.actor?.type || "user",
    "--actor-id",
    event.actor?.id || "unknown"
  ];
  if (event.actor?.name)
    args.push("--actor-name", event.actor.name);
  args.push("--occurred-at", new Date(occurredAt).toISOString(), "--targets", JSON.stringify(event.targets || []), "--context", JSON.stringify(context), "--metadata", JSON.stringify(event.metadata || {}), "--json", "--mode", "agent");
  runWorkos(args);
  return { ok: true, transport: "workos-cli", organizationId: orgId, action: event.action };
}

// ../audit-core/src/event-batcher.mjs
var DEFAULT_MAX_BATCH_SIZE = 20;
var DEFAULT_MAX_DELAY_MS = 200;
function createEventBatcher({
  config,
  maxBatchSize = DEFAULT_MAX_BATCH_SIZE,
  maxDelayMs = DEFAULT_MAX_DELAY_MS,
  onError,
  send = emitEvents
} = {}) {
  let buffer = [];
  let timer = null;
  let chain = Promise.resolve();
  const report = (detail) => {
    if (onError)
      onError(detail);
    else
      process.stderr.write(`workos-audit: ${detail}
`);
  };
  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }
  function sendNow() {
    clearTimer();
    if (buffer.length === 0)
      return chain;
    const batch = buffer;
    buffer = [];
    chain = chain.catch(() => {
      return;
    }).then(async () => {
      const result = await send(batch, config);
      if (result && result.ok === false && result.error) {
        report(`batch of ${batch.length} failed: ${result.error}`);
      }
    }).catch((error) => report(`batch of ${batch.length} threw: ${String(error?.message || error)}`));
    return chain;
  }
  return {
    add(event) {
      if (!event)
        return;
      buffer.push(event);
      if (buffer.length >= maxBatchSize) {
        sendNow();
        return;
      }
      if (timer === null) {
        timer = setTimeout(() => {
          timer = null;
          sendNow();
        }, maxDelayMs);
        timer.unref?.();
      }
    },
    async flush() {
      for (let pass = 0;pass < 10; pass++) {
        await sendNow();
        if (buffer.length === 0)
          return;
      }
      await sendNow();
    },
    get pending() {
      return buffer.length;
    }
  };
}

// ../audit-core/src/audit-query.mjs
import os2 from "node:os";
import path2 from "node:path";
import { writeFileSync } from "node:fs";
var DEFAULT_QUERY_RANGE_DAYS = 7;
var DEFAULT_QUERY_MAX_ROWS = 50;
var MAX_QUERY_MAX_ROWS = 200;
var EXPORT_POLL_INTERVAL_MS = 1500;
var EXPORT_POLL_TIMEOUT_MS = 60000;
function parseJsonValue(value) {
  if (!value)
    return;
  const trimmed = value.trim();
  if (!trimmed)
    return;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}
function parseCsv(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0;i < csv.length; i += 1) {
    const char = csv[i];
    if (inQuotes) {
      if (char === '"') {
        if (csv[i + 1] === '"') {
          field += '"';
          i += 1;
        } else
          inQuotes = false;
      } else
        field += char;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === `
`) {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (char !== "\r")
      field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((entry) => entry.length > 0 && !(entry.length === 1 && entry[0] === ""));
}
function parseAuditLogRows(csv) {
  const parsed = parseCsv(csv);
  const [headerRow, ...dataRows] = parsed;
  if (!headerRow?.length)
    return [];
  const targetIndices = [...new Set(headerRow.flatMap((header) => {
    const match = header.match(/^target_(?:id|type|name|metadata)_(\d+)$/);
    return match ? [Number(match[1])] : [];
  }))].sort((a, b) => a - b);
  return dataRows.map((dataRow) => {
    const raw = Object.fromEntries(headerRow.map((header, index) => [header, dataRow[index] || ""]));
    const targets = targetIndices.map((index) => ({
      id: raw[`target_id_${index}`] || undefined,
      type: raw[`target_type_${index}`] || undefined,
      name: raw[`target_name_${index}`] || undefined,
      metadata: parseJsonValue(raw[`target_metadata_${index}`])
    })).filter((target2) => target2.id || target2.type || target2.name || target2.metadata !== undefined);
    return {
      action: raw.action || "",
      occurredAt: raw.occurred_at || undefined,
      actor: {
        id: raw.actor_id || undefined,
        type: raw.actor_type || undefined,
        name: raw.actor_name || undefined,
        metadata: parseJsonValue(raw.actor_metadata)
      },
      context: {
        location: raw.context_location || undefined,
        userAgent: raw.context_user_agent || undefined
      },
      metadata: parseJsonValue(raw.metadata),
      targets,
      raw
    };
  });
}
function truncate(value, maxLength = 280) {
  if (value === undefined || value === null)
    return;
  const raw = typeof value === "string" ? value : stableSerialize(value);
  if (raw.length <= maxLength)
    return raw;
  return `${raw.slice(0, maxLength - 3)}...`;
}
function summarizeCounts(values) {
  if (values.length === 0)
    return "none";
  const counts = new Map;
  for (const value of values)
    counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).map(([value, count]) => `${value}=${count}`).join(", ");
}
function formatAuditLogRow(row, index) {
  const targets = row.targets.length > 0 ? row.targets.map((target2) => `${target2.type || "unknown"}:${target2.id || target2.name || "unknown"}`).join(", ") : "none";
  const metadata = truncate(row.metadata);
  return [
    `${index + 1}. ${row.occurredAt || "unknown time"} | action=${row.action}`,
    `   actor=${row.actor.type || "unknown"}:${row.actor.id || row.actor.name || "unknown"}`,
    `   targets=${targets}`,
    metadata ? `   metadata=${metadata}` : undefined
  ].filter(Boolean).join(`
`);
}
function isNoEventsError(error) {
  const message2 = (error?.message || "").toLowerCase();
  return message2.includes("no audit log events found");
}
async function createExport(config, filters) {
  const workos = createSdk(config);
  if (workos) {
    let auditExport;
    try {
      auditExport = await workos.auditLogs.createExport({
        organizationId: filters.organizationId,
        rangeStart: new Date(filters.rangeStart),
        rangeEnd: new Date(filters.rangeEnd),
        ...filters.actions?.length ? { actions: filters.actions } : {},
        ...filters.actorNames?.length ? { actorNames: filters.actorNames } : {},
        ...filters.actorIds?.length ? { actorIds: filters.actorIds } : {},
        ...filters.targets?.length ? { targets: filters.targets } : {}
      });
    } catch (error) {
      if (isNoEventsError(error))
        return { id: null, state: "empty", url: null };
      throw error;
    }
    const deadline = Date.now() + EXPORT_POLL_TIMEOUT_MS;
    while (auditExport.state === "pending") {
      if (Date.now() > deadline)
        throw new Error(`Timed out waiting for audit export ${auditExport.id}`);
      await new Promise((resolve) => setTimeout(resolve, EXPORT_POLL_INTERVAL_MS));
      auditExport = await workos.auditLogs.getExport(auditExport.id);
    }
    return auditExport;
  }
  const args = [
    "audit-log",
    "export",
    "--org",
    filters.organizationId,
    "--range-start",
    filters.rangeStart,
    "--range-end",
    filters.rangeEnd,
    "--json",
    "--mode",
    "agent"
  ];
  if (filters.actions?.length)
    args.push("--actions", filters.actions.join(","));
  if (filters.actorNames?.length)
    args.push("--actor-names", filters.actorNames.join(","));
  if (filters.actorIds?.length)
    args.push("--actor-ids", filters.actorIds.join(","));
  if (filters.targets?.length)
    args.push("--targets", filters.targets.join(","));
  return parseJson(runWorkos(args));
}
async function queryAuditLogs(config, params = {}) {
  const organizationId = await ensureOrganization(config);
  const rangeEnd = params.rangeEnd ? new Date(params.rangeEnd) : new Date;
  if (Number.isNaN(rangeEnd.getTime()))
    throw new Error(`Invalid rangeEnd: ${params.rangeEnd}`);
  const rangeStart = params.rangeStart ? new Date(params.rangeStart) : new Date(rangeEnd.getTime() - DEFAULT_QUERY_RANGE_DAYS * 24 * 60 * 60 * 1000);
  if (Number.isNaN(rangeStart.getTime()))
    throw new Error(`Invalid rangeStart: ${params.rangeStart}`);
  if (rangeStart.getTime() > rangeEnd.getTime())
    throw new Error("rangeStart must be before rangeEnd");
  const maxRows = Math.max(1, Math.min(MAX_QUERY_MAX_ROWS, params.maxRows || DEFAULT_QUERY_MAX_ROWS));
  const filters = {
    organizationId,
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    actions: params.actions || [],
    actorIds: params.actorIds || [],
    actorNames: params.actorNames || [],
    targets: params.targets || []
  };
  const auditExport = await createExport(config, filters);
  let csv = "";
  let csvPath = null;
  if (auditExport.state === "empty") {
    csvPath = path2.join(os2.tmpdir(), `workos-audit-export-empty-${Date.now()}.csv`);
    writeFileSync(csvPath, csv, "utf8");
  } else {
    if (auditExport.state !== "ready" || !auditExport.url) {
      throw new Error(`Audit export ${auditExport.id || "(unknown)"} finished in unexpected state: ${auditExport.state}`);
    }
    const response = await fetch(auditExport.url);
    if (!response.ok)
      throw new Error(`Failed to download audit export ${auditExport.id}: ${response.status} ${response.statusText}`);
    csv = await response.text();
    csvPath = path2.join(os2.tmpdir(), `workos-audit-export-${auditExport.id}.csv`);
    writeFileSync(csvPath, csv, "utf8");
  }
  const rows = parseAuditLogRows(csv).sort((a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || ""));
  const sampleRows = rows.slice(0, maxRows);
  const actionSummary = summarizeCounts(rows.map((row) => row.action).filter(Boolean));
  const actorSummary = summarizeCounts(rows.map((row) => row.actor.id || row.actor.name || "unknown"));
  const targetSummary = summarizeCounts(rows.flatMap((row) => row.targets.map((target2) => target2.type || "unknown")));
  const text = [
    `Question: ${params.question || "(not provided)"}`,
    `Range: ${rangeStart.toISOString()} → ${rangeEnd.toISOString()}`,
    `Export ID: ${auditExport.id || "(none - no matching events)"}`,
    `Rows: ${rows.length}`,
    `Action counts: ${actionSummary}`,
    `Actor counts: ${actorSummary}`,
    `Target type counts: ${targetSummary}`,
    `Full CSV saved to: ${csvPath}`,
    rows.length === 0 ? "No matching audit log rows found." : `Sample rows (newest first, up to ${maxRows}):`,
    ...sampleRows.map((row, index) => formatAuditLogRow(row, index))
  ].join(`

`);
  return {
    text,
    details: {
      question: params.question,
      exportId: auditExport.id,
      exportUrl: auditExport.url,
      csvPath,
      filters,
      rowCount: rows.length,
      sampledRowCount: sampleRows.length,
      counts: { actions: actionSummary, actors: actorSummary, targetTypes: targetSummary },
      rows: sampleRows
    }
  };
}

// ../audit-core/src/cli/schema.mjs
import os3 from "node:os";
import path3 from "node:path";
import { mkdtempSync, rmSync, writeFileSync as writeFileSync2 } from "node:fs";
async function createSchema(config, schema2) {
  if (!schema2?.action)
    throw new Error("Schema must include action.");
  const body = { actor: schema2.actor, targets: schema2.targets, metadata: schema2.metadata };
  const workos = createSdk(config);
  if (workos) {
    return await retry(() => workos.auditLogs.createSchema({ action: schema2.action, ...body }), `schema ${schema2.action}`);
  }
  const tmpDir = mkdtempSync(path3.join(os3.tmpdir(), "workos-audit-harness-"));
  const schemaPath = path3.join(tmpDir, "schema.json");
  try {
    writeFileSync2(schemaPath, JSON.stringify(body, null, 2), "utf8");
    return await retry(() => parseJson(runWorkos(["audit-log", "create-schema", schema2.action, "--file", schemaPath, "--json", "--mode", "agent"])), `schema ${schema2.action}`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ../audit-core/src/harness-audit-schemas.mjs
var TOKEN_METADATA = {
  turn_input_tokens: "number",
  turn_output_tokens: "number",
  turn_cache_creation_input_tokens: "number",
  turn_cache_read_input_tokens: "number",
  turn_total_tokens: "number",
  turn_model_calls: "number",
  session_input_tokens: "number",
  session_output_tokens: "number",
  session_cache_creation_input_tokens: "number",
  session_cache_read_input_tokens: "number",
  session_total_tokens: "number",
  session_model_calls: "number"
};
var COMMON_METADATA = {
  harness: "string",
  harness_version: "string",
  agent: "string",
  source: "string",
  cwd: "string",
  transcript_path: "string",
  permission_mode: "string",
  model: "string",
  turn_id: "string",
  reason: "string",
  error_type: "string",
  session_file: "string",
  previous_session_file: "string",
  target_session_file: "string",
  message_role: "string",
  role: "string",
  message_length: "number",
  message_sha256: "string",
  message_preview: "string",
  text_length: "number",
  text_sha256: "string",
  text_preview: "string",
  text_truncated: "boolean",
  content_length: "number",
  content_sha256: "string",
  has_images: "boolean",
  image_count: "number",
  tool_call_count: "number",
  custom_type: "string",
  system_prompt_sha256: "string",
  turn_count: "number",
  assistant_message_count: "number",
  tool_result_count: "number",
  status: "string"
};
var PROMPT_METADATA = {
  prompt_length: "number",
  prompt_sha256: "string",
  prompt_preview: "string"
};
var TOOL_METADATA = {
  tool_name: "string",
  tool_use_id: "string",
  tool_call_id: "string",
  tool_input_sha256: "string",
  tool_input_bytes: "number",
  input_sha256: "string",
  input_bytes: "number",
  command_preview: "string",
  command_truncated: "boolean",
  blocked: "boolean",
  duration_ms: "number",
  is_error: "boolean",
  result_sha256: "string",
  result_bytes: "number",
  error_preview: "string",
  error_sha256: "string"
};
var TURN_METADATA = {
  last_assistant_message_length: "number",
  last_assistant_message_sha256: "string",
  stop_hook_active: "boolean",
  input_tokens: "number",
  output_tokens: "number",
  total_tokens: "number",
  ...TOKEN_METADATA
};
var SESSION_TARGET = { type: "session" };
var MESSAGE_TARGET = { type: "message", metadata: { role: "string" } };
var TOOL_TARGET = { type: "tool", metadata: { tool_name: "string" } };
var MODEL_TARGET = { type: "model", metadata: { model: "string", provider: "string", model_id: "string" } };
var COMMAND_TARGET = { type: "command" };
function getHarnessAuditSchemaDefinitions(prefix = "harness") {
  return [
    {
      action: `${prefix}.session.started`,
      note: "Generic coding-agent session start/resume event.",
      targets: [SESSION_TARGET],
      metadata: { ...COMMON_METADATA }
    },
    {
      action: `${prefix}.session.ended`,
      note: "Generic coding-agent session end event.",
      targets: [SESSION_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA }
    },
    {
      action: `${prefix}.session.shutdown`,
      note: "Generic coding-agent session shutdown event.",
      targets: [SESSION_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA }
    },
    {
      action: `${prefix}.input.received`,
      note: "Generic user/input event accepted by a harness.",
      targets: [SESSION_TARGET, MESSAGE_TARGET],
      metadata: { ...COMMON_METADATA, ...PROMPT_METADATA }
    },
    {
      action: `${prefix}.agent.started`,
      note: "Generic agent/model turn start event.",
      targets: [SESSION_TARGET, MODEL_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA }
    },
    {
      action: `${prefix}.agent.completed`,
      note: "Generic agent/model turn completion event.",
      targets: [SESSION_TARGET, MODEL_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA }
    },
    {
      action: `${prefix}.prompt.submitted`,
      note: "Generic user prompt submission event.",
      targets: [SESSION_TARGET, MESSAGE_TARGET],
      metadata: { ...COMMON_METADATA, ...PROMPT_METADATA }
    },
    {
      action: `${prefix}.message.sent`,
      note: "Generic message lifecycle event.",
      targets: [SESSION_TARGET, MESSAGE_TARGET],
      metadata: { ...COMMON_METADATA }
    },
    {
      action: `${prefix}.message.finalized`,
      note: "Generic message finalized event.",
      targets: [SESSION_TARGET, MESSAGE_TARGET],
      metadata: { ...COMMON_METADATA }
    },
    {
      action: `${prefix}.tool.called`,
      note: "Generic tool-call start event.",
      targets: [SESSION_TARGET, TOOL_TARGET],
      metadata: { ...COMMON_METADATA, ...TOOL_METADATA }
    },
    {
      action: `${prefix}.permission.requested`,
      note: "Generic permission/escalation request event.",
      targets: [SESSION_TARGET, TOOL_TARGET],
      metadata: { ...COMMON_METADATA, ...TOOL_METADATA }
    },
    {
      action: `${prefix}.tool.completed`,
      note: "Generic successful tool-call result event.",
      targets: [SESSION_TARGET, TOOL_TARGET],
      metadata: { ...COMMON_METADATA, ...TOOL_METADATA }
    },
    {
      action: `${prefix}.tool.failed`,
      note: "Generic failed/error tool-call result event.",
      targets: [SESSION_TARGET, TOOL_TARGET],
      metadata: { ...COMMON_METADATA, ...TOOL_METADATA }
    },
    {
      action: `${prefix}.turn.completed`,
      note: "Generic assistant response turn completion event.",
      targets: [SESSION_TARGET, MODEL_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA }
    },
    {
      action: `${prefix}.turn.failed`,
      note: "Generic assistant response turn failure event.",
      targets: [SESSION_TARGET, MODEL_TARGET],
      metadata: { ...COMMON_METADATA, ...TURN_METADATA }
    },
    {
      action: `${prefix}.user_bash.executed`,
      note: "Generic user-initiated shell command event.",
      targets: [SESSION_TARGET, COMMAND_TARGET],
      metadata: {
        ...COMMON_METADATA,
        exclude_from_context: "boolean",
        command_sha256: "string",
        command_length: "number",
        command_preview: "string",
        command_truncated: "boolean",
        exit_code: "number",
        duration_ms: "number"
      }
    },
    {
      action: `${prefix}.model.selected`,
      note: "Generic model selection/change event.",
      targets: [SESSION_TARGET, MODEL_TARGET],
      metadata: {
        ...COMMON_METADATA,
        provider: "string",
        model_id: "string",
        previous_provider: "string",
        previous_model: "string",
        previous_model_id: "string",
        thinking_level: "string"
      }
    }
  ];
}

// ../audit-core/src/config.mjs
import path4 from "node:path";
import { chmodSync, existsSync as existsSync2, mkdirSync, readFileSync as readFileSync2, rmSync as rmSync2, writeFileSync as writeFileSync3 } from "node:fs";
var CONFIG_KEYS = [
  "apiKey",
  "organizationId",
  "actionPrefix",
  "actorId",
  "actorType",
  "actorName",
  "location",
  "userAgent",
  "proxyUrl"
];
var BOOLEAN_CONFIG_KEYS = new Set(["recordingEnabled"]);
function getManagedConfigPath() {
  const override = trimToUndefined(process.env.WORKOS_AUDIT_MANAGED_CONFIG_PATH);
  if (override)
    return override;
  if (process.platform === "win32") {
    return path4.join(process.env.PROGRAMDATA || "C:\\ProgramData", "workos-audit", "config.json");
  }
  if (process.platform === "darwin") {
    return "/Library/Application Support/workos-audit/config.json";
  }
  return "/etc/workos-audit/config.json";
}
function sanitizeRawConfig(raw) {
  if (!raw || typeof raw !== "object")
    return {};
  const config = {};
  for (const key of CONFIG_KEYS) {
    if (key === "proxyUrl" && Object.hasOwn(raw, key) && raw[key] === null) {
      config[key] = null;
      continue;
    }
    const value = trimToUndefined(raw[key]);
    if (value)
      config[key] = value;
  }
  for (const key of BOOLEAN_CONFIG_KEYS) {
    if (raw[key] !== undefined) {
      const parsed = parseBoolean(raw[key]);
      if (parsed !== undefined)
        config[key] = parsed;
    }
  }
  return config;
}
function readManagedConfig() {
  const filePath = getManagedConfigPath();
  if (!existsSync2(filePath))
    return {};
  try {
    return sanitizeRawConfig(JSON.parse(readFileSync2(filePath, "utf8")));
  } catch {
    return {};
  }
}
function parseBoolean(value) {
  if (typeof value === "boolean")
    return value;
  if (typeof value !== "string")
    return;
  const normalized = value.trim().toLowerCase();
  if (!normalized)
    return;
  if (["1", "true", "yes", "on", "enabled"].includes(normalized))
    return true;
  if (["0", "false", "no", "off", "disabled"].includes(normalized))
    return false;
  return;
}

// index.ts
var CONFIG_KEYS2 = ["apiKey", "organizationId", "actorId", "actorType", "actorName", "location", "userAgent", "proxyUrl"];
var EXTENSION_STATUS_KEY = "workos-audit";
var USER_AGENT3 = "pi-workos-audit-logs/1";
var DEFAULT_QUERY_RANGE_DAYS2 = 7;
var DEFAULT_QUERY_MAX_ROWS2 = 50;
var MAX_QUERY_MAX_ROWS2 = 200;
var EXPORT_POLL_INTERVAL_MS2 = 1500;
var EXPORT_POLL_TIMEOUT_MS2 = 60000;
var detectedActorCache;
function getConfigFilePath() {
  return process.env.PI_WORKOS_AUDIT_LOGS_CONFIG_PATH || path5.join(os4.homedir(), ".pi", "agent", "extensions", "workos-audit-logs", "config.json");
}
function sanitizeStoredConfig(raw) {
  if (!raw || typeof raw !== "object")
    return {};
  const config = {};
  for (const key of CONFIG_KEYS2) {
    const value = raw[key];
    if (key === "proxyUrl" && value === null) {
      config.proxyUrl = null;
      continue;
    }
    if (typeof value === "string" && value.trim())
      config[key] = value;
  }
  const enabled = parseBooleanValue(raw.enabled);
  if (enabled !== undefined)
    config.enabled = enabled;
  return config;
}
function readStoredConfig() {
  const filePath = getConfigFilePath();
  if (!existsSync3(filePath))
    return {};
  try {
    return sanitizeStoredConfig(JSON.parse(readFileSync3(filePath, "utf8")));
  } catch {
    return {};
  }
}
function writeStoredConfig(config) {
  const filePath = getConfigFilePath();
  mkdirSync2(path5.dirname(filePath), { recursive: true, mode: 448 });
  writeFileSync4(filePath, `${JSON.stringify(config, null, 2)}
`, { mode: 384 });
  chmodSync2(filePath, 384);
}
function clearStoredConfig() {
  rmSync3(getConfigFilePath(), { force: true });
}
function maskSecret(value) {
  if (!value)
    return;
  if (value.length <= 8)
    return "********";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}
function parseConfigKey(value) {
  const normalized = value.trim();
  return CONFIG_KEYS2.find((key) => key === normalized);
}
function summarizeStoredConfig(config, stored) {
  const detectedActor = getDetectedActor();
  return JSON.stringify({
    configPath: getConfigFilePath(),
    runtimeEnabled: config.enabled,
    loggingEnabled: config.loggingEnabled,
    configured: config.configured,
    apiKey: maskSecret(config.apiKey),
    organizationId: config.organizationId,
    actorId: config.actorId,
    actorType: config.actorType,
    actorName: config.actorName,
    location: config.location,
    userAgent: config.userAgent,
    sources: {
      loggingEnabled: process.env.PI_WORKOS_AUDIT_LOGS_ENABLED ? "env" : stored.enabled !== undefined ? "file" : "default",
      apiKey: process.env.PI_WORKOS_AUDIT_LOGS_API_KEY || process.env.WORKOS_API_KEY ? "env" : stored.apiKey ? "file" : undefined,
      organizationId: process.env.PI_WORKOS_AUDIT_LOGS_ORGANIZATION_ID ? "env" : stored.organizationId ? "file" : undefined,
      actorId: process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_ID ? "env" : stored.actorId ? "file" : detectedActor.actorId ? "machine" : "default",
      actorType: process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_TYPE ? "env" : stored.actorType ? "file" : "machine",
      actorName: process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_NAME ? "env" : stored.actorName ? "file" : detectedActor.actorName ? "machine" : undefined,
      location: process.env.PI_WORKOS_AUDIT_LOGS_LOCATION ? "env" : stored.location ? "file" : "default",
      userAgent: process.env.PI_WORKOS_AUDIT_LOGS_USER_AGENT ? "env" : stored.userAgent ? "file" : "default"
    }
  }, null, 2);
}
function stableSerialize2(value) {
  if (value === null || value === undefined)
    return "null";
  if (typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean")
    return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map(stableSerialize2).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize2(nested)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(String(value));
}
function sha256(value) {
  return createHash("sha256").update(stableSerialize2(value)).digest("hex");
}
function byteLength(value) {
  return Buffer.byteLength(stableSerialize2(value), "utf8");
}
function truncateMetadataString(value, maxLength = 500) {
  if (value.length <= maxLength)
    return value;
  if (maxLength <= 3)
    return value.slice(0, maxLength);
  return `${value.slice(0, maxLength - 3)}...`;
}
function compactMetadata(metadata) {
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined));
}
function trimToUndefined2(value) {
  if (typeof value !== "string")
    return;
  const trimmed = value.trim();
  return trimmed || undefined;
}
function parseBooleanValue(value) {
  if (typeof value === "boolean")
    return value;
  if (typeof value !== "string")
    return;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized))
    return true;
  if (["0", "false", "no", "off"].includes(normalized))
    return false;
  return;
}
function getOsUsername() {
  try {
    return trimToUndefined2(process.env.USER || process.env.USERNAME || os4.userInfo().username);
  } catch {
    return trimToUndefined2(process.env.USER || process.env.USERNAME);
  }
}
function runCommand(command, args) {
  try {
    return trimToUndefined2(execFileSync3(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }));
  } catch {
    return;
  }
}
function getGitConfigValue(key) {
  return runCommand("git", ["config", "--get", key]) || runCommand("git", ["config", "--global", "--get", key]);
}
function getMacFullName() {
  return process.platform === "darwin" ? runCommand("id", ["-F"]) : undefined;
}
function getDetectedActor() {
  if (detectedActorCache)
    return detectedActorCache;
  const username = getOsUsername();
  const actorType = process.env.CI ? "system" : "user";
  const actorId = trimToUndefined2(actorType === "user" ? getGitConfigValue("user.email") || process.env.EMAIL || username || os4.hostname() : process.env.GITHUB_ACTOR || process.env.BUILDKITE_BUILD_CREATOR || process.env.CI_ACTOR || username || os4.hostname());
  const actorName = trimToUndefined2(actorType === "user" ? getGitConfigValue("user.name") || process.env.GIT_AUTHOR_NAME || process.env.GIT_COMMITTER_NAME || process.env.NAME || process.env.FULLNAME || getMacFullName() || username : os4.hostname());
  detectedActorCache = {
    actorId,
    actorType,
    actorName
  };
  return detectedActorCache;
}
function getConfig() {
  const stored = readStoredConfig();
  const detectedActor = getDetectedActor();
  const apiKey = process.env.PI_WORKOS_AUDIT_LOGS_API_KEY || process.env.WORKOS_API_KEY || stored.apiKey;
  const organizationId = process.env.PI_WORKOS_AUDIT_LOGS_ORGANIZATION_ID || stored.organizationId;
  const loggingEnabled = parseBooleanValue(process.env.PI_WORKOS_AUDIT_LOGS_ENABLED) ?? stored.enabled ?? true;
  const actorId = process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_ID || stored.actorId || detectedActor.actorId || "unknown";
  const actorType = process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_TYPE || stored.actorType || detectedActor.actorType;
  const actorName = process.env.PI_WORKOS_AUDIT_LOGS_ACTOR_NAME || stored.actorName || detectedActor.actorName;
  const location = process.env.PI_WORKOS_AUDIT_LOGS_LOCATION || stored.location || "local";
  const userAgent = process.env.PI_WORKOS_AUDIT_LOGS_USER_AGENT || stored.userAgent || USER_AGENT3;
  const proxyUrl = trimToUndefined2(process.env.PI_WORKOS_AUDIT_LOGS_PROXY_URL) ?? trimToUndefined2(process.env.WORKOS_AUDIT_PROXY_URL) ?? (Object.hasOwn(stored, "proxyUrl") ? stored.proxyUrl : readManagedConfig().proxyUrl);
  const configured = true;
  return {
    enabled: configured && loggingEnabled,
    loggingEnabled,
    configured,
    apiKey,
    organizationId,
    actorId,
    actorType,
    actorName,
    location,
    userAgent,
    proxyUrl
  };
}
function statusLine(config) {
  if (!config.loggingEnabled)
    return "audit: off";
  if (config.proxyUrl && !getDeviceCertLabel())
    return "audit: not recording";
  return "audit: on";
}
function describeConfig(config) {
  if (!config.loggingEnabled)
    return "audit: off (disabled)";
  if (config.proxyUrl) {
    if (!getDeviceCertLabel()) {
      return `audit: NOT recording — proxy ${config.proxyUrl} configured but no device certificate found`;
    }
    return `audit: on via proxy (mTLS) ${config.proxyUrl}, identity from device certificate`;
  }
  const credentialSource = config.apiKey ? "api key" : "workos cli";
  const orgSource = config.organizationId ? config.organizationId : "auto org: Audit Log Harness";
  return `audit: on via ${credentialSource}, ${orgSource} (${config.actorType}:${config.actorId})`;
}
function createClient(config) {
  if (!config.apiKey)
    return;
  return new WorkOSNode(config.apiKey);
}
function auditCoreConfig(config) {
  return {
    apiKey: config.apiKey,
    organizationId: config.organizationId,
    organizationName: undefined,
    apiBaseUrl: undefined,
    proxyUrl: config.proxyUrl ?? undefined
  };
}
async function runAuditHarness(config, command, payload, extraArgs = []) {
  const ac = auditCoreConfig(config);
  switch (command) {
    case "emit-event":
      return await emitEvent(payload, ac);
    case "query":
      return await queryAuditLogs(ac, payload || {});
    case "ensure-organization": {
      const organizationId = await ensureOrganization(ac);
      return { organizationId, organizationName: payload?.organizationName };
    }
    case "create-schema":
      return await createSchema(ac, payload);
    case "seed-generic-schemas": {
      const prefix = payload && payload.prefix || "harness";
      const schemas = getHarnessAuditSchemaDefinitions(prefix);
      const created = [];
      for (const schema2 of schemas) {
        await createSchema(ac, schema2);
        created.push({ action: schema2.action });
      }
      return { prefix, schemaCount: created.length, created };
    }
    default:
      throw new Error(`Unknown audit-harness command: ${command}`);
  }
}
function getSessionTarget(ctx) {
  return {
    id: ctx.sessionManager.getSessionId(),
    type: "session"
  };
}
function getMessageRole(message2) {
  const role = message2.role;
  if (role === "toolResult")
    return "tool";
  return role || "unknown";
}
function getMessageContent(message2) {
  return message2.content;
}
function asContentArray(content) {
  if (!Array.isArray(content))
    return [];
  return content;
}
function getTextSummary(content) {
  if (typeof content === "string")
    return content;
  if (Array.isArray(content)) {
    return content.map((item) => {
      if (typeof item === "string")
        return item;
      if (item && typeof item === "object") {
        const block = item;
        if (block.type === "text" && typeof block.text === "string")
          return block.text;
        if (block.type === "image")
          return "[image]";
      }
      return stableSerialize2(item);
    }).join(`
`);
  }
  return stableSerialize2(content);
}
function getImageCount(content) {
  return asContentArray(content).filter((item) => item?.type === "image").length;
}
function getToolCallCount(content) {
  return asContentArray(content).filter((item) => item?.type === "toolCall").length;
}
function hasImages(images) {
  return Boolean(images && images.length > 0);
}
function getCommandPreview(command) {
  if (typeof command !== "string" || !command.trim())
    return;
  return truncateMetadataString(command);
}
function isCommandTruncated(command, maxLength = 500) {
  if (typeof command !== "string" || !command.trim())
    return;
  return command.length > maxLength;
}
function getBashToolCommand(input) {
  if (!input || typeof input !== "object")
    return;
  const command = input.command;
  return typeof command === "string" ? command : undefined;
}
function parseJsonValue2(value) {
  if (!value)
    return;
  const trimmed = value.trim();
  if (!trimmed)
    return;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}
function getPiAuditSchemaDefinitions(prefix = "pi") {
  return [
    {
      action: `${prefix}.session.started`,
      note: "Pi session start events.",
      targets: [{ type: "session" }],
      metadata: {
        reason: "string",
        cwd: "string",
        session_file: "string",
        previous_session_file: "string"
      }
    },
    {
      action: `${prefix}.session.shutdown`,
      note: "Pi session shutdown events.",
      targets: [{ type: "session" }],
      metadata: {
        reason: "string",
        target_session_file: "string"
      }
    },
    {
      action: `${prefix}.input.received`,
      note: "User input received by pi.",
      targets: [{ type: "session" }],
      metadata: {
        source: "string",
        text_length: "number",
        text_sha256: "string",
        text_preview: "string",
        text_truncated: "boolean",
        has_images: "boolean",
        image_count: "number"
      }
    },
    {
      action: `${prefix}.agent.started`,
      note: "Pi agent invocation started.",
      targets: [{ type: "session" }],
      metadata: {
        prompt_length: "number",
        prompt_sha256: "string",
        system_prompt_sha256: "string",
        has_images: "boolean"
      }
    },
    {
      action: `${prefix}.agent.completed`,
      note: "Pi agent invocation completed.",
      targets: [{ type: "session" }],
      metadata: {
        duration_ms: "number",
        turn_count: "number",
        assistant_message_count: "number",
        tool_result_count: "number",
        status: "string"
      }
    },
    {
      action: `${prefix}.message.finalized`,
      note: "Pi finalized a message in the transcript.",
      targets: [
        { type: "session" },
        { type: "message", metadata: { role: "string" } }
      ],
      metadata: {
        role: "string",
        content_length: "number",
        content_sha256: "string",
        has_images: "boolean",
        image_count: "number",
        tool_call_count: "number",
        custom_type: "string"
      }
    },
    {
      action: `${prefix}.tool.called`,
      note: "Pi tool call started.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        tool_call_id: "string",
        input_sha256: "string",
        input_bytes: "number",
        command_preview: "string",
        command_truncated: "boolean",
        blocked: "boolean"
      }
    },
    {
      action: `${prefix}.tool.completed`,
      note: "Pi tool call completed.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        tool_call_id: "string",
        is_error: "boolean",
        duration_ms: "number",
        result_sha256: "string",
        result_bytes: "number"
      }
    },
    {
      action: `${prefix}.user_bash.executed`,
      note: "User-triggered bash command execution from pi.",
      targets: [
        { type: "session" },
        { type: "command" }
      ],
      metadata: {
        exclude_from_context: "boolean",
        cwd: "string",
        command_sha256: "string",
        command_length: "number",
        command_preview: "string",
        command_truncated: "boolean"
      }
    },
    {
      action: `${prefix}.model.selected`,
      note: "Pi model selection changed.",
      targets: [
        { type: "session" },
        { type: "model", metadata: { provider: "string", model_id: "string" } }
      ],
      metadata: {
        source: "string",
        provider: "string",
        model_id: "string",
        previous_provider: "string",
        previous_model_id: "string",
        thinking_level: "string"
      }
    }
  ];
}
function parseCsv2(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0;i < csv.length; i += 1) {
    const char = csv[i];
    if (inQuotes) {
      if (char === '"') {
        if (csv[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === `
`) {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (char !== "\r")
      field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((entry) => entry.length > 0 && !(entry.length === 1 && entry[0] === ""));
}
function parseAuditLogRows2(csv) {
  const parsed = parseCsv2(csv);
  const [headerRow, ...dataRows] = parsed;
  if (!headerRow || headerRow.length === 0)
    return [];
  const targetIndices = [...new Set(headerRow.flatMap((header) => {
    const match = header.match(/^target_(?:id|type|name|metadata)_(\d+)$/);
    return match ? [Number(match[1])] : [];
  }))].sort((a, b) => a - b);
  return dataRows.map((dataRow) => {
    const raw = Object.fromEntries(headerRow.map((header, index) => [header, dataRow[index] || ""]));
    const targets = targetIndices.map((index) => ({
      id: raw[`target_id_${index}`] || undefined,
      type: raw[`target_type_${index}`] || undefined,
      name: raw[`target_name_${index}`] || undefined,
      metadata: parseJsonValue2(raw[`target_metadata_${index}`])
    })).filter((target2) => target2.id || target2.type || target2.name || target2.metadata !== undefined);
    return {
      action: raw.action || "",
      occurredAt: raw.occurred_at || undefined,
      actor: {
        id: raw.actor_id || undefined,
        type: raw.actor_type || undefined,
        name: raw.actor_name || undefined,
        metadata: parseJsonValue2(raw.actor_metadata)
      },
      context: {
        location: raw.context_location || undefined,
        userAgent: raw.context_user_agent || undefined
      },
      metadata: parseJsonValue2(raw.metadata),
      targets,
      raw
    };
  });
}
function formatUnknown(value, maxLength = 280) {
  if (value === undefined || value === null)
    return;
  const raw = typeof value === "string" ? value : stableSerialize2(value);
  return truncateMetadataString(raw, maxLength);
}
function summarizeCounts2(values) {
  if (values.length === 0)
    return "none";
  const counts = new Map;
  for (const value of values)
    counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value, count]) => `${value}=${count}`).join(", ");
}
function formatAuditLogRow2(row, index) {
  const targetSummary = row.targets.length > 0 ? row.targets.map((target2) => `${target2.type || "unknown"}:${target2.id || target2.name || "unknown"}`).join(", ") : "none";
  const metadataSummary = formatUnknown(row.metadata);
  return [
    `${index + 1}. ${row.occurredAt || "unknown time"} | action=${row.action}`,
    `   actor=${row.actor.type || "unknown"}:${row.actor.id || row.actor.name || "unknown"}`,
    `   targets=${targetSummary}`,
    metadataSummary ? `   metadata=${metadataSummary}` : undefined
  ].filter(Boolean).join(`
`);
}
async function sleep(ms, signal) {
  if (!signal) {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return;
  }
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", onAbort);
      reject(new Error("Aborted"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
function workosAuditLogsExtension(pi) {
  let config = getConfig();
  let client = createClient(config);
  let warned = false;
  let queue = Promise.resolve();
  let agentStartedAt = null;
  let turnCount = 0;
  let toolStartedAt = new Map;
  function refreshStatus(ctx) {
    config = getConfig();
    client = createClient(config);
    if (ctx?.hasUI)
      ctx.ui.setStatus(EXTENSION_STATUS_KEY, statusLine(config));
  }
  const batcher = createEventBatcher({
    send: (events) => emitEvents(events, auditCoreConfig(config)),
    onError: (detail) => {
      if (!warned) {
        warned = true;
        console.warn("[workos-audit-logs]", detail);
      }
    }
  });
  function enqueue(task) {
    queue = queue.catch(() => {
      return;
    }).then(task).catch((error) => {
      if (!warned) {
        warned = true;
        console.warn("[workos-audit-logs]", error);
      }
    });
    return queue;
  }
  async function emitEvent2(action2, ctx, metadata, targets, occurredAt) {
    refreshStatus(ctx);
    if (!config.enabled)
      return;
    const event = {
      action: action2,
      occurredAt: occurredAt || new Date,
      actor: {
        id: config.actorId,
        type: config.actorType,
        ...config.actorName ? { name: config.actorName } : {},
        metadata: {}
      },
      targets,
      context: {
        location: config.location,
        userAgent: config.userAgent
      },
      metadata
    };
    batcher.add(event);
  }
  pi.registerCommand("workos-audit-status", {
    description: "Show WorkOS audit log extension configuration status",
    handler: async (_args, ctx) => {
      refreshStatus(ctx);
      const summary = describeConfig(config);
      if (ctx.hasUI)
        ctx.ui.notify(summary, config.enabled ? "info" : "warning");
      else
        console.log(summary);
    }
  });
  pi.registerCommand("workos-audit-disable", {
    description: "Disable WorkOS audit event emission without clearing the saved config",
    handler: async (_args, ctx) => {
      const stored = readStoredConfig();
      stored.enabled = false;
      writeStoredConfig(stored);
      refreshStatus(ctx);
      const message2 = "WorkOS audit event emission disabled. Run /workos-audit-enable to turn it back on.";
      if (ctx.hasUI)
        ctx.ui.notify(message2, "info");
      console.log(message2);
    }
  });
  pi.registerCommand("workos-audit-enable", {
    description: "Enable WorkOS audit event emission using the saved config",
    handler: async (_args, ctx) => {
      const stored = readStoredConfig();
      stored.enabled = true;
      writeStoredConfig(stored);
      refreshStatus(ctx);
      const message2 = config.configured ? "WorkOS audit event emission enabled." : "WorkOS audit event emission enabled. Run workos auth login (or set apiKey) for credentials; organization defaults to auto-created Audit Log Harness.";
      if (ctx.hasUI)
        ctx.ui.notify(message2, config.configured ? "info" : "warning");
      console.log(message2);
    }
  });
  pi.registerCommand("workos-audit-login", {
    description: "Authenticate the WorkOS CLI with browser login for staging Audit Logs API access",
    handler: async (_args, ctx) => {
      const message2 = "Starting WorkOS browser auth. If the browser does not open, follow the URL/code printed in the terminal.";
      if (ctx.hasUI)
        ctx.ui.notify(message2, "info");
      console.log(message2);
      const [workosBin, ...workosArgs] = getWorkosCommandPrefix();
      execFileSync3(workosBin, [...workosArgs, "auth", "login"], { stdio: "inherit" });
      refreshStatus(ctx);
    }
  });
  pi.registerCommand("workos-audit-ensure-organization", {
    description: "Find or create the default WorkOS Audit Log Harness organization and print its organization ID",
    handler: async (_args, ctx) => {
      refreshStatus(ctx);
      const result = await runAuditHarness(config, "ensure-organization", {});
      const message2 = `WorkOS audit organization: ${result.organizationName || "Audit Log Harness"} (${result.organizationId})`;
      if (ctx.hasUI)
        ctx.ui.notify(message2, "info");
      console.log(message2);
    }
  });
  pi.registerCommand("workos-audit-config", {
    description: "Configure WorkOS audit logging (/workos-audit-config show|path|edit|set|unset|clear)",
    handler: async (args, ctx) => {
      const [subcommand = "show", ...rest3] = args.trim() ? args.trim().split(/\s+/) : [];
      if (subcommand === "path") {
        const filePath = getConfigFilePath();
        const message3 = `WorkOS audit config path: ${filePath}`;
        if (ctx.hasUI)
          ctx.ui.notify(message3, "info");
        console.log(message3);
        return;
      }
      if (subcommand === "show" || !subcommand) {
        refreshStatus(ctx);
        const summary = summarizeStoredConfig(config, readStoredConfig());
        if (ctx.hasUI)
          ctx.ui.notify(describeConfig(config), config.enabled ? "info" : "warning");
        console.log(summary);
        return;
      }
      if (subcommand === "clear") {
        if (ctx.hasUI) {
          const ok = await ctx.ui.confirm("Clear WorkOS audit config", `Delete ${getConfigFilePath()}?`);
          if (!ok)
            return;
        }
        clearStoredConfig();
        refreshStatus(ctx);
        const message3 = "WorkOS audit config cleared";
        if (ctx.hasUI)
          ctx.ui.notify(message3, "info");
        console.log(message3);
        return;
      }
      if (subcommand === "unset") {
        const key = parseConfigKey(rest3[0] || "");
        if (!key) {
          const message4 = `Unknown key. Use one of: ${CONFIG_KEYS2.join(", ")}`;
          if (ctx.hasUI)
            ctx.ui.notify(message4, "warning");
          console.log(message4);
          return;
        }
        const stored = readStoredConfig();
        delete stored[key];
        writeStoredConfig(stored);
        refreshStatus(ctx);
        const message3 = `Unset ${key} in ${getConfigFilePath()}`;
        if (ctx.hasUI)
          ctx.ui.notify(message3, "info");
        console.log(message3);
        return;
      }
      if (subcommand === "set") {
        const key = parseConfigKey(rest3[0] || "");
        const value = rest3.slice(1).join(" ").trim();
        if (!key) {
          const message4 = `Unknown key. Use one of: ${CONFIG_KEYS2.join(", ")}`;
          if (ctx.hasUI)
            ctx.ui.notify(message4, "warning");
          console.log(message4);
          return;
        }
        if (!value) {
          const message4 = `Usage: /workos-audit-config set ${key} <value>`;
          if (ctx.hasUI)
            ctx.ui.notify(message4, "warning");
          console.log(message4);
          return;
        }
        const stored = readStoredConfig();
        stored[key] = value;
        writeStoredConfig(stored);
        refreshStatus(ctx);
        const displayValue = key === "apiKey" ? maskSecret(value) : value;
        const message3 = `Set ${key}=${displayValue}`;
        if (ctx.hasUI)
          ctx.ui.notify(message3, "info");
        console.log(message3);
        return;
      }
      if (subcommand === "edit") {
        if (!ctx.hasUI) {
          const message3 = "Interactive edit requires UI. Use /workos-audit-config set <key> <value> instead.";
          console.log(message3);
          return;
        }
        const stored = readStoredConfig();
        const current = getConfig();
        const next = { ...stored };
        const apiKey = await ctx.ui.input("WorkOS API key", current.apiKey ? `${maskSecret(current.apiKey)} (leave blank to keep current)` : "optional; leave blank to use workos auth login");
        if (apiKey === undefined)
          return;
        if (apiKey.trim())
          next.apiKey = apiKey.trim();
        const organizationId = await ctx.ui.input("WorkOS organization ID", current.organizationId || "org_...");
        if (organizationId === undefined)
          return;
        if (organizationId.trim())
          next.organizationId = organizationId.trim();
        const actorId = await ctx.ui.input("Actor ID", current.actorId);
        if (actorId === undefined)
          return;
        if (actorId.trim())
          next.actorId = actorId.trim();
        const actorType = await ctx.ui.input("Actor type", current.actorType);
        if (actorType === undefined)
          return;
        if (actorType.trim())
          next.actorType = actorType.trim();
        const actorName = await ctx.ui.input("Actor name (optional)", current.actorName || "leave blank to keep current");
        if (actorName === undefined)
          return;
        if (actorName.trim())
          next.actorName = actorName.trim();
        const location = await ctx.ui.input("Location", current.location);
        if (location === undefined)
          return;
        if (location.trim())
          next.location = location.trim();
        const userAgent = await ctx.ui.input("User agent", current.userAgent);
        if (userAgent === undefined)
          return;
        if (userAgent.trim())
          next.userAgent = userAgent.trim();
        writeStoredConfig(next);
        refreshStatus(ctx);
        ctx.ui.notify(`Saved WorkOS audit config to ${getConfigFilePath()}`, "info");
        console.log(summarizeStoredConfig(getConfig(), next));
        return;
      }
      const message2 = "Usage: /workos-audit-config show|path|edit|set|unset|clear";
      if (ctx.hasUI)
        ctx.ui.notify(message2, "warning");
      console.log(message2);
    }
  });
  pi.registerCommand("workos-audit-seed-schemas", {
    description: "Create WorkOS audit schemas for pi events (/workos-audit-seed-schemas [--prefix=pi] [--dry-run])",
    handler: async (args, ctx) => {
      const tokens = args.trim() ? args.trim().split(/\s+/) : [];
      let prefix = "pi";
      let dryRun = false;
      const unknownArgs = [];
      for (const token of tokens) {
        if (token === "--dry-run") {
          dryRun = true;
          continue;
        }
        if (token.startsWith("--prefix=")) {
          const value = token.slice("--prefix=".length).trim();
          if (value)
            prefix = value;
          else
            unknownArgs.push(token);
          continue;
        }
        unknownArgs.push(token);
      }
      if (unknownArgs.length > 0) {
        const message3 = "Usage: /workos-audit-seed-schemas [--prefix=pi] [--dry-run]";
        if (ctx.hasUI)
          ctx.ui.notify(message3, "warning");
        console.log(message3);
        return;
      }
      refreshStatus(ctx);
      const schemas = getPiAuditSchemaDefinitions(prefix);
      if (dryRun) {
        const preview = JSON.stringify({ prefix, schemaCount: schemas.length, schemas }, null, 2);
        if (ctx.hasUI)
          ctx.ui.notify(`Prepared ${schemas.length} pi audit schemas for prefix "${prefix}"`, "info");
        console.log(preview);
        return;
      }
      if (ctx.hasUI) {
        const ok = await ctx.ui.confirm("Seed WorkOS pi audit schemas", `Create ${schemas.length} schema(s) with prefix "${prefix}"? Existing actions may get a new schema version.`);
        if (!ok)
          return;
      }
      const schemaClient = config.apiKey ? new WorkOSNode(config.apiKey) : undefined;
      const createdSchemas = [];
      for (const schema2 of schemas) {
        if (schemaClient) {
          const created = await schemaClient.auditLogs.createSchema({
            action: schema2.action,
            actor: schema2.actor,
            targets: schema2.targets,
            metadata: schema2.metadata
          });
          createdSchemas.push(`${schema2.action} -> schema v${created.version}`);
        } else {
          await runAuditHarness(config, "create-schema", schema2);
          createdSchemas.push(`${schema2.action} -> schema created via workos cli`);
        }
      }
      const message2 = `Created ${createdSchemas.length} pi audit schema(s) with prefix "${prefix}"`;
      if (ctx.hasUI)
        ctx.ui.notify(message2, "info");
      console.log([message2, ...createdSchemas].join(`
`));
    }
  });
  pi.registerCommand("workos-audit-seed-harness-schemas", {
    description: "Create generic WorkOS audit schemas for harness events (/workos-audit-seed-harness-schemas [--prefix=pi] [--dry-run])",
    handler: async (args, ctx) => {
      const tokens = args.trim() ? args.trim().split(/\s+/) : [];
      let prefix = "pi";
      let dryRun = false;
      for (const token of tokens) {
        if (token === "--dry-run")
          dryRun = true;
        else if (token.startsWith("--prefix="))
          prefix = token.slice("--prefix=".length) || prefix;
      }
      const result = dryRun ? { prefix, schemas: getHarnessAuditSchemaDefinitions(prefix), schemaCount: getHarnessAuditSchemaDefinitions(prefix).length, dryRun: true } : await runAuditHarness(config, "seed-generic-schemas", { prefix });
      const message2 = JSON.stringify(result, null, 2);
      if (ctx.hasUI)
        ctx.ui.notify(dryRun ? "Prepared generic harness schemas" : "Created generic harness schemas", "info");
      console.log(message2);
    }
  });
  pi.registerTool({
    name: "workos_audit_query",
    label: "WorkOS Audit Query",
    description: "Export filtered WorkOS audit logs, parse the CSV, and return summaries plus sample rows for answering questions about audit activity.",
    promptSnippet: "Query WorkOS audit logs by exporting filtered events and returning aggregate summaries plus sample rows.",
    promptGuidelines: [
      "Use workos_audit_query when the user asks questions about WorkOS audit logs or past pi audit activity.",
      "When using workos_audit_query, derive rangeStart and rangeEnd from the user's timeframe if specified; otherwise prefer the tool's bounded recent default window.",
      "When using workos_audit_query, pass action, actor, and target filters whenever the question clearly implies them to reduce export size and improve answer quality."
    ],
    parameters: exports_typebox.Object({
      question: exports_typebox.String({ description: "The user's audit-log question." }),
      rangeStart: exports_typebox.Optional(exports_typebox.String({ description: "ISO-8601 start time. If omitted, defaults to 7 days before rangeEnd." })),
      rangeEnd: exports_typebox.Optional(exports_typebox.String({ description: "ISO-8601 end time. If omitted, defaults to now." })),
      actions: exports_typebox.Optional(exports_typebox.Array(exports_typebox.String({ description: "Audit action filter, e.g. pi.tool.called" }))),
      actorIds: exports_typebox.Optional(exports_typebox.Array(exports_typebox.String({ description: "Actor ID filter." }))),
      actorNames: exports_typebox.Optional(exports_typebox.Array(exports_typebox.String({ description: "Actor name filter." }))),
      targets: exports_typebox.Optional(exports_typebox.Array(exports_typebox.String({ description: "Target type filter, e.g. session, tool, message, model" }))),
      maxRows: exports_typebox.Optional(exports_typebox.Integer({ description: "Maximum number of parsed rows to return in the sample output (1-200, default 50)." }))
    }),
    async execute(_toolCallId, params, signal, onUpdate) {
      refreshStatus();
      onUpdate?.({ content: [{ type: "text", text: `Creating WorkOS audit export via the Audit Log Harness for: ${params.question}` }] });
      const harnessResult = await runAuditHarness(config, "query", params);
      return {
        content: [{ type: "text", text: harnessResult.text || JSON.stringify(harnessResult, null, 2) }],
        details: harnessResult.details
      };
      const rangeEnd = params.rangeEnd ? new Date(params.rangeEnd) : new Date;
      if (Number.isNaN(rangeEnd.getTime()))
        throw new Error(`Invalid rangeEnd: ${params.rangeEnd}`);
      const rangeStart = params.rangeStart ? new Date(params.rangeStart) : new Date(rangeEnd.getTime() - DEFAULT_QUERY_RANGE_DAYS2 * 24 * 60 * 60 * 1000);
      if (Number.isNaN(rangeStart.getTime()))
        throw new Error(`Invalid rangeStart: ${params.rangeStart}`);
      if (rangeStart.getTime() > rangeEnd.getTime())
        throw new Error("rangeStart must be before rangeEnd");
      const maxRows = Math.max(1, Math.min(MAX_QUERY_MAX_ROWS2, params.maxRows || DEFAULT_QUERY_MAX_ROWS2));
      const filters = {
        organizationId: config.organizationId,
        rangeStart,
        rangeEnd,
        ...params.actions?.length ? { actions: params.actions } : {},
        ...params.actorIds?.length ? { actorIds: params.actorIds } : {},
        ...params.actorNames?.length ? { actorNames: params.actorNames } : {},
        ...params.targets?.length ? { targets: params.targets } : {}
      };
      onUpdate?.({
        content: [{ type: "text", text: `Creating WorkOS audit export for: ${params.question}` }],
        details: { filters: { ...filters, rangeStart: rangeStart.toISOString(), rangeEnd: rangeEnd.toISOString() } }
      });
      let auditExport = await client.auditLogs.createExport(filters);
      const pollDeadline = Date.now() + EXPORT_POLL_TIMEOUT_MS2;
      while (auditExport.state === "pending") {
        if (signal?.aborted)
          throw new Error("Aborted");
        if (Date.now() > pollDeadline)
          throw new Error(`Timed out waiting for audit export ${auditExport.id}`);
        onUpdate?.({
          content: [{ type: "text", text: `Waiting for WorkOS audit export ${auditExport.id}...` }],
          details: { exportId: auditExport.id, state: auditExport.state }
        });
        await sleep(EXPORT_POLL_INTERVAL_MS2, signal);
        auditExport = await client.auditLogs.getExport(auditExport.id);
      }
      if (auditExport.state !== "ready" || !auditExport.url) {
        throw new Error(`Audit export ${auditExport.id} finished in unexpected state: ${auditExport.state}`);
      }
      const response = await fetch(auditExport.url, { signal });
      if (!response.ok)
        throw new Error(`Failed to download audit export ${auditExport.id}: ${response.status} ${response.statusText}`);
      const csv = await response.text();
      const csvPath = path5.join(os4.tmpdir(), `workos-audit-export-${auditExport.id}.csv`);
      writeFileSync4(csvPath, csv, "utf8");
      const rows = parseAuditLogRows2(csv).sort((a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || ""));
      const sampleRows = rows.slice(0, maxRows);
      const actionSummary = summarizeCounts2(rows.map((row) => row.action).filter(Boolean));
      const actorSummary = summarizeCounts2(rows.map((row) => row.actor.id || row.actor.name || "unknown"));
      const targetSummary = summarizeCounts2(rows.flatMap((row) => row.targets.map((target2) => target2.type || "unknown")));
      const content = [
        `Question: ${params.question}`,
        `Range: ${rangeStart.toISOString()} → ${rangeEnd.toISOString()}`,
        `Export ID: ${auditExport.id}`,
        `Rows: ${rows.length}`,
        `Action counts: ${actionSummary}`,
        `Actor counts: ${actorSummary}`,
        `Target type counts: ${targetSummary}`,
        `Full CSV saved to: ${csvPath}`,
        rows.length === 0 ? "No matching audit log rows found." : `Sample rows (newest first, up to ${maxRows}):`,
        ...sampleRows.map((row, index) => formatAuditLogRow2(row, index))
      ].join(`

`);
      return {
        content: [{ type: "text", text: content }],
        details: {
          question: params.question,
          exportId: auditExport.id,
          exportUrl: auditExport.url,
          csvPath,
          filters: {
            ...filters,
            rangeStart: rangeStart.toISOString(),
            rangeEnd: rangeEnd.toISOString()
          },
          rowCount: rows.length,
          sampledRowCount: sampleRows.length,
          counts: {
            actions: actionSummary,
            actors: actorSummary,
            targetTypes: targetSummary
          },
          rows: sampleRows
        }
      };
    }
  });
  pi.on("session_start", async (event, ctx) => {
    refreshStatus(ctx);
    await enqueue(() => emitEvent2("pi.session.started", ctx, compactMetadata({
      reason: event.reason,
      cwd: ctx.cwd,
      session_file: ctx.sessionManager.getSessionFile(),
      previous_session_file: event.previousSessionFile
    }), [getSessionTarget(ctx)]));
  });
  pi.on("session_shutdown", async (event, ctx) => {
    refreshStatus(ctx);
    await enqueue(() => emitEvent2("pi.session.shutdown", ctx, compactMetadata({
      reason: event.reason,
      target_session_file: event.targetSessionFile
    }), [getSessionTarget(ctx)]));
    await batcher.flush();
  });
  pi.on("input", async (event, ctx) => {
    enqueue(() => emitEvent2("pi.input.received", ctx, compactMetadata({
      source: event.source,
      text_length: event.text.length,
      text_sha256: sha256(event.text),
      text_preview: truncateMetadataString(event.text),
      text_truncated: event.text.length > 500,
      has_images: hasImages(event.images),
      image_count: event.images?.length
    }), [getSessionTarget(ctx)]));
  });
  pi.on("before_agent_start", async (event, ctx) => {
    agentStartedAt = Date.now();
    turnCount = 0;
    enqueue(() => emitEvent2("pi.agent.started", ctx, compactMetadata({
      prompt_length: event.prompt.length,
      prompt_sha256: sha256(event.prompt),
      system_prompt_sha256: sha256(event.systemPrompt),
      has_images: hasImages(event.images)
    }), [getSessionTarget(ctx)]));
  });
  pi.on("turn_start", async () => {
    turnCount += 1;
  });
  pi.on("agent_end", async (event, ctx) => {
    const duration = agentStartedAt ? Date.now() - agentStartedAt : undefined;
    const messages = event.messages || [];
    const assistantCount = messages.filter((message2) => getMessageRole(message2) === "assistant").length;
    const toolResultCount = messages.filter((message2) => getMessageRole(message2) === "tool").length;
    const lastAssistant = [...messages].reverse().find((message2) => getMessageRole(message2) === "assistant");
    const status = lastAssistant?.stopReason === "aborted" ? "aborted" : lastAssistant?.stopReason === "error" ? "errored" : "completed";
    enqueue(() => emitEvent2("pi.agent.completed", ctx, compactMetadata({
      duration_ms: duration,
      turn_count: turnCount,
      assistant_message_count: assistantCount,
      tool_result_count: toolResultCount,
      status
    }), [getSessionTarget(ctx)]));
  });
  pi.on("message_end", async (event, ctx) => {
    const content = getMessageContent(event.message);
    const role = getMessageRole(event.message);
    const summary = getTextSummary(content);
    const messageId = `msg_${sha256({ role, content }).slice(0, 24)}`;
    enqueue(() => emitEvent2("pi.message.finalized", ctx, compactMetadata({
      role,
      content_length: summary.length,
      content_sha256: sha256(content),
      has_images: getImageCount(content) > 0,
      image_count: getImageCount(content),
      tool_call_count: getToolCallCount(content),
      custom_type: event.message.customType
    }), [
      getSessionTarget(ctx),
      {
        id: messageId,
        type: "message",
        metadata: compactMetadata({ role })
      }
    ]));
  });
  pi.on("tool_call", async (event, ctx) => {
    toolStartedAt.set(event.toolCallId, Date.now());
    enqueue(() => emitEvent2("pi.tool.called", ctx, compactMetadata({
      tool_name: event.toolName,
      tool_call_id: event.toolCallId,
      input_sha256: sha256(event.input),
      input_bytes: byteLength(event.input),
      command_preview: getCommandPreview(event.toolName === "bash" ? getBashToolCommand(event.input) : undefined),
      command_truncated: isCommandTruncated(event.toolName === "bash" ? getBashToolCommand(event.input) : undefined),
      blocked: false
    }), [
      getSessionTarget(ctx),
      {
        id: event.toolCallId,
        type: "tool",
        metadata: compactMetadata({ tool_name: event.toolName })
      }
    ]));
  });
  pi.on("tool_result", async (event, ctx) => {
    const startedAt = toolStartedAt.get(event.toolCallId);
    toolStartedAt.delete(event.toolCallId);
    enqueue(() => emitEvent2("pi.tool.completed", ctx, compactMetadata({
      tool_name: event.toolName,
      tool_call_id: event.toolCallId,
      is_error: event.isError,
      duration_ms: startedAt ? Date.now() - startedAt : undefined,
      result_sha256: sha256({ content: event.content, details: event.details, isError: event.isError }),
      result_bytes: byteLength({ content: event.content, details: event.details, isError: event.isError })
    }), [
      getSessionTarget(ctx),
      {
        id: event.toolCallId,
        type: "tool",
        metadata: compactMetadata({ tool_name: event.toolName })
      }
    ]));
  });
  pi.on("user_bash", async (event, ctx) => {
    const commandId = `cmd_${sha256({ command: event.command, cwd: event.cwd }).slice(0, 24)}`;
    enqueue(() => emitEvent2("pi.user_bash.executed", ctx, compactMetadata({
      exclude_from_context: event.excludeFromContext,
      cwd: event.cwd,
      command_sha256: sha256(event.command),
      command_length: event.command.length,
      command_preview: getCommandPreview(event.command),
      command_truncated: isCommandTruncated(event.command)
    }), [
      getSessionTarget(ctx),
      {
        id: commandId,
        type: "command"
      }
    ]));
  });
  pi.on("model_select", async (event, ctx) => {
    const modelTargetId = `${event.model.provider}/${event.model.id}`;
    enqueue(() => emitEvent2("pi.model.selected", ctx, compactMetadata({
      source: event.source,
      provider: event.model.provider,
      model_id: event.model.id,
      previous_provider: event.previousModel?.provider,
      previous_model_id: event.previousModel?.id,
      thinking_level: pi.getThinkingLevel()
    }), [
      getSessionTarget(ctx),
      {
        id: modelTargetId,
        type: "model",
        metadata: compactMetadata({
          provider: event.model.provider,
          model_id: event.model.id
        })
      }
    ]));
  });
}
export {
  workosAuditLogsExtension as default
};
