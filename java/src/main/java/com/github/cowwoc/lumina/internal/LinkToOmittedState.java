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
import com.github.cowwoc.lumina.Resource;

import java.net.URI;
import java.util.Optional;

import static com.github.cowwoc.requirements.DefaultRequirements.assertThat;

/**
 * A link to a resource whose state was omitted by the enclosing document.
 */
public final class LinkToOmittedState implements Link
{
	/**
	 * The URI of the top-level resource.
	 */
	private final URI uri;

	/**
	 * @param uri the URI of the resource
	 */
	public LinkToOmittedState(URI uri)
	{
		assertThat(r -> r.requireThat(uri, "uri").isNotNull());
		this.uri = uri;
	}

	/**
	 * @return the URI of this resource
	 */
	public URI getUri()
	{
		return uri;
	}

	/**
	 * @return the resource state, if it is present
	 */
	public Optional<Resource> getResource()
	{
		return Optional.empty();
	}

	@Override
	public int hashCode()
	{
		return uri.hashCode();
	}

	@Override
	public boolean equals(Object o)
	{
		return o instanceof LinkToOmittedState other && other.uri.equals(uri);
	}

	@Override
	public String toString()
	{
		return uri.toString();
	}
}