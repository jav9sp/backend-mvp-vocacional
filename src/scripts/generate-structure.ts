import dirTree from "directory-tree";
import fs from "fs";

type TreeNode = {
  name: string;
  children?: TreeNode[];
};

const tree = dirTree("./", {
  exclude: /node_modules|\.git|dist|build/,
}) as TreeNode;

function toMarkdown(node: TreeNode, depth = 0): string {
  const indent = "  ".repeat(depth);
  let md = `${indent}- ${node.name}\n`;

  if (node.children) {
    for (const child of node.children) {
      md += toMarkdown(child, depth + 1);
    }
  }
  return md;
}

const markdown = `# 📂 Estructura del proyecto

> Generado automáticamente

${toMarkdown(tree)}
`;

fs.writeFileSync("PROJECT_STRUCTURE.md", markdown, "utf-8");

console.log("✅ PROJECT_STRUCTURE.md generado");
