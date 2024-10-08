import fs from "fs";
import { NeoResponse, ResultSetType } from "./interfaces.ts";
import { devLog, getTimeInMinutes, toISODate } from "./Utils.ts";
import axios from "axios";

const RESULT_FILE_NAME = "felix-neo4j-db.csv";
const TRUNK_SIZE = 500000;
const TIMEOUT_MS = 3600000;

function transformNeoDataItem(itemValues: ResultSetType): [string, number, boolean, boolean, string, string, string] {
  ["Y4X4XTKPLL", 1, false, true, 1531183071977, 1529482460647, "0000001"]

  return [
    itemValues[0], 
    itemValues[1], 
    itemValues[2], 
    itemValues[3], 
    toISODate(new Date(itemValues[4])), 
    toISODate(new Date(itemValues[5])), 
    itemValues[6]];

}

// test
console.log(transformNeoDataItem(["Y4X4XTKPLL", 1, false, true, 1531183071977, 1529482460647, "0000001"]));

async function getNeoData(trunkNo: number, trunkSize: number): Promise<NeoResponse> {
  devLog("Get trunk", trunkNo);
  trunkSize++;
  const queryStr = `MATCH (pc:ProductCode) RETURN pc.code, pc.codeType, pc.deleted, pc.active, pc.activeTime, pc.createdDate, pc.serial SKIP ${ trunkSize * trunkNo } LIMIT ${ trunkSize }`;
  const resp = await axios.post("http://localhost:7474/db/data/cypher", {
    "query": queryStr,
  }, { timeout: TIMEOUT_MS }).then();

  return resp.data;
}

async function main() {
  let totalCount = 0;
  let trunkNo = 0;
  devLog("Trunk size: ", TRUNK_SIZE);
  const startTime = new Date();
  let chunkStartTime = new Date();
  // get data from API
  let neoResponse = await getNeoData(trunkNo, TRUNK_SIZE);
  // create csv file
  const resultFile = fs.openSync(RESULT_FILE_NAME, "w");
  fs.writeFileSync(resultFile, neoResponse.columns.join(",") + "\n");

  while (neoResponse.data.length > 0) {

    for (const datum of neoResponse.data) {
      fs.appendFileSync(resultFile, transformNeoDataItem(datum).map(item => `${ item }`).join(",") + "\n");
      totalCount++;
    }
    const chunkEndTime = new Date();
    devLog("Current counts: ", totalCount, `${getTimeInMinutes(chunkStartTime, chunkEndTime)} minutes`);
    trunkNo += 1;

    chunkStartTime = new Date();
    neoResponse = await getNeoData(trunkNo, TRUNK_SIZE);
  }
  fs.closeSync(resultFile);

  const endTime = new Date();
  devLog("Total counts: ", totalCount);
  devLog("Executed time in minutes: ", getTimeInMinutes(startTime, endTime));
  devLog("Result file: ", RESULT_FILE_NAME);
}

main().then();
