import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
import { describe, expect, it } from "vitest";

const sourceRoot = fileURLToPath(new URL("..", import.meta.url));
const layers = ["domain", "application", "ui", "app"] as const;
type Layer = (typeof layers)[number];

const allowedDependencies: Record<Layer, readonly Layer[]> = {
  domain: ["domain"],
  application: ["domain", "application"],
  ui: ["domain", "application", "ui"],
  app: ["domain", "application", "ui", "app"],
};

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return collectSourceFiles(path);
    }

    return /\.(ts|tsx)$/.test(entry) && !entry.includes(".test.")
      ? [path]
      : [];
  });
}

function resolveSourceImport(
  importer: string,
  specifier: string,
): string | null {
  if (!specifier.startsWith(".")) {
    return null;
  }

  const target = resolve(dirname(importer), specifier);
  const candidates = [
    `${target}.ts`,
    `${target}.tsx`,
    join(target, "index.ts"),
    join(target, "index.tsx"),
  ];
  return candidates.find(existsSync) ?? null;
}

function sourceImports(file: string): string[] {
  const source = parse(readFileSync(file, "utf8"), {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });
  const imports: string[] = [];

  source.program.body.forEach((node) => {
    if (
      (node.type === "ImportDeclaration" ||
        node.type === "ExportNamedDeclaration" ||
        node.type === "ExportAllDeclaration") &&
      node.source
    ) {
      const imported = resolveSourceImport(file, node.source.value);
      if (imported) {
        imports.push(imported);
      }
    }
  });

  return imports;
}

function layerOf(file: string): Layer {
  return relative(sourceRoot, file).split(sep)[0] as Layer;
}

const files = layers.flatMap((layer) =>
  collectSourceFiles(join(sourceRoot, layer)),
);
const graph = new Map(files.map((file) => [file, sourceImports(file)]));

describe("source architecture", () => {
  it("keeps product source inside the defined layers", () => {
    const allowedRootEntries = new Set([
      ...layers,
      "main.tsx",
      "styles",
      "test",
      "vite-env.d.ts",
    ]);
    const unexpectedEntries = readdirSync(sourceRoot).filter(
      (entry) => !allowedRootEntries.has(entry),
    );

    expect(unexpectedEntries).toEqual([]);
  });

  it("keeps dependencies pointing inward", () => {
    const violations = files.flatMap((file) => {
      const fromLayer = layerOf(file);
      return (graph.get(file) ?? []).flatMap((dependency) => {
        const toLayer = layerOf(dependency);
        return allowedDependencies[fromLayer].includes(toLayer)
          ? []
          : [
              `${relative(sourceRoot, file)} (${fromLayer}) imports ` +
                `${relative(sourceRoot, dependency)} (${toLayer})`,
            ];
      });
    });

    expect(violations).toEqual([]);
  });

  it("contains no source dependency cycles", () => {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const cycles: string[] = [];

    const visit = (file: string, path: string[]) => {
      if (visiting.has(file)) {
        const cycleStart = path.indexOf(file);
        cycles.push(
          [...path.slice(cycleStart), file]
            .map((entry) => relative(sourceRoot, entry))
            .join(" -> "),
        );
        return;
      }
      if (visited.has(file)) {
        return;
      }

      visiting.add(file);
      for (const dependency of graph.get(file) ?? []) {
        visit(dependency, [...path, file]);
      }
      visiting.delete(file);
      visited.add(file);
    };

    files.forEach((file) => visit(file, []));
    expect(cycles).toEqual([]);
  });
});
