import { spawn as fsSpawn, SpawnOptionsWithoutStdio } from "child_process";
import { promisify } from "util";
import { rename, readFile, writeFile } from "fs";
import { parse, join } from "path";

const spawn = (cmd: string, pts?: string[], extra?: SpawnOptionsWithoutStdio) =>
  new Promise((res, rej) => {
    const prog = fsSpawn(cmd, pts || [], {
      stdio: [process.stdin, process.stdout, process.stderr],
      ...(extra || {})
    });
    prog.on("error", rej);
    prog.on("exit", res);
  });

const revert = (file: string, version: number) => {
  const { ext, dir, name } = parse(file);
  const gzipPath = file.replace(/\..*$/, ".gz");
  const reg = /(<Project ObjectID="\d{1,}"\sClassID=".*?"\sVersion=")(\d{1,})(">)/;

  return promisify(rename)(file, gzipPath)
    .then(() => spawn("gunzip", [gzipPath]))
    .then(() => promisify(readFile)(join(dir, name), "utf8"))
    .then(xml =>
      xml.replace(reg, (_, a, b, c) => {
        let n = parseInt(b) - version;
        return a + n + c;
      })
    )
    .then(xml => promisify(writeFile)(join(dir, name), xml))
    .then(() => spawn("gzip", [join(dir, name)]))
    .then(() =>
      promisify(rename)(join(dir, name + ".gz"), join(dir, name + ext))
    );
};

revert(__dirname + "/temp copy.prproj", 18);
