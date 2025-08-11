
import path from "path";
import fs from "fs-extra";

function main() {
  const selfPkgPath = path.resolve(__dirname, "package.json");
  const middlewarePkgPath = path.resolve(__dirname, "..", "emittor-middlewares", "package.json");

  if (!fs.pathExistsSync(selfPkgPath)) {
    throw new Error(`Missing package.json at ${selfPkgPath}`);
  }
  if (!fs.pathExistsSync(middlewarePkgPath)) {
    throw new Error(`Missing package.json at ${middlewarePkgPath}`);
  }

  const selfPkg = fs.readJsonSync(selfPkgPath);
  const version: string | undefined = selfPkg?.version;
  const pkgName: string | undefined = selfPkg?.name;

  if (!version || typeof version !== "string") {
    throw new Error(`packages/emittor/package.json has no valid "version"`);
  }
  if (!pkgName || typeof pkgName !== "string") {
    throw new Error(`packages/emittor/package.json has no valid "name"`);
  }

  const middlewarePkg = fs.readJsonSync(middlewarePkgPath);

  // Ensure peerDependencies exists
  middlewarePkg.peerDependencies = middlewarePkg.peerDependencies || {};

  // Optional: clean up previously hardcoded key if different
  if (
    middlewarePkg.peerDependencies.emittor &&
    pkgName !== "emittor" &&
    !middlewarePkg.peerDependencies[pkgName]
  ) {
    delete middlewarePkg.peerDependencies.emittor;
  }

  // Set values
  middlewarePkg.version = version;
  middlewarePkg.peerDependencies[pkgName] = `^${version}`;

  // Persist with stable formatting
  fs.writeJsonSync(middlewarePkgPath, middlewarePkg, { spaces: 2 });

  console.log(
    `[preBuild] Updated middleware-emittor: version=${version}, peerDependencies[${pkgName}]=^${version}`
  );
}

try {
  main();
} catch (err) {
  console.error("[preBuild] Failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}
