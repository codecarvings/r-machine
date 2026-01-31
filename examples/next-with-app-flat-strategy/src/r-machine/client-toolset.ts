"use client";

import { strategy } from "./r-machine";

export const { NextClientRMachine, useLocale, useSetLocale, useR, useRKit, usePathComposer } =
  await strategy.createClientToolset();
