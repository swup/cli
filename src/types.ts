type JSONPrimitive = null | number | string | boolean
type JSONObject = { [k: string]: JSONValue }
type JSONArray = JSONValue[]

export type JSONValue =  JSONObject | JSONArray | JSONPrimitive
