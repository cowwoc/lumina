/*
 * Copyright (c) 2024 Gili Tzabari
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// The possible types of a JSON value
type JsonNode = null | string | number | boolean | ObjectNode | JsonNode[];

// The types of properties that an object may contain. undefined is not a legal JSON type, it denotes the
// absence of a property.
type ObjectNode = { [index: string]: JsonNode } & {
	[index: string]:
		| undefined
		| null
		| string
		| number
		| boolean
		| ContainerNode;
};

type ContainerNode = ObjectNode | JsonNode[];

/**
 * Returns the type of a JSON node.
 *
 * @param node - a JSON node
 * @returns one of `["undefined", "null", "boolean", "number", "string", "array", "object"]`
 * @throws TypeError if `node` is not a JSON node
 */
function getJsonType(node: JsonNode)
{
	const typeOfNode = typeof (node);
	switch (typeOfNode)
	{
		case "undefined":
		case "boolean":
		case "number":
		case "string":
			return typeOfNode;
		case "object":
		{
			if (node === null)
				return "null";
			if (Array.isArray(node))
				return "array";
			return "object";
		}
		default:
			throw new TypeError(`node is not a valid JSON object.
Type: ${typeOfNode}`);
	}
}

export {type JsonNode, type ObjectNode, getJsonType};