require("dotenv").config();
const { parseHtml } = require("contentful-html-rich-text-converter");
const { createClient } = require("contentful-management");

const EventEmitter = require("events");
const emitter = new EventEmitter();
const readXlsxFile = require("read-excel-file/node");

emitter.on("messageLogged", async function () {
  const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const spaceId = process.env.SPACE_ID;
  const environmentId = process.env.ENVIRONMENT_ID;

  if (!token) {
    return new Response("error");
  }

  const client = createClient(
    {
      accessToken: token,
    },
    { type: "plain" }
  );

  readXlsxFile("./Import-Format.xlsx").then(async (rows) => {
    const records = rows;
    records.shift();
    records.forEach(async (record) => {
      const title = record[0];
      const slug = record[1];
      const publishedDate = new Date(record[2]);
      const excerpt = record[3];
      const cardImage = record[4];
      const featuredImage = record[5];
      const introText = record[6];
      const editor = record[7];
      const orangeText = record[8];
      const sourceOfInformation = record[9];
      const tags = record[10];

      const result = parseHtml(editor);

      let cardImageAsset;
      if (cardImage) {
        let fileNamePartsCard = cardImage.split(".");
        fileNamePartsCard =
          fileNamePartsCard[fileNamePartsCard.length - 1].split("?");
        const fileExtensionCard = fileNamePartsCard[0];

        cardImageAsset = await client.asset.create(
          {
            spaceId: spaceId,
            environmentId: environmentId,
            publish: true,
          },
          {
            fields: {
              title: {
                "en-US": title,
              },
              description: {
                "en-US": "Asset Uploaded For News - " + title,
              },
              file: {
                "en-US": {
                  contentType: getMimeType(fileExtensionCard),
                  fileName: cardImage + "." + fileExtensionCard,
                  upload: cardImage,
                },
              },
            },
          }
        );

        const newAsset = await client.asset.processForLocale(
          {
            spaceId: spaceId,
            environmentId: environmentId,
          },
          { ...cardImageAsset },
          "en-US"
        );
        await client.asset.publish(
          {
            spaceId: spaceId,
            environmentId: environmentId,
            assetId: cardImageAsset.sys.id,
          },
          { ...newAsset }
        );
      }

      let featuredImageAsset;
      if (featuredImage) {
        let fileNameParts = featuredImage.split(".");
        fileNameParts = fileNameParts[fileNameParts.length - 1].split("?");
        const fileExtension = fileNameParts[0];

        featuredImageAsset = await client.asset.create(
          {
            spaceId: spaceId,
            environmentId: environmentId,
            publish: true,
          },
          {
            fields: {
              title: {
                "en-US": title,
              },
              description: {
                "en-US": "Asset Uploaded For News - " + title,
              },
              file: {
                "en-US": {
                  contentType: getMimeType(fileExtension),
                  fileName: featuredImage + "." + fileExtension,
                  upload: featuredImage,
                },
              },
            },
          }
        );

        const newAsset = await client.asset.processForLocale(
          {
            spaceId: spaceId,
            environmentId: environmentId,
          },
          { ...featuredImageAsset },
          "en-US"
        );
        await client.asset.publish(
          {
            spaceId: spaceId,
            environmentId: environmentId,
            assetId: featuredImageAsset.sys.id,
          },
          { ...newAsset }
        );
      }
      let tagIds;
      if (tags) {
        tagIds = tags.split(",").map((tag) => tag.trim());
        for (const tagId of tagIds) {
          await createTag(client, spaceId, environmentId, tagId);
        }
      }

      let fieldsArr = {
        fields: {
          internalName: {
            "en-US": title,
          },
          title: {
            "en-US": title,
          },
          slug: {
            "en-US": slug,
          },
          publishedDate: {
            "en-US": publishedDate,
          },
          excerpt: {
            "en-US": excerpt,
          },
          introText: {
            "en-US": introText,
          },
          editor: {
            "en-US": result,
          },
          orangeText: {
            "en-US": orangeText,
          },
          sourceOfInformation: {
            "en-US": sourceOfInformation
              .split(",")
              .map((source) => source.trim()),
          },
        },
      };

      if (cardImage) {
        fieldsArr.fields.cardImage = {
          "en-US": {
            sys: {
              type: "Link",
              linkType: "Asset",
              id: cardImageAsset?.sys?.id,
            },
          },
        };
      }

      if (featuredImage) {
        fieldsArr.fields.featuredImage = {
          "en-US": {
            sys: {
              type: "Link",
              linkType: "Asset",
              id: featuredImageAsset?.sys?.id,
            },
          },
        };
      }
      if (tagIds && tagIds.length > 0) {
        fieldsArr.metadata = {
          tags: tagIds.map((tagId) => {
            const sanitizedTagId = tagId.replace(/\s+/g, "");

            return {
              sys: {
                type: "Link",
                linkType: "Tag",
                id: sanitizedTagId,
              },
            };
          }),
        };
      }

      await client.entry
        .create(
          {
            spaceId: spaceId,
            environmentId: environmentId,
            contentTypeId: "news",
            publish: true,
          },
          {
            ...fieldsArr,
          }
        )
        .then(async (response) => {
          console.log(response.sys.id);

          await client.entry.publish(
            {
              spaceId: spaceId,
              environmentId: environmentId,
              entryId: response.sys.id,
            },
            { ...response }
          );
        });

    });
  });

  return;
});

const mimeTypeMapping = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
function getMimeType(fileExtension) {
  return (
    mimeTypeMapping[fileExtension.toLowerCase()] || "application/octet-stream"
  );
}
emitter.emit("messageLogged");

async function createTag(client, spaceId, environmentId, tagId) {
  const sanitizedTagId = tagId.replace(/\s+/g, ""); // Remove spaces
  try {
    // Check if the tag already exists
    await client.tag.get({
      spaceId: spaceId,
      environmentId: environmentId,
      tagId: sanitizedTagId,
    });
    console.log(`Tag already exists: ${tagId}`);
  } catch (error) {
    if (error.name === "NotFound") {
      // Tag does not exist, create it
      try {
        await client.tag.createWithId(
          {
            spaceId: spaceId,
            environmentId: environmentId,
            tagId: sanitizedTagId,
          },
          {
            name: tagId,
            sys: {
              id: sanitizedTagId,
              visibility: "public",
            },
          }
        );
        console.log(`Tag created: ${tagId}`);
      } catch (createError) {
        console.error(`Failed to create tag: ${tagId}`, createError);
      }
    } else {
      // Some other error occurred
      console.error(`Failed to check tag existence: ${tagId}`, error);
    }
  }
}
