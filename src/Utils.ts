export function devLog(...obj: any) {
  console.log(new Date().toISOString(), obj);
}

export function getTimeInMinutes(startTime: Date, endTime: Date) {
  const difference = endTime.getTime() - startTime.getTime(); // This will give difference in milliseconds
  return Math.round(difference / 60000);
}
