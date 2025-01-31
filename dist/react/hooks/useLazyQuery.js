import { __assign } from "tslib";
import * as React from "react";
import { mergeOptions } from "../../utilities/index.js";
import { useInternalState } from "./useQuery.js";
import { useApolloClient } from "./useApolloClient.js";
// The following methods, when called will execute the query, regardless of
// whether the useLazyQuery execute function was called before.
var EAGER_METHODS = [
    "refetch",
    "reobserve",
    "fetchMore",
    "updateQuery",
    "startPolling",
    "subscribeToMore",
];
export function useLazyQuery(query, options) {
    var _a;
    var execOptionsRef = React.useRef();
    var optionsRef = React.useRef();
    var queryRef = React.useRef();
    var merged = mergeOptions(options, execOptionsRef.current || {});
    var document = (_a = merged === null || merged === void 0 ? void 0 : merged.query) !== null && _a !== void 0 ? _a : query;
    // Use refs to track options and the used query to ensure the `execute`
    // function remains referentially stable between renders.
    optionsRef.current = merged;
    queryRef.current = document;
    var internalState = useInternalState(useApolloClient(options && options.client), document);
    var useQueryResult = internalState.useQuery(__assign(__assign({}, merged), { skip: !execOptionsRef.current }));
    var initialFetchPolicy = useQueryResult.observable.options.initialFetchPolicy ||
        internalState.getDefaultFetchPolicy();
    var result = Object.assign(useQueryResult, {
        called: !!execOptionsRef.current,
    });
    // We use useMemo here to make sure the eager methods have a stable identity.
    var eagerMethods = React.useMemo(function () {
        var eagerMethods = {};
        var _loop_1 = function (key) {
            var method = result[key];
            eagerMethods[key] = function () {
                if (!execOptionsRef.current) {
                    execOptionsRef.current = Object.create(null);
                    // Only the first time populating execOptionsRef.current matters here.
                    internalState.forceUpdateState();
                }
                // @ts-expect-error this is just too generic to type
                return method.apply(this, arguments);
            };
        };
        for (var _i = 0, EAGER_METHODS_1 = EAGER_METHODS; _i < EAGER_METHODS_1.length; _i++) {
            var key = EAGER_METHODS_1[_i];
            _loop_1(key);
        }
        return eagerMethods;
    }, []);
    Object.assign(result, eagerMethods);
    var execute = React.useCallback(function (executeOptions) {
        execOptionsRef.current =
            executeOptions ? __assign(__assign({}, executeOptions), { fetchPolicy: executeOptions.fetchPolicy || initialFetchPolicy }) : {
                fetchPolicy: initialFetchPolicy,
            };
        var options = mergeOptions(optionsRef.current, __assign({ query: queryRef.current }, execOptionsRef.current));
        var promise = internalState
            .executeQuery(__assign(__assign({}, options), { skip: false }))
            .then(function (queryResult) { return Object.assign(queryResult, eagerMethods); });
        // Because the return value of `useLazyQuery` is usually floated, we need
        // to catch the promise to prevent unhandled rejections.
        promise.catch(function () { });
        return promise;
    }, []);
    return [execute, result];
}
//# sourceMappingURL=useLazyQuery.js.map