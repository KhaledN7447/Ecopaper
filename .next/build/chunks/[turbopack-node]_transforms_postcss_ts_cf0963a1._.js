module.exports = [
"[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/ecopaper-v2/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "build/chunks/390d8_581b33a7._.js",
  "build/chunks/[root-of-the-server]__20b8fcbb._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/ecopaper-v2/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];