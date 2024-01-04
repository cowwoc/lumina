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

import java.net.URI;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.UUID;

import static com.github.cowwoc.requirements.DefaultRequirements.requireThat;

/**
 * Helper methods for manipulating object properties.
 */
public final class Property
{
	/**
	 * @return true if the property name belongs to a metadata property
	 */
	public boolean isMetadata()
	{
		return !insideStateMetadata && name.startsWith("@");
	}

	/**
	 * @return true if the property name belongs to a state property
	 */
	public boolean isState()
	{
		return !isMetadata();
	}

	private final String name;
	private final JsonNode value;
	private final boolean insideStateMetadata;

	/**
	 * Wraps a JsonNode.
	 *
	 * @param name                the name of the property
	 * @param value               the value of the property
	 * @param insideStateMetadata true if the property is declared inside a {@code @state} metadata property
	 * @throws NullPointerException if any of the arguments are null
	 */
	public Property(String name, JsonNode value, boolean insideStateMetadata)
	{
		requireThat(name, "name").isNotNull();
		requireThat(value, "value").isNotNull();
		this.name = name;
		this.value = value;
		this.insideStateMetadata = insideStateMetadata;
	}

	/**
	 * @return the String value
	 * @throws IllegalArgumentException if the value is not a string
	 */
	public String stringValue()
	{
		if (!value.isTextual())
		{
			throw new IllegalArgumentException(name + " must be a string.\n" +
				"Actual  : " + value.getNodeType() + "\n" +
				"Node    : " + value + "\n" +
				"Resource: " + this);
		}
		return value.textValue();
	}

	/**
	 * @return the String value as a URI
	 * @throws IllegalArgumentException if the value is not a valid URI
	 */
	public URI uriValue()
	{
		String string = stringValue();
		return requireThat(string, name).asUri().getActual();
	}

	/**
	 * @return the value as an array of strings
	 * @throws IllegalArgumentException if the value is not an array of strings
	 */
	public List<String> stringValues()
	{
		if (!value.isArray())
		{
			throw new IllegalArgumentException(name + " must be an array.\n" +
				"Actual  : " + value.getNodeType() + "\n" +
				"Node    : " + value + "\n" +
				"Resource: " + this);
		}

		List<String> elements = new ArrayList<>();
		for (JsonNode element : value)
			elements.add(new Property(name, element, insideStateMetadata).stringValue());
		return elements;
	}

	/**
	 * @return the UUID value
	 * @throws IllegalArgumentException if the value is not a UUID
	 */
	public UUID uuidValue()
	{
		return UUID.fromString(stringValue());
	}

	/**
	 * @return the Instant value
	 * @throws DateTimeParseException if the value is not an Instant
	 */
	public Instant instantValue()
	{
		return Instant.parse(stringValue());
	}

	/**
	 * @return the {@code Map<Integer, String>} value
	 * @throws IllegalArgumentException if the value is not a {@code Map<Integer, String>}
	 */
	public Map<Integer, String> integerToStringValue()
	{
		Map<Integer, String> map = new HashMap<>();
		for (Entry<String, JsonNode> entry : value.properties())
		{
			Integer version = requireThat(entry.getKey(), "key").asInteger().getActual();
			String nestedValue = new Property(entry.getKey(), entry.getValue(), insideStateMetadata).stringValue();
			map.put(version, nestedValue);
		}
		return map;
	}
}