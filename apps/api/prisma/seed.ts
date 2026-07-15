import { PrismaClient } from "@prisma/client";
import { AdminAuthService } from "../src/modules/admin-auth/index.js";

const prisma = new PrismaClient();
const DEFAULT_EVENT_ID = "evt_main";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@tuning-podium.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me-now-123";
  await AdminAuthService.ensureSeedAdmin(adminEmail, adminPassword, "Organizer");

  const event = await prisma.event.upsert({
    where: { slug: "main" },
    create: {
      id: DEFAULT_EVENT_ID,
      slug: "main",
      name: "Hauptevent",
    },
    update: {},
  });

  const vehicleCount = await prisma.vehicle.count({ where: { eventId: event.id } });
  if (vehicleCount === 0) {
    const demoVehicles = Array.from({ length: 5 }, (_, index) => ({
      eventId: event.id,
      name: `Demo-Fahrzeug ${index + 1}`,
      number: index + 1,
      active: true,
    }));
    await prisma.vehicle.createMany({ data: demoVehicles });
    console.log(`Seeded ${demoVehicles.length} demo vehicles.`);
  }

  console.log(`Admin login: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
