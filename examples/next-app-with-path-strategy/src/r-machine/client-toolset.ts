"use client";

import { NextToolset } from "@/lib/main/next-toolset-builder";
import { rMachine, strategy } from "./r-machine";

export const { NextClientRMachine, useLocale, useR, useRKit } = NextToolset.createClient(rMachine, strategy);
