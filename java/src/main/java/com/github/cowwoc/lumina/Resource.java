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
package com.github.cowwoc.lumina;

import com.fasterxml.jackson.core.JsonPointer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import com.github.cowwoc.lumina.exception.NoSuchPropertyException;
import com.github.cowwoc.lumina.exception.NoSuchRelationException;
import com.github.cowwoc.lumina.internal.LinkToIncludedState;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map.Entry;
import java.util.Optional;

import static com.github.cowwoc.requirements.DefaultRequirements.requireThat;

/**
 * A resource that was returned by the server.
 */
public final class Resource
{
	/**
	 * The JSON node that contains the resource.
	 */
	private final ObjectNode json;
	/**
	 * The URI of the top-level resource.
	 */
	private final URI uri;
	/**
	 * This resource's path within the enclosing document.
	 */
	private final JsonPointer path;
	/**
	 * A link to this resource.
	 */
	private final LinkToIncludedState link;

	/**
	 * @param json the JSON object that represents the resource
	 * @param uri  the URI of this resource
	 * @param path this resource's path within the enclosing document
	 * @throws NullPointerException if any of the arguments are null
	 */
	public Resource(ObjectNode json, URI uri, JsonPointer path)
	{
		requireThat(json, "json").isNotNull();
		requireThat(uri, "uri").isNotNull();
		requireThat(path, "path").isNotNull();
		this.json = json;
		this.uri = uri;
		this.path = path;
		this.link = new LinkToIncludedState(this);
	}

	/**
	 * @return a {@link Link} to this resource
	 */
	public Link asLink()
	{
		return link;
	}

	/**
	 * @return the URI of this resource
	 */
	public URI getUri()
	{
		return uri;
	}

	/**
	 * @return this resource's path within the enclosing document
	 */
	public JsonPointer getPath()
	{
		return path;
	}

	/**
	 * @return the resource's state
	 */
	public JsonNode getStateContainer()
	{
		JsonNode stateMetadata = json.get(Metadata.STATE.toString());
		if (stateMetadata != null)
			return stateMetadata;
		return json;
	}

	/**
	 * @return true if this resource contains a state, even if that state does not contain any properties (e.g.,
	 * 	an empty @state property)
	 */
	public boolean containsState()
	{
		for (Entry<String, JsonNode> child : json.properties())
		{
			String name = child.getKey();
			if (!name.startsWith("@") || name.equals(Metadata.STATE.toString()))
				return true;
		}
		return false;
	}

	/**
	 * Returns a descendant links with the requested {@code relation}. If multiple matches exist, one of them is
	 * returned, but it is not specified which one.
	 *
	 * @param relation the relation between this resource and the matching resource
	 * @return {@code Optional.empty()} if no match was found
	 * @throws IllegalArgumentException if {@code relation} contains any leading, trailing whitespace or is
	 *                                  empty
	 */
	public Optional<Link> getOptionalResource(String relation)
	{
		return getOptionalResource(json, relation, false);
	}

	/**
	 * Returns the descendant resources with the requested {@code relation}.
	 *
	 * @param relation the relation between this resource and the matching resources
	 * @return an empty list if no match was found
	 * @throws IllegalArgumentException if {@code relation} contains any leading, trailing whitespace or is
	 *                                  empty
	 */
	public List<Link> getOptionalResources(String relation)
	{
		return getOptionalResources(json, relation, false);
	}

	/**
	 * Returns a node with the requested {@code relation}. If multiple matches exist, one of them is returned,
	 * but it is not specified which one.
	 *
	 * @param relation the relation between this resource and the matching resource
	 * @return the matching node
	 * @throws IllegalArgumentException if {@code relation} contains any leading, trailing whitespace or is
	 *                                  empty
	 * @throws NoSuchRelationException  if no match was found
	 */
	public Link getResource(String relation) throws NoSuchRelationException
	{
		Link match = getOptionalResource(relation).orElse(null);
		if (match == null)
			throw new NoSuchRelationException(json, relation);
		return match;
	}

	/**
	 * Returns a node with the requested {@code relation}. If multiple matches exist, one of them is returned,
	 * but it is not specified which one.
	 *
	 * @param relation the relation between this resource and the matching resources
	 * @return the matching node
	 * @throws IllegalArgumentException if {@code relation} contains any leading, trailing whitespace or is
	 *                                  empty
	 * @throws NoSuchRelationException  if no match was found
	 */
	public List<Link> getResources(String relation) throws NoSuchRelationException
	{
		List<Link> matches = getOptionalResources(relation);
		if (matches.isEmpty())
			throw new NoSuchRelationException(json, relation);
		return matches;
	}

	/**
	 * Returns a node with the requested {@code relation}. If multiple matches exist, one of them is returned,
	 * but it is not specified which one.
	 *
	 * @param name the name of a property
	 * @return the property
	 * @throws IllegalArgumentException if {@code name} contains any leading, trailing whitespace or is empty
	 */
	public Optional<Property> getOptionalProperty(String name)
	{
		JsonNode match = json.get(name);
		boolean insideStateMetadata;
		if (match == null)
		{
			JsonNode stateMetadata = json.get(Metadata.STATE.toString());
			if (stateMetadata == null)
				return Optional.empty();
			match = stateMetadata.get(name);
			if (match == null)
				return Optional.empty();
			insideStateMetadata = true;
		}
		else
			insideStateMetadata = false;
		return Optional.of(new Property(name, match, insideStateMetadata));
	}

	/**
	 * Returns a node with the requested {@code relation}. If multiple matches exist, one of them is returned,
	 * but it is not specified which one.
	 *
	 * @param name the name of a property
	 * @return the property
	 * @throws IllegalArgumentException if {@code name} contains any leading, trailing whitespace or is empty
	 * @throws NoSuchPropertyException  if no match was found
	 */
	public Property getProperty(String name) throws NoSuchPropertyException
	{
		Property property = getOptionalProperty(name).orElse(null);
		if (property == null)
			throw new NoSuchPropertyException(json, name);
		return property;
	}

	/**
	 * @return the list of strings in this resource's state
	 * @throws IllegalArgumentException if the resource is not an array of strings
	 */
	public List<String> getStringValues()
	{
		JsonNode stateMetadata = json.get(Metadata.STATE.toString());
		if (stateMetadata == null)
		{
			throw new IllegalArgumentException("Resource must contain a " + Metadata.STATE + " property.\n" +
				"Actual: " + json.toPrettyString());
		}
		if (!(stateMetadata instanceof ArrayNode arrayNode))
		{
			throw new IllegalArgumentException(Metadata.STATE + " property must be an array.\n" +
				"Actual: " + stateMetadata.getNodeType());
		}

		List<String> elements = new ArrayList<>();
		for (JsonNode element : arrayNode)
		{
			if (!(element instanceof TextNode))
			{
				throw new IllegalArgumentException(Metadata.STATE + " must contain string elements.\n" +
					"Actual: " + element.asText() + "\n" +
					"Type  : " + element.getNodeType());
			}
			elements.add(element.textValue());
		}
		return elements;
	}

	/**
	 * Returns a resource's state as a list of resources.
	 *
	 * @return an empty list if this resource's state is not an array of resources
	 * @throws IllegalArgumentException if {@code resource} does not contain a {@code @state} property. If the
	 *                                  resource's state is not an array. If one of the array's elements is not
	 *                                  a resource.
	 */
	public List<Link> getResourceLinks()
	{
		JsonNode stateMetadata = json.get(Metadata.STATE.toString());
		if (stateMetadata == null)
			throw new IllegalArgumentException("Resource must contain a " + Metadata.STATE + " property.");
		if (!(stateMetadata instanceof ArrayNode))
		{
			throw new IllegalArgumentException("Resource state must be an array.\n" +
				"Actual: " + stateMetadata.getNodeType());
		}
		List<Link> links = new ArrayList<>();
		for (JsonNode value : stateMetadata)
		{
			Link link = getOptionalLink(value).orElse(null);
			if (link == null)
			{
				throw new IllegalArgumentException("Resource state must contain resources.\n" +
					"Actual: " + stateMetadata.toPrettyString() + "\n" +
					"Unwanted: " + value.toPrettyString());
			}
			links.add(link);
		}
		return links;
	}

	/**
	 * @return the JSON representation of this resource
	 */
	public ObjectNode asJson()
	{
		return json;
	}

	@Override
	public int hashCode()
	{
		return json.hashCode();
	}

	@Override
	public boolean equals(Object o)
	{
		return o instanceof Resource other && other.json.equals(json);
	}

	@Override
	public String toString()
	{
		return uri.toString();
	}

	/**
	 * Returns a descendant resource with the requested {@code relation}. If multiple matches exist, one of them
	 * is returned, but it is not specified which one.
	 *
	 * @param fromObject          the starting point for the search
	 * @param relation            the desired relation between matching resources and their enclosing resource
	 * @param insideStateMetadata true if {@code object} is the value of a {@code @state} metadata property
	 * @return {@code Optional.empty()} if no match was found
	 * @throws IllegalArgumentException if {@code relation} contains any leading, trailing whitespace or is
	 *                                  empty
	 */
	private Optional<Link> getOptionalResource(ObjectNode fromObject, String relation,
		boolean insideStateMetadata)
	{
		if (nodeContainsRelation(fromObject, relation))
		{
			Optional<Link> link = getOptionalLink(fromObject);
			if (link.isPresent())
				return link;
			throw new IllegalArgumentException("Object that contains " + Metadata.RELATIONS + " must contain a " +
				"valid " + Metadata.LINK + "\n" +
				"Actual: " + fromObject.toPrettyString());
		}

		for (Entry<String, JsonNode> entry : fromObject.properties())
		{
			String name = entry.getKey();
			JsonNode child = entry.getValue();
			if (name.equals(relation) && !child.has(Metadata.RELATIONS.toString()))
			{
				Link link = getOptionalLink(child).orElse(null);
				if (link != null)
					return Optional.of(link);
			}
			Property property = new Property(name, child,
				insideStateMetadata || name.equals(Metadata.STATE.toString()));
			if (property.isMetadata() && !name.equals(Metadata.STATE.toString()))
			{
				// Do not search inside metadata properties, unless it's a @state.
				continue;
			}

			Optional<Link> match = switch (child)
			{
				case TextNode textNode ->
				{
					Link link = getOptionalLink(textNode).orElse(null);
					if (link == null)
						yield Optional.empty();
					yield Optional.of(link);
				}
				case ArrayNode arrayNode -> getOptionalResourceFromArray(arrayNode, relation);
				case ObjectNode objectNode ->
				{
					if (containsLink(objectNode))
					{
						// Skip over nested resources
						yield Optional.empty();
					}
					yield getOptionalResource(objectNode, relation,
						insideStateMetadata || name.equals(Metadata.STATE.toString()));
				}
				default -> Optional.empty();
			};
			if (match.isPresent())
				return match;
		}
		return Optional.empty();
	}

	/**
	 * Returns the descendant resources with the requested {@code relation}.
	 *
	 * @param fromObject          the starting point for the search
	 * @param relation            the desired relation between matching resources and their enclosing resource
	 * @param insideStateMetadata true if {@code object} is the value of a {@code @state} metadata property
	 * @return an empty list if no match was found
	 * @throws IllegalArgumentException if {@code relation} contains any leading, trailing whitespace or is
	 *                                  empty
	 */
	private List<Link> getOptionalResources(ObjectNode fromObject, String relation,
		boolean insideStateMetadata)
	{
		List<Link> matches = new ArrayList<>();
		if (nodeContainsRelation(fromObject, relation))
		{
			Link link = getOptionalLink(fromObject).orElse(null);
			if (link == null)
			{
				throw new IllegalArgumentException("Object that contains " + Metadata.RELATIONS + " must contain a " +
					"valid " + Metadata.LINK + "\n" +
					"Actual: " + fromObject.toPrettyString());
			}
			matches.add(link);
		}

		for (Entry<String, JsonNode> entry : fromObject.properties())
		{
			String name = entry.getKey();
			JsonNode child = entry.getValue();
			if (name.equals(relation) && !child.has(Metadata.RELATIONS.toString()))
			{
				Link link = getOptionalLink(fromObject).orElse(null);
				if (link != null)
				{
					matches.add(link);
					continue;
				}
			}
			Property property = new Property(name, child,
				insideStateMetadata || name.equals(Metadata.STATE.toString()));
			if (property.isMetadata() && !name.equals(Metadata.STATE.toString()))
			{
				// Do not search inside metadata properties, unless it's @state.
				continue;
			}

			List<Link> nestedMatches = switch (child)
			{
				case TextNode textNode ->
				{
					Link link = getOptionalLink(textNode).orElse(null);
					if (link == null)
						yield List.of();
					yield List.of(link);
				}
				case ArrayNode arrayNode -> getOptionalResourcesFromArray(arrayNode, relation);
				case ObjectNode objectNode ->
				{
					if (containsLink(objectNode))
					{
						// Skip over nested resources
						yield List.of();
					}
					yield getOptionalResources(objectNode, relation,
						insideStateMetadata || name.equals(Metadata.STATE.toString()));
				}
				default -> List.of();
			};
			matches.addAll(nestedMatches);
		}
		return matches;
	}

	/**
	 * @param node a text node
	 * @return true if the node contains a link
	 */
	private boolean containsLink(TextNode node)
	{
		try
		{
			new URI(node.textValue());
			return true;
		}
		catch (URISyntaxException unused)
		{
			return false;
		}
	}

	/**
	 * @param object an object that might be a representation of a resource
	 * @return true if the object contains a link
	 * @throws IllegalArgumentException if the object contains a {@code @link} property, but its value is not a
	 *                                  valid URI
	 */
	private boolean containsLink(ObjectNode object)
	{
		JsonNode linkProperty = object.get(Metadata.LINK.toString());
		if (linkProperty == null)
			return false;
		if (linkProperty instanceof TextNode textNode)
		{
			if (!containsLink(textNode))
			{
				throw new IllegalArgumentException("The value of a " + Metadata.LINK + " property must be a valid " +
					"URI.\n" +
					"Actual: " + textNode.textValue());
			}
			return true;
		}
		throw new IllegalArgumentException("The value of a " + Metadata.LINK + " property must be a text " +
			"node.\n" +
			"Actual: " + linkProperty.getNodeType());
	}

	/**
	 * @param node a JSON type
	 * @return the link representation of the node
	 */
	private Optional<Link> getOptionalLink(JsonNode node)
	{
		return switch (node)
		{
			case TextNode textNode -> getOptionalLink(textNode);
			case ObjectNode objectNode -> getOptionalLink(objectNode);
			default -> Optional.empty();
		};
	}

	/**
	 * @param node a text node
	 * @return the link representation of the node
	 */
	private static Optional<Link> getOptionalLink(TextNode node)
	{
		try
		{
			return Optional.of(Link.to(new URI(node.textValue())));
		}
		catch (URISyntaxException unused)
		{
			return Optional.empty();
		}
	}

	/**
	 * @param object an object that might be a representation of a resource
	 * @return the link of the resource
	 * @throws IllegalArgumentException if the object contains a {@code @link} property that is not a text node,
	 *                                  or a valid URI
	 */
	private static Optional<Link> getOptionalLink(ObjectNode object)
	{
		JsonNode linkProperty = object.get(Metadata.LINK.toString());
		if (linkProperty == null)
			return Optional.empty();
		if (linkProperty instanceof TextNode textNode)
		{
			Optional<Link> link = getOptionalLink(textNode);
			if (link.isEmpty())
			{
				throw new IllegalArgumentException("The value of a " + Metadata.LINK + " property must be a valid " +
					"URI.\n" +
					"Actual: " + textNode.textValue());
			}
			return link;
		}
		throw new IllegalArgumentException("The value of a " + Metadata.LINK + " property must be a text " +
			"node.\n" +
			"Actual: " + linkProperty.getNodeType());
	}

	/**
	 * @param object   a JSON object
	 * @param relation the desired relation
	 * @return true if the object contains a {@code @relations} array that contains {@code relation}
	 */
	private boolean nodeContainsRelation(ObjectNode object, String relation)
	{
		JsonNode relations = object.get(Metadata.RELATIONS.toString());
		if (relations == null)
			return false;
		for (JsonNode value : relations)
		{
			if (value.toString().equals(relation))
				return true;
		}
		return false;
	}

	/**
	 * @param fromArray the starting point for the search
	 * @param relation  the desired relation between matching resources and their enclosing resource
	 * @return {@code Optional.empty()} if no match was found
	 * @throws IllegalArgumentException if {@code relation} contains any leading, trailing whitespace or is
	 *                                  empty
	 */
	private Optional<Link> getOptionalResourceFromArray(ArrayNode fromArray, String relation)
	{
		for (JsonNode child : fromArray)
		{
			Optional<Link> match = switch (child)
			{
				case TextNode textNode ->
				{
					Link link = getOptionalLink(textNode).orElse(null);
					if (link == null)
						yield Optional.empty();
					yield Optional.of(link);
				}
				case ArrayNode arrayNode -> getOptionalResourceFromArray(arrayNode, relation);
				case ObjectNode objectNode ->
				{
					JsonNode link = objectNode.get(Metadata.LINK.toString());
					if (link != null)
					{
						// Skip over nested resources
						yield Optional.empty();
					}
					yield getOptionalResource(objectNode, relation, false);
				}
				default -> Optional.empty();
			};
			if (match.isPresent())
				return match;
		}
		return Optional.empty();
	}

	/**
	 * @param fromArray the starting point for the search
	 * @param relation  the desired relation between matching resources and their enclosing resource
	 * @return an empty list if no match was found
	 * @throws IllegalArgumentException if {@code relation} contains any leading, trailing whitespace or is
	 *                                  empty
	 */
	private List<Link> getOptionalResourcesFromArray(ArrayNode fromArray, String relation)
	{
		List<Link> matches = new ArrayList<>();
		for (JsonNode child : fromArray)
		{
			List<Link> nestedMatches = switch (child)
			{
				case TextNode textNode ->
				{
					Link link = getOptionalLink(textNode).orElse(null);
					if (link == null)
						yield List.of();
					yield List.of(link);
				}
				case ArrayNode arrayNode -> getOptionalResourcesFromArray(arrayNode, relation);
				case ObjectNode objectNode ->
				{
					JsonNode link = objectNode.get(Metadata.LINK.toString());
					if (link != null)
					{
						// Skip over nested resources
						yield List.of();
					}
					yield getOptionalResources(objectNode, relation, false);
				}
				default -> List.of();
			};
			matches.addAll(nestedMatches);
		}
		return matches;
	}
}