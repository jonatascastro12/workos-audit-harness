import { emitEvents } from './cli/emit-event.mjs';

// Coalesce audit events into batched requests.
//
// For hosts that load the audit extension IN-PROCESS and long-lived (pi,
// openclaw), every event otherwise costs its own process, TLS handshake and mTLS
// handshake — ~600ms of work that curl cannot amortise because it exits between
// events. A turn emits several (input, agent start, tool call, tool result,
// message end, agent end, …), so coalescing a burst into one request is the
// difference between seconds of background work and a fraction of one.
//
// This is NOT useful for the Claude Code / codex hooks: those run one throwaway
// process per event, so there is nothing to batch across without an on-disk
// spool (and a spool raises durability questions this does not try to answer).
//
// Deliberately not durable: buffered events live in memory, so a hard kill loses
// at most `maxDelayMs` worth. That is the trade for never blocking the host. Call
// `flush()` from the host's shutdown hook to close the ordinary-exit window.
const DEFAULT_MAX_BATCH_SIZE = 20;
const DEFAULT_MAX_DELAY_MS = 200;

export function createEventBatcher({
  config,
  maxBatchSize = DEFAULT_MAX_BATCH_SIZE,
  maxDelayMs = DEFAULT_MAX_DELAY_MS,
  onError,
  // Injectable for tests.
  send = emitEvents,
} = {}) {
  let buffer = [];
  let timer = null;
  // Serialises sends so batches reach the proxy in the order they were formed,
  // and so `flush()` has a single thing to await.
  let chain = Promise.resolve();

  const report = (detail) => {
    if (onError) onError(detail);
    else process.stderr.write(`workos-audit: ${detail}\n`);
  };

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function sendNow() {
    clearTimer();
    if (buffer.length === 0) return chain;
    const batch = buffer;
    buffer = [];
    chain = chain
      // A previous failure must not stop later batches.
      .catch(() => undefined)
      .then(async () => {
        const result = await send(batch, config);
        if (result && result.ok === false && result.error) {
          report(`batch of ${batch.length} failed: ${result.error}`);
        }
      })
      .catch((error) => report(`batch of ${batch.length} threw: ${String(error?.message || error)}`));
    return chain;
  }

  return {
    // Queue an event. Returns nothing: callers must not await this, or they
    // reintroduce exactly the stall batching exists to remove.
    add(event) {
      if (!event) return;
      buffer.push(event);
      if (buffer.length >= maxBatchSize) {
        void sendNow();
        return;
      }
      if (timer === null) {
        timer = setTimeout(() => {
          timer = null;
          void sendNow();
        }, maxDelayMs);
        // Never hold the host process open just because a batch is pending.
        timer.unref?.();
      }
    },

    // Drain everything and wait for it. Loops because a send is awaited while
    // new events can still arrive, so one pass is not necessarily enough.
    // Bounded so a caller that emits continuously cannot spin here forever.
    async flush() {
      for (let pass = 0; pass < 10; pass++) {
        await sendNow();
        if (buffer.length === 0) return;
      }
      await sendNow();
    },

    get pending() {
      return buffer.length;
    },
  };
}
