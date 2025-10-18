import type { ReactStrategyImpl$Ext } from "@r-machine/react/lib";
import { ReactStrategy } from "@r-machine/react/lib";

export abstract class NextStrategy<SC, E extends ReactStrategyImpl$Ext> extends ReactStrategy<SC, E> {}
