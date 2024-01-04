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
import {type Resource} from "../Resource.mjs";
import {assertThat} from "@cowwoc/requirements";
import {Metadata} from "../Metadata.mjs";

/**
 * A link to a resource whose state was included by the enclosing document.
 */
class LinkToIncludedState implements Link
{
	/**
	 * The JSON node that contains the resource.
	 */
	private readonly resource: Resource | undefined;

	/**
	 * @param resource - the resource that is referenced by the link
	 * @throws TypeError if `resource` is null
	 */
	public constructor(resource: Resource)
	{
		assertThat(r => r.requireThat(resource, "resource").isNotNull());
		this.resource = resource;
	}

	/**
	 * Returns the URI of this resource.
	 *
	 * @returns null if this resource does not include a `@link` metadata property
	 */
	public getUri()
	{
		let link;
		if (this.resource === undefined)
			link = null;
		else
			link = this.resource.getOptionalProperty(Metadata.LINK);
		if (link == null)
			return null;
		return link.uriValue();
	}

	/**
	 * @returns the resource state, if it is present
	 */
	public getResource(): Resource | undefined
	{
		return this.resource;
	}

	/**
	 * @returns the string representation of the resource
	 */
	public toString(): string
	{
		if (this.resource === undefined)
			return "undefined";
		return this.resource.toString();
	}
}

export {LinkToIncludedState};