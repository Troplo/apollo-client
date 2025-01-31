'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var globals = require('../../utilities/globals');
var React = require('react');
var context = require('../context');
var tslib = require('tslib');
var utilities = require('../../utilities');
var equality = require('@wry/equality');
var errors = require('../../errors');
var core = require('../../core');
var parser = require('../parser');
var cache = require('../../cache');
var trie = require('@wry/trie');

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        for (var k in e) {
            n[k] = e[k];
        }
    }
    n["default"] = e;
    return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespace(React);

function useApolloClient(override) {
    var context$1 = React__namespace.useContext(context.getApolloContext());
    var client = override || context$1.client;
    globals.invariant(!!client, 49);
    return client;
}

var didWarnUncachedGetSnapshot = false;
var uSESKey = "useSyncExternalStore";
var realHook$1 = React__namespace[uSESKey];
var useSyncExternalStore = realHook$1 ||
    (function (subscribe, getSnapshot, getServerSnapshot) {
        var value = getSnapshot();
        if (
        globalThis.__DEV__ !== false &&
            !didWarnUncachedGetSnapshot &&
            value !== getSnapshot()) {
            didWarnUncachedGetSnapshot = true;
            globalThis.__DEV__ !== false && globals.invariant.error(58);
        }
        var _a = React__namespace.useState({
            inst: { value: value, getSnapshot: getSnapshot },
        }), inst = _a[0].inst, forceUpdate = _a[1];
        if (utilities.canUseLayoutEffect) {
            React__namespace.useLayoutEffect(function () {
                Object.assign(inst, { value: value, getSnapshot: getSnapshot });
                if (checkIfSnapshotChanged(inst)) {
                    forceUpdate({ inst: inst });
                }
            }, [subscribe, value, getSnapshot]);
        }
        else {
            Object.assign(inst, { value: value, getSnapshot: getSnapshot });
        }
        React__namespace.useEffect(function () {
            if (checkIfSnapshotChanged(inst)) {
                forceUpdate({ inst: inst });
            }
            return subscribe(function handleStoreChange() {
                if (checkIfSnapshotChanged(inst)) {
                    forceUpdate({ inst: inst });
                }
            });
        }, [subscribe]);
        return value;
    });
function checkIfSnapshotChanged(_a) {
    var value = _a.value, getSnapshot = _a.getSnapshot;
    try {
        return value !== getSnapshot();
    }
    catch (_b) {
        return true;
    }
}

var hasOwnProperty = Object.prototype.hasOwnProperty;
function useQuery(query, options) {
    if (options === void 0) { options = Object.create(null); }
    return useInternalState(useApolloClient(options.client), query).useQuery(options);
}
function useInternalState(client, query) {
    var stateRef = React__namespace.useRef();
    if (!stateRef.current ||
        client !== stateRef.current.client ||
        query !== stateRef.current.query) {
        stateRef.current = new InternalState(client, query, stateRef.current);
    }
    var state = stateRef.current;
    state.forceUpdateState = React__namespace.useReducer(function (tick) { return tick + 1; }, 0)[1];
    return state;
}
var InternalState =  (function () {
    function InternalState(client, query, previous) {
        var _this = this;
        this.client = client;
        this.query = query;
        this.forceUpdate = function () { return _this.forceUpdateState(); };
        this.ssrDisabledResult = utilities.maybeDeepFreeze({
            loading: true,
            data: void 0,
            error: void 0,
            networkStatus: core.NetworkStatus.loading,
        });
        this.skipStandbyResult = utilities.maybeDeepFreeze({
            loading: false,
            data: void 0,
            error: void 0,
            networkStatus: core.NetworkStatus.ready,
        });
        this.toQueryResultCache = new (utilities.canUseWeakMap ? WeakMap : Map)();
        parser.verifyDocumentType(query, parser.DocumentType.Query);
        var previousResult = previous && previous.result;
        var previousData = previousResult && previousResult.data;
        if (previousData) {
            this.previousData = previousData;
        }
    }
    InternalState.prototype.forceUpdateState = function () {
        globalThis.__DEV__ !== false && globals.invariant.warn(50);
    };
    InternalState.prototype.executeQuery = function (options) {
        var _this = this;
        var _a;
        if (options.query) {
            Object.assign(this, { query: options.query });
        }
        this.watchQueryOptions = this.createWatchQueryOptions((this.queryHookOptions = options));
        var concast = this.observable.reobserveAsConcast(this.getObsQueryOptions());
        this.previousData = ((_a = this.result) === null || _a === void 0 ? void 0 : _a.data) || this.previousData;
        this.result = void 0;
        this.forceUpdate();
        return new Promise(function (resolve) {
            var result;
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
    InternalState.prototype.useQuery = function (options) {
        var _this = this;
        this.renderPromises = React__namespace.useContext(context.getApolloContext()).renderPromises;
        this.useOptions(options);
        var obsQuery = this.useObservableQuery();
        var result = useSyncExternalStore(React__namespace.useCallback(function (handleStoreChange) {
            if (_this.renderPromises) {
                return function () { };
            }
            _this.forceUpdate = handleStoreChange;
            var onNext = function () {
                var previousResult = _this.result;
                var result = obsQuery.getCurrentResult();
                if (previousResult &&
                    previousResult.loading === result.loading &&
                    previousResult.networkStatus === result.networkStatus &&
                    equality.equal(previousResult.data, result.data)) {
                    return;
                }
                _this.setResult(result);
            };
            var onError = function (error) {
                subscription.unsubscribe();
                subscription = obsQuery.resubscribeAfterError(onNext, onError);
                if (!hasOwnProperty.call(error, "graphQLErrors")) {
                    throw error;
                }
                var previousResult = _this.result;
                if (!previousResult ||
                    (previousResult && previousResult.loading) ||
                    !equality.equal(error, previousResult.error)) {
                    _this.setResult({
                        data: (previousResult && previousResult.data),
                        error: error,
                        loading: false,
                        networkStatus: core.NetworkStatus.error,
                    });
                }
            };
            var subscription = obsQuery.subscribe(onNext, onError);
            return function () {
                setTimeout(function () { return subscription.unsubscribe(); });
                _this.forceUpdate = function () { return _this.forceUpdateState(); };
            };
        }, [
            obsQuery,
            this.renderPromises,
            this.client.disableNetworkFetches,
        ]), function () { return _this.getCurrentResult(); }, function () { return _this.getCurrentResult(); });
        this.unsafeHandlePartialRefetch(result);
        return this.toQueryResult(result);
    };
    InternalState.prototype.useOptions = function (options) {
        var _a;
        var watchQueryOptions = this.createWatchQueryOptions((this.queryHookOptions = options));
        var currentWatchQueryOptions = this.watchQueryOptions;
        if (!equality.equal(watchQueryOptions, currentWatchQueryOptions)) {
            this.watchQueryOptions = watchQueryOptions;
            if (currentWatchQueryOptions && this.observable) {
                this.observable.reobserve(this.getObsQueryOptions());
                this.previousData = ((_a = this.result) === null || _a === void 0 ? void 0 : _a.data) || this.previousData;
                this.result = void 0;
            }
        }
        this.onCompleted =
            options.onCompleted || InternalState.prototype.onCompleted;
        this.onError = options.onError || InternalState.prototype.onError;
        if ((this.renderPromises || this.client.disableNetworkFetches) &&
            this.queryHookOptions.ssr === false &&
            !this.queryHookOptions.skip) {
            this.result = this.ssrDisabledResult;
        }
        else if (this.queryHookOptions.skip ||
            this.watchQueryOptions.fetchPolicy === "standby") {
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
        toMerge.push(utilities.compact(this.observable && this.observable.options, this.watchQueryOptions));
        return toMerge.reduce(utilities.mergeOptions);
    };
    InternalState.prototype.createWatchQueryOptions = function (_a) {
        var _b;
        if (_a === void 0) { _a = {}; }
        var skip = _a.skip; _a.ssr; _a.onCompleted; _a.onError; _a.defaultOptions;
        var otherOptions = tslib.__rest(_a, ["skip", "ssr", "onCompleted", "onError", "defaultOptions"]);
        var watchQueryOptions = Object.assign(otherOptions, { query: this.query });
        if (this.renderPromises &&
            (watchQueryOptions.fetchPolicy === "network-only" ||
                watchQueryOptions.fetchPolicy === "cache-and-network")) {
            watchQueryOptions.fetchPolicy = "cache-first";
        }
        if (!watchQueryOptions.variables) {
            watchQueryOptions.variables = {};
        }
        if (skip) {
            var _c = watchQueryOptions.fetchPolicy, fetchPolicy = _c === void 0 ? this.getDefaultFetchPolicy() : _c, _d = watchQueryOptions.initialFetchPolicy, initialFetchPolicy = _d === void 0 ? fetchPolicy : _d;
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
    InternalState.prototype.onCompleted = function (data) { };
    InternalState.prototype.onError = function (error) { };
    InternalState.prototype.useObservableQuery = function () {
        var obsQuery = (this.observable =
            (this.renderPromises &&
                this.renderPromises.getSSRObservable(this.watchQueryOptions)) ||
                this.observable ||
                this.client.watchQuery(this.getObsQueryOptions()));
        this.obsQueryFields = React__namespace.useMemo(function () { return ({
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
        this.forceUpdate();
        this.handleErrorOrCompleted(nextResult, previousResult);
    };
    InternalState.prototype.handleErrorOrCompleted = function (result, previousResult) {
        var _this = this;
        if (!result.loading) {
            var error_1 = this.toApolloError(result);
            Promise.resolve()
                .then(function () {
                if (error_1) {
                    _this.onError(error_1);
                }
                else if (result.data &&
                    (previousResult === null || previousResult === void 0 ? void 0 : previousResult.networkStatus) !== result.networkStatus &&
                    result.networkStatus === core.NetworkStatus.ready) {
                    _this.onCompleted(result.data);
                }
            })
                .catch(function (error) {
                globalThis.__DEV__ !== false && globals.invariant.warn(error);
            });
        }
    };
    InternalState.prototype.toApolloError = function (result) {
        return utilities.isNonEmptyArray(result.errors) ?
            new errors.ApolloError({ graphQLErrors: result.errors })
            : result.error;
    };
    InternalState.prototype.getCurrentResult = function () {
        if (!this.result) {
            this.handleErrorOrCompleted((this.result = this.observable.getCurrentResult()));
        }
        return this.result;
    };
    InternalState.prototype.toQueryResult = function (result) {
        var queryResult = this.toQueryResultCache.get(result);
        if (queryResult)
            return queryResult;
        var data = result.data; result.partial; var resultWithoutPartial = tslib.__rest(result, ["data", "partial"]);
        this.toQueryResultCache.set(result, (queryResult = tslib.__assign(tslib.__assign(tslib.__assign({ data: data }, resultWithoutPartial), this.obsQueryFields), { client: this.client, observable: this.observable, variables: this.observable.variables, called: !this.queryHookOptions.skip, previousData: this.previousData })));
        if (!queryResult.error && utilities.isNonEmptyArray(result.errors)) {
            queryResult.error = new errors.ApolloError({ graphQLErrors: result.errors });
        }
        return queryResult;
    };
    InternalState.prototype.unsafeHandlePartialRefetch = function (result) {
        if (result.partial &&
            this.queryHookOptions.partialRefetch &&
            !result.loading &&
            (!result.data || Object.keys(result.data).length === 0) &&
            this.observable.options.fetchPolicy !== "cache-only") {
            Object.assign(result, {
                loading: true,
                networkStatus: core.NetworkStatus.refetch,
            });
            this.observable.refetch();
        }
    };
    return InternalState;
}());

var EAGER_METHODS = [
    "refetch",
    "reobserve",
    "fetchMore",
    "updateQuery",
    "startPolling",
    "subscribeToMore",
];
function useLazyQuery(query, options) {
    var _a;
    var execOptionsRef = React__namespace.useRef();
    var optionsRef = React__namespace.useRef();
    var queryRef = React__namespace.useRef();
    var merged = utilities.mergeOptions(options, execOptionsRef.current || {});
    var document = (_a = merged === null || merged === void 0 ? void 0 : merged.query) !== null && _a !== void 0 ? _a : query;
    optionsRef.current = merged;
    queryRef.current = document;
    var internalState = useInternalState(useApolloClient(options && options.client), document);
    var useQueryResult = internalState.useQuery(tslib.__assign(tslib.__assign({}, merged), { skip: !execOptionsRef.current }));
    var initialFetchPolicy = useQueryResult.observable.options.initialFetchPolicy ||
        internalState.getDefaultFetchPolicy();
    var result = Object.assign(useQueryResult, {
        called: !!execOptionsRef.current,
    });
    var eagerMethods = React__namespace.useMemo(function () {
        var eagerMethods = {};
        var _loop_1 = function (key) {
            var method = result[key];
            eagerMethods[key] = function () {
                if (!execOptionsRef.current) {
                    execOptionsRef.current = Object.create(null);
                    internalState.forceUpdateState();
                }
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
    var execute = React__namespace.useCallback(function (executeOptions) {
        execOptionsRef.current =
            executeOptions ? tslib.__assign(tslib.__assign({}, executeOptions), { fetchPolicy: executeOptions.fetchPolicy || initialFetchPolicy }) : {
                fetchPolicy: initialFetchPolicy,
            };
        var options = utilities.mergeOptions(optionsRef.current, tslib.__assign({ query: queryRef.current }, execOptionsRef.current));
        var promise = internalState
            .executeQuery(tslib.__assign(tslib.__assign({}, options), { skip: false }))
            .then(function (queryResult) { return Object.assign(queryResult, eagerMethods); });
        promise.catch(function () { });
        return promise;
    }, []);
    return [execute, result];
}

function useMutation(mutation, options) {
    var client = useApolloClient(options === null || options === void 0 ? void 0 : options.client);
    parser.verifyDocumentType(mutation, parser.DocumentType.Mutation);
    var _a = React__namespace.useState({
        called: false,
        loading: false,
        client: client,
    }), result = _a[0], setResult = _a[1];
    var ref = React__namespace.useRef({
        result: result,
        mutationId: 0,
        isMounted: true,
        client: client,
        mutation: mutation,
        options: options,
    });
    {
        Object.assign(ref.current, { client: client, options: options, mutation: mutation });
    }
    var execute = React__namespace.useCallback(function (executeOptions) {
        if (executeOptions === void 0) { executeOptions = {}; }
        var _a = ref.current, options = _a.options, mutation = _a.mutation;
        var baseOptions = tslib.__assign(tslib.__assign({}, options), { mutation: mutation });
        var client = executeOptions.client || ref.current.client;
        if (!ref.current.result.loading &&
            !baseOptions.ignoreResults &&
            ref.current.isMounted) {
            setResult((ref.current.result = {
                loading: true,
                error: void 0,
                data: void 0,
                called: true,
                client: client,
            }));
        }
        var mutationId = ++ref.current.mutationId;
        var clientOptions = utilities.mergeOptions(baseOptions, executeOptions);
        return client
            .mutate(clientOptions)
            .then(function (response) {
            var _a, _b;
            var data = response.data, errors$1 = response.errors;
            var error = errors$1 && errors$1.length > 0 ?
                new errors.ApolloError({ graphQLErrors: errors$1 })
                : void 0;
            var onError = executeOptions.onError || ((_a = ref.current.options) === null || _a === void 0 ? void 0 : _a.onError);
            if (error && onError) {
                onError(error, clientOptions);
            }
            if (mutationId === ref.current.mutationId &&
                !clientOptions.ignoreResults) {
                var result_1 = {
                    called: true,
                    loading: false,
                    data: data,
                    error: error,
                    client: client,
                };
                if (ref.current.isMounted && !equality.equal(ref.current.result, result_1)) {
                    setResult((ref.current.result = result_1));
                }
            }
            var onCompleted = executeOptions.onCompleted || ((_b = ref.current.options) === null || _b === void 0 ? void 0 : _b.onCompleted);
            if (!error) {
                onCompleted === null || onCompleted === void 0 ? void 0 : onCompleted(response.data, clientOptions);
            }
            return response;
        })
            .catch(function (error) {
            var _a;
            if (mutationId === ref.current.mutationId && ref.current.isMounted) {
                var result_2 = {
                    loading: false,
                    error: error,
                    data: void 0,
                    called: true,
                    client: client,
                };
                if (!equality.equal(ref.current.result, result_2)) {
                    setResult((ref.current.result = result_2));
                }
            }
            var onError = executeOptions.onError || ((_a = ref.current.options) === null || _a === void 0 ? void 0 : _a.onError);
            if (onError) {
                onError(error, clientOptions);
                return { data: void 0, errors: error };
            }
            throw error;
        });
    }, []);
    var reset = React__namespace.useCallback(function () {
        if (ref.current.isMounted) {
            var result_3 = { called: false, loading: false, client: client };
            Object.assign(ref.current, { mutationId: 0, result: result_3 });
            setResult(result_3);
        }
    }, []);
    React__namespace.useEffect(function () {
        ref.current.isMounted = true;
        return function () {
            ref.current.isMounted = false;
        };
    }, []);
    return [execute, tslib.__assign({ reset: reset }, result)];
}

function useSubscription(subscription, options) {
    var hasIssuedDeprecationWarningRef = React__namespace.useRef(false);
    var client = useApolloClient(options === null || options === void 0 ? void 0 : options.client);
    parser.verifyDocumentType(subscription, parser.DocumentType.Subscription);
    var _a = React__namespace.useState({
        loading: !(options === null || options === void 0 ? void 0 : options.skip),
        error: void 0,
        data: void 0,
        variables: options === null || options === void 0 ? void 0 : options.variables,
    }), result = _a[0], setResult = _a[1];
    if (!hasIssuedDeprecationWarningRef.current) {
        hasIssuedDeprecationWarningRef.current = true;
        if (options === null || options === void 0 ? void 0 : options.onSubscriptionData) {
            globalThis.__DEV__ !== false && globals.invariant.warn(options.onData ? 52 : 53);
        }
        if (options === null || options === void 0 ? void 0 : options.onSubscriptionComplete) {
            globalThis.__DEV__ !== false && globals.invariant.warn(options.onComplete ? 54 : 55);
        }
    }
    var _b = React__namespace.useState(function () {
        if (options === null || options === void 0 ? void 0 : options.skip) {
            return null;
        }
        return client.subscribe({
            query: subscription,
            variables: options === null || options === void 0 ? void 0 : options.variables,
            fetchPolicy: options === null || options === void 0 ? void 0 : options.fetchPolicy,
            context: options === null || options === void 0 ? void 0 : options.context,
        });
    }), observable = _b[0], setObservable = _b[1];
    var canResetObservableRef = React__namespace.useRef(false);
    React__namespace.useEffect(function () {
        return function () {
            canResetObservableRef.current = true;
        };
    }, []);
    var ref = React__namespace.useRef({ client: client, subscription: subscription, options: options });
    React__namespace.useEffect(function () {
        var _a, _b, _c, _d;
        var shouldResubscribe = options === null || options === void 0 ? void 0 : options.shouldResubscribe;
        if (typeof shouldResubscribe === "function") {
            shouldResubscribe = !!shouldResubscribe(options);
        }
        if (options === null || options === void 0 ? void 0 : options.skip) {
            if (!(options === null || options === void 0 ? void 0 : options.skip) !== !((_a = ref.current.options) === null || _a === void 0 ? void 0 : _a.skip) ||
                canResetObservableRef.current) {
                setResult({
                    loading: false,
                    data: void 0,
                    error: void 0,
                    variables: options === null || options === void 0 ? void 0 : options.variables,
                });
                setObservable(null);
                canResetObservableRef.current = false;
            }
        }
        else if ((shouldResubscribe !== false &&
            (client !== ref.current.client ||
                subscription !== ref.current.subscription ||
                (options === null || options === void 0 ? void 0 : options.fetchPolicy) !== ((_b = ref.current.options) === null || _b === void 0 ? void 0 : _b.fetchPolicy) ||
                !(options === null || options === void 0 ? void 0 : options.skip) !== !((_c = ref.current.options) === null || _c === void 0 ? void 0 : _c.skip) ||
                !equality.equal(options === null || options === void 0 ? void 0 : options.variables, (_d = ref.current.options) === null || _d === void 0 ? void 0 : _d.variables))) ||
            canResetObservableRef.current) {
            setResult({
                loading: true,
                data: void 0,
                error: void 0,
                variables: options === null || options === void 0 ? void 0 : options.variables,
            });
            setObservable(client.subscribe({
                query: subscription,
                variables: options === null || options === void 0 ? void 0 : options.variables,
                fetchPolicy: options === null || options === void 0 ? void 0 : options.fetchPolicy,
                context: options === null || options === void 0 ? void 0 : options.context,
            }));
            canResetObservableRef.current = false;
        }
        Object.assign(ref.current, { client: client, subscription: subscription, options: options });
    }, [client, subscription, options, canResetObservableRef.current]);
    React__namespace.useEffect(function () {
        if (!observable) {
            return;
        }
        var subscriptionStopped = false;
        var subscription = observable.subscribe({
            next: function (fetchResult) {
                var _a, _b;
                if (subscriptionStopped) {
                    return;
                }
                var result = {
                    loading: false,
                    data: fetchResult.data,
                    error: void 0,
                    variables: options === null || options === void 0 ? void 0 : options.variables,
                };
                setResult(result);
                if ((_a = ref.current.options) === null || _a === void 0 ? void 0 : _a.onData) {
                    ref.current.options.onData({
                        client: client,
                        data: result,
                    });
                }
                else if ((_b = ref.current.options) === null || _b === void 0 ? void 0 : _b.onSubscriptionData) {
                    ref.current.options.onSubscriptionData({
                        client: client,
                        subscriptionData: result,
                    });
                }
            },
            error: function (error) {
                var _a, _b;
                if (!subscriptionStopped) {
                    setResult({
                        loading: false,
                        data: void 0,
                        error: error,
                        variables: options === null || options === void 0 ? void 0 : options.variables,
                    });
                    (_b = (_a = ref.current.options) === null || _a === void 0 ? void 0 : _a.onError) === null || _b === void 0 ? void 0 : _b.call(_a, error);
                }
            },
            complete: function () {
                var _a, _b;
                if (!subscriptionStopped) {
                    if ((_a = ref.current.options) === null || _a === void 0 ? void 0 : _a.onComplete) {
                        ref.current.options.onComplete();
                    }
                    else if ((_b = ref.current.options) === null || _b === void 0 ? void 0 : _b.onSubscriptionComplete) {
                        ref.current.options.onSubscriptionComplete();
                    }
                }
            },
        });
        return function () {
            subscriptionStopped = true;
            setTimeout(function () {
                subscription.unsubscribe();
            });
        };
    }, [observable]);
    return result;
}

function useReactiveVar(rv) {
    return useSyncExternalStore(React__namespace.useCallback(function (update) {
        return rv.onNextChange(function onNext() {
            update();
            rv.onNextChange(onNext);
        });
    }, [rv]), rv, rv);
}

function useFragment(options) {
    var cache = useApolloClient().cache;
    var fragment = options.fragment, fragmentName = options.fragmentName, from = options.from, _a = options.optimistic, optimistic = _a === void 0 ? true : _a, rest = tslib.__rest(options, ["fragment", "fragmentName", "from", "optimistic"]);
    var diffOptions = tslib.__assign(tslib.__assign({}, rest), { returnPartialData: true, id: typeof from === "string" ? from : cache.identify(from), query: cache["getFragmentDoc"](fragment, fragmentName), optimistic: optimistic });
    var resultRef = React__namespace.useRef();
    var latestDiff = cache.diff(diffOptions);
    var getSnapshot = function () {
        var latestDiffToResult = diffToResult(latestDiff);
        return (resultRef.current &&
            equality.equal(resultRef.current.data, latestDiffToResult.data)) ?
            resultRef.current
            : (resultRef.current = latestDiffToResult);
    };
    return useSyncExternalStore(function (forceUpdate) {
        var lastTimeout = 0;
        var unsubcribe = cache.watch(tslib.__assign(tslib.__assign({}, diffOptions), { immediate: true, callback: function (diff) {
                if (!equality.equal(diff, latestDiff)) {
                    resultRef.current = diffToResult((latestDiff = diff));
                    lastTimeout = setTimeout(forceUpdate);
                }
            } }));
        return function () {
            unsubcribe();
            clearTimeout(lastTimeout);
        };
    }, getSnapshot, getSnapshot);
}
function diffToResult(diff) {
    var result = {
        data: diff.result,
        complete: !!diff.complete,
    };
    if (diff.missing) {
        result.missing = utilities.mergeDeepArray(diff.missing.map(function (error) { return error.missing; }));
    }
    return result;
}

function useDeepMemo(memoFn, deps) {
    var ref = React__namespace.useRef();
    if (!ref.current || !equality.equal(ref.current.deps, deps)) {
        ref.current = { value: memoFn(), deps: deps };
    }
    return ref.current.value;
}

var useKey = "use";
var realHook = React__namespace[useKey];
var __use = realHook ||
    function __use(promise) {
        var statefulPromise = utilities.wrapPromiseWithState(promise);
        switch (statefulPromise.status) {
            case "pending":
                throw statefulPromise;
            case "rejected":
                throw statefulPromise.reason;
            case "fulfilled":
                return statefulPromise.value;
        }
    };

var QUERY_REFERENCE_SYMBOL = Symbol();
function wrapQueryRef(internalQueryRef) {
    var _a;
    return _a = {}, _a[QUERY_REFERENCE_SYMBOL] = internalQueryRef, _a;
}
function unwrapQueryRef(queryRef) {
    return queryRef[QUERY_REFERENCE_SYMBOL];
}
var OBSERVED_CHANGED_OPTIONS = [
    "canonizeResults",
    "context",
    "errorPolicy",
    "fetchPolicy",
    "refetchWritePolicy",
    "returnPartialData",
];
var InternalQueryReference =  (function () {
    function InternalQueryReference(observable, options) {
        var _this = this;
        this.listeners = new Set();
        this.status = "loading";
        this.references = 0;
        this.handleNext = this.handleNext.bind(this);
        this.handleError = this.handleError.bind(this);
        this.dispose = this.dispose.bind(this);
        this.observable = observable;
        this.result = observable.getCurrentResult(false);
        this.key = options.key;
        if (options.onDispose) {
            this.onDispose = options.onDispose;
        }
        if (core.isNetworkRequestSettled(this.result.networkStatus) ||
            (this.result.data &&
                (!this.result.partial || this.watchQueryOptions.returnPartialData))) {
            this.promise = utilities.createFulfilledPromise(this.result);
            this.status = "idle";
        }
        else {
            this.promise = new Promise(function (resolve, reject) {
                _this.resolve = resolve;
                _this.reject = reject;
            });
        }
        this.subscription = observable
            .filter(function (_a) {
            var data = _a.data;
            return !equality.equal(data, {});
        })
            .subscribe({
            next: this.handleNext,
            error: this.handleError,
        });
        var startDisposeTimer = function () {
            var _a;
            if (!_this.references) {
                _this.autoDisposeTimeoutId = setTimeout(_this.dispose, (_a = options.autoDisposeTimeoutMs) !== null && _a !== void 0 ? _a : 30000);
            }
        };
        this.promise.then(startDisposeTimer, startDisposeTimer);
    }
    Object.defineProperty(InternalQueryReference.prototype, "watchQueryOptions", {
        get: function () {
            return this.observable.options;
        },
        enumerable: false,
        configurable: true
    });
    InternalQueryReference.prototype.retain = function () {
        var _this = this;
        this.references++;
        clearTimeout(this.autoDisposeTimeoutId);
        var disposed = false;
        return function () {
            if (disposed) {
                return;
            }
            disposed = true;
            _this.references--;
            setTimeout(function () {
                if (!_this.references) {
                    _this.dispose();
                }
            });
        };
    };
    InternalQueryReference.prototype.didChangeOptions = function (watchQueryOptions) {
        var _this = this;
        return OBSERVED_CHANGED_OPTIONS.some(function (option) {
            return !equality.equal(_this.watchQueryOptions[option], watchQueryOptions[option]);
        });
    };
    InternalQueryReference.prototype.applyOptions = function (watchQueryOptions) {
        var _a = this.watchQueryOptions, currentFetchPolicy = _a.fetchPolicy, currentCanonizeResults = _a.canonizeResults;
        if (currentFetchPolicy === "standby" &&
            currentFetchPolicy !== watchQueryOptions.fetchPolicy) {
            this.initiateFetch(this.observable.reobserve(watchQueryOptions));
        }
        else {
            this.observable.silentSetOptions(watchQueryOptions);
            if (currentCanonizeResults !== watchQueryOptions.canonizeResults) {
                this.result = tslib.__assign(tslib.__assign({}, this.result), this.observable.getCurrentResult());
                this.promise = utilities.createFulfilledPromise(this.result);
            }
        }
        return this.promise;
    };
    InternalQueryReference.prototype.listen = function (listener) {
        var _this = this;
        this.listeners.add(listener);
        return function () {
            _this.listeners.delete(listener);
        };
    };
    InternalQueryReference.prototype.refetch = function (variables) {
        return this.initiateFetch(this.observable.refetch(variables));
    };
    InternalQueryReference.prototype.fetchMore = function (options) {
        return this.initiateFetch(this.observable.fetchMore(options));
    };
    InternalQueryReference.prototype.dispose = function () {
        this.subscription.unsubscribe();
        this.onDispose();
    };
    InternalQueryReference.prototype.onDispose = function () {
    };
    InternalQueryReference.prototype.handleNext = function (result) {
        var _a;
        switch (this.status) {
            case "loading": {
                if (result.data === void 0) {
                    result.data = this.result.data;
                }
                this.status = "idle";
                this.result = result;
                (_a = this.resolve) === null || _a === void 0 ? void 0 : _a.call(this, result);
                break;
            }
            case "idle": {
                if (result.data === this.result.data) {
                    return;
                }
                if (result.data === void 0) {
                    result.data = this.result.data;
                }
                this.result = result;
                this.promise = utilities.createFulfilledPromise(result);
                this.deliver(this.promise);
                break;
            }
        }
    };
    InternalQueryReference.prototype.handleError = function (error) {
        var _a;
        this.subscription.unsubscribe();
        this.subscription = this.observable.resubscribeAfterError(this.handleNext, this.handleError);
        switch (this.status) {
            case "loading": {
                this.status = "idle";
                (_a = this.reject) === null || _a === void 0 ? void 0 : _a.call(this, error);
                break;
            }
            case "idle": {
                this.promise = utilities.createRejectedPromise(error);
                this.deliver(this.promise);
            }
        }
    };
    InternalQueryReference.prototype.deliver = function (promise) {
        this.listeners.forEach(function (listener) { return listener(promise); });
    };
    InternalQueryReference.prototype.initiateFetch = function (returnedPromise) {
        var _this = this;
        this.status = "loading";
        this.promise = new Promise(function (resolve, reject) {
            _this.resolve = resolve;
            _this.reject = reject;
        });
        this.promise.catch(function () { });
        returnedPromise
            .then(function (result) {
            var _a;
            if (_this.status === "loading") {
                _this.status = "idle";
                _this.result = result;
                (_a = _this.resolve) === null || _a === void 0 ? void 0 : _a.call(_this, result);
            }
        })
            .catch(function () { });
        return returnedPromise;
    };
    return InternalQueryReference;
}());

var SuspenseCache =  (function () {
    function SuspenseCache(options) {
        if (options === void 0) { options = Object.create(null); }
        this.queryRefs = new trie.Trie(utilities.canUseWeakMap);
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

var suspenseCacheSymbol = Symbol.for("apollo.suspenseCache");
function getSuspenseCache(client) {
    var _a;
    if (!client[suspenseCacheSymbol]) {
        client[suspenseCacheSymbol] = new SuspenseCache((_a = client.defaultOptions.react) === null || _a === void 0 ? void 0 : _a.suspense);
    }
    return client[suspenseCacheSymbol];
}

var skipToken = Symbol.for("apollo.skipToken");

function useSuspenseQuery(query, options) {
    if (options === void 0) { options = Object.create(null); }
    var client = useApolloClient(options.client);
    var suspenseCache = getSuspenseCache(client);
    var watchQueryOptions = useWatchQueryOptions({
        client: client,
        query: query,
        options: options,
    });
    var fetchPolicy = watchQueryOptions.fetchPolicy, variables = watchQueryOptions.variables;
    var _a = options.queryKey, queryKey = _a === void 0 ? [] : _a;
    var cacheKey = tslib.__spreadArray([
        query,
        cache.canonicalStringify(variables)
    ], [].concat(queryKey), true);
    var queryRef = suspenseCache.getQueryRef(cacheKey, function () {
        return client.watchQuery(watchQueryOptions);
    });
    var _b = React__namespace.useState(function () { return new Map([[queryRef.key, queryRef.promise]]); }), promiseCache = _b[0], setPromiseCache = _b[1];
    var promise = promiseCache.get(queryRef.key);
    if (queryRef.didChangeOptions(watchQueryOptions)) {
        promise = queryRef.applyOptions(watchQueryOptions);
        promiseCache.set(queryRef.key, promise);
    }
    if (!promise) {
        promise = queryRef.promise;
        promiseCache.set(queryRef.key, promise);
    }
    React__namespace.useEffect(function () {
        var dispose = queryRef.retain();
        var removeListener = queryRef.listen(function (promise) {
            setPromiseCache(function (promiseCache) {
                return new Map(promiseCache).set(queryRef.key, promise);
            });
        });
        return function () {
            removeListener();
            dispose();
        };
    }, [queryRef]);
    var skipResult = React__namespace.useMemo(function () {
        var error = toApolloError(queryRef.result);
        return {
            loading: false,
            data: queryRef.result.data,
            networkStatus: error ? core.NetworkStatus.error : core.NetworkStatus.ready,
            error: error,
        };
    }, [queryRef.result]);
    var result = fetchPolicy === "standby" ? skipResult : __use(promise);
    var fetchMore = React__namespace.useCallback((function (options) {
        var promise = queryRef.fetchMore(options);
        setPromiseCache(function (previousPromiseCache) {
            return new Map(previousPromiseCache).set(queryRef.key, queryRef.promise);
        });
        return promise;
    }), [queryRef]);
    var refetch = React__namespace.useCallback(function (variables) {
        var promise = queryRef.refetch(variables);
        setPromiseCache(function (previousPromiseCache) {
            return new Map(previousPromiseCache).set(queryRef.key, queryRef.promise);
        });
        return promise;
    }, [queryRef]);
    var subscribeToMore = React__namespace.useCallback(function (options) { return queryRef.observable.subscribeToMore(options); }, [queryRef]);
    return React__namespace.useMemo(function () {
        return {
            client: client,
            data: result.data,
            error: toApolloError(result),
            networkStatus: result.networkStatus,
            fetchMore: fetchMore,
            refetch: refetch,
            subscribeToMore: subscribeToMore,
        };
    }, [client, fetchMore, refetch, result, subscribeToMore]);
}
function validateOptions(options) {
    var query = options.query, fetchPolicy = options.fetchPolicy, returnPartialData = options.returnPartialData;
    parser.verifyDocumentType(query, parser.DocumentType.Query);
    validateFetchPolicy(fetchPolicy);
    validatePartialDataReturn(fetchPolicy, returnPartialData);
}
function validateFetchPolicy(fetchPolicy) {
    if (fetchPolicy === void 0) { fetchPolicy = "cache-first"; }
    var supportedFetchPolicies = [
        "cache-first",
        "network-only",
        "no-cache",
        "cache-and-network",
    ];
    globals.invariant(supportedFetchPolicies.includes(fetchPolicy), 56, fetchPolicy);
}
function validatePartialDataReturn(fetchPolicy, returnPartialData) {
    if (fetchPolicy === "no-cache" && returnPartialData) {
        globalThis.__DEV__ !== false && globals.invariant.warn(57);
    }
}
function toApolloError(result) {
    return utilities.isNonEmptyArray(result.errors) ?
        new core.ApolloError({ graphQLErrors: result.errors })
        : result.error;
}
function useWatchQueryOptions(_a) {
    var client = _a.client, query = _a.query, options = _a.options;
    return useDeepMemo(function () {
        var _a;
        if (options === skipToken) {
            return { query: query, fetchPolicy: "standby" };
        }
        var fetchPolicy = options.fetchPolicy ||
            ((_a = client.defaultOptions.watchQuery) === null || _a === void 0 ? void 0 : _a.fetchPolicy) ||
            "cache-first";
        var watchQueryOptions = tslib.__assign(tslib.__assign({}, options), { fetchPolicy: fetchPolicy, query: query, notifyOnNetworkStatusChange: false, nextFetchPolicy: void 0 });
        if (globalThis.__DEV__ !== false) {
            validateOptions(watchQueryOptions);
        }
        if (options.skip) {
            watchQueryOptions.fetchPolicy = "standby";
        }
        return watchQueryOptions;
    }, [client, options, query]);
}

function useBackgroundQuery(query, options) {
    if (options === void 0) { options = Object.create(null); }
    var client = useApolloClient(options.client);
    var suspenseCache = getSuspenseCache(client);
    var watchQueryOptions = useWatchQueryOptions({ client: client, query: query, options: options });
    var fetchPolicy = watchQueryOptions.fetchPolicy, variables = watchQueryOptions.variables;
    var _a = options.queryKey, queryKey = _a === void 0 ? [] : _a;
    var didFetchResult = React__namespace.useRef(fetchPolicy !== "standby");
    didFetchResult.current || (didFetchResult.current = fetchPolicy !== "standby");
    var cacheKey = tslib.__spreadArray([
        query,
        cache.canonicalStringify(variables)
    ], [].concat(queryKey), true);
    var queryRef = suspenseCache.getQueryRef(cacheKey, function () {
        return client.watchQuery(watchQueryOptions);
    });
    var _b = React__namespace.useState(function () { return new Map([[queryRef.key, queryRef.promise]]); }), promiseCache = _b[0], setPromiseCache = _b[1];
    if (queryRef.didChangeOptions(watchQueryOptions)) {
        var promise = queryRef.applyOptions(watchQueryOptions);
        promiseCache.set(queryRef.key, promise);
    }
    React__namespace.useEffect(function () { return queryRef.retain(); }, [queryRef]);
    var fetchMore = React__namespace.useCallback(function (options) {
        var promise = queryRef.fetchMore(options);
        setPromiseCache(function (promiseCache) {
            return new Map(promiseCache).set(queryRef.key, queryRef.promise);
        });
        return promise;
    }, [queryRef]);
    var refetch = React__namespace.useCallback(function (variables) {
        var promise = queryRef.refetch(variables);
        setPromiseCache(function (promiseCache) {
            return new Map(promiseCache).set(queryRef.key, queryRef.promise);
        });
        return promise;
    }, [queryRef]);
    queryRef.promiseCache = promiseCache;
    var wrappedQueryRef = React__namespace.useMemo(function () { return wrapQueryRef(queryRef); }, [queryRef]);
    return [
        didFetchResult.current ? wrappedQueryRef : void 0,
        { fetchMore: fetchMore, refetch: refetch },
    ];
}

function useReadQuery(queryRef) {
    var internalQueryRef = unwrapQueryRef(queryRef);
    globals.invariant(internalQueryRef.promiseCache, 51);
    var promiseCache = internalQueryRef.promiseCache, key = internalQueryRef.key;
    if (!promiseCache.has(key)) {
        promiseCache.set(key, internalQueryRef.promise);
    }
    var promise = useSyncExternalStore(React__namespace.useCallback(function (forceUpdate) {
        return internalQueryRef.listen(function (promise) {
            internalQueryRef.promiseCache.set(internalQueryRef.key, promise);
            forceUpdate();
        });
    }, [internalQueryRef]), function () { return promiseCache.get(key); }, function () { return promiseCache.get(key); });
    var result = __use(promise);
    return React__namespace.useMemo(function () {
        return {
            data: result.data,
            networkStatus: result.networkStatus,
            error: toApolloError(result),
        };
    }, [result]);
}

exports.skipToken = skipToken;
exports.useApolloClient = useApolloClient;
exports.useBackgroundQuery = useBackgroundQuery;
exports.useFragment = useFragment;
exports.useLazyQuery = useLazyQuery;
exports.useMutation = useMutation;
exports.useQuery = useQuery;
exports.useReactiveVar = useReactiveVar;
exports.useReadQuery = useReadQuery;
exports.useSubscription = useSubscription;
exports.useSuspenseQuery = useSuspenseQuery;
//# sourceMappingURL=hooks.cjs.map
