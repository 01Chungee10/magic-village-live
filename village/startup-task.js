// A startup attempt owns its async work. Superseded attempts cannot resume the UI.
export function createStartupTask() {
  const controller = new AbortController();
  const {signal} = controller;
  const cancel = (reason = new DOMException('Startup cancelled', 'AbortError')) => {
    if (!signal.aborted) controller.abort(reason);
  };
  const assertActive = () => {
    if (signal.aborted) throw signal.reason;
  };

  function waitFor(promise, {timeoutMs = 30000, onLateResolve} = {}) {
    return new Promise((resolve, reject) => {
      let settled = false;
      let timer;
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
        callback(value);
      };
      const onAbort = () => finish(reject, signal.reason);
      const discard = value => {
        // Unity cannot abort its startup promise. Its eventual instance must quit.
        if (onLateResolve) {
          try { Promise.resolve(onLateResolve(value)).catch(() => {}); }
          catch { /* The caller owns cleanup-error reporting. */ }
        }
      };
      Promise.resolve(promise).then(value => {
        if (settled || signal.aborted) { discard(value); return; }
        finish(resolve, value);
      }, error => finish(reject, error));
      signal.addEventListener('abort', onAbort, {once: true});
      if (signal.aborted) { onAbort(); return; }
      timer = setTimeout(() => {
        const error = new Error('마을 준비 시간이 초과되었어요.');
        error.name = 'TimeoutError';
        cancel(error);
      }, timeoutMs);
    });
  }

  return {signal, cancel, assertActive, waitFor};
}
