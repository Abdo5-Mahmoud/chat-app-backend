import bcrypt from "bcrypt";

export const generateHash = ({
  plaintText = "",
  salt = process.env.SALT_ROUNDS,
} = {}) => {
  const hash = bcrypt.hashSync(plaintText, parseInt(salt));
  return hash;
};
export const compareHash = ({ plaintText = "", hashValue = "" } = {}) => {
  const match = bcrypt.compareSync(plaintText, hashValue);

  return match;
};
