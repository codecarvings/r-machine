"use client";

import { strategy } from "./r-machine";

export const { useLocale, useSetLocale, useR, useRKit, usePathComposer } = await strategy.getClientToolset();
