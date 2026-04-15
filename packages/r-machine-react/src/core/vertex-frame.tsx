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

import { getVertexGearTag, type VertexGearMap, type VertexGearRes, type VertexGearTag } from "r-machine/core";
import { createContext, type ReactNode, useContext, useRef } from "react";

const Context = createContext<VertexGearMap | undefined>(undefined);
Context.displayName = "VertexFrameContext";

interface VertexFrameProps {
  readonly gear: VertexGearRes | VertexGearRes[];
  readonly children: ReactNode;
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
      const newTag = getVertexGearTag(gear[i] as unknown as VertexGearRes);
      if ((current.tags as VertexGearTag[])[i] !== newTag) {
        update = true;
        break;
      }
    }
  } else {
    const newTag = getVertexGearTag(gear as unknown as VertexGearRes);
    update = (current.tags as VertexGearTag) !== newTag;
  }

  if (update) {
    data.current = {
      parentMap,
      length,
      tags: isArray
        ? gear.map((g) => getVertexGearTag(g as unknown as VertexGearRes))
        : getVertexGearTag(gear as unknown as VertexGearRes),
    };

    if (length === -1) {
      const tag = getVertexGearTag(gear as unknown as VertexGearRes)!;
      value.current = parentMap ? { ...parentMap, [tag.namespace]: tag.genId } : { [tag.namespace]: tag.genId };
    } else {
      const map: VertexGearMap = parentMap ? { ...parentMap } : {};
      for (let i = 0; i < length; i++) {
        const tag = getVertexGearTag((gear as VertexGearRes[])[i]);
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
