import fs from "fs";

export const getJSON = <T>(filename: string): T | null => {
  if (!fs.existsSync(filename)) {
    return null;
  }

  try {
    const data = fs.readFileSync(filename, "utf-8");
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
};

export const setJSON = (filename: string, object: Object): void => {
  const data = JSON.stringify(object, null, 2);
  fs.writeFileSync(filename, data, "utf-8");
};
