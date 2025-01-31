import { __assign, __extends } from "tslib";
import { invariant } from "../utilities/globals/index.js";
import { equal } from "@wry/equality";
import { NetworkStatus, isNetworkRequestInFlight } from "./networkStatus.js";
import { cloneDeep, compact, getOperationDefinition, Observable, iterateObserversSafely, fixObservableSubclass, getQueryDefinition, } from "../utilities/index.js";
import { equalByQuery } from "./equalByQuery.js";
var assign = Object.assign, hasOwnProperty = Object.hasOwnProperty;
var ObservableQuery = /** @class */ (function (_super) {
    __extends(ObservableQuery, _super);
    function ObservableQuery(_a) {
        var queryManager = _a.queryManager, queryInfo = _a.queryInfo, options = _a.options;
        var _this = _super.call(this, function (observer) {
            // Zen Observable has its own error function, so in order to log correctly
            // we need to provide a custom error callback.
            try {
                var subObserver = observer._subscription._observer;
                if (subObserver && !subObserver.error) {
                    subObserver.error = defaultSubscriptionObserverErrorCallback;
                }
            }
            catch (_a) { }
            var first = !_this.observers.size;
            _this.observers.add(observer);
            // Deliver most recent error or result.
            var last = _this.last;
            if (last && last.error) {
                observer.error && observer.error(last.error);
            }
            else if (last && last.result) {
                observer.next && observer.next(last.result);
            }
            // Initiate observation of this query if it hasn't been reported to
            // the QueryManager yet.
            if (first) {
                // Blindly catching here prevents unhandled promise rejections,
                // and is safe because the ObservableQuery handles this error with
                // this.observer.error, so we're not just swallowing the error by
                // ignoring it here.
                _this.reobserve().catch(function () { });
            }
            return function () {
                if (_this.observers.delete(observer) && !_this.observers.size) {
                    _this.tearDownQuery();
                }
            };
        }) || this;
        _this.observers = new Set();
        _this.subscriptions = new Set();
        // related classes
        _this.queryInfo = queryInfo;
        _this.queryManager = queryManager;
        // active state
        _this.waitForOwnResult = skipCacheDataFor(options.fetchPolicy);
        _this.isTornDown = false;
        var _b = queryManager.defaultOptions.watchQuery, _c = _b === void 0 ? {} : _b, _d = _c.fetchPolicy, defaultFetchPolicy = _d === void 0 ? "cache-first" : _d;
        var _e = options.fetchPolicy, fetchPolicy = _e === void 0 ? defaultFetchPolicy : _e, 
        // Make sure we don't store "standby" as the initialFetchPolicy.
        _f = options.initialFetchPolicy, 
        // Make sure we don't store "standby" as the initialFetchPolicy.
        initialFetchPolicy = _f === void 0 ? fetchPolicy === "standby" ? defaultFetchPolicy : (fetchPolicy) : _f;
        _this.options = __assign(__assign({}, options), { 
            // Remember the initial options.fetchPolicy so we can revert back to this
            // policy when variables change. This information can also be specified
            // (or overridden) by providing options.initialFetchPolicy explicitly.
            initialFetchPolicy: initialFetchPolicy, 
            // This ensures this.options.fetchPolicy always has a string value, in
            // case options.fetchPolicy was not provided.
            fetchPolicy: fetchPolicy });
        _this.queryId = queryInfo.queryId || queryManager.generateQueryId();
        var opDef = getOperationDefinition(_this.query);
        _this.queryName = opDef && opDef.name && opDef.name.value;
        return _this;
    }
    Object.defineProperty(ObservableQuery.prototype, "query", {
        // The `query` computed property will always reflect the document transformed
        // by the last run query. `this.options.query` will always reflect the raw
        // untransformed query to ensure document transforms with runtime conditionals
        // are run on the original document.
        get: function () {
            return this.lastQuery || this.options.query;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ObservableQuery.prototype, "variables", {
        // Computed shorthand for this.options.variables, preserved for
        // backwards compatibility.
        get: function () {
            return this.options.variables;
        },
        enumerable: false,
        configurable: true
    });
    ObservableQuery.prototype.result = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // TODO: this code doesn’t actually make sense insofar as the observer
            // will never exist in this.observers due how zen-observable wraps observables.
            // https://github.com/zenparsing/zen-observable/blob/master/src/Observable.js#L169
            var observer = {
                next: function (result) {
                    resolve(result);
                    // Stop the query within the QueryManager if we can before
                    // this function returns.
                    //
                    // We do this in order to prevent observers piling up within
                    // the QueryManager. Notice that we only fully unsubscribe
                    // from the subscription in a setTimeout(..., 0)  call. This call can
                    // actually be handled by the browser at a much later time. If queries
                    // are fired in the meantime, observers that should have been removed
                    // from the QueryManager will continue to fire, causing an unnecessary
                    // performance hit.
                    _this.observers.delete(observer);
                    if (!_this.observers.size) {
                        _this.queryManager.removeQuery(_this.queryId);
                    }
                    setTimeout(function () {
                        subscription.unsubscribe();
                    }, 0);
                },
                error: reject,
            };
            var subscription = _this.subscribe(observer);
        });
    };
    ObservableQuery.prototype.getCurrentResult = function (saveAsLastResult) {
        if (saveAsLastResult === void 0) { saveAsLastResult = true; }
        // Use the last result as long as the variables match this.variables.
        var lastResult = this.getLastResult(true);
        var networkStatus = this.queryInfo.networkStatus ||
            (lastResult && lastResult.networkStatus) ||
            NetworkStatus.ready;
        var result = __assign(__assign({}, lastResult), { loading: isNetworkRequestInFlight(networkStatus), networkStatus: networkStatus });
        var _a = this.options.fetchPolicy, fetchPolicy = _a === void 0 ? "cache-first" : _a;
        if (
        // These fetch policies should never deliver data from the cache, unless
        // redelivering a previously delivered result.
        skipCacheDataFor(fetchPolicy) ||
            // If this.options.query has @client(always: true) fields, we cannot
            // trust diff.result, since it was read from the cache without running
            // local resolvers (and it's too late to run resolvers now, since we must
            // return a result synchronously).
            this.queryManager.getDocumentInfo(this.query).hasForcedResolvers) {
            // Fall through.
        }
        else if (this.waitForOwnResult) {
            // This would usually be a part of `QueryInfo.getDiff()`.
            // which we skip in the waitForOwnResult case since we are not
            // interested in the diff.
            this.queryInfo["updateWatch"]();
        }
        else {
            var diff = this.queryInfo.getDiff();
            if (diff.complete || this.options.returnPartialData) {
                result.data = diff.result;
            }
            if (equal(result.data, {})) {
                result.data = void 0;
            }
            if (diff.complete) {
                // Similar to setting result.partial to false, but taking advantage of the
                // falsiness of missing fields.
                delete result.partial;
                // If the diff is complete, and we're using a FetchPolicy that
                // terminates after a complete cache read, we can assume the next result
                // we receive will have NetworkStatus.ready and !loading.
                if (diff.complete &&
                    result.networkStatus === NetworkStatus.loading &&
                    (fetchPolicy === "cache-first" || fetchPolicy === "cache-only")) {
                    result.networkStatus = NetworkStatus.ready;
                    result.loading = false;
                }
            }
            else {
                result.partial = true;
            }
            if (globalThis.__DEV__ !== false &&
                !diff.complete &&
                !this.options.partialRefetch &&
                !result.loading &&
                !result.data &&
                !result.error) {
                logMissingFieldErrors(diff.missing);
            }
        }
        if (saveAsLastResult) {
            this.updateLastResult(result);
        }
        return result;
    };
    // Compares newResult to the snapshot we took of this.lastResult when it was
    // first received.
    ObservableQuery.prototype.isDifferentFromLastResult = function (newResult, variables) {
        if (!this.last) {
            return true;
        }
        var resultIsDifferent = this.queryManager.getDocumentInfo(this.query).hasNonreactiveDirective ?
            !equalByQuery(this.query, this.last.result, newResult, this.variables)
            : !equal(this.last.result, newResult);
        return (resultIsDifferent || (variables && !equal(this.last.variables, variables)));
    };
    ObservableQuery.prototype.getLast = function (key, variablesMustMatch) {
        var last = this.last;
        if (last &&
            last[key] &&
            (!variablesMustMatch || equal(last.variables, this.variables))) {
            return last[key];
        }
    };
    ObservableQuery.prototype.getLastResult = function (variablesMustMatch) {
        return this.getLast("result", variablesMustMatch);
    };
    ObservableQuery.prototype.getLastError = function (variablesMustMatch) {
        return this.getLast("error", variablesMustMatch);
    };
    ObservableQuery.prototype.resetLastResults = function () {
        delete this.last;
        this.isTornDown = false;
    };
    ObservableQuery.prototype.resetQueryStoreErrors = function () {
        this.queryManager.resetErrors(this.queryId);
    };
    /**
     * Update the variables of this observable query, and fetch the new results.
     * This method should be preferred over `setVariables` in most use cases.
     *
     * @param variables - The new set of variables. If there are missing variables,
     * the previous values of those variables will be used.
     */
    ObservableQuery.prototype.refetch = function (variables) {
        var _a;
        var reobserveOptions = {
            // Always disable polling for refetches.
            pollInterval: 0,
        };
        // Unless the provided fetchPolicy always consults the network
        // (no-cache, network-only, or cache-and-network), override it with
        // network-only to force the refetch for this fetchQuery call.
        var fetchPolicy = this.options.fetchPolicy;
        if (fetchPolicy === "cache-and-network") {
            reobserveOptions.fetchPolicy = fetchPolicy;
        }
        else if (fetchPolicy === "no-cache") {
            reobserveOptions.fetchPolicy = "no-cache";
        }
        else {
            reobserveOptions.fetchPolicy = "network-only";
        }
        if (globalThis.__DEV__ !== false && variables && hasOwnProperty.call(variables, "variables")) {
            var queryDef = getQueryDefinition(this.query);
            var vars = queryDef.variableDefinitions;
            if (!vars || !vars.some(function (v) { return v.variable.name.value === "variables"; })) {
                globalThis.__DEV__ !== false && invariant.warn(
                    20,
                    variables,
                    ((_a = queryDef.name) === null || _a === void 0 ? void 0 : _a.value) || queryDef
                );
            }
        }
        if (variables && !equal(this.options.variables, variables)) {
            // Update the existing options with new variables
            reobserveOptions.variables = this.options.variables = __assign(__assign({}, this.options.variables), variables);
        }
        this.queryInfo.resetLastWrite();
        return this.reobserve(reobserveOptions, NetworkStatus.refetch);
    };
    ObservableQuery.prototype.fetchMore = function (fetchMoreOptions) {
        var _this = this;
        var combinedOptions = __assign(__assign({}, (fetchMoreOptions.query ? fetchMoreOptions : (__assign(__assign(__assign(__assign({}, this.options), { query: this.options.query }), fetchMoreOptions), { variables: __assign(__assign({}, this.options.variables), fetchMoreOptions.variables) })))), { 
            // The fetchMore request goes immediately to the network and does
            // not automatically write its result to the cache (hence no-cache
            // instead of network-only), because we allow the caller of
            // fetchMore to provide an updateQuery callback that determines how
            // the data gets written to the cache.
            fetchPolicy: "no-cache" });
        combinedOptions.query = this.transformDocument(combinedOptions.query);
        var qid = this.queryManager.generateQueryId();
        // If a temporary query is passed to `fetchMore`, we don't want to store
        // it as the last query result since it may be an optimized query for
        // pagination. We will however run the transforms on the original document
        // as well as the document passed in `fetchMoreOptions` to ensure the cache
        // uses the most up-to-date document which may rely on runtime conditionals.
        this.lastQuery =
            fetchMoreOptions.query ?
                this.transformDocument(this.options.query)
                : combinedOptions.query;
        // Simulate a loading result for the original query with
        // result.networkStatus === NetworkStatus.fetchMore.
        var queryInfo = this.queryInfo;
        var originalNetworkStatus = queryInfo.networkStatus;
        queryInfo.networkStatus = NetworkStatus.fetchMore;
        if (combinedOptions.notifyOnNetworkStatusChange) {
            this.observe();
        }
        var updatedQuerySet = new Set();
        return this.queryManager
            .fetchQuery(qid, combinedOptions, NetworkStatus.fetchMore)
            .then(function (fetchMoreResult) {
            _this.queryManager.removeQuery(qid);
            if (queryInfo.networkStatus === NetworkStatus.fetchMore) {
                queryInfo.networkStatus = originalNetworkStatus;
            }
            // Performing this cache update inside a cache.batch transaction ensures
            // any affected cache.watch watchers are notified at most once about any
            // updates. Most watchers will be using the QueryInfo class, which
            // responds to notifications by calling reobserveCacheFirst to deliver
            // fetchMore cache results back to this ObservableQuery.
            _this.queryManager.cache.batch({
                update: function (cache) {
                    var updateQuery = fetchMoreOptions.updateQuery;
                    if (updateQuery) {
                        cache.updateQuery({
                            query: _this.query,
                            variables: _this.variables,
                            returnPartialData: true,
                            optimistic: false,
                        }, function (previous) {
                            return updateQuery(previous, {
                                fetchMoreResult: fetchMoreResult.data,
                                variables: combinedOptions.variables,
                            });
                        });
                    }
                    else {
                        // If we're using a field policy instead of updateQuery, the only
                        // thing we need to do is write the new data to the cache using
                        // combinedOptions.variables (instead of this.variables, which is
                        // what this.updateQuery uses, because it works by abusing the
                        // original field value, keyed by the original variables).
                        cache.writeQuery({
                            query: combinedOptions.query,
                            variables: combinedOptions.variables,
                            data: fetchMoreResult.data,
                        });
                    }
                },
                onWatchUpdated: function (watch) {
                    // Record the DocumentNode associated with any watched query whose
                    // data were updated by the cache writes above.
                    updatedQuerySet.add(watch.query);
                },
            });
            return fetchMoreResult;
        })
            .finally(function () {
            // In case the cache writes above did not generate a broadcast
            // notification (which would have been intercepted by onWatchUpdated),
            // likely because the written data were the same as what was already in
            // the cache, we still want fetchMore to deliver its final loading:false
            // result with the unchanged data.
            if (!updatedQuerySet.has(_this.query)) {
                reobserveCacheFirst(_this);
            }
        });
    };
    // XXX the subscription variables are separate from the query variables.
    // if you want to update subscription variables, right now you have to do that separately,
    // and you can only do it by stopping the subscription and then subscribing again with new variables.
    ObservableQuery.prototype.subscribeToMore = function (options) {
        var _this = this;
        var subscription = this.queryManager
            .startGraphQLSubscription({
            query: options.document,
            variables: options.variables,
            context: options.context,
        })
            .subscribe({
            next: function (subscriptionData) {
                var updateQuery = options.updateQuery;
                if (updateQuery) {
                    _this.updateQuery(function (previous, _a) {
                        var variables = _a.variables;
                        return updateQuery(previous, {
                            subscriptionData: subscriptionData,
                            variables: variables,
                        });
                    });
                }
            },
            error: function (err) {
                if (options.onError) {
                    options.onError(err);
                    return;
                }
                globalThis.__DEV__ !== false && invariant.error(21, err);
            },
        });
        this.subscriptions.add(subscription);
        return function () {
            if (_this.subscriptions.delete(subscription)) {
                subscription.unsubscribe();
            }
        };
    };
    ObservableQuery.prototype.setOptions = function (newOptions) {
        return this.reobserve(newOptions);
    };
    ObservableQuery.prototype.silentSetOptions = function (newOptions) {
        var mergedOptions = compact(this.options, newOptions || {});
        assign(this.options, mergedOptions);
    };
    /**
     * Update the variables of this observable query, and fetch the new results
     * if they've changed. Most users should prefer `refetch` instead of
     * `setVariables` in order to to be properly notified of results even when
     * they come from the cache.
     *
     * Note: the `next` callback will *not* fire if the variables have not changed
     * or if the result is coming from cache.
     *
     * Note: the promise will return the old results immediately if the variables
     * have not changed.
     *
     * Note: the promise will return null immediately if the query is not active
     * (there are no subscribers).
     *
     * @param variables - The new set of variables. If there are missing variables,
     * the previous values of those variables will be used.
     */
    ObservableQuery.prototype.setVariables = function (variables) {
        if (equal(this.variables, variables)) {
            // If we have no observers, then we don't actually want to make a network
            // request. As soon as someone observes the query, the request will kick
            // off. For now, we just store any changes. (See #1077)
            return this.observers.size ? this.result() : Promise.resolve();
        }
        this.options.variables = variables;
        // See comment above
        if (!this.observers.size) {
            return Promise.resolve();
        }
        return this.reobserve({
            // Reset options.fetchPolicy to its original value.
            fetchPolicy: this.options.initialFetchPolicy,
            variables: variables,
        }, NetworkStatus.setVariables);
    };
    ObservableQuery.prototype.updateQuery = function (mapFn) {
        var queryManager = this.queryManager;
        var result = queryManager.cache.diff({
            query: this.options.query,
            variables: this.variables,
            returnPartialData: true,
            optimistic: false,
        }).result;
        var newResult = mapFn(result, {
            variables: this.variables,
        });
        if (newResult) {
            queryManager.cache.writeQuery({
                query: this.options.query,
                data: newResult,
                variables: this.variables,
            });
            queryManager.broadcastQueries();
        }
    };
    ObservableQuery.prototype.startPolling = function (pollInterval) {
        this.options.pollInterval = pollInterval;
        this.updatePolling();
    };
    ObservableQuery.prototype.stopPolling = function () {
        this.options.pollInterval = 0;
        this.updatePolling();
    };
    // Update options.fetchPolicy according to options.nextFetchPolicy.
    ObservableQuery.prototype.applyNextFetchPolicy = function (reason, 
    // It's possible to use this method to apply options.nextFetchPolicy to
    // options.fetchPolicy even if options !== this.options, though that happens
    // most often when the options are temporary, used for only one request and
    // then thrown away, so nextFetchPolicy may not end up mattering.
    options) {
        if (options.nextFetchPolicy) {
            var _a = options.fetchPolicy, fetchPolicy = _a === void 0 ? "cache-first" : _a, _b = options.initialFetchPolicy, initialFetchPolicy = _b === void 0 ? fetchPolicy : _b;
            if (fetchPolicy === "standby") {
                // Do nothing, leaving options.fetchPolicy unchanged.
            }
            else if (typeof options.nextFetchPolicy === "function") {
                // When someone chooses "cache-and-network" or "network-only" as their
                // initial FetchPolicy, they often do not want future cache updates to
                // trigger unconditional network requests, which is what repeatedly
                // applying the "cache-and-network" or "network-only" policies would
                // seem to imply. Instead, when the cache reports an update after the
                // initial network request, it may be desirable for subsequent network
                // requests to be triggered only if the cache result is incomplete. To
                // that end, the options.nextFetchPolicy option provides an easy way to
                // update options.fetchPolicy after the initial network request, without
                // having to call observableQuery.setOptions.
                options.fetchPolicy = options.nextFetchPolicy(fetchPolicy, {
                    reason: reason,
                    options: options,
                    observable: this,
                    initialFetchPolicy: initialFetchPolicy,
                });
            }
            else if (reason === "variables-changed") {
                options.fetchPolicy = initialFetchPolicy;
            }
            else {
                options.fetchPolicy = options.nextFetchPolicy;
            }
        }
        return options.fetchPolicy;
    };
    ObservableQuery.prototype.fetch = function (options, newNetworkStatus, query) {
        // TODO Make sure we update the networkStatus (and infer fetchVariables)
        // before actually committing to the fetch.
        this.queryManager.setObservableQuery(this);
        return this.queryManager["fetchConcastWithInfo"](this.queryId, options, newNetworkStatus, query);
    };
    // Turns polling on or off based on this.options.pollInterval.
    ObservableQuery.prototype.updatePolling = function () {
        var _this = this;
        // Avoid polling in SSR mode
        if (this.queryManager.ssrMode) {
            return;
        }
        var _a = this, pollingInfo = _a.pollingInfo, pollInterval = _a.options.pollInterval;
        if (!pollInterval) {
            if (pollingInfo) {
                clearTimeout(pollingInfo.timeout);
                delete this.pollingInfo;
            }
            return;
        }
        if (pollingInfo && pollingInfo.interval === pollInterval) {
            return;
        }
        invariant(pollInterval, 22);
        var info = pollingInfo || (this.pollingInfo = {});
        info.interval = pollInterval;
        var maybeFetch = function () {
            if (_this.pollingInfo) {
                if (!isNetworkRequestInFlight(_this.queryInfo.networkStatus)) {
                    _this.reobserve({
                        // Most fetchPolicy options don't make sense to use in a polling context, as
                        // users wouldn't want to be polling the cache directly. However, network-only and
                        // no-cache are both useful for when the user wants to control whether or not the
                        // polled results are written to the cache.
                        fetchPolicy: _this.options.initialFetchPolicy === "no-cache" ?
                            "no-cache"
                            : "network-only",
                    }, NetworkStatus.poll).then(poll, poll);
                }
                else {
                    poll();
                }
            }
        };
        var poll = function () {
            var info = _this.pollingInfo;
            if (info) {
                clearTimeout(info.timeout);
                info.timeout = setTimeout(maybeFetch, info.interval);
            }
        };
        poll();
    };
    ObservableQuery.prototype.updateLastResult = function (newResult, variables) {
        if (variables === void 0) { variables = this.variables; }
        var error = this.getLastError();
        // Preserve this.last.error unless the variables have changed.
        if (error && this.last && !equal(variables, this.last.variables)) {
            error = void 0;
        }
        return (this.last = __assign({ result: this.queryManager.assumeImmutableResults ?
                newResult
                : cloneDeep(newResult), variables: variables }, (error ? { error: error } : null)));
    };
    ObservableQuery.prototype.reobserveAsConcast = function (newOptions, newNetworkStatus) {
        var _this = this;
        this.isTornDown = false;
        var useDisposableConcast = 
        // Refetching uses a disposable Concast to allow refetches using different
        // options/variables, without permanently altering the options of the
        // original ObservableQuery.
        newNetworkStatus === NetworkStatus.refetch ||
            // The fetchMore method does not actually call the reobserve method, but,
            // if it did, it would definitely use a disposable Concast.
            newNetworkStatus === NetworkStatus.fetchMore ||
            // Polling uses a disposable Concast so the polling options (which force
            // fetchPolicy to be "network-only" or "no-cache") won't override the original options.
            newNetworkStatus === NetworkStatus.poll;
        // Save the old variables, since Object.assign may modify them below.
        var oldVariables = this.options.variables;
        var oldFetchPolicy = this.options.fetchPolicy;
        var mergedOptions = compact(this.options, newOptions || {});
        var options = useDisposableConcast ?
            // Disposable Concast fetches receive a shallow copy of this.options
            // (merged with newOptions), leaving this.options unmodified.
            mergedOptions
            : assign(this.options, mergedOptions);
        // Don't update options.query with the transformed query to avoid
        // overwriting this.options.query when we aren't using a disposable concast.
        // We want to ensure we can re-run the custom document transforms the next
        // time a request is made against the original query.
        var query = this.transformDocument(options.query);
        this.lastQuery = query;
        if (!useDisposableConcast) {
            // We can skip calling updatePolling if we're not changing this.options.
            this.updatePolling();
            // Reset options.fetchPolicy to its original value when variables change,
            // unless a new fetchPolicy was provided by newOptions.
            if (newOptions &&
                newOptions.variables &&
                !equal(newOptions.variables, oldVariables) &&
                // Don't mess with the fetchPolicy if it's currently "standby".
                options.fetchPolicy !== "standby" &&
                // If we're changing the fetchPolicy anyway, don't try to change it here
                // using applyNextFetchPolicy. The explicit options.fetchPolicy wins.
                options.fetchPolicy === oldFetchPolicy) {
                this.applyNextFetchPolicy("variables-changed", options);
                if (newNetworkStatus === void 0) {
                    newNetworkStatus = NetworkStatus.setVariables;
                }
            }
        }
        this.waitForOwnResult && (this.waitForOwnResult = skipCacheDataFor(options.fetchPolicy));
        var finishWaitingForOwnResult = function () {
            if (_this.concast === concast) {
                _this.waitForOwnResult = false;
            }
        };
        var variables = options.variables && __assign({}, options.variables);
        var _a = this.fetch(options, newNetworkStatus, query), concast = _a.concast, fromLink = _a.fromLink;
        var observer = {
            next: function (result) {
                finishWaitingForOwnResult();
                _this.reportResult(result, variables);
            },
            error: function (error) {
                finishWaitingForOwnResult();
                _this.reportError(error, variables);
            },
        };
        if (!useDisposableConcast && (fromLink || !this.concast)) {
            // We use the {add,remove}Observer methods directly to avoid wrapping
            // observer with an unnecessary SubscriptionObserver object.
            if (this.concast && this.observer) {
                this.concast.removeObserver(this.observer);
            }
            this.concast = concast;
            this.observer = observer;
        }
        concast.addObserver(observer);
        return concast;
    };
    ObservableQuery.prototype.reobserve = function (newOptions, newNetworkStatus) {
        return this.reobserveAsConcast(newOptions, newNetworkStatus)
            .promise;
    };
    ObservableQuery.prototype.resubscribeAfterError = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // If `lastError` is set in the current when the subscription is re-created,
        // the subscription will immediately receive the error, which will
        // cause it to terminate again. To avoid this, we first clear
        // the last error/result from the `observableQuery` before re-starting
        // the subscription, and restore the last value afterwards so that the
        // subscription has a chance to stay open.
        var last = this.last;
        this.resetLastResults();
        var subscription = this.subscribe.apply(this, args);
        this.last = last;
        return subscription;
    };
    // (Re)deliver the current result to this.observers without applying fetch
    // policies or making network requests.
    ObservableQuery.prototype.observe = function () {
        this.reportResult(
        // Passing false is important so that this.getCurrentResult doesn't
        // save the fetchMore result as this.lastResult, causing it to be
        // ignored due to the this.isDifferentFromLastResult check in
        // this.reportResult.
        this.getCurrentResult(false), this.variables);
    };
    ObservableQuery.prototype.reportResult = function (result, variables) {
        var lastError = this.getLastError();
        var isDifferent = this.isDifferentFromLastResult(result, variables);
        // Update the last result even when isDifferentFromLastResult returns false,
        // because the query may be using the @nonreactive directive, and we want to
        // save the the latest version of any nonreactive subtrees (in case
        // getCurrentResult is called), even though we skip broadcasting changes.
        if (lastError || !result.partial || this.options.returnPartialData) {
            this.updateLastResult(result, variables);
        }
        if (lastError || isDifferent) {
            iterateObserversSafely(this.observers, "next", result);
        }
    };
    ObservableQuery.prototype.reportError = function (error, variables) {
        // Since we don't get the current result on errors, only the error, we
        // must mirror the updates that occur in QueryStore.markQueryError here
        var errorResult = __assign(__assign({}, this.getLastResult()), { error: error, errors: error.graphQLErrors, networkStatus: NetworkStatus.error, loading: false });
        this.updateLastResult(errorResult, variables);
        iterateObserversSafely(this.observers, "error", (this.last.error = error));
    };
    ObservableQuery.prototype.hasObservers = function () {
        return this.observers.size > 0;
    };
    ObservableQuery.prototype.tearDownQuery = function () {
        if (this.isTornDown)
            return;
        if (this.concast && this.observer) {
            this.concast.removeObserver(this.observer);
            delete this.concast;
            delete this.observer;
        }
        this.stopPolling();
        // stop all active GraphQL subscriptions
        this.subscriptions.forEach(function (sub) { return sub.unsubscribe(); });
        this.subscriptions.clear();
        this.queryManager.stopQuery(this.queryId);
        this.observers.clear();
        this.isTornDown = true;
    };
    ObservableQuery.prototype.transformDocument = function (document) {
        return this.queryManager.transform(document);
    };
    return ObservableQuery;
}(Observable));
export { ObservableQuery };
// Necessary because the ObservableQuery constructor has a different
// signature than the Observable constructor.
fixObservableSubclass(ObservableQuery);
// Reobserve with fetchPolicy effectively set to "cache-first", triggering
// delivery of any new data from the cache, possibly falling back to the network
// if any cache data are missing. This allows _complete_ cache results to be
// delivered without also kicking off unnecessary network requests when
// this.options.fetchPolicy is "cache-and-network" or "network-only". When
// this.options.fetchPolicy is any other policy ("cache-first", "cache-only",
// "standby", or "no-cache"), we call this.reobserve() as usual.
export function reobserveCacheFirst(obsQuery) {
    var _a = obsQuery.options, fetchPolicy = _a.fetchPolicy, nextFetchPolicy = _a.nextFetchPolicy;
    if (fetchPolicy === "cache-and-network" || fetchPolicy === "network-only") {
        return obsQuery.reobserve({
            fetchPolicy: "cache-first",
            // Use a temporary nextFetchPolicy function that replaces itself with the
            // previous nextFetchPolicy value and returns the original fetchPolicy.
            nextFetchPolicy: function (currentFetchPolicy, context) {
                // Replace this nextFetchPolicy function in the options object with the
                // original this.options.nextFetchPolicy value.
                this.nextFetchPolicy = nextFetchPolicy;
                // If the original nextFetchPolicy value was a function, give it a
                // chance to decide what happens here.
                if (typeof this.nextFetchPolicy === "function") {
                    return this.nextFetchPolicy(currentFetchPolicy, context);
                }
                // Otherwise go back to the original this.options.fetchPolicy.
                return fetchPolicy;
            },
        });
    }
    return obsQuery.reobserve();
}
function defaultSubscriptionObserverErrorCallback(error) {
    globalThis.__DEV__ !== false && invariant.error(23, error.message, error.stack);
}
export function logMissingFieldErrors(missing) {
    if (globalThis.__DEV__ !== false && missing) {
        globalThis.__DEV__ !== false && invariant.debug(24, missing);
    }
}
function skipCacheDataFor(fetchPolicy /* `undefined` would mean `"cache-first"` */) {
    return (fetchPolicy === "network-only" ||
        fetchPolicy === "no-cache" ||
        fetchPolicy === "standby");
}
//# sourceMappingURL=ObservableQuery.js.map