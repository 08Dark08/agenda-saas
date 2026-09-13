import bcrypt from "bcryptjs";
export const hashPassword = async (p: string) => bcrypt.hash(p, 12);
export const verifyPassword = async (p: string, h: string) => bcrypt.compare(p, h);