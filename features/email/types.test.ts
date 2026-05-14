import { describe, it, expect } from "vitest";
import type { InboxFilters, ComposeFormData, ComposeMode } from "./types";

describe("email types", () => {
  it("InboxFilters should accept valid filter combinations", () => {
    const filters: InboxFilters = {
      account_id: "uuid-here",
      search: "test query",
      label: "INBOX",
      priority: "high",
    };

    expect(filters.account_id).toBe("uuid-here");
    expect(filters.priority).toBe("high");
  });

  it("ComposeFormData should have required fields", () => {
    const data: ComposeFormData = {
      from_account_id: "acc-1",
      to: "test@example.com",
      subject: "Test Subject",
      body: "Hello",
    };

    expect(data.from_account_id).toBeDefined();
    expect(data.to).toBeDefined();
    expect(data.subject).toBeDefined();
  });

  it("ComposeMode should be one of new, reply, forward", () => {
    const modes: ComposeMode[] = ["new", "reply", "forward"];
    expect(modes).toContain("new");
    expect(modes).toContain("reply");
    expect(modes).toContain("forward");
  });
});
