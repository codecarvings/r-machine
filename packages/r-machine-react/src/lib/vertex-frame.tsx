/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/react, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

"use client";

import { type AnyVertexGear, resTagSymbol, type VertexGearMap, type VertexGearTag } from "r-machine/core";
import { createContext, type ReactNode, useContext, useRef } from "react";

const Context = createContext<VertexGearMap | undefined>(undefined);
Context.displayName = "VertexFrameContext";

interface VertexFrameProps {
  readonly gear: AnyVertexGear | AnyVertexGear[];
  readonly children: ReactNode;
}

function toMap(length: number, gear: AnyVertexGear | AnyVertexGear[]): VertexGearMap {
  if (length === -1) {
    const tag = (gear as AnyVertexGear)[resTagSymbol];
    return { [tag.namespace]: tag.genId };
  }
  const map: VertexGearMap = {};
  for (let i = 0; i < length; i++) {
    const g = (gear as AnyVertexGear[])[i];
    const tag = g[resTagSymbol];
    map[tag.namespace] = tag.genId;
  }
  return map;
}

interface Data {
  parentMap: VertexGearMap | undefined;
  length: number;
  tags: VertexGearTag | VertexGearTag[];
}

export function VertexFrame({ gear, children }: VertexFrameProps) {
  const isArray = Array.isArray(gear);
  const length = isArray ? gear.length : -1;
  const parentMap = useContext(Context);

  const data = useRef<Data | undefined>(undefined);
  const value = useRef<VertexGearMap | undefined>(undefined);

  let update = false;
  const current = data.current;
  if (current === undefined) {
    update = true;
  } else if (current.parentMap !== parentMap) {
    update = true;
  } else if (current.length !== length) {
    update = true;
  } else if (isArray) {
    for (let i = 0; i < current.length; i++) {
      if ((current.tags as VertexGearTag[])[i] !== gear[i][resTagSymbol]) {
        update = true;
        break;
      }
    }
  } else {
    update = (current.tags as VertexGearTag) !== gear[resTagSymbol];
  }

  if (update) {
    data.current = {
      parentMap,
      length,
      tags: isArray ? gear.map((g) => g[resTagSymbol]) : gear[resTagSymbol],
    };
    value.current = parentMap ? { ...parentMap, ...toMap(length, gear) } : toMap(length, gear);
  }

  return <Context.Provider value={value.current}>{children}</Context.Provider>;
}

export function useVertexFrame(): VertexGearMap | undefined {
  return useContext(Context);
}
