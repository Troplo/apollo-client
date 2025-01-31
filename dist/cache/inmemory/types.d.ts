import type { DocumentNode, FieldNode } from "graphql";
import type { Transaction } from "../core/cache.js";
import type { StoreObject, StoreValue, Reference } from "../../utilities/index.js";
import type { FieldValueGetter } from "./entityStore.js";
import type { TypePolicies, PossibleTypesMap, KeyFieldsFunction, StorageType, FieldMergeFunction } from "./policies.js";
import type { Modifiers, ToReferenceFunction, CanReadFunction, AllFieldsModifier } from "../core/types/common.js";
import type { FragmentRegistryAPI } from "./fragmentRegistry.js";
export type { StoreObject, StoreValue, Reference };
export interface IdGetterObj extends Object {
    __typename?: string;
    id?: string;
    _id?: string;
}
export declare type IdGetter = (value: IdGetterObj) => string | undefined;
/**
 * This is an interface used to access, set and remove
 * StoreObjects from the cache
 */
export interface NormalizedCache {
    has(dataId: string): boolean;
    get(dataId: string, fieldName: string): StoreValue;
    merge(olderId: string, newerObject: StoreObject): void;
    merge(olderObject: StoreObject, newerId: string): void;
    modify<Entity extends Record<string, any>>(dataId: string, fields: Modifiers<Entity> | AllFieldsModifier<Entity>): boolean;
    delete(dataId: string, fieldName?: string): boolean;
    clear(): void;
    /**
     * returns an Object with key-value pairs matching the contents of the store
     */
    toObject(): NormalizedCacheObject;
    /**
     * replace the state of the store
     */
    replace(newData: NormalizedCacheObject): void;
    /**
     * Retain (or release) a given root ID to protect (or expose) it and its
     * transitive child entities from (or to) garbage collection. The current
     * retainment count is returned by both methods. Note that releasing a root
     * ID does not cause that entity to be garbage collected, but merely removes
     * it from the set of root IDs that will be considered during the next
     * mark-and-sweep collection.
     */
    retain(rootId: string): number;
    release(rootId: string): number;
    getFieldValue: FieldValueGetter;
    toReference: ToReferenceFunction;
    canRead: CanReadFunction;
    getStorage(idOrObj: string | StoreObject, ...storeFieldNames: (string | number)[]): StorageType;
}
/**
 * This is a normalized representation of the Apollo query result cache. It consists of
 * a flattened representation of query result trees.
 */
export interface NormalizedCacheObject {
    __META?: {
        extraRootIds: string[];
    };
    [dataId: string]: StoreObject | undefined;
}
export type OptimisticStoreItem = {
    id: string;
    data: NormalizedCacheObject;
    transaction: Transaction<NormalizedCacheObject>;
};
export type ReadQueryOptions = {
    /**
     * The Apollo Client store object.
     */
    store: NormalizedCache;
    /**
     * A parsed GraphQL query document.
     */
    query: DocumentNode;
    variables?: Object;
    previousResult?: any;
    canonizeResults?: boolean;
    rootId?: string;
    config?: ApolloReducerConfig;
};
export type DiffQueryAgainstStoreOptions = ReadQueryOptions & {
    returnPartialData?: boolean;
};
export type ApolloReducerConfig = {
    dataIdFromObject?: KeyFieldsFunction;
    addTypename?: boolean;
};
export interface InMemoryCacheConfig extends ApolloReducerConfig {
    resultCaching?: boolean;
    possibleTypes?: PossibleTypesMap;
    typePolicies?: TypePolicies;
    resultCacheMaxSize?: number;
    canonizeResults?: boolean;
    fragments?: FragmentRegistryAPI;
}
export interface MergeInfo {
    field: FieldNode;
    typename: string | undefined;
    merge: FieldMergeFunction;
}
export interface MergeTree {
    info?: MergeInfo;
    map: Map<string | number, MergeTree>;
}
export interface ReadMergeModifyContext {
    store: NormalizedCache;
    variables?: Record<string, any>;
    varString?: string;
}
//# sourceMappingURL=types.d.ts.map