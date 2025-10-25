"use client";

import { ReactToolset } from "@r-machine/react";
import { rMachine, strategy } from "./r-machine";

export const { ReactRMachine, useLocale, useR, useRKit } = ReactToolset.create(rMachine, strategy);
