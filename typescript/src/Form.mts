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
import {requireThat} from "@cowwoc/requirements";
import {Metadata} from "./Metadata.mjs";
import type {JsonNode, ObjectNode} from "./Json.mjs";

/**
 * A JSON object that describes how to submit requests to the server.
 */
class Form
{
	private _description: string | undefined;
	private readonly uri: URL;
	private readonly method: string;
	private readonly contentType: string;
	private readonly nameToProperty: Map<string, Property> = new Map();
	private readonly responseCodeToDescription: Map<number, string> = new Map();

	/**
	 * @param uri - the URI to submit the form to
	 * @param method - the HTTP method to use when submitting the form
	 * @param contentType - the `Content-Type` header value to use when submitting the form
	 * @throws TypeError if any of the arguments are null
	 * @throws RangeError if any of the arguments contain leading, trailing whitespace or are empty
	 */
	public constructor(uri: URL, method: string, contentType: string)
	{
		requireThat(uri, "uri").isNotNull();
		requireThat(method, "method").isTrimmed().isNotEmpty();
		requireThat(contentType, "contentType").isTrimmed().isNotEmpty();

		this.uri = uri;
		this.method = method;
		this.contentType = contentType;
	}

	/**
	 * @param description - describes the form
	 * @returns this
	 * @throws TypeError if `description` is null
	 * @throws RangeError if `description` contains leading, trailing whitespace or is empty
	 */
	public description(description: string)
	{
		requireThat(description, "description").isTrimmed().isNotEmpty();
		this._description = description;
		return this;
	}

	/**
	 * Adds a new input property.
	 *
	 * @param name - the name of the property
	 * @param property - the property
	 * @returns this
	 * @throws TypeError if any of the arguments are null
	 * @throws RangeError if `name` contains leading, trailing whitespace or empty
	 */
	public addInput(name: string, property: Property)
	{
		requireThat(name, "name").isTrimmed().isEmpty();
		this.nameToProperty.set(name, property);
		return this;
	}

	/**
	 * Adds a new server response.
	 *
	 * @param code - the HTTP response code
	 * @param description - (optional) an explanation of when this response code is returned
	 * @returns this
	 * @throws RangeError if `description` contains a leading, trailing whitespace or is empty
	 */
	public addResponse(code: number, description: string)
	{
		this.responseCodeToDescription.set(code, description);
		return this;
	}

	/**
	 * @returns the Resource representing the form
	 */
	public toResource()
	{
		const inputs: ObjectNode = this.getInputs();
		let responses: JsonNode;
		const form: ObjectNode = {};

		if (this._description === undefined)
			responses = this.getResponses();
		else
		{
			const descriptionMetadata = Metadata.DESCRIPTION.toString();
			form[descriptionMetadata] = this._description;
			inputs[descriptionMetadata] = "The list of inputs that the form accepts";

			responses = {};
			responses[descriptionMetadata] = "The list of responses that the form may return";
			responses[Metadata.STATE.toString()] = this.getResponses();
		}

		form[Metadata.LINK.toString()] = this.uri.toString();
		form.method = this.method;
		form.contentType = this.contentType;
		form.inputs = inputs;
		form.responses = responses;
		return form;
	}

	/**
	 * @return the server responses
	 */
	private getInputs()
	{
		const state: ObjectNode = {};
		for (const [name, property] of this.nameToProperty.entries())
			state[name] = property.toJson();
		return state;
	}

	/**
	 * @returns the server responses
	 */
	private getResponses()
	{
		const state: JsonNode[] = [];
		for (const [code, description] of this.responseCodeToDescription.entries())
		{
			const response: ObjectNode = {};
			response.code = Number(code);
			if (this.description != null)
				response[Metadata.DESCRIPTION.toString()] = description;
			state.push(response);
		}
		return state;
	}
}

/**
 * An input field of a form.
 */
abstract class Property
{
	/**
	 * The JSON type of the property.
	 */
	protected readonly type: string;

	/**
	 * Creates a new String property.
	 *
	 * @param type - the type of the property
	 * @throws TypeError     if any of the arguments are null
	 * @throws RangeError if any of the arguments contain leading, trailing whitespace or are empty
	 */
	public constructor(type: string)
	{
		requireThat(type, "type").isTrimmed().isEmpty();

		this.type = type;
	}

	/**
	 * @returns the JSON representation of the property
	 */
	public toJson()
	{
		const json: ObjectNode = {};
		json.type = this.type;
		return json;
	}
}

/**
 * A form property of type String.
 */
class StringProperty extends Property
{
	private _minLength: number | undefined;
	private _maxLength: number | undefined;
	private _optional: boolean | undefined;
	private _description: string | undefined;

	/**
	 * Creates a new String property.
	 */
	public constructor()
	{
		super("string");
	}

	/**
	 * @param minLength - the minimum number of characters that a string property can have (inclusive)
	 * @returns this
	 * @throws RangeError if `minLength` is negative
	 */
	public minLength(minLength: number)
	{
		requireThat(minLength, "minLength").isNotNegative();

		this._minLength = minLength;
		return this;
	}

	/**
	 * @param maxLength - the maximum number of characters that a string property can have (exclusive)
	 * @returns this
	 * @throws RangeError if `minLength` is negative
	 */
	public maxLength(maxLength: number)
	{
		requireThat(maxLength, "maxLength").isNotNegative();
		this._maxLength = maxLength;
		return this;
	}

	/**
	 * @param optional - true if a property value may be `null`
	 * @returns this
	 */
	public optional(optional: boolean)
	{
		this._optional = optional;
		return this;
	}

	/**
	 * @param description - describes the property value
	 * @returns this
	 * @throws TypeError if `description` is null
	 * @throws RangeError if `description` contains leading, trailing whitespace or is empty
	 */
	public description(description: string)
	{
		requireThat(description, "description").isTrimmed().isNotEmpty();
		this._description = description;
		return this;
	}

	/**
	 * {@inheritDoc}
	 *
	 * @throws RangeError if `minLength > maxLength`
	 */
	public toJson()
	{
		if (this._minLength !== undefined && this._maxLength !== undefined)
			requireThat(this._minLength, "minLength").isLessThanOrEqualTo(this._maxLength, "maxLength");
		const json = super.toJson();
		if (this._minLength != null)
			json["minLength"] = this._minLength;
		if (this._maxLength != null)
			json["maxLength"] = this._maxLength;
		if (this._optional != null && this._optional)
			json["optional"] = this._optional;
		if (this._description != null)
			json[Metadata.DESCRIPTION.toString()] = this._description;
		return json;
	}
}

/**
 * A form property of type URI.
 */
class UriProperty extends Property
{
	private _minLength: number | undefined;
	private _maxLength: number | undefined;
	private _optional: boolean | undefined;
	private _description: string | undefined;

	/**
	 * Creates a new URI property.
	 */
	public constructor()
	{
		super("uri");
	}

	/**
	 * @param minLength - the minimum number of characters that a string property can have (inclusive)
	 * @returns this
	 * @throws RangeError if `minLength` is negative
	 */
	public minLength(minLength: number)
	{
		requireThat(minLength, "minLength").isNotNegative();

		this._minLength = minLength;
		return this;
	}

	/**
	 * @param maxLength - the maximum number of characters that a string property can have (exclusive)
	 * @returns this
	 * @throws RangeError if `minLength` is negative
	 */
	public maxLength(maxLength: number)
	{
		requireThat(maxLength, "maxLength").isNotNegative();
		this._maxLength = maxLength;
		return this;
	}

	/**
	 * @param optional - true if a property value may be `null`
	 * @returns this
	 */
	public optional(optional: boolean)
	{
		this._optional = optional;
		return this;
	}

	/**
	 * @param description - describes the property value
	 * @returns this
	 * @throws TypeError if `description` is null
	 * @throws RangeError if `description` contains leading, trailing whitespace or is empty
	 */
	public description(description: string)
	{
		requireThat(description, "description").isTrimmed().isNotEmpty();
		this._description = description;
		return this;
	}

	/**
	 * {@inheritDoc}
	 *
	 * @throws RangeError if `minLength > maxLength`
	 */
	public toJson()
	{
		if (this._minLength !== undefined && this._maxLength !== undefined)
			requireThat(this._minLength, "minLength").isLessThanOrEqualTo(this._maxLength, "maxLength");
		const json = super.toJson();
		if (this._minLength != null)
			json["minLength"] = this._minLength;
		if (this._maxLength != null)
			json["maxLength"] = this._maxLength;
		if (this._optional != null && this._optional)
			json["optional"] = this._optional;
		if (this._description != null)
			json[Metadata.DESCRIPTION.toString()] = this._description;
		return json;
	}
}

export {Form, Property, StringProperty, UriProperty};