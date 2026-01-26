import { Project, SyntaxKind, Identifier } from "ts-morph";
import fs from "node:fs";
import path from "node:path";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

const rootDir = project.getDirectoryOrThrow(".").getPath();

function rel(p: string) {
  const r = path.relative(rootDir, p).replace(/\\/g, "/");
  return r.startsWith("..") ? p.replace(/\\/g, "/") : r;
}

function isInSrc(filePath: string) {
  const r = rel(filePath);
  return (
    r.startsWith("src/") &&
    !r.includes("/node_modules/") &&
    !r.endsWith(".d.ts")
  );
}

type FnInfo = {
  id: string; // clave estable (archivo + nombre + pos)
  name: string;
  file: string;
  startLine: number;
  exported: boolean;
  signature: string;
  returnType: string;
  refs: Set<string>; // archivos donde se referencia
};

const fnMap = new Map<string, FnInfo>();

function makeId(file: string, name: string, startLine: number) {
  return `${file}::${name}::L${startLine}`;
}

function addFn(info: Omit<FnInfo, "refs">) {
  fnMap.set(info.id, { ...info, refs: new Set<string>() });
}

// 1) Recolectar funciones
for (const sf of project.getSourceFiles()) {
  const filePath = sf.getFilePath();
  if (!isInSrc(filePath)) continue;

  const file = rel(filePath);

  // Function declarations: function foo() {}
  for (const fn of sf.getFunctions()) {
    const name = fn.getName() ?? "(anonymous)";
    const startLine = fn.getStartLineNumber();
    const id = makeId(file, name, startLine);

    addFn({
      id,
      name,
      file,
      startLine,
      exported: fn.isExported(),
      signature: fn.getType().getText(fn),
      returnType: fn.getReturnType().getText(fn),
    });
  }

  // const foo = () => {} / const foo = function() {}
  for (const v of sf.getVariableDeclarations()) {
    const init = v.getInitializer();
    if (!init) continue;

    const isFn =
      init.getKind() === SyntaxKind.ArrowFunction ||
      init.getKind() === SyntaxKind.FunctionExpression;

    if (!isFn) continue;

    const name = v.getName();
    const startLine = v.getStartLineNumber();
    const id = makeId(file, name, startLine);

    const callSig = v.getType().getCallSignatures()[0];
    const returnType = callSig?.getReturnType().getText(v) ?? "unknown";

    addFn({
      id,
      name,
      file,
      startLine,
      exported: v.isExported(),
      signature: v.getType().getText(v), // suele ser "(a: A) => B"
      returnType,
    });
  }

  // Métodos de clase: class X { method() {} }
  for (const cls of sf.getClasses()) {
    for (const m of cls.getMethods()) {
      const methodName = m.getName();
      const className = cls.getName() ?? "(anonymous-class)";
      const name = `${className}.${methodName}`;
      const startLine = m.getStartLineNumber();
      const id = makeId(file, name, startLine);

      addFn({
        id,
        name,
        file,
        startLine,
        exported: cls.isExported(), // aproximación útil
        signature: m.getType().getText(m),
        returnType: m.getReturnType().getText(m),
      });
    }
  }
}

// 2) Indexar referencias: para cada función, ver dónde se usa su símbolo
for (const info of fnMap.values()) {
  const sf = project.getSourceFile(info.file);
  if (!sf) continue;

  // Buscar el nodo exacto por línea (aprox) y nombre
  // Estrategia: localizar el primer identificador con ese nombre en el archivo cerca de startLine
  // y desde ahí obtener symbol -> findReferences.
  const targetFile = project.getSourceFileOrThrow(
    path.join(rootDir, info.file),
  );

  // Encontrar identificadores candidatos
  const ids = targetFile
    .getDescendantsOfKind(SyntaxKind.Identifier)
    .filter(
      (i) =>
        i.getText() ===
        (info.name.includes(".") ? info.name.split(".").pop()! : info.name),
    );

  // Elegir el más cercano a startLine
  let best: Identifier | undefined;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const i of ids) {
    const ln = i.getStartLineNumber();
    const dist = Math.abs(ln - info.startLine);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }

  // Si no se pudo resolver el símbolo, saltar
  if (!best) continue;

  const refs = best.findReferences();
  for (const ref of refs) {
    for (const r of ref.getReferences()) {
      const refSf = r.getSourceFile();
      const refPath = refSf.getFilePath();
      if (!isInSrc(refPath)) continue;

      const refFile = rel(refPath);

      // Evitar contar la referencia donde se declara (la propia función)
      if (refFile === info.file) {
        // Aun así, dentro del mismo archivo puede haber usos reales.
        // Para no complicar, solo filtramos el identificador de declaración cuando cae en la misma línea aproximada.
        const ln = r.getNode().getStartLineNumber();
        if (Math.abs(ln - info.startLine) <= 1) continue;
      }

      fnMap.get(info.id)!.refs.add(refFile);
    }
  }
}

// 3) Generar Markdown
const date = new Date().toISOString();

const byFile = new Map<string, FnInfo[]>();
for (const f of fnMap.values()) {
  if (!byFile.has(f.file)) byFile.set(f.file, []);
  byFile.get(f.file)!.push(f);
}

for (const arr of byFile.values()) {
  arr.sort((a, b) => a.name.localeCompare(b.name));
}

const files = Array.from(byFile.keys()).sort((a, b) => a.localeCompare(b));

let md = `# 🗺️ Function Map + Usos (TypeScript)\n\n`;
md += `> Generado automáticamente: ${date}\n`;
md += `> Incluye **tipo de retorno** (estático) y **archivos donde se referencia** (call graph simple).\n\n`;

md += `## Cómo leer esto\n`;
md += `- **export/local**: si la función está exportada o es interna del archivo.\n`;
md += `- **retorno**: tipo inferido por TypeScript.\n`;
md += `- **usada en**: lista de archivos que la referencian (imports/llamadas/uso como callback, etc.).\n\n`;

for (const file of files) {
  md += `## ${file}\n\n`;
  for (const f of byFile.get(file)!) {
    const badge = f.exported ? "export" : "local";
    md += `- \`${f.name}\` (**${badge}**) → \`${f.returnType}\`\n`;
    md += `  - firma: \`${f.signature}\`\n`;

    const refs = Array.from(f.refs).sort((a, b) => a.localeCompare(b));
    if (refs.length === 0) {
      md += `  - usada en: _(sin referencias detectadas)_\n`;
    } else {
      md += `  - usada en:\n`;
      for (const r of refs) md += `    - \`${r}\`\n`;
    }
  }
  md += `\n`;
}

fs.writeFileSync("FUNCTION_MAP.md", md, "utf8");
console.log("✅ FUNCTION_MAP.md generado");
