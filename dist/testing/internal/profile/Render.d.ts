import { screen } from "@testing-library/dom";
/** @internal */
export interface BaseRender {
    id: string;
    phase: "mount" | "update" | "nested-update";
    actualDuration: number;
    baseDuration: number;
    startTime: number;
    commitTime: number;
    /**
     * The number of renders that have happened so far (including this render).
     */
    count: number;
}
type Screen = typeof screen;
/** @internal */
export type SyncScreen = {
    [K in keyof Screen]: K extends `find${string}` ? {
        /** @deprecated A snapshot is static, so avoid async queries! */
        (...args: Parameters<Screen[K]>): ReturnType<Screen[K]>;
    } : Screen[K];
};
/** @internal */
export interface Render<Snapshot> extends BaseRender {
    /**
     * The snapshot, as returned by the `takeSnapshot` option of `profile`.
     * (If using `profileHook`, this is the return value of the hook.)
     */
    snapshot: Snapshot;
    /**
     * A DOM snapshot of the rendered component, if the `snapshotDOM`
     * option of `profile` was enabled.
     */
    readonly domSnapshot: HTMLElement;
    /**
     * Returns a callback to receive a `screen` instance that is scoped to the
     * DOM snapshot of this `Render` instance.
     * Note: this is used as a callback to prevent linter errors.
     * @example
     * ```diff
     * const { withinDOM } = RenderedComponent.takeRender();
     * -expect(screen.getByText("foo")).toBeInTheDocument();
     * +expect(withinDOM().getByText("foo")).toBeInTheDocument();
     * ```
     */
    withinDOM: () => SyncScreen;
}
/** @internal */
export declare class RenderInstance<Snapshot> implements Render<Snapshot> {
    snapshot: Snapshot;
    private stringifiedDOM;
    id: string;
    phase: "mount" | "update" | "nested-update";
    actualDuration: number;
    baseDuration: number;
    startTime: number;
    commitTime: number;
    count: number;
    constructor(baseRender: BaseRender, snapshot: Snapshot, stringifiedDOM: string | undefined);
    private _domSnapshot;
    get domSnapshot(): HTMLElement;
    get withinDOM(): () => {
        getByLabelText<T extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined): T;
        getAllByLabelText<T_1 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined): T_1[];
        queryByLabelText<T_2 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined): T_2 | null;
        queryAllByLabelText<T_3 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined): T_3[];
        findByLabelText<T_4 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined): Promise<T_4>;
        findAllByLabelText<T_5 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined): Promise<T_5[]>;
        getByPlaceholderText<T_6 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_6;
        getAllByPlaceholderText<T_7 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_7[];
        queryByPlaceholderText<T_8 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_8 | null;
        queryAllByPlaceholderText<T_9 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_9[];
        findByPlaceholderText<T_10 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined): Promise<T_10>;
        findAllByPlaceholderText<T_11 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined): Promise<T_11[]>;
        getByText<T_12 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined): T_12;
        getAllByText<T_13 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined): T_13[];
        queryByText<T_14 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined): T_14 | null;
        queryAllByText<T_15 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined): T_15[];
        findByText<T_16 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined): Promise<T_16>;
        findAllByText<T_17 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined): Promise<T_17[]>;
        getByAltText<T_18 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_18;
        getAllByAltText<T_19 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_19[];
        queryByAltText<T_20 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_20 | null;
        queryAllByAltText<T_21 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_21[];
        findByAltText<T_22 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined): Promise<T_22>;
        findAllByAltText<T_23 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined): Promise<T_23[]>;
        getByTitle<T_24 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_24;
        getAllByTitle<T_25 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_25[];
        queryByTitle<T_26 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_26 | null;
        queryAllByTitle<T_27 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_27[];
        findByTitle<T_28 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined): Promise<T_28>;
        findAllByTitle<T_29 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined): Promise<T_29[]>;
        getByDisplayValue<T_30 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_30;
        getAllByDisplayValue<T_31 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_31[];
        queryByDisplayValue<T_32 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_32 | null;
        queryAllByDisplayValue<T_33 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_33[];
        findByDisplayValue<T_34 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined): Promise<T_34>;
        findAllByDisplayValue<T_35 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined): Promise<T_35[]>;
        getByRole<T_36 extends HTMLElement = HTMLElement>(role: import("@testing-library/dom").ByRoleMatcher, options?: import("@testing-library/dom").ByRoleOptions | undefined): T_36;
        getAllByRole<T_37 extends HTMLElement = HTMLElement>(role: import("@testing-library/dom").ByRoleMatcher, options?: import("@testing-library/dom").ByRoleOptions | undefined): T_37[];
        queryByRole<T_38 extends HTMLElement = HTMLElement>(role: import("@testing-library/dom").ByRoleMatcher, options?: import("@testing-library/dom").ByRoleOptions | undefined): T_38 | null;
        queryAllByRole<T_39 extends HTMLElement = HTMLElement>(role: import("@testing-library/dom").ByRoleMatcher, options?: import("@testing-library/dom").ByRoleOptions | undefined): T_39[];
        findByRole<T_40 extends HTMLElement = HTMLElement>(role: import("@testing-library/dom").ByRoleMatcher, options?: import("@testing-library/dom").ByRoleOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined): Promise<T_40>;
        findAllByRole<T_41 extends HTMLElement = HTMLElement>(role: import("@testing-library/dom").ByRoleMatcher, options?: import("@testing-library/dom").ByRoleOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined): Promise<T_41[]>;
        getByTestId<T_42 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_42;
        getAllByTestId<T_43 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_43[];
        queryByTestId<T_44 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_44 | null;
        queryAllByTestId<T_45 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined): T_45[];
        findByTestId<T_46 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined): Promise<T_46>;
        findAllByTestId<T_47 extends HTMLElement = HTMLElement>(id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined): Promise<T_47[]>;
    } & {
        getByLabelText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined) => HTMLElement;
        getAllByLabelText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined) => HTMLElement[];
        queryByLabelText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined) => HTMLElement | null;
        queryAllByLabelText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined) => HTMLElement[];
        findByLabelText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined) => Promise<HTMLElement>;
        findAllByLabelText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined) => Promise<HTMLElement[]>;
        getByPlaceholderText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement;
        getAllByPlaceholderText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement[];
        queryByPlaceholderText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement | null;
        queryAllByPlaceholderText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement[];
        findByPlaceholderText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined) => Promise<HTMLElement>;
        findAllByPlaceholderText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined) => Promise<HTMLElement[]>;
        getByText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined) => HTMLElement;
        getAllByText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined) => HTMLElement[];
        queryByText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined) => HTMLElement | null;
        queryAllByText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined) => HTMLElement[];
        findByText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined) => Promise<HTMLElement>;
        findAllByText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").SelectorMatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined) => Promise<HTMLElement[]>;
        getByAltText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement;
        getAllByAltText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement[];
        queryByAltText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement | null;
        queryAllByAltText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement[];
        findByAltText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined) => Promise<HTMLElement>;
        findAllByAltText: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined) => Promise<HTMLElement[]>;
        getByTitle: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement;
        getAllByTitle: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement[];
        queryByTitle: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement | null;
        queryAllByTitle: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement[];
        findByTitle: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined) => Promise<HTMLElement>;
        findAllByTitle: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined) => Promise<HTMLElement[]>;
        getByDisplayValue: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement;
        getAllByDisplayValue: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement[];
        queryByDisplayValue: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement | null;
        queryAllByDisplayValue: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement[];
        findByDisplayValue: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined) => Promise<HTMLElement>;
        findAllByDisplayValue: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined) => Promise<HTMLElement[]>;
        getByRole: (role: import("@testing-library/dom").ByRoleMatcher, options?: import("@testing-library/dom").ByRoleOptions | undefined) => HTMLElement;
        getAllByRole: (role: import("@testing-library/dom").ByRoleMatcher, options?: import("@testing-library/dom").ByRoleOptions | undefined) => HTMLElement[];
        queryByRole: (role: import("@testing-library/dom").ByRoleMatcher, options?: import("@testing-library/dom").ByRoleOptions | undefined) => HTMLElement | null;
        queryAllByRole: (role: import("@testing-library/dom").ByRoleMatcher, options?: import("@testing-library/dom").ByRoleOptions | undefined) => HTMLElement[];
        findByRole: (role: import("@testing-library/dom").ByRoleMatcher, options?: import("@testing-library/dom").ByRoleOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined) => Promise<HTMLElement>;
        findAllByRole: (role: import("@testing-library/dom").ByRoleMatcher, options?: import("@testing-library/dom").ByRoleOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined) => Promise<HTMLElement[]>;
        getByTestId: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement;
        getAllByTestId: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement[];
        queryByTestId: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement | null;
        queryAllByTestId: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined) => HTMLElement[];
        findByTestId: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined) => Promise<HTMLElement>;
        findAllByTestId: (id: import("@testing-library/dom").Matcher, options?: import("@testing-library/dom").MatcherOptions | undefined, waitForElementOptions?: import("@testing-library/dom").waitForOptions | undefined) => Promise<HTMLElement[]>;
    } & {
        debug: (element?: Element | HTMLDocument | (Element | HTMLDocument)[] | undefined, maxLength?: number | undefined, options?: import("pretty-format").PrettyFormatOptions | undefined) => void;
        logTestingPlaygroundURL: (element?: Element | HTMLDocument | undefined) => void;
    };
}
/** @internal */
export declare function errorOnDomInteraction(): void;
export {};
//# sourceMappingURL=Render.d.ts.map