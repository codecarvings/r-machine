/**
 * Represents a parsed language range with its quality value.
 *
 * @see https://www.rfc-editor.org/rfc/rfc9110.html#name-accept-language
 * @see https://www.rfc-editor.org/rfc/rfc4647.html
 */
export interface AcceptLanguageEntry {
  /**
   * The language range (e.g., "en-US", "fr", "*")
   * Case-insensitive as per RFC 4647
   */
  range: string;

  /**
   * Quality value (weight) between 0 and 1, defaults to 1.0
   * RFC 9110 allows up to 3 decimal places
   */
  quality: number;
}

/**
 * Parses an Accept-Language header value according to RFC 9110 and RFC 4647.
 *
 * Grammar (simplified ABNF):
 * ```
 * Accept-Language = 1#( language-range [ weight ] )
 * language-range  = (1*8ALPHA *("-" 1*8alphanum)) / "*"
 * weight          = OWS ";" OWS "q=" qvalue
 * qvalue          = ( "0" [ "." 0*3DIGIT ] ) / ( "1" [ "." 0*3("0") ] )
 * ```
 *
 * Features:
 * - Parses comma-separated language ranges with optional quality values
 * - Quality values (q-values) range from 0.000 to 1.000 (default: 1.0)
 * - Returns entries sorted by quality (descending), then by order of appearance
 * - Validates language range syntax and q-value format
 * - Handles whitespace and case-insensitivity per spec
 * - Filters out invalid or zero-quality entries
 *
 * @param header - The Accept-Language header value to parse
 * @returns Array of parsed language entries sorted by preference (quality descending)
 *
 * @example
 * ```ts
 * fullParseAcceptLanguageHeader("en-US,en;q=0.9,fr;q=0.8")
 * // Returns:
 * // [
 * //   { range: "en-US", quality: 1.0 },
 * //   { range: "en", quality: 0.9 },
 * //   { range: "fr", quality: 0.8 }
 * // ]
 *
 * fullParseAcceptLanguageHeader("da, en-GB;q=0.8, en;q=0.7")
 * // Returns:
 * // [
 * //   { range: "da", quality: 1.0 },
 * //   { range: "en-GB", quality: 0.8 },
 * //   { range: "en", quality: 0.7 }
 * // ]
 * ```
 *
 * @see https://www.rfc-editor.org/rfc/rfc9110.html#name-accept-language
 * @see https://www.rfc-editor.org/rfc/rfc4647.html#section-2.1
 */
export function fullParseAcceptLanguageHeader(header: string): AcceptLanguageEntry[] {
  if (!header || typeof header !== "string") {
    return [];
  }

  // Trim the header
  const trimmed = header.trim();
  if (trimmed === "") {
    return [];
  }

  const entries: Array<AcceptLanguageEntry & { order: number }> = [];
  const parts = trimmed.split(",");

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) {
      continue;
    }

    // Split by semicolon to separate language-range from parameters
    const segments = part.split(";");
    const range = segments[0].trim();

    // Validate language range
    if (!isValidLanguageRange(range)) {
      continue;
    }

    // Parse quality value (default is 1.0)
    let quality = 1.0;

    // Look for q parameter in subsequent segments
    for (let j = 1; j < segments.length; j++) {
      const param = segments[j].trim();
      // RFC 9110: qvalue = ( "0" [ "." 0*3DIGIT ] ) / ( "1" [ "." 0*3("0") ] )
      // Must be exactly 0-1 with at most 3 decimal places
      const qMatch = /^q\s*=\s*(0(?:\.[0-9]{1,3})?|1(?:\.0{1,3})?)$/i.exec(param);

      if (param.toLowerCase().startsWith("q=") || param.toLowerCase().startsWith("q ")) {
        if (qMatch) {
          const qValue = Number.parseFloat(qMatch[1]);

          // Validate q-value range: 0.000 to 1.000
          if (Number.isNaN(qValue) || qValue < 0 || qValue > 1) {
            quality = -1; // Mark as invalid
            break;
          }

          quality = qValue;
          break;
        }
        // Found q parameter but it's malformed
        quality = -1;
        break;
      }
    }

    // Skip invalid or zero-quality entries
    if (quality <= 0) {
      continue;
    }

    entries.push({
      range,
      quality,
      order: i,
    });
  }

  // Sort by quality descending, then by order of appearance
  entries.sort((a, b) => {
    if (a.quality !== b.quality) {
      return b.quality - a.quality;
    }
    return a.order - b.order;
  });

  // Remove the order property before returning
  return entries.map(({ range, quality }) => ({ range, quality }));
}

/**
 * Parses an Accept-Language header value and returns a sorted array of language ranges.
 *
 * @param header - The Accept-Language header value to parse
 * @returns Array of language ranges sorted by preference (quality descending)
 *
 * @example
 * ```ts
 * parseAcceptLanguageHeader("en-US,en;q=0.9,fr;q=0.8")
 * // Returns: ["en-US", "en", "fr"]
 *
 * parseAcceptLanguageHeader("da, en-GB;q=0.8, en;q=0.7")
 * // Returns: ["da", "en-GB", "en"]
 * ```
 *
 * @see https://www.rfc-editor.org/rfc/rfc9110.html#name-accept-language
 */
export function parseAcceptLanguageHeader(header: string): string[] {
  return fullParseAcceptLanguageHeader(header).map((entry) => entry.range);
}

/**
 * Validates a language range according to RFC 4647.
 *
 * A valid language range is either:
 * - "*" (wildcard matching any language)
 * - 1-8 alphabetic characters optionally followed by subtags of 1-8 alphanumeric characters
 *   separated by hyphens
 *
 * Language ranges are case-insensitive.
 *
 * @param range - The language range to validate
 * @returns true if the range is valid, false otherwise
 *
 * @see https://www.rfc-editor.org/rfc/rfc4647.html#section-2.1
 */
function isValidLanguageRange(range: string): boolean {
  if (!range) {
    return false;
  }

  // Wildcard is always valid
  if (range === "*") {
    return true;
  }

  // RFC 4647: language-range = (1*8ALPHA *("-" 1*8alphanum)) / "*"
  // Also need to handle extended language ranges with wildcards in subtags
  const parts = range.split("-");

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Empty part (e.g., "en--US") is invalid
    if (!part) {
      return false;
    }

    // Wildcards are allowed in extended language ranges
    if (part === "*") {
      continue;
    }

    // First part must be 1-8 alphabetic characters
    if (i === 0) {
      if (!/^[a-zA-Z]{1,8}$/.test(part)) {
        return false;
      }
    } else {
      // Subsequent parts must be 1-8 alphanumeric characters
      if (!/^[a-zA-Z0-9]{1,8}$/.test(part)) {
        return false;
      }
    }
  }

  return true;
}
