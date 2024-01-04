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
import type {JsonNode, ObjectNode} from "./Json.mjs";
import {requireThat} from "@cowwoc/requirements";
import {Metadata} from "./Metadata.mjs";

/**
 * Helper methods for manipulating object properties.
 */
class Property
{
	/**
	 * @returns true if the property name belongs to a metadata property
	 */
	public isMetadata()
	{
		return !this.insideStateMetadata && this.name.startsWith("@");
	}

	/**
	 * @returns true if the property name belongs to a state property
	 */
	public isState()
	{
		return !this.isMetadata();
	}

	private readonly name: string;
	private readonly value: JsonNode;
	private readonly insideStateMetadata: boolean;

	/**
	 * Wraps a JsonNode.
	 *
	 * @param name - the name of the property
	 * @param value - the value of the property
	 * @param insideStateMetadata - true if the property is declared inside a `@state` metadata property
	 * @throws TypeError if any of the arguments are null
	 */
	public constructor(name: string, value: JsonNode, insideStateMetadata: boolean)
	{
		requireThat(name, "name").isNotNull();
		requireThat(value, "value").isNotNull();
		this.name = name;
		this.value = value;
		this.insideStateMetadata = insideStateMetadata;
	}

	/**
	 * @returns the String value
	 * @throws RangeError if the value is not a string
	 */
	public stringValue()
	{
		const typeOfValue = typeof (this.value);
		if (typeOfValue !== "string")
		{
			throw new RangeError(`${this.name} + " must be a string.
Actual  : ${JSON.stringify(this.value, null, 2)}
Type    : ${typeOfValue}
Resource: ${JSON.stringify(this, null, 2)}`);
		}
		return this.value as string;
	}

	/**
	 * @returns the String value as a URI
	 * @throws TypeError if the value is not a valid URI
	 */
	public uriValue()
	{
		return new URL(this.stringValue());
	}

	/**
	 * @returns the value as an array of strings
	 * @throws RangeError if the value is not an array of strings
	 */
	public stringValues()
	{
		if (!Array.isArray(this.value))
		{
			throw new RangeError(`${this.name} must be an array.
Actual  : ${JSON.stringify(this.value, null, 2)}
Node    : ${typeof (this.value)}
Resource: ${JSON.stringify(this, null, 2)}`);
		}

		const elements: string[] = [];
		for (const element of this.value)
			elements.push(new Property(this.name, element,
				this.insideStateMetadata || this.name === Metadata.STATE.toString()).stringValue());
		return elements;
	}

	/**
	 * @returns the Date value
	 * @throws RangeError if the value is not an Instant
	 */
	public dateValue()
	{
		return new Date(this.stringValue());
	}

	/**
	 * @returns the `Map<number, string>` value
	 * @throws RangeError if the value is not a `Map<number, string>`
	 */
	public numberToStringValue()
	{
		const typeOfStateContainer = typeof (this.value);
		if (typeOfStateContainer !== "object" || Array.isArray(this.value))
		{
			throw new RangeError(`State at must be an object.\n
Actual: ${typeOfStateContainer}`);
		}

		const map: Map<number, string> = new Map();
		for (const [key, value] of Object.entries(this.value as ObjectNode))
		{
			const version = Number(key);
			const nestedValue = new Property(key, value,
				this.insideStateMetadata || this.name === Metadata.STATE.toString()).stringValue();
			map.set(version, nestedValue);
		}
		return map;
	}
}

export {Property};