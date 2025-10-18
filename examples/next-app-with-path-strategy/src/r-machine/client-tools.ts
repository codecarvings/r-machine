"use client";

import { NextTools } from "@/lib-temp/next-tools-builder";
import { rMachine, strategy } from "./r-machine";

export const { NextClientRMachine, useLocale, useR, useRKit } = NextTools.createClient(rMachine, strategy);
