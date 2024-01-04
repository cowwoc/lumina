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
import type {Resource} from "./Resource.mjs";
import {LinkToIncludedState} from "./internal/LinkToIncludedState.mjs";
import {LinkToOmittedState} from "./internal/LinkToOmittedState.mjs";

/**
 * A link to a resource that was returned by the server. The response may or may not include the resource's
 * state.
 */
abstract class Link
{
	/**
	 * Returns a link to a resource whose state is included by the enclosing document.
	 *
	 * @param resource - the resource to link to
	 * @returns a link to the resource
	 * @throws TypeError if `resource` is null
	 */
	static toResource(resource: Resource): LinkToIncludedState
	{
		return new LinkToIncludedState(resource);
	}

	/**
	 * Returns a link to a resource whose state is omitted by the enclosing document.
	 *
	 * @param uri - the URI of the resource
	 * @returns a link to the resource
	 * @throws TypeError if `uri` is null
	 */
	static toUri(uri: URL): LinkToOmittedState
	{
		return new LinkToOmittedState(uri);
	}

	/**
	 * @returns the URI of this resource
	 */
	abstract getUri(): URL | null;

	/**
	 * @returns the resource state, if it is present
	 */
	abstract getResource(): Resource | undefined;
}

export {Link};