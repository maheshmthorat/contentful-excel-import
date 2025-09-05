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
    records.shift(); // remove header row
    const totalRecords = records.length;
    let addedCount = 0;

    for (const record of records) {
      const title = record[0];
      const slug = record[1];
      const publishedDate = new Date(record[2]);
      const excerpt = record[3];
      const featuredImage = record[4];
      const editor = record[5];
      const tags = record[6];
      const contentTypeId = record[7];

      const result = parseHtml(editor);

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
                "en-US": "Asset Uploaded For Content Type - " + title,
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
          editor: {
            "en-US": result,
          },
        },
      };

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

      try {
        const response = await client.entry.create(
          {
            spaceId: spaceId,
            environmentId: environmentId,
            contentTypeId: contentTypeId,
            publish: true,
          },
          {
            ...fieldsArr,
          }
        );

        console.log("Added - " + contentTypeId + "__ID=>" + response.sys.id);

        await client.entry.publish(
          {
            spaceId: spaceId,
            environmentId: environmentId,
            entryId: response.sys.id,
          },
          { ...response }
        );

        addedCount++;
      } catch (err) {
        console.error("Failed to add record: " + title, err.message);
      }
    }

    // Final log
    console.log(`\n✅ Import completed!`);
    console.log(`Total Excel Records: ${totalRecords}`);
    console.log(`Total Successfully Added: ${addedCount}`);
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
    await client.tag.get({
      spaceId: spaceId,
      environmentId: environmentId,
      tagId: sanitizedTagId,
    });
    console.log(`Tag already exists: ${tagId}`);
  } catch (error) {
    if (error.name === "NotFound") {
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
      console.error(`Failed to check tag existence: ${tagId}`, error);
    }
  }
}
