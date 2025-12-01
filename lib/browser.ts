process.argv.push("--browser");
import { File, parseDocker, enricher } from "@tdurieux/dinghy";
import * as dinghyModule from "@tdurieux/dinghy";
import { Matcher } from "./rule-matcher";

export { PARFUM_RULES, BINNACLE_RULES, HADOLINT_RULES } from "./rules";

export { Violation, Matcher } from "./rule-matcher";

// Create nodeType namespace that groups query functions and node types
// This is needed because the browser UI expects dinghy.nodeType.Q() etc.
const nodeType = {
  Q: dinghyModule.Q,
  QOR: dinghyModule.QOR,
  QAND: dinghyModule.QAND,
  QValue: dinghyModule.QValue,
  Query: dinghyModule.Query,
  QueryOperator: dinghyModule.QueryOperator,
  QueryOperatorAND: dinghyModule.QueryOperatorAND,
  QueryOperatorOR: dinghyModule.QueryOperatorOR,
  QueryOperatorValue: dinghyModule.QueryOperatorValue,
  // Node type classes used by the UI
  BashCommandCommand: dinghyModule.BashCommandCommand,
  DockerFile: dinghyModule.DockerFile,
  // Add other commonly used node types that might be accessed
  AbstractNode: dinghyModule.AbstractNode,
  DockerAbstractNode: dinghyModule.DockerAbstractNode,
};

// Create dinghy object with nodeType attached for browser compatibility
export const dinghy = Object.assign({}, dinghyModule, { nodeType });

export { enricher } from "@tdurieux/dinghy";

export function parseAndMatch(dockerfile: string) {
  const ast = parseDocker(new File(null, dockerfile));
  return new Matcher(ast).matchAll();
}
