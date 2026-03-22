"use client";

import { strategy } from "./r-machine";

export const { NextClientRMachine, useLocale, useSetLocale, useR, useRKit, useFmt, usePathComposer } =
  await strategy.createClientToolset();
