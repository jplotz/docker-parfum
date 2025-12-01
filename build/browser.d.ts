import * as dinghyModule from "@tdurieux/dinghy";
export { PARFUM_RULES, BINNACLE_RULES, HADOLINT_RULES } from "./rules";
export { Violation, Matcher } from "./rule-matcher";
export declare const dinghy: typeof dinghyModule & {
    nodeType: {
        Q: (type: string | (new (t: any) => dinghyModule.AbstractNode<any>) | dinghyModule.QueryOperator, child?: (string | (new (t: any) => dinghyModule.AbstractNode<any>) | dinghyModule.QueryOperator) | dinghyModule.Query, ...children: (string | (new (t: any) => dinghyModule.AbstractNode<any>) | dinghyModule.QueryOperator)[] | dinghyModule.Query[]) => dinghyModule.Query;
        QOR: (...types: (string | (new (t: any) => dinghyModule.AbstractNode<any>) | dinghyModule.QueryOperator)[]) => dinghyModule.QueryOperatorOR;
        QAND: (...types: (string | (new (t: any) => dinghyModule.AbstractNode<any>) | dinghyModule.QueryOperator)[]) => dinghyModule.QueryOperatorAND;
        QValue: (value: string) => dinghyModule.QueryOperatorValue;
        Query: typeof dinghyModule.Query;
        QueryOperator: typeof dinghyModule.QueryOperator;
        QueryOperatorAND: typeof dinghyModule.QueryOperatorAND;
        QueryOperatorOR: typeof dinghyModule.QueryOperatorOR;
        QueryOperatorValue: typeof dinghyModule.QueryOperatorValue;
        BashCommandCommand: typeof dinghyModule.BashCommandCommand;
        DockerFile: typeof dinghyModule.DockerFile;
        AbstractNode: typeof dinghyModule.AbstractNode;
        DockerAbstractNode: typeof dinghyModule.DockerAbstractNode;
    };
};
export { enricher } from "@tdurieux/dinghy";
export declare function parseAndMatch(dockerfile: string): import("./rule-matcher").Violation[];
