const STAGED_UPLOAD_MUTATION = `#graphql
mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets {
      url
      resourceUrl
      parameters {
        name
        value
      }
    }
  }
}
`;

export async function uploadImageToShopify(admin: any, file: File) {
  const stagedRes = await admin.graphql(STAGED_UPLOAD_MUTATION, {
    variables: {
      input: [
        {
          resource: "IMAGE",
          filename: file.name,
          mimeType: file.type,
          httpMethod: "POST",
        },
      ],
    },
  });

  const stagedData = await stagedRes.json();
  const target = stagedData.data.stagedUploadsCreate.stagedTargets[0];

  const uploadForm = new FormData();

  target.parameters.forEach((p: any) => {
    uploadForm.append(p.name, p.value);
  });

  uploadForm.append("file", file);

  await fetch(target.url, {
    method: "POST",
    body: uploadForm,
  });

  return target.resourceUrl;
}