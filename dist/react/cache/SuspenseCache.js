import { Trie } from "@wry/trie";
import { canUseWeakMap } from "../../utilities/index.js";
import { InternalQueryReference } from "./QueryReference.js";
var SuspenseCache = /** @class */ (function () {
    function SuspenseCache(options) {
        if (options === void 0) { options = Object.create(null); }
        this.queryRefs = new Trie(canUseWeakMap);
        this.options = options;
    }
    SuspenseCache.prototype.getQueryRef = function (cacheKey, createObservable) {
        var ref = this.queryRefs.lookupArray(cacheKey);
        if (!ref.current) {
            ref.current = new InternalQueryReference(createObservable(), {
                key: cacheKey,
                autoDisposeTimeoutMs: this.options.autoDisposeTimeoutMs,
                onDispose: function () {
                    delete ref.current;
                },
            });
        }
        return ref.current;
    };
    return SuspenseCache;
}());
export { SuspenseCache };
//# sourceMappingURL=SuspenseCache.js.map