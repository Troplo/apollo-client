/// <reference types="react" />
import type { ObservableQuery, OperationVariables } from "../../core/index.js";
import type { QueryDataOptions } from "../types/types.js";
interface QueryData {
    getOptions(): any;
    fetchData(): Promise<void>;
}
export declare class RenderPromises {
    private queryPromises;
    private queryInfoTrie;
    private stopped;
    stop(): void;
    registerSSRObservable<TData, TVariables extends OperationVariables>(observable: ObservableQuery<any, TVariables>): void;
    getSSRObservable<TData, TVariables extends OperationVariables>(props: QueryDataOptions<TData, TVariables>): ObservableQuery<any, TVariables> | null;
    addQueryPromise(queryInstance: QueryData, finish?: () => React.ReactNode): React.ReactNode;
    addObservableQueryPromise<TData, TVariables extends OperationVariables>(obsQuery: ObservableQuery<TData, TVariables>): import("react").ReactNode;
    hasPromises(): boolean;
    consumeAndAwaitPromises(): Promise<any[]>;
    private lookupQueryInfo;
}
export {};
//# sourceMappingURL=RenderPromises.d.ts.map