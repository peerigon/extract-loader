import path from "path";
import hashFile from "hash-file";

export default function (testModule) {
    const hash1 = hashFile.sync(path.resolve(__dirname, "../modules/", `${testModule}.js`));
    const hash2 = hashFile.sync(path.resolve(__dirname, "../dist/", `${testModule}.js`));

    return hash1 === hash2;
}
