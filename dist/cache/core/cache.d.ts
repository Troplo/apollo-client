import type { DocumentNode } from "graphql";
import type { StoreObject, Reference } from "../../utilities/index.js";
import type { DataProxy } from "./types/DataProxy.js";
import type { Cache } from "./types/Cache.js";
export type Transaction<T> = (c: ApolloCache<T>) => void;
export declare abstract class ApolloCache<TSerialized> implements DataProxy {
    readonly assumeImmutableResults: boolean;
    abstract read<TData = any, TVariables = any>(query: Cache.ReadOptions<TVariables, TData>): TData | null;
    abstract write<TData = any, TVariables = any>(write: Cache.WriteOptions<TData, TVariables>): Reference | undefined;
    abstract diff<T>(query: Cache.DiffOptions): Cache.DiffResult<T>;
    abstract watch<TData = any, TVariables = any>(watch: Cache.WatchOptions<TData, TVariables>): () => void;
    abstract reset(options?: Cache.ResetOptions): Promise<void>;
    abstract evict(options: Cache.EvictOptions): boolean;
    /**
     * Replaces existing state in the cache (if any) with the values expressed by
     * `serializedState`.
     *
     * Called when hydrating a cache (server side rendering, or offline storage),
     * and also (potentially) during hot reloads.
     */
    abstract restore(serializedState: TSerialized): ApolloCache<TSerialized>;
    /**
     * Exposes the cache's complete state, in a serializable format for later restoration.
     */
    abstract extract(optimistic?: boolean): TSerialized;
    abstract removeOptimistic(id: string): void;
    batch<U>(options: Cache.BatchOptions<this, U>): U;
    abstract performTransaction(transaction: Transaction<TSerialized>, optimisticId?: string | null): void;
    recordOptimisticTransaction(transaction: Transaction<TSerialized>, optimisticId: string): void;
    transformDocument(document: DocumentNode): DocumentNode;
    transformForLink(document: DocumentNode): DocumentNode;
    identify(object: StoreObject | Reference): string | undefined;
    gc(): string[];
    modify<Entity extends Record<string, any> = Record<string, any>>(options: Cache.ModifyOptions<Entity>): boolean;
    readQuery<QueryType, TVariables = any>(options: Cache.ReadQueryOptions<QueryType, TVariables>, optimistic?: boolean): QueryType | null;
    private getFragmentDoc;
    readFragment<FragmentType, TVariables = any>(options: Cache.ReadFragmentOptions<FragmentType, TVariables>, optimistic?: boolean): FragmentType | null;
    writeQuery<TData = any, TVariables = any>({ id, data, ...options }: Cache.WriteQueryOptions<TData, TVariables>): Reference | undefined;
    writeFragment<TData = any, TVariables = any>({ id, data, fragment, fragmentName, ...options }: Cache.WriteFragmentOptions<TData, TVariables>): Reference | undefined;
    updateQuery<TData = any, TVariables = any>(options: Cache.UpdateQueryOptions<TData, TVariables>, update: (data: TData | null) => TData | null | void): TData | null;
    updateFragment<TData = any, TVariables = any>(options: Cache.UpdateFragmentOptions<TData, TVariables>, update: (data: TData | null) => TData | null | void): TData | null;
}
//# sourceMappingURL=cache.d.ts.map