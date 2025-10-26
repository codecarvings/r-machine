"use client";

import { NextToolset } from "@r-machine/next";
import { rMachine, strategy } from "./r-machine";

export const { NextClientRMachine, useLocale, useR, useRKit } = NextToolset.createClient(rMachine, strategy);
