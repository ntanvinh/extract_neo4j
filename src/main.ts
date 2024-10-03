import fs from "fs";
import { NeoResponse } from "./interfaces.ts";
import { devLog, getTimeInMinutes } from "./Utils.ts";
import axios from "axios";

async function getNeoData(trunkNo: number, trunkSize: number): Promise<NeoResponse> {
  devLog("Get trunk", trunkNo);
  trunkSize++;
  const queryStr = `MATCH (pc:ProductCode) RETURN pc.code, pc.codeType, pc.deleted, pc.active, pc.activeTime, pc.createdDate, pc.serial SKIP ${ trunkSize * trunkNo } LIMIT ${ trunkSize }`;
  const resp = await axios.post("http://localhost:7474/db/data/cypher", {
    "query": queryStr,
  }).then();

  return resp.data;
}

const RESULT_FILE_NAME = "result.csv";
const TRUNK_SIZE = 300000;

async function main() {
  let totalCount = 0;
  let trunkNo = 0;
  const startTime = new Date();
  // get data from API
  let neoResponse = await getNeoData(trunkNo, TRUNK_SIZE);
  // create csv file
  fs.writeFileSync(RESULT_FILE_NAME, neoResponse.columns.join(",") + "\n", "utf8",);

  while (neoResponse.data.length > 0) {
    for (const datum of neoResponse.data) {
      fs.appendFileSync(RESULT_FILE_NAME, datum.map(item => `${ item }`).join(",") + "\n", "utf8");
      totalCount++;
    }
    neoResponse = await getNeoData(trunkNo + 1, TRUNK_SIZE);
  }
  const endTime = new Date();
  devLog("Total counts: ", totalCount);
  devLog("Executed time: ", getTimeInMinutes(startTime, endTime));
}

main().then();
