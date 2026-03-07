const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'app/actions');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
const ignoreFiles = ['auth.ts', 'magic-link.ts'];

for (const file of files) {
    if (ignoreFiles.includes(file)) continue;
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

    let modifications = [];

    function visit(node) {
        if (ts.isFunctionDeclaration(node)) {
            const isExported = node.modifiers && node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
            const isAsync = node.modifiers && node.modifiers.some(m => m.kind === ts.SyntaxKind.AsyncKeyword);

            if (isExported && isAsync && node.body) {
                // Check if already injected
                const bodyText = node.body.getText();
                if (!bodyText.includes('getSession()') && !bodyText.includes('verifySession()')) {
                    const blockStart = node.body.getStart();
                    modifications.push({
                        pos: blockStart + 1,
                        text: `\n    const session = await getSession();\n    if (!session) throw new Error("Unauthorized");`
                    });
                }
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    if (modifications.length > 0) {
        modifications.sort((a, b) => b.pos - a.pos);

        let newContent = content;
        for (const mod of modifications) {
            newContent = newContent.slice(0, mod.pos) + mod.text + newContent.slice(mod.pos);
        }

        if (!newContent.includes('getSession') && !newContent.includes('verifySession')) {
            if (newContent.match(/['"]use server['"];?/)) {
                newContent = newContent.replace(/['"]use server['"];?/, "'use server'\nimport { getSession } from '@/lib/session'");
            } else {
                newContent = "import { getSession } from '@/lib/session'\n" + newContent;
            }
        }

        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${file} (${modifications.length} functions)`);
    }
}
