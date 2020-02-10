import {
  Rule,
  apply,
  applyTemplates,
  mergeWith,
  url, chain,
} from '@angular-devkit/schematics';

export function dfx(options: any): Rule {
  return () => {
    return chain([
      mergeWith(
        apply(url('./files'), [
          applyTemplates({
            project_name: options.projectName,
          }),
        ]),
      ),
      (tree) => {
        if (!tree.exists("/.gitignore")) {
          tree.create("/.gitignore", "");
        }

        let gitignore = (tree.read("/.gitignore") || "").toString();
        gitignore += `
# Build artifacts
canisters/

# dfx temporary files
.dfx/
`;
        tree.overwrite("/.gitignore", gitignore);
      },
    ]);
  };
}
