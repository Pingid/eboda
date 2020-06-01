import { APIGatewayProxyHandler } from "aws-lambda";
import AWS from "aws-sdk";
import "source-map-support/register";

import { promisify, TextEncoder } from "util";
import { gunzip, gzip } from "zlib";

const bucket = "eboda-upload";

export const requestUploadURL: APIGatewayProxyHandler = (event, _context) => {
  const s3 = new AWS.S3();
  const params = JSON.parse(event.body);

  const s3Params = {
    Bucket: bucket,
    Key: `uploads/${params.name}`,
    ContentType: params.type,
    ACL: "public-read",
  };

  const uploadURL = s3.getSignedUrl("putObject", s3Params);

  return Promise.resolve({
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ uploadURL: uploadURL }),
  });
};

export const process: APIGatewayProxyHandler = (event, _context) => {
  const { name, version } = JSON.parse(event.body);
  const reg = /(<Project ObjectID="\d{1,}"\sClassID=".*?"\sVersion=")(\d{1,})(">)/;

  const s3 = new AWS.S3();

  return Promise.resolve()
    .then(() =>
      s3
        .getObject({
          Bucket: bucket,
          Key: `uploads/${name}`,
        })
        .promise()
    )
    .then((res) =>
      Promise.resolve(res.Body)
        .then(promisify(gunzip))
        .then((x: Buffer) => {
          const utf8encoder = new TextEncoder();

          const slice = x.slice(0, 512);
          const rest = x.slice(512, x.byteLength);
          const decoded = slice.toString().replace(reg, (_, a, b, c) => {
            let n = parseInt(b) - version || 0;
            return a + n + c;
          });

          return Buffer.concat([utf8encoder.encode(decoded), rest]);
        })
        .then((str) => promisify(gzip)(str))
    )
    .then((buffer) =>
      s3
        .putObject({
          Bucket: bucket,
          Key: `downloads/${name}`,
          Body: buffer,
        })
        .promise()
    )
    .then(() =>
      s3.deleteObject({ Bucket: bucket, Key: `uploads/${name}` }).promise()
    )
    .then(() =>
      s3.getSignedUrl("getObject", {
        Bucket: bucket,
        Key: `downloads/${name}`,
      })
    )
    .then((url) => ({
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        url,
      }),
    }))
    .catch((err) => {
      console.error(err);
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: err.message,
      };
    });
};

export const clean: APIGatewayProxyHandler = (_event, _context) => {
  const s3 = new AWS.S3();

  return s3
    .listObjects({ Bucket: bucket })
    .promise()
    .then(({ Contents }) =>
      Promise.all(
        Contents.filter(
          (obj) =>
            (new Date().valueOf() - new Date(obj.LastModified).valueOf()) /
              1000 /
              60 >
            30
        ).map((obj) =>
          s3.deleteObject({ Bucket: bucket, Key: obj.Key }).promise()
        )
      )
    )
    .then((res) => ({
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: `Delete ${res.length} objects`,
    }));
};
