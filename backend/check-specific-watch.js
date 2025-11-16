const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const watch = await prisma.device.findFirst({
    where: { deviceId: '63c0da87cdc53bdb' },
    include: { crewMember: true }
  });

  console.log(JSON.stringify(watch, null, 2));
  await prisma.$disconnect();
})();
