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

import { type AnyVertexGear, getVertexGearTag, type VertexGearMap, type VertexGearTagData } from "r-machine/core";
import { createContext, type ReactNode, useContext, useRef } from "react";

const Context = createContext<VertexGearMap | undefined>(undefined);
Context.displayName = "VertexFrameContext";

interface VertexFrameProps {
  readonly gear: AnyVertexGear | AnyVertexGear[];
  readonly children: ReactNode;
}

interface Data {
  parentMap: VertexGearMap | undefined;
  length: number;
  tags: VertexGearTagData | VertexGearTagData[];
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
      const newTag = getVertexGearTag(gear[i] as unknown as AnyVertexGear);
      if ((current.tags as VertexGearTagData[])[i] !== newTag) {
        update = true;
        break;
      }
    }
  } else {
    const newTag = getVertexGearTag(gear as unknown as AnyVertexGear);
    update = (current.tags as VertexGearTagData) !== newTag;
  }

  if (update) {
    data.current = {
      parentMap,
      length,
      tags: isArray
        ? gear.map((g) => getVertexGearTag(g as unknown as AnyVertexGear))
        : getVertexGearTag(gear as unknown as AnyVertexGear),
    };

    if (length === -1) {
      const tag = getVertexGearTag(gear as unknown as AnyVertexGear)!;
      value.current = parentMap ? { ...parentMap, [tag.namespace]: tag.genId } : { [tag.namespace]: tag.genId };
    } else {
      const map: VertexGearMap = parentMap ? { ...parentMap } : {};
      for (let i = 0; i < length; i++) {
        const tag = getVertexGearTag((gear as AnyVertexGear[])[i]);
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
