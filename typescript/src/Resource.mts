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
import {getJsonType, type JsonNode, type ObjectNode} from "./Json.mjs";
import {requireThat} from "@cowwoc/requirements";
import {Property} from "./Property.mjs";
import {Metadata} from "./Metadata.mjs";
import {LinkToIncludedState} from "./internal/LinkToIncludedState.mjs";
import {NoSuchRelationError} from "./error/NoSuchRelationError.mjs";
import {NoSuchPropertyError} from "./error/NoSuchPropertyError.mjs";
import {Link} from "./Link.mjs";

/**
 * A resource that was returned by the server.
 */
class Resource
{
	/**
	 * The JSON node that contains the resource.
	 */
	private readonly json: ObjectNode;
	/**
	 * The URI of the top-level resource.
	 */
	private readonly uri: URL;
	/**
	 * This resource's path within the enclosing document.
	 */
	private readonly path: string[];
	/**
	 * A link to this resource.
	 */
	private readonly link: LinkToIncludedState;

	/**
	 * @param json - the JSON node that contains the resource
	 * @param uri - the URI of this resource
	 * @param path - this resource's path within the enclosing document
	 * @throws TypeError if any of the arguments are undefined or null
	 */
	constructor(json: ObjectNode, uri: URL, path: string[])
	{
		requireThat(json, "json").isDefinedAndNotNull();
		requireThat(uri, "uri").isDefinedAndNotNull();
		requireThat(path, "path").isDefinedAndNotNull();
		this.json = json;
		this.uri = uri;
		this.path = path;
		this.link = new LinkToIncludedState(this);
	}

	/**
	 * @returns a `Link` to this resource
	 */
	public asLink()
	{
		return this.link;
	}

	/**
	 * @returns the URI of this resource
	 */
	public getUri()
	{
		return this.uri;
	}

	/**
	 * @returns this resource's path within the enclosing document
	 */
	public getPath()
	{
		return this.path;
	}

	/**
	 * @returns the resource's state
	 */
	public getStateContainer()
	{
		const stateMetadata = this.json[Metadata.STATE];
		if (stateMetadata != null)
			return stateMetadata;
		return this.json;
	}

	/**
	 * @returns true if this resource contains a state, even if that state does not contain any properties (e.g.,
	 * an empty `@state` property)
	 */
	public containsState()
	{
		for (const name of Object.keys(this.json))
		{
			if (!name.startsWith("@") || name === Metadata.STATE.toString())
				return true;
		}
		return false;
	}

	/**
	 * Returns a descendant links with the requested `relation`. If multiple matches exist, one of
	 * them is returned, but it is not specified which one.
	 *
	 * @param relation - the relation between this resource and the matching resource
	 * @returns `null` if no match was found
	 * @throws RangeError if `relation` contains any leading, trailing whitespace or is empty
	 */
	public getOptionalResource(relation: string)
	{
		return this.getOptionalResourceRecursive(this.json, relation, false);
	}

	/**
	 * Returns the descendant resources with the requested `relation`.
	 *
	 * @param relation - the relation between this resource and the matching resources
	 * @returns an empty list if no match was found
	 * @throws RangeError if `relation` contains any leading, trailing whitespace or is empty
	 */
	public getOptionalResources(relation: string)
	{
		return this.getOptionalResourceRecursive(this.json, relation, false);
	}

	/**
	 * Returns a node with the requested `relation`. If multiple matches exist, one of them is
	 * returned, but it is not specified which one.
	 *
	 * @param relation - the relation between this resource and the matching resource
	 * @returns the matching node
	 * @throws RangeError if `relation` contains any leading, trailing whitespace or is empty
	 * @throws NoSuchRelationException if no match was found
	 */
	public getResource(relation: string)
	{
		const match = this.getOptionalResource(relation);
		if (match === null)
			throw new NoSuchRelationError(this.json, relation);
		return match;
	}

	/**
	 * Returns a node with the requested `relation`. If multiple matches exist, one of them is
	 * returned, but it is not specified which one.
	 *
	 * @param relation - the relation between this resource and the matching resources
	 * @returns the matching node
	 * @throws RangeError if `relation` contains any leading, trailing whitespace or is empty
	 * @throws NoSuchRelationError if no match was found
	 */
	public getResources(relation: string)
	{
		const matches = this.getOptionalResources(relation);
		if (matches === null)
			throw new NoSuchRelationError(this.json, relation);
		return matches;
	}

	/**
	 * Returns a link to the nested resource with the requested `relation`. If multiple matches
	 * exist, one of them is returned, but it is not specified which one.
	 *
	 * @param relation - the relation between a resource and the matching properties
	 * @returns the link
	 * @throws RangeError if `relation` contains any leading, trailing whitespace or is empty
	 * @throws Error if no match was found
	 */
	public getLink(relation: string)
	{
		const link = this.getOptionalResource(relation);
		if (link === null)
			throw new NoSuchRelationError(this.json, relation);
		return link;
	}

	/**
	 * Returns a node with the requested `relation`. If multiple matches exist, one of them is
	 * returned, but it is not specified which one.
	 *
	 * @param name - the name of a property
	 * @returns null if no match is found
	 * @throws RangeError if `name` contains any leading, trailing whitespace or is empty
	 */
	public getOptionalProperty(name: string)
	{
		let match = this.json[name];
		let insideStateMetadata: boolean;
		if (match === null)
		{
			const stateMetadata = this.json[Metadata.STATE];
			if (getJsonType(stateMetadata) !== "object")
				return null;
			match = (stateMetadata as ObjectNode)[name];
			if (match === null)
				return null;
			insideStateMetadata = true;
		}
		else
			insideStateMetadata = false;
		return new Property(name, match, insideStateMetadata);
	}

	/**
	 * Returns a node with the requested `relation`. If multiple matches exist, one of them is returned,
	 * but it is not specified which one.
	 *
	 * @param name - the name of a property
	 * @returns the property
	 * @throws RangeError - if `name` contains any leading, trailing whitespace or is empty
	 * @throws NoSuchPropertyError - if no match was found
	 */
	public getProperty(name: string)
	{
		const property = this.getOptionalProperty(name);
		if (property === null)
			throw new NoSuchPropertyError(this.json, name);
		return property;
	}

	/**
	 * @returns the list of strings in this resource's state
	 * @throws RangeError if the resource is not an array of strings
	 */
	public getStringValues()
	{
		const stateMetadata = this.json[Metadata.STATE];
		if (stateMetadata === null)
		{
			throw new RangeError(`Resource must contain a ${Metadata.STATE} property.
Actual: ${JSON.stringify(this.json, null, 2)}`);
		}
		if (!Array.isArray(stateMetadata))
		{
			throw new RangeError(`${Metadata.STATE} property must be an array.
Actual: ${getJsonType(stateMetadata)}`);
		}

		const elements = [];
		for (const element of stateMetadata)
		{
			const typeOfElement = getJsonType(element);
			if (typeOfElement !== "string")
			{
				throw new RangeError(`${Metadata.STATE} must contain string elements.
Actual: ${element}
Type  : ${typeOfElement}`);
			}
			elements.push(element);
		}
		return elements;
	}

	/**
	 * Returns a resource's state as a list of resources.
	 *
	 * @returns an empty list if this resource's state is not an array of resources
	 * @throws RangeError if `resource` does not contain a `@state` property. If the
	 * resource's state is not an array. If one of the array's elements is not a resource.
	 */
	public getResourceLinks()
	{
		const stateMetadata = this.json[Metadata.STATE];
		if (stateMetadata === null)
			throw new RangeError("Resource must contain a " + Metadata.STATE + " property.");
		if (!Array.isArray(stateMetadata))
		{
			throw new RangeError(`Resource state must be an array.
Actual: ${getJsonType(stateMetadata)}`);
		}
		const links: Link[] = [];
		for (const value of stateMetadata)
		{
			const link = this.getOptionalLinkFromNode(value);
			if (link === null)
			{
				throw new RangeError(`Resource state must contain resources.
Actual: ${JSON.stringify(stateMetadata, null, 2)}
Unwanted: ${JSON.stringify(value, null, 2)}`);
			}
			links.push(link);
		}
		return links;
	}

	/**
	 * @returns the JSON representation of this resource
	 */
	public asJson()
	{
		return this.json;
	}

	/**
	 * @returns the string representation of the resource
	 */
	public toString()
	{
		return this.uri.toString();
	}

	/**
	 * Returns a descendant resource with the requested `relation`. If multiple matches exist,
	 * one of them is returned, but it is not specified which one.
	 *
	 * @param fromObject - the starting point for the search
	 * @param relation - the desired relation between matching resources and their enclosing resource
	 * @param insideStateMetadata - true if `object` is the value of a `@state` metadata
	 * property
	 * @returns null if no match was found
	 * @throws RangeError if `relation` contains any leading, trailing whitespace or is empty
	 */
	private getOptionalResourceRecursive(fromObject: ObjectNode, relation: string,
	                                     insideStateMetadata: boolean): Link | null
	{
		if (this.nodeContainsRelation(fromObject, relation))
		{
			const link = this.getOptionalLinkFromObject(fromObject);
			if (link !== null)
				return link;
			throw new RangeError(`Object that contains ${Metadata.RELATIONS} must contain a valid ${Metadata.LINK}
Actual: ${JSON.stringify(fromObject, null, 2)}`);
		}

		for (const [name, child] of Object.entries(fromObject))
		{
			const typeOfChild = getJsonType(child);
			if (name === relation && typeOfChild === "object" && !(Metadata.RELATIONS in (child as ObjectNode)))
			{
				const link = this.getOptionalLinkFromNode(child);
				if (link != null)
					return link;
			}
			const property = new Property(name, child,
				insideStateMetadata || name === Metadata.STATE.toString());
			if (property.isMetadata() && name !== Metadata.STATE.toString())
			{
				// Do not search inside metadata properties, unless it's a @state.
				continue;
			}

			let match: Link | null;
			switch (typeOfChild)
			{
				case "string":
				{
					match = this.getOptionalLinkFromString(child as string);
					break;
				}
				case "null":
				{
					match = null;
					break;
				}
				case "array":
				{
					match = this.getOptionalResourceFromArray(child as JsonNode[], relation);
					break;
				}
				case "object":
				{
					const childObject = child as ObjectNode;
					if (this.containsLinkFromObject(childObject))
					{
						// Skip over nested resources
						match = null;
					}
					else
					{
						match = this.getOptionalResourceRecursive(childObject, relation,
							insideStateMetadata || name === Metadata.STATE.toString());
					}
					break;
				}
				default:
					match = null;
			}
			if (match !== null)
				return match;
		}
		return null;
	}

	/**
	 * Returns the descendant resources with the requested `relation`.
	 *
	 * @param fromObject - the starting point for the search
	 * @param relation - the desired relation between matching resources and their enclosing resource
	 * @param insideStateMetadata - true if `object` is the value of a `@state` metadata
	 * property
	 * @returns an empty list if no match was found
	 * @throws RangeError if `relation` contains any leading, trailing whitespace or is empty
	 */
	private getOptionalResourcesRecursive(fromObject: ObjectNode, relation: string,
	                                      insideStateMetadata: boolean)
	{
		const matches: Link[] = [];
		if (this.nodeContainsRelation(fromObject, relation))
		{
			const link = this.getOptionalLinkFromObject(fromObject);
			if (link === null)
			{
				throw new RangeError(`Object that contains ${Metadata.RELATIONS} must contain a valid ${Metadata.LINK}
Actual: ${JSON.stringify(fromObject, null, 2)}`);
			}
			matches.push(link);
		}

		for (const [name, child] of Object.entries(fromObject))
		{
			if (name === relation && getJsonType(child) === "object" &&
				!(Metadata.RELATIONS in (child as ObjectNode)))
			{
				const link = this.getOptionalLinkFromObject(fromObject);
				if (link !== null)
				{
					matches.push(link);
					continue;
				}
			}
			const property = new Property(name, child,
				insideStateMetadata || name === Metadata.STATE.toString());
			if (property.isMetadata() && name !== Metadata.STATE.toString())
			{
				// Do not search inside metadata properties, unless it's @state.
				continue;
			}

			const typeOfChild = getJsonType(child);
			switch (typeOfChild)
			{
				case "string":
				{
					const link = this.getOptionalLinkFromString(child as string);
					if (link !== null)
						matches.push(link);
					break;
				}
				case "null":
					break;
				case "array":
				{
					matches.push(...this.getOptionalResourcesFromArray(child as JsonNode[], relation));
					break;
				}
				case "object":
				{
					const childObject = child as ObjectNode;
					if (this.containsLinkFromObject(childObject))
					{
						// Skip over nested resources
					}
					else
					{
						matches.push(...this.getOptionalResourcesRecursive(childObject, relation,
							insideStateMetadata || name === Metadata.STATE.toString()));
					}
					break;
				}
			}
		}
		return matches;
	}

	/**
	 * @param node - a text node
	 * @returns true if the node contains a link
	 */
	private containsLinkFromString(node: string)
	{
		try
		{
			new URL(node);
			return true;
		}
		catch (unused)
		{
			return false;
		}
	}

	/**
	 * @param object - an object that might be a representation of a resource
	 * @returns true if the object contains a link
	 * @throws RangeError if the object contains a `@link` property, but its value is not a valid URI
	 */
	private containsLinkFromObject(object: ObjectNode)
	{
		const linkProperty = object[Metadata.LINK];
		if (linkProperty === null)
			return false;
		if (typeof (linkProperty) === "string")
		{
			if (!this.containsLinkFromString(linkProperty))
			{
				throw new RangeError(`The value of a ${Metadata.LINK} property must be a valid URI.
Actual: ${linkProperty}`);
			}
			return true;
		}
		throw new RangeError(`The value of a ${Metadata.LINK} property must be a text node.
Actual: ${typeof (linkProperty)}`);
	}

	/**
	 * Returns the link representation of the node.
	 *
	 * @param node - a JSON type
	 * @returns null if no match is found
	 */
	private getOptionalLinkFromNode(node: JsonNode)
	{
		const typeOfNode = getJsonType(node);
		switch (typeOfNode)
		{
			case "string":
				return this.getOptionalLinkFromString(node as string);
			case "object":
				return this.getOptionalLinkFromObject(node as ObjectNode);
			default:
				return null;
		}
	}

	/**
	 * Returns the link representation of the node.
	 *
	 * @param node - a text node
	 * @returns null if no match is found
	 */
	private getOptionalLinkFromString(node: string): Link | null
	{
		try
		{
			return Link.toUri(new URL(node));
		}
		catch (unused)
		{
			return null;
		}
	}

	/**
	 * Returns the link of the resource.
	 *
	 * @param object - an object that might be a representation of a resource
	 * @returns if no match is found
	 * @throws RangeError if the object contains a `@link` property that is not a text node, or a
	 * valid URI
	 */
	private getOptionalLinkFromObject(object: ObjectNode)
	{
		const linkProperty = object[Metadata.LINK];
		if (linkProperty === null)
			return null;
		const typeOfLink = getJsonType(linkProperty);
		if (typeOfLink === "string")
		{
			const link = this.getOptionalLinkFromString(linkProperty as string);
			if (link === null)
			{
				throw new RangeError(`The value of a ${Metadata.LINK} property must be a valid URI
Actual: ${link}`);
			}
			return link;
		}
		throw new RangeError(`The value of a ${Metadata.LINK} property must be a text node.
Actual: ${typeOfLink}`);
	}

	/**
	 * @param object - a JSON object
	 * @param relation - the desired relation
	 * @returns true if the object contains a `@relations` array that contains `relation`
	 */
	private nodeContainsRelation(object: ObjectNode, relation: string)
	{
		const relations = object[Metadata.RELATIONS];
		if (relations === null || !Array.isArray(relations))
			return false;
		for (const value of relations)
		{
			if (value === relation)
				return true;
		}
		return false;
	}

	/**
	 * @param fromArray - the starting point for the search
	 * @param relation - the desired relation between matching resources and their enclosing resource
	 * @returns null if no match was found
	 * @throws RangeError if `relation` contains any leading, trailing whitespace or is empty
	 */
	private getOptionalResourceFromArray(fromArray: JsonNode[], relation: string): Link | null
	{
		for (const child of fromArray)
		{
			let match: Link | null;
			const typeOfChild = getJsonType(child);
			switch (typeOfChild)
			{
				case "string":
				{
					match = this.getOptionalLinkFromString(child as string);
					break;
				}
				case "array":
				{
					match = this.getOptionalResourceFromArray(child as JsonNode[], relation);
					break;
				}
				case "object":
				{
					const childObject = child as ObjectNode;
					const link = childObject[Metadata.LINK];
					if (link != null)
					{
						// Skip over nested resources
						continue;
					}
					match = this.getOptionalResourceRecursive(childObject, relation, false);
					break;
				}
				default:
				{
					match = null;
					break;
				}
			}
			if (match !== null)
				return match;
		}
		return null;
	}

	/**
	 * @param fromArray - the starting point for the search
	 * @param relation - the desired relation between matching resources and their enclosing resource
	 * @returns an empty list if no match was found
	 * @throws RangeError if `relation` contains any leading, trailing whitespace or is empty
	 */
	private getOptionalResourcesFromArray(fromArray: JsonNode[], relation: string)
	{
		const matches: Link[] = [];
		for (const child of fromArray)
		{
			const typeOfChild = getJsonType(child);
			switch (typeOfChild)
			{
				case "string":
				{
					const link = this.getOptionalLinkFromString(child as string);
					if (link != null)
						matches.push(link);
					break;
				}
				case "array":
				{
					matches.push(...this.getOptionalResourcesFromArray(child as JsonNode[], relation));
					break;
				}
				case "object":
				{
					const childObject = child as ObjectNode;
					const link = childObject[Metadata.LINK];
					if (link === null)
						matches.push(...this.getOptionalResourcesRecursive(childObject, relation, false));
					// Skip over nested resources
					break;
				}
				default:
					break;
			}
		}
		return matches;
	}
}

export {Resource};