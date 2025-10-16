import { ReactStrategy } from "react-r-machine";
import type { ReactStrategyImpl$Ext } from "../../../../packages/react-r-machine/react-strategy-impl.cjs";

export abstract class NextStrategy<SC, E extends ReactStrategyImpl$Ext> extends ReactStrategy<SC, E> {}
