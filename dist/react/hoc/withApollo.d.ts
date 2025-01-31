import * as React from "react";
import type { OperationOption, WithApolloClient } from "./types.js";
export declare function withApollo<TProps, TResult = any>(WrappedComponent: React.ComponentType<WithApolloClient<Omit<TProps, "client">>>, operationOptions?: OperationOption<TProps, TResult>): React.ComponentClass<Omit<TProps, "client">>;
//# sourceMappingURL=withApollo.d.ts.map