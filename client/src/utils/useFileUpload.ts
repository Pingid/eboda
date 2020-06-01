import { useState, useCallback } from "react";
import axios from "axios";

export type Status =
  | "ready"
  | "requestURL"
  | "uploading"
  | "processing"
  | "done"
  | "error";

const useFileUpload = () => {
  const [progress, setProgress] = useState(0);
  const [network, setNetwork] = useState<Status>("ready");
  const [url, setUrl] = useState<null | string>(null);

  const apiBaseURL = "/api";

  const upload = useCallback((file: File) => {
    var reader = new FileReader();
    reader.addEventListener("loadend", () => {
      const blob = new Blob([reader.result as ArrayBuffer], {
        type: file.type,
      });

      setNetwork("requestURL");

      axios
        .post(apiBaseURL + "/requestUploadURL", {
          name: file.name,
          type: file.type,
        })
        .then(({ data }: any) => {
          setNetwork("uploading");
          return axios.put(data.uploadURL, blob, {
            headers: { "content-type": blob.type },
            onUploadProgress: (p) =>
              setProgress(Math.round((p.loaded / p.total) * 100)),
          });
        })
        .then(() => {
          setNetwork("processing");
          return axios.post(apiBaseURL + "/process", {
            name: file.name,
            version: 10,
          });
        })
        .then(({ data }: { data: { url: string } }) => {
          setNetwork("done");
          setUrl(data.url);
          fetch(apiBaseURL + "/clean");
        })
        .catch((err) => {
          setNetwork("error");
          console.error(err);
        });
    });
    reader.readAsArrayBuffer(file);
  }, []);

  return { network, progress, upload, url };
};

export default useFileUpload;
