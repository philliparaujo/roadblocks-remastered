export const logResults =
  (what: string) =>
  (result: any): any => {
    console.log(`${what}: ${JSON.stringify(result)}`);
    return result;
  };
