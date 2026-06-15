// A class literally named `ResourceAtlas` but NOT built from defineLayout(), so
// it has no `shape` property. The static extractor locates it by name, then
// fails to find `shape` → "atlas-extraction-failed".
export class ResourceAtlas {
  readonly notShape = true;
}
