import { describe, expect, it } from "vitest";
import { WEATHER_STATES, weatherForScore, weatherIdForScore } from "../weather";

describe("inner weather mapping", () => {
  it("maps the ten-point mood range into five stable weather bands", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(weatherIdForScore)).toEqual([
      "stormy",
      "stormy",
      "heavy",
      "heavy",
      "still",
      "still",
      "open",
      "open",
      "bright",
      "bright",
    ]);
  });

  it("uses still as the calm placeholder before a mood is chosen", () => {
    expect(weatherIdForScore(null)).toBe("unwritten");
    expect(weatherForScore(null).id).toBe("still");
  });

  it("keeps each choice on the existing numeric mood scale", () => {
    expect(WEATHER_STATES.map((weather) => weather.score)).toEqual([2, 4, 6, 8, 10]);
  });
});
