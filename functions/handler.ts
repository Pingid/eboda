import { APIGatewayProxyHandler } from "aws-lambda";
import AWS from "aws-sdk";
import "source-map-support/register";

import { writeFile, exists, mkdir, readFile } from "fs";
import { promisify } from "util";
import revert from "./revert";
import { join } from "path";

const bucket = "premier-version-revert-upload";

export const requestUploadURL: APIGatewayProxyHandler = (event, _context) => {
  const s3 = new AWS.S3();
  const params = JSON.parse(event.body);

  const s3Params = {
    Bucket: bucket,
    Key: `uploads/${params.name}`,
    ContentType: params.type,
    ACL: "public-read"
  };

  const uploadURL = s3.getSignedUrl("putObject", s3Params);

  return Promise.resolve({
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({ uploadURL: uploadURL })
  });
};

export const process: APIGatewayProxyHandler = (event, _context) => {
  const { name, version } = JSON.parse(event.body);
  const tempDir = join(__dirname, "tmp");
  const s3 = new AWS.S3();

  return s3
    .getObject({
      Bucket: bucket,
      Key: `uploads/${name}`
    })
    .promise()
    .then(res =>
      promisify(exists)(tempDir)
        .then(does => (!does ? promisify(mkdir)(tempDir) : null))
        .then(() => promisify(writeFile)(join(tempDir, name), res.Body))
    )
    .then(() => revert(join(tempDir, name), version))
    .then(() => promisify(readFile)(join(tempDir, name)))
    .then(buffer =>
      s3
        .putObject({
          Bucket: bucket,
          Key: `downloads/${name}`,
          Body: buffer
        })
        .promise()
    )
    .then(() =>
      s3.deleteObject({ Bucket: bucket, Key: `uploads/${name}` }).promise()
    )
    .then(() =>
      s3.getSignedUrl("getObject", {
        Bucket: bucket,
        Key: `downloads/${name}`
      })
    )
    .then(url => ({
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        url
      })
    }));
};

export const clean: APIGatewayProxyHandler = (_event, _context) => {
  const s3 = new AWS.S3();

  return s3
    .listObjects({ Bucket: bucket })
    .promise()
    .then(({ Contents }) =>
      Promise.all(
        Contents.filter(
          obj =>
            (new Date().valueOf() - new Date(obj.LastModified).valueOf()) /
              1000 /
              60 >
            30
        ).map(obj =>
          s3.deleteObject({ Bucket: bucket, Key: obj.Key }).promise()
        )
      )
    )
    .then(res => ({
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: `Delete ${res.length} objects`
    }));
};
