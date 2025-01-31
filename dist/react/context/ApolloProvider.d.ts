import * as React from "react";
import type { ApolloClient } from "../../core/index.js";
export interface ApolloProviderProps<TCache> {
    client: ApolloClient<TCache>;
    children: React.ReactNode | React.ReactNode[] | null;
}
export declare const ApolloProvider: React.FC<ApolloProviderProps<any>>;
//# sourceMappingURL=ApolloProvider.d.ts.map