import { execFileSync } from 'node:child_process';

// The Okta device-attestation cert's keychain label is "OktaManagementAttestation
// for <DEVICE_SERIAL>". We select it by label for `curl --cert` (selecting by
// SHA-1/thumbprint silently fails; see the proxy spec §3.3).
const LABEL_RE = /"(OktaManagementAttestation for [^"]+)"/;

let cached;

// Find the Okta device-cert keychain label, or null if none is present.
//
// Enumerate ALL identities with plain `security find-identity` (no -v, no -p).
// Notes from testing on a real company Mac:
//   - `-v` HIDES this cert: it filters to OS-trusted identities, and the Okta
//     cert chains to an untrusted org CA (shows CSSMERR_TP_NOT_TRUSTED).
//   - `-p ssl-client` ALSO hides it here (the cert isn't registered under the
//     SSL-client policy), so we must NOT scope by policy. curl still selects it
//     by label for the actual handshake.
// Cached per process.
export function getDeviceCertLabel() {
  if (cached !== undefined) return cached;
  try {
    const out = execFileSync('security', ['find-identity'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    cached = LABEL_RE.exec(out)?.[1] ?? null;
  } catch {
    // Non-macOS, no `security` binary, or no identities — treat as "no cert".
    cached = null;
  }
  return cached;
}
