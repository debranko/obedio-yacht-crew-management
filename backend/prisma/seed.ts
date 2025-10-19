import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function readJson<T>(p: string): T | null {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as T; } catch { return null; }
}

async function seedAdmin() {
  const u = process.env.ADMIN_BOOTSTRAP_USER ?? 'admin';
  const p = process.env.ADMIN_BOOTSTRAP_PASS ?? 'admin123';
  const e = process.env.ADMIN_BOOTSTRAP_EMAIL ?? 'admin@yacht.local';
  const hash = await bcrypt.hash(p, 10);
  await prisma.user.upsert({
    where: { username: u },
    update: {},
    create: { username: u, email: e, password: hash, role: 'admin' }
  });
}

async function main() {
  await seedAdmin();

  const candidates = [
    path.resolve(process.cwd(), '../src/data'),  // frontend/src/data
    path.resolve(process.cwd(), './src/data'),   // backend/src/data
  ];
  const dataDir = candidates.find(fs.existsSync);

  type CrewJson = Array<{ name:string, position:string, department:string, status?:string, contact?:string, email?:string, joinDate?:string, role?:string }>;
  type LocJson = Array<{ name:string, type:string, description?:string }>;
  type GuestJson = Array<{ name?:string, firstName?:string, lastName?:string, preferredName?:string, nationality?:string, languages?:string[], photo?:string, status?:string }>;

  const crew = dataDir ? readJson<CrewJson>(path.join(dataDir, 'crew.json')) ?? [] : [];
  const locations = dataDir ? readJson<LocJson>(path.join(dataDir, 'locations.json')) ?? [] : [];
  const guests = dataDir ? readJson<GuestJson>(path.join(dataDir, 'guests.json')) ?? [] : [];

  if (crew.length) {
    await prisma.crewMember.createMany({
      data: crew.map(c => ({
        name: c.name,
        position: c.position,
        department: c.department,
        status: c.status ?? 'active',
        contact: c.contact ?? null,
        email: c.email ?? null,
        joinDate: c.joinDate ? new Date(c.joinDate) : null,
        role: c.role ?? null
      })),
      skipDuplicates: true,
    });
  }

  if (locations.length) {
    await prisma.location.createMany({
      data: locations.map(l => ({
        name: l.name,
        type: l.type,
        description: l.description ?? null
      })),
      skipDuplicates: true,
    });
  }

  if (guests.length) {
    await prisma.guest.createMany({
      data: guests.map(g => {
        let first = g.firstName, last = g.lastName;
        if (!first && !last && g.name) {
          const parts = g.name.trim().split(/\s+/);
          first = parts[0]; last = parts.slice(1).join(' ') || 'Guest';
        }
        return {
          firstName: first ?? 'Guest',
          lastName: last ?? 'Unknown',
          preferredName: g.preferredName ?? null,
          nationality: g.nationality ?? null,
          languages: g.languages ?? [],
          photo: g.photo ?? null,
          status: g.status ?? 'onboard'
        };
      }),
      skipDuplicates: true,
    });
  }
}

main().then(async () => {
  console.log('Seed done');
  await prisma.$disconnect();
}).catch(async e => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});