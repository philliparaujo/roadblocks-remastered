import { bgWhite, black, blue, bold, dim, green, red, yellow } from "./Colors";

describe("all colors", () => {
  test("colors", () => {
    console.log(blue("it's blue"));
    console.log(red("redish"));
    console.log(green("green"));
    console.log(yellow("yellowish"));
    console.log(bgWhite(black("blacker")));
    console.log(dim("dimmer"));
    console.log(bold("bolder"));
  });
});
