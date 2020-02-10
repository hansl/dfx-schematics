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

      // Update gitignore.
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

      // Update package.json
      (tree) => {
        const packageJson = (tree.read("/package.json") || "").toString();
        const json = JSON.parse(packageJson);

        json["scripts"]["build"] = "mkdir -p canisters/hello/assets; ng build --prod && cat dist/dfx-demo/index.html | grep -oE '[a-z0-9.-]*.js' | grep 2015 | sed s%^%dist/dfx-demo/% | xargs cat > canisters/hello/assets/index.js";
        tree.overwrite("/package.json", JSON.stringify(json));
      }
    ]);
  };
}
