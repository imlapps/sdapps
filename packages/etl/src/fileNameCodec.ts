import basex from "base-x";

export const fileNameCodec = basex(
  // [0-9A-Za-z_]+
  // Should match isSafeFileName
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_",
);
