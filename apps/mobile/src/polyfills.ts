/**
 * Hermes / older JS engines may not define Promise.withResolvers (ES2024).
 * Load this module early from `apps/mobile/index.ts` if a dependency needs it.
 */
const P = Promise as unknown as {
  withResolvers?: <T>() => {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
  };
};

if (typeof Promise !== "undefined" && typeof P.withResolvers !== "function") {
  P.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
