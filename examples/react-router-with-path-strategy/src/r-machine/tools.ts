"use client";

import { ReactTools } from "@r-machine/react";
import { rMachine, strategy } from "./r-machine";

export const { ReactRMachine, useLocale, useR, useRKit } = ReactTools.create(rMachine, strategy);
