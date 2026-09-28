var JsonUtil = (function () {
  function stable(value) {
    if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(function (k) {
      return JSON.stringify(k) + ':' + stable(value[k]);
    }).join(',') + '}';
    return JSON.stringify(value);
  }
  function hash(value) {
    var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, stable(value), Utilities.Charset.UTF_8);
    return bytes.map(function (b) { return ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2); }).join('');
  }
  function now() { return new Date().toISOString(); }
  return { stableStringify: stable, hash: hash, now: now };
})();
