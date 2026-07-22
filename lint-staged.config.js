const toPackagePaths = (packagePath, filenames) =>
  filenames
    .map((file) => file.replace(/\\/g, "/"))
    .map((file) => file.replace(new RegExp(`^${packagePath}/`), ""))
    .join(" ");

const eslintFix = (packagePath) => (filenames) => {
  const files = toPackagePaths(packagePath, filenames);
  return `npm exec --prefix ${packagePath} -- eslint --fix ${files}`;
};

const prettierWrite = (packagePath) => (filenames) => {
  const files = toPackagePaths(packagePath, filenames);
  return `npm exec --prefix ${packagePath} -- prettier --write ${files}`;
};

export default {
  "backend/**/*.js": [eslintFix("backend"), prettierWrite("backend")],
  "frontend/**/*.{js,jsx}": [eslintFix("frontend")],
};
