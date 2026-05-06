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

import type { AnyClientGearSurface } from "r-machine/core";
import { tryGetVertexGearTag, type VertexGearMap, type VertexGearTagData } from "r-machine/core";
import { createContext, type ReactNode, useContext, useRef } from "react";

const Context = createContext<VertexGearMap | undefined>(undefined);
Context.displayName = "VertexFrameContext";

export interface VertexFrameProps {
  readonly gear: AnyClientGearSurface | readonly AnyClientGearSurface[];
  readonly children: ReactNode;
}

// Accept also non vertex gear for convenience (OuterGear transformed as VertexGear)
type VertexGearTagDataValue = VertexGearTagData | undefined;

interface Data {
  parentMap: VertexGearMap | undefined;
  length: number;
  tags: VertexGearTagDataValue | readonly VertexGearTagDataValue[];
}

export function VertexFrame({ gear, children }: VertexFrameProps) {
  const gearArray = Array.isArray(gear) ? gear : undefined;
  const gearSingle = gearArray === undefined ? (gear as AnyClientGearSurface) : undefined;
  const length = gearArray !== undefined ? gearArray.length : -1;
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
  } else if (gearArray !== undefined) {
    for (let i = 0; i < current.length; i++) {
      const newTag = tryGetVertexGearTag(gearArray[i])!;
      if ((current.tags as readonly VertexGearTagDataValue[])[i] !== newTag) {
        update = true;
        break;
      }
    }
  } else {
    const newTag = tryGetVertexGearTag(gearSingle!)!;
    update = (current.tags as VertexGearTagDataValue) !== newTag;
  }

  if (update) {
    data.current = {
      parentMap,
      length,
      tags: gearArray !== undefined ? gearArray.map((g) => tryGetVertexGearTag(g)) : tryGetVertexGearTag(gearSingle!),
    };

    if (gearArray === undefined) {
      const tag = tryGetVertexGearTag(gearSingle!);
      if (tag !== undefined) {
        value.current = parentMap ? { ...parentMap, [tag.namespace]: tag.genId } : { [tag.namespace]: tag.genId };
      } else {
        value.current = parentMap ? parentMap : {};
      }
    } else {
      const map: VertexGearMap = parentMap ? { ...parentMap } : {};
      for (let i = 0; i < length; i++) {
        const tag = tryGetVertexGearTag(gearArray[i]);
        if (tag !== undefined) {
          map[tag.namespace] = tag.genId;
        }
      }
      value.current = map;
    }
  }

  return <Context.Provider value={value.current}>{children}</Context.Provider>;
}

export function useVertexFrame(): VertexGearMap | undefined {
  return useContext(Context);
}
