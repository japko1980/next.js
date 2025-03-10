import { bar } from "data:text/javascript,export var bar = 1234;";
import data from 'data:application/json,{ "foo": 1234 }';
import dataURLEncoded from 'data:application/json,%7B%20%22foo%22%3A%201234%20%7D';
import dataBase64Encoded from 'data:application/json;base64,eyAiZm9vIjogMTIzNCB9';
import "data:text/css,body { color: red }";

it("support data URL imports", () => {
  expect(bar).toEqual(1234);
  expect(data).toEqual({ foo: 1234 });
  expect(dataURLEncoded).toEqual({ foo: 1234 });
  expect(dataBase64Encoded).toEqual({ foo: 1234 });
});
