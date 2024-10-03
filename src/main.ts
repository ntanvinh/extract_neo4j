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
const TRUNK_SIZE = 2000;

async function main() {
  let totalCount = 0;
  let trunkNo = 0;
  devLog("Trunk size: ", TRUNK_SIZE);
  const startTime = new Date();
  // get data from API
  let neoResponse = await getNeoData(trunkNo, TRUNK_SIZE);
  // create csv file
  const resultFile = fs.openSync(RESULT_FILE_NAME, "w");
  fs.writeFileSync(resultFile, neoResponse.columns.join(",") + "\n");

  while (neoResponse.data.length > 0) {
    for (const datum of neoResponse.data) {
      fs.appendFileSync(resultFile, datum.map(item => `${ item }`).join(",") + "\n");
      totalCount++;
    }
    trunkNo += 1;
    neoResponse = await getNeoData(trunkNo, TRUNK_SIZE);
  }
  fs.closeSync(resultFile);

  const endTime = new Date();
  devLog("Total counts: ", totalCount);
  devLog("Executed time: ", getTimeInMinutes(startTime, endTime));
  devLog("Result file: ", RESULT_FILE_NAME);
}

main().then();
