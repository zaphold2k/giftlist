import { describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { requireOwnedItem, requireOwnedList, requireSession } from "@/lib/authz";
import { createItem, createList, createParent } from "../helpers/factories";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

async function mockSessionAs(parentId: string | undefined) {
  const { auth } = await import("@/auth");
  vi.mocked(auth).mockResolvedValue(
    parentId ? ({ user: { id: parentId } } as never) : (null as never)
  );
}

describe("requireSession", () => {
  it("throws when there is no session user", async () => {
    await mockSessionAs(undefined);
    await expect(requireSession()).rejects.toThrow("No autorizado");
  });

  it("returns the session when a user is present", async () => {
    const parent = await createParent();
    await mockSessionAs(parent.id);
    const session = await requireSession();
    expect(session.user.id).toBe(parent.id);
  });
});

describe("requireOwnedList", () => {
  it("allows a registered admin", async () => {
    const parent = await createParent();
    const list = await createList(parent.id);
    await mockSessionAs(parent.id);
    await expect(requireOwnedList(list.id)).resolves.toMatchObject({ id: list.id });
  });

  it("denies a parent who is not a member of GiftListAdmin, even if GiftList.parentId matches", async () => {
    // Regression test for the cancelReservation bug (see AGENTS.md): the
    // creator field (`GiftList.parentId`) must never be used for
    // authorization on its own — only current GiftListAdmin membership.
    const creator = await createParent();
    const otherAdmin = await createParent();
    const list = await createList(creator.id);
    await prisma.giftListAdmin.create({ data: { listId: list.id, parentId: otherAdmin.id } });
    await prisma.giftListAdmin.deleteMany({ where: { listId: list.id, parentId: creator.id } });

    await mockSessionAs(creator.id);
    await expect(requireOwnedList(list.id)).rejects.toThrow("No autorizado");

    await mockSessionAs(otherAdmin.id);
    await expect(requireOwnedList(list.id)).resolves.toMatchObject({ id: list.id });
  });

  it("denies access to a list that does not exist", async () => {
    const parent = await createParent();
    await mockSessionAs(parent.id);
    await expect(requireOwnedList("nonexistent-id")).rejects.toThrow("No autorizado");
  });
});

describe("requireOwnedItem", () => {
  it("allows an admin of the item's list", async () => {
    const parent = await createParent();
    const list = await createList(parent.id);
    const item = await createItem(list.id);
    await mockSessionAs(parent.id);
    await expect(requireOwnedItem(item.id)).resolves.toMatchObject({ id: item.id });
  });

  it("denies a parent with no admin membership on the item's list", async () => {
    const owner = await createParent();
    const stranger = await createParent();
    const list = await createList(owner.id);
    const item = await createItem(list.id);
    await mockSessionAs(stranger.id);
    await expect(requireOwnedItem(item.id)).rejects.toThrow("No autorizado");
  });
});
