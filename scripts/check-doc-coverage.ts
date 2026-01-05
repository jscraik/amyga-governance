import { Project } from "ts-morph";

// Use tsconfig.base.json as root config
const project = new Project({
    tsConfigFilePath: "tsconfig.base.json"
});

let failures = 0;

for (const source of project.getSourceFiles()) {
    for (const exp of source.getExportedDeclarations()) {
        for (const decl of exp[1]) {
            // @ts-expect-error -- ts-morph getJsDoc is generic but available on specific nodes
            const docs = decl.getJsDoc?.();
            // Simple check for presence. 
            // Note: decl can be various types (FunctionDeclaration, VariableDeclaration, etc.)
            // getJsDoc exists on most exportable nodes.
            if (!docs || docs.length === 0) {
                // Fallback check for VariableStatement if decl is VariableDeclaration
                let hasDocs = false;
                if (decl.getKindName() === 'VariableDeclaration') {
                    // @ts-expect-error -- navigating up to statement
                    const parent = decl.getParent?.().getParent?.(); // VariableDeclarationList -> VariableStatement
                    // @ts-expect-error -- check parent docs
                    if (parent?.getJsDoc?.().length > 0) hasDocs = true;
                }

                if (!hasDocs) {
                    console.error(
                        `❌ Missing docs for public export: ${exp[0]} (${source.getFilePath()})`
                    );
                    failures++;
                }
            }
        }
    }
}

if (failures > 0) {
    process.exit(1);
}
