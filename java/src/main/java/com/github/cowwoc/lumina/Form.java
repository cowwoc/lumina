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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import static com.github.cowwoc.requirements.DefaultRequirements.requireThat;

/**
 * A JSON object that describes how to submit requests to the server.
 */
public final class Form
{
	/**
	 * An input field of a form.
	 */
	public static abstract class Property
	{
		/**
		 * The JSON type of the property.
		 */
		protected final String type;

		/**
		 * Creates a new String property.
		 *
		 * @param type the type of the property
		 * @throws NullPointerException     if any of the arguments are null
		 * @throws IllegalArgumentException if any of the arguments contain leading, trailing whitespace or are
		 *                                  empty
		 */
		public Property(String type)
		{
			requireThat(type, "type").isStripped().isEmpty();
			this.type = type;
		}

		/**
		 * @param objectMapper the JSON configuration
		 * @return the JSON representation of the property
		 */
		protected ObjectNode toJson(ObjectMapper objectMapper)
		{
			return objectMapper.createObjectNode().
				put("type", type);
		}
	}

	/**
	 * A form property of type String.
	 */
	public static final class StringProperty extends Property
	{
		private Integer minLength;
		private Integer maxLength;
		private Boolean optional;
		private String description;

		/**
		 * Creates a new String property.
		 */
		public StringProperty()
		{
			super("string");
		}

		/**
		 * @param minLength the minimum number of characters that a string property can have (inclusive)
		 * @return this
		 * @throws IllegalArgumentException if {@code minLength} is negative
		 */
		public StringProperty minLength(int minLength)
		{
			requireThat(minLength, "minLength").isNotNegative();
			this.minLength = minLength;
			return this;
		}

		/**
		 * @param maxLength the maximum number of characters that a string property can have (exclusive)
		 * @return this
		 * @throws IllegalArgumentException if {@code minLength} is negative
		 */
		public StringProperty maxLength(int maxLength)
		{
			requireThat(maxLength, "maxLength").isNotNegative();
			this.maxLength = maxLength;
			return this;
		}

		/**
		 * @param optional true if a property value may be {@code null}
		 * @return this
		 */
		public StringProperty optional(boolean optional)
		{
			this.optional = optional;
			return this;
		}

		/**
		 * @param description describes the property value
		 * @return this
		 * @throws NullPointerException     if {@code description} is null
		 * @throws IllegalArgumentException if {@code description} contains leading, trailing whitespace or is
		 *                                  empty
		 */
		public StringProperty description(String description)
		{
			requireThat(description, "description").isStripped().isNotEmpty();
			this.description = description;
			return this;
		}

		/**
		 * {@inheritDoc}
		 *
		 * @throws IllegalArgumentException if {@code minLength > maxLength}
		 */
		@Override
		protected ObjectNode toJson(ObjectMapper objectMapper)
		{
			requireThat(minLength, "minLength").isLessThanOrEqualTo(maxLength, "maxLength");
			ObjectNode json = super.toJson(objectMapper);
			if (minLength != null)
				json.put("minLength", minLength);
			if (maxLength != null)
				json.put("maxLength", maxLength);
			if (optional != null && optional)
				json.put("optional", optional);
			if (description != null)
				json.put(Metadata.DESCRIPTION.toString(), description);
			return json;
		}
	}

	/**
	 * A form property of type URI.
	 */
	public static final class UriProperty extends Property
	{
		private Integer minLength;
		private Integer maxLength;
		private Boolean optional;
		private String description;

		/**
		 * Creates a new URI property.
		 */
		public UriProperty()
		{
			super("uri");
		}

		/**
		 * @param minLength the minimum number of characters that a string property can have (inclusive)
		 * @return this
		 * @throws IllegalArgumentException if {@code minLength} is negative
		 */
		public UriProperty minLength(int minLength)
		{
			requireThat(minLength, "minLength").isNotNegative();
			this.minLength = minLength;
			return this;
		}

		/**
		 * @param maxLength the maximum number of characters that a string property can have (exclusive)
		 * @return this
		 * @throws IllegalArgumentException if {@code minLength} is negative
		 */
		public UriProperty maxLength(int maxLength)
		{
			requireThat(maxLength, "maxLength").isNotNegative();
			this.maxLength = maxLength;
			return this;
		}

		/**
		 * @param optional true if a property value may be {@code null}
		 * @return this
		 */
		public UriProperty optional(boolean optional)
		{
			this.optional = optional;
			return this;
		}

		/**
		 * @param description describes the property value
		 * @return this
		 * @throws NullPointerException     if {@code description} is null
		 * @throws IllegalArgumentException if {@code description} contains leading, trailing whitespace or is
		 *                                  empty
		 */
		public UriProperty description(String description)
		{
			requireThat(description, "description").isStripped().isNotEmpty();
			this.description = description;
			return this;
		}

		/**
		 * {@inheritDoc}
		 *
		 * @throws IllegalArgumentException if {@code minLength > maxLength}
		 */
		@Override
		protected ObjectNode toJson(ObjectMapper objectMapper)
		{
			requireThat(minLength, "minLength").isLessThanOrEqualTo(maxLength, "maxLength");
			ObjectNode json = super.toJson(objectMapper);
			if (minLength != null)
				json.put("minLength", minLength);
			if (maxLength != null)
				json.put("maxLength", maxLength);
			if (optional != null && optional)
				json.put("optional", optional);
			if (description != null)
				json.put(Metadata.DESCRIPTION.toString(), description);
			return json;
		}
	}

	private String description;
	private final URI uri;
	private final String method;
	private final String contentType;
	private final Map<String, Property> nameToProperty = new HashMap<>();
	private final Map<Integer, String> responseCodeToDescription = new HashMap<>();

	/**
	 * @param uri         the URI to submit the form to
	 * @param method      the HTTP method to use when submitting the form
	 * @param contentType the {@code Content-Type} header value to use when submitting the form
	 * @throws NullPointerException     if any of the arguments are null
	 * @throws IllegalArgumentException if any of the arguments contain leading, trailing whitespace or are
	 *                                  empty
	 */
	public Form(URI uri, String method, String contentType)
	{
		requireThat(uri, "uri").isNotNull();
		requireThat(method, "method").isStripped().isNotEmpty();
		requireThat(contentType, "contentType").isStripped().isNotEmpty();

		this.uri = uri;
		this.method = method;
		this.contentType = contentType;
	}

	/**
	 * @param description describes the form
	 * @return this
	 * @throws NullPointerException     if {@code description} is null
	 * @throws IllegalArgumentException if {@code description} contains leading, trailing whitespace or is
	 *                                  empty
	 */
	public Form description(String description)
	{
		requireThat(description, "description").isStripped().isNotEmpty();
		this.description = description;
		return this;
	}

	/**
	 * Adds a new input property.
	 *
	 * @param name     the name of the property
	 * @param property the property
	 * @return this
	 * @throws NullPointerException     if any of the arguments are null
	 * @throws IllegalArgumentException if {@code name} contains leading, trailing whitespace or empty
	 */
	public Form addInput(String name, Property property)
	{
		requireThat(name, "name").isStripped().isEmpty();
		nameToProperty.put(name, property);
		return this;
	}

	/**
	 * Adds a new server response.
	 *
	 * @param code        the HTTP response code
	 * @param description (optional) an explanation of when this response code is returned
	 * @return this
	 * @throws IllegalArgumentException if {@code description} contains a leading, trailing whitespace or is
	 *                                  empty
	 */
	public Form addResponse(int code, String description)
	{
		responseCodeToDescription.put(code, description);
		return this;
	}

	/**
	 * @param objectMapper the JSON configuration
	 * @return the Resource representing the form
	 * @throws NullPointerException if {@code objectMapper} is null
	 */
	public ObjectNode toResource(ObjectMapper objectMapper)
	{
		ObjectNode inputs = getInputs(objectMapper);
		JsonNode responses;
		ObjectNode form = objectMapper.createObjectNode();

		if (description == null)
			responses = getResponses(objectMapper);
		else
		{
			String descriptionMetadata = Metadata.DESCRIPTION.toString();
			form.put(descriptionMetadata, description);
			inputs.put(descriptionMetadata, "The list of inputs that the form accepts");

			responses = objectMapper.createObjectNode().
				put(descriptionMetadata, "The list of responses that the form may return").
				set(Metadata.STATE.toString(), getResponses(objectMapper));
		}

		form.put(Metadata.LINK.toString(), uri.toString()).
			put("method", method).
			put("contentType", contentType).
				<ObjectNode>set("inputs", inputs).
			set("responses", responses);
		return form;
	}

	/**
	 * @param om the JSON configuration
	 * @return the server responses
	 */
	private ObjectNode getInputs(ObjectMapper om)
	{
		ObjectNode state = om.createObjectNode();
		for (Entry<String, Property> entry : nameToProperty.entrySet())
			state.set(entry.getKey(), entry.getValue().toJson(om));
		return state;
	}

	/**
	 * @param om the JSON configuration
	 * @return the server responses
	 */
	private ArrayNode getResponses(ObjectMapper om)
	{
		ArrayNode state = om.createArrayNode();
		for (Entry<Integer, String> entry : responseCodeToDescription.entrySet())
		{
			ObjectNode response = om.createObjectNode().
				put("code", entry.getKey());
			String description = entry.getValue();
			if (description != null)
				response.put(Metadata.DESCRIPTION.toString(), description);
			state.add(response);
		}
		return state;
	}
}