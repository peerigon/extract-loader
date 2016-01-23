import path from "path";
import fs from "fs";
import rimRaf from "rimraf";
import chai, { expect } from "chai";
import chaiFs from "chai-fs";
import compile from "./support/compile";

chai.use(chaiFs);

describe("extractLoader", () => {
    afterEach(() => {
        rimRaf.sync(path.resolve(__dirname, "dist"));
    });
    it("should extract 'hello' into simple.js", () => {
        return compile({
            testModule: "simple.js"
        }).then(() => {
            const file = path.resolve(__dirname, "dist/simple.js");

            expect(file).to.be.a.file();
            expect(file).to.have.content("hello");
        });
    });
    it("should extract the html of modules/simple.html into simple.html", () => {
        return compile({
            testModule: "simple.html",
            loaders: ["html"]
        }).then(() => {
            const file = path.resolve(__dirname, "dist/simple.html");

            expect(file).to.be.a.file();
            expect(file).to.have.content(
                fs.readFileSync(path.resolve(__dirname, "modules/simple.html"), "utf8")
            );
        });
    });
    it("should extract the css of modules/simple.css into simple.css", () => {
        return compile({
            testModule: "simple.css",
            loaders: ["css"]
        }).then(() => {
            const file = path.resolve(__dirname, "dist/simple.css");

            expect(file).to.be.a.file();
            expect(file).to.have.content(
                fs.readFileSync(path.resolve(__dirname, "modules/simple.css"), "utf8")
            );
        });
    });
    it("should extract the img url into img.js", () => {
        return compile({
            testModule: "img.js"
        }).then(() => {
            const file = path.resolve(__dirname, "dist/img.js");

            expect(file).to.be.a.file();
            expect(file).to.have.content(
                "hi.jpg"
            );
        });
    });
});
