import { nanoid } from "nanoid";

// The slug doubles as the public capability URL for a list (guests have no
// account), so it must be unguessable — not derived from the title.
export function generateSlug(): string {
  return nanoid(12);
}
