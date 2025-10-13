"use client";

import { ReactDefaultStrategy, ReactTools } from "react-r-machine";
import { rMachine } from "./r-machine";

export const { ReactRMachine, useLocale, useR, useRKit } = ReactTools.create(rMachine, new ReactDefaultStrategy());
});
