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

import com.github.cowwoc.lumina.internal.LinkToIncludedState;
import com.github.cowwoc.lumina.internal.LinkToOmittedState;

import java.net.URI;
import java.util.Optional;

/**
 * A link to a resource that was returned by the server. The response may or may not include the resource's
 * state.
 */
public interface Link
{
	/**
	 * Returns a link to a resource whose state is included by the enclosing document.
	 *
	 * @param resource the resource to link to
	 * @return a link to the resource
	 * @throws NullPointerException if {@code resource} is null
	 */
	static Link to(Resource resource)
	{
		return new LinkToIncludedState(resource);
	}

	/**
	 * Returns a link to a resource whose state is omitted by the enclosing document.
	 *
	 * @param uri the URI of the resource
	 * @return a link to the resource
	 * @throws NullPointerException if {@code uri} is null
	 */
	static Link to(URI uri)
	{
		return new LinkToOmittedState(uri);
	}

	/**
	 * @return the URI of this resource
	 */
	URI getUri();

	/**
	 * @return the resource state, if it is present
	 */
	Optional<Resource> getResource();
}