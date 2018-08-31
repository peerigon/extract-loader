import path from "path";
import fs from "fs";
import rimRaf from "rimraf";
import chai, { expect } from "chai";
import chaiFs from "chai-fs";
import compile from "./support/compile";
import extractLoader from "../src/extractLoader";

chai.use(chaiFs);

describe("extractLoader", () => {
    // Using beforeEach so that we can inspect the test compilation afterwards
    beforeEach(() => {
        rimRaf.sync(path.resolve(__dirname, "dist"));
    });
    it("should extract 'hello' into simple.js", () =>
        compile({ testModule: "simple.js" }).then(() => {
            const simpleJs = path.resolve(__dirname, "dist/simple-dist.js");

            expect(simpleJs).to.be.a.file();
            expect(simpleJs).to.have.content("hello");
        }));
    it("should extract the html of modules/simple.html into simple.html", () =>
        compile({ testModule: "simple.html" }).then(() => {
            const simpleHtml = path.resolve(__dirname, "dist/simple-dist.html");

            expect(simpleHtml).to.be.a.file();
            expect(simpleHtml).to.have.content(
                fs.readFileSync(
                    path.resolve(__dirname, "modules/simple.html"),
                    "utf8"
                )
            );
        }));
    it("should extract the css of modules/simple.css into simple.css", () =>
        compile({ testModule: "simple.css" }).then(() => {
            const simpleCss = path.resolve(__dirname, "dist/simple-dist.css");

            expect(simpleCss).to.be.a.file();
            expect(simpleCss).to.have.content(
                fs.readFileSync(
                    path.resolve(__dirname, "modules/simple.css"),
                    "utf8"
                )
            );
        }));
    it("should extract the img url into img.js", () => compile({ testModule: "img.js" }).then(() => {
        const imgJs = path.resolve(__dirname, "dist/img-dist.js");

        expect(imgJs).to.be.a.file();
        expect(imgJs).to.have.content("hi-dist.jpg");
    }));
    it("should extract the img.html as file, emit the referenced img and rewrite the url", () =>
        compile({ testModule: "img.html" }).then(() => {
            const imgHtml = path.resolve(__dirname, "dist/img-dist.html");
            const imgJpg = path.resolve(__dirname, "dist/hi-dist.jpg");

            expect(imgHtml).to.be.a.file();
            expect(imgJpg).to.be.a.file();
            expect(imgHtml).to.have.content.that.match(
                /<img src="hi-dist\.jpg">/
            );
        }));
    it("should extract the img.css as file, emit the referenced img and rewrite the url", () =>
        compile({ testModule: "img.css" }).then(() => {
            const imgCss = path.resolve(__dirname, "dist/img-dist.css");
            const imgJpg = path.resolve(__dirname, "dist/hi-dist.jpg");

            expect(imgCss).to.be.a.file();
            expect(imgJpg).to.be.a.file();
            expect(imgCss).to.have.content.that.match(/ url\(hi-dist\.jpg\);/);
        }));
    it("should extract the stylesheet.html and the referenced img.css as file, emit the files and rewrite all urls", () =>
        compile({ testModule: "stylesheet.html" }).then(() => {
            const stylesheetHtml = path.resolve(
                __dirname,
                "dist/stylesheet-dist.html"
            );
            const imgCss = path.resolve(__dirname, "dist/img-dist.css");
            const imgJpg = path.resolve(__dirname, "dist/hi-dist.jpg");

            expect(stylesheetHtml).to.be.a.file();
            expect(imgCss).to.be.a.file();
            expect(imgJpg).to.be.a.file();
            expect(stylesheetHtml).to.have.content.that.match(
                /<link href="img-dist\.css"/
            );
            expect(stylesheetHtml).to.have.content.that.match(
                /<img src="hi-dist\.jpg">/
            );
            expect(imgCss).to.have.content.that.match(/ url\(hi-dist\.jpg\);/);
        }));
    it("should extract css files with dependencies", () =>
        compile({ testModule: "deep.css" }).then(() => {
            const deepCss = path.resolve(
                __dirname,
                "dist/deep-dist.css"
            );
            // const imgCss = path.resolve(__dirname, "dist/img-dist.css");
            const imgJpg = path.resolve(__dirname, "dist/hi-dist.jpg");

            expect(deepCss).to.be.a.file();
            // expect(imgCss).to.not.be.a.file();
            expect(imgJpg).to.be.a.file();
            expect(deepCss).to.have.content.that.match(/ url\(hi-dist\.jpg\);/);
        }));
    it("should track all dependencies", () =>
        compile({ testModule: "stylesheet.html" }).then(stats => {
            const basePath = path.dirname(__dirname); // returns the parent dirname
            const dependencies = Array.from(stats.compilation.fileDependencies)
                .map(dependency => dependency.slice(basePath.length));

            expect(dependencies.sort()).to.eql(
                [
                    "/node_modules/css-loader/lib/css-base.js",
                    "/node_modules/css-loader/lib/url/escape.js",
                    "/test/modules/hi.jpg",
                    "/test/modules/img.css",
                    "/test/modules/stylesheet.html",
                ].sort()
            );
        }));
    it("should reference the img with the given publicPath", () =>
        compile({ testModule: "img.html", publicPath: "/test/" }).then(() => {
            const imgHtml = path.resolve(__dirname, "dist/img-dist.html");
            const imgJpg = path.resolve(__dirname, "dist/hi-dist.jpg");

            expect(imgHtml).to.be.a.file();
            expect(imgJpg).to.be.a.file();
            expect(imgHtml).to.have.content.that.match(
                /<img src="\/test\/hi-dist\.jpg">/
            );
        }));
    it("should override the configured publicPath with the publicPath query option", () =>
        compile({
            testModule: "img.html",
            publicPath: "/test/",
            loaderOptions: { publicPath: "/other/" },
        }).then(() => {
            const imgHtml = path.resolve(__dirname, "dist/img-dist.html");
            const imgJpg = path.resolve(__dirname, "dist/hi-dist.jpg");

            expect(imgHtml).to.be.a.file();
            expect(imgJpg).to.be.a.file();
            expect(imgHtml).to.have.content.that.match(
                /<img src="\/other\/hi-dist\.jpg">/
            );
        }));
    it("should support explicit loader chains", () => compile({ testModule: "loader.html" }).then(() => {
        const loaderHtml = path.resolve(__dirname, "dist/loader-dist.html");
        const errJs = path.resolve(__dirname, "dist/err.js");

        expect(loaderHtml).to.be.a.file();
        expect(errJs).to.have.content("this is a syntax error\n");
    }));
    it("should report syntax errors", () =>
        compile({ testModule: "error-syntax.js" }).then(
            () => {
                throw new Error("Did not throw expected error");
            },
            message => {
                expect(message).to.match(/SyntaxError: Unexpected identifier/);
            }
        ));
    it("should report resolve errors", () =>
        compile({ testModule: "error-resolve.js" }).then(
            () => {
                throw new Error("Did not throw expected error");
            },
            message => {
                expect(message).to.match(/Error: Cannot find module '\.\/does-not-exist\.jpg'/);
            }
        ));
    it("should report resolve errors", () =>
        compile({ testModule: "error-resolve-loader.js" }).then(
            () => {
                throw new Error("Did not throw expected error");
            },
            message => {
                expect(message).to.match(/Error: Can't resolve 'does-not-exist'/);
            }
        ));
    it("should flag itself as cacheable", done => {
        const loaderContext = {
            async() {
                return () => {
                    expect(cacheableCalled).to.equal(
                        true,
                        "cacheable() has not been called"
                    );
                    done();
                };
            },
            cacheable() {
                cacheableCalled = true;
            },
            options: { output: {} },
        };
        let cacheableCalled = false;

        extractLoader.call(loaderContext, "");
    });
});
