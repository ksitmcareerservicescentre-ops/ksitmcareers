import fs from "node:fs";

const source = process.argv[2] || "cloudinary-asset-ids.txt";
const output = process.argv[3] || "cloudinary-assets.json";
const sourceText = fs.readFileSync(source, "utf8");
const ids = [...new Set(sourceText.match(/[a-f0-9]{32}/gi) || [])];

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error("Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET first.");
}

if (!ids.length) throw new Error(`No 32-character asset IDs found in ${source}`);

const authorization = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
const resources = [];

for (let index = 0; index < ids.length; index += 10) {
  const batch = ids.slice(index, index + 10);
  const query = batch.map((id) => `asset_ids[]=${encodeURIComponent(id)}`).join("&");
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/by_asset_ids?${query}`, {
    headers: { Authorization: `Basic ${authorization}` },
  });

  if (!response.ok) throw new Error(`Cloudinary ${response.status}: ${await response.text()}`);
  resources.push(...((await response.json()).resources || []));
}

const assets = resources.map((asset) => ({
  assetId: asset.asset_id,
  publicId: asset.public_id,
  url: asset.secure_url,
  format: asset.format,
  width: asset.width,
  height: asset.height,
}));

fs.writeFileSync(output, JSON.stringify(assets, null, 2));
console.log(`Resolved ${assets.length} of ${ids.length} asset IDs to ${output}`);
