import { db } from "@/lib/db";
import { SessionUser } from "@/lib/types";

export async function upsertUser(profile: SessionUser) {
  return db.user.upsert({
    where: { datagsmId: profile.id },
    create: {
      datagsmId: profile.id,
      provider: profile.provider ?? "datagsm",
      email: profile.email,
      name: profile.name,
      grade: profile.grade,
      classNumber: profile.classNumber,
      studentNumber: profile.number,
    },
    update: {
      provider: profile.provider ?? "datagsm",
      email: profile.email,
      name: profile.name,
      grade: profile.grade,
      classNumber: profile.classNumber,
      studentNumber: profile.number,
      lastLoginAt: new Date(),
    },
  });
}

export async function findUserBySession(profile: SessionUser) {
  return db.user.findUnique({ where: { datagsmId: profile.id } });
}
