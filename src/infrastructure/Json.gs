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
  // google.script.run solo admite primitivas, arreglos y objetos compuestos por
  // esos tipos. Range.getValues() puede entregar Date, que invalida toda la
  // respuesta aunque aparezca anidado dentro de una fila.
  function clientSafe(value) {
    if (value === undefined || value === null) return value === undefined ? null : value;
    if (Object.prototype.toString.call(value) === '[object Date]') {
      return isNaN(value.getTime()) ? null : value.toISOString();
    }
    if (Array.isArray(value)) return value.map(clientSafe);
    if (typeof value === 'number') return isFinite(value) ? value : null;
    if (typeof value === 'object') {
      var out = {};
      Object.keys(value).forEach(function (key) {
        if (typeof value[key] !== 'function') out[key] = clientSafe(value[key]);
      });
      return out;
    }
    return value;
  }
  function now() { return new Date().toISOString(); }
  return { stableStringify: stable, hash: hash, clientSafe: clientSafe, now: now };
})();
