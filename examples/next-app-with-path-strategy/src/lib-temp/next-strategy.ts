import { ReactStrategy } from "react-r-machine";
import type { ReactStrategyImpl$Ext } from "react-r-machine/lib";

export abstract class NextStrategy<SC, E extends ReactStrategyImpl$Ext> extends ReactStrategy<SC, E> {}
