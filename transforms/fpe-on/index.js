const { getParser } = require('codemod-cli').jscodeshift;
const { getOptions } = require('codemod-cli');

module.exports = function transformer(file, api) {
  const j = getParser(api);
  const options = getOptions();
  const root = j(file.source);

  let alreadyHasImport = false;

  const importDeclaration = root.find(j.ImportDeclaration, {
    source: {
      value: '@ember/object/evented',
    },
  });

  const importComputed = importDeclaration.find(j.ImportSpecifier, { imported: { name: 'on' } });

  if (importComputed.size()) alreadyHasImport = true;


  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { type: "FunctionExpression" },
        property: { name: "on" }
      }
    })
    //.forEach(p => console.log(p))
    .replaceWith(path => {
      let onImport = j.importDeclaration(
        [j.importSpecifier(j.identifier("on"))],
        j.literal("@ember/object/evented")
      );


      if (!alreadyHasImport) {
        let body = root.get().value.program.body;
        body.unshift(onImport);

        alreadyHasImport = true;
      }

      return j.callExpression(
        j.identifier("on"),
        path.value.arguments.concat(path.value.callee.object)
      );
    });


  return root.toSource({quote: 'single'});
}
