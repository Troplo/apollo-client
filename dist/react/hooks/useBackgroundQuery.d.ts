import type { DocumentNode, OperationVariables, TypedDocumentNode } from "../../core/index.js";
import type { QueryReference } from "../cache/QueryReference.js";
import type { BackgroundQueryHookOptions, NoInfer } from "../types/types.js";
import type { FetchMoreFunction, RefetchFunction } from "./useSuspenseQuery.js";
import type { DeepPartial } from "../../utilities/index.js";
import type { SkipToken } from "./constants.js";
export type UseBackgroundQueryResult<TData = unknown, TVariables extends OperationVariables = OperationVariables> = {
    fetchMore: FetchMoreFunction<TData, TVariables>;
    refetch: RefetchFunction<TData, TVariables>;
};
type BackgroundQueryHookOptionsNoInfer<TData, TVariables extends OperationVariables> = BackgroundQueryHookOptions<NoInfer<TData>, NoInfer<TVariables>>;
export declare function useBackgroundQuery<TData, TVariables extends OperationVariables, TOptions extends Omit<BackgroundQueryHookOptions<TData>, "variables">>(query: DocumentNode | TypedDocumentNode<TData, TVariables>, options?: BackgroundQueryHookOptionsNoInfer<TData, TVariables> & TOptions): [
    (QueryReference<TOptions["errorPolicy"] extends "ignore" | "all" ? TOptions["returnPartialData"] extends true ? DeepPartial<TData> | undefined : TData | undefined : TOptions["returnPartialData"] extends true ? DeepPartial<TData> : TData> | (TOptions["skip"] extends boolean ? undefined : never)),
    UseBackgroundQueryResult<TData, TVariables>
];
export declare function useBackgroundQuery<TData = unknown, TVariables extends OperationVariables = OperationVariables>(query: DocumentNode | TypedDocumentNode<TData, TVariables>, options: BackgroundQueryHookOptionsNoInfer<TData, TVariables> & {
    returnPartialData: true;
    errorPolicy: "ignore" | "all";
}): [
    QueryReference<DeepPartial<TData> | undefined>,
    UseBackgroundQueryResult<TData, TVariables>
];
export declare function useBackgroundQuery<TData = unknown, TVariables extends OperationVariables = OperationVariables>(query: DocumentNode | TypedDocumentNode<TData, TVariables>, options: BackgroundQueryHookOptionsNoInfer<TData, TVariables> & {
    errorPolicy: "ignore" | "all";
}): [
    QueryReference<TData | undefined>,
    UseBackgroundQueryResult<TData, TVariables>
];
export declare function useBackgroundQuery<TData = unknown, TVariables extends OperationVariables = OperationVariables>(query: DocumentNode | TypedDocumentNode<TData, TVariables>, options: BackgroundQueryHookOptionsNoInfer<TData, TVariables> & {
    skip: boolean;
    returnPartialData: true;
}): [
    QueryReference<DeepPartial<TData>> | undefined,
    UseBackgroundQueryResult<TData, TVariables>
];
export declare function useBackgroundQuery<TData = unknown, TVariables extends OperationVariables = OperationVariables>(query: DocumentNode | TypedDocumentNode<TData, TVariables>, options: BackgroundQueryHookOptionsNoInfer<TData, TVariables> & {
    returnPartialData: true;
}): [
    QueryReference<DeepPartial<TData>>,
    UseBackgroundQueryResult<TData, TVariables>
];
export declare function useBackgroundQuery<TData = unknown, TVariables extends OperationVariables = OperationVariables>(query: DocumentNode | TypedDocumentNode<TData, TVariables>, options: BackgroundQueryHookOptionsNoInfer<TData, TVariables> & {
    skip: boolean;
}): [
    QueryReference<TData> | undefined,
    UseBackgroundQueryResult<TData, TVariables>
];
export declare function useBackgroundQuery<TData = unknown, TVariables extends OperationVariables = OperationVariables>(query: DocumentNode | TypedDocumentNode<TData, TVariables>, options?: BackgroundQueryHookOptionsNoInfer<TData, TVariables>): [QueryReference<TData>, UseBackgroundQueryResult<TData, TVariables>];
export declare function useBackgroundQuery<TData = unknown, TVariables extends OperationVariables = OperationVariables>(query: DocumentNode | TypedDocumentNode<TData, TVariables>, options: SkipToken): [undefined, UseBackgroundQueryResult<TData, TVariables>];
export declare function useBackgroundQuery<TData = unknown, TVariables extends OperationVariables = OperationVariables>(query: DocumentNode | TypedDocumentNode<TData, TVariables>, options: SkipToken | (BackgroundQueryHookOptionsNoInfer<TData, TVariables> & {
    returnPartialData: true;
})): [
    QueryReference<DeepPartial<TData>> | undefined,
    UseBackgroundQueryResult<TData, TVariables>
];
export declare function useBackgroundQuery<TData = unknown, TVariables extends OperationVariables = OperationVariables>(query: DocumentNode | TypedDocumentNode<TData, TVariables>, options?: SkipToken | BackgroundQueryHookOptionsNoInfer<TData, TVariables>): [
    QueryReference<TData> | undefined,
    UseBackgroundQueryResult<TData, TVariables>
];
export {};
//# sourceMappingURL=useBackgroundQuery.d.ts.map