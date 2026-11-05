import { test } from "node:test";
import assert from "node:assert/strict";
import { supportLink } from "../src/support.js";

test("support link accepts https donation sites only", () => {
  assert.equal(supportLink("https://ko-fi.com/zine"), "https://ko-fi.com/zine");
  assert.equal(supportLink("https://buymeacoffee.com/zine"), "https://buymeacoffee.com/zine");
  assert.equal(supportLink(""), null);
  assert.equal(supportLink("http://ko-fi.com/zine"), null);
  assert.equal(supportLink("https://evil.com/ko-fi.com"), null);
  assert.equal(supportLink("https://ko-fi.com.evil.com/x"), null);
  assert.equal(supportLink("https://user@ko-fi.com/x"), null);
  assert.equal(supportLink("javascript:alert(1)"), null);
  assert.equal(supportLink(null), null);
});
