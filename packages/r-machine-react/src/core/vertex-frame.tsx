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

import { type AnyRes, type VertexGearMap, type VertexGearTag, vertexGearTagSymbol } from "r-machine/core";
import { RMachineUsageError } from "r-machine/errors";
import { createContext, type ReactNode, useContext, useRef } from "react";
import { ERR_INVALID_VERTEX_GEAR } from "#r-machine/react/errors";

const Context = createContext<VertexGearMap | undefined>(undefined);
Context.displayName = "VertexFrameContext";

interface VertexFrameProps {
  readonly gear: AnyRes | AnyRes[];
  readonly children: ReactNode;
}

interface AnyVertexGear {
  [vertexGearTagSymbol]: VertexGearTag;
}

interface Data {
  parentMap: VertexGearMap | undefined;
  length: number;
  tags: VertexGearTag | VertexGearTag[];
}

function validateGear(gear: any) {
  const tag = gear[vertexGearTagSymbol];
  if (!tag) {
    throw new RMachineUsageError(ERR_INVALID_VERTEX_GEAR, "VertexFrame: Provided gear is not a valid vertex gear.");
  }
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
    if (isArray) {
      for (let i = 0; i < length; i++) {
        validateGear(gear[i]);
      }
    } else {
      validateGear(gear);
    }
    update = true;
  } else if (current.parentMap !== parentMap) {
    update = true;
  } else if (current.length !== length) {
    update = true;
  } else if (isArray) {
    for (let i = 0; i < current.length; i++) {
      if ((current.tags as VertexGearTag[])[i] !== (gear[i] as unknown as AnyVertexGear)[vertexGearTagSymbol]) {
        update = true;
        break;
      }
    }
  } else {
    update = (current.tags as VertexGearTag) !== (gear as unknown as AnyVertexGear)[vertexGearTagSymbol];
  }

  if (update) {
    data.current = {
      parentMap,
      length,
      tags: isArray
        ? gear.map((g) => (g as unknown as AnyVertexGear)[vertexGearTagSymbol])
        : (gear as unknown as AnyVertexGear)[vertexGearTagSymbol],
    };

    if (length === -1) {
      const tag = (gear as unknown as AnyVertexGear)[vertexGearTagSymbol]!;
      value.current = parentMap ? { ...parentMap, [tag.namespace]: tag.genId } : { [tag.namespace]: tag.genId };
    } else {
      const map: VertexGearMap = parentMap ? { ...parentMap } : {};
      for (let i = 0; i < length; i++) {
        const tag = (gear as AnyVertexGear[])[i][vertexGearTagSymbol];
        map[tag.namespace] = tag.genId;
      }
      value.current = map;
    }
  }

  return <Context.Provider value={value.current}>{children}</Context.Provider>;
}

export function useVertexFrame(): VertexGearMap | undefined {
  return useContext(Context);
}
