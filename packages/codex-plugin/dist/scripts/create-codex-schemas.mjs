// AUTO-GENERATED preflight: ensure the plugin's node_modules exists before
// importing externalized native deps (e.g. @napi-rs/keyring). The marketplace
// install copies files only; this is the cheapest place to bootstrap deps so
// hooks can run on a fresh install.
import { existsSync as __preflightExists } from 'node:fs';
import { execFileSync as __preflightExec } from 'node:child_process';
import { fileURLToPath as __preflightFileURL } from 'node:url';
import __preflightPath from 'node:path';
(function __ensurePluginDeps() {
  try {
    const here = __preflightPath.dirname(__preflightFileURL(import.meta.url));
    let pluginRoot = here;
    for (let i = 0; i < 4; i += 1) {
      if (__preflightExists(__preflightPath.join(pluginRoot, 'package.json'))) break;
      pluginRoot = __preflightPath.resolve(pluginRoot, '..');
    }
    if (!__preflightExists(__preflightPath.join(pluginRoot, 'package.json'))) return;
    if (__preflightExists(__preflightPath.join(pluginRoot, 'node_modules', '@napi-rs', 'keyring'))) return;
    __preflightExec('npm', ['install', '--no-audit', '--no-fund', '--silent'], {
      cwd: pluginRoot,
      stdio: 'ignore',
      timeout: 90_000,
    });
  } catch {
    // Best-effort: callers fall back to no-keyring mode if install fails.
  }
})();

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

// ../audit-core/src/util.mjs
function trimToUndefined(value) {
  if (typeof value !== "string")
    return;
  const trimmed = value.trim();
  return trimmed || undefined;
}

// ../audit-core/src/schema-cli.mjs
function parsePrefixArg(defaultPrefix) {
  const arg = process.argv.find((a) => a.startsWith("--prefix="));
  return arg ? arg.slice("--prefix=".length) : defaultPrefix;
}
function resolveApiKey(configLoader) {
  const fileConfig = configLoader?.readFileConfig?.() || {};
  return trimToUndefined(process.env.WORKOS_API_KEY) || fileConfig.apiKey;
}
async function runCreateSchemas({ getSchemas, defaultPrefix, configLoader }) {
  const apiKey = resolveApiKey(configLoader);
  const dryRun = process.argv.includes("--dry-run");
  const prefix = parsePrefixArg(defaultPrefix);
  const schemas = getSchemas(prefix);
  if (dryRun) {
    console.log(JSON.stringify({ prefix, schemas }, null, 2));
    return;
  }
  if (!apiKey) {
    console.error("Missing WORKOS_API_KEY and no apiKey found in the plugin config file");
    process.exit(1);
  }
  const workos = new WorkOSNode(apiKey);
  for (const schema of schemas) {
    const created = await workos.auditLogs.createSchema({
      action: schema.action,
      actor: schema.actor,
      targets: schema.targets,
      metadata: schema.metadata
    });
    console.log(`${schema.action} -> schema v${created.version}`);
  }
}

// ../audit-core/src/config.mjs
import os from "node:os";
import path from "node:path";
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
    return path.join(process.env.PROGRAMDATA || "C:\\ProgramData", "workos-audit", "config.json");
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
  if (!existsSync(filePath))
    return {};
  try {
    return sanitizeRawConfig(JSON.parse(readFileSync(filePath, "utf8")));
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
function createConfigLoader({
  configFilePathEnvs,
  defaultConfigDir,
  envKeyOrder,
  defaults: defaults2
}) {
  function getConfigFilePath() {
    for (const name of configFilePathEnvs) {
      const value = trimToUndefined(process.env[name]);
      if (value)
        return value;
    }
    return path.join(os.homedir(), defaultConfigDir, "workos-audit", "config.json");
  }
  function readFileConfig() {
    const filePath = getConfigFilePath();
    if (!existsSync(filePath))
      return {};
    try {
      return sanitizeRawConfig(JSON.parse(readFileSync(filePath, "utf8")));
    } catch {
      return {};
    }
  }
  function writeFileConfig(config) {
    const filePath = getConfigFilePath();
    const sanitized = {};
    for (const key of CONFIG_KEYS) {
      const value = trimToUndefined(config[key]);
      if (value)
        sanitized[key] = value;
    }
    for (const key of BOOLEAN_CONFIG_KEYS) {
      if (config[key] !== undefined) {
        const parsed = parseBoolean(config[key]);
        if (parsed !== undefined)
          sanitized[key] = parsed;
      }
    }
    mkdirSync(path.dirname(filePath), { recursive: true, mode: 448 });
    writeFileSync(filePath, `${JSON.stringify(sanitized, null, 2)}
`, { mode: 384 });
    chmodSync(filePath, 384);
    return filePath;
  }
  function clearFileConfig() {
    rmSync(getConfigFilePath(), { force: true });
  }
  function lookupEnv(key) {
    const candidates = envKeyOrder[key] || [];
    for (const name of candidates) {
      const value = trimToUndefined(process.env[name]);
      if (value)
        return { value, source: name };
    }
    return { value: undefined, source: null };
  }
  function resolveKey(key, fileConfig, managedConfig, fallback) {
    const fromEnv = lookupEnv(key);
    if (fromEnv.value)
      return { value: fromEnv.value, source: fromEnv.source };
    if (fileConfig[key] !== undefined)
      return { value: fileConfig[key], source: "config_file" };
    if (managedConfig[key] !== undefined)
      return { value: managedConfig[key], source: "managed_config" };
    if (fallback) {
      const fb = fallback();
      if (fb !== undefined)
        return { value: fb.value, source: fb.source || "default" };
    }
    return { value: undefined, source: null };
  }
  function resolveBooleanKey(key, fileConfig, managedConfig, defaultValue) {
    const fromEnv = lookupEnv(key);
    if (fromEnv.value !== undefined) {
      const parsed = parseBoolean(fromEnv.value);
      if (parsed !== undefined)
        return { value: parsed, source: fromEnv.source };
    }
    if (fileConfig[key] !== undefined) {
      return { value: fileConfig[key], source: "config_file" };
    }
    if (managedConfig[key] !== undefined) {
      return { value: managedConfig[key], source: "managed_config" };
    }
    return { value: defaultValue, source: "default" };
  }
  function loadConfig() {
    const fileConfig = readFileConfig();
    const managedConfig = readManagedConfig();
    const apiKey = resolveKey("apiKey", fileConfig, managedConfig);
    const organizationId = resolveKey("organizationId", fileConfig, managedConfig);
    const actionPrefix = resolveKey("actionPrefix", fileConfig, managedConfig, () => ({ value: defaults2.actionPrefix, source: "default" }));
    const actorType = resolveKey("actorType", fileConfig, managedConfig, () => ({ value: defaults2.actorType, source: "default" }));
    const actorId = resolveKey("actorId", fileConfig, managedConfig, () => {
      const user = trimToUndefined(process.env.USER) || trimToUndefined(process.env.USERNAME);
      if (user)
        return { value: user, source: "os_user" };
      return { value: os.hostname(), source: "hostname" };
    });
    const actorName = resolveKey("actorName", fileConfig, managedConfig, () => {
      const user = trimToUndefined(process.env.USER) || trimToUndefined(process.env.USERNAME);
      return user ? { value: user, source: "os_user" } : undefined;
    });
    const location = resolveKey("location", fileConfig, managedConfig, () => ({ value: defaults2.location, source: "default" }));
    const userAgent = resolveKey("userAgent", fileConfig, managedConfig, () => ({ value: defaults2.userAgent, source: "default" }));
    const proxyUrl = resolveKey("proxyUrl", fileConfig, managedConfig, () => defaults2.proxyUrl ? { value: defaults2.proxyUrl, source: "default" } : undefined);
    const recordingEnabled = resolveBooleanKey("recordingEnabled", fileConfig, managedConfig, defaults2.recordingEnabled ?? true);
    return {
      apiKey: apiKey.value,
      organizationId: organizationId.value,
      actionPrefix: actionPrefix.value,
      actorId: actorId.value,
      actorType: actorType.value,
      actorName: actorName.value,
      location: location.value,
      userAgent: userAgent.value,
      proxyUrl: proxyUrl.value,
      recordingEnabled: recordingEnabled.value,
      configPath: getConfigFilePath(),
      sources: {
        apiKey: apiKey.source,
        organizationId: organizationId.source,
        actionPrefix: actionPrefix.source,
        actorId: actorId.source,
        actorType: actorType.source,
        actorName: actorName.source,
        location: location.source,
        userAgent: userAgent.source,
        proxyUrl: proxyUrl.source,
        recordingEnabled: recordingEnabled.source
      }
    };
  }
  function loadQueryConfig() {
    const fileConfig = readFileConfig();
    const managedConfig = readManagedConfig();
    const apiKey = resolveKey("apiKey", fileConfig, managedConfig);
    const organizationId = resolveKey("organizationId", fileConfig, managedConfig);
    return {
      apiKey: apiKey.value,
      organizationId: organizationId.value,
      configPath: getConfigFilePath(),
      sources: {
        apiKey: apiKey.source,
        organizationId: organizationId.source
      }
    };
  }
  return {
    getConfigFilePath,
    readFileConfig,
    writeFileConfig,
    clearFileConfig,
    loadConfig,
    loadQueryConfig
  };
}

// scripts/config-file.mjs
var configLoader = createConfigLoader({
  configFilePathEnvs: ["WORKOS_AUDIT_CONFIG_PATH", "CODEX_WORKOS_AUDIT_CONFIG_PATH"],
  defaultConfigDir: ".codex",
  envKeyOrder: {
    apiKey: ["CODEX_WORKOS_AUDIT_API_KEY", "WORKOS_API_KEY"],
    organizationId: ["CODEX_WORKOS_AUDIT_ORGANIZATION_ID", "WORKOS_ORGANIZATION_ID"],
    actionPrefix: ["CODEX_WORKOS_AUDIT_ACTION_PREFIX", "WORKOS_ACTION_PREFIX"],
    actorId: ["CODEX_WORKOS_AUDIT_ACTOR_ID", "WORKOS_ACTOR_ID"],
    actorType: ["CODEX_WORKOS_AUDIT_ACTOR_TYPE", "WORKOS_ACTOR_TYPE"],
    actorName: ["CODEX_WORKOS_AUDIT_ACTOR_NAME", "WORKOS_ACTOR_NAME"],
    location: ["CODEX_WORKOS_AUDIT_LOCATION", "WORKOS_LOCATION"],
    userAgent: ["CODEX_WORKOS_AUDIT_USER_AGENT", "WORKOS_USER_AGENT"],
    proxyUrl: ["CODEX_WORKOS_AUDIT_PROXY_URL", "WORKOS_AUDIT_PROXY_URL"],
    recordingEnabled: ["CODEX_WORKOS_AUDIT_RECORDING", "WORKOS_AUDIT_RECORDING"]
  },
  defaults: {
    actionPrefix: "codex",
    actorType: "user",
    location: "codex",
    userAgent: "codex-workos-audit/1",
    recordingEnabled: true
  }
});

// scripts/codex-audit-schemas.mjs
function getCodexAuditSchemaDefinitions(prefix = "codex") {
  return [
    {
      action: `${prefix}.session.started`,
      note: "Codex session start / resume / clear events.",
      targets: [{ type: "session" }],
      metadata: {
        source: "string",
        cwd: "string",
        transcript_path: "string",
        permission_mode: "string",
        model: "string"
      }
    },
    {
      action: `${prefix}.prompt.submitted`,
      note: "User prompt submission before Codex processes it.",
      targets: [{ type: "session" }],
      metadata: {
        prompt_length: "number",
        prompt_sha256: "string",
        prompt_preview: "string",
        cwd: "string",
        permission_mode: "string",
        model: "string",
        turn_id: "string"
      }
    },
    {
      action: `${prefix}.tool.called`,
      note: "Before a Codex tool call executes.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        tool_use_id: "string",
        tool_input_sha256: "string",
        tool_input_bytes: "number",
        command_preview: "string",
        command_truncated: "boolean",
        blocked: "boolean",
        cwd: "string",
        permission_mode: "string",
        model: "string",
        turn_id: "string"
      }
    },
    {
      action: `${prefix}.permission.requested`,
      note: "Codex requested permission for a tool call.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        tool_input_sha256: "string",
        tool_input_bytes: "number",
        command_preview: "string",
        command_truncated: "boolean",
        cwd: "string",
        permission_mode: "string",
        model: "string",
        turn_id: "string"
      }
    },
    {
      action: `${prefix}.tool.completed`,
      note: "After a Codex tool call succeeds.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        tool_use_id: "string",
        duration_ms: "number",
        is_error: "boolean",
        result_sha256: "string",
        result_bytes: "number",
        cwd: "string",
        permission_mode: "string",
        model: "string",
        turn_id: "string"
      }
    },
    {
      action: `${prefix}.tool.failed`,
      note: "After a Codex tool call returns an error-like result.",
      targets: [
        { type: "session" },
        { type: "tool", metadata: { tool_name: "string" } }
      ],
      metadata: {
        tool_name: "string",
        tool_use_id: "string",
        duration_ms: "number",
        is_error: "boolean",
        result_sha256: "string",
        result_bytes: "number",
        error_preview: "string",
        cwd: "string",
        permission_mode: "string",
        model: "string",
        turn_id: "string"
      }
    },
    {
      action: `${prefix}.turn.completed`,
      note: "Codex finished a response turn.",
      targets: [{ type: "session" }],
      metadata: {
        cwd: "string",
        permission_mode: "string",
        model: "string",
        turn_id: "string",
        last_assistant_message_length: "number",
        last_assistant_message_sha256: "string",
        stop_hook_active: "boolean"
      }
    }
  ];
}

// scripts/create-codex-schemas.mjs
await runCreateSchemas({
  getSchemas: getCodexAuditSchemaDefinitions,
  defaultPrefix: "codex",
  configLoader
});
