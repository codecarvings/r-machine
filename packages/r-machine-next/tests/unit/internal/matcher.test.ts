import { describe, expect, it } from "vitest";
import { defaultPathMatcher } from "../../../src/internal/matcher.js";

describe("defaultPathMatcher", () => {
  describe("system routes", () => {
    it("should not match /_next paths", () => {
      expect(defaultPathMatcher.test("/_next")).toBe(false);
      expect(defaultPathMatcher.test("/_next/")).toBe(false);
      expect(defaultPathMatcher.test("/_next/static/chunk.js")).toBe(false);
      expect(defaultPathMatcher.test("/_next/data/build-id/page.json")).toBe(false);
    });

    it("should not match /_vercel paths", () => {
      expect(defaultPathMatcher.test("/_vercel")).toBe(false);
      expect(defaultPathMatcher.test("/_vercel/")).toBe(false);
      expect(defaultPathMatcher.test("/_vercel/insights")).toBe(false);
    });

    it("should not match /api paths", () => {
      expect(defaultPathMatcher.test("/api")).toBe(false);
      expect(defaultPathMatcher.test("/api/")).toBe(false);
      expect(defaultPathMatcher.test("/api/users")).toBe(false);
      expect(defaultPathMatcher.test("/api/auth/login")).toBe(false);
    });
  });

  describe("file extensions", () => {
    it("should not match paths ending with a file extension", () => {
      expect(defaultPathMatcher.test("/favicon.ico")).toBe(false);
      expect(defaultPathMatcher.test("/robots.txt")).toBe(false);
      expect(defaultPathMatcher.test("/sitemap.xml")).toBe(false);
      expect(defaultPathMatcher.test("/styles.css")).toBe(false);
      expect(defaultPathMatcher.test("/script.js")).toBe(false);
      expect(defaultPathMatcher.test("/image.png")).toBe(false);
      expect(defaultPathMatcher.test("/photo.jpg")).toBe(false);
      expect(defaultPathMatcher.test("/logo.svg")).toBe(false);
    });

    it("should not match nested paths ending with a file extension", () => {
      expect(defaultPathMatcher.test("/assets/style.css")).toBe(false);
      expect(defaultPathMatcher.test("/images/hero.webp")).toBe(false);
      expect(defaultPathMatcher.test("/deep/nested/path/file.json")).toBe(false);
    });
  });

  describe("application routes", () => {
    it("should match the root path", () => {
      expect(defaultPathMatcher.test("/")).toBe(true);
    });

    it("should match simple page routes", () => {
      expect(defaultPathMatcher.test("/about")).toBe(true);
      expect(defaultPathMatcher.test("/contact")).toBe(true);
      expect(defaultPathMatcher.test("/pricing")).toBe(true);
    });

    it("should match nested page routes", () => {
      expect(defaultPathMatcher.test("/blog/my-post")).toBe(true);
      expect(defaultPathMatcher.test("/docs/getting-started")).toBe(true);
      expect(defaultPathMatcher.test("/a/b/c/d")).toBe(true);
    });

    it("should match routes with trailing slashes", () => {
      expect(defaultPathMatcher.test("/about/")).toBe(true);
      expect(defaultPathMatcher.test("/blog/my-post/")).toBe(true);
    });

    it("should match locale-prefixed routes", () => {
      expect(defaultPathMatcher.test("/en")).toBe(true);
      expect(defaultPathMatcher.test("/en/about")).toBe(true);
      expect(defaultPathMatcher.test("/fr/blog/post")).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should match paths starting with underscore that are not system routes", () => {
      expect(defaultPathMatcher.test("/_custom")).toBe(true);
      expect(defaultPathMatcher.test("/_nextgen")).toBe(true);
    });

    it("should match paths containing dots in non-final segments", () => {
      expect(defaultPathMatcher.test("/v1.0/docs")).toBe(true);
      expect(defaultPathMatcher.test("/user.name/profile")).toBe(true);
    });

    it("should not match non-root-relative paths", () => {
      expect(defaultPathMatcher.test("about")).toBe(false);
      expect(defaultPathMatcher.test("")).toBe(false);
    });
  });
});
