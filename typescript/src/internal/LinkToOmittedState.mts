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
import type {Link} from "../Link.mjs";
import {assertThat} from "@cowwoc/requirements";

/**
 * A link to a resource whose state was omitted by the enclosing document.
 */
class LinkToOmittedState implements Link
{
	/**
	 * The URI of the top-level resource.
	 */
	private readonly uri: URL;

	/**
	 * @param uri - the URI of the resource
	 */
	public constructor(uri: URL)
	{
		assertThat(r => r.requireThat(uri, "uri").isNotNull());
		this.uri = uri;
	}

	/**
	 * @returns the URI of this resource
	 */
	public getUri()
	{
		return this.uri;
	}

	/**
	 * @returns the resource state, if it is present
	 */
	public getResource()
	{
		return undefined;
	}

	/**
	 * @returns the string representation of the resource
	 */
	public toString(): string
	{
		return this.uri.toString();
	}
}

export {LinkToOmittedState};