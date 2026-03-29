"use client";

import { strategy } from "./setup";

export const { NextClientRMachine, useLocale, useSetLocale, useR, useRKit, usePathComposer } =
  await strategy.createClientToolset();
