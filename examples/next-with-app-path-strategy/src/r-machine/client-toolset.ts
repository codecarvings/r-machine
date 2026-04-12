"use client";

import { strategy } from "./setup";

export const { NextClientRMachine, ClientPlug } = await strategy.createClientToolset();
