/* eslint-disable promise/always-return, promise/prefer-await-to-then */
const path=require( "path");
const fs = require("fs");
const rimRaf = require( "rimraf");
const extractLoader = require( "../src/extractLoader");
const compile = require( "./support/compile");


function tohavecontent(s)
{
    return fs.readFileSync(s).toString()

}



describe("extractLoader", () => {
    // Using beforeEach so that we can inspect the test compilation afterwards
    beforeEach(() => {
        rimRaf.sync(path.resolve(__dirname, "dist"));
    });
    it("should extract 'hello' into simple.js", async () =>
        compile({testModule: "simple.js"}).then(() => {
            const simpleJs = path.resolve(__dirname, "dist/simple-dist.js");
            console.log(simpleJs);

            expect(fs.existsSync(simpleJs)).toBeTruthy();
            expect(tohavecontent(simpleJs)).toContain("hello");
        }));
    it("should extract resource with query params into simple-css-with-query-param.js", async () =>{
        await compile({testModule: "simple-css-with-query-params.js"});
            const simpleJs = path.resolve(__dirname, "dist/simple-css-with-query-params-dist.js");

            expect(fs.existsSync(simpleJs)).toBeTruthy();
            expect(tohavecontent(simpleJs)).toContain("simple-dist.css");

        });
    it("should extract resource with query params and loader into simple-css-with-query-param-and-loader.js", async () =>{
        await compile({testModule: "simple-css-with-query-params-and-loader.js"});
            const simpleJs = path.resolve(__dirname, "dist/simple-css-with-query-params-and-loader-dist.js");

            expect(fs.existsSync(simpleJs)).toBeTruthy()
            expect(tohavecontent(simpleJs)).toContain("renamed-simple.css");
        });
    it("should extract the html of modules/simple.html into simple.html", () =>
        compile({testModule: "simple.html"}).then(() => {
            const simpleHtml = path.resolve(__dirname, "dist/simple-dist.html");

            expect(fs.existsSync(simpleHtml)).toBeTruthy()
            expect(tohavecontent(simpleHtml)).toContain(
                fs.readFileSync(
                    path.resolve(__dirname, "modules/simple.html"),
                    "utf8"
                ).toString()
            );
        }));
    it("should extract the css of modules/simple.css into simple.css", () =>
        compile({testModule: "simple.css"}).then(() => {
            const originalContent = fs.readFileSync(
                path.resolve(__dirname, "modules/simple.css"),
                "utf8"
            );
            const simpleCss = path.resolve(__dirname, "dist/simple-dist.css");
            expect(fs.existsSync(simpleCss)).toBeTruthy()


            expect(tohavecontent(simpleCss)).toMatch(new RegExp(originalContent));
        }));
    it("should extract the source maps", () =>
        compile({testModule: "simple.css"}).then(() => {
            const simpleCss = path.resolve(__dirname, "dist/simple-dist.css");
            expect(fs.existsSync(simpleCss)).toBeTruthy()
            expect(tohavecontent(simpleCss)).toMatch(/\/\*# sourceMappingURL=data:application\/json;charset=utf-8;base64,/);
        }));
    it("should extract the img url into img.js", () => compile({testModule: "img.js"}).then(() => {
        const imgJs = path.resolve(__dirname, "dist/img-dist.js");
        expect(fs.existsSync(imgJs)).toBeTruthy()

        expect(tohavecontent(imgJs)).toContain("hi-dist.jpg");
    }));
    it("should extract the img.html as file, emit the referenced img and rewrite the url", () =>
        compile({testModule: "img.html"}).then(() => {
            const imgHtml = path.resolve(__dirname, "dist/img-dist.html");
            const imgJpg = path.resolve(__dirname, "dist/hi-dist.jpg");

            expect(fs.existsSync(imgHtml)).toBeTruthy();
            expect(fs.existsSync(imgJpg)).toBeTruthy()
            expect(tohavecontent(imgHtml)).toMatch(
                /<img src="hi-dist\.jpg">/
            );
        }));
    it("should extract the img.css as file, emit the referenced img and rewrite the url", () =>
        compile({testModule: "img.css"}).then(() => {
            const imgCss = path.resolve(__dirname, "dist/img-dist.css");
            const imgJpg = path.resolve(__dirname, "dist/hi-dist.jpg");


            expect(fs.existsSync(imgCss)).toBeTruthy();
            expect(fs.existsSync(imgJpg)).toBeTruthy()

            expect(tohavecontent(imgCss)).toMatch(/ url\(hi-dist\.jpg\);/);
        }));
    it("should extract the stylesheet.html and the referenced img.css as file, emit the files and rewrite all urls", () =>
        compile({testModule: "stylesheet.html"}).then(() => {
            const stylesheetHtml = path.resolve(
                __dirname,
                "dist/stylesheet-dist.html"
            );
            const imgCss = path.resolve(__dirname, "dist/img-dist.css");
            const imgJpg = path.resolve(__dirname, "dist/hi-dist.jpg");


            expect(fs.existsSync(stylesheetHtml)).toBeTruthy();
            expect(fs.existsSync(imgCss)).toBeTruthy()
            expect(fs.existsSync(imgJpg)).toBeTruthy()


            expect(tohavecontent(stylesheetHtml)).toMatch(
                /<link href="img-dist\.css"/
            );
            expect(tohavecontent(stylesheetHtml)).toMatch(
                /<img src="hi-dist\.jpg">/
            );
            expect(tohavecontent(imgCss)).toMatch(/ url\(hi-dist\.jpg\);/);
        }));
    it("should extract css files with dependencies", () =>
        compile({testModule: "deep.css"}).then(() => {
            const deepCss = path.resolve(
                __dirname,
                "dist/deep-dist.css"
            );
            // const imgCss = path.resolve(__dirname, "dist/img-dist.css");
            const imgJpg = path.resolve(__dirname, "dist/hi-dist.jpg");

            expect(fs.existsSync(deepCss)).toBeTruthy();
            expect(fs.existsSync(imgJpg)).toBeTruthy();

            expect(tohavecontent(deepCss)).toMatch(/ url\(hi-dist\.jpg\);/);
        }));
    it("should track all dependencies", () =>
        compile({testModule: "stylesheet.html"}).then(stats => {
            const basePath = path.dirname(__dirname); // returns the parent dirname
            const dependencies = Array.from(
                stats.compilation.fileDependencies,
                dependency => dependency.slice(basePath.length)
            );

            expect(dependencies.sort()).toEqual(expect.arrayContaining(
                [
                    "/test/modules/hi.jpg",
                    "/test/modules/img.css",
                    "/test/modules/stylesheet.html",
                ].sort()
            ));
        }));
    it("should reference the img with the given publicPath", () =>
        compile({testModule: "img.html", publicPath: "/test/"}).then(() => {
            const imgHtml = path.resolve(__dirname, "dist/img-dist.html");
            const imgJpg = path.resolve(__dirname, "dist/hi-dist.jpg");

            expect(fs.existsSync(imgHtml)).toBeTruthy();
            expect(fs.existsSync(imgJpg)).toBeTruthy();

            expect(tohavecontent(imgHtml)).toMatch(
                /<img src="\/test\/hi-dist\.jpg">/
            );
        }));
    it("should override the configured publicPath with the publicPath query option", () =>
        compile({
            testModule: "img.html",
            publicPath: "/test/",
            loaderOptions: {publicPath: "/other/"},
        }).then(() => {
            const imgHtml = path.resolve(__dirname, "dist/img-dist.html");
            const imgJpg = path.resolve(__dirname, "dist/hi-dist.jpg");

            expect(fs.existsSync(imgHtml)).toBeTruthy();
            expect(fs.existsSync(imgJpg)).toBeTruthy();

            expect(tohavecontent(imgHtml)).toMatch(
                /<img src="\/other\/hi-dist\.jpg">/
            );
        }));
    it("should execute options.publicPath if it's defined as a function", done => {
        let publicPathCalledWithContext = false;
        const loaderContext = {
            async: () => () => done(),
            cacheable() {},
            getOptions:()=> ({
                publicPath: context => {
                    publicPathCalledWithContext = context === loaderContext;

                    return "";
                },
            }),
        };

        extractLoader.call(loaderContext, "");

        expect(publicPathCalledWithContext).toBe(true);
    });
    it("should support explicit loader chains", () => compile({testModule: "loader.html"}).then(() => {
        const loaderHtml = path.resolve(__dirname, "dist/loader-dist.html");
        const errJs = path.resolve(__dirname, "dist/err.js");

        expect(fs.existsSync(loaderHtml)).toBeTruthy();
        /* interpolation removed in html loader */
        //expect(tohavecontent(errJs)).toContain("this is a syntax error\n");
    }));
    it("should report syntax errors", () =>
        compile({testModule: "error-syntax.js"}).then(
            () => {
                throw new Error("Did not throw expected error");
            },
            message => {
                expect(message).toMatch(/SyntaxError: unknown: Missing semicolon/);
            }
        ));
    it("should report resolve errors", () =>
        compile({testModule: "error-resolve.js"}).then(
            () => {
                throw new Error("Did not throw expected error");
            },
            message => {
                expect(message).toMatch(/Error: Can't resolve '\.\/does-not-exist\.jpg'/);
            }
        ));
    it("should report resolve loader errors", () =>
        compile({testModule: "error-resolve-loader.js"}).then(
            () => {
                throw new Error("Did not throw expected error");
            },
            message => {
                expect(message).toMatch(/Error: Can't resolve 'does-not-exist'/);
            }
        ));
    it("should not leak globals when there is an error during toString()", () => {
        delete global.btoa;

        return compile({testModule: "error-to-string.js"}).then(
            () => {
                throw new Error("Did not throw expected error");
            },
            () => {
                expect("btoa" in global).toBeFalsy();
            }
        );
    });
    it("should restore the original globals when there is an error during toString()", () => {
        const myBtoa = {};

        global.btoa = myBtoa;

        return compile({testModule: "error-to-string.js"}).then(
            () => {
                throw new Error("Did not throw expected error");
            },
            () => {
                expect(global.btoa).toEqual(myBtoa);
            }
        );
    });
    it("should flag itself as cacheable", done => {
        const loaderContext = {
            async() {
                return () => {
                    expect(cacheableCalled).toEqual(
                        true,
                        "cacheable() has not been called"
                    );
                    done();
                };
            },
            cacheable() {
                cacheableCalled = true;
            },
            options: {output: {}},
        };
        let cacheableCalled = false;

        extractLoader.call(loaderContext, "");
    });
});
