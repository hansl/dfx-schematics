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
        const packageJson = (tree.read("/package.json") !).toString();
        const json = JSON.parse(packageJson);
        const angularJsonContent = (tree.read("/angular.json") !).toString();
        const angularJson = JSON.parse(angularJsonContent);

        const angularProjectName = Object.keys(angularJson['projects'])[0] !;


        json["scripts"]["build"] = `mkdir -p canisters/${options.projectName}/assets; `
                                 + `ng build --prod && cat dist/${angularProjectName}/index.html `
                                 + `| grep -oE '[a-z0-9.-]*.js' | grep 2015 `
                                 + `| sed s%^%dist/${angularProjectName}/% `
                                 + `| xargs cat > canisters/${options.projectName}/assets/index.js`;
        tree.overwrite("/package.json", JSON.stringify(json, null, 4));
      },

      // Update tsconfig.json
      (tree) => {
        const tsConfigJson = (tree.read("/tsconfig.json") !).toString();
        const json = JSON.parse(tsConfigJson);

        json['compilerOptions']['paths'] = Object.assign(json['compilerOptions']['paths'] || {}, {
          "ic:userlib": [
            `${process.env['HOME']}/.cache/dfinity/versions/0.5.0/js-user-library/dist/lib.prod.js`
          ],
          "ic:canisters/*": ["canisters/*/main.js"],
          "ic:idl/*": ["canisters/*/main.did.js"]
        });
        tree.overwrite("/tsconfig.json", JSON.stringify(json, null, 4));
      }
    ]);
  };
}
