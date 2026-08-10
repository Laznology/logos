import { blob } from "hub:blob";

export default eventHandler(async (event) =>
  blob.handleUpload(event, {
    ensure: {
      maxSize: "2MB",
      types: ["image"],
    },
    formKey: "file",
    multiple: false,
    put: {
      addRandomSuffix: true,
    },
  })
);
