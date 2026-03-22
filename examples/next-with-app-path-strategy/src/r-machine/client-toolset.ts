"use client";

import { strategy } from "./setup";

export const { NextClientRMachine, useLocale, useSetLocale, useR, useRKit, useFmt, usePathComposer } =
  await strategy.createClientToolset();
