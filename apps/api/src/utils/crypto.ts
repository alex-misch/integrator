import * as bcrypt from 'bcryptjs';

export const getPasswordHash = async (password: string) => {
  const salt = await bcrypt.genSalt(+process.env.PWD_BCRYPT_ROUNDS || 10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);
