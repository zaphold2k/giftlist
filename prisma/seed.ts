import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { generateSlug } from "../lib/slug";

async function main() {
  const passwordHash = await bcrypt.hash("supersecreta1", 12);
  const parent = await prisma.parent.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: { email: "test@example.com", name: "Test", passwordHash },
  });

  const existing = await prisma.giftList.findFirst({ where: { parentId: parent.id } });
  if (!existing) {
    await prisma.giftList.create({
      data: {
        slug: generateSlug(),
        title: "Lista de ejemplo para el bebé",
        description: "Algunas cosas que nos harían mucha ilusión.",
        parentId: parent.id,
        admins: { create: { parentId: parent.id } },
        items: {
          create: [
            { name: "Carrito de paseo", priority: "HIGH", quantityWanted: 1, position: 0 },
            { name: "Bodies talla 0-3 meses", priority: "MEDIUM", quantityWanted: 3, position: 1 },
            { name: "Libro de tela", priority: "LOW", quantityWanted: 1, position: 2 },
          ],
        },
      },
    });
  }
  console.log("seed ok:", parent.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
