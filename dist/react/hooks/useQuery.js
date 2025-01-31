import { __assign, __rest } from "tslib";
import { invariant } from "../../utilities/globals/index.js";
import * as React from "react";
import { useSyncExternalStore } from "./useSyncExternalStore.js";
import { equal } from "@wry/equality";
import { mergeOptions } from "../../utilities/index.js";
import { getApolloContext } from "../context/index.js";
import { ApolloError } from "../../errors/index.js";
import { NetworkStatus } from "../../core/index.js";
import { DocumentType, verifyDocumentType } from "../parser/index.js";
import { useApolloClient } from "./useApolloClient.js";
import { canUseWeakMap, compact, isNonEmptyArray, maybeDeepFreeze, } from "../../utilities/index.js";
var hasOwnProperty = Object.prototype.hasOwnProperty;
export function useQuery(query, options) {
    if (options === void 0) { options = Object.create(null); }
    return useInternalState(useApolloClient(options.client), query).useQuery(options);
}
export function useInternalState(client, query) {
    var stateRef = React.useRef();
    if (!stateRef.current ||
        client !== stateRef.current.client ||
        query !== stateRef.current.query) {
        stateRef.current = new InternalState(client, query, stateRef.current);
    }
    var state = stateRef.current;
    // By default, InternalState.prototype.forceUpdate is an empty function, but
    // we replace it here (before anyone has had a chance to see this state yet)
    // with a function that unconditionally forces an update, using the latest
    // setTick function. Updating this state by calling state.forceUpdate is the
    // only way we trigger React component updates (no other useState calls within
    // the InternalState class).
    state.forceUpdateState = React.useReducer(function (tick) { return tick + 1; }, 0)[1];
    return state;
}
var InternalState = /** @class */ (function () {
    function InternalState(client, query, previous) {
        var _this = this;
        this.client = client;
        this.query = query;
        /**
         * Will be overwritten by the `useSyncExternalStore` "force update" method
         * whenever it is available and reset to `forceUpdateState` when it isn't.
         */
        this.forceUpdate = function () { return _this.forceUpdateState(); };
        this.ssrDisabledResult = maybeDeepFreeze({
            loading: true,
            data: void 0,
            error: void 0,
            networkStatus: NetworkStatus.loading,
        });
        this.skipStandbyResult = maybeDeepFreeze({
            loading: false,
            data: void 0,
            error: void 0,
            networkStatus: NetworkStatus.ready,
        });
        // This cache allows the referential stability of this.result (as returned by
        // getCurrentResult) to translate into referential stability of the resulting
        // QueryResult object returned by toQueryResult.
        this.toQueryResultCache = new (canUseWeakMap ? WeakMap : Map)();
        verifyDocumentType(query, DocumentType.Query);
        // Reuse previousData from previous InternalState (if any) to provide
        // continuity of previousData even if/when the query or client changes.
        var previousResult = previous && previous.result;
        var previousData = previousResult && previousResult.data;
        if (previousData) {
            this.previousData = previousData;
        }
    }
    /**
     * Forces an update using local component state.
     * As this is not batched with `useSyncExternalStore` updates,
     * this is only used as a fallback if the `useSyncExternalStore` "force update"
     * method is not registered at the moment.
     * See https://github.com/facebook/react/issues/25191
     *  */
    InternalState.prototype.forceUpdateState = function () {
        // Replaced (in useInternalState) with a method that triggers an update.
        globalThis.__DEV__ !== false && invariant.warn(50);
    };
    InternalState.prototype.executeQuery = function (options) {
        var _this = this;
        var _a;
        if (options.query) {
            Object.assign(this, { query: options.query });
        }
        this.watchQueryOptions = this.createWatchQueryOptions((this.queryHookOptions = options));
        var concast = this.observable.reobserveAsConcast(this.getObsQueryOptions());
        // Make sure getCurrentResult returns a fresh ApolloQueryResult<TData>,
        // but save the current data as this.previousData, just like setResult
        // usually does.
        this.previousData = ((_a = this.result) === null || _a === void 0 ? void 0 : _a.data) || this.previousData;
        this.result = void 0;
        this.forceUpdate();
        return new Promise(function (resolve) {
            var result;
            // Subscribe to the concast independently of the ObservableQuery in case
            // the component gets unmounted before the promise resolves. This prevents
            // the concast from terminating early and resolving with `undefined` when
            // there are no more subscribers for the concast.
            concast.subscribe({
                next: function (value) {
                    result = value;
                },
                error: function () {
                    resolve(_this.toQueryResult(_this.observable.getCurrentResult()));
                },
                complete: function () {
                    resolve(_this.toQueryResult(result));
                },
            });
        });
    };
    // Methods beginning with use- should be called according to the standard
    // rules of React hooks: only at the top level of the calling function, and
    // without any dynamic conditional logic.
    InternalState.prototype.useQuery = function (options) {
        var _this = this;
        // The renderPromises field gets initialized here in the useQuery method, at
        // the beginning of everything (for a given component rendering, at least),
        // so we can safely use this.renderPromises in other/later InternalState
        // methods without worrying it might be uninitialized. Even after
        // initialization, this.renderPromises is usually undefined (unless SSR is
        // happening), but that's fine as long as it has been initialized that way,
        // rather than left uninitialized.
        this.renderPromises = React.useContext(getApolloContext()).renderPromises;
        this.useOptions(options);
        var obsQuery = this.useObservableQuery();
        var result = useSyncExternalStore(React.useCallback(function (handleStoreChange) {
            if (_this.renderPromises) {
                return function () { };
            }
            _this.forceUpdate = handleStoreChange;
            var onNext = function () {
                var previousResult = _this.result;
                // We use `getCurrentResult()` instead of the onNext argument because
                // the values differ slightly. Specifically, loading results will have
                // an empty object for data instead of `undefined` for some reason.
                var result = obsQuery.getCurrentResult();
                // Make sure we're not attempting to re-render similar results
                if (previousResult &&
                    previousResult.loading === result.loading &&
                    previousResult.networkStatus === result.networkStatus &&
                    equal(previousResult.data, result.data)) {
                    return;
                }
                _this.setResult(result);
            };
            var onError = function (error) {
                subscription.unsubscribe();
                subscription = obsQuery.resubscribeAfterError(onNext, onError);
                if (!hasOwnProperty.call(error, "graphQLErrors")) {
                    // The error is not a GraphQL error
                    throw error;
                }
                var previousResult = _this.result;
                if (!previousResult ||
                    (previousResult && previousResult.loading) ||
                    !equal(error, previousResult.error)) {
                    _this.setResult({
                        data: (previousResult && previousResult.data),
                        error: error,
                        loading: false,
                        networkStatus: NetworkStatus.error,
                    });
                }
            };
            var subscription = obsQuery.subscribe(onNext, onError);
            // Do the "unsubscribe" with a short delay.
            // This way, an existing subscription can be reused without an additional
            // request if "unsubscribe"  and "resubscribe" to the same ObservableQuery
            // happen in very fast succession.
            return function () {
                setTimeout(function () { return subscription.unsubscribe(); });
                _this.forceUpdate = function () { return _this.forceUpdateState(); };
            };
        }, [
            // We memoize the subscribe function using useCallback and the following
            // dependency keys, because the subscribe function reference is all that
            // useSyncExternalStore uses internally as a dependency key for the
            // useEffect ultimately responsible for the subscription, so we are
            // effectively passing this dependency array to that useEffect buried
            // inside useSyncExternalStore, as desired.
            obsQuery,
            this.renderPromises,
            this.client.disableNetworkFetches,
        ]), function () { return _this.getCurrentResult(); }, function () { return _this.getCurrentResult(); });
        // TODO Remove this method when we remove support for options.partialRefetch.
        this.unsafeHandlePartialRefetch(result);
        return this.toQueryResult(result);
    };
    InternalState.prototype.useOptions = function (options) {
        var _a;
        var watchQueryOptions = this.createWatchQueryOptions((this.queryHookOptions = options));
        // Update this.watchQueryOptions, but only when they have changed, which
        // allows us to depend on the referential stability of
        // this.watchQueryOptions elsewhere.
        var currentWatchQueryOptions = this.watchQueryOptions;
        if (!equal(watchQueryOptions, currentWatchQueryOptions)) {
            this.watchQueryOptions = watchQueryOptions;
            if (currentWatchQueryOptions && this.observable) {
                // Though it might be tempting to postpone this reobserve call to the
                // useEffect block, we need getCurrentResult to return an appropriate
                // loading:true result synchronously (later within the same call to
                // useQuery). Since we already have this.observable here (not true for
                // the very first call to useQuery), we are not initiating any new
                // subscriptions, though it does feel less than ideal that reobserve
                // (potentially) kicks off a network request (for example, when the
                // variables have changed), which is technically a side-effect.
                this.observable.reobserve(this.getObsQueryOptions());
                // Make sure getCurrentResult returns a fresh ApolloQueryResult<TData>,
                // but save the current data as this.previousData, just like setResult
                // usually does.
                this.previousData = ((_a = this.result) === null || _a === void 0 ? void 0 : _a.data) || this.previousData;
                this.result = void 0;
            }
        }
        // Make sure state.onCompleted and state.onError always reflect the latest
        // options.onCompleted and options.onError callbacks provided to useQuery,
        // since those functions are often recreated every time useQuery is called.
        // Like the forceUpdate method, the versions of these methods inherited from
        // InternalState.prototype are empty no-ops, but we can override them on the
        // base state object (without modifying the prototype).
        this.onCompleted =
            options.onCompleted || InternalState.prototype.onCompleted;
        this.onError = options.onError || InternalState.prototype.onError;
        if ((this.renderPromises || this.client.disableNetworkFetches) &&
            this.queryHookOptions.ssr === false &&
            !this.queryHookOptions.skip) {
            // If SSR has been explicitly disabled, and this function has been called
            // on the server side, return the default loading state.
            this.result = this.ssrDisabledResult;
        }
        else if (this.queryHookOptions.skip ||
            this.watchQueryOptions.fetchPolicy === "standby") {
            // When skipping a query (ie. we're not querying for data but still want to
            // render children), make sure the `data` is cleared out and `loading` is
            // set to `false` (since we aren't loading anything).
            //
            // NOTE: We no longer think this is the correct behavior. Skipping should
            // not automatically set `data` to `undefined`, but instead leave the
            // previous data in place. In other words, skipping should not mandate that
            // previously received data is all of a sudden removed. Unfortunately,
            // changing this is breaking, so we'll have to wait until Apollo Client 4.0
            // to address this.
            this.result = this.skipStandbyResult;
        }
        else if (this.result === this.ssrDisabledResult ||
            this.result === this.skipStandbyResult) {
            this.result = void 0;
        }
    };
    InternalState.prototype.getObsQueryOptions = function () {
        var toMerge = [];
        var globalDefaults = this.client.defaultOptions.watchQuery;
        if (globalDefaults)
            toMerge.push(globalDefaults);
        if (this.queryHookOptions.defaultOptions) {
            toMerge.push(this.queryHookOptions.defaultOptions);
        }
        // We use compact rather than mergeOptions for this part of the merge,
        // because we want watchQueryOptions.variables (if defined) to replace
        // this.observable.options.variables whole. This replacement allows
        // removing variables by removing them from the variables input to
        // useQuery. If the variables were always merged together (rather than
        // replaced), there would be no way to remove existing variables.
        // However, the variables from options.defaultOptions and globalDefaults
        // (if provided) should be merged, to ensure individual defaulted
        // variables always have values, if not otherwise defined in
        // observable.options or watchQueryOptions.
        toMerge.push(compact(this.observable && this.observable.options, this.watchQueryOptions));
        return toMerge.reduce(mergeOptions);
    };
    // A function to massage options before passing them to ObservableQuery.
    InternalState.prototype.createWatchQueryOptions = function (_a) {
        var _b;
        if (_a === void 0) { _a = {}; }
        var skip = _a.skip, ssr = _a.ssr, onCompleted = _a.onCompleted, onError = _a.onError, defaultOptions = _a.defaultOptions, 
        // The above options are useQuery-specific, so this ...otherOptions spread
        // makes otherOptions almost a WatchQueryOptions object, except for the
        // query property that we add below.
        otherOptions = __rest(_a, ["skip", "ssr", "onCompleted", "onError", "defaultOptions"]);
        // This Object.assign is safe because otherOptions is a fresh ...rest object
        // that did not exist until just now, so modifications are still allowed.
        var watchQueryOptions = Object.assign(otherOptions, { query: this.query });
        if (this.renderPromises &&
            (watchQueryOptions.fetchPolicy === "network-only" ||
                watchQueryOptions.fetchPolicy === "cache-and-network")) {
            // this behavior was added to react-apollo without explanation in this PR
            // https://github.com/apollographql/react-apollo/pull/1579
            watchQueryOptions.fetchPolicy = "cache-first";
        }
        if (!watchQueryOptions.variables) {
            watchQueryOptions.variables = {};
        }
        if (skip) {
            var _c = watchQueryOptions.fetchPolicy, fetchPolicy = _c === void 0 ? this.getDefaultFetchPolicy() : _c, _d = watchQueryOptions.initialFetchPolicy, initialFetchPolicy = _d === void 0 ? fetchPolicy : _d;
            // When skipping, we set watchQueryOptions.fetchPolicy initially to
            // "standby", but we also need/want to preserve the initial non-standby
            // fetchPolicy that would have been used if not skipping.
            Object.assign(watchQueryOptions, {
                initialFetchPolicy: initialFetchPolicy,
                fetchPolicy: "standby",
            });
        }
        else if (!watchQueryOptions.fetchPolicy) {
            watchQueryOptions.fetchPolicy =
                ((_b = this.observable) === null || _b === void 0 ? void 0 : _b.options.initialFetchPolicy) ||
                    this.getDefaultFetchPolicy();
        }
        return watchQueryOptions;
    };
    InternalState.prototype.getDefaultFetchPolicy = function () {
        var _a, _b;
        return (((_a = this.queryHookOptions.defaultOptions) === null || _a === void 0 ? void 0 : _a.fetchPolicy) ||
            ((_b = this.client.defaultOptions.watchQuery) === null || _b === void 0 ? void 0 : _b.fetchPolicy) ||
            "cache-first");
    };
    // Defining these methods as no-ops on the prototype allows us to call
    // state.onCompleted and/or state.onError without worrying about whether a
    // callback was provided.
    InternalState.prototype.onCompleted = function (data) { };
    InternalState.prototype.onError = function (error) { };
    InternalState.prototype.useObservableQuery = function () {
        // See if there is an existing observable that was used to fetch the same
        // data and if so, use it instead since it will contain the proper queryId
        // to fetch the result set. This is used during SSR.
        var obsQuery = (this.observable =
            (this.renderPromises &&
                this.renderPromises.getSSRObservable(this.watchQueryOptions)) ||
                this.observable || // Reuse this.observable if possible (and not SSR)
                this.client.watchQuery(this.getObsQueryOptions()));
        this.obsQueryFields = React.useMemo(function () { return ({
            refetch: obsQuery.refetch.bind(obsQuery),
            reobserve: obsQuery.reobserve.bind(obsQuery),
            fetchMore: obsQuery.fetchMore.bind(obsQuery),
            updateQuery: obsQuery.updateQuery.bind(obsQuery),
            startPolling: obsQuery.startPolling.bind(obsQuery),
            stopPolling: obsQuery.stopPolling.bind(obsQuery),
            subscribeToMore: obsQuery.subscribeToMore.bind(obsQuery),
        }); }, [obsQuery]);
        var ssrAllowed = !(this.queryHookOptions.ssr === false || this.queryHookOptions.skip);
        if (this.renderPromises && ssrAllowed) {
            this.renderPromises.registerSSRObservable(obsQuery);
            if (obsQuery.getCurrentResult().loading) {
                // TODO: This is a legacy API which could probably be cleaned up
                this.renderPromises.addObservableQueryPromise(obsQuery);
            }
        }
        return obsQuery;
    };
    InternalState.prototype.setResult = function (nextResult) {
        var previousResult = this.result;
        if (previousResult && previousResult.data) {
            this.previousData = previousResult.data;
        }
        this.result = nextResult;
        // Calling state.setResult always triggers an update, though some call sites
        // perform additional equality checks before committing to an update.
        this.forceUpdate();
        this.handleErrorOrCompleted(nextResult, previousResult);
    };
    InternalState.prototype.handleErrorOrCompleted = function (result, previousResult) {
        var _this = this;
        if (!result.loading) {
            var error_1 = this.toApolloError(result);
            // wait a tick in case we are in the middle of rendering a component
            Promise.resolve()
                .then(function () {
                if (error_1) {
                    _this.onError(error_1);
                }
                else if (result.data &&
                    (previousResult === null || previousResult === void 0 ? void 0 : previousResult.networkStatus) !== result.networkStatus &&
                    result.networkStatus === NetworkStatus.ready) {
                    _this.onCompleted(result.data);
                }
            })
                .catch(function (error) {
                globalThis.__DEV__ !== false && invariant.warn(error);
            });
        }
    };
    InternalState.prototype.toApolloError = function (result) {
        return isNonEmptyArray(result.errors) ?
            new ApolloError({ graphQLErrors: result.errors })
            : result.error;
    };
    InternalState.prototype.getCurrentResult = function () {
        // Using this.result as a cache ensures getCurrentResult continues returning
        // the same (===) result object, unless state.setResult has been called, or
        // we're doing server rendering and therefore override the result below.
        if (!this.result) {
            this.handleErrorOrCompleted((this.result = this.observable.getCurrentResult()));
        }
        return this.result;
    };
    InternalState.prototype.toQueryResult = function (result) {
        var queryResult = this.toQueryResultCache.get(result);
        if (queryResult)
            return queryResult;
        var data = result.data, partial = result.partial, resultWithoutPartial = __rest(result, ["data", "partial"]);
        this.toQueryResultCache.set(result, (queryResult = __assign(__assign(__assign({ data: data }, resultWithoutPartial), this.obsQueryFields), { client: this.client, observable: this.observable, variables: this.observable.variables, called: !this.queryHookOptions.skip, previousData: this.previousData })));
        if (!queryResult.error && isNonEmptyArray(result.errors)) {
            // Until a set naming convention for networkError and graphQLErrors is
            // decided upon, we map errors (graphQLErrors) to the error options.
            // TODO: Is it possible for both result.error and result.errors to be
            // defined here?
            queryResult.error = new ApolloError({ graphQLErrors: result.errors });
        }
        return queryResult;
    };
    InternalState.prototype.unsafeHandlePartialRefetch = function (result) {
        // WARNING: SIDE-EFFECTS IN THE RENDER FUNCTION
        //
        // TODO: This code should be removed when the partialRefetch option is
        // removed. I was unable to get this hook to behave reasonably in certain
        // edge cases when this block was put in an effect.
        if (result.partial &&
            this.queryHookOptions.partialRefetch &&
            !result.loading &&
            (!result.data || Object.keys(result.data).length === 0) &&
            this.observable.options.fetchPolicy !== "cache-only") {
            Object.assign(result, {
                loading: true,
                networkStatus: NetworkStatus.refetch,
            });
            this.observable.refetch();
        }
    };
    return InternalState;
}());
//# sourceMappingURL=useQuery.js.map