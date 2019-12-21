import { APIGatewayProxyHandler, APIGatewayProxyEvent } from "aws-lambda";
import "source-map-support/register";

import { createWriteStream } from "fs";
import { join } from "path";

import busboy from "busboy";

const writeFileBB = (
  event: APIGatewayProxyEvent
): Promise<{
  filename: string;
  encoding: string;
  mimetype: string;
}> => {
  const bb = new busboy({
    headers: { ...event.headers, "content-type": event.headers["Content-Type"] }
  });

  return new Promise((resolve, reject) => {
    let res;

    bb.on("file", function(_fieldname, file, filename, encoding, mimetype) {
      const saveTo = join("./tmp", filename);
      res = { filename, encoding, mimetype };
      console.log(res);
      let stream = createWriteStream(saveTo);
      file.pipe(stream);
      stream.on("close", () => {
        resolve(res);
      });
    });
    bb.on("error", reject);
    bb.end(event.body);
  });
};

export const upload: APIGatewayProxyHandler = async (event, _context) =>
  Promise.resolve()
    .then(() => writeFileBB(event))
    .then(file => {
      const { filename } = file;
      console.log(filename);
      return filename;
    })
    .then(() => ({
      statusCode: 200,
      body: JSON.stringify({
        message:
          "Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!",
        input: event
      })
    }));
