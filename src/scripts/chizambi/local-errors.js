// Local diagnostics only; no telemetry or network transport.
export default { captureException(error) { console.warn('[chizAmbi]', error); } };
