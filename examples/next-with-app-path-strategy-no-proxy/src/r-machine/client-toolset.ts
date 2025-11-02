"use client";

import { NextToolset } from "@r-machine/next";
import { rMachine, strategy } from "./r-machine";

export const { NextClientRMachine, useLocale, useSetLocale, useR, useRKit } = await NextToolset.createForClient(
  rMachine,
  strategy
);
