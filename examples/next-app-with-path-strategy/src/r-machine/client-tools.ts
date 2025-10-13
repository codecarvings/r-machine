"use client";

import { createNextAppRouterClientTools } from "@/lib-temp/next-app-router-client-tools";
import { rMachine, strategy } from "./r-machine";

export const { NextClientRMachine, useLocale, useR, useRKit } = createNextAppRouterClientTools(rMachine, strategy);
