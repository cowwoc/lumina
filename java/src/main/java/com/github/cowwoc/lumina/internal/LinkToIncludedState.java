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
package com.github.cowwoc.lumina.internal;

import com.github.cowwoc.lumina.Link;
import com.github.cowwoc.lumina.Metadata;
import com.github.cowwoc.lumina.Property;
import com.github.cowwoc.lumina.Resource;

import java.net.URI;
import java.util.Optional;

import static com.github.cowwoc.requirements.DefaultRequirements.assertThat;

/**
 * A link to a resource whose state was included by the enclosing document.
 */
public final class LinkToIncludedState implements Link
{
	/**
	 * The JSON node that contains the resource.
	 */
	@SuppressWarnings("OptionalUsedAsFieldOrParameterType")
	private final Optional<Resource> resource;

	/**
	 * @param resource the resource that is referenced by the link
	 * @throws NullPointerException if {@code resource} is null
	 */
	public LinkToIncludedState(Resource resource)
	{
		assertThat(r -> r.requireThat(resource, "resource").isNotNull());
		this.resource = Optional.of(resource);
	}

	/**
	 * Returns the URI of this resource.
	 *
	 * @return null if this resource does not include a {@code @link} metadata property
	 */
	public URI getUri()
	{
		Property link = resource.orElseThrow().getOptionalProperty(Metadata.LINK.toString()).orElse(null);
		if (link == null)
			return null;
		return link.uriValue();
	}

	/**
	 * @return the resource state, if it is present
	 */
	public Optional<Resource> getResource()
	{
		return resource;
	}

	@Override
	public int hashCode()
	{
		return resource.orElseThrow().hashCode();
	}

	@Override
	public boolean equals(Object o)
	{
		return o instanceof LinkToIncludedState other && other.resource.equals(resource);
	}

	@Override
	public String toString()
	{
		return resource.toString();
	}
}