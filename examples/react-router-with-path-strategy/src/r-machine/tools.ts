"use client";

import { ReactTools } from "react-r-machine";
import { rMachine, strategy } from "./r-machine";

export const { ReactRMachine, useLocale, useR, useRKit } = ReactTools.create(rMachine, strategy);
