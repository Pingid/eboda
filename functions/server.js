const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();
const port = 4000;

// default options
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "./tmp/"
  })
);

app.post("/upload", function(req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;
  console.log(req.files);
  // // Use the mv() method to place the file somewhere on your server
  // sampleFile.mv("tmp/filename.jpg", function(err) {
  //   if (err) return res.status(500).send(err);

  //   res.send("File uploaded!");
  // });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
