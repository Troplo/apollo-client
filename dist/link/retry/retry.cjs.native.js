'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var core = require('../core');
var utilities = require('../../utilities');

function buildDelayFunction(delayOptions) {
    var _a = delayOptions || {}, _b = _a.initial, initial = _b === void 0 ? 300 : _b, _c = _a.jitter, jitter = _c === void 0 ? true : _c, _d = _a.max, max = _d === void 0 ? Infinity : _d;
    var baseDelay = jitter ? initial : initial / 2;
    return function delayFunction(count) {
        var delay = Math.min(max, baseDelay * Math.pow(2, count));
        if (jitter) {
            delay = Math.random() * delay;
        }
        return delay;
    };
}

function buildRetryFunction(retryOptions) {
    var _a = retryOptions || {}, retryIf = _a.retryIf, _b = _a.max, max = _b === void 0 ? 5 : _b;
    return function retryFunction(count, operation, error) {
        if (count >= max)
            return false;
        return retryIf ? retryIf(error, operation) : !!error;
    };
}

var RetryableOperation =  (function () {
    function RetryableOperation(operation, nextLink, delayFor, retryIf) {
        var _this = this;
        this.operation = operation;
        this.nextLink = nextLink;
        this.delayFor = delayFor;
        this.retryIf = retryIf;
        this.retryCount = 0;
        this.values = [];
        this.complete = false;
        this.canceled = false;
        this.observers = [];
        this.currentSubscription = null;
        this.onNext = function (value) {
            _this.values.push(value);
            for (var _i = 0, _a = _this.observers; _i < _a.length; _i++) {
                var observer = _a[_i];
                if (!observer)
                    continue;
                observer.next(value);
            }
        };
        this.onComplete = function () {
            _this.complete = true;
            for (var _i = 0, _a = _this.observers; _i < _a.length; _i++) {
                var observer = _a[_i];
                if (!observer)
                    continue;
                observer.complete();
            }
        };
        this.onError = function (error) { return tslib.__awaiter(_this, void 0, void 0, function () {
            var shouldRetry, _i, _a, observer;
            return tslib.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.retryCount += 1;
                        return [4 , this.retryIf(this.retryCount, this.operation, error)];
                    case 1:
                        shouldRetry = _b.sent();
                        if (shouldRetry) {
                            this.scheduleRetry(this.delayFor(this.retryCount, this.operation, error));
                            return [2 ];
                        }
                        this.error = error;
                        for (_i = 0, _a = this.observers; _i < _a.length; _i++) {
                            observer = _a[_i];
                            if (!observer)
                                continue;
                            observer.error(error);
                        }
                        return [2 ];
                }
            });
        }); };
    }
    RetryableOperation.prototype.subscribe = function (observer) {
        if (this.canceled) {
            throw new Error("Subscribing to a retryable link that was canceled is not supported");
        }
        this.observers.push(observer);
        for (var _i = 0, _a = this.values; _i < _a.length; _i++) {
            var value = _a[_i];
            observer.next(value);
        }
        if (this.complete) {
            observer.complete();
        }
        else if (this.error) {
            observer.error(this.error);
        }
    };
    RetryableOperation.prototype.unsubscribe = function (observer) {
        var index = this.observers.indexOf(observer);
        if (index < 0) {
            throw new Error("RetryLink BUG! Attempting to unsubscribe unknown observer!");
        }
        this.observers[index] = null;
        if (this.observers.every(function (o) { return o === null; })) {
            this.cancel();
        }
    };
    RetryableOperation.prototype.start = function () {
        if (this.currentSubscription)
            return;
        this.try();
    };
    RetryableOperation.prototype.cancel = function () {
        if (this.currentSubscription) {
            this.currentSubscription.unsubscribe();
        }
        clearTimeout(this.timerId);
        this.timerId = undefined;
        this.currentSubscription = null;
        this.canceled = true;
    };
    RetryableOperation.prototype.try = function () {
        this.currentSubscription = this.nextLink(this.operation).subscribe({
            next: this.onNext,
            error: this.onError,
            complete: this.onComplete,
        });
    };
    RetryableOperation.prototype.scheduleRetry = function (delay) {
        var _this = this;
        if (this.timerId) {
            throw new Error("RetryLink BUG! Encountered overlapping retries");
        }
        this.timerId = setTimeout(function () {
            _this.timerId = undefined;
            _this.try();
        }, delay);
    };
    return RetryableOperation;
}());
var RetryLink =  (function (_super) {
    tslib.__extends(RetryLink, _super);
    function RetryLink(options) {
        var _this = _super.call(this) || this;
        var _a = options || {}, attempts = _a.attempts, delay = _a.delay;
        _this.delayFor =
            typeof delay === "function" ? delay : buildDelayFunction(delay);
        _this.retryIf =
            typeof attempts === "function" ? attempts : buildRetryFunction(attempts);
        return _this;
    }
    RetryLink.prototype.request = function (operation, nextLink) {
        var retryable = new RetryableOperation(operation, nextLink, this.delayFor, this.retryIf);
        retryable.start();
        return new utilities.Observable(function (observer) {
            retryable.subscribe(observer);
            return function () {
                retryable.unsubscribe(observer);
            };
        });
    };
    return RetryLink;
}(core.ApolloLink));

exports.RetryLink = RetryLink;
//# sourceMappingURL=retry.cjs.map
