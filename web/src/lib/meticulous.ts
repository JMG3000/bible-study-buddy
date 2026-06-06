import { headers } from "next/headers";

const METICULOUS_IS_TEST_HEADER = "meticulous-is-test";
const METICULOUS_SIMULATED_DATE_HEADER = "meticulous-simulated-date";

export async function isMeticulousTestRequest() {
  const headerStore = await headers();
  return headerStore.get(METICULOUS_IS_TEST_HEADER) === "1";
}

export async function getCurrentDateForRendering() {
  const headerStore = await headers();
  const simulatedDate = headerStore.get(METICULOUS_SIMULATED_DATE_HEADER);

  if (simulatedDate) {
    const parsedDate = new Date(simulatedDate);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  return new Date();
}
