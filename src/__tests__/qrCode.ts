import { image } from "qr-image";
import * as fs from "fs";

const ids = [
  "ANPMRLHMVH3M",
  "L943LUHHUPCE",
  "4E6LG3CAVNLG",
  "39LRU3934VHM",
  "9VURF39UH6CE",
  "HEMFVPP9P3PN",
  "MGHGE66GMEN9",
  "PV6RPVEM43LL",
  "LNU6HNRLMNEV",
  "CR9PFLEHUHLP"
];
ids.forEach(id => {
  const png = image(id, { type: "png", size: 300 });
  png.pipe(
    fs.createWriteStream(`/Users/matteo/Desktop/bonusCodes/png/${id}.png`)
  );
  const svg = image(id, { type: "svg" });
  svg.pipe(
    fs.createWriteStream(`/Users/matteo/Desktop/bonusCodes/svg/${id}.svg`)
  );
});
