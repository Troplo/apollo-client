import type { QueryReference } from "../cache/QueryReference.js";
import type { ApolloError } from "../../errors/index.js";
import type { NetworkStatus } from "../../core/index.js";
export interface UseReadQueryResult<TData = unknown> {
    /**
     * An object containing the result of your GraphQL query after it completes.
     *
     * This value might be `undefined` if a query results in one or more errors
     * (depending on the query's `errorPolicy`).
     */
    data: TData;
    /**
     * If the query produces one or more errors, this object contains either an
     * array of `graphQLErrors` or a single `networkError`. Otherwise, this value
     * is `undefined`.
     *
     * This property can be ignored when using the default `errorPolicy` or an
     * `errorPolicy` of `none`. The hook will throw the error instead of setting
     * this property.
     */
    error: ApolloError | undefined;
    /**
     * A number indicating the current network state of the query's associated
     * request. {@link https://github.com/apollographql/apollo-client/blob/d96f4578f89b933c281bb775a39503f6cdb59ee8/src/core/networkStatus.ts#L4 | See possible values}.
     */
    networkStatus: NetworkStatus;
}
export declare function useReadQuery<TData>(queryRef: QueryReference<TData>): UseReadQueryResult<TData>;
//# sourceMappingURL=useReadQuery.d.ts.map